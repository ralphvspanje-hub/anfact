import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, AuthUser } from '../services/auth';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AuthContextType {
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  /** Persist a display-name and associate with the Supabase anonymous user */
  login: (name: string) => Promise<void>;
  /** Flag that the full popup sequence has been completed */
  markOnboardingComplete: () => Promise<void>;
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

  // Hydrate auth state on mount:
  // 1. Ensure an anonymous Supabase session exists (or is resumed)
  // 2. Read the locally-persisted display name & onboarding flag
  useEffect(() => {
    (async () => {
      try {
        // Ensure anonymous session — will resume existing or create new
        const supabaseUserId = await authService.ensureSession();

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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (name: string) => {
    const user: AuthUser = await authService.login(name);
    setUserId(user.id);
    setUserName(user.name);
    setIsLoggedIn(true);
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
        login,
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
