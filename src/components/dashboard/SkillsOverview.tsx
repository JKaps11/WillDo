import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { DashboardEmptyState } from './DashboardEmptyState';
import { SkillSummaryCard } from './SkillSummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SkillsOverviewProps {
  className?: string;
}

export function SkillsOverview({
  className,
}: SkillsOverviewProps): React.ReactElement {
  const trpc = useTRPC();

  const { data: skills, isLoading } = useQuery(
    trpc.dashboard.getSkillsSummary.queryOptions(),
  );

  const { data: stats } = useQuery(trpc.dashboard.getStats.queryOptions());

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Skills Overview</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <Badge variant="secondary">
                {stats.subSkills.completed}/{stats.subSkills.total} sub-skills
              </Badge>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link to="/app/skills/new">
                <Plus className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !skills || skills.length === 0 ? (
          <DashboardEmptyState type="skills" />
        ) : (
          <div className="space-y-2">
            {skills.map((skill) => (
              <SkillSummaryCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
