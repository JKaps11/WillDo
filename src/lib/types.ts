import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { Skill } from '@/db/schemas/skill.schema';

/** A sub-skill enriched with its metrics and lock state. */
export type EnrichedSubSkill = SubSkill & {
  metrics: Array<SkillMetric>;
  isLocked: boolean;
};

/** A skill with its full enriched sub-skill tree (metrics + lock info). Used in planner/export. */
export type SkillWithEnrichedSubSkills = Skill & {
  subSkills: Array<EnrichedSubSkill>;
};

/** A skill with plain sub-skills (no metrics/lock info). Used in skills hub list. */
export type SkillWithSubSkills = Skill & {
  subSkills: Array<SubSkill>;
};
