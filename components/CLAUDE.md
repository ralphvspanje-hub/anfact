# components/ — Agent Context

Reusable UI components. No business logic, no direct service calls — receive data and callbacks via props.

## Styling Rules

- Always use `const { theme } = useTheme()` and reference `theme.colors.X` — never hardcode color values
- Use `typography.sizes.X` and `typography.fontFamily.X` from the theme for text
- Use `spacing.X` and `layout.borderRadius.X` for layout values
- Import from `'../theme'` (barrel export)
- `scaleForWeb(n)` utility is available from theme for line-height values that need web scaling

## Components

### `FactCard.tsx`
Displays a saved fact in the library. Shows question + date. Handles two modes:
- **Legacy fact** (no `atomicCards`): shows `answer` text and optional `mnemonic` directly
- **Atomic fact**: shows a collapsible list of `AtomicCard` items with front/back/mnemonic

Props: `fact`, `onDelete`, `onDeleteAtomicCard?`

Uses `LayoutAnimation` for expand/collapse — do not replace with `Animated` unless you handle Android separately.

### `FlipCard.tsx`
The review card component. Flip animation between front (question) and back (answer).
Used in the recall/review screen.

### `AnswerCard.tsx`
Displays the answer side of a card during review, with rating buttons (Again / Good / Easy or similar).

### `AtomicCardsSheet.tsx`
Bottom sheet that shows generated atomic cards before the user confirms saving them.

### `EmailAuthModal.tsx`
Modal for email + password login and registration. Handles both login and register flows with the same component (mode-switched).

### `NameEntryModal.tsx`
Modal shown after registration to collect the user's display name. Calls `login(name)` from `AuthContext` (the onboarding step, not actual login).

### `HeaderBar.tsx`
Top bar with app title and optional right-side actions (settings, theme toggle).

### `SettingsMenu.tsx`
Dropdown/sheet with logout, delete account, links to privacy/terms.

### `SearchInput.tsx`
Controlled text input for the search tab. Handles submit on enter key (web) and button press.

### `Container.tsx`
Wrapper that applies `SafeAreaView` + standard horizontal padding. Use this as the root wrapper for all screens.

### `EmptyState.tsx`
Generic empty state with title + message. Accepts props for both.

### `ErrorBoundary.tsx`
Class component error boundary. Wraps the whole app in `_layout.tsx`. Do not remove.

### `ThemeToggle.tsx`
Button to cycle light/dark/system theme. Uses `setThemeMode()` from `useTheme()`.

### `AnimatedPressable.tsx`
Pressable with a subtle scale animation on press. Use instead of bare `TouchableOpacity` for interactive cards.

### `JokeModal.tsx`
Small modal for showing a humorous message (used after certain actions). Tied to `constants/phrases.ts`.

### `MarkdownText.tsx`
Renders text with `**bold**` markdown into styled `<Text>` spans. Used for LLM answer display. Does not support full markdown — only bold.
