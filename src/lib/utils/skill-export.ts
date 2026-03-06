import type { z } from 'zod';

import type {
  exportedSubSkillSchema,
  importSkillSchema,
} from '@/lib/zod-schemas/skill';
import type { SkillWithEnrichedSubSkills } from '@/lib/types';

// Derive types from Zod schemas (single source of truth)
type ExportedSubSkill = z.infer<typeof exportedSubSkillSchema>;
export type ExportedSkill = z.infer<typeof importSkillSchema>;

export function transformSkillForExport(
  skillData: SkillWithEnrichedSubSkills,
): ExportedSkill {
  // Build a map of subSkill IDs to their index in the array
  const idToIndex = new Map<string, number>();
  skillData.subSkills.forEach((subSkill, index) => {
    idToIndex.set(subSkill.id, index);
  });

  const exportedSubSkills: Array<ExportedSubSkill> = skillData.subSkills.map(
    (subSkill) => ({
      name: subSkill.name,
      description: subSkill.description,
      stage: subSkill.stage,
      sortOrder: subSkill.sortOrder,
      parentIndex: subSkill.parentSubSkillId
        ? (idToIndex.get(subSkill.parentSubSkillId) ?? null)
        : null,
      metrics: subSkill.metrics.map((metric) => ({
        name: metric.name,
        unit: metric.unit,
        targetValue: metric.targetValue,
        currentValue: 0, // Never export user progress
      })),
    }),
  );

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    skill: {
      name: skillData.name,
      description: skillData.description,
      color: skillData.color,
      icon: skillData.icon,
      goal: skillData.goal,
    },
    subSkills: exportedSubSkills,
  };
}

export function downloadSkillAsJson(
  data: ExportedSkill,
  skillName: string,
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${skillName.toLowerCase().replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
