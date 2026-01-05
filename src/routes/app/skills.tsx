import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTRPC } from '@/integrations/trpc/react';
import { SkillsHub } from '@/components/skills-hub';
import { ensureUser } from '@/utils/auth';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/skills')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const trpc = useTRPC();
  const showArchivedSkills = useStore(uiStore, (s) => s.showArchivedSkills);

  const {
    data: skills,
    isLoading,
    isError,
  } = useQuery(
    trpc.skill.list.queryOptions({ includeArchived: showArchivedSkills }),
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Failed to load skills</p>
      </div>
    );
  }

  return <SkillsHub skills={skills ?? []} />;
}
