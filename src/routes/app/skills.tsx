import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import { useTRPC } from '@/integrations/trpc/react';
import { SkillsHub } from '@/components/skills-hub';
import { ensureUser } from '@/utils/auth';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/skills')({
  loader: async ({ context }) => {
    await ensureUser();
    await context.queryClient.ensureQueryData(
      context.trpc.skill.list.queryOptions({ includeArchived: false }),
    );
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const trpc = useTRPC();
  const showArchivedSkills = useStore(uiStore, (s) => s.showArchivedSkills);

  const { data: skills } = useSuspenseQuery(
    trpc.skill.list.queryOptions({ includeArchived: showArchivedSkills }),
  );

  return <SkillsHub skills={skills} />;
}
