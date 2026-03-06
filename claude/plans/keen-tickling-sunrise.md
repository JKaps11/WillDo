# AI Task Creation Improvements

## Context
The AI skill plan generator (GPT-4.1-nano) produces trees that feel incomplete and don't form a convincing roadmap from current ability to goal. Two changes: (1) add a "where are you now" input, (2) rewrite the system prompt with a structured thinking process and self-verification.

## Research: Train a Model vs Use GPT?

**Recommendation: Keep using a GPT model.** Reasons:
- **Scale**: <100 users. Fine-tuning cost (data collection, training, maintenance) far exceeds API costs
- **Data**: No training dataset of "good skill trees" exists. You'd need hundreds of curated examples
- **Quality ceiling**: GPT-4.1-nano is cheap ($0.0001/1K in). A better prompt on a slightly larger model (e.g. gpt-4.1-mini) would outperform a fine-tuned nano model
- **Flexibility**: Prompt changes deploy instantly. Fine-tuned models require retraining
- **When training WOULD make sense**: 10K+ plans/day, a curated dataset of 500+ ideal skill trees, or if you need offline/edge inference

**Optional upgrade path**: If prompt improvements aren't enough on nano, bump to `gpt-4.1-mini` (~10x cost but still very cheap at scale). Only consider fine-tuning after you've collected enough user-edited plans as training data.

## Changes

### 1. Add "Current Level" Free-Text Input

**Files:**
- `src/lib/zod-schemas/skill.ts` — add `currentLevel` to `generateSkillPlanSchema`
- `src/components/skills-hub/SkillForm/AIPlanning.tsx` — add textarea for current level
- `src/lib/ai/skill-planner.server.ts` — include in user prompt
- `src/integrations/trpc/routes/ai_planning.trpc.ts` — pass through (should auto-propagate from schema)

**UI**: New textarea on AIPlanning step, between "Skill Summary" and "Additional Context":
```
Label: "Where are you now?"
Placeholder: "Describe your current experience or ability level with this skill..."
```

**Schema change** in `generateSkillPlanSchema`:
```ts
currentLevel: z.string().optional(),
```

### 2. Rewrite System Prompt

Replace the current generic system prompt with a structured chain-of-thought prompt. Key principles from your feedback:

**Thinking process** (goal-first, backward planning):
1. Start at the goal — what does mastery look like?
2. Identify 3-5 major milestones between current level and goal
3. For each milestone, break into concrete sub-skills
4. Wire dependencies: what must come before what?
5. Self-verify the tree

**Self-verification questions** the AI must answer before outputting:
- Does the first sub-skill match where the user currently is?
- Is there a clear path from start to goal with no gaps?
- Are dependencies correct (no circular, no missing prereqs)?
- Are metrics concrete and achievable (not vague)?
- Would a learner at the stated level understand what to do first?

**File:** `src/lib/ai/skill-planner.server.ts`

New prompt structure (rough draft):
```
You are an expert learning path designer. You create skill trees — directed graphs of sub-skills that form a complete roadmap from a learner's current level to their goal.

## What a Skill Tree Looks Like
- A root node (or nodes) represents the learner's starting point
- Nodes branch out toward the goal, each representing a discrete sub-skill
- Edges represent prerequisites (child depends on parent)
- Leaf nodes closest to the goal represent advanced sub-skills
- Each node has 1-3 measurable metrics

## Your Thinking Process
1. GOAL ANALYSIS: What does achieving the goal look like concretely?
2. CURRENT STATE: What can the learner already do? What's the gap?
3. MILESTONES: Identify 3-5 major milestones between current state and goal
4. DECOMPOSITION: Break each milestone into 1-3 sub-skills (total 6-15)
5. DEPENDENCIES: Wire parent→child relationships. Root nodes = starting points
6. METRICS: Add 1-3 concrete, countable metrics per sub-skill

## Self-Verification (check before outputting)

### Path & Structure
- Does the first sub-skill(s) match what someone at the user's level should work on next?
- Is there a clear, gap-free path from roots to the goal?
- Are all dependencies valid (no cycles, no missing prereqs)?
- Could a learner follow this tree without needing outside guidance on what to do next?

### Completeness & Coverage
- Does the tree cover the full scope needed to reach the goal?
- Are there any major topics or abilities missing that a learner would need?
- If someone completed every sub-skill, would they actually achieve the stated goal?
- Are there implicit prerequisites that aren't represented as sub-skills?

### Quality & Practicality
- Are metrics specific and countable (not "understand X" but "complete X exercises")?
- Is each sub-skill scoped to something achievable in days/weeks, not months?
- Are sub-skills distinct from each other with minimal overlap?
- Is the difficulty progression gradual — no sudden jumps in complexity?
- Would a practitioner in this domain agree this is a reasonable learning path?

## Rules
- 6-15 sub-skills total
- Each sub-skill: name, description, 1-3 metrics, parentIndex
- parentIndex: null for root nodes, otherwise index of prerequisite
- Be domain-specific — no generic filler sub-skills
- Metrics must be countable with clear targets
```

User prompt update to include current level:
```
Skill: "{skillName}"
Goal: {goal}
Current level: {currentLevel || "Complete beginner"}
{additionalContext ? `Additional context: ${additionalContext}` : ''}
```

### 3. AI Prompt Testing Pipeline

**Goal**: Standalone script to batch-test the AI prompt with various inputs and output results as exportable JSON. No app server, auth, or DB required.

**Design**: A single bun script (`scripts/test-ai-plans.ts`) that:
1. Defines an array of test cases (simulated user inputs)
2. Calls OpenAI directly using the same prompt + schema from `skill-planner.server.ts`
3. Outputs each result as a JSON file matching the app's export format
4. Prints a summary table (skill name, # sub-skills, cost, pass/fail)

**Why standalone** (not through tRPC/Playwright):
- No auth, DB, or running server needed
- Fast iteration on prompt changes — edit prompt, run script, inspect output
- Reuses the exact same `SYSTEM_PROMPT`, `aiSkillPlanOutputSchema`, and `MODEL` constants by importing them
- Outputs in the app's import format so you can import results to visually inspect the tree

**Files:**
- `scripts/test-ai-plans.ts` — main script
- `scripts/ai-plan-results/` — output directory (gitignored)

**Script structure:**
```ts
// 1. Test cases array
// --- MINIMAL INPUT (bare minimum, no current level, no context) ---
const MINIMAL_CASES = [
  { skillName: "Learn Guitar", goal: "Play songs" },
  { skillName: "Cooking", goal: "Cook dinner for friends" },
  { skillName: "Public Speaking", goal: "Give a talk" },
]

// --- MODERATE INPUT (goal + current level, no extra context) ---
const MODERATE_CASES = [
  { skillName: "Learn Guitar", goal: "Play songs at a campfire", currentLevel: "Never touched a guitar" },
  { skillName: "Learn Guitar", goal: "Play songs at a campfire", currentLevel: "Can play basic open chords and switch between G, C, D" },
  { skillName: "Learn Spanish", goal: "Hold a 30-min conversation with a native speaker", currentLevel: "Complete beginner" },
  { skillName: "Web Development", goal: "Build and deploy a full-stack app", currentLevel: "Know HTML/CSS basics" },
]

// --- DETAILED INPUT (rich context, specific constraints, detailed current level) ---
const DETAILED_CASES = [
  {
    skillName: "Oil Painting",
    goal: "Paint realistic portraits from life in oil on canvas",
    currentLevel: "I've been sketching with pencil for 2 years. I can draw faces with decent proportions but I've never used paint. I understand basic shading and perspective from drawing.",
    additionalContext: "I have about 5 hours per week to practice. I already own an easel and some basic supplies. I want to focus on portraiture, not landscapes."
  },
  {
    skillName: "Machine Learning",
    goal: "Build and deploy a production ML model that solves a real business problem",
    currentLevel: "I'm a software engineer with 3 years of Python experience. I understand basic statistics (mean, std dev, distributions). I've done a few tutorials on scikit-learn but never built anything from scratch. I don't know deep learning at all.",
    additionalContext: "I work at a startup and want to add ML to our product (recommendation system). I need to understand not just modeling but also data pipelines and deployment. Budget for cloud compute is limited."
  },
  {
    skillName: "Rock Climbing",
    goal: "Lead climb 5.11a outdoors consistently",
    currentLevel: "I've been bouldering indoors for 6 months, sending V3-V4. I top-rope 5.9-5.10a in the gym. Never climbed outdoors. My footwork is sloppy and I get pumped quickly on sustained routes.",
    additionalContext: "I climb 3x/week. I have a partner who leads 5.10c. I want to be ready for outdoor lead climbing by summer. I'm most weak on endurance and mental game (fear of falling)."
  },
]

const TEST_CASES = [...MINIMAL_CASES, ...MODERATE_CASES, ...DETAILED_CASES]

// 2. For each case: call OpenAI with SYSTEM_PROMPT + user prompt + aiSkillPlanOutputSchema
// 3. Convert output to app export format (version: 1, exportedAt, skill, subSkills)
// 4. Write to scripts/ai-plan-results/{skillName}-{timestamp}.json
// 5. Print summary table
```

**Import challenge**: `skill-planner.server.ts` has a `.server.ts` extension (Vite strips these in client builds) and imports DB/logging modules. Two options:

- **Option A (recommended)**: Extract `SYSTEM_PROMPT` and `MODEL` into a shared constants file (`src/lib/ai/prompts.ts`) that both the server function and test script can import. `aiSkillPlanOutputSchema` already lives in `src/lib/zod-schemas/skill.ts` which is importable.
- **Option B**: Duplicate the prompt string in the test script (simpler but drifts).

Going with **Option A**:
- New file: `src/lib/ai/prompts.ts` — exports `SYSTEM_PROMPT` and `MODEL`
- `skill-planner.server.ts` imports from `./prompts`
- `scripts/test-ai-plans.ts` imports from `../src/lib/ai/prompts`

**Output format** (matches app import schema for visual inspection):
```json
{
  "version": 1,
  "exportedAt": "2026-03-05T...",
  "testInput": { "skillName": "...", "goal": "...", "currentLevel": "..." },
  "usage": { "inputTokens": 0, "outputTokens": 0, "cost": "0.001234" },
  "skill": { "name": "...", "description": null, "color": "#3b82f6", "icon": null, "goal": "..." },
  "subSkills": [
    { "name": "...", "description": "...", "stage": "not_started", "sortOrder": 0, "parentIndex": null, "metrics": [...] }
  ]
}
```

**Run command**: `bun run scripts/test-ai-plans.ts`
Add to package.json: `"test:ai": "bun run scripts/test-ai-plans.ts"`

## Verification
1. Run `bun run check` — no lint/type errors
2. Start dev server, create a new skill with AI planning
3. Verify new "Where are you now?" textarea appears
4. Run `bun run test:ai` — generates plan JSONs in `scripts/ai-plan-results/`
5. Import a generated JSON via the app's import feature to visually inspect the tree
6. Compare beginner vs intermediate plans for same skill — roots should differ
