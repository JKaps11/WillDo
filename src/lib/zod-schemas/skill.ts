import { z } from 'zod';
import { subSkillStageEnum } from '@/db/schemas/sub_skill.schema';
import { recurrenceEndTypeEnum } from '@/db/schemas/task.schema';

/* ---------- Stage Schema ---------- */

export const subSkillStageSchema = z.enum(subSkillStageEnum.enumValues);

/* ---------- Recurrence Schemas ---------- */

export const recurrenceEndTypeSchema = z.enum(recurrenceEndTypeEnum.enumValues);

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().positive(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
});

/* ---------- Skill Schemas ---------- */

export const createSkillSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().optional(),
  goal: z.string().optional(),
});

export const updateSkillSchema = z.object({
  id: z.string().uuid(),
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
  id: z.string().uuid(),
});

export const deleteSkillSchema = z.object({
  id: z.string().uuid(),
});

export const listSkillsSchema = z.object({
  includeArchived: z.boolean().optional(),
});

/* ---------- Sub-Skill Schemas ---------- */

export const createSubSkillSchema = z.object({
  skillId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  stage: subSkillStageSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const updateSubSkillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  stage: subSkillStageSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const getSubSkillSchema = z.object({
  id: z.string().uuid(),
});

export const deleteSubSkillSchema = z.object({
  id: z.string().uuid(),
});

export const listSubSkillsSchema = z.object({
  skillId: z.string().uuid(),
});

export const advanceSubSkillStageSchema = z.object({
  id: z.string().uuid(),
});

export const completeSubSkillSchema = z.object({
  id: z.string().uuid(),
});

/* ---------- Sub-Skill Dependency Schemas ---------- */

export const addDependencySchema = z.object({
  dependentSubSkillId: z.string().uuid(),
  prerequisiteSubSkillId: z.string().uuid(),
});

export const removeDependencySchema = z.object({
  dependentSubSkillId: z.string().uuid(),
  prerequisiteSubSkillId: z.string().uuid(),
});

/* ---------- Skill Metric Schemas ---------- */

export const createSkillMetricSchema = z.object({
  subSkillId: z.string().uuid(),
  name: z.string().min(1).max(255),
  unit: z.string().optional(),
  targetValue: z.number().int().positive().optional(),
  currentValue: z.number().int().min(0).optional(),
});

export const updateSkillMetricSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  unit: z.string().nullable().optional(),
  targetValue: z.number().int().positive().optional(),
  currentValue: z.number().int().min(0).optional(),
});

export const incrementSkillMetricSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int().positive().default(1),
});

export const bulkUpdateSkillMetricsSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      currentValue: z.number().int().min(0),
    }),
  ),
});

/* ---------- AI Planning Schemas ---------- */

export const generateSkillPlanSchema = z.object({
  skillName: z.string().min(1).max(255),
  goal: z.string().min(1),
  additionalContext: z.string().optional(),
});

export const skillPlanResultSchema = z.object({
  subSkills: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      metrics: z.array(
        z.object({
          name: z.string(),
          unit: z.string().optional(),
          targetValue: z.number().int().positive(),
        }),
      ),
      dependencies: z.array(z.number().int().min(0)), // indices of prerequisite sub-skills
    }),
  ),
});

/* ---------- Create Skill With Plan Schema ---------- */

export const subSkillPlanItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  metrics: z.array(
    z.object({
      name: z.string().min(1),
      unit: z.string().optional(),
      targetValue: z.number().int().positive(),
    }),
  ),
  dependencyIndices: z.array(z.number().int().min(0)), // indices of prerequisite sub-skills
});

export const createSkillWithPlanSchema = z.object({
  // Skill info
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().optional(),
  goal: z.string().optional(),
  // Sub-skills with their metrics and dependencies
  subSkills: z.array(subSkillPlanItemSchema),
  // Whether to create tasks for each sub-skill
  createTasks: z.boolean().default(true),
});
