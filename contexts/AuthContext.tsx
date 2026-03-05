import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { authService, AuthUser, RegisterResult } from '../services/auth';
import { syncFactsOnLogin } from '../services/storage';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AuthContextType {
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  /** Register with email + password */
  register: (email: string, password: string) => Promise<RegisterResult>;
  /** Log in with email + password — returns AuthUser (skips onboarding) */
  loginWithEmail: (email: string, password: string) => Promise<AuthUser>;
  /** Set display name (onboarding step after register) */
  login: (name: string) => Promise<void>;
  /** Sign out and reset all state */
  logout: () => Promise<void>;
  /** Permanently delete the user's account and reset state */
  deleteAccount: () => Promise<void>;
  /** Flag that the full popup sequence has been completed */
  markOnboardingComplete: () => Promise<void>;
  /** True when the user has a session but no display name yet */
  needsName: boolean;
  /** True while the initial load from Supabase / AsyncStorage is still running */
  loading: boolean;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  const needsName = userId !== null && userName === null;

  const hydrateAuthState = useCallback(async () => {
    try {
      const supabaseUserId = await authService.getSession();

      const [name, onboarded] = await Promise.all([
        authService.getUserName(),
        authService.hasCompletedOnboarding(),
      ]);

      setUserId(supabaseUserId);
      setUserName(name);
      setIsLoggedIn(supabaseUserId !== null && name !== null);
      setHasCompletedOnboarding(onboarded);
    } catch (err) {
      console.error('AuthProvider: failed to hydrate auth state', err);
    }
  }, []);

  // Hydrate auth state on mount — passive check only (no anonymous sign-in)
  useEffect(() => {
    (async () => {
      await hydrateAuthState();
      setLoading(false);
    })();
  }, [hydrateAuthState]);

  // Re-hydrate when Supabase emits SIGNED_IN (e.g. after deep-link code exchange)
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((event) => {
      if (event === 'SIGNED_IN') {
        // On web, after an email confirmation redirect (?code=...), the session
        // is established asynchronously. A clean reload is the most reliable way
        // to start fresh with the session already in place.
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search.includes('code=')) {
          window.location.replace(window.location.pathname);
        } else {
          hydrateAuthState();
        }
      }
    });
    return unsubscribe;
  }, [hydrateAuthState]);

  const register = useCallback(async (email: string, password: string): Promise<RegisterResult> => {
    const result = await authService.register(email, password);
    if (result.status === 'success') {
      setUserId(result.userId);
    }
    return result;
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const user = await authService.loginWithEmail(email, password);
    await syncFactsOnLogin(user.id);
    setUserId(user.id);
    setUserName(user.name || null);
    setIsLoggedIn(!!user.name);
    setHasCompletedOnboarding(!!user.name);
    return user;
  }, []);

  const login = useCallback(async (name: string) => {
    const user: AuthUser = await authService.login(name);
    await syncFactsOnLogin(user.id);
    setUserId(user.id);
    setUserName(user.name);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUserId(null);
    setUserName(null);
    setIsLoggedIn(false);
    setHasCompletedOnboarding(false);
  }, []);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    setUserId(null);
    setUserName(null);
    setIsLoggedIn(false);
    setHasCompletedOnboarding(false);
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    await authService.markOnboardingComplete();
    setHasCompletedOnboarding(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        isLoggedIn,
        hasCompletedOnboarding,
        needsName,
        register,
        loginWithEmail,
        login,
        logout,
        deleteAccount,
        markOnboardingComplete,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};
