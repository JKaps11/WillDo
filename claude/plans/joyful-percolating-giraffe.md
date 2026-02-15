# Active Skill (Single-Focus Mode)

## Context
Add a "focus on one skill" system. User picks an active skill; dashboard shows only that skill; skill hub shows an indicator on the active one.

## Changes

### 1. Schema — add `activeSkillId` to `users` table
- **`src/db/schemas/user.schema.ts`**: Add `activeSkillId` column — `text('active_skill_id').references(() => skill.id, { onDelete: 'set null' })`, nullable
- **`src/db/schemas/skill.schema.ts`**: Need to import `skill` table in user schema (handle circular ref by using raw SQL reference or importing table)
- Run `bun run db:generate` + `bun run db:migrate`

### 2. Zod schemas
- **`src/lib/zod-schemas/user.ts`**: Add `activeSkillId: z.string().uuid().nullable().optional()` to `updateUserSchema`

### 3. tRPC — new `setActiveSkill` endpoint
- **`src/integrations/trpc/routes/user.trpc.ts`**: Add `setActiveSkill` mutation — takes `{ skillId: string | null }`, updates `activeSkillId` on user row. Invalidates user query on client.

### 4. Skill Hub — 3-dot menu + active indicator
- **`src/components/skills-hub/SkillCard.tsx`**:
  - Add "Set as Active" button to popover menu (between "View Planner" and "Edit")
  - Use `Focus` or `Star` icon from lucide
  - Call `user.setActiveSkill` mutation on click
  - Need to fetch current user to know which skill is active
- **`src/components/skills-hub/SkillsHub.tsx`**: Pass `activeSkillId` down or let `SkillCard` read it
- **`src/components/skills-hub/SkillCard.tsx`**: Show active indicator — small badge/icon on the card when it's the active skill (e.g., a star or "Active" badge near the skill name)

### 5. Dashboard — show only active skill
- **`src/components/dashboard/SkillsOverview.tsx`**: Filter `skills` to show only the active one. If no active skill set, show a prompt to pick one (or show all as before).

## Files to modify
1. `src/db/schemas/user.schema.ts`
2. `src/lib/zod-schemas/user.ts`
3. `src/integrations/trpc/routes/user.trpc.ts`
4. `src/db/repositories/user.repository.ts` (add `setActiveSkill` method or reuse `update`)
5. `src/components/skills-hub/SkillCard.tsx`
6. `src/components/skills-hub/SkillsHub.tsx`
7. `src/components/dashboard/SkillsOverview.tsx`

## Verification
- `bun run db:generate` — migration generated
- `bun run db:migrate` — migration applied
- `bun run check` — no lint/format errors
- `bun run build` — builds successfully
- Manual: set active skill from skill hub menu, see indicator appear, dashboard shows only that skill

## Decisions
- No active skill → dashboard shows empty state prompting user to pick one from skill hub
- No "clear active" option — user always switches between skills, can't unset
