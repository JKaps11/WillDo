# Dashboard Feature Plan

## Overview

The main landing page after login, providing a daily overview of skill-based tasks and progress at a glance.

## Purpose

- Give users a clear view of their day's skill-building tasks
- Show progress across all active skills and sub-skills
- Quick task completion that updates skill metrics
- Navigate to Skill Planner for detailed management

## Key Concept

**All tasks on the dashboard come from sub-skills.** There is no manual task creation on this page. Tasks are:

1. Auto-generated from sub-skills in the Skill Planner
2. Scheduled to the TodoList via drag-and-drop from Unassigned
3. Optionally recurring based on user preference

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│                        Dashboard                             │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│      Today's Tasks            │      Skills Overview        │
│                               │                             │
│  ┌─────────────────────────┐  │  ┌─────────────────────┐   │
│  │ [●] Practice scales     │  │  │ 🎹 Piano            │   │
│  │     🎹 Scales (15/100)  │  │  │ 3/8 sub-skills ✓   │   │
│  │     ⟳ Daily             │  │  │ ●●●○○○○○            │   │
│  └─────────────────────────┘  │  │ [→ Planner]         │   │
│  ┌─────────────────────────┐  │  └─────────────────────┘   │
│  │ [●] Typing test         │  │                             │
│  │     ⌨️ Typing (45/100)   │  │  ┌─────────────────────┐   │
│  │     ⟳ Daily             │  │  │ 🇪🇸 Spanish          │   │
│  └─────────────────────────┘  │  │ 1/6 sub-skills ✓    │   │
│  ┌─────────────────────────┐  │  │ ●○○○○○              │   │
│  │ [✓] Learn vocab words   │  │  │ [→ Planner]         │   │
│  │     🇪🇸 Vocabulary (done) │  │  └─────────────────────┘   │
│  └─────────────────────────┘  │                             │
│                               │                             │
│  No "Add task" button -       │                             │
│  Tasks come from skills       │                             │
│                               │                             │
└───────────────────────────────┴─────────────────────────────┘
```

## Components

### Today's Tasks

**Display:**

- Tasks scheduled for today (from TodoList)
- Each task shows:
  - Skill color dot
  - Task name (from sub-skill goal)
  - Sub-skill name + metric progress (e.g., "Scales (15/100)")
  - Recurring indicator if applicable (⟳)
- Completed tasks shown with strikethrough

**Functionality:**

- Checkbox to mark complete → updates sub-skill metric
- Click task to view sub-skill details (optional: navigate to Skill Planner)
- No drag reordering (order determined by when added)
- No inline task creation

**On Task Complete:**

1. Task marked as done
2. Sub-skill's `metricCurrent` incremented
3. If recurring: next instance scheduled
4. Visual feedback showing metric update

**Empty State:**

- "No tasks for today"
- "Drag tasks from Unassigned to schedule them"
- Link to Unassigned Tasks page

### Skills Overview

**Display:**

- All active (non-archived) skills
- For each skill:
  - Name and icon
  - Sub-skills completed count (e.g., "3/8 sub-skills ✓")
  - Stage distribution dots (colored by stage)
  - Link to Skill Planner

**Stage Dots:**

```
●●●○○○○○
[green][blue][orange][gray][gray][gray][gray][gray]
```

- Green = complete
- Blue = practice
- Orange = feedback
- Purple = evaluate
- Gray = not started

**Click Action:**

- Navigate to Skill Planner for that skill

## Technical Implementation

### Route

- `/app/dashboard` (or `/app` as default landing page)

### Components

```
src/components/dashboard/
├── Dashboard.tsx              # Main container (two-column layout)
├── TodaysTasks.tsx            # Left panel - today's tasks from TodoList
├── TaskCard.tsx               # Individual task with skill info
├── TaskMetricBadge.tsx        # Shows "15/100" metric progress
├── RecurringBadge.tsx         # Shows ⟳ for recurring tasks
├── SkillsOverview.tsx         # Right panel - skills grid
├── SkillSummaryCard.tsx       # Individual skill with stage dots
├── SubSkillStageDots.tsx      # Colored dots for stage distribution
└── DashboardEmptyState.tsx    # When no skills exist
```

### API Endpoints (tRPC)

```typescript
// Get today's tasks with sub-skill and skill info
dashboard.getTodaysTasks(): TaskWithSkillInfo[]

interface TaskWithSkillInfo {
  task: Task;
  subSkill: {
    id: string;
    name: string;
    metricCurrent: number;
    metricTarget: number;
    metricUnit?: string;
    stage: SubSkillStage;
  };
  skill: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
  isRecurring: boolean;
}

// Get skills with sub-skill stage counts
dashboard.getSkillsSummary(): SkillSummary[]

interface SkillSummary {
  id: string;
  name: string;
  color: string;
  icon?: string;
  subSkillsTotal: number;
  subSkillsComplete: number;
  stageCounts: {
    not_started: number;
    practice: number;
    feedback: number;
    evaluate: number;
    complete: number;
  };
}

// Complete task and update metric
task.completeWithMetricUpdate({ taskId }): {
  success: boolean;
  newMetricValue: number;
  isMetricFilled: boolean;
  nextRecurrence?: Date;
}
```

### Database Queries

**Today's Tasks with Skill Info:**

```sql
SELECT
  t.*,
  ss.id as sub_skill_id,
  ss.name as sub_skill_name,
  ss.metric_current,
  ss.metric_target,
  ss.metric_unit,
  ss.stage,
  s.id as skill_id,
  s.name as skill_name,
  s.color as skill_color,
  s.icon as skill_icon,
  t.is_recurring
FROM tasks t
JOIN sub_skills ss ON t.sub_skill_id = ss.id
JOIN skills s ON ss.skill_id = s.id
WHERE t.user_id = ?
AND t.todo_list_date = CURRENT_DATE
ORDER BY t.created_at
```

**Skills Summary with Stage Counts:**

```sql
SELECT
  s.*,
  COUNT(ss.id) as total_sub_skills,
  SUM(CASE WHEN ss.stage = 'complete' THEN 1 ELSE 0 END) as complete_count,
  SUM(CASE WHEN ss.stage = 'practice' THEN 1 ELSE 0 END) as practice_count,
  SUM(CASE WHEN ss.stage = 'feedback' THEN 1 ELSE 0 END) as feedback_count,
  SUM(CASE WHEN ss.stage = 'evaluate' THEN 1 ELSE 0 END) as evaluate_count,
  SUM(CASE WHEN ss.stage = 'not_started' THEN 1 ELSE 0 END) as not_started_count
FROM skills s
LEFT JOIN sub_skills ss ON s.id = ss.skill_id
WHERE s.user_id = ?
AND s.archived_at IS NULL
GROUP BY s.id
```

## State Management

- Use TanStack Query for server state
- Optimistic updates for task completion
- Invalidate queries after metric update
- Show toast with metric update feedback

## Task Completion Flow

```
User clicks checkbox on task
    ↓
Optimistic update: task appears completed
    ↓
API call: task.completeWithMetricUpdate({ taskId })
    ↓
Server:
  1. Mark task complete
  2. Increment sub_skill.metric_current
  3. If recurring, create next instance
  4. Return new metric value
    ↓
Client:
  1. Update task card to show new metric
  2. Show toast: "Scales: 16/100 (+1)"
  3. If recurring, note next occurrence
```

## Mobile Responsiveness

- Stack layout vertically on mobile
- Today's tasks on top, skills below
- Skills as horizontal scroll or collapsed accordion
- Full-width task cards

## Differences from Current TodoList Page

| Aspect      | Dashboard           | TodoList Page             |
| ----------- | ------------------- | ------------------------- |
| Purpose     | Quick overview      | Full task management      |
| Scope       | Today only          | Week/Day view             |
| Task info   | Shows skill context | Focuses on task details   |
| Drag & drop | No                  | Yes (reorder, move dates) |
| Add tasks   | No                  | Via Unassigned sheet      |

## Future Enhancements

- Weekly progress summary
- Skill streak tracking
- Daily motivation based on progress
- Upcoming sub-skill completions
- Recent metric updates feed
- Goal reminders/notifications
- Focus mode (show one skill at a time)
