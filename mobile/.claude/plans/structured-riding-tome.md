# Fix ExpoCryptoAES and Expo Go Compatibility Errors

## Context

After downgrading `@clerk/clerk-expo` from v2 to v1.2.9 for Expo Go compatibility, the app still throws `Cannot find native module 'ExpoCryptoAES'`. Investigation shows v1.2.9 is correctly installed with its own isolated dependency tree (clerk-js@5.10.1) that does NOT reference `ExpoCryptoAES`. The error persists because **Metro bundler has a stale cache** from the previous v2 installation.

A secondary issue: `expo-notifications` remote push notifications are not available in Expo Go since SDK 53, causing an error on import in `_layout.tsx`.

## Plan

### Step 1: Clear Metro cache and restart

```bash
cd /home/jkaps/Coding/WillDo/mobile
rm -rf /tmp/metro-cache /tmp/metro-file-map-*
bunx expo start --clear
```

This should resolve the ExpoCryptoAES error by forcing Metro to re-resolve all modules from the now-installed v1.2.9.

### Step 2: If cache clear doesn't fix it — guard expo-notifications imports

The `_layout.tsx` top-level `Notifications.setNotificationHandler()` call runs at import time and triggers the Expo Go error. Wrap it so it degrades gracefully:

**File**: `mobile/app/_layout.tsx` (line 12-18)

Move the `Notifications.setNotificationHandler` call behind an Expo Go guard or a try-catch so the app doesn't crash if the module is unsupported:

```tsx
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Notifications not fully supported in Expo Go
}
```

### Step 3: If ExpoCryptoAES persists after cache clear — full reinstall

```bash
cd /home/jkaps/Coding/WillDo
rm -rf mobile/node_modules node_modules
bun install
```

Then restart with `bunx expo start --clear` from the mobile dir.

## Files to modify

- `mobile/app/_layout.tsx` — wrap notification handler in try-catch (Step 2)

## Verification

1. Run `bunx expo start --clear` from mobile directory
2. Open app in Expo Go
3. Confirm no `ExpoCryptoAES` error
4. Confirm sign-in/sign-up screens load
5. Confirm notifications warning appears (expected) but doesn't crash the app
