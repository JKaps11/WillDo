import { useSuspenseQuery } from '@tanstack/react-query';
import { Focus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { SkillSummaryCard } from './SkillSummaryCard';
import type { SkillSummary } from '@/integrations/trpc/routes/dashboard.trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/integrations/trpc/react';

export function ActiveSkill(): React.ReactElement {
  const trpc = useTRPC();
  const { data: skills } = useSuspenseQuery(
    trpc.skill.list.queryOptions({ includeArchived: false }),
  );
  const { data: user } = useSuspenseQuery(trpc.user.get.queryOptions());

  const activeSkillId = user.activeSkillId;

  const activeSkill = activeSkillId
    ? skills.find((s) => s.id === activeSkillId)
    : undefined;

  const skillSummary: SkillSummary | undefined = activeSkill
    ? {
        id: activeSkill.id,
        name: activeSkill.name,
        color: activeSkill.color,
        icon: activeSkill.icon,
        totalSubSkills: activeSkill.subSkills.length,
        completedSubSkills: activeSkill.subSkills.filter(
          (ss) => ss.stage === 'complete',
        ).length,
        inProgressSubSkills: activeSkill.subSkills.filter(
          (ss) => ss.stage === 'practice' || ss.stage === 'evaluate',
        ).length,
        subSkills: activeSkill.subSkills.map((ss) => ({
          id: ss.id,
          name: ss.name,
          stage: ss.stage,
        })),
      }
    : undefined;

  return (
    <Card className="flex flex-col" data-testid="active-skill">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Focus className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">Active Skill</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pt-0">
        {!activeSkillId ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <p>No active skill selected.</p>
            <Button size="sm" variant="link" render={<Link to="/app/skills" />} nativeButton={false}>
              Pick one from the Skill Hub
            </Button>
          </div>
        ) : !skillSummary ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Active skill not found. It may have been archived or deleted.
          </div>
        ) : (
          <SkillSummaryCard skill={skillSummary} />
        )}
      </CardContent>
    </Card>
  );
}
