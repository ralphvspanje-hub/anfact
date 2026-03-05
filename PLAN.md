# ACT-41: Fix White Screen — Android Preview Build + iOS Expo Go

**Overall Progress:** `0%`

## TLDR
App shows white screen when opened via Expo Go after pushing an EAS Update.
Root cause: missing `expo-updates` dependency and `runtimeVersion` config.

**Distribution strategy:**
- **Android friends** — EAS Build (free APK) with OTA updates
- **iOS friends** — Expo Go with `--tunnel` (free, needs dev server running)

## Already Done
- `@expo/ngrok` installed (for iOS Expo Go tunnel)
- `eas.json` created (auto-generated with preview profile)
- Git repo initialized inside `anfact/`

## Critical Decisions
- **Android-only for builds**: iOS builds require $99/year Apple Developer account — skipping for now
- **Fingerprint runtimeVersion**: Auto-computes compatibility hash from native deps (Expo recommended)
- **Free tier EAS**: Using Expo's free build servers

## Tasks

- [ ] **Step 1: Install `expo-updates`**
  - Run: `npx expo install expo-updates`

- [ ] **Step 2: Update `app.json`**
  - Add `runtimeVersion: { policy: "fingerprint" }` to `expo` object
  - Add `updates: { url: "https://u.expo.dev/56793a1a-f942-4cd9-8edd-540b6d20517a" }` to `expo` object
  - Add `"expo-updates"` to the `plugins` array

- [ ] **Step 3: Git commit**
  - `git add -A && git commit -m "configure expo-updates for Android preview builds"`

- [ ] **Step 4: Build Android APK**
  - Run: `eas build --profile preview --platform android`
  - Wait for build to complete on Expo's servers
  - Share the download URL with Android friends

- [ ] **Step 5 (future OTA updates)**
  - Run: `eas update --branch preview --message "description of changes"`
  - Friends get the update automatically without reinstalling

- [ ] **Step 6 (iOS friends via Expo Go)**
  - Run: `npx expo start --tunnel`
  - Share QR code (dev server must be running)

## Files Changed
- `package.json` — adds `expo-updates` dependency
- `app.json` — adds `runtimeVersion`, `updates` config, `expo-updates` plugin
- `eas.json` — already exists, no changes needed
