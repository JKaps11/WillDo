# Skill Planner Feature Plan

## Overview

A visual flowchart/tree view of a skill's learning path, showing all sub-skills as interactive nodes. Each sub-skill is a building block that the user must master to achieve their top-level skill goal.

## Core Concepts

### Skill Hierarchy

```
Skill (Top-Level Goal)
└── Sub-skills (Nodes/Building Blocks)
    ├── Sub-skill 1: "Basic Chords"
    ├── Sub-skill 2: "Reading Sheet Music"
    ├── Sub-skill 3: "Scales & Arpeggios"
    └── Sub-skill 4: "Song Repertoire"
```

### Sub-skill Stage Cycle

Every sub-skill goes through the same repeating cycle:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│    ┌──────────┐                                 │
│    │ PRACTICE │ ◄───────────────────────┐       │
│    └────┬─────┘                         │       │
│         │                               │       │
│         ▼                               │       │
│    ┌──────────┐                         │       │
│    │ FEEDBACK │                         │       │
│    └────┬─────┘                         │       │
│         │                               │       │
│         ▼                               │       │
│    ┌──────────┐     No, continue        │       │
│    │ EVALUATE │ ────────────────────────┘       │
│    └────┬─────┘                                 │
│         │                                       │
│         │ Goal met OR user confirms             │
│         ▼                                       │
│    ┌──────────┐                                 │
│    │ COMPLETE │                                 │
│    └──────────┘                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Stages:**

1. **Practice** - Actively working on the sub-skill
2. **Feedback** - Receiving feedback (self-assessment, mentor, AI, etc.)
3. **Evaluate** - Determining if goal is met or if another cycle is needed

### Progression Rules

- Sub-skill completion is **always manual** - user must press "Complete" button
- Even when metric is filled (100%), sub-skill stays in current stage until user completes it
- This allows users to continue practicing beyond the goal if desired
- Sub-skills can have dependencies (must complete X before starting Y)
- Some sub-skills may be worked on in parallel

### Task Generation

Each sub-skill **automatically generates a task** that appears in Unassigned Tasks:

```
Sub-skill: "Typing Speed"
Goal: Complete 100 typing tests
    ↓ (auto-generates)
Task: "Complete typing test" (repeatable, linked to sub-skill)
    ↓ (user drags to TodoList)
Recurring Modal → Task scheduled on TodoList
    ↓ (user completes task)
Metric updates: 0/100 → 1/100
    ↓ (repeat until 100/100)
Metric filled → Task greyed out in Unassigned
    ↓ (user decides they're done)
User clicks "Complete" on sub-skill node
    ↓
Sub-skill complete → Next sub-skill(s) unlocked
```

**Key Points:**

- Tasks are derived from sub-skills, not created independently
- Completing a task on TodoList increments the sub-skill's metric
- When metric is filled, task becomes disabled (greyed out) but sub-skill is NOT auto-completed
- User must explicitly complete the sub-skill via the Skill Planner

## Stage Colors

| Stage       | Color         | Meaning                      |
| ----------- | ------------- | ---------------------------- |
| Not Started | Gray          | Sub-skill not yet begun      |
| Practice    | Blue          | Actively practicing          |
| Feedback    | Yellow/Orange | Receiving/reviewing feedback |
| Evaluate    | Purple        | Assessing progress           |
| Complete    | Green         | Goal met, sub-skill mastered |

## Layout Concept

```
┌─────────────────────────────────────────────────────────────────────┐
│  Skill Planner: Piano                    [Zoom +/-] [Fit] [Export]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        ┌──────────────────┐                          │
│                        │    🎹 PIANO       │                          │
│                        │   Master Goal:    │                          │
│                        │   Play 10 songs   │                          │
│                        └────────┬─────────┘                          │
│                                 │                                    │
│         ┌───────────────────────┼───────────────────────┐            │
│         │                       │                       │            │
│         ▼                       ▼                       ▼            │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐      │
│  │ Basic Chords │        │ Sheet Music │        │   Scales    │      │
│  │   [GREEN]    │        │   [BLUE]    │        │   [GRAY]    │      │
│  │  ✓ Complete  │        │  Practice   │        │ Not Started │      │
│  │  Goal: 4/4   │        │  Goal: 2/5  │        │  Goal: 0/8  │      │
│  └──────┬──────┘        └─────────────┘        └─────────────┘      │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────┐                                                    │
│  │ Song #1     │                                                    │
│  │  [YELLOW]   │                                                    │
│  │  Feedback   │                                                    │
│  └─────────────┘                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Node Types

### 1. Root Node (Skill)

- Skill name and icon
- Master goal description
- Overall metrics progress
- Skill theme color

### 2. Sub-skill Nodes

- Sub-skill name
- **Stage color** (gray/blue/yellow/purple/green)
- Current stage label
- Metric progress (e.g., "2/4 chords")
- Task status indicator:
  - Active: task available for scheduling
  - Disabled: metric filled, waiting for completion
  - None: sub-skill complete, no task
- Click to open sub-skill detail/edit
- **Complete button** visible when metric is filled

## Interactions

### Canvas Navigation

- Pan: Click and drag on empty space
- Zoom: Mouse wheel or pinch gesture
- Fit to view: Button to reset view
- Minimap: Optional overview for large trees

### Node Interactions

**Click on Sub-skill Node:**

- Open sub-skill detail panel
- View/edit goal and metrics
- Advance stage (Practice → Feedback → Evaluate)
- Mark as complete

**Right-click Context Menu:**

- Edit sub-skill
- Delete sub-skill
- Add dependency
- Mark complete
- Reset to Practice stage

### Sub-skill Edit Panel

```
┌─────────────────────────────────────────────┐
│  Edit Sub-skill                         [×] │
├─────────────────────────────────────────────┤
│  Name: [Basic Chords                     ]  │
│                                             │
│  Goal:                                      │
│  [Master 4 basic chords (C, G, D, Em)    ]  │
│                                             │
│  Metric Progress:                           │
│  ████████████████████ 4/4 chords ✓          │
│                                             │
│  Current Stage:                             │
│  ○ Practice  ○ Feedback  ● Evaluate         │
│                                             │
│  Task Status:                               │
│  [Metric filled - task disabled]            │
│                                             │
│  Dependencies: [None]                       │
│                                             │
│  Notes:                                     │
│  [Struggled with Em transitions...       ]  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │     ✓ Mark Sub-skill Complete       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Cancel]                        [Save]     │
└─────────────────────────────────────────────┘
```

### Stage Advancement

Users can advance stages via:

1. **Stage buttons** in the edit panel
2. **Quick action** on node hover
3. **Keyboard shortcut** when node selected

When advancing from Evaluate:

- Cycle back to Practice (for another round)
- OR click "Mark Sub-skill Complete" to finish

### Sub-skill Completion (Manual Only)

**Important:** Sub-skills are NEVER auto-completed.

Even when the metric is filled (e.g., 100/100):

- The task becomes disabled/greyed out in Unassigned
- The sub-skill remains in its current stage
- User must explicitly click "Mark Sub-skill Complete"

**Completion Flow:**

1. User opens sub-skill edit panel (click on node)
2. Reviews progress and notes
3. Clicks "Mark Sub-skill Complete" button
4. Sub-skill stage → `complete`
5. Node turns green
6. Dependent sub-skills become unlocked
7. Associated task removed from Unassigned

**Why Manual?**

- User maintains full control over progression
- Allows continuing practice beyond the goal
- Explicit acknowledgment of mastery
- Prevents accidental advancement

## Visual Design

### Node Styling

**Root Node:**

- Larger size, prominent position
- Skill color as background
- Icon display

**Sub-skill Nodes:**

- Rounded rectangles
- **Border/background color = current stage**
- Progress indicator (mini bar or fraction)
- Stage icon overlay

### Stage Color Scheme

```css
--stage-not-started: #9ca3af; /* Gray */
--stage-practice: #3b82f6; /* Blue */
--stage-feedback: #f59e0b; /* Amber/Orange */
--stage-evaluate: #8b5cf6; /* Purple */
--stage-complete: #10b981; /* Green */
```

### Connections

- Solid lines for dependencies
- Arrow direction shows prerequisite flow
- Completed connections: green tint
- Locked connections: dashed gray

## Technical Implementation

### Route

- `/app/skills/:id/planner`

### Components

```
src/components/skill-planner/
├── SkillPlanner.tsx           # Main container
├── PlannerCanvas.tsx          # Canvas with pan/zoom
├── PlannerControls.tsx        # Zoom, fit, export buttons
├── PlannerMinimap.tsx         # Overview minimap
├── nodes/
│   ├── SkillRootNode.tsx      # Root skill node
│   ├── SubSkillNode.tsx       # Sub-skill node with stage color
│   └── NodeWrapper.tsx        # Common node wrapper
├── edges/
│   └── DependencyEdge.tsx     # Sub-skill dependencies
├── SubSkillEditPanel.tsx      # Side panel for editing
├── StageAdvancer.tsx          # Stage progression controls
└── PlannerContextMenu.tsx     # Right-click menu
```

### Library

- **React Flow / Xyflow** for node-based UI

### Data Structures

```typescript
// Stage cycle
type SubSkillStage =
  | 'not_started'
  | 'practice'
  | 'feedback'
  | 'evaluate'
  | 'complete';

// Task status relative to sub-skill
type TaskStatus = 'active' | 'disabled' | 'none';

// Sub-skill (node)
interface SubSkill {
  id: string;
  skillId: string;
  name: string;
  description?: string;
  stage: SubSkillStage;
  goal: string; // What defines mastery
  metricType: MetricValueType;
  metricTarget: number | boolean;
  metricCurrent: number | boolean;
  metricUnit?: string;
  dependencies: string[]; // IDs of prerequisite sub-skills
  order: number;
  notes?: string;
  completedAt?: Date;
  taskId?: string; // Reference to auto-generated task
}

// For React Flow
interface PlannerNode {
  id: string;
  type: 'skill' | 'subskill';
  position: { x: number; y: number };
  data: SkillNodeData | SubSkillNodeData;
}

interface SubSkillNodeData {
  subSkill: SubSkill;
  stageColor: string;
  isLocked: boolean; // Dependencies not met
  progress: number; // 0-100 based on metric
  isMetricFilled: boolean; // metricCurrent >= metricTarget
  taskStatus: TaskStatus; // 'active' | 'disabled' | 'none'
  canComplete: boolean; // Show complete button?
}
```

### Task Status Logic

```typescript
function getTaskStatus(subSkill: SubSkill): TaskStatus {
  if (subSkill.stage === 'complete') {
    return 'none'; // No task for completed sub-skills
  }
  if (subSkill.stage === 'not_started') {
    return 'none'; // No task until started
  }
  if (subSkill.metricCurrent >= subSkill.metricTarget) {
    return 'disabled'; // Metric filled, waiting for manual completion
  }
  return 'active'; // Task available for scheduling
}

function canShowCompleteButton(subSkill: SubSkill): boolean {
  // Show complete button when metric is filled but not yet completed
  return (
    subSkill.stage !== 'complete' &&
    subSkill.stage !== 'not_started' &&
    subSkill.metricCurrent >= subSkill.metricTarget
  );
}
```

### API Endpoints (tRPC)

```typescript
// Get skill with all sub-skills and their tasks
skill.getWithSubSkills({ skillId }): {
  skill: Skill;
  subSkills: SubSkillWithTask[];
}

// Sub-skill CRUD
subSkill.create({ skillId, name, goal, ... })  // Auto-creates linked task
subSkill.update({ id, ...fields })
subSkill.delete({ id })                         // Also deletes linked task

// Stage management
subSkill.advanceStage({ id })      // Move to next stage in cycle
subSkill.setStage({ id, stage })   // Set specific stage (also updates task visibility)
subSkill.complete({ id })          // Mark as complete (removes task, unlocks dependents)

// Task-Metric Link (called when task completed on TodoList)
subSkill.incrementMetric({ id })   // metricCurrent += 1 (or appropriate increment)

// Dependencies
subSkill.addDependency({ id, dependsOnId })
subSkill.removeDependency({ id, dependsOnId })
```

### Task Auto-Generation

When a sub-skill is created or moves to an active stage:

```typescript
// Automatically create/activate task for sub-skill
async function ensureTaskForSubSkill(subSkill: SubSkill) {
  if (subSkill.stage === 'not_started' || subSkill.stage === 'complete') {
    // No task needed
    return;
  }

  if (!subSkill.taskId) {
    // Create task linked to this sub-skill
    const task = await createTask({
      name: subSkill.goal,
      subSkillId: subSkill.id,
      // No todoListDate = unassigned
    });
    await updateSubSkill(subSkill.id, { taskId: task.id });
  }
}
```

### State Management

```typescript
interface PlannerState {
  selectedNodeId: string | null;
  editingSubSkillId: string | null;
  zoom: number;
  position: { x: number; y: number };
}
```

## Stage Color in Skills Hub

The Skills Hub card should also show sub-skill stage distribution:

```
┌─────────────────────────────────────────────────────────────┐
│ 🎹 Piano                                        Stage 2/5   │
│ Goal: Play 10 songs fluently                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sub-skills: ●●●○○○○○  (3 complete, 5 remaining)         │ │
│ │ [████ 2 Practice] [██ 1 Feedback] [░░░░ 2 Not Started]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 3 sub-skills active                      [Edit] [Delete]    │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

- Virtualize nodes for large trees (50+ nodes)
- Debounce position saves
- Lazy load sub-skill details
- Cache layout calculations

## Mobile Considerations

- Touch-friendly zoom/pan
- Larger tap targets for nodes
- Bottom sheet for editing instead of side panel
- Consider list fallback for mobile

## Export Options

- PNG/SVG image export
- PDF for printing
- JSON data export

## Future Enhancements

- AI-suggested next sub-skill to focus on
- Time tracking per sub-skill
- Spaced repetition reminders
- Progress streaks
- Sub-skill templates
- Collaborative skill building
- Mentor feedback integration
- Learning resource attachments
