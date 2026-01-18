import { useSuspenseQuery } from '@tanstack/react-query';
import { Lightbulb, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { SkillSummaryCard } from './SkillSummaryCard';
import type { SkillSummary } from '@/integrations/trpc/routes/dashboard.trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/integrations/trpc/react';

export function SkillsOverview(): React.ReactElement {
  const trpc = useTRPC();
  const { data: skills } = useSuspenseQuery(
    trpc.skill.list.queryOptions({ includeArchived: false }),
  );

  const skillSummaries: Array<SkillSummary> = skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    color: skill.color,
    icon: skill.icon,
    totalSubSkills: skill.subSkills.length,
    completedSubSkills: skill.subSkills.filter((ss) => ss.stage === 'complete')
      .length,
    inProgressSubSkills: skill.subSkills.filter(
      (ss) => ss.stage === 'practice' || ss.stage === 'evaluate',
    ).length,
    subSkills: skill.subSkills.map((ss) => ({
      id: ss.id,
      name: ss.name,
      stage: ss.stage,
    })),
  }));

  return (
    <Card className='flex min-h-[calc(100vh-12rem)] flex-col md:min-h-[calc(100vh-10rem)]'>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Skills Overview</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to="/app/skills/new">
                <Plus className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2 pt-0">
        {skillSummaries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No skills yet. Create your first skill to get started!
          </div>
        ) : (
          skillSummaries.map((skill) => (
            <SkillSummaryCard key={skill.id} skill={skill} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
