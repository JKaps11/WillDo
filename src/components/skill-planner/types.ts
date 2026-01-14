import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { Skill } from '@/db/schemas/skill.schema';
import type { Edge } from '@xyflow/react';

export type EnrichedSubSkill = SubSkill & {
  metrics: Array<SkillMetric>;
  isLocked: boolean;
};

export type SkillWithSubSkills = Skill & {
  subSkills: Array<EnrichedSubSkill>;
};

export interface LayoutNode {
  id: string;
  type: 'skill' | 'subSkill';
  data: Skill | EnrichedSubSkill;
  children: Array<LayoutNode>;
  width: number;
  x: number;
  y: number;
}

export interface TreeEdgeData extends Record<string, unknown> {
  isActive: boolean;
}

export type TreeEdgeType = Edge<TreeEdgeData, 'tree'>;
