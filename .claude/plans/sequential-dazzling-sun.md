# Code Cleanup Plan

## Context

Post-AI code audit to improve reliability, type safety, and consistency. The codebase is well-structured but has accumulated some issues: a race condition in metric incrementing, inconsistent error wrapping, type safety hacks, duplicated type definitions, and ungrouped state violating CLAUDE.md conventions.

Three waves: correctness first, then style/consistency, then React 19 assessment.

---

## Wave 1: Correctness & Reliability

### 1.1 Fix race condition in `incrementMetric()`
**File**: `src/db/repositories/skill.repository.ts:185-211`

Replace SELECT-then-UPDATE with atomic SQL increment:
```ts
.set({ currentValue: sql`${skillMetrics.currentValue} + ${amount}`, updatedAt: new Date() })
```
Eliminates the intermediate `metric[0].currentValue + amount` calculation.

### 1.2 Fix double type cast in todo-list/utils.ts
**File**: `src/components/todo-list/utils.ts:48-53`

Replace `new Date(a.dueDate as unknown as Date).getTime()` with `a.dueDate.getTime()`. The field is already `Date | null` from SuperJSON serialization — no cast needed.

### 1.3 Add `withDbError()` to all repositories
**Files missing wrapping** (every method in each):
- `src/db/repositories/task.repository.ts` (~10 methods)
- `src/db/repositories/sub_skill.repository.ts` (~11 methods)
- `src/db/repositories/user.repository.ts` (~6 methods)
- `src/integrations/trpc/routes/dashboard.trpc.ts` (2 raw DB calls, lines 67 and 93)

### 1.4 Handle `Promise.all` rejections
**Files**: `src/integrations/trpc/routes/skill.trpc.ts:32-40`, `sub_skill.trpc.ts:32-44`

Wrap in try-catch at the procedure level so one failed sub-query doesn't crash the entire list endpoint.

### 1.5 Tighten Zod schemas
- `src/lib/zod-schemas/task.ts`: Add `.min(1)` to `createTaskSchema.name`
- `src/lib/zod-schemas/task.ts`: Add `.refine()` to `recurrenceExceptionSchema` — require `movedToDate` when `action === 'moved'`
- `src/lib/zod-schemas/practice-evaluation.ts`: Add `.max(200)` to `title`

### 1.6 Replace `console.log` with structured logging
**File**: `src/lib/ai/skill-planner.server.ts:85,94,129`

Remove all 3 `console.*` calls — they're redundant with the `addWide()` logging that immediately follows each one.

**Verify**: `bun run check && bun run build && bun run test`

---

## Wave 2: Style & Consistency

### 2.1 Consolidate duplicated types
**Create**: `src/lib/types.ts`

Move `SkillWithSubSkills` and `EnrichedSubSkill` here (currently defined 3x each). Rename the enriched variant to `SkillWithEnrichedSubSkills` for clarity since the two `SkillWithSubSkills` definitions actually differ.

**Update imports in**: `skill-planner/types.ts`, `SkillPlanner.tsx`, `SkillsHub.tsx`, `skill-export.ts`, and all downstream importers.

### 2.2 Group DndProvider state
**File**: `src/components/dnd/DndProvider.tsx:36-43`

Consolidate 5 `useState` calls into 2 logical groups:
- `dragState`: `{ activeTask, dragSource, pendingDrop }`
- `modalState`: `{ showRecurringModal, shouldReopenAssignSheet }`

Keep `isMounted` separate (lifecycle concern).

### 2.3 Refactor modal form patterns
**Files**:
- `src/components/skills-hub/EditSkillModal.tsx` — Replace useEffect form pre-population with key-based remount pattern
- `src/components/recurring/RecurringModal.tsx` — Same pattern
- `src/components/practice-evaluation/PracticeEvaluationModal.tsx` — Keep as-is (depends on async query data); consider grouping related form state

### 2.4 Extract magic strings to constants
- `'subskill-'` prefix → `SUBSKILL_NODE_PREFIX` constant in `SkillTreeUtils.ts`, use in `PlannerCanvas.tsx`
- HSL colors in `CompletionChart.tsx:172-174` → reference `chartConfig` instead of duplicating values

### 2.5 Extract utility functions
- `filterNonEmpty` from `PracticeEvaluationModal.tsx` → `src/lib/utils.ts` or `src/lib/utils/array.ts`
- Node ID parsing in `PlannerCanvas.tsx` → use constant from 2.4

### 2.6 Memoize TodoList context value
**File**: `src/components/todo-list/TodoList.tsx`

Wrap context value in `useMemo` to prevent unnecessary re-renders of all consumers.

### 2.7 Remove redundant comments
Opportunistic during other changes. Skip shadcn/ui vendored files (sidebar.tsx).

**Verify**: `bun run check && bun run build && bun run test`

---

## Wave 3: React 19 (Selective)

### 3.1 Assessment
- `useTransition`: Best candidate is wrapping mutation-triggered `invalidateQueries` calls to prevent UI jank. Not needed for navigation (TanStack Router handles it).
- `useOptimistic`: Strongest candidate is task completion toggle for instant feedback. Drag-drop already has visual feedback via dnd-kit.

### 3.2 Implementation (if jank is noticeable)
- Add `useOptimistic` for task completion toggle
- Add `useTransition` around query invalidation in key mutations

---

## Verification
After each wave:
1. `bun run check` — format + lint
2. `bun run build` — TypeScript compilation
3. `bun run test` — Playwright E2E
4. Manual test: task CRUD, drag-drop, skill planning, recurring tasks, practice evaluation
