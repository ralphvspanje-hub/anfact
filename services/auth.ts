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

export type RegisterResult =
  | { status: 'success'; userId: string }
  | { status: 'pending_confirmation' };

export interface AuthService {
  /** Passive session check — returns userId if a real session exists, null otherwise */
  getSession(): Promise<string | null>;
  /** Register a new account with email + password */
  register(email: string, password: string): Promise<RegisterResult>;
  /** Log in with email + password, fetch username from leaderboard, cache locally */
  loginWithEmail(email: string, password: string): Promise<AuthUser>;
  /** Set display name for the current user (used during onboarding after register) */
  login(name: string): Promise<AuthUser>;
  /** Sign out and clear local caches */
  logout(): Promise<void>;
  getUserId(): Promise<string | null>;
  getUserName(): Promise<string | null>;
  isLoggedIn(): Promise<boolean>;
  hasCompletedOnboarding(): Promise<boolean>;
  markOnboardingComplete(): Promise<void>;
  isPendingEmailConfirmation(): Promise<boolean>;
  /** Delete the current user's account via Postgres RPC and clear local data */
  deleteAccount(): Promise<void>;
  /** Send a password-reset email */
  resetPassword(email: string): Promise<void>;
  subscribeToAuthChanges(callback: (event: string) => void): () => void;
  /** Exchange a deep-link auth code for a session (PKCE flow) */
  handleDeepLink(url: string): Promise<void>;
  /** Remove the pending-confirmation flag so the user can retry registration */
  clearPendingConfirmation(): Promise<void>;
}

// ──────────────────────────────────────────────
// AsyncStorage keys (display name + onboarding)
// ──────────────────────────────────────────────

const USER_NAME_KEY = 'user_display_name';
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
const PENDING_CONFIRMATION_KEY = 'pending_email_confirmation';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

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
  async getSession(): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Only count real (non-anonymous) sessions
    if (session.user.is_anonymous) return null;

    return session.user.id;
  },

  async register(email: string, password: string): Promise<RegisterResult> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;

    if (!data.session?.user?.id) {
      await AsyncStorage.setItem(PENDING_CONFIRMATION_KEY, 'true');
      return { status: 'pending_confirmation' };
    }

    return { status: 'success', userId: data.session.user.id };
  },

  async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    const userId = data.session?.user?.id;
    if (!userId) throw new Error('Login failed — no session returned.');

    // Fetch username from leaderboard table
    const { data: row } = await supabase
      .from('leaderboard')
      .select('user_name')
      .eq('user_id', userId)
      .single();

    const userName = row?.user_name ?? null;

    if (userName) {
      await AsyncStorage.setItem(USER_NAME_KEY, userName);
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    }

    return { id: userId, name: userName ?? '' };
  },

  async login(name: string): Promise<AuthUser> {
    const id = await getSupabaseUserId();
    if (!id) throw new Error('Could not establish a Supabase session for login.');

    await AsyncStorage.setItem(USER_NAME_KEY, name);

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('leaderboard').upsert(
        {
          user_id: id,
          user_name: name,
          streak: 0,
          retention: 0,
          total_reviews: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error && error.code !== '23505') {
        console.error('Failed to upsert leaderboard on login:', error.message);
      }
    }

    return { id, name };
  },

  async logout(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.multiRemove([USER_NAME_KEY, ONBOARDING_COMPLETE_KEY, PENDING_CONFIRMATION_KEY]);
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
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.is_anonymous) return false;

    const name = await AsyncStorage.getItem(USER_NAME_KEY);
    return name !== null;
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
    await AsyncStorage.removeItem(PENDING_CONFIRMATION_KEY);
  },

  async isPendingEmailConfirmation(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(PENDING_CONFIRMATION_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async deleteAccount(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;

    await AsyncStorage.multiRemove([USER_NAME_KEY, ONBOARDING_COMPLETE_KEY, PENDING_CONFIRMATION_KEY]);
  },

  async resetPassword(email: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  subscribeToAuthChanges(callback: (event: string) => void): () => void {
    const supabase = getSupabase();
    if (!supabase) return () => {};

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string) => callback(event),
    );
    return () => subscription.unsubscribe();
  },

  async handleDeepLink(url: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get('code');
    if (!code) throw new Error('No auth code found in deep link URL');

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  },

  async clearPendingConfirmation(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_CONFIRMATION_KEY);
  },
};
