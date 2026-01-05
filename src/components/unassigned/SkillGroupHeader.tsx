import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SkillGroupHeaderProps {
  skillName: string;
  skillColor: string;
  skillIcon?: string | null;
  taskCount: number;
  completedCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SkillGroupHeader({
  skillName,
  skillColor,
  skillIcon,
  taskCount,
  completedCount,
  isExpanded,
  onToggle,
}: SkillGroupHeaderProps): React.ReactElement {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className="flex h-auto w-full items-center justify-between gap-2 px-3 py-2 hover:bg-accent/50"
    >
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        <div
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: skillColor }}
        />
        {skillIcon && <span className="text-base">{skillIcon}</span>}
        <span className="font-medium">{skillName}</span>
      </div>
      <Badge variant="secondary" className="shrink-0">
        {completedCount}/{taskCount}
      </Badge>
    </Button>
  );
}
