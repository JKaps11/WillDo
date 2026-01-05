import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

interface SubSkillStageIndicatorProps {
  stages: Array<SubSkillStage>;
  size?: 'sm' | 'md';
}

export function SubSkillStageIndicator({
  stages,
  size = 'sm',
}: SubSkillStageIndicatorProps): React.ReactElement {
  const dotSize = size === 'sm' ? 'size-2' : 'size-3';

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, index) => (
        <Tooltip key={index}>
          <TooltipTrigger asChild>
            <div
              className={`${dotSize} rounded-full`}
              style={{ backgroundColor: STAGE_COLORS[stage] }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {STAGE_LABELS[stage]}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function getStageColor(stage: SubSkillStage): string {
  return STAGE_COLORS[stage];
}

export function getStageLabel(stage: SubSkillStage): string {
  return STAGE_LABELS[stage];
}
