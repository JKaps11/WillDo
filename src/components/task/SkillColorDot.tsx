import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SkillColorDotProps {
  color: string;
  skillName: string;
  className?: string;
}

export function SkillColorDot({
  color,
  skillName,
  className,
}: SkillColorDotProps): React.ReactElement {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn('size-2.5 shrink-0 rounded-full', className)}
            style={{ backgroundColor: color }}
          />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{skillName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
