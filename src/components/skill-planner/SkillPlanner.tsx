import { ReactFlowProvider } from '@xyflow/react';
import { useState } from 'react';

import { SubSkillEditPanel } from './SubSkillEditPanel';
import { PlannerCanvas } from './PlannerCanvas';
import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { Skill } from '@/db/schemas/skill.schema';

type EnrichedSubSkill = SubSkill & {
  metrics: Array<SkillMetric>;
  isLocked: boolean;
};

interface SkillPlannerProps {
  skill: Skill & { subSkills: Array<EnrichedSubSkill> };
}

export function SkillPlanner({ skill }: SkillPlannerProps): React.ReactElement {
  const [selectedSubSkillId, setSelectedSubSkillId] = useState<string | null>(
    null,
  );

  const selectedSubSkill = selectedSubSkillId
    ? skill.subSkills.find((ss) => ss.id === selectedSubSkillId)
    : null;

  return (
    <ReactFlowProvider>
      <div className="relative h-[calc(100vh-12rem)] w-full overflow-hidden rounded-lg border bg-muted/30">
        <PlannerCanvas skill={skill} onNodeSelect={setSelectedSubSkillId} />

        {selectedSubSkill && (
          <SubSkillEditPanel
            subSkill={selectedSubSkill}
            onClose={() => setSelectedSubSkillId(null)}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
