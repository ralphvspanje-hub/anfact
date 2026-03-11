# theme/ — Agent Context

Design system: colors, typography, spacing, and the ThemeContext. Everything exports through `theme/index.ts`.

## Files

### `colors.ts`
Defines the color palette and light/dark themes.

**Palette**: Sage green (`sage`) + neutral slate (`neutral`) + semantic colors (`success`, `error`, `warning`, `info`).

**Themes**: `lightTheme` and `darkTheme`. Both have the same shape (`Theme` type). Always use the semantic token names, never palette values directly in components.

Key color tokens:
- `background` — page/screen background
- `surface` — card/panel background (slightly off from background)
- `surfaceHighlight` — highlighted surface (e.g. current user's leaderboard row)
- `text` / `textSecondary` / `textInverse`
- `primary` — main action color (sage green `#38a375`)
- `primaryForeground` — text on primary background
- `secondary` / `secondaryForeground`
- `border`
- `success` / `error` / `warning` / `info`
- `overlay` — for modals/overlays

### `ThemeContext.tsx`
Provides `theme`, `isDark`, `toggleTheme()`, `setThemeMode(mode)`.

Modes: `'light'` | `'dark'` | `'system'` (default). System follows device color scheme.

Usage in components:
```tsx
const { theme, isDark } = useTheme();
// then: theme.colors.primary, theme.colors.text, etc.
```

`useTheme()` throws if called outside `<ThemeProvider>`.

### `typography.ts`
Font families (as string keys matching loaded font names) and size scale.

Font family strings:
- `typography.fontFamily.regular` → `'Nunito-Regular'`
- `typography.fontFamily.bold` → `'Nunito-Bold'`
- `typography.fontFamily.extraBold` → `'Nunito-ExtraBold'`
- `typography.fontFamily.display` → `'LeagueSpartan-Bold'`

Size scale: `xs`, `sm`, `md`, `lg`, `xl`, `xxl` (numeric px values).

**Important**: Always use `fontFamily: typography.fontFamily.bold` — never `fontWeight: 'bold'`. Custom fonts require the `fontFamily` string to render correctly.

### `spacing.ts`
Spacing scale: `xs`, `sm`, `md`, `lg`, `xl`, `xxl` (numeric px values).
Also exports `layout.borderRadius.sm/md/lg` and `scaleForWeb(n)` for line heights.

### `index.ts`
Barrel export — import everything from `'../theme'`:
```ts
import { useTheme, typography, spacing, layout, scaleForWeb } from '../theme';
```

## How to add a new color

1. Add to `palette` in `colors.ts` if it's a new raw color
2. Add the semantic token to both `lightTheme` and `darkTheme` with appropriate values
3. The `Theme` type is inferred — TypeScript will pick up the new token automatically
