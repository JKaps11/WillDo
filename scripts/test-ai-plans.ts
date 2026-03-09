import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Output, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from 'dotenv';

import { SYSTEM_PROMPT, calculateCost } from '../src/lib/ai/prompts';

const MODEL = 'gpt-4.1';
import { aiSkillPlanOutputSchema } from '../src/lib/zod-schemas/skill';

config(); // load .env

/* ---------- Types ---------- */

interface TestCase {
  skillName: string;
  goal: string;
  currentLevel?: string;
  additionalContext?: string;
  effort: 'minimal' | 'moderate' | 'detailed';
}

interface TestResult {
  version: 1;
  exportedAt: string;
  testInput: TestCase;
  usage: { inputTokens: number; outputTokens: number; cost: string };
  skill: {
    name: string;
    description: null;
    color: string;
    icon: null;
    goal: string;
  };
  subSkills: Array<{
    name: string;
    description: string;
    stage: 'not_started';
    sortOrder: number;
    parentIndex: number | null;
    metrics: Array<{
      name: string;
      unit: string | null;
      targetValue: number;
      currentValue: number;
    }>;
  }>;
}

/* ---------- Test Cases ---------- */

const MINIMAL_CASES: TestCase[] = [
  { skillName: 'Learn Guitar', goal: 'Play songs', effort: 'minimal' },
  { skillName: 'Cooking', goal: 'Cook dinner for friends', effort: 'minimal' },
  { skillName: 'Public Speaking', goal: 'Give a talk', effort: 'minimal' },
];

const MODERATE_CASES: TestCase[] = [
  {
    skillName: 'Learn Guitar',
    goal: 'Play songs at a campfire',
    currentLevel: 'Never touched a guitar',
    effort: 'moderate',
  },
  {
    skillName: 'Learn Guitar',
    goal: 'Play songs at a campfire',
    currentLevel:
      'Can play basic open chords and switch between G, C, D',
    effort: 'moderate',
  },
  {
    skillName: 'Learn Spanish',
    goal: 'Hold a 30-min conversation with a native speaker',
    currentLevel: 'Complete beginner',
    effort: 'moderate',
  },
  {
    skillName: 'Web Development',
    goal: 'Build and deploy a full-stack app',
    currentLevel: 'Know HTML/CSS basics',
    effort: 'moderate',
  },
];

const DETAILED_CASES: TestCase[] = [
  {
    skillName: 'Oil Painting',
    goal: 'Paint realistic portraits from life in oil on canvas',
    currentLevel:
      "I've been sketching with pencil for 2 years. I can draw faces with decent proportions but I've never used paint. I understand basic shading and perspective from drawing.",
    additionalContext:
      'I have about 5 hours per week to practice. I already own an easel and some basic supplies. I want to focus on portraiture, not landscapes.',
    effort: 'detailed',
  },
  {
    skillName: 'Machine Learning',
    goal: 'Build and deploy a production ML model that solves a real business problem',
    currentLevel:
      "I'm a software engineer with 3 years of Python experience. I understand basic statistics (mean, std dev, distributions). I've done a few tutorials on scikit-learn but never built anything from scratch. I don't know deep learning at all.",
    additionalContext:
      'I work at a startup and want to add ML to our product (recommendation system). I need to understand not just modeling but also data pipelines and deployment. Budget for cloud compute is limited.',
    effort: 'detailed',
  },
  {
    skillName: 'Rock Climbing',
    goal: 'Lead climb 5.11a outdoors consistently',
    currentLevel:
      "I've been bouldering indoors for 6 months, sending V3-V4. I top-rope 5.9-5.10a in the gym. Never climbed outdoors. My footwork is sloppy and I get pumped quickly on sustained routes.",
    additionalContext:
      'I climb 3x/week. I have a partner who leads 5.10c. I want to be ready for outdoor lead climbing by summer. I\'m most weak on endurance and mental game (fear of falling).',
    effort: 'detailed',
  },
];

const TEST_CASES: TestCase[] = [
  ...MINIMAL_CASES,
  ...MODERATE_CASES,
  ...DETAILED_CASES,
];

/* ---------- Run ---------- */

const RESULTS_ROOT = join(import.meta.dirname!, 'ai-plan-results');

async function getNextTestDir(): Promise<string> {
  await mkdir(RESULTS_ROOT, { recursive: true });
  const entries = await readdir(RESULTS_ROOT);
  const testNums = entries
    .filter((e) => e.startsWith('test-'))
    .map((e) => parseInt(e.replace('test-', ''), 10))
    .filter((n) => !isNaN(n));
  const next = testNums.length > 0 ? Math.max(...testNums) + 1 : 1;
  return join(RESULTS_ROOT, `test-${next}`);
}

function buildUserPrompt(tc: TestCase): string {
  return `Skill: "${tc.skillName}"
Goal: ${tc.goal}
Current level: ${tc.currentLevel || 'Not specified'}
${tc.additionalContext ? `Additional context: ${tc.additionalContext}` : ''}
Effort level: ${tc.effort}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function runTestCase(
  openai: ReturnType<typeof createOpenAI>,
  tc: TestCase,
  index: number,
): Promise<{ result: TestResult; pass: boolean; durationMs: number; error?: string }> {
  const label = `[${index + 1}/${TEST_CASES.length}] ${tc.skillName}`;
  console.log(`${label} — generating...`);
  const start = performance.now();

  try {
    const res = await generateText({
      model: openai(MODEL),
      output: Output.object({ schema: aiSkillPlanOutputSchema }),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(tc),
    });

    const plan = res.output;
    const inputTokens = res.usage.inputTokens ?? 0;
    const outputTokens = res.usage.outputTokens ?? 0;
    const cost = calculateCost(inputTokens, outputTokens, MODEL);

    const testResult: TestResult = {
      version: 1,
      exportedAt: new Date().toISOString(),
      testInput: tc,
      usage: { inputTokens, outputTokens, cost },
      skill: {
        name: tc.skillName,
        description: null,
        color: '#3b82f6',
        icon: null,
        goal: tc.goal,
      },
      subSkills: plan.subSkills.map((ss, i) => ({
        name: ss.name,
        description: ss.description,
        stage: 'not_started' as const,
        sortOrder: i,
        parentIndex:
          ss.parentIndex === -1 || ss.parentIndex === undefined
            ? null
            : ss.parentIndex,
        metrics: ss.metrics.map((m) => ({
          name: m.name,
          unit: m.unit ?? null,
          targetValue: m.targetValue,
          currentValue: 0,
        })),
      })),
    };

    const count = plan.subSkills.length;
    const pass = count >= 6 && count <= 15;

    const durationMs = Math.round(performance.now() - start);

    console.log(
      `${label} — ${count} sub-skills, $${cost}, ${durationMs}ms, ${pass ? 'PASS' : 'FAIL'}`,
    );

    return { result: testResult, pass, durationMs };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${label} — ERROR: ${msg}`);
    return {
      result: {
        version: 1,
        exportedAt: new Date().toISOString(),
        testInput: tc,
        usage: { inputTokens: 0, outputTokens: 0, cost: '0' },
        skill: {
          name: tc.skillName,
          description: null,
          color: '#3b82f6',
          icon: null,
          goal: tc.goal,
        },
        subSkills: [],
      },
      pass: false,
      durationMs,
      error: msg,
    };
  }
}

async function main(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set. Add it to .env');
    process.exit(1);
  }

  const outputDir = await getNextTestDir();
  await mkdir(outputDir, { recursive: true });
  console.log(`Writing results to ${outputDir}\n`);

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const summary: Array<{
    skill: string;
    effort: string;
    subSkills: number;
    cost: string;
    time: string;
    status: string;
  }> = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const { result, pass, durationMs, error } = await runTestCase(openai, tc, i);

    const filename = `${String(i + 1).padStart(2, '0')}-${slugify(tc.skillName)}.json`;
    await writeFile(
      join(outputDir, filename),
      JSON.stringify(result, null, 2),
    );

    summary.push({
      skill: tc.skillName,
      effort: tc.effort,
      subSkills: result.subSkills.length,
      cost: `$${result.usage.cost}`,
      time: `${(durationMs / 1000).toFixed(1)}s`,
      status: error ? `ERROR: ${error.slice(0, 50)}` : pass ? 'PASS' : 'FAIL',
    });
  }

  console.log('\n--- Summary ---');
  console.table(summary);

  const totalCost = summary.reduce(
    (acc, s) => acc + parseFloat(s.cost.slice(1)),
    0,
  );
  console.log(`Total cost: $${totalCost.toFixed(6)}`);
}

main();
