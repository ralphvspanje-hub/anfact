import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let _client: SupabaseClient | null = null;

/**
 * Lazily initialise and return the Supabase client.
 * Returns `null` when the required env vars are missing or invalid,
 * so callers can gracefully skip Supabase operations.
 *
 * The client is configured to persist the auth session in AsyncStorage
 * so that anonymous-auth tokens survive app restarts.
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith('http')) {
    console.warn(
      'Supabase credentials missing or invalid. Leaderboard features disabled. ' +
        'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    );
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // not applicable in React Native
      },
    });
    return _client;
  } catch (err) {
    console.warn('Failed to create Supabase client:', err);
    return null;
  }
}
