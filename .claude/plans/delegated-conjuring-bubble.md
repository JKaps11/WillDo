# Plan: Type Safety, Date Fixes, and Transaction Support

## Context

This PR addresses three categories of issues found across the codebase:

1. **Type safety gaps** — ad-hoc casts, missing explicit types on callbacks/return values, and rule text clarity
2. **UTC date bug** — `new Date('YYYY-MM-DD')` and `.toISOString().split('T')[0]` shift dates for users west of UTC
3. **No transaction support** — multi-write mutations (up to 6 sequential DB writes) have no atomicity guarantees; repositories use a hardcoded `db` import with no way to participate in transactions

---

## Part A: Quick Fixes (type safety, dates, rule text)

### A1. `.claude/rules/typescript.md` line 35 — punctuation clarity
- Change `Use \`.pick()\` / \`.omit()\` / \`.extend()\`.` → `Use \`.pick()\`, \`.omit()\`, or \`.extend()\`.`

### A2. `src/lib/store.ts` — EvaluationTask type + return types

**Lines 195, 205**: Add explicit `: void` return types to `openEvaluationModal` and `closeEvaluationModal`.

**EvaluationTask type**: Define near `EvaluationModalState` (line 27):
```typescript
export type EvaluationTask = Pick<Task, 'id' | 'name' | 'subSkillId'> & { todoListDate: Date };
```
Update `EvaluationModalState.task` from `Task | null` to `EvaluationTask | null`.
Update `openEvaluationModal` param from `task: Task` to `task: EvaluationTask`.

### A3. `src/components/dashboard/TaskCard.tsx` lines 55-63
Remove the `as Parameters<...>` cast. The object `{ id, name, subSkillId, todoListDate }` now conforms to `EvaluationTask` directly.

### A4. `src/lib/utils.ts` — shared `parseLocalDate` helper
Add a utility to avoid duplicating date-parsing logic in 3 files:
```typescript
export function parseLocalDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}
```

### A5. `src/components/practice-evaluation/PracticeEvaluationModal.tsx`

**Line 128** (UTC date in title): Replace `occurrenceDate.toISOString().split('T')[0]` with `occurrenceDate.toLocaleDateString('en-CA')` (produces `YYYY-MM-DD` in local time).

**Lines 56-76** (implicit callback types): Annotate:
- `values.map((value: string, index: number) => ...)`
- `(e: React.ChangeEvent<HTMLTextAreaElement>) => handleValueChange(index, e.target.value)`

**Lines 6-8** (`import type`): Skip — project builds cleanly; `typeof` on a type-only import works in type positions.

### A6. `src/components/reflections/EvaluationViewer.tsx`

**Lines 79-82** (date parsing): Replace `new Date(evaluation.occurrenceDate).toLocaleDateString()` with `parseLocalDate(evaluation.occurrenceDate).toLocaleDateString()` — import from `@/lib/utils`.

**Lines 17-20** (implicit callback types): `items.map((item: string, i: number) => ...)`

### A7. `src/components/reflections/FolderTree.tsx`

**Lines 70-74** (date parsing): Replace `new Date(evaluation.occurrenceDate).toLocaleDateString()` with `parseLocalDate(evaluation.occurrenceDate).toLocaleDateString()`.

**Lines 141-189** (implicit callback types): Import `FolderHierarchySkill` and `FolderHierarchySubSkill` from `@/db/repositories/practice_evaluation.repository` and annotate:
- `hierarchy.map((skill: FolderHierarchySkill) => ...)`
- `.reduce((sum: number, ss: FolderHierarchySubSkill) => ..., 0)`
- `.map((subSkill: FolderHierarchySubSkill) => ...)`

### A8. `src/lib/zod-schemas/practice-evaluation.ts` lines 7-8
Export `nonEmptyStringArray` and `confidenceLevelSchema` so they can be reused.

---

## Part B: Transaction Infrastructure

### B1. `src/db/index.ts` — export `DbClient` type
```typescript
export type DbClient = typeof db;
export const db = drizzle(sql);
```

### B2. Add optional `dbClient` param to ALL write repository methods

For every repository file, update each write method signature to accept an optional last param:
```typescript
// Before
create: async (data: NewTask, userId: string): Promise<Task | null> => {
  // uses db.insert(...)
}

// After
create: async (data: NewTask, userId: string, dbClient: DbClient = db): Promise<Task | null> => {
  // uses dbClient.insert(...)
}
```

Replace `db.` with `dbClient.` inside the method body. Existing callers don't change (they get the default `db`).

**Files to update (write methods only):**

| Repository file | Write methods to update |
|---|---|
| `src/db/repositories/skill.repository.ts` | `create`, `update`, `delete`, `archive`, `unarchive`, `createMetric`, `updateMetric`, `incrementMetric`, `deleteMetric` |
| `src/db/repositories/task.repository.ts` | `create`, `update`, `delete` |
| `src/db/repositories/sub_skill.repository.ts` | `create`, `update`, `delete`, `advanceStage`, `complete`, `setParent` |
| `src/db/repositories/user.repository.ts` | `create`, `update`, `delete`, `setActiveSkill`, `patchSettings` |
| `src/db/repositories/user_metrics.repository.ts` | ALL write methods (~18): `upsert`, `incrementTasksCompleted`, `decrementTasksCompleted`, `incrementSubSkillsCompleted`, `decrementSubSkillsCompleted`, `incrementSkillsArchived`, `decrementSkillsArchived`, `incrementSkillsImported`, `incrementSkillsExported`, `incrementTasksCreated`, `incrementSubSkillsCreated`, `updateStreak`, `recalculateStreak`, `addXp`, `removeXp`, `resetWeeklyIfNeeded`, `updateWeeklyGoal` |
| `src/db/repositories/completion_event.repository.ts` | `create`, `delete` |
| `src/db/repositories/practice_evaluation.repository.ts` | `create`, `deleteByTaskAndDate` + new `deleteLatestByTaskId` |
| `src/db/repositories/ai_usage.repository.ts` | `create` |

### B3. Add `deleteLatestByTaskId` to practice_evaluation.repository.ts
New method for the uncomplete-without-occurrenceDate fix:
```typescript
deleteLatestByTaskId: async (taskId: string, userId: string, dbClient: DbClient = db): Promise<PracticeEvaluation | null> => {
  // SELECT latest by completedAt DESC LIMIT 1, then DELETE by id
}
```

### B4. Wrap multi-write tRPC mutations in `db.transaction()`

**11 mutations to wrap:**

| Route file | Mutation | Writes |
|---|---|---|
| `src/integrations/trpc/routes/task.trpc.ts` | `completeWithEvaluation` | 5-6 |
| `src/integrations/trpc/routes/task.trpc.ts` | `completeWithMetricUpdate` | 3-5 |
| `src/integrations/trpc/routes/skill.trpc.ts` | `createWithPlan` | 4+ |
| `src/integrations/trpc/routes/skill.trpc.ts` | `archive` | 4 |
| `src/integrations/trpc/routes/skill.trpc.ts` | `unarchive` | 4 |
| `src/integrations/trpc/routes/skill.trpc.ts` | `import` | 4+ |
| `src/integrations/trpc/routes/sub_skill.trpc.ts` | `create` | 2-3 |
| `src/integrations/trpc/routes/sub_skill.trpc.ts` | `advanceStage` | 3-4 |
| `src/integrations/trpc/routes/sub_skill.trpc.ts` | `complete` | 4 |
| `src/integrations/trpc/routes/metrics.trpc.ts` | `getUserMetrics` | 2 |
| `src/integrations/trpc/routes/metrics.trpc.ts` | `updateWeeklyGoal` | 2 |

Pattern:
```typescript
return db.transaction(async (tx) => {
  const evaluation = await practiceEvaluationRepository.create({...}, tx);
  const task = await taskRepository.update(id, userId, {...}, tx);
  // ...all writes pass tx
  return { task, evaluation };
});
```

### B5. `src/integrations/trpc/routes/task.trpc.ts` — uncomplete handler fix (lines 170-179)
Change the evaluation deletion to always run (with or without occurrenceDate):
```typescript
if (input.occurrenceDate) {
  await practiceEvaluationRepository.deleteByTaskAndDate(task.id, input.occurrenceDate, ctx.userId, tx);
} else {
  await practiceEvaluationRepository.deleteLatestByTaskId(task.id, ctx.userId, tx);
}
addWide({ evaluation_deleted: true });
```

### B6. `src/integrations/trpc/routes/task.trpc.ts` — explicit types on `completeWithEvaluation` (line 192)
Add explicit types to the mutation callback params and return type:
```typescript
.mutation(async ({ ctx, input }): Promise<{ task: Task; evaluation: PracticeEvaluation }> => {
```

---

## Execution Order

1. **A1** — typescript.md rule text fix
2. **A8** — Export zod helpers
3. **A4** — Add `parseLocalDate` to utils.ts
4. **A2** — Store types (EvaluationTask + return types)
5. **A3** — TaskCard cast removal (depends on A2)
6. **A5** — PracticeEvaluationModal date + callback types
7. **A6** — EvaluationViewer date + callback types (depends on A4)
8. **A7** — FolderTree date + callback types (depends on A4)
9. **B1** — Export DbClient type
10. **B2** — Update all repository write methods (largest step — do per-file)
11. **B3** — Add deleteLatestByTaskId
12. **B4** — Wrap all 11 mutations in transactions
13. **B5** — Uncomplete handler fix (depends on B3, B4)
14. **B6** — Explicit types on completeWithEvaluation

---

## Verification

1. `bun run check` — Prettier + ESLint pass
2. `bun run build` — TypeScript compilation succeeds with no errors
3. `bun run test` — All Playwright E2E tests pass
4. Manual spot-check: Complete a task with evaluation, then uncomplete it — verify evaluation is cleaned up
5. Verify date displays correctly for a user in a timezone west of UTC (e.g., set TZ=America/New_York)
