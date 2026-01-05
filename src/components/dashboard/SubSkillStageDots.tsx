import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STAGE_COLORS: Record<SubSkillStage, string> = {
  not_started: 'bg-muted-foreground/30',
  practice: 'bg-blue-500',
  feedback: 'bg-amber-500',
  evaluate: 'bg-purple-500',
  complete: 'bg-green-500',
};

const STAGE_LABELS: Record<SubSkillStage, string> = {
  not_started: 'Not Started',
  practice: 'Practice',
  feedback: 'Feedback',
  evaluate: 'Evaluate',
  complete: 'Complete',
};

interface SubSkillStageDot {
  id: string;
  name: string;
  stage: SubSkillStage;
}

interface SubSkillStageDotsProps {
  subSkills: Array<SubSkillStageDot>;
  className?: string;
  size?: 'sm' | 'md';
}

export function SubSkillStageDots({
  subSkills,
  className,
  size = 'sm',
}: SubSkillStageDotsProps): React.ReactElement {
  const dotSize = size === 'sm' ? 'size-2' : 'size-2.5';

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('flex items-center gap-1', className)}>
        {subSkills.map((subSkill) => (
          <Tooltip key={subSkill.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  dotSize,
                  'shrink-0 rounded-full transition-colors',
                  STAGE_COLORS[subSkill.stage],
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{subSkill.name}</p>
              <p className="text-muted-foreground">
                {STAGE_LABELS[subSkill.stage]}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
