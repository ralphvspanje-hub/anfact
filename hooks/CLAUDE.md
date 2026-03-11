# hooks/ — Agent Context

Custom React hooks. Currently all in `useActionKey.ts` (the filename is misleading — it exports three hooks).

## `useActionKey.ts`

### `useFlipKey(action, enabled)` ✅ Use this
Fires `action` when the user presses `Space` or `Enter` on web.
Used to flip the review card. Guards against input elements being focused.

### `useRateGoodKey(action, enabled)` ✅ Use this
Fires `action` when the user presses `ArrowRight` on web.
Used to rate the current card as "Good" without clicking.

### `useActionKey(action, enabled)` ⚠️ Deprecated
Maps `Space`, `Enter`, and `ArrowRight` all to the same action.
Do not use in new code. Kept only for backward compatibility with older screen code.

## Shared behavior (all three hooks)
- Web only — no-ops on iOS/Android (`Platform.OS !== 'web'` guard)
- Skip firing if an `<input>`, `<textarea>`, `<select>`, or `contenteditable` is focused
- `enabled` flag lets the screen conditionally deactivate the shortcut (e.g. when a modal is open)
- Clean up event listener on unmount or when deps change

## Adding new hooks
Create a new file per hook (e.g. `hooks/useDebounce.ts`). Do not add to `useActionKey.ts` — that file name is already confusing enough.
