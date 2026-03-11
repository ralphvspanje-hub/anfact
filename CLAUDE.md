# AnFact — Agent Context

## What this app is

AnFact is a spaced-repetition fact-learning app. Users ask questions, get LLM answers, save them as flashcards, and review them using the FSRS algorithm. It runs on iOS, Android, and Web via React Native + Expo.

## Tech Stack

- **Framework**: React Native 0.81 + Expo 54 + Expo Router 6 (file-based routing)
- **Language**: TypeScript (strict)
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **SRS algorithm**: `ts-fsrs` library, 90% retention target
- **LLM**: Groq (routed through Supabase Edge Function `llm-proxy` — API key never in client)
- **Storage**: AsyncStorage (local, primary) + Supabase (cloud sync, optional/best-effort)
- **Fonts**: Nunito (regular/bold/extrabold) + LeagueSpartan (bold) via Expo Google Fonts

## Project Structure

```
anfact/
├── app/              # Expo Router screens (file = route)
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth)
├── hooks/            # Custom React hooks
├── services/         # All side-effects: API, storage, auth, SRS
├── theme/            # Colors, typography, spacing, ThemeContext
├── types/            # Shared TypeScript types (fact.ts)
├── constants/        # Static data: phrases, prompts
└── supabase/         # Edge functions and DB migrations
```

Each folder has its own `CLAUDE.md`. Read it when working in that folder.

## Core Data Model (read this carefully)

Defined in `types/fact.ts`:

- **`Fact`** — the top-level saved item. Has `question`, `answer`, `card` (FSRS), and optionally `atomicCards[]`
- **`AtomicCard`** — a single Q&A flashcard derived from a Fact via the LLM. Has its own `card` (FSRS state)
- **`ReviewItem`** — union for the review screen: either a legacy Fact or an AtomicCard within a Fact
- **`ReviewLog`** — one entry per review action, stored locally for streak/stats

**Critical**: New facts always have `atomicCards`. Old facts (before the atomic feature) have only the top-level `card`. Code must handle both. Check `isLegacy` on `ReviewItem` or check `fact.atomicCards?.length > 0`.

## Key Architectural Rules

### Supabase is optional
`getSupabase()` in `services/supabase.ts` returns `null` if env vars are missing. **Every caller must null-check.** The app works fully offline without Supabase — just no leaderboard or cloud sync.

### Cloud sync is best-effort
After local writes, cloud upserts fire-and-forget (no `await`, errors are `console.warn`). Never block the user on cloud sync.

### Auth state has two parts
A user is "logged in" only if they have BOTH a Supabase session AND a display name in AsyncStorage. `isLoggedIn` in `AuthContext` reflects this. `login(name)` is the onboarding step that sets the display name — it is NOT the email login. `loginWithEmail(email, password)` is the actual credential login.

### FSRS dates must be hydrated
FSRS `Card` objects serialized to JSON store `due` and `last_review` as ISO strings. They MUST be converted back to `Date` objects via `hydrateCard()` in `services/storage.ts` before being passed to the `ts-fsrs` scheduler. Never pass raw JSON card objects to `scheduler.next()`.

### LLM calls go through Edge Function only
Never call Groq directly from the client. All LLM calls go through `chatCompletion()` in `services/llm.ts`, which calls the Supabase Edge Function `llm-proxy`.

## Running the App

```bash
cd anfact
yarn start          # Expo dev server
yarn web            # Web only
yarn ios / android  # Native
```

Env vars needed: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

## Common Gotchas

- `useActionKey` in `hooks/useActionKey.ts` is **deprecated** — use `useFlipKey` + `useRateGoodKey` instead
- Leaderboard upserts on `user_id` conflict. A `23505` error on `user_name` is silently ignored (another user has the same display name — non-fatal)
- Deep link scheme is `anfact://` — used for PKCE email confirmation flow
- Daily search limit: 100/day. Checked server-side first (RPC `check_and_increment_search`), falls back to AsyncStorage
- `MAX_SEARCHES_PER_DAY` and `MAX_FACTS_STORED` constants live in `services/storage.ts`
- StyleSheet styles always use `theme.colors.X` — never hardcode colors except in `theme/colors.ts`
- The leaderboard ranking is by `streak` DESC, then `total_reviews` DESC

---

## Self-Improving Loop — READ THIS

This context system is designed to get better over time. **You are expected to maintain it.**

### When to log
Log to `AGENT_LOG.md` whenever you encounter any of:
- Something in a CLAUDE.md file that was wrong, outdated, or missing
- Code that behaved unexpectedly or differently than described here
- A pattern or gotcha that tripped you up and should be documented
- An ambiguity that slowed you down

### How to log

Open `AGENT_LOG.md` and append an entry:

```markdown
## YYYY-MM-DD — [short title]
**What was confusing / wrong:** [describe it]
**File/folder affected:** [path]
**What I did:** [how you resolved it]
**Suggested fix:** [what should change in CLAUDE.md or the code]
**Status:** [Fixed / Needs human review]
```

### When to fix immediately (Option B)

If you figured out the correct answer, **update the relevant CLAUDE.md right now** — don't just log it. Fix the description, add the missing gotcha, or correct the wrong claim. Then mark the log entry `Status: Fixed`.

If you're unsure of the correct answer, mark it `Status: Needs human review` and leave it for the human to resolve.

This is how the system improves. Do not skip this step.
