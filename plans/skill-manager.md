# Skills Hub Feature Plan

## Overview

The central listing page for all user skills. Provides a quick overview of all skills with progress visualization and actions to create, edit, or delete skills.

## Core Concepts

### Skill Structure

```
Skill (Top-Level Goal)
├── Metrics (how to measure overall success)
└── Sub-skills (building blocks to master)
    └── Each sub-skill cycles: Practice → Feedback → Evaluate → (repeat or complete)
```

### Sub-skill Stage Cycle

Every sub-skill goes through the same repeating stages:
1. **Practice** (Blue) - Actively working on it
2. **Feedback** (Orange) - Receiving/reviewing feedback
3. **Evaluate** (Purple) - Assessing if goal is met
4. **Complete** (Green) - Goal achieved or user confirmed

## Purpose

- View all skills at a glance with progress indicators
- Create new skills with AI assistance
- Quick actions: edit (→ skill planner) and delete
- Track progress through sub-skills with stage colors

## Features

### Skills List View

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Skills Hub                                    [+ New Skill] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎹 Piano                              3/8 sub-skills ✓  │ │
│ │ Goal: Play 10 songs fluently                            │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Sub-skills by stage:                                │ │ │
│ │ │ ●●● Complete  ●● Practice  ● Feedback  ○○ Not Started│ │ │
│ │ │ [GREEN]       [BLUE]       [ORANGE]    [GRAY]       │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ Metrics: Songs 4/10 • Hours 24/100                      │ │
│ │                                          [Edit] [Delete] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🇪🇸 Spanish                             1/6 sub-skills ✓  │ │
│ │ Goal: B2 conversational level                           │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Sub-skills by stage:                                │ │ │
│ │ │ ● Complete  ●●● Practice  ○○ Not Started            │ │ │
│ │ │ [GREEN]     [BLUE]        [GRAY]                    │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ Metrics: Vocab 500/2000 • Conversations 3/50            │ │
│ │                                          [Edit] [Delete] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Skill Card Components

**Header:**
- Skill name and icon
- Sub-skills completed count (e.g., "3/8 sub-skills ✓")

**Stage Distribution:**
- Colored dots representing each sub-skill's current stage
- Legend: Gray (Not Started), Blue (Practice), Orange (Feedback), Purple (Evaluate), Green (Complete)

**Metrics Summary:**
- Compact display of key metrics with current/target

**Actions:**
- **Edit Button** → Navigates to Skill Planner (`/app/skills/:id/planner`)
- **Delete Button** → Confirmation modal, then removes skill

### Stage Color Reference

| Stage | Color | Hex Code |
|-------|-------|----------|
| Not Started | Gray | `#9CA3AF` |
| Practice | Blue | `#3B82F6` |
| Feedback | Orange | `#F59E0B` |
| Evaluate | Purple | `#8B5CF6` |
| Complete | Green | `#10B981` |

## Skill Creation Form

### Step 1: Basic Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | Text | Yes | Skill name (e.g., "Piano", "Spanish") |
| Color | Color Picker | Yes | Theme color for the skill |
| Icon | Icon Selector | No | Visual identifier |
| Goal | Textarea | Yes | Description of end goal |

### Step 2: AI-Powered Planning

**User Inputs (Prompts):**

1. **What is your skill goal and metric for it?**
   - Specific, measurable goal
   - How success will be measured

2. **Where are you now?**
   - Current skill level assessment
   - Previous experience

3. **What are things that are missing?**
   - Knowledge gaps
   - Resources needed
   - Potential blockers

**AI Query Response Schema:**

```typescript
// Supported metric value types
type MetricValueType = 'number' | 'boolean' | 'percentage' | 'duration' | 'level';

interface SkillMetric {
  name: string;               // e.g., "Songs Mastered", "Can Read Sheet Music"
  type: MetricValueType;      // How to interpret/display the value
  target: number | boolean;   // Target value
  unit?: string;              // Optional unit label (e.g., "songs", "hours")
  description?: string;       // What this metric measures
}

interface SubSkillPlan {
  name: string;               // e.g., "Basic Chords"
  description: string;        // What this sub-skill covers
  goal: string;               // Specific goal for mastery
  metricType: MetricValueType;
  metricTarget: number | boolean;
  metricUnit?: string;
  dependencies?: number[];    // Indices of prerequisite sub-skills
  resources?: string[];       // Helpful resources
}

interface AISkillPlanResponse {
  metrics: SkillMetric[];     // Overall skill metrics

  subSkills: SubSkillPlan[];  // Building blocks to master

  recommendations: {
    resources: string[];
    tips: string[];
    warnings: string[];
  };
}

// Example response:
// {
//   metrics: [
//     { name: "Songs Mastered", type: "number", target: 10, unit: "songs" },
//     { name: "Hours Practiced", type: "duration", target: 100, unit: "hours" }
//   ],
//   subSkills: [
//     { name: "Basic Chords", goal: "Master C, G, D, Em", metricType: "number", metricTarget: 4, metricUnit: "chords" },
//     { name: "Reading Sheet Music", goal: "Read basic notation", metricType: "boolean", metricTarget: true, dependencies: [0] },
//     { name: "Scales", goal: "Play major scales", metricType: "number", metricTarget: 8, metricUnit: "scales" }
//   ]
// }
```

### Step 3: Review & Customize

- Review AI-generated plan
- Edit sub-skills and their goals
- Adjust dependencies between sub-skills
- Adjust overall metrics
- Confirm and create skill

### What Happens on Create

When the skill is created:
1. Skill and all sub-skills are saved to database
2. **Tasks are auto-generated** for each sub-skill (see integration.md)
3. Tasks appear in Unassigned Tasks (filtered by stage)
4. User can drag tasks to TodoList to start working
5. Completing tasks on TodoList updates sub-skill metrics

## Technical Implementation

### Routes

- `/app/skills` - Skills Hub (list view)
- `/app/skills/new` - Create new skill (multi-step form)
- `/app/skills/:id/planner` - Skill Planner (edit view - see skill-planner.md)

Note: There is no separate detail/edit page. Clicking "Edit" on a skill card navigates directly to the Skill Planner.

### Components

```
src/components/skills-hub/
├── SkillsHub.tsx              # Main container/list
├── SkillCard.tsx              # Card in list view with actions
├── SubSkillStageIndicator.tsx # Colored dots showing stage distribution
├── MetricsSummary.tsx         # Compact metrics display
├── DeleteSkillModal.tsx       # Confirmation dialog
├── SkillForm/
│   ├── SkillForm.tsx          # Multi-step form container
│   ├── BasicInfoStep.tsx      # Step 1: name, color, icon, goal
│   ├── AIPlanning.tsx         # Step 2: AI prompts
│   ├── AIPromptInput.tsx      # Individual prompt field
│   ├── PlanReview.tsx         # Step 3: review generated plan
│   ├── SubSkillEditor.tsx     # Edit sub-skill in review
│   └── ColorPicker.tsx        # Color selection component
└── EmptySkillsState.tsx       # When no skills exist
```

### Database Schema

```typescript
// skills table
interface Skill {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  goal: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

// skill_metrics table
type MetricValueType = 'number' | 'boolean' | 'percentage' | 'duration' | 'level';

interface SkillMetric {
  id: string;
  skillId: string;
  name: string;
  type: MetricValueType;
  target: number | boolean;
  current: number | boolean;
  unit?: string;
  description?: string;
  order: number;
}

// sub_skills table
type SubSkillStage = 'not_started' | 'practice' | 'feedback' | 'evaluate' | 'complete';

interface SubSkill {
  id: string;
  skillId: string;
  name: string;
  description?: string;
  stage: SubSkillStage;          // Current stage in the cycle
  goal: string;                   // What defines mastery
  metricType: MetricValueType;
  metricTarget: number | boolean;
  metricCurrent: number | boolean;
  metricUnit?: string;
  order: number;
  notes?: string;
  completedAt?: Date;
  taskId?: string;               // Auto-generated task linked to this sub-skill
}

// sub_skill_dependencies table
interface SubSkillDependency {
  id: string;
  subSkillId: string;
  dependsOnId: string;
}
```

### API Endpoints (tRPC)

```typescript
// Skills CRUD
skill.list()                   // List all skills with sub-skill stage counts
skill.get({ id })              // Get skill with all metrics and sub-skills
skill.create({ name, color, goal, metrics, subSkills, ... })
skill.delete({ id })
skill.archive({ id })

// AI Planning
skill.generatePlan({
  goal: string,
  goalMetric: string,
  currentLevel: string,
  gaps: string
}): AISkillPlanResponse

// Metrics
skillMetric.update({ id, current })
skillMetric.bulkUpdate({ metrics: { id, current }[] })

// Sub-skills (see skill-planner.md for full API)
subSkill.list({ skillId })
subSkill.advanceStage({ id })
subSkill.complete({ id })
```

### AI Integration

**Prompt Engineering:**

```typescript
const systemPrompt = `You are a skill development planner.
Given the user's current level, goal, and identified gaps,
create a structured learning plan with sub-skills (building blocks) to master.
Return your response as JSON matching the AISkillPlanResponse schema.

For metrics, include multiple relevant metrics with appropriate types:
- 'number': countable things (songs learned, books read)
- 'boolean': yes/no milestones (can read sheet music, passed exam)
- 'percentage': proficiency levels (0-100)
- 'duration': time-based (hours practiced)
- 'level': ranked levels (grades, certifications)

For sub-skills:
- Break down the skill into learnable building blocks
- Each sub-skill should have a clear, measurable goal
- Include dependencies where one sub-skill requires another
- Order from foundational to advanced`;

const userPrompt = `
Goal: ${goal}
How I'll measure success: ${goalMetric}
Current Level: ${currentLevel}
Gaps/Challenges: ${gaps}

Create a learning plan with:
1. Multiple metrics to track overall progress
2. Sub-skills as building blocks to master
3. Clear goals and metrics for each sub-skill
4. Dependencies between sub-skills where needed
5. Resource recommendations
`;
```

**AI Provider Options:**
- Anthropic Claude
- Local LLM option

## UI/UX Considerations

### Stage Indicator Design

Option 1: Colored dots in a row
```
●●● ●● ● ○○
```

Option 2: Segmented bar
```
[███|██|█|░░]
```

Option 3: Mini pie/donut chart

### Color Picker
- Preset color palette (8-12 colors)
- Custom hex input option
- Preview of color in context

### Progress Visualization
- Sub-skill stage distribution (colored indicators)
- Metric progress bars
- Overall completion percentage

### Form Validation
- Required field validation
- At least 1 sub-skill required
- Goal must be defined for each sub-skill

## Error Handling

- AI generation failure fallback (manual entry)
- Save draft during creation
- Confirmation before delete
- Undo option for destructive actions

## Future Enhancements

- Skill templates (pre-built plans)
- Community shared skills
- Skill import/export
- Time tracking per skill/sub-skill
- Skill dependencies (prerequisite skills)
- Collaboration features
- Metric history graphs
- Metric reminders/check-ins
