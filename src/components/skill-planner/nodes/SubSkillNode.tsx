import { CheckCircle2, Lock } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

import type { SubSkill, SubSkillStage } from '@/db/schemas/sub_skill.schema';
import type { SkillMetric } from '@/db/schemas/skill_metric.schema';

const STAGE_COLORS: Record<SubSkillStage, string> = {
  not_started: 'var(--stage-not-started)',
  practice: 'var(--stage-practice)',
  feedback: 'var(--stage-feedback)',
  evaluate: 'var(--stage-evaluate)',
  complete: 'var(--stage-complete)',
};

const STAGE_LABELS: Record<SubSkillStage, string> = {
  not_started: 'Not Started',
  practice: 'Practice',
  feedback: 'Feedback',
  evaluate: 'Evaluate',
  complete: 'Complete',
};

export interface SubSkillNodeData extends Record<string, unknown> {
  subSkill: SubSkill;
  metrics: Array<SkillMetric>;
  isLocked: boolean;
}

export type SubSkillNodeType = Node<SubSkillNodeData, 'subSkill'>;

export function SubSkillNode({
  data,
  selected,
}: NodeProps<SubSkillNodeType>): React.ReactElement {
  const { subSkill, metrics, isLocked } = data;
  const stageColor = STAGE_COLORS[subSkill.stage];
  const isComplete = subSkill.stage === 'complete';

  // Calculate overall progress
  const totalCurrent = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalTarget = metrics.reduce((sum, m) => sum + m.targetValue, 0);
  const progressPercent =
    totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <div
      className={`min-w-48 rounded-lg border-2 bg-card shadow-md transition-all ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isLocked ? 'opacity-60' : ''}`}
      style={{ borderColor: stageColor }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-3 !border-2 !border-background !bg-muted-foreground"
      />

      {/* Header with stage indicator */}
      <div
        className="flex items-center justify-between rounded-t-md px-3 py-1.5 text-xs font-medium text-white"
        style={{ backgroundColor: stageColor }}
      >
        <span>{STAGE_LABELS[subSkill.stage]}</span>
        {isLocked && <Lock className="size-3" />}
        {isComplete && <CheckCircle2 className="size-3" />}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="mb-1 font-medium">{subSkill.name}</h4>
        {subSkill.description && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {subSkill.description}
          </p>
        )}

        {/* Progress bar */}
        {metrics.length > 0 && (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(progressPercent, 100)}%`,
                  backgroundColor: stageColor,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-3 !border-2 !border-background !bg-primary"
      />
    </div>
  );
}
