import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import { SubSkillStageDots } from './SubSkillStageDots';
import type { SkillSummary } from '@/integrations/trpc/routes/dashboard.trpc';
import { cn } from '@/lib/utils';

interface SkillSummaryCardProps {
  skill: SkillSummary;
  className?: string;
}

export function SkillSummaryCard({
  skill,
  className,
}: SkillSummaryCardProps): React.ReactElement {
  const progress =
    skill.totalSubSkills > 0
      ? Math.round((skill.completedSubSkills / skill.totalSubSkills) * 100)
      : 0;

  return (
    <Link
      to="/app/skills/$id/planner"
      params={{ id: skill.id }}
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50',
        className,
      )}
    >
      <div
        className="size-10 shrink-0 rounded-lg"
        style={{ backgroundColor: skill.color }}
      >
        {skill.icon && (
          <div className="flex h-full items-center justify-center text-lg">
            {skill.icon}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-medium">{skill.name}</h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {progress}%
          </span>
        </div>

        {skill.subSkills.length > 0 ? (
          <SubSkillStageDots
            subSkills={skill.subSkills.map((ss) => ({
              id: ss.id,
              name: ss.name,
              stage: ss.stage,
            }))}
          />
        ) : (
          <p className="text-xs text-muted-foreground">No sub-skills yet</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {skill.completedSubSkills}/{skill.totalSubSkills} complete
          </span>
          {skill.inProgressSubSkills > 0 && (
            <>
              <span>-</span>
              <span>{skill.inProgressSubSkills} in progress</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
