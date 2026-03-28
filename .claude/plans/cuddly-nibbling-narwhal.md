# Practice Evaluation Form — Implementation Plan

## Context

Users need guided self-reflection after each practice iteration to learn effectively. Currently, tasks complete with a checkbox — no reflection happens. This feature adds an evaluation form that appears when completing a task, forcing the user to reflect on what went well, what they struggled with, what they now understand, etc. A separate "Reflections" page lets users browse past evaluations organized by skill/subskill hierarchy.

**Key decision:** Each occurrence of a recurring task gets its own evaluation form. Since recurring tasks share the same `taskId`, the schema stores an `occurrenceDate` to distinguish evaluations for different occurrences. The `taskId` + `occurrenceDate` pair is unique.

---

## Step 1: Help Docs Update

**File:** `src/components/help/HelpContent.tsx`

- Add two new entries to `HELP_TOPICS`: `practice-evaluation` and `reflections`
- Add corresponding content to `HELP_CONTENT` covering:
  - What the evaluation form is and why self-reflection matters
  - When it appears (on task completion)
  - What each question asks
  - How previous answers pre-populate
  - Reflections page: folder hierarchy, split-view browsing

---

## Step 2: Save Prompt to Notes

- Create folder `~/Documents/Notes/WillDo/Skill Advancement/`
- Save the user's original feature request prompt to a file there

---

## Step 3: DB Schema (STOP FOR CONFIRMATION)

**New file:** `src/db/schemas/practice_evaluation.schema.ts`

```
Table: practice_evaluation
├── id               uuid        PK, defaultRandom
├── userId           text        NOT NULL, FK → users.id
├── taskId           uuid        NOT NULL, FK → tasks.id (CASCADE)
├── subSkillId       uuid        NOT NULL, FK → sub_skills.id (CASCADE)
├── skillId          uuid        NOT NULL, FK → skills.id (CASCADE)
├── occurrenceDate   date        NOT NULL  (the todoListDate of the task occurrence — distinguishes recurring task instances)
├── title            text        NOT NULL  (auto-generated: "{subskill} - {date}", editable)
├── wentWell         text        NOT NULL  ("What went well during practice?")
├── struggled        text        NOT NULL  ("What did you struggle with?")
├── understandBetter text        NOT NULL  ("What do you understand better now?")
├── feelings         text        NOT NULL  ("What feelings did you experience?")
├── focusNextTime    text        NOT NULL  ("What will you focus on next time?")
├── confidenceLevel  integer     NOT NULL  (1-5, validated at Zod layer)
├── completedAt      timestamp   NOT NULL, default NOW
├── ...resourceTimestamps        (createdAt, updatedAt)
│
├── UNIQUE: (taskId, occurrenceDate) — one evaluation per task occurrence
├── INDEX: (userId, subSkillId) — for fetching latest by subskill
├── INDEX: (userId, skillId)    — for folder hierarchy queries
└── INDEX: (taskId)             — for lookup by task
```

**After creating:** Run `bun run db:generate` and `bun run db:push`.

**STOP HERE** for user confirmation before proceeding.

---

## Step 4: Zod Schemas, Repository, tRPC Route

### 4a. Zod Schemas
**New file:** `src/lib/zod-schemas/practice-evaluation.ts`

Schemas to create:
- `createPracticeEvaluationSchema` — all text fields + confidenceLevel (z.number().int().min(1).max(5)) + taskId, subSkillId, skillId, occurrenceDate (z.date())
- `getPracticeEvaluationSchema` — { id: z.string().uuid() }
- `listBySubSkillSchema` — { subSkillId: z.string().uuid() }
- `getLatestBySubSkillSchema` — { subSkillId: z.string().uuid() }
- `getFolderHierarchySchema` — no input (uses userId from ctx)
- `completeTaskWithEvaluationSchema` — { taskId: z.string().uuid(), occurrenceDate: z.date(), evaluation: createPracticeEvaluationSchema }

**Modify:** `src/lib/zod-schemas/index.ts` — add `export * from './practice-evaluation'`

### 4b. Repository
**New file:** `src/db/repositories/practice_evaluation.repository.ts`

Methods:
- `create(data)` — insert evaluation
- `findById(id, userId)` — get single evaluation
- `findByTaskId(taskId, userId)` — get evaluation for a task
- `deleteByTaskAndDate(taskId, occurrenceDate, userId)` — delete when uncompleting a specific task occurrence
- `findBySubSkillId(subSkillId, userId)` — all evaluations for a subskill (for folder view)
- `findLatestBySubSkillId(subSkillId, userId)` — most recent evaluation (for auto-populate)
- `getFolderHierarchy(userId)` — returns skills with subskills and evaluation counts (joined query)

### 4c. tRPC Routes
**New file:** `src/integrations/trpc/routes/practice_evaluation.trpc.ts`

Endpoints:
- `practiceEvaluation.get` — query, get single evaluation
- `practiceEvaluation.listBySubSkill` — query, all evaluations for a subskill
- `practiceEvaluation.getLatestBySubSkill` — query, most recent for auto-populate
- `practiceEvaluation.getFolderHierarchy` — query, skill→subskill→count tree

**Modify:** `src/integrations/trpc/routes/task.trpc.ts`
- Add `completeWithEvaluation` mutation that:
  1. Validates task exists and is not already completed
  2. Creates the practice evaluation record
  3. Runs all existing `completeWithMetricUpdate` logic (mark complete, increment metrics, create completion event, update streak/XP)
  4. Returns `{ task, evaluation }`
- Modify `completeWithMetricUpdate` uncomplete path (lines 158-172): also call `practiceEvaluationRepository.deleteByTaskAndDate(task.id, occurrenceDate, ctx.userId)` to clean up the evaluation when uncompleting. Add `occurrenceDate` to `completeTaskWithMetricUpdateSchema`.

**Modify:** `src/integrations/trpc/routes/router.ts` — add `practiceEvaluation: practiceEvaluationRouter`

---

## Step 5: Evaluation Form UI

**New files:**
- `src/components/practice-evaluation/PracticeEvaluationModal.tsx`
- `src/components/practice-evaluation/ConfidenceRating.tsx`
- `src/components/practice-evaluation/index.ts`

### PracticeEvaluationModal
- Reads state from `uiStore.evaluationModal` (task reference)
- On open, queries `practiceEvaluation.getLatestBySubSkill` for pre-population
- Auto-generates title: `"{subSkillName} - {YYYY-MM-DD}"` (editable)
- Pre-fills `focusNextTime` from previous eval's `focusNextTime`, and `struggled` from previous `struggled` (as starting points)
- Form fields (TanStack React Form):
  - `title` — Input
  - `wentWell` — Textarea: "What went well during practice?"
  - `struggled` — Textarea: "What did you struggle with?"
  - `understandBetter` — Textarea: "What do you understand better now?"
  - `feelings` — Textarea: "What feelings did you experience?"
  - `focusNextTime` — Textarea: "What will you focus on next time?"
  - `confidenceLevel` — ConfidenceRating (1-5)
- Submit calls `task.completeWithEvaluation` mutation
- On success: close modal, invalidate queries (todoList, skill, dashboard)
- Cancel/close: task stays incomplete
- Dialog uses `max-w-xl`, scrollable content with `max-h-[80vh] overflow-y-auto`

### ConfidenceRating
- 5 clickable segments (1-5)
- Labels: 1="Not confident", 3="Somewhat", 5="Very confident"

---

## Step 6: Task Completion Flow Change

### Store Addition
**Modify:** `src/lib/store.ts`
- Add `EvaluationModalState` interface: `{ isOpen: boolean; task: Task | null; occurrenceDate: Date | null }`
- Add to `UIStoreState`: `evaluationModal: EvaluationModalState`
- Add actions: `openEvaluationModal(task, occurrenceDate)`, `closeEvaluationModal()`
- Add initial state: `{ isOpen: false, task: null, occurrenceDate: null }`
- The `occurrenceDate` is the `todoListDate` of the specific task occurrence (critical for recurring tasks)

### Intercept Checkbox
**Modify:** `src/components/task/Task.tsx` (line 100-112)
- When `checked === true` and `task.subSkillId` exists: call `uiStoreActions.openEvaluationModal(task)` instead of `completeWithMetricMutation.mutate()`
- When `checked === false`: use existing `completeWithMetricUpdate` with `completed: false` (backend also deletes evaluation)

**Modify:** `src/components/dashboard/TaskCard.tsx` (line 46-59)
- Same change: intercept completion to open evaluation modal instead of mutating directly
- Uncomplete path stays the same

### Register Global Modal
**Modify:** `src/routes/app.tsx`
- Add `<PracticeEvaluationModal />` alongside `GlobalRecurringModal` and `MoveRecurringModal`

---

## Step 7: Reflections Page

### Route
**New file:** `src/routes/app/reflections.tsx`
- File-based route at `/app/reflections`
- Uses `ensureUser()` loader pattern (same as other app routes)

### Components
**New files:**
- `src/components/reflections/PracticeLogPage.tsx` — two-panel split layout
- `src/components/reflections/FolderTree.tsx` — left panel, collapsible skill→subskill→eval tree
- `src/components/reflections/EvaluationViewer.tsx` — right panel, read-only evaluation display
- `src/components/reflections/index.ts`

### FolderTree
- Fetches `practiceEvaluation.getFolderHierarchy`
- Level 1: Skill folders (with skill color indicator + count badge)
- Level 2: Subskill folders (with count badge)
- Level 3: Individual evaluations (title + date)
- Icons: `Folder`/`FolderOpen` for collapsed/expanded, `FileText` for evaluations
- Clicking an evaluation sets selected ID in local state

### EvaluationViewer
- Fetches `practiceEvaluation.get` for selected evaluation
- Read-only display of all fields in a card layout
- Empty state: "Select an evaluation to view it"
- Shows: title, date, all Q&A pairs, confidence level indicator

### Sidebar
**Modify:** `src/components/common/AppSidebar.tsx`
- Add nav item: `{ title: 'Reflections', to: '/app/reflections', icon: BookOpen }` between "Todo List" and "Settings"

### Header & Breadcrumbs
**Modify:** `src/components/common/types.ts`
- Add `'Reflections'` to `PageTitle` union type

**Modify:** `src/components/common/AppHeader.tsx`
- Add `'reflections'` case to `getPageTitle()` returning `'Reflections'`
- Add `'reflections'` case to `getBreadcrumbs()` — dynamic breadcrumbs based on search params:
  - Base: `[{ label: 'Reflections', href: '/app/reflections' }]`
  - With skill selected: `+ [{ label: skillName }]` (uses search param `?skillId=...&skillName=...`)
  - With subskill selected: `+ [{ label: subSkillName }]` (uses search param `&subSkillId=...&subSkillName=...`)
  - Pattern matches how Skills Hub does `Skill Hub > Skill Planner`
- The FolderTree component navigates by updating search params, which the breadcrumbs read
- Add `case 'Reflections': break;` to the `headerMenuOptions` switch (no header buttons needed)

---

## Critical Files Summary

| File | Action |
|------|--------|
| `src/db/schemas/practice_evaluation.schema.ts` | Create |
| `src/lib/zod-schemas/practice-evaluation.ts` | Create |
| `src/lib/zod-schemas/index.ts` | Modify (add export) |
| `src/db/repositories/practice_evaluation.repository.ts` | Create |
| `src/integrations/trpc/routes/practice_evaluation.trpc.ts` | Create |
| `src/integrations/trpc/routes/task.trpc.ts` | Modify (add mutation, cleanup on uncomplete) |
| `src/integrations/trpc/routes/router.ts` | Modify (register router) |
| `src/lib/store.ts` | Modify (evaluation modal state) |
| `src/components/practice-evaluation/*.tsx` | Create (modal + rating) |
| `src/components/task/Task.tsx` | Modify (intercept checkbox) |
| `src/components/dashboard/TaskCard.tsx` | Modify (intercept checkbox) |
| `src/routes/app.tsx` | Modify (register global modal) |
| `src/routes/app/reflections.tsx` | Create |
| `src/components/reflections/*.tsx` | Create (page + tree + viewer) |
| `src/components/common/AppSidebar.tsx` | Modify (add nav item) |
| `src/components/common/AppHeader.tsx` | Modify (breadcrumbs, page title, switch case) |
| `src/components/common/types.ts` | Modify (add 'Reflections' to PageTitle) |
| `src/components/help/HelpContent.tsx` | Modify (add help topics) |

---

## Verification

1. **Schema**: Run `bun run db:generate` and `bun run db:push` — confirm migration applies
2. **Form flow**: Complete a task → evaluation modal appears → fill form → submit → task completes. Cancel → task stays incomplete
3. **Uncomplete**: Uncheck a completed task → evaluation is deleted from DB
4. **Auto-populate**: Complete a second task for the same subskill → verify previous answers pre-fill
5. **Reflections**: Navigate to Reflections → see skill/subskill folders → click evaluation → see contents in split view
6. **Help docs**: Navigate to Help → confirm new topics appear and render correctly
7. **Run `bun run check`** for lint/format
8. **Run `bun run test`** for existing E2E tests (shouldn't break)
