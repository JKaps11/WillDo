import type { Page } from '@playwright/test';
import superjson from 'superjson';

const BASE_URL = 'http://localhost:3000';
const TRPC_URL = `${BASE_URL}/api/trpc`;

/** Known screenshot skill names for cleanup of leftover data from previous runs */
const SCREENSHOT_SKILL_NAMES = ['Learn Spanish', 'Learn Guitar'];

interface SkillResult {
  id: string;
  name: string;
  color: string;
}

interface SubSkillResult {
  id: string;
  name: string;
  stage: string;
}

interface MetricResult {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
}

interface TaskResult {
  id: string;
  name: string;
}

interface ScreenshotData {
  skills: Array<SkillResult>;
  subSkills: Array<SubSkillResult>;
  tasks: Array<TaskResult>;
}

async function trpcMutate<T>(
  page: Page,
  procedure: string,
  input: unknown,
): Promise<T> {
  const serialized = superjson.serialize(input);
  const res = await page.request.post(`${TRPC_URL}/${procedure}`, {
    data: serialized,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`tRPC ${procedure} failed (${res.status()}): ${text}`);
  }

  const body = await res.json();
  const data = body.result?.data;
  if (data && data.meta) {
    return superjson.deserialize(data) as T;
  }
  return data?.json ?? data ?? body;
}

async function trpcQuery<T>(
  page: Page,
  procedure: string,
  input: unknown,
): Promise<T> {
  const serialized = superjson.serialize(input);
  const encodedInput = encodeURIComponent(JSON.stringify(serialized));
  const res = await page.request.get(
    `${TRPC_URL}/${procedure}?input=${encodedInput}`,
  );

  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`tRPC ${procedure} failed (${res.status()}): ${text}`);
  }

  const body = await res.json();
  const data = body.result?.data;
  if (data && data.meta) {
    return superjson.deserialize(data) as T;
  }
  return data?.json ?? data ?? body;
}

/**
 * Creates a skill with the given configuration
 */
async function createSkill(
  page: Page,
  opts: { name: string; color: string; icon?: string; goal?: string },
): Promise<SkillResult> {
  return trpcMutate<SkillResult>(page, 'skill.create', {
    name: opts.name,
    color: opts.color,
    icon: opts.icon,
    goal: opts.goal,
  });
}

/**
 * Creates a sub-skill for a skill
 */
async function createSubSkill(
  page: Page,
  opts: {
    skillId: string;
    name: string;
    description?: string;
    parentSubSkillId?: string;
    metrics?: Array<{ name: string; unit?: string; targetValue: number }>;
  },
): Promise<SubSkillResult> {
  return trpcMutate<SubSkillResult>(page, 'subSkill.create', {
    skillId: opts.skillId,
    name: opts.name,
    description: opts.description,
    parentSubSkillId: opts.parentSubSkillId,
    metrics: opts.metrics,
  });
}

/**
 * Updates a sub-skill's stage directly
 */
async function updateSubSkillStage(
  page: Page,
  id: string,
  stage: 'not_started' | 'practice' | 'evaluate' | 'complete',
): Promise<SubSkillResult> {
  return trpcMutate<SubSkillResult>(page, 'subSkill.update', {
    id,
    stage,
  });
}

/**
 * Updates a metric's current value
 */
async function updateMetric(
  page: Page,
  id: string,
  currentValue: number,
): Promise<MetricResult> {
  return trpcMutate<MetricResult>(page, 'skillMetric.update', {
    id,
    currentValue,
  });
}

/**
 * Gets metrics for a sub-skill
 */
async function getMetricsBySubSkill(
  page: Page,
  subSkillId: string,
): Promise<Array<MetricResult>> {
  return trpcQuery<Array<MetricResult>>(page, 'skillMetric.listBySubSkill', {
    subSkillId,
  });
}

/**
 * Creates a task linked to a sub-skill
 */
async function createTask(
  page: Page,
  opts: {
    name: string;
    subSkillId: string;
    todoListDate?: Date;
    priority?: 'Very_Low' | 'Low' | 'Medium' | 'High' | 'Very_High';
    recurrenceRule?: {
      isRecurring: boolean;
      frequency: 'daily' | 'weekly';
      interval: number;
      daysOfWeek?: Array<
        | 'sunday'
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
      >;
      endType: 'never' | 'after_count' | 'on_date';
      endAfterCount?: number;
      endOnDate?: string;
    };
  },
): Promise<TaskResult> {
  return trpcMutate<TaskResult>(page, 'task.create', {
    name: opts.name,
    subSkillId: opts.subSkillId,
    todoListDate: opts.todoListDate,
    priority: opts.priority,
    recurrenceRule: opts.recurrenceRule,
  });
}

/**
 * Marks a task as completed
 */
async function completeTask(page: Page, id: string): Promise<void> {
  await trpcMutate(page, 'task.completeWithMetricUpdate', { id, completed: true });
}

/**
 * Deletes a skill by ID
 */
async function deleteSkill(page: Page, id: string): Promise<void> {
  await trpcMutate(page, 'skill.delete', { id });
}

/**
 * Sets the user's active skill
 */
async function setActiveSkill(page: Page, skillId: string): Promise<void> {
  await trpcMutate(page, 'user.setActiveSkill', { skillId });
}

/**
 * Gets the current week's dates (Monday to Sunday)
 */
function getCurrentWeekDates(): Array<Date> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const dates: Array<Date> = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Returns today's date at midnight
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Seeds realistic test data for screenshots
 */
export async function seedScreenshotData(page: Page): Promise<ScreenshotData> {
  const skills: Array<SkillResult> = [];
  const subSkills: Array<SubSkillResult> = [];
  const tasks: Array<TaskResult> = [];
  const weekDates = getCurrentWeekDates();
  const today = getToday();

  // Skill 1: Learn Spanish
  const spanishSkill = await createSkill(page, {
    name: 'Learn Spanish',
    color: '#3b82f6',
    icon: '🇪🇸',
    goal: 'Achieve conversational fluency in Spanish',
  });
  skills.push(spanishSkill);

  // Set Spanish as active skill
  await setActiveSkill(page, spanishSkill.id);

  // Create Spanish sub-skills
  const basicVocab = await createSubSkill(page, {
    skillId: spanishSkill.id,
    name: 'Basic Vocabulary',
    description: 'Learn common words and phrases',
    metrics: [
      { name: 'Words Learned', unit: 'words', targetValue: 100 },
      { name: 'Practice Sessions', unit: 'sessions', targetValue: 20 },
    ],
  });
  subSkills.push(basicVocab);

  const grammar = await createSubSkill(page, {
    skillId: spanishSkill.id,
    name: 'Grammar Fundamentals',
    description: 'Master basic Spanish grammar rules',
    metrics: [
      { name: 'Lessons Completed', unit: 'lessons', targetValue: 15 },
      { name: 'Exercises Done', unit: 'exercises', targetValue: 50 },
    ],
  });
  subSkills.push(grammar);

  const listening = await createSubSkill(page, {
    skillId: spanishSkill.id,
    name: 'Listening Practice',
    description: 'Improve comprehension through audio',
    parentSubSkillId: basicVocab.id,
    metrics: [
      { name: 'Hours Listened', unit: 'hours', targetValue: 10 },
      { name: 'Podcasts Completed', unit: 'podcasts', targetValue: 20 },
    ],
  });
  subSkills.push(listening);

  const speaking = await createSubSkill(page, {
    skillId: spanishSkill.id,
    name: 'Speaking Practice',
    description: 'Build conversational confidence',
    parentSubSkillId: basicVocab.id,
    metrics: [
      { name: 'Conversations', unit: 'sessions', targetValue: 15 },
      { name: 'Minutes Spoken', unit: 'minutes', targetValue: 300 },
    ],
  });
  subSkills.push(speaking);

  const reading = await createSubSkill(page, {
    skillId: spanishSkill.id,
    name: 'Reading Comprehension',
    description: 'Read and understand Spanish texts',
    parentSubSkillId: grammar.id,
    metrics: [
      { name: 'Articles Read', unit: 'articles', targetValue: 25 },
      { name: 'Books Completed', unit: 'books', targetValue: 3 },
    ],
  });
  subSkills.push(reading);

  // Update stages and metrics for Spanish sub-skills
  // Basic Vocabulary - Complete (green)
  await updateSubSkillStage(page, basicVocab.id, 'complete');
  const vocabMetrics = await getMetricsBySubSkill(page, basicVocab.id);
  for (const metric of vocabMetrics) {
    await updateMetric(page, metric.id, metric.targetValue);
  }

  // Grammar - Evaluate (amber)
  await updateSubSkillStage(page, grammar.id, 'evaluate');
  const grammarMetrics = await getMetricsBySubSkill(page, grammar.id);
  for (const metric of grammarMetrics) {
    await updateMetric(page, metric.id, Math.floor(metric.targetValue * 0.8));
  }

  // Listening - Practice (blue)
  await updateSubSkillStage(page, listening.id, 'practice');
  const listeningMetrics = await getMetricsBySubSkill(page, listening.id);
  for (const metric of listeningMetrics) {
    await updateMetric(page, metric.id, Math.floor(metric.targetValue * 0.5));
  }

  // Speaking - Practice (blue)
  await updateSubSkillStage(page, speaking.id, 'practice');
  const speakingMetrics = await getMetricsBySubSkill(page, speaking.id);
  for (const metric of speakingMetrics) {
    await updateMetric(page, metric.id, Math.floor(metric.targetValue * 0.3));
  }

  // Reading - Not Started (gray) - leave as default

  // Skill 2: Learn Guitar
  const guitarSkill = await createSkill(page, {
    name: 'Learn Guitar',
    color: '#8b5cf6',
    icon: '🎸',
    goal: 'Play songs confidently',
  });
  skills.push(guitarSkill);

  // Create Guitar sub-skills
  const chords = await createSubSkill(page, {
    skillId: guitarSkill.id,
    name: 'Basic Chords',
    description: 'Learn essential open chords',
    metrics: [
      { name: 'Chords Mastered', unit: 'chords', targetValue: 8 },
      { name: 'Practice Days', unit: 'days', targetValue: 30 },
    ],
  });
  subSkills.push(chords);

  const strumming = await createSubSkill(page, {
    skillId: guitarSkill.id,
    name: 'Strumming Patterns',
    description: 'Develop rhythm and timing',
    parentSubSkillId: chords.id,
    metrics: [
      { name: 'Patterns Learned', unit: 'patterns', targetValue: 10 },
      { name: 'Practice Sessions', unit: 'sessions', targetValue: 25 },
    ],
  });
  subSkills.push(strumming);

  const songs = await createSubSkill(page, {
    skillId: guitarSkill.id,
    name: 'Song Repertoire',
    description: 'Learn complete songs',
    parentSubSkillId: strumming.id,
    metrics: [
      { name: 'Songs Learned', unit: 'songs', targetValue: 5 },
      { name: 'Hours Practiced', unit: 'hours', targetValue: 20 },
    ],
  });
  subSkills.push(songs);

  // Update guitar sub-skills
  await updateSubSkillStage(page, chords.id, 'evaluate');
  const chordsMetrics = await getMetricsBySubSkill(page, chords.id);
  for (const metric of chordsMetrics) {
    await updateMetric(page, metric.id, Math.floor(metric.targetValue * 0.9));
  }

  await updateSubSkillStage(page, strumming.id, 'practice');
  const strummingMetrics = await getMetricsBySubSkill(page, strumming.id);
  for (const metric of strummingMetrics) {
    await updateMetric(page, metric.id, Math.floor(metric.targetValue * 0.4));
  }

  // Create tasks — mix of today tasks (for dashboard) and weekly tasks (for todo list)

  // TODAY tasks — these show up on the Dashboard "Today's Tasks"
  const todayTask1 = await createTask(page, {
    name: 'Practice Spanish vocabulary',
    subSkillId: listening.id,
    todoListDate: today,
    priority: 'High',
    recurrenceRule: {
      isRecurring: true,
      frequency: 'daily',
      interval: 1,
      endType: 'never',
    },
  });
  tasks.push(todayTask1);

  const todayTask2 = await createTask(page, {
    name: 'Complete grammar exercises',
    subSkillId: grammar.id,
    todoListDate: today,
    priority: 'High',
  });
  tasks.push(todayTask2);

  const todayTask3 = await createTask(page, {
    name: 'Practice chord transitions',
    subSkillId: chords.id,
    todoListDate: today,
    priority: 'Medium',
    recurrenceRule: {
      isRecurring: true,
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: ['monday', 'wednesday', 'friday'],
      endType: 'never',
    },
  });
  tasks.push(todayTask3);

  const todayTask4 = await createTask(page, {
    name: 'Listen to Spanish podcast',
    subSkillId: listening.id,
    todoListDate: today,
    priority: 'Medium',
  });
  tasks.push(todayTask4);

  // WEEKLY tasks — spread across other days for the todo list weekly view
  const spanishTask3 = await createTask(page, {
    name: 'Practice speaking with tutor',
    subSkillId: speaking.id,
    todoListDate: weekDates[3], // Thursday
    priority: 'Very_High',
  });
  tasks.push(spanishTask3);

  const guitarTask2 = await createTask(page, {
    name: 'Learn new strumming pattern',
    subSkillId: strumming.id,
    todoListDate: weekDates[2], // Wednesday
    priority: 'Medium',
  });
  tasks.push(guitarTask2);

  const guitarTask3 = await createTask(page, {
    name: 'Practice "Wonderwall"',
    subSkillId: songs.id,
    todoListDate: weekDates[4], // Friday
    priority: 'Low',
  });
  tasks.push(guitarTask3);

  const guitarTask4 = await createTask(page, {
    name: 'Review chord shapes',
    subSkillId: chords.id,
    todoListDate: weekDates[5], // Saturday
    priority: 'Low',
  });
  tasks.push(guitarTask4);

  // UNASSIGNED tasks — for the Assign Tasks panel screenshot
  const unassignedTask1 = await createTask(page, {
    name: 'Read Spanish news article',
    subSkillId: reading.id,
    priority: 'Medium',
  });
  tasks.push(unassignedTask1);

  const unassignedTask2 = await createTask(page, {
    name: 'Practice finger picking',
    subSkillId: songs.id,
    priority: 'Low',
  });
  tasks.push(unassignedTask2);

  // Mark one today-task as completed for a realistic dashboard
  await completeTask(page, todayTask1.id);

  return { skills, subSkills, tasks };
}

/**
 * Cleans up screenshot test data by deleting skills by ID.
 * Also cleans up any leftover data from previous failed runs by matching known names,
 * and removes E2E test data.
 */
export async function cleanupScreenshotData(
  page: Page,
  skillIds?: Array<string>,
): Promise<void> {
  // Delete by stored IDs if available (afterAll cleanup)
  if (skillIds) {
    for (const id of skillIds) {
      try {
        await deleteSkill(page, id);
      } catch {
        // Skill may already be deleted
      }
    }
  }

  // Also clean up any leftover data from previous failed runs
  const allSkills = await trpcQuery<Array<{ id: string; name: string }>>(
    page,
    'skill.list',
    { includeArchived: true },
  );

  for (const skill of allSkills) {
    if (
      SCREENSHOT_SKILL_NAMES.includes(skill.name) ||
      skill.name.startsWith('SCREENSHOT_') ||
      skill.name.startsWith('E2E_') ||
      skill.name.startsWith('E2E ')
    ) {
      try {
        await deleteSkill(page, skill.id);
      } catch {
        // Already deleted
      }
    }
  }
}
