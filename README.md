# AnFact

**Stop Googling. Start Knowing.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-anfact.app-6366F1?style=flat)](https://www.anfact.app)
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

## Demo

<p align="center">
  <video src="https://github.com/user-attachments/assets/18531e5a-6a36-4d95-9469-4cc15768c1ad" width="300" autoplay loop muted />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/17083c69-2d2a-4e08-8413-e916614170c3" width="800" />
</p>

**[→ Try it live at anfact.app](https://www.anfact.app)**

## Key Features

- **Search & Learn** — Ask any question, get a concise LLM-generated answer with key terms highlighted. One tap to save.
- **Atomic Flashcards** — Answers are automatically split into independent Q&A pairs following the Minimum Information Principle, each with its own SRS schedule.
- **Spaced Repetition Reviews** — FSRS algorithm schedules daily quizzes with 4-grade rating (Again / Hard / Good / Easy). 3D flip cards with smooth Reanimated 4 animations.
- **Study Ahead** — Finished your due cards? Keep going — the app surfaces upcoming cards so you can review ahead of schedule.
- **Live Retention Stat** — Real-time retrievability score computed from FSRS stability across all your cards, so you can actually see whether spaced repetition is working.
- **On-Demand Mnemonics** — Generate a memory hook for any card via LLM, max 15 words.
- **Fact Library** — Browse, expand, and manage all saved facts and their atomic cards.
- **Global Leaderboard** — Compete on streak, retention, and review count. Medals for the top 3.
- **Cloud Sync** — Register with email to sync your facts and review state across devices. Local-first with cloud-wins merge on login.
- **Dark / Light Theme** — Follows system preference by default, togglable in-app.
- **Keyboard Shortcuts** — Web-native hotkeys: Space/Enter to save, spacebar to flip cards, arrow keys to rate.
- **Daily Limits** — 100 searches/day, server-side enforced via atomic PostgreSQL operations, with local AsyncStorage fallback.
- **Anonymous-First Auth** — Start using the app immediately with no sign-up. Register with email after your first save to unlock sync and the leaderboard.
- **212 Unique Phrases** — Sarcastic confirmations, witty empty states, and rotating example prompts keep the UX from feeling sterile.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 (New Architecture enabled) |
| Language | TypeScript 5.9 |
| UI Library | React 19 |
| Navigation | Expo Router (file-based) |
| Animations | React Native Reanimated 4 (3D flip cards, spring-animated buttons, slide transitions) |
| SRS Engine | ts-fsrs — Free Spaced Repetition Scheduler, targeting 90% retention |
| AI | Groq API (Llama 3.1 8B Instant), proxied via Supabase Edge Function |
| Auth & Backend | Supabase (email auth + PKCE deep-link flow, PostgreSQL, Edge Functions) |
| Local Storage | AsyncStorage (offline-first) |
| Web Deployment | Vercel |
| Fonts | Nunito + League Spartan via Expo Google Fonts |

## Architecture

**Offline-first.** All facts, review state, and FSRS card data live in AsyncStorage. Supabase handles auth, the leaderboard, and rate limiting — but the core learning loop works without a network connection.

**Cross-platform.** The same codebase runs as a native iOS/Android app (Expo EAS) and a responsive web app at [anfact.app](https://www.anfact.app) (Vercel). Platform-specific layout branches handle the differences without separate codebases.

**Privacy-conscious.** Anonymous-first means no forced sign-up. The Groq API key never ships to the client — all LLM calls route through a Supabase Edge Function (Deno) that holds the secret server-side.

**Atomic by design.** When you save a fact, the LLM splits it into 1–5 independent flashcards. Each card carries its own FSRS state (stability, difficulty, due date), so the algorithm can schedule them independently based on how well you know each piece.

**Server-side enforcement.** Daily search limits use an atomic PostgreSQL upsert with row-level locking (`check_and_increment_search`), with a local AsyncStorage fallback for offline resilience.

**Cloud sync.** On login, local-only facts are uploaded and remote facts take priority (cloud-wins merge), so a user can start anonymously and carry their data into a registered account seamlessly.

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
│  Supabase PostgreSQL             │
│  Leaderboard, Rate Limiting,     │
│  Auth, Cloud Fact Sync           │
└──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│  Vercel (Web)  /  Expo EAS       │
│  anfact.app    /  iOS & Android  │
└──────────────────────────────────┘
```

## How It Works

**1. Search** — Type a question. The LLM returns a concise, highlighted answer in seconds.

**2. Learn** — Save the answer. The AI automatically generates atomic flashcards and optional mnemonics.

**3. Retain** — Come back daily. FSRS schedules reviews at optimal intervals, adapting to your performance on each card.

---

## AI-Native Codebase

This project was built with AI as a process, not a shortcut. Before committing to any feature, the idea goes through a Claude project set up as a virtual CTO — it pokes holes and pushes back until the idea actually holds up. Once it clears that, every feature follows the same path: create an issue in Linear, explore the codebase, generate a plan, then execute in Cursor. The CLAUDE.md files exist to give agents enough context to hit it in one pass.

The codebase itself is designed to be navigated by AI coding agents with zero warm-up time.

Every major directory contains a `CLAUDE.md` file that gives an agent immediate, accurate context about what lives there, what the conventions are, and what to avoid — without having to read every file first.

```
anfact/
├── CLAUDE.md              ← start here
├── services/CLAUDE.md
├── components/CLAUDE.md
├── contexts/CLAUDE.md
├── hooks/CLAUDE.md
├── app/CLAUDE.md
├── types/CLAUDE.md
├── theme/CLAUDE.md
└── constants/CLAUDE.md
```

**Self-improving loop.** Agents are instructed to log any confusion, outdated description, or missing gotcha to `AGENT_LOG.md`, and to immediately update the relevant `CLAUDE.md` if they resolved it. The context system gets more accurate with every coding session.

---

<p align="center">
  Solo project by <a href="https://www.linkedin.com/in/ralphvanspanje"><strong>Ralph van Spanje</strong></a>
</p>
