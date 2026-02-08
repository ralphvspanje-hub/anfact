import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabase';

// ──────────────────────────────────────────────
// Abstract auth interface — swap implementation
// (e.g. Google OAuth) without touching consumers
// ──────────────────────────────────────────────

export interface AuthUser {
  id: string;      // Supabase auth.uid()
  name: string;    // display name
}

export interface AuthService {
  /** Ensure an anonymous Supabase session exists (call once on launch) */
  ensureSession(): Promise<string | null>;
  /** Set / update display name and return the AuthUser */
  login(name: string): Promise<AuthUser>;
  getUserId(): Promise<string | null>;
  getUserName(): Promise<string | null>;
  isLoggedIn(): Promise<boolean>;
  hasCompletedOnboarding(): Promise<boolean>;
  markOnboardingComplete(): Promise<void>;
}

// ──────────────────────────────────────────────
// AsyncStorage keys (display name + onboarding)
// ──────────────────────────────────────────────

const USER_NAME_KEY = 'user_display_name';
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Get the currently authenticated Supabase user id, or null */
async function getSupabaseUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ──────────────────────────────────────────────
// Exported singleton implementing AuthService
// ──────────────────────────────────────────────

export const authService: AuthService = {
  /**
   * Ensure an anonymous Supabase session exists.
   * If the user already has a persisted session (from a previous launch),
   * this is a no-op.  Otherwise it calls signInAnonymously().
   * Returns the Supabase user id on success, or null.
   */
  async ensureSession(): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not configured — anonymous auth skipped.');
      return null;
    }

    // Check for an existing persisted session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    // No session — create an anonymous one
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous sign-in failed:', error.message);
      return null;
    }

    return data.session?.user?.id ?? null;
  },

  async login(name: string): Promise<AuthUser> {
    // Ensure we have a Supabase session
    let id = await getSupabaseUserId();
    if (!id) {
      id = await this.ensureSession();
    }
    if (!id) {
      throw new Error('Could not establish a Supabase session for login.');
    }

    // Persist display name locally
    await AsyncStorage.setItem(USER_NAME_KEY, name);

    return { id, name };
  },

  async getUserId(): Promise<string | null> {
    return getSupabaseUserId();
  },

  async getUserName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(USER_NAME_KEY);
    } catch {
      return null;
    }
  },

  async isLoggedIn(): Promise<boolean> {
    const [id, name] = await Promise.all([
      getSupabaseUserId(),
      AsyncStorage.getItem(USER_NAME_KEY),
    ]);
    return id !== null && name !== null;
  },

  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async markOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  },
};
