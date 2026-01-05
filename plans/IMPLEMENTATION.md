# Implementation Plan

This document outlines the implementation order, coding standards, and verification checkpoints for the skill builder migration.

---

## Coding Standards

### TypeScript

**Explicit Typing Required:**

```typescript
// Functions: params AND return types
function calculateProgress(current: number, target: number): number {
  return Math.round((current / target) * 100);
}

// Interfaces for all object shapes
interface SubSkillNodeData {
  subSkill: SubSkill;
  stageColor: string;
  isLocked: boolean;
  progress: number;
}

// Exported constants
export const STAGE_COLORS: Record<SubSkillStage, string> = {
  not_started: '#9CA3AF',
  practice: '#3B82F6',
  feedback: '#F59E0B',
  evaluate: '#8B5CF6',
  complete: '#10B981',
};
```

**Forbidden:**

- `any` type (use `unknown`, generics, or proper types)
- Implicit `any` from untyped parameters
- Type assertions (`as`) to bypass type checking

**Variable Naming:**

```typescript
// Descriptive names that convey purpose
const completedSubSkillCount = subSkills.filter(
  (s) => s.stage === 'complete',
).length;
const isMetricFilled = metricCurrent >= metricTarget;
const canShowCompleteButton = stage !== 'complete' && isMetricFilled;

// NOT: cnt, flag, data, temp, x
```

### HTML/JSX Structure

**Semantic Elements:**

```tsx
// Use semantic HTML
<article className="...">       // For cards/self-contained content
<section className="...">       // For grouped content areas
<nav className="...">           // For navigation
<header className="...">        // For page/section headers
<main className="...">          // For primary content
<aside className="...">         // For sidebars/panels

// NOT: div soup everywhere
```

**Accessibility:**

```tsx
// Interactive elements need proper attributes
<button type="button" aria-label="Delete skill">
<input id="skillName" aria-describedby="skillNameHint" />
<label htmlFor="skillName">Skill Name</label>

// Focus management for modals/dialogs
// Keyboard navigation support
```

### Tailwind CSS

**Class Organization:**

```tsx
// Order: layout → sizing → spacing → typography → colors → effects → states
<div className="
  flex items-center justify-between     {/* layout */}
  w-full h-12                           {/* sizing */}
  px-4 py-2 gap-3                       {/* spacing */}
  text-sm font-medium                   {/* typography */}
  bg-card text-card-foreground          {/* colors */}
  border rounded-lg shadow-sm           {/* effects */}
  hover:bg-accent transition-colors     {/* states */}
">
```

**Use Design Tokens:**

```tsx
// Use the CSS variables defined in styles.css
bg-background text-foreground           // NOT: bg-white text-black
bg-card border-border                   // NOT: bg-slate-100 border-gray-200
text-muted-foreground                   // NOT: text-gray-500
bg-primary text-primary-foreground      // For primary actions
bg-destructive                          // For delete/danger actions
```

**Stage Colors (add to styles.css):**

```css
:root {
  --stage-not-started: #9ca3af;
  --stage-practice: #3b82f6;
  --stage-feedback: #f59e0b;
  --stage-evaluate: #8b5cf6;
  --stage-complete: #10b981;
}
```

**Responsive Design:**

```tsx
// Mobile-first approach
<div className="
  flex flex-col                         {/* mobile: stack */}
  md:flex-row                           {/* tablet+: row */}
  lg:gap-6                              {/* desktop: more spacing */}
">

// Common breakpoints: sm(640) md(768) lg(1024) xl(1280)
```

**Avoid:**

```tsx
// NO arbitrary values when design tokens exist
className="text-[#3B82F6]"              // Use: text-primary or CSS var
className="p-[13px]"                    // Use: p-3 or p-4
className="w-[347px]"                   // Use: w-full or max-w-sm

// NO inline styles except for truly dynamic values
style={{ backgroundColor: skill.color }}  // OK: user-defined color
style={{ width: '200px' }}                // NOT OK: use Tailwind
```

### Comments

**When to Comment:**

```typescript
// Section headers in long files (200+ lines)
/* ========== API Endpoints ========== */

// Complex business logic that isn't obvious
// Metric is "filled" when current >= target, but sub-skill
// stays active until user manually completes it
const isMetricFilled = metricCurrent >= metricTarget;

// Non-obvious workarounds with explanation
// React Flow requires stable node IDs - using subSkill.id directly
// causes re-renders on every update
const nodeId = `subskill-${subSkill.id}`;
```

**What NOT to Comment:**

```typescript
// NO: obvious code
const count = items.length; // Gets the length of items

// NO: commented-out code (delete it)
// const oldFunction = () => { ... }

// NO: TODO without context
// TODO: fix this

// NO: JSDoc for self-explanatory functions
/** Gets user by ID */
function getUserById(id: string): User { ... }
```

---

## Implementation Phases

### Phase 1: Database Foundation

**Tasks:**

1. Create `skills` schema (`src/db/schemas/skill.schema.ts`)
2. Create `skill_metrics` schema (`src/db/schemas/skill_metric.schema.ts`)
3. Create `sub_skills` schema (`src/db/schemas/sub_skill.schema.ts`)
4. Create `sub_skill_dependencies` schema (`src/db/schemas/sub_skill_dependency.schema.ts`)
5. Update `tasks` schema with new columns:
   - `subSkillId` (nullable FK)
   - `isRecurring`
   - `recurrenceRule` (JSONB)
   - `recurrenceEndType`
   - `recurrenceEndValue`
   - `parentTaskId` (self-reference for recurring instances)
6. Create Zod schemas for validation (`src/lib/zod-schemas/skill.ts`)
7. Create repositories:
   - `src/db/repositories/skill.repository.ts`
   - `src/db/repositories/sub_skill.repository.ts`
8. Generate and run migrations

**Files to Create:**

```
src/db/schemas/
├── skill.schema.ts
├── skill_metric.schema.ts
├── sub_skill.schema.ts
└── sub_skill_dependency.schema.ts

src/lib/zod-schemas/
└── skill.ts

src/db/repositories/
├── skill.repository.ts
└── sub_skill.repository.ts
```

**Verification Checkpoint 1:**

- [ ] Run `bun run db:generate` successfully
- [ ] Run `bun run db:push` successfully
- [ ] Verify tables exist in Drizzle Studio
- [ ] Run `bun run check` passes

---

### Phase 2: tRPC API Layer

**Tasks:**

1. Create skill router (`src/integrations/trpc/routes/skill.ts`)
   - `skill.list`
   - `skill.get`
   - `skill.create`
   - `skill.update`
   - `skill.delete`
   - `skill.archive`
2. Create sub-skill router (`src/integrations/trpc/routes/sub_skill.ts`)
   - `subSkill.list`
   - `subSkill.create`
   - `subSkill.update`
   - `subSkill.delete`
   - `subSkill.advanceStage`
   - `subSkill.complete`
   - `subSkill.addDependency`
   - `subSkill.removeDependency`
3. Create skill metric router (`src/integrations/trpc/routes/skill_metric.ts`)
   - `skillMetric.update`
   - `skillMetric.bulkUpdate`
4. Create AI planning router (`src/integrations/trpc/routes/ai_planning.ts`)
   - `aiPlanning.generateSkillPlan`
5. Update main router to include new routers
6. Update task router for sub-skill integration:
   - `task.completeWithMetricUpdate`
   - `task.createFromSubSkill`
   - `task.listBySubSkill`

**Files to Create/Modify:**

```
src/integrations/trpc/routes/
├── skill.ts              (new)
├── sub_skill.ts          (new)
├── skill_metric.ts       (new)
├── ai_planning.ts        (new)
└── task.ts               (modify)

src/integrations/trpc/
└── router.ts             (modify - add new routers)
```

**Verification Checkpoint 2:**

- [ ] All tRPC endpoints callable via dev tools
- [ ] Create a test skill via API
- [ ] Create sub-skills with dependencies
- [ ] Run `bun run check` passes

---

### Phase 3: Skills Hub (List + Create)

**Tasks:**

1. Create route: `/app/skills` (`src/routes/app/skills.tsx`)
2. Create route: `/app/skills/new` (`src/routes/app/skills.new.tsx`)
3. Create components:
   - `SkillsHub.tsx` - main container
   - `SkillCard.tsx` - card with actions
   - `SubSkillStageIndicator.tsx` - colored dots
   - `MetricsSummary.tsx` - compact metrics display
   - `DeleteSkillModal.tsx` - confirmation dialog
   - `EmptySkillsState.tsx` - empty state
4. Create skill form components:
   - `SkillForm.tsx` - multi-step container
   - `BasicInfoStep.tsx` - name, color, icon, goal
   - `AIPlanning.tsx` - AI prompts
   - `PlanReview.tsx` - review generated plan
   - `SubSkillEditor.tsx` - edit sub-skill in review
   - `ColorPicker.tsx` - color selection
5. Update sidebar navigation to include Skills Hub

**Files to Create:**

```
src/routes/app/
├── skills.tsx
└── skills.new.tsx

src/components/skills-hub/
├── SkillsHub.tsx
├── SkillCard.tsx
├── SubSkillStageIndicator.tsx
├── MetricsSummary.tsx
├── DeleteSkillModal.tsx
├── EmptySkillsState.tsx
└── SkillForm/
    ├── SkillForm.tsx
    ├── BasicInfoStep.tsx
    ├── AIPlanning.tsx
    ├── PlanReview.tsx
    ├── SubSkillEditor.tsx
    └── ColorPicker.tsx
```

**Verification Checkpoint 3:**

- [ ] Navigate to `/app/skills` shows empty state
- [ ] Create skill form works (all 3 steps)
- [ ] AI planning generates reasonable plan
- [ ] Skill card displays correctly with stage dots
- [ ] Delete skill works with confirmation
- [ ] Run `bun run check` passes

---

### Phase 4: Skill Planner (Flowchart View)

**Tasks:**

1. Install React Flow: `bun add @xyflow/react`
2. Create route: `/app/skills/:id/planner` (`src/routes/app/skills.$id.planner.tsx`)
3. Create components:
   - `SkillPlanner.tsx` - main container
   - `PlannerCanvas.tsx` - React Flow canvas
   - `PlannerControls.tsx` - zoom, fit, export
   - `SkillRootNode.tsx` - root skill node
   - `SubSkillNode.tsx` - sub-skill node with stage color
   - `DependencyEdge.tsx` - connection lines
   - `SubSkillEditPanel.tsx` - side panel for editing
   - `StageAdvancer.tsx` - stage progression controls
   - `PlannerContextMenu.tsx` - right-click menu
4. Implement node interactions:
   - Click to select and show edit panel
   - Stage advancement
   - Manual completion
5. Implement dependency management:
   - Visual connections
   - Add/remove dependencies

**Files to Create:**

```
src/routes/app/
└── skills.$id.planner.tsx

src/components/skill-planner/
├── SkillPlanner.tsx
├── PlannerCanvas.tsx
├── PlannerControls.tsx
├── nodes/
│   ├── SkillRootNode.tsx
│   ├── SubSkillNode.tsx
│   └── NodeWrapper.tsx
├── edges/
│   └── DependencyEdge.tsx
├── SubSkillEditPanel.tsx
├── StageAdvancer.tsx
└── PlannerContextMenu.tsx
```

**Verification Checkpoint 4:**

- [ ] Navigate to skill planner shows flowchart
- [ ] Nodes display with correct stage colors
- [ ] Click node opens edit panel
- [ ] Stage advancement works (Practice → Feedback → Evaluate)
- [ ] Manual completion works
- [ ] Dependencies show as connections
- [ ] Pan/zoom works
- [ ] Run `bun run check` passes

---

### Phase 5: Task Integration

**Tasks:**

1. Update unassigned tasks page:
   - Filter by stage (In Progress / All)
   - Group by skill
   - Show metric progress
   - Disable tasks when metric filled
2. Create recurring modal:
   - `RecurringModal.tsx` - modal on drop
   - `RecurrenceSelector.tsx` - frequency picker
   - `RecurrenceEndSelector.tsx` - end condition picker
3. Update task component:
   - Show skill color dot
   - Show metric progress badge
   - Handle completion → metric update
4. Update task completion logic:
   - Increment sub-skill metric
   - Handle recurring task generation
5. Remove standalone task creation:
   - Update `NewTaskModal.tsx` or remove
   - Update `AppHeader.tsx` to hide "New Task" in certain contexts

**Files to Create/Modify:**

```
src/routes/app/
└── unassigned.tsx           (modify)

src/components/unassigned/
├── UnassignedTasksPage.tsx  (new or rename)
├── UnassignedTaskCard.tsx   (new)
├── UnassignedFilters.tsx    (new)
└── SkillGroupHeader.tsx     (new)

src/components/recurring/
├── RecurringModal.tsx
├── RecurrenceSelector.tsx
└── RecurrenceEndSelector.tsx

src/components/task/
├── Task.tsx                 (modify)
├── TaskMetricBadge.tsx      (new)
└── UnassignedTask.tsx       (modify)

src/components/
├── NewTaskModal.tsx         (modify/remove)
└── common/
    └── AppHeader.tsx        (modify)
```

**Verification Checkpoint 5:**

- [ ] Unassigned shows tasks grouped by skill
- [ ] Stage filter works
- [ ] Drag task to TodoList shows recurring modal
- [ ] Recurring options work correctly
- [ ] Task completion updates metric
- [ ] Metric-filled tasks are disabled
- [ ] No standalone task creation available
- [ ] Run `bun run check` passes

---

### Phase 6: Dashboard

**Tasks:**

1. Create route: `/app/dashboard` (`src/routes/app/dashboard.tsx`)
2. Create components:
   - `Dashboard.tsx` - main two-column layout
   - `TodaysTasks.tsx` - left panel
   - `TaskCard.tsx` - task with skill info
   - `TaskMetricBadge.tsx` - metric progress (may reuse from Phase 5)
   - `RecurringBadge.tsx` - recurring indicator
   - `SkillsOverview.tsx` - right panel
   - `SkillSummaryCard.tsx` - skill with stage dots
   - `SubSkillStageDots.tsx` - colored dots
   - `DashboardEmptyState.tsx` - empty state
3. Create dashboard-specific tRPC endpoints:
   - `dashboard.getTodaysTasks`
   - `dashboard.getSkillsSummary`
4. Update default redirect to dashboard

**Files to Create:**

```
src/routes/app/
└── dashboard.tsx

src/components/dashboard/
├── Dashboard.tsx
├── TodaysTasks.tsx
├── TaskCard.tsx
├── TaskMetricBadge.tsx
├── RecurringBadge.tsx
├── SkillsOverview.tsx
├── SkillSummaryCard.tsx
├── SubSkillStageDots.tsx
└── DashboardEmptyState.tsx

src/integrations/trpc/routes/
└── dashboard.ts             (new)
```

**Verification Checkpoint 6:**

- [ ] Dashboard loads as default page after login
- [ ] Today's tasks show with skill context
- [ ] Task completion updates metric with feedback
- [ ] Skills overview shows all skills with stage dots
- [ ] Click skill navigates to planner
- [ ] Empty states display correctly
- [ ] Run `bun run check` passes

---

### Phase 7: Documentation (Optional)

**Tasks:**

1. Create route: `/app/docs` (`src/routes/app/docs.tsx`)
2. Create static markdown content in `src/content/docs/`
3. Create components:
   - `DocsLayout.tsx` - sidebar + content
   - `DocsSidebar.tsx` - navigation
   - `DocsContent.tsx` - markdown renderer

**Files to Create:**

```
src/routes/app/
└── docs.tsx

src/components/docs/
├── DocsLayout.tsx
├── DocsSidebar.tsx
└── DocsContent.tsx

src/content/docs/
├── getting-started.md
├── dashboard-guide.md
├── skill-management.md
├── skill-planner.md
└── best-practices.md
```

**Verification Checkpoint 7:**

- [ ] Docs page renders markdown content
- [ ] Navigation between docs works
- [ ] Run `bun run check` passes

---

### Phase 8: Polish & Cleanup

**Tasks:**

1. Add stage color CSS variables to `styles.css`
2. Review and fix any TypeScript errors
3. Ensure responsive design on all new pages
4. Add loading states and error boundaries
5. Clean up any unused code from old task system
6. Update user settings for skills preferences
7. Performance optimization (virtualization for large lists)

**Verification Checkpoint 8 (Final):**

- [ ] Full user flow works: Create skill → Plan → Add tasks → Complete → Progress
- [ ] All pages responsive on mobile
- [ ] No TypeScript errors
- [ ] Run `bun run check` passes
- [ ] Run `bun run build` succeeds
- [ ] Manual testing of all features

---

## Summary: Implementation Order

| Phase | Feature             | Est. Components | Depends On         |
| ----- | ------------------- | --------------- | ------------------ |
| 1     | Database Foundation | 8 files         | -                  |
| 2     | tRPC API Layer      | 5 files         | Phase 1            |
| 3     | Skills Hub          | 12 files        | Phase 2            |
| 4     | Skill Planner       | 11 files        | Phase 3            |
| 5     | Task Integration    | 10 files        | Phase 4            |
| 6     | Dashboard           | 10 files        | Phase 5            |
| 7     | Documentation       | 8 files         | Phase 6 (optional) |
| 8     | Polish              | varies          | All                |

---

## Verification Checkpoint Quick Reference

1. **After Phase 1**: Database migrations run, tables exist
2. **After Phase 2**: API endpoints work, test data created
3. **After Phase 3**: Skills Hub complete with create flow
4. **After Phase 4**: Skill Planner flowchart works
5. **After Phase 5**: Tasks integrated with skills
6. **After Phase 6**: Dashboard complete
7. **After Phase 7**: Docs (optional)
8. **After Phase 8**: Full app tested, production ready
