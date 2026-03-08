import { z } from 'zod';

/* ---------- Time Series Schemas ---------- */

export const timeSeriesPeriodSchema = z.enum(['week', 'month', 'year']);
export type TimeSeriesPeriod = z.infer<typeof timeSeriesPeriodSchema>;

export const getTimeSeriesSchema = z.object({
  period: timeSeriesPeriodSchema,
});

export const timeSeriesPointSchema = z.object({
  date: z.string(),
  tasks: z.number().int().min(0),
  subSkills: z.number().int().min(0),
  skills: z.number().int().min(0),
});

export type TimeSeriesPoint = z.infer<typeof timeSeriesPointSchema>;

/* ---------- User Metrics Schemas ---------- */

export const userMetricsResponseSchema = z.object({
  // Totals
  tasksCompleted: z.number().int().min(0),
  tasksCreated: z.number().int().min(0),
  subSkillsCompleted: z.number().int().min(0),
  skillsArchived: z.number().int().min(0),

  // Streaks
  currentStreak: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  lastActivityDate: z.string().nullable(),

  // Weekly
  weeklyGoal: z.number().int().min(1),
  weeklyCompleted: z.number().int().min(0),

  // XP/Level
  totalXp: z.number().int().min(0),
  level: z.number().int().min(0),
  xpForCurrentLevel: z.number().int().min(0),
  xpForNextLevel: z.number().int().min(0),
  levelProgress: z.number().min(0).max(100),

  // Computed
  completionRate: z.number().min(0).max(100),
  avgTasksPerDay: z.number().min(0),
});

export type UserMetricsResponse = z.infer<typeof userMetricsResponseSchema>;

/* ---------- Weekly Goal Schemas ---------- */

export const updateWeeklyGoalSchema = z.object({
  weeklyGoal: z.number().int().min(1).max(100),
});

/* ---------- Insights Schemas ---------- */

export const skillEngagementSchema = z.object({
  skillId: z.string().uuid(),
  skillName: z.string(),
  skillColor: z.string(),
  count: z.number().int().min(0),
});

export type SkillEngagement = z.infer<typeof skillEngagementSchema>;

export const stageProgressionSchema = z.object({
  stage: z.enum(['not_started', 'practice', 'evaluate', 'complete']),
  avgDays: z.number().nullable(),
});

export type StageProgression = z.infer<typeof stageProgressionSchema>;

export const featureUsageSchema = z.object({
  metricsUsage: z.number().min(0).max(100),
  recurrenceUsage: z.number().min(0).max(100),
});

export type FeatureUsage = z.infer<typeof featureUsageSchema>;

export const insightsResponseSchema = z.object({
  avgTimeToCompletion: z.number().nullable(),
  abandonmentRate: z.number().min(0).max(100),
  mostProductiveDay: z.string().nullable(),
  skillEngagement: z.array(skillEngagementSchema),
  recurrenceEffectiveness: z.number().nullable(),
  subSkillProgressionRate: z.array(stageProgressionSchema),
  featureUsage: featureUsageSchema,
});

export type InsightsResponse = z.infer<typeof insightsResponseSchema>;
