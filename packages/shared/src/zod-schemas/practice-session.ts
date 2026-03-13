import { z } from 'zod';
import {
  PROMPT_CATEGORY_VALUES,
  STILL_TRUE_RESPONSE_VALUES,
} from '../db-types';

/* ---------- Enum Schemas ---------- */

export const promptCategorySchema = z.enum(PROMPT_CATEGORY_VALUES);
export const stillTrueResponseValueSchema = z.enum(STILL_TRUE_RESPONSE_VALUES);

/* ---------- Confidence ---------- */

export const confidenceSchema = z.number().int().min(1).max(10);

/* ---------- Sub-schemas ---------- */

export const reflectionResponseSchema = z.object({
  promptKey: z.string().min(1),
  promptText: z.string().min(1),
  promptCategory: promptCategorySchema,
  responseText: z.string().min(1),
  sortOrder: z.number().int().min(0),
});

export const stillTrueInputSchema = z.object({
  sourceSessionId: z.uuid(),
  sourceResponseId: z.uuid().nullable(),
  sourceText: z.string().min(1),
  response: stillTrueResponseValueSchema,
});

/* ---------- Main Schemas ---------- */

export const createPracticeSessionSchema = z.object({
  taskId: z.uuid(),
  occurrenceDate: z.date(),
  title: z.string().min(1).max(200),
  preConfidence: confidenceSchema,
  postConfidence: confidenceSchema,
  reflections: z.array(reflectionResponseSchema).min(1),
  stillTrueResponses: z.array(stillTrueInputSchema).optional(),
});

export const getPrePracticeDataSchema = z.object({
  subSkillId: z.uuid(),
});

export const listSessionsBySubSkillSchema = z.object({
  subSkillId: z.uuid(),
});

export const getSessionSchema = z.object({
  id: z.uuid(),
});

export const completeTaskWithSessionSchema = z.object({
  taskId: z.uuid(),
  occurrenceDate: z.date(),
  session: z.object({
    title: z.string().min(1).max(200),
    preConfidence: confidenceSchema,
    postConfidence: confidenceSchema,
    reflections: z.array(reflectionResponseSchema).min(1),
    stillTrueResponses: z.array(stillTrueInputSchema).optional(),
  }),
});
