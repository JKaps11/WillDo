# WillDo Mobile App (React Native Expo) - Implementation Plan

## Context

WillDo is a skill learning platform (web app: TanStack Start + tRPC + Drizzle + Clerk + Neon PostgreSQL). We're building an MVP mobile app with Expo that covers Dashboard, Todo List, Skills Hub, and Task management. The mobile app will live in a `mobile/` directory in this repo (monorepo), share types/schemas via a `packages/shared` workspace, use the tRPC client for type-safe API calls, and Clerk Expo SDK for auth.

## Phase 0: Monorepo + Shared Package

### 0.1 Convert to workspaces
- Add `"workspaces": ["packages/*", "mobile"]` to root `package.json`
- Move existing web app deps to remain at root (bun workspaces handle this)

### 0.2 Create `packages/shared/`
The Zod schemas import only `subSkillStageEnum` from DB schemas. The types file imports `Skill`, `SubSkill`, `SkillMetric` types.

**Create:**
- `packages/shared/package.json` - name: `@willdo/shared`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts` - barrel exports
- `packages/shared/src/db-types.ts` - type-only re-exports of DB entity types + enum value arrays as plain `const` (to avoid pulling in drizzle-orm runtime)
- `packages/shared/src/zod-schemas/` - copy all 7 schema files, refactored to import enums from `../db-types` instead of `@/db/schemas/*`
- `packages/shared/src/types.ts` - `EnrichedSubSkill`, `SkillWithSubSkills`, etc.
- `packages/shared/src/constants/` - `xp.ts`, `contact.ts` (pure logic, no deps)

**Update web app** to re-export from `@willdo/shared` (or use path aliases so both consume the same source).

### 0.3 Verify web app still builds
- Run `bun run build` to confirm no regressions

## Phase 1: Expo Project Setup

### 1.1 Initialize Expo app
```
npx create-expo-app@latest mobile --template blank-typescript
```

### 1.2 Key dependencies
- `@clerk/clerk-expo`, `expo-secure-store` (auth)
- `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`, `superjson` (API)
- `expo-router` (navigation)
- `nativewind`, `tailwindcss` (styling - matches web's Tailwind approach)
- `lucide-react-native` (icons - matches web's lucide-react)
- `date-fns` (date handling - same as web)
- `@gorhom/bottom-sheet` (modals/sheets)
- `react-native-reanimated`, `react-native-gesture-handler` (gestures/animations)
- `@willdo/shared` (workspace dependency)

### 1.3 Metro config for monorepo
Configure `mobile/metro.config.js` with `watchFolders` pointing to `../packages/shared` and `nodeModulesPaths` for root `node_modules`.

### 1.4 tRPC router type sharing
The `TRPCRouter` type (from `src/integrations/trpc/routes/router.ts`) is needed for type-safe tRPC client. Since importing it directly would pull server deps into Metro:
- Add a type-generation script: `tsc --declaration --emitDeclarationOnly` targeting the router file, outputting to `packages/shared/generated/`
- The mobile app imports the generated `.d.ts` for type safety
- For MVP, can start with a manual type file if the generation is complex

### 1.5 Environment config
- `mobile/.env` with `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_API_URL`

## Phase 2: Auth (Clerk Expo)

### Files to create:
- `mobile/src/lib/auth/clerk-provider.tsx` - ClerkProvider with expo-secure-store token cache
- `mobile/app/(auth)/_layout.tsx` - Auth layout (no tabs)
- `mobile/app/(auth)/sign-in.tsx` - Sign in screen using `useSignIn()`
- `mobile/app/(auth)/sign-up.tsx` - Sign up screen using `useSignUp()`

### Auth flow:
- Root layout checks `isSignedIn` from `useAuth()`
- Redirects to `(auth)/sign-in` if not authenticated
- Clerk Expo handles OAuth and email/password flows

## Phase 3: tRPC Client + Providers

### Files to create:
- `mobile/src/lib/trpc/client.ts` - tRPC client with httpBatchLink, SuperJSON transformer, Clerk token in Authorization header
- `mobile/src/lib/trpc/provider.tsx` - Combined ClerkProvider + QueryClientProvider + tRPC provider wrapper

### Key pattern:
```tsx
// Token injection via useAuth().getToken()
headers: async () => {
  const token = await getToken();
  return { Authorization: token ? `Bearer ${token}` : '' };
}
```

The server's Clerk middleware (`@clerk/tanstack-react-start/server`) already validates Bearer tokens.

## Phase 4: Navigation Structure

```
mobile/app/
  _layout.tsx              -- Root: providers + auth guard
  (auth)/
    _layout.tsx            -- Stack nav for auth screens
    sign-in.tsx
    sign-up.tsx
  (tabs)/
    _layout.tsx            -- Bottom tab bar (Dashboard, Todo, Skills)
    index.tsx              -- Dashboard
    todolist.tsx           -- Todo List
    skills/
      _layout.tsx          -- Stack nav for skills
      index.tsx            -- Skills Hub list
      [id].tsx             -- Skill detail (sub-skills)
      new.tsx              -- Create skill form
  task/
    [id].tsx               -- Edit task (modal presentation)
    new.tsx                -- Create task (modal presentation)
```

3 bottom tabs: Dashboard, Todo List, Skills Hub.

## Phase 5: Screens (in priority order)

### 5.1 Dashboard (`(tabs)/index.tsx`)
- tRPC: `dashboard.getTodaysTasks`, `metrics.getUserMetrics`
- Today's tasks as a FlatList with completion checkboxes
- Metrics card: streak, XP, weekly progress bar
- Active skill summary

### 5.2 Todo List (`(tabs)/todolist.tsx`)
- tRPC: `todoList.list` (date-based)
- Day view with horizontal date picker for navigation
- Task items with checkbox completion (`task.completeWithMetricUpdate`)
- FAB to create new task

### 5.3 Skills Hub (`(tabs)/skills/index.tsx`)
- tRPC: `skill.list`
- FlatList of skill cards (color, name, sub-skill count/progress)
- Archive toggle, create button in header
- Swipe actions for archive/delete

### 5.4 Skill Detail (`(tabs)/skills/[id].tsx`)
- tRPC: `skill.get`
- Skill header with color/description
- Sub-skills list with stage indicators (not_started/practice/evaluate/complete)
- Tasks grouped under each sub-skill

### 5.5 Create Skill (`(tabs)/skills/new.tsx`)
- tRPC: `skill.create` (basic, no AI for MVP)
- Form: name, description, color picker, icon, goal

### 5.6 Task Create/Edit (`task/new.tsx`, `task/[id].tsx`)
- tRPC: `task.create`, `task.update`, `task.delete`
- Form: name, description, priority picker, due date, todo list date, sub-skill assignment
- Modal presentation (slides up from bottom)

## Phase 6: Shared UI Components

### `mobile/src/components/ui/`
- `Button.tsx` - Pressable with primary/secondary/destructive variants
- `Card.tsx` - View with shadow + border
- `Input.tsx` - TextInput with label + error state
- `Badge.tsx` - Priority badges, stage indicators
- `Checkbox.tsx` - Animated task completion checkbox
- `ProgressBar.tsx` - XP and weekly goal progress
- `DatePicker.tsx` - Wrapper around native date picker
- `ColorPicker.tsx` - Hex color grid
- `EmptyState.tsx` - Empty list placeholder

### Styling approach
- NativeWind (Tailwind for RN) - reuse class name patterns from web
- Theme context mapping web app's CSS variables to RN styles
- Dark/light mode via `useColorScheme()` + user's server-stored preference

## Phase 7: Polish
- Pull-to-refresh on all lists
- Haptic feedback on task completion (`expo-haptics`)
- Dark mode support
- Error boundaries + offline indicators
- App icon + splash screen

## Key Files to Reference

| Purpose | Path |
|---------|------|
| tRPC router (type export) | `src/integrations/trpc/routes/router.ts` |
| tRPC endpoint config | `src/routes/api.trpc.$.tsx` |
| Zod schemas (to extract) | `src/lib/zod-schemas/*.ts` |
| Shared types (to extract) | `src/lib/types.ts` |
| DB schemas (type source) | `src/db/schemas/*.ts` |
| Constants (to extract) | `src/lib/constants/xp.ts`, `contact.ts` |
| Theme/CSS variables | `src/styles.css` |
| Clerk web setup (reference) | `src/integrations/clerk/provider.tsx` |

## Verification

1. **Web app regression**: `bun run build` passes after monorepo changes
2. **Auth flow**: Sign in on mobile, verify Clerk token reaches server
3. **API connectivity**: Dashboard loads today's tasks from deployed server
4. **CRUD operations**: Create a skill, create a task, complete a task, verify on web
5. **Expo build**: `npx expo start` runs without errors on iOS/Android simulators
