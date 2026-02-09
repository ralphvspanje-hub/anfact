# AnFact

**Stop Googling. Start Knowing.**

![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?logo=expo&logoColor=white)

---

## The Problem

You Google something, read the answer, and forget it within the hour. It's called the **Google Effect** — our brains outsource memory to search engines because retrieval is effortless. The result: we look things up over and over, never actually *learning* anything.

Research shows that low-effort retrieval kills encoding. If you don't work to recall something, it never sticks.

## The Solution

AnFact intercepts that moment of curiosity. Ask a question, get an AI-generated answer, and the app automatically creates atomic flashcards from it. Then FSRS — the same spaced repetition algorithm behind modern memory science — schedules reviews at the exact intervals needed for **90% long-term retention**.

You search once. You remember forever.

## Screenshots

<p align="center">
  <img src="screenshots/home.png" width="200" alt="Home Screen" />
  &nbsp;&nbsp;
  <img src="screenshots/search.png" width="200" alt="Search & Answer" />
  &nbsp;&nbsp;
  <img src="screenshots/review.png" width="200" alt="Spaced Repetition Review" />
  &nbsp;&nbsp;
  <img src="screenshots/library.png" width="200" alt="Fact Library" />
</p>

## Key Features

- **Search & Learn** — Ask any question, get a concise LLM-generated answer with key terms highlighted. One tap to save.
- **Atomic Flashcards** — Answers are automatically split into independent Q&A pairs following the Minimum Information Principle, each with its own SRS schedule.
- **Spaced Repetition Reviews** — FSRS algorithm schedules daily quizzes with 4-grade rating (Again / Hard / Good / Easy). 3D flip cards with smooth Reanimated animations.
- **On-Demand Mnemonics** — Generate a memory hook for any card via LLM, max 15 words.
- **Fact Library** — Browse, expand, and manage all saved facts and their atomic cards.
- **Global Leaderboard** — Compete on streak and review count. Medals for the top 3, humiliation for the rest.
- **Daily Limits** — 30 searches/day, server-side enforced via atomic PostgreSQL operations.
- **Anonymous Auth** — No sign-up friction. Just open the app and start learning.
- **212 Unique Phrases** — Sarcastic confirmations, witty empty states, and rotating example prompts keep the UX from feeling sterile.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router (file-based) |
| Animations | React Native Reanimated (3D flip cards, spring-animated buttons, slide transitions) |
| SRS Engine | ts-fsrs — Free Spaced Repetition Scheduler, targeting 90% retention |
| AI | Groq API (Llama 3.1 8B Instant), proxied via Supabase Edge Function |
| Auth & Backend | Supabase (anonymous auth, PostgreSQL, Edge Functions) |
| Local Storage | AsyncStorage (offline-first) |
| Fonts | Nunito + League Spartan via Expo Google Fonts |

## Architecture

**Offline-first.** All facts, review state, and FSRS card data live in AsyncStorage. Supabase handles auth, the leaderboard, and rate limiting — but the core learning loop works without a network connection.

**Privacy-conscious.** Anonymous auth means no email, no password, no sign-up form. The Groq API key never ships to the client — all LLM calls route through a Supabase Edge Function (Deno) that holds the secret server-side.

**Atomic by design.** When you save a fact, the LLM splits it into 1–5 independent flashcards. Each card carries its own FSRS state (stability, difficulty, due date), so the algorithm can schedule them independently based on how well you know each piece.

**Server-side enforcement.** Daily search limits use an atomic PostgreSQL upsert with row-level locking (`check_and_increment_search`), with a local AsyncStorage fallback for offline resilience.

```
User Question
     │
     ▼
┌──────────┐     ┌───────────────────┐     ┌──────────┐
│  Client   │────▶│  Supabase Edge Fn  │────▶│ Groq API │
│ (Expo)    │◀────│  (Deno, key vault) │◀────│ Llama 3.1│
└──────────┘     └───────────────────┘     └──────────┘
     │
     ▼
┌──────────────────────────────────┐
│  AsyncStorage (offline-first)    │
│  Facts, Atomic Cards, FSRS State │
└──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Supabase PostgreSQL (optional)  │
│  Leaderboard, Rate Limiting, Auth│
└──────────────────────────────────┘
```

## How It Works

**1. Search** — Type a question. The LLM returns a concise, highlighted answer in seconds.

**2. Learn** — Save the answer. The AI automatically generates atomic flashcards and optional mnemonics.

**3. Retain** — Come back daily. FSRS schedules reviews at optimal intervals, adapting to your performance on each card.

---

<p align="center">
  Solo project by <a href="https://www.linkedin.com/in/ralphvanspanje"><strong>Ralph van Spanje</strong></a>
</p>
