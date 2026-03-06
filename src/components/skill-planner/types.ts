import type { Skill } from '@/db/schemas/skill.schema';
import type { EnrichedSubSkill } from '@/lib/types';
import type { Edge } from '@xyflow/react';

export type { EnrichedSubSkill, SkillWithEnrichedSubSkills } from '@/lib/types';

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
