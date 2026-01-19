import { Link } from '@tanstack/react-router';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptySkillsState(): React.ReactElement {
  return (
    <div className="h-[90%] flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Target className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No skills yet</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Start building your skill tree by creating your first skill. Define
        sub-skills and track your progress.
      </p>
      <Button asChild>
        <Link to="/app/skills/new">
          <Plus className="mr-2 size-4" />
          Create Your First Skill
        </Link>
      </Button>
    </div>
  );
}
