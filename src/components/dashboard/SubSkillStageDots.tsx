import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  STAGE_BG_CLASSES,
  STAGE_LABELS,
} from '@/components/skill-planner/constants';

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
    <TooltipProvider delay={200}>
      <div className={cn('flex items-center gap-1', className)}>
        {subSkills.map((subSkill) => (
          <Tooltip key={subSkill.id}>
            <TooltipTrigger
              render={
                <div
                  className={cn(
                    dotSize,
                    'shrink-0 rounded-full transition-colors',
                    STAGE_BG_CLASSES[subSkill.stage],
                  )}
                />
              }
            />
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
