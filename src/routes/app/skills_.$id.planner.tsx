import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { CreateSubSkillModal, SkillPlanner } from '@/components/skill-planner';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { ensureUser } from '@/utils/auth';

export const Route = createFileRoute('/app/skills_/$id/planner')({
  loader: async ({ context, params }) => {
    await ensureUser();
    await context.queryClient.ensureQueryData(
      context.trpc.skill.get.queryOptions({ id: params.id }),
    );
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const { data: skill } = useSuspenseQuery(trpc.skill.get.queryOptions({ id }));

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/skills">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {skill.icon && <span className="text-2xl">{skill.icon}</span>}
            <div>
              <h1 className="text-xl font-bold">{skill.name}</h1>
              {skill.goal && (
                <p className="text-sm text-muted-foreground">{skill.goal}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {skill.subSkills.filter((ss) => ss.stage === 'complete').length}/
            {skill.subSkills.length} complete
          </span>
        </div>
      </div>

      <SkillPlanner skill={skill} />

      <CreateSubSkillModal skill={skill} />
    </div>
  );
}
