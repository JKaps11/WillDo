import { createFileRoute } from '@tanstack/react-router';

import { SkillForm } from '@/components/skills-hub/SkillForm';
import { ensureUser } from '@/utils/auth';

export const Route = createFileRoute('/app/skills_/new')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create New Skill</h1>
        <p className="text-muted-foreground">
          Define your skill and let AI help you create a learning plan
        </p>
      </div>

      <SkillForm />
    </div>
  );
}
