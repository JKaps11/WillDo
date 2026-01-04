# Skills Integration Plan

## Overview

This document outlines the migration from the current standalone task system to a skill-centric task system where all tasks originate from sub-skills in the Skill Planner.

## Current State → Target State

### Current Flow
```
User creates task manually → Task in TodoList or Unassigned
                          → Drag between dates
                          → Mark complete
```

### Target Flow
```
Sub-skill in Skill Planner
    ↓ (auto-creates)
Task in Unassigned (filtered by stage)
    ↓ (drag to todolist)
Recurring Modal → Task on TodoList
    ↓ (complete task)
Metric updates (e.g., 100 → 99)
    ↓ (when metric filled or user decides)
User presses "Complete" on sub-skill node in Skill Planner
    ↓
Sub-skill marked complete → Next sub-skill unlocked
```

## Core Changes

### 1. Tasks Are Sub-skill Derived

**Before:** Tasks created independently via NewTaskModal
**After:** Tasks auto-generated from sub-skills only

- Remove ability to create standalone tasks
- Each sub-skill generates task(s) based on its metric
- Task inherits sub-skill's goal, metric info, and skill color

### 2. Unassigned Tasks Redesign

**Before:** Manually created tasks without a date
**After:** Auto-generated tasks from in-progress sub-skills

**Filter Toggle:**
- Default: Show only tasks from sub-skills in "practice" stage (in-progress)
- Toggle: Show all tasks (including not-started, completed)

**Display:**
- Tasks grouped by skill
- Color-coded by sub-skill stage
- Metric progress shown (e.g., "15/100 typing tests")
- Disabled/greyed out if metric is filled

### 3. Drag to TodoList with Recurring Modal

**On Drop → Show Recurring Modal:**
```
┌─────────────────────────────────────────────┐
│  Add to Todo List                       [×] │
├─────────────────────────────────────────────┤
│                                             │
│  Task: Complete 1 typing test               │
│  From: Typing Speed (sub-skill)             │
│                                             │
│  Recurrence:                                │
│  ○ Just once                                │
│  ○ Daily                                    │
│  ○ Weekly (every [Mon, Wed, Fri])           │
│  ○ Custom...                                │
│                                             │
│  Until:                                     │
│  ○ Metric complete (85 remaining)           │
│  ○ Specific date [________]                 │
│  ○ Number of times [___]                    │
│                                             │
│  [Cancel]                     [Add to List] │
└─────────────────────────────────────────────┘
```

**Recurrence Options (like calendar):**
- Once (no recurrence)
- Daily
- Weekly (select days)
- Custom interval

**Until Options:**
- Until metric is complete
- Until specific date
- For X occurrences

### 4. Metric Updates on Task Completion

When user completes a task on the TodoList:

1. Task marked complete (checkbox)
2. Sub-skill's `metricCurrent` increments toward `metricTarget`
3. Task instance removed from TodoList (or marked done)
4. If recurring: next instance scheduled
5. If `metricCurrent >= metricTarget`: task becomes disabled (greyed out)

**Example:**
```
Sub-skill: "Typing Speed"
Goal: Complete 100 typing tests
Metric: 0/100

User completes task on TodoList → Metric: 1/100
... repeats ...
Metric: 100/100 → Task greyed out, can no longer be added
```

### 5. No Auto-Complete of Sub-skills

**Before (proposed):** Auto-complete when metric reached
**After:** User must manually complete

- When metric is filled, task is disabled but sub-skill stays in current stage
- User reviews progress in Skill Planner
- User clicks "Complete" button on sub-skill node
- Sub-skill moves to "complete" stage
- Next dependent sub-skills become available

**Rationale:** User maintains control, can continue practicing beyond goal, explicit progression

---

## Database Schema Changes

### New Tables

```sql
-- skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT,
  goal TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP
);

-- skill_metrics table
CREATE TABLE skill_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'number' | 'boolean' | 'percentage' | 'duration' | 'level'
  target JSONB NOT NULL, -- number or boolean
  current JSONB NOT NULL DEFAULT '0',
  unit TEXT,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- sub_skills table
CREATE TABLE sub_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'not_started', -- 'not_started' | 'practice' | 'feedback' | 'evaluate' | 'complete'
  goal TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_target JSONB NOT NULL,
  metric_current JSONB NOT NULL DEFAULT '0',
  metric_unit TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMP
);

-- sub_skill_dependencies table
CREATE TABLE sub_skill_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_skill_id UUID NOT NULL REFERENCES sub_skills(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES sub_skills(id) ON DELETE CASCADE,
  UNIQUE(sub_skill_id, depends_on_id)
);
```

### Modify Tasks Table

```sql
ALTER TABLE tasks ADD COLUMN sub_skill_id UUID REFERENCES sub_skills(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_rule JSONB; -- iCal RRULE-like structure
ALTER TABLE tasks ADD COLUMN recurrence_end_type TEXT; -- 'metric' | 'date' | 'count'
ALTER TABLE tasks ADD COLUMN recurrence_end_value JSONB; -- date or count
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id); -- for recurring instances
```

### Recurrence Rule Structure

```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;                    // every N days/weeks/months
  daysOfWeek?: number[];               // 0-6 for weekly (0 = Sunday)
  endType: 'metric' | 'date' | 'count';
  endDate?: string;                    // ISO date
  endCount?: number;                   // number of occurrences
}
```

---

## Component Changes

### Remove/Modify

| Component | Change |
|-----------|--------|
| `NewTaskModal.tsx` | **Remove** - No standalone task creation |
| `AppHeader.tsx` | Remove "New Task" button from todolist/unassigned pages |
| `UnassignedTask.tsx` | Update to show sub-skill info, stage color, metric progress |
| `Task.tsx` | Update to show skill color, link to sub-skill |

### New Components

```
src/components/
├── skills-hub/                    # See skill-manager.md
├── skill-planner/                 # See skill-planner.md
├── unassigned/
│   ├── UnassignedTasksPage.tsx    # Refactored page
│   ├── UnassignedTaskCard.tsx     # Task with sub-skill info
│   ├── UnassignedFilters.tsx      # Stage filter toggle
│   ├── SkillGroupHeader.tsx       # Group tasks by skill
│   └── DragToTodoSheet.tsx        # Sheet for dragging to todolist
├── recurring/
│   ├── RecurringModal.tsx         # Modal on drop
│   ├── RecurrenceSelector.tsx     # Frequency picker
│   └── RecurrenceEndSelector.tsx  # End condition picker
└── task/
    └── TaskMetricBadge.tsx        # Shows metric progress on task
```

### Updated Component Tree

```
App
├── Sidebar
│   ├── Skills Hub (NEW)
│   ├── Unassigned Tasks (modified)
│   └── Todo List
├── Header (modified - remove New Task in some contexts)
└── Routes
    ├── /app/skills (NEW)
    ├── /app/skills/new (NEW)
    ├── /app/skills/:id/planner (NEW)
    ├── /app/unassigned (modified)
    ├── /app/todolist (modified)
    └── /app/dashboard (NEW)
```

---

## Unassigned Tasks Redesign

### New Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Unassigned Tasks                        [In Progress ▼] [Sort] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎹 Piano                                              3 tasks   │
│  ├─────────────────────────────────────────────────────────────┤
│  │ ┌─────────────────────────────────────────────────────────┐ │
│  │ │ [BLUE] Practice basic chords                            │ │
│  │ │        Goal: 4 chords • Progress: 2/4                   │ │
│  │ │        ████████░░░░░░░░ 50%                    [Drag ⋮] │ │
│  │ └─────────────────────────────────────────────────────────┘ │
│  │ ┌─────────────────────────────────────────────────────────┐ │
│  │ │ [BLUE] Complete typing test                             │ │
│  │ │        Goal: 100 tests • Progress: 15/100               │ │
│  │ │        ██░░░░░░░░░░░░░░ 15%                    [Drag ⋮] │ │
│  │ └─────────────────────────────────────────────────────────┘ │
│  │ ┌─────────────────────────────────────────────────────────┐ │
│  │ │ [GREEN/DISABLED] Scales practice                        │ │
│  │ │        Goal: 8 scales • Progress: 8/8 ✓                 │ │
│  │ │        ████████████████ 100%              [Completed]   │ │
│  │ └─────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🇪🇸 Spanish                                            2 tasks   │
│  ├─────────────────────────────────────────────────────────────┤
│  │ ...                                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Filter Options

| Filter | Shows |
|--------|-------|
| In Progress (default) | Tasks from sub-skills in `practice`, `feedback`, `evaluate` stages |
| All | All tasks including `not_started` and `complete` |
| By Stage | Filter by specific stage |

### Task Card States

| State | Appearance |
|-------|------------|
| Active | Normal, draggable, stage color border |
| Metric Filled | Greyed out, not draggable, "Completed" badge |
| Not Started | Lighter opacity, not draggable |

---

## TodoList Changes

### Task Display Updates

- Show skill color indicator
- Show metric progress badge (e.g., "15/100")
- On complete: update sub-skill metric

### Recurring Task Handling

When a recurring task is completed:
1. Mark current instance as complete
2. Update sub-skill metric
3. Generate next instance based on recurrence rule
4. If end condition met (metric complete, date reached, count exhausted): stop generating

### New Task Appearance

```
┌─────────────────────────────────────────────────────────────┐
│ [●] Complete typing test                         15/100 ⟳  │
│     🎹 Typing Speed                                         │
└─────────────────────────────────────────────────────────────┘
```

- `●` = Skill color dot
- `15/100` = Metric progress
- `⟳` = Recurring indicator

---

## Skill Planner: Sub-skill Completion

### Complete Button on Node

When user clicks a sub-skill node in Skill Planner:

```
┌─────────────────────────────────────────────┐
│  Sub-skill: Typing Speed              [×]   │
├─────────────────────────────────────────────┤
│                                             │
│  Stage: [Practice ▼]                        │
│                                             │
│  Goal: Complete 100 typing tests            │
│  Progress: 100/100 ✓                        │
│  ████████████████████ 100%                  │
│                                             │
│  Notes:                                     │
│  [Achieved 85 WPM average!              ]   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │     ✓ Mark as Complete              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Cancel]                        [Save]     │
└─────────────────────────────────────────────┘
```

### Completion Flow

1. User opens sub-skill edit panel
2. User clicks "Mark as Complete"
3. Sub-skill stage → `complete`
4. Sub-skill `completedAt` set
5. Node turns green in planner
6. Dependent sub-skills become unlocked (if dependencies met)
7. Associated tasks become inactive

---

## API Changes

### New Endpoints

```typescript
// Skills
skill.list()
skill.get({ id })
skill.create({ ... })
skill.delete({ id })
skill.generatePlan({ goal, goalMetric, currentLevel, gaps })

// Sub-skills
subSkill.list({ skillId })
subSkill.create({ skillId, ... })
subSkill.update({ id, ... })
subSkill.delete({ id })
subSkill.advanceStage({ id })
subSkill.complete({ id })
subSkill.addDependency({ id, dependsOnId })
subSkill.removeDependency({ id, dependsOnId })

// Metrics
skillMetric.update({ id, current })

// Tasks (modified)
task.listBySubSkill({ subSkillId })
task.createFromSubSkill({ subSkillId, recurrence? })
task.completeAndUpdateMetric({ id }) // NEW: complete + increment metric
```

### Modified Endpoints

```typescript
// task.listUnassigned now returns tasks with sub-skill info
task.listUnassigned({ filter?: 'in_progress' | 'all' }): TaskWithSubSkill[]

// task.update no longer allows creating standalone tasks
// task.create restricted to internal use (from sub-skills)
```

---

## Migration Steps

### Phase 1: Database Setup
1. Create new tables (skills, skill_metrics, sub_skills, sub_skill_dependencies)
2. Add new columns to tasks table
3. Run migrations

### Phase 2: New Features
1. Implement Skills Hub (list, create, delete)
2. Implement Skill Planner (view, edit sub-skills)
3. Implement AI planning integration
4. Add sub-skill completion flow

### Phase 3: Task Integration
1. Modify task creation to require sub-skill
2. Update unassigned tasks page with new design
3. Implement recurring modal
4. Implement metric updates on completion

### Phase 4: Cleanup
1. Remove NewTaskModal from header (for todolist/unassigned)
2. Update navigation (add Skills Hub)
3. Migrate any existing tasks (optional: archive or convert)
4. Update dashboard

### Phase 5: Polish
1. Add stage color indicators everywhere
2. Implement filtering and sorting
3. Test recurring task flows
4. Performance optimization

---

## User Settings Updates

Add to `UserSettings`:

```typescript
interface UserSettings {
  // ... existing
  skills: {
    defaultUnassignedFilter: 'in_progress' | 'all';
    showMetricProgress: boolean;
    showRecurringIndicator: boolean;
  };
}
```

---

## Routes Update

```
/app
├── /dashboard          # NEW: Today's tasks + skills overview
├── /skills             # NEW: Skills Hub
├── /skills/new         # NEW: Create skill form
├── /skills/:id/planner # NEW: Skill Planner
├── /unassigned         # MODIFIED: Sub-skill based tasks
├── /todolist           # MODIFIED: With recurring support
└── /settings           # Add skills tab
```

---

## Sidebar Update

```
┌─────────────────────┐
│  willDo             │
├─────────────────────┤
│  📊 Dashboard       │  ← NEW
│  🎯 Skills Hub      │  ← NEW
│  📋 Unassigned      │
│  ✓  Todo List       │
├─────────────────────┤
│  ⚙️  Settings       │
│  👤 User            │
└─────────────────────┘
```

---

## Summary of Key Behavioral Changes

| Aspect | Before | After |
|--------|--------|-------|
| Task Creation | Manual via modal | Auto from sub-skills |
| Unassigned Tasks | User-created backlog | Sub-skill task pool |
| Task → TodoList | Direct drag | Drag + recurring modal |
| Task Completion | Just marks done | Updates sub-skill metric |
| Metric Tracking | N/A | Automatic on task complete |
| Sub-skill Completion | N/A | Manual button press |
| Recurring Tasks | Not supported | Full calendar-style recurrence |
