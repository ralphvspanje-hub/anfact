# services/ — Agent Context

All side-effects live here: storage, auth, LLM, SRS logic, leaderboard, rate-limiting.
No UI code. No React. Pure async TypeScript.

## Files

### `supabase.ts`
Single lazy-init Supabase client. Exports `getSupabase(): SupabaseClient | null`.
- Returns `null` if `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing/invalid
- Session persisted in AsyncStorage so auth tokens survive app restarts
- `detectSessionInUrl` is `true` on web only (handles PKCE redirect), `false` on native
- **Every other service imports from here. Always null-check the result.**

### `auth.ts`
Implements the `AuthService` interface. Exported singleton: `authService`.

Key method distinctions (commonly confused):
- `login(name)` — onboarding step. Sets display name in AsyncStorage and upserts the leaderboard row. Does NOT do email auth.
- `loginWithEmail(email, password)` — actual credential login via Supabase. Fetches display name from the leaderboard table and caches it in AsyncStorage.
- `register(email, password)` — creates account. If email confirmation is required, returns `{ status: 'pending_confirmation' }` and sets a flag in AsyncStorage.
- `getSession()` — passive check. Returns `userId` only for real (non-anonymous) sessions.
- `isLoggedIn()` — requires BOTH a Supabase session AND a display name in AsyncStorage.
- `deleteAccount()` — calls Postgres RPC `delete_user` (server-side deletion), then clears AsyncStorage.
- `handleDeepLink(url)` — exchanges PKCE `?code=` param for a Supabase session. Called from `app/_layout.tsx`.

AsyncStorage keys (do not change without migrating existing data):
- `user_display_name`
- `onboarding_complete`
- `pending_email_confirmation`

### `storage.ts`
Local AsyncStorage persistence for facts, review logs, and daily search counter.
Also handles cloud sync (best-effort, fire-and-forget).

Constants (used elsewhere — don't duplicate):
- `MAX_SEARCHES_PER_DAY = 100`
- `MAX_FACTS_STORED = 100`

AsyncStorage keys:
- `facts` — JSON array of `Fact[]`
- `review_logs` — JSON array of `ReviewLog[]`
- `daily_searches` — `{ date: "YYYY-MM-DD", count: number }`

**Critical — date hydration**: Facts and cards are serialized as JSON. When reading back, `hydrateFact()` and `hydrateCard()` must be called to convert `due`/`last_review`/`createdAt` strings back into `Date` objects. This is done internally in all read functions — do not call raw `JSON.parse` on facts outside this file.

Cloud sync pattern: after every local write, call `upsertFactToCloud(fact, userId)` or `deleteFactFromCloud(factId)` — but do NOT `await` them. They are best-effort.

`syncFactsOnLogin(userId)`: cloud-wins merge. Remote facts take priority on ID conflict. Local-only facts are uploaded.

`getStreak()`: counts consecutive days (from today or yesterday backwards) that have at least one review log entry.

`getDailySearchCount()` / `incrementDailySearchCount()`: local fallback for rate-limiting. The server-side path is in `limits.ts`.

### `srs.ts`
FSRS scheduling logic. Wraps the `ts-fsrs` library.

Scheduler initialized with `request_retention: 0.9` (90% target).

Two parallel APIs — prefer the `ReviewItem`-based ones for new code:
- **Legacy** (`getDueCards`, `getStudyAheadCards`): operate on `Fact[]`, ignore atomic cards
- **Current** (`getDueReviewItems`, `getStudyAheadReviewItems`): flatten facts into `ReviewItem[]`, each atomic card becomes its own reviewable unit

Review flow:
1. Call `getDueReviewItems(facts)` to get what's due
2. User rates: `reviewCardState(card, rating)` returns `{ card, log }`
3. Update the `Fact` in storage via `updateFact()` in `storage.ts`

Stats:
- `getRetention(facts)`: average retrievability across all cards with `stability > 0`, as a percentage (0–100)
- `getNextReviewTime(facts)`: earliest `due` date across all cards

`Rating` is re-exported from `ts-fsrs` for convenience — import it from here, not directly from `ts-fsrs`.

### `llm.ts`
Three public functions:
- `askLLM(question)` — returns answer-first text (`answer\n\ncontext`). Uses JSON-mode internally.
- `generateAtomicCards(userInput, llmAnswer)` — returns `{ front, back }[]`, 1–5 cards. Falls back to `[{ front: userInput, back: llmAnswer }]` on failure.
- `generateMnemonic(question, answer)` — returns a short memory hook string, or `''` on failure.

All route through `chatCompletion()` → Supabase Edge Function `llm-proxy` → Groq.
**Never add direct Groq API calls here.** The API key must stay server-side.

### `leaderboard.ts`
Two functions:
- `submitScore(userId, userName, streak, retention, totalReviews)` — upserts to the `leaderboard` table on `user_id` conflict. Ignores `23505` (duplicate `user_name`) silently.
- `fetchLeaderboard()` — returns all entries ordered by `streak DESC`, then `total_reviews DESC`.

Called from `app/_layout.tsx` on every app launch (after auth hydration).

### `limits.ts`
`checkAndIncrementSearch(userId)`: tries server-side RPC `check_and_increment_search` first. Falls back to local AsyncStorage if the RPC fails or Supabase is unavailable. Returns `{ allowed, remaining, count }`.
