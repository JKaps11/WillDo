import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { SkillForm } from '@/components/skills-hub/SkillForm';
import { Button } from '@/components/ui/button';
import { ensureUser } from '@/utils/auth';

export const Route = createFileRoute('/app/skills_/new')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/skills">
            <ArrowLeft className="mr-2 size-4" />
            Back to Skills
          </Link>
        </Button>
      </div>

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
