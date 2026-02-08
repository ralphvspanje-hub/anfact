import { getSupabase } from './supabase';
import {
  getDailySearchCount,
  incrementDailySearchCount,
  MAX_SEARCHES_PER_DAY,
} from './storage';

// ──────────────────────────────────────────────
// Server-side daily search limit
// Uses Supabase RPC for atomic check-and-increment.
// Falls back to local AsyncStorage if Supabase is
// not configured (offline / dev without backend).
// ──────────────────────────────────────────────

interface SearchLimitResult {
  allowed: boolean;
  remaining: number;
  count: number;
}

/**
 * Check whether the user can perform a search today.
 * If allowed, the server-side counter is atomically incremented.
 *
 * Returns { allowed, remaining, count }.
 */
export async function checkAndIncrementSearch(
  userId: string,
): Promise<SearchLimitResult> {
  const supabase = getSupabase();

  // ── Try server-side first ──
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('check_and_increment_search', {
        p_user_id: userId,
        p_max_searches: MAX_SEARCHES_PER_DAY,
      });

      if (!error && data) {
        // Also sync local counter so the UI can show remaining
        // without an extra network call later.
        return data as SearchLimitResult;
      }

      // If the RPC fails (e.g. function not deployed yet),
      // fall through to local fallback.
      console.warn('Server-side search limit check failed, using local fallback:', error?.message);
    } catch (err) {
      console.warn('Server-side search limit check threw, using local fallback:', err);
    }
  }

  // ── Local fallback (AsyncStorage) ──
  const localCount = await getDailySearchCount();

  if (localCount >= MAX_SEARCHES_PER_DAY) {
    return { allowed: false, remaining: 0, count: localCount };
  }

  const newCount = await incrementDailySearchCount();
  return {
    allowed: true,
    remaining: MAX_SEARCHES_PER_DAY - newCount,
    count: newCount,
  };
}
