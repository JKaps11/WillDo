import { ReactFlowProvider } from '@xyflow/react';
import { useState } from 'react';

import { SubSkillEditPanel } from './SubSkillEditPanel';
import { PlannerCanvas } from './PlannerCanvas';
import type { SkillWithEnrichedSubSkills } from '@/lib/types';

interface SkillPlannerProps {
  skill: SkillWithEnrichedSubSkills;
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
