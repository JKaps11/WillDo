import { CheckCircle2, Lock } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  STAGE_COLORS,
  STAGE_LABELS,
} from '../constants';
import type { Node, NodeProps } from '@xyflow/react';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { SkillMetric } from '@/db/schemas/skill_metric.schema';

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
  const stageColor: string = STAGE_COLORS[subSkill.stage];
  const isComplete: boolean = subSkill.stage === 'complete';

  const totalCurrent: number = metrics.reduce(
    (sum: number, m: SkillMetric) => sum + m.currentValue,
    0,
  );
  const totalTarget: number = metrics.reduce(
    (sum: number, m: SkillMetric) => sum + m.targetValue,
    0,
  );
  const progressPercent: number =
    totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border-2 bg-card shadow-md transition-all ${
        selected ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${isLocked ? 'opacity-60' : ''}`}
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        borderColor: stageColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-3 !border-2 !border-background !bg-muted-foreground"
      />

      <div
        className="flex shrink-0 items-center justify-between px-3 py-1.5 text-xs font-medium text-white"
        style={{ backgroundColor: stageColor }}
      >
        <span>{STAGE_LABELS[subSkill.stage]}</span>
        {isLocked && <Lock className="size-3" />}
        {isComplete && <CheckCircle2 className="size-3" />}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h4 className="truncate font-medium">{subSkill.name}</h4>
        {subSkill.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {subSkill.description}
          </p>
        )}

        {metrics.length > 0 && (
          <div className="mt-auto pt-2">
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
