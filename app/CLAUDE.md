# app/ — Agent Context

Expo Router file-based routing. Each file = a route. Folder structure = URL structure.

## Route Map

```
app/
├── _layout.tsx          # Root layout — wraps everything in ThemeProvider + AuthProvider
├── +html.tsx            # Web-only HTML shell (meta tags, etc.)
├── (tabs)/              # Tab navigator (main app)
│   ├── _layout.tsx      # Tab bar config
│   ├── index.tsx        # Search tab (home)
│   ├── library.tsx      # Saved facts list
│   └── recall.tsx       # Spaced repetition review screen
├── leaderboard.tsx      # Full-screen leaderboard (pushed as a card)
├── privacy.tsx          # Privacy policy (pushed as a card)
└── terms.tsx            # Terms of service (pushed as a card)
```

## `_layout.tsx` (Root Layout)

This is the most important file in `app/`. It:
1. Loads fonts (Nunito + LeagueSpartan) — app renders nothing until fonts are ready or errored
2. Hides the splash screen once fonts load
3. Wraps everything: `ThemeProvider` → `AuthProvider` → `StackNavigator`
4. Contains `LeaderboardScoreSubmitter` — an invisible component that submits the user's score on launch (fires once after auth hydration)
5. Contains `DeepLinkHandler` — handles `anfact://` deep links for PKCE email confirmation (both cold-start and foreground)
6. Injects a CSS rule on web to remove the focus outline

### Stack screens configured here
- `(tabs)` — the main tab navigator, `headerShown: false`
- `leaderboard` — pushed with `presentation: 'card'`, styled header
- `privacy` — pushed with `presentation: 'card'`, styled header
- `terms` — pushed with `presentation: 'card'`, styled header

Header styles use `theme.colors.background` + `theme.colors.text` + `fontFamily: 'Nunito-Bold'` (the string, not the object).

## Adding a new screen

1. Create the file in `app/` (e.g. `app/settings.tsx`)
2. Register it in the `<Stack>` in `_layout.tsx` with appropriate options
3. Navigate to it with `router.push('/settings')` from Expo Router

## Navigation

Use Expo Router's `useRouter()` for programmatic navigation or `<Link>` for declarative.
Do not use React Navigation directly — Expo Router wraps it.

## Tabs

The tab bar and tab screens live in `app/(tabs)/`. To add a tab:
1. Add a screen file inside `app/(tabs)/`
2. Configure it in `app/(tabs)/_layout.tsx`
