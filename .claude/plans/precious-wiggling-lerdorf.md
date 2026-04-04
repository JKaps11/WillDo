# Screenshot Capture Plan

Create a Playwright script to capture screenshots for all 24 image placeholders in the app.

## Summary

- **24 total placeholders**: 4 on landing page, 20 in help content
- **Approach**: Playwright script that seeds realistic test data, captures screenshots, then updates components to use actual images

---

## Files to Create

### 1. `tests/screenshots/capture-screenshots.spec.ts`
Main Playwright spec that:
- Seeds test data (2 skills with sub-skills at various stages, tasks scheduled across the week)
- Captures all 24 screenshots with proper viewport sizes
- Saves to `public/images/screenshots/`

### 2. `tests/screenshots/screenshot-data.ts`
Data seeding helpers:
- `seedScreenshotData(page)` - creates realistic skills, sub-skills, tasks
- `cleanupScreenshotData(page)` - removes test data after capture
- Uses `SCREENSHOT_` prefix for easy identification/cleanup

---

## Files to Modify

### 1. `tests/helpers/api.helpers.ts`
Add new helpers:
- `updateSubSkillStageViaAPI()` - set sub-skills to specific stages
- `updateSubSkillMetricsViaAPI()` - set metric progress values

### 2. `playwright.config.ts`
Add `screenshots` project:
```typescript
{
  name: 'screenshots',
  testDir: './tests/screenshots',
  use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/user.json' },
  dependencies: ['setup'],
}
```

### 3. `src/routes/index.tsx`
Update `ImagePlaceholder` to `ScreenshotImage` component that uses actual images from `/images/screenshots/landing-{id}.png`

### 4. `src/components/help/HelpContent.tsx`
Update `ImagePlaceholder` to use actual images from `/images/screenshots/help-{section}-{slug}.png`

---

## Screenshot List

### Landing Page (4)
| ID | Caption | Capture Source |
|----|---------|----------------|
| `landing-hero-dashboard` | Dashboard overview | Full dashboard page |
| `landing-feature-skill-planner` | Skill planner flowchart | Planner with nodes visible |
| `landing-feature-stages` | Sub-skill stages | Edit panel showing stages |
| `landing-feature-todolist` | Todo list weekly | Todo list with tasks |

### Help Content (20)
| File Slug | Caption | Capture Source |
|-----------|---------|----------------|
| `getting-started-overview` | Will Do Dashboard Overview | Dashboard |
| `getting-started-stages` | Sub-skill stages visualization | Stage indicators |
| `getting-started-workflow` | Quick start workflow diagram | Custom SVG graphic |
| `dashboard-full` | Dashboard full view | Full dashboard |
| `dashboard-task-card` | Task card anatomy | Single task card element |
| `dashboard-skills-panel` | Skills overview panel | Right panel of dashboard |
| `skills-hub-overview` | Skills Hub overview | Skills hub page |
| `skills-hub-basic-info` | Skill creation - Basic Info | New skill form step 1 |
| `skills-hub-ai-planning` | AI Planning interface | New skill form step 2 |
| `skills-hub-card` | Skill card anatomy | Single skill card |
| `planner-canvas` | Skill Planner canvas view | Full planner |
| `planner-node` | Sub-skill node anatomy | Single node |
| `planner-edit-panel` | Sub-skill edit panel | Panel when node selected |
| `planner-create-modal` | Create sub-skill modal | Create modal open |
| `todo-weekly` | Todo List weekly view | Full todo list |
| `todo-task-card` | Task card in todo list | Task card element |
| `todo-assign-panel` | Assign Tasks panel | Sheet open |
| `todo-schedule-modal` | Schedule modal with recurrence | Modal open |
| `tips-recurring` | Example of recurring task setup | Recurring modal filled |
| `tips-celebration` | Completed skill celebration | Skill with all complete |

---

## Test Data to Create

**Skill 1: "Learn Spanish"**
- Color: `#3b82f6` (blue), Icon: 🇪🇸
- Sub-skills:
  - "Basic Vocabulary" → Complete stage (green)
  - "Grammar Fundamentals" → Evaluate stage (amber)
  - "Listening Practice" → Practice stage (blue)
  - "Speaking Practice" → Practice stage (blue)
  - "Reading Comprehension" → Not Started (gray)

**Skill 2: "Learn Guitar"**
- Color: `#8b5cf6` (purple), Icon: 🎸
- 3 sub-skills at various stages

**Tasks**: 8-10 tasks spread across the current week, mix of:
- One-time tasks
- Recurring tasks
- Different priorities
- Some completed, some pending

---

## Implementation Steps

1. Create `tests/screenshots/screenshot-data.ts` with seed/cleanup functions
2. Add new API helpers to `tests/helpers/api.helpers.ts`
3. Add screenshots project to `playwright.config.ts`
4. Create `tests/screenshots/capture-screenshots.spec.ts`
5. Run: `bunx playwright test --project=screenshots`
6. Create `public/images/screenshots/help-getting-started-workflow.svg` - simple workflow diagram showing: Create Skill → Add Sub-skills → Schedule Tasks → Practice Daily → Track Progress
7. Update `ImagePlaceholder` in both files to use actual images
8. Verify all images display correctly

---

## Run Command

```bash
bunx playwright test --project=screenshots
```

---

## Verification

1. Check all 24 images exist in `public/images/screenshots/`
2. Run `bun run dev` and verify:
   - Landing page shows all 4 images
   - Help pages show all 20 images
3. Images are properly sized and cropped for their contexts
