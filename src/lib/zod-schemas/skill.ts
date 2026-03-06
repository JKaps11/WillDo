import { z } from 'zod';
import { subSkillStageEnum } from '@/db/schemas/sub_skill.schema';

/* ---------- Stage Schema ---------- */

export const subSkillStageSchema = z.enum(subSkillStageEnum.enumValues);

/* ---------- Skill Schemas ---------- */

export const createSkillSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  goal: z.string().optional(),
});

export const updateSkillSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

export const getSkillSchema = z.object({
  id: z.uuid(),
});

export const deleteSkillSchema = z.object({
  id: z.uuid(),
});

export const listSkillsSchema = z.object({
  includeArchived: z.boolean().optional(),
});

/* ---------- Sub-Skill Schemas ---------- */

export const createSubSkillMetricSchema = z.object({
  name: z.string().min(1).max(255),
  unit: z.string().optional(),
  targetValue: z.number().int().positive().default(1),
  currentValue: z.number().int().min(0).default(0),
});

export const createSubSkillSchema = z.object({
  skillId: z.uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  stage: subSkillStageSchema.optional(),
  sortOrder: z.number().int().optional(),
  parentSubSkillId: z.uuid().nullable().optional(),
  metrics: z.array(createSubSkillMetricSchema).optional(),
});

export const updateSubSkillSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  stage: subSkillStageSchema.optional(),
  sortOrder: z.number().int().optional(),
  parentSubSkillId: z.uuid().nullable().optional(),
});

export const getSubSkillSchema = z.object({
  id: z.uuid(),
});

export const deleteSubSkillSchema = z.object({
  id: z.uuid(),
});

export const listSubSkillsSchema = z.object({
  skillId: z.uuid(),
});

export const advanceSubSkillStageSchema = z.object({
  id: z.uuid(),
});

export const completeSubSkillSchema = z.object({
  id: z.uuid(),
});

/* ---------- Skill Metric Schemas ---------- */

export const createSkillMetricSchema = z.object({
  subSkillId: z.uuid(),
  name: z.string().min(1).max(255),
  unit: z.string().optional(),
  targetValue: z.number().int().positive().optional(),
  currentValue: z.number().int().min(0).optional(),
});

export const updateSkillMetricSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255).optional(),
  unit: z.string().nullable().optional(),
  targetValue: z.number().int().positive().optional(),
  currentValue: z.number().int().min(0).optional(),
});

export const incrementSkillMetricSchema = z.object({
  id: z.uuid(),
  amount: z.number().int().positive().default(1),
});

export const bulkUpdateSkillMetricsSchema = z.object({
  updates: z.array(
    z.object({
      id: z.uuid(),
      currentValue: z.number().int().min(0),
    }),
  ),
});

/* ---------- AI Planning Schemas ---------- */

export const generateSkillPlanSchema = z.object({
  skillName: z.string().min(1).max(255),
  goal: z.string().min(1),
  currentLevel: z.string().optional(),
  additionalContext: z.string().optional(),
});

/** AI output schema with .describe() hints for structured output */
export const aiSkillPlanOutputSchema = z.object({
  subSkills: z
    .array(
      z.object({
        name: z.string().describe('Name of the sub-skill'),
        description: z
          .string()
          .describe('Brief description of what this sub-skill covers'),
        metrics: z
          .array(
            z.object({
              name: z.string().describe('Name of the metric to track progress'),
              unit: z
                .string()
                .nullable()
                .describe(
                  'Unit of measurement (e.g., "hours", "sessions"), or null if unitless',
                ),
              targetValue: z
                .number()
                .int()
                .positive()
                .describe('Target value to achieve'),
            }),
          )
          .describe('1-3 measurable metrics for this sub-skill'),
        parentIndex: z
          .number()
          .int()
          .min(-1)
          .nullable()
          .describe(
            'Index of prerequisite sub-skill (0-based), or null/-1 if root',
          ),
      }),
    )
    .describe('Array of 6-15 sub-skills in learning order'),
});

export const skillPlanResultSchema = aiSkillPlanOutputSchema.extend({
  aiError: z.string().optional(),
});

/* ---------- Create Skill With Plan Schema ---------- */

export const subSkillPlanItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  metrics: z.array(
    z.object({
      name: z.string().min(1),
      unit: z.string().nullable().optional(),
      targetValue: z.number().int().positive(),
    }),
  ),
  parentIndex: z.number().int().min(-1).nullable().optional(), // -1 or null = root level
});

export const createSkillWithPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
  goal: z.string().optional(),
  subSkills: z.array(subSkillPlanItemSchema),
});

/* ---------- Export/Import Schemas ---------- */

export const exportedSkillMetricSchema = z.object({
  name: z.string().min(1).max(255),
  unit: z.string().nullable(),
  targetValue: z.number().int().positive(),
  currentValue: z.number().int().min(0),
});

export const exportedSubSkillSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  stage: subSkillStageSchema,
  sortOrder: z.number().int(),
  parentIndex: z.number().int().nullable(),
  metrics: z.array(exportedSkillMetricSchema),
});

export const importSkillSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  skill: z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon: z.string().nullable(),
    goal: z.string().nullable(),
  }),
  subSkills: z.array(exportedSubSkillSchema),
});

export const trackExportSchema = z.object({
  skillId: z.string().uuid(),
});
