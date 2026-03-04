import { z } from 'zod';

import type { NewPracticeEvaluation } from '@/db/schemas/practice_evaluation.schema';

/* ---------- Shared field schemas ---------- */

export const nonEmptyStringArray = z.array(z.string().min(1)).min(1);
export const confidenceLevelSchema = z.number().int().min(1).max(5);

/* ---------- Practice Evaluation Schemas ---------- */

/**
 * Validates input for creating a practice evaluation.
 * The `satisfies` assertion ensures this stays in sync with NewPracticeEvaluation.
 */
export const createPracticeEvaluationSchema = z.object({
  taskId: z.uuid(),
  subSkillId: z.uuid(),
  skillId: z.uuid(),
  occurrenceDate: z.date(),
  title: z.string().min(1),
  wentWell: nonEmptyStringArray,
  struggled: nonEmptyStringArray,
  understandBetter: nonEmptyStringArray,
  feelings: nonEmptyStringArray,
  focusNextTime: nonEmptyStringArray,
  confidenceLevel: confidenceLevelSchema,
}) satisfies z.ZodType<
  Omit<NewPracticeEvaluation, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>
>;

export const evaluationFieldsSchema = createPracticeEvaluationSchema.pick({
  title: true,
  wentWell: true,
  struggled: true,
  understandBetter: true,
  feelings: true,
  focusNextTime: true,
  confidenceLevel: true,
});

export const getPracticeEvaluationSchema = z.object({
  id: z.uuid(),
});

export const listBySubSkillSchema = z.object({
  subSkillId: z.uuid(),
});

export const getLatestBySubSkillSchema = z.object({
  subSkillId: z.uuid(),
});

export const completeTaskWithEvaluationSchema = z.object({
  taskId: z.uuid(),
  occurrenceDate: z.date(),
  evaluation: evaluationFieldsSchema,
});
