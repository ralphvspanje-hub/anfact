import { getSupabase } from './supabase';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  streak: number;
  retention: number;
  total_reviews: number;
  updated_at: string;
}

// ──────────────────────────────────────────────
// Submit score (upsert)
// ──────────────────────────────────────────────

export async function submitScore(
  userId: string,
  userName: string,
  streak: number,
  retention: number,
  totalReviews: number,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return; // Supabase not configured — silently skip

  const { error } = await supabase.from('leaderboard').upsert(
    {
      user_id: userId,
      user_name: userName,
      streak,
      retention,
      total_reviews: totalReviews,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('Failed to submit leaderboard score:', error.message);
  }
}

// ──────────────────────────────────────────────
// Fetch leaderboard (ranked)
// ──────────────────────────────────────────────

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return []; // Supabase not configured — return empty

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('streak', { ascending: false })
    .order('total_reviews', { ascending: false });

  if (error) {
    console.error('Failed to fetch leaderboard:', error.message);
    return [];
  }

  return (data as LeaderboardEntry[]) ?? [];
}
