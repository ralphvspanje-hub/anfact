-- ============================================
-- AnFact Leaderboard — Supabase Table Setup
-- Run this SQL in the Supabase Dashboard SQL Editor
-- ============================================

-- 1. Create the leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id       TEXT PRIMARY KEY,
  user_name     TEXT NOT NULL,
  streak        INTEGER NOT NULL DEFAULT 0,
  retention     REAL NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enforce unique usernames
ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_user_name_unique UNIQUE (user_name);

-- 3. Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 3. Policy: anyone can read the leaderboard
CREATE POLICY "Public read access"
  ON leaderboard
  FOR SELECT
  USING (true);

-- 4. Policy: only the owning user can insert their own row
CREATE POLICY "Owner insert access"
  ON leaderboard
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 5. Policy: only the owning user can update their own row
CREATE POLICY "Owner update access"
  ON leaderboard
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- Daily Search Rate Limiting (server-side)
-- Prevents bypassing limits by clearing local storage
-- ============================================

-- 6. Create the daily_searches table
CREATE TABLE IF NOT EXISTS daily_searches (
  user_id      TEXT NOT NULL,
  search_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, search_date)
);

-- 7. Enable Row Level Security
ALTER TABLE daily_searches ENABLE ROW LEVEL SECURITY;

-- 8. Policy: users can read their own search counts
CREATE POLICY "Owner read daily_searches"
  ON daily_searches
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- 9. Policy: users can insert their own search rows
CREATE POLICY "Owner insert daily_searches"
  ON daily_searches
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- 10. Policy: users can update their own search rows
CREATE POLICY "Owner update daily_searches"
  ON daily_searches
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 11. Policy: users can delete their own search rows (cascade on account deletion)
CREATE POLICY "Owner delete daily_searches"
  ON daily_searches
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- 12. Atomic check-and-increment function
--     Returns { "allowed": true/false, "remaining": N, "count": N }
--     SECURITY DEFINER so RLS does not block the internal upsert.
CREATE OR REPLACE FUNCTION check_and_increment_search(
  p_user_id      TEXT,
  p_max_searches INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Upsert: ensure row exists for today
  INSERT INTO daily_searches (user_id, search_date, count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, search_date) DO NOTHING;

  -- Lock the row and get current count
  SELECT count INTO current_count
  FROM daily_searches
  WHERE user_id = p_user_id AND search_date = CURRENT_DATE
  FOR UPDATE;

  -- Check limit
  IF current_count >= p_max_searches THEN
    RETURN json_build_object('allowed', false, 'remaining', 0, 'count', current_count);
  END IF;

  -- Increment
  UPDATE daily_searches
  SET count = count + 1
  WHERE user_id = p_user_id AND search_date = CURRENT_DATE;

  RETURN json_build_object(
    'allowed', true,
    'remaining', p_max_searches - current_count - 1,
    'count', current_count + 1
  );
END;
$$;

-- ============================================
-- Cloud Sync for Fact Library
-- Persists facts to Supabase for logged-in users
-- ============================================

-- 13. Create the facts table
CREATE TABLE IF NOT EXISTS facts (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  mnemonic      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  card          JSONB,
  atomic_cards  JSONB
);

CREATE INDEX IF NOT EXISTS facts_user_id_idx ON facts (user_id);

-- 14. Enable Row Level Security
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;

-- 15. Policy: owner can read their own facts
CREATE POLICY "Owner select facts"
  ON facts
  FOR SELECT
  USING (auth.uid() = user_id);

-- 16. Policy: owner can insert their own facts
CREATE POLICY "Owner insert facts"
  ON facts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 17. Policy: owner can update their own facts
CREATE POLICY "Owner update facts"
  ON facts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 18. Policy: owner can delete their own facts
CREATE POLICY "Owner delete facts"
  ON facts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Account Deletion
-- Deletes the calling user's auth.users row.
-- Related rows in daily_searches and facts are
-- cleaned up by ON DELETE CASCADE; leaderboard
-- row is intentionally kept.
-- ============================================

-- 19. delete_user() — callable via supabase.rpc('delete_user')
CREATE OR REPLACE FUNCTION delete_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM daily_searches WHERE user_id = auth.uid()::text;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
