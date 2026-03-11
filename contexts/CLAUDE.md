# contexts/ — Agent Context

React Contexts for app-wide state. Currently one context: `AuthContext`.

## `AuthContext.tsx`

Provides auth state and actions to the entire app. Wraps children in `AuthProvider`.

### Consume via hook
```tsx
const { userId, userName, isLoggedIn, login, logout, ... } = useAuth();
```
`useAuth()` throws if called outside `<AuthProvider>`.

### State fields

| Field | Type | Meaning |
|---|---|---|
| `userId` | `string \| null` | Supabase `auth.uid()`. Non-null = has a Supabase session |
| `userName` | `string \| null` | Display name from AsyncStorage. Non-null = has completed name entry |
| `isLoggedIn` | `boolean` | `userId !== null && userName !== null` |
| `hasCompletedOnboarding` | `boolean` | User has seen all onboarding modals |
| `needsName` | `boolean` | Has session but no display name yet (show `NameEntryModal`) |
| `loading` | `boolean` | Initial hydration from Supabase + AsyncStorage is in progress |

### Actions

| Method | What it does |
|---|---|
| `register(email, password)` | Creates Supabase account. Returns `RegisterResult` — check `status === 'pending_confirmation'` |
| `loginWithEmail(email, password)` | Credential login. Also syncs facts from cloud. Sets all state. |
| `login(name)` | Onboarding: sets display name, upserts leaderboard, syncs facts. Call AFTER register succeeds. |
| `logout()` | Signs out Supabase, clears all local state |
| `deleteAccount()` | Deletes Supabase account + local state |
| `markOnboardingComplete()` | Sets `hasCompletedOnboarding = true` in state + AsyncStorage |

### Auth flow for new users
1. `register(email, password)` → if `pending_confirmation`, show "check your email" screen
2. User clicks email link → deep link `anfact://` → `handleDeepLink` in `_layout.tsx` exchanges code for session
3. `SIGNED_IN` event fires → `hydrateAuthState()` runs → `needsName` becomes `true`
4. Show `NameEntryModal` → user submits → `login(name)` → `isLoggedIn` becomes `true`
5. `markOnboardingComplete()` → hide onboarding modals

### Auth flow for existing users
1. `loginWithEmail(email, password)` → if user has a display name, `isLoggedIn` becomes `true` immediately
2. If display name was not found (edge case), `needsName` becomes `true` → show `NameEntryModal`

### Important
- `hydrateAuthState()` is called on mount and on `SIGNED_IN` events
- On web, after a `?code=` deep link, the app does a hard reload (`window.location.replace`) to get a clean session state — this is intentional
- `syncFactsOnLogin` is called during both `loginWithEmail` and `login` to merge local + cloud facts
