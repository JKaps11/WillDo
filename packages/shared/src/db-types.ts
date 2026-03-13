/**
 * Plain TypeScript types mirroring the DB schema inferred types.
 * These avoid pulling in drizzle-orm as a runtime dependency.
 * Enum value arrays are plain `const` arrays for use in Zod schemas.
 */

/* ---------- Enum Value Arrays ---------- */

export const SUB_SKILL_STAGE_VALUES = [
  'not_started',
  'practice',
  'evaluate',
  'complete',
] as const;

export const PRIORITY_VALUES = [
  'Very_Low',
  'Low',
  'Medium',
  'High',
  'Very_High',
] as const;

export const RECURRENCE_END_TYPE_VALUES = [
  'never',
  'after_count',
  'on_date',
] as const;

export const RECURRENCE_FREQUENCY_VALUES = ['daily', 'weekly'] as const;

export const DAYS_OF_WEEK_VALUES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export const APPEARANCE_THEME_VALUES = ['light', 'dark', 'system'] as const;

export const TODO_LIST_TIME_SPAN_VALUES = ['day', 'week'] as const;

export const TODO_LIST_SORT_BY_VALUES = [
  'date',
  'priority',
  'alphabetical',
] as const;

/* ---------- Enum Types ---------- */

export type SubSkillStage = (typeof SUB_SKILL_STAGE_VALUES)[number];
export type Priority = (typeof PRIORITY_VALUES)[number];
export type RecurrenceEndType = (typeof RECURRENCE_END_TYPE_VALUES)[number];
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCY_VALUES)[number];
export type DaysOfWeek = (typeof DAYS_OF_WEEK_VALUES)[number];
export type AppearanceTheme = (typeof APPEARANCE_THEME_VALUES)[number];
export type TodoListTimeSpan = (typeof TODO_LIST_TIME_SPAN_VALUES)[number];
export type TodoListSortBy = (typeof TODO_LIST_SORT_BY_VALUES)[number];

/* ---------- Recurrence Types ---------- */

export type RecurrenceExceptionAction = 'skip' | 'moved';

export interface RecurrenceException {
  originalDate: string;
  action: RecurrenceExceptionAction;
  movedToDate?: string;
}

export interface RecurrenceRule {
  isRecurring: boolean;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: Array<DaysOfWeek>;
  endType: RecurrenceEndType;
  endAfterCount?: number;
  endOnDate?: string;
  exceptions?: Array<RecurrenceException>;
}

/* ---------- User Settings ---------- */

export interface UserSettings {
  appearance: {
    theme: AppearanceTheme;
  };
  todoList: {
    sortBy: TodoListSortBy;
    timeSpan: TodoListTimeSpan;
    showCompleted: boolean;
  };
  notifications: {
    streakWarnings: boolean;
    nudges: boolean;
    celebrations: boolean;
    taskReminders: boolean;
  };
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  appearance: {
    theme: 'system',
  },
  todoList: {
    sortBy: 'priority',
    timeSpan: 'week',
    showCompleted: true,
  },
  notifications: {
    streakWarnings: true,
    nudges: true,
    celebrations: true,
    taskReminders: true,
  },
};

/* ---------- Entity Types ---------- */

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  goal: string | null;
  archived: boolean;
  archivedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date;
}

export interface SubSkill {
  id: string;
  userId: string;
  skillId: string;
  parentSubSkillId: string | null;
  name: string;
  description: string | null;
  stage: SubSkillStage;
  sortOrder: number;
  updatedAt: Date | null;
  createdAt: Date;
}

export interface SkillMetric {
  id: string;
  userId: string;
  subSkillId: string;
  name: string;
  unit: string | null;
  targetValue: number;
  currentValue: number;
  updatedAt: Date | null;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  todoListDate: Date | null;
  name: string;
  description: string | null;
  priority: Priority;
  dueDate: Date | null;
  completed: boolean;
  subSkillId: string;
  recurrenceRule: RecurrenceRule | null;
  updatedAt: Date | null;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  settings: UserSettings;
  activeSkillId: string | null;
}

export const PROMPT_CATEGORY_VALUES = [
  'self_assessment',
  'insight_extraction',
  'forward_looking',
  'meta_cognitive',
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORY_VALUES)[number];

export const STILL_TRUE_RESPONSE_VALUES = [
  'still_struggling',
  'improved',
  'resolved',
] as const;

export type StillTrueResponseValue =
  (typeof STILL_TRUE_RESPONSE_VALUES)[number];

export interface PracticeSession {
  id: string;
  userId: string;
  taskId: string;
  subSkillId: string;
  skillId: string;
  occurrenceDate: Date;
  title: string;
  preConfidence: number;
  postConfidence: number | null;
  iterationNumber: number;
  completedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date;
}

export interface SessionReflectionResponse {
  id: string;
  sessionId: string;
  promptKey: string;
  promptText: string;
  promptCategory: PromptCategory;
  responseText: string;
  sortOrder: number;
  createdAt: Date;
}

export interface StillTrueResponse {
  id: string;
  sessionId: string;
  sourceSessionId: string;
  sourceResponseId: string | null;
  sourceText: string;
  response: StillTrueResponseValue;
  createdAt: Date;
}
