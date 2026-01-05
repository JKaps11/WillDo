import { Lightbulb, ListTodo, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardEmptyStateProps {
  type: 'tasks' | 'skills';
  className?: string;
}

export function DashboardEmptyState({
  type,
  className,
}: DashboardEmptyStateProps): React.ReactElement {
  if (type === 'tasks') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 text-center',
          className,
        )}
      >
        <div className="mb-4 rounded-full bg-muted p-3">
          <ListTodo className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium">No tasks for today</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Drag tasks from unassigned or schedule skill practice
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/unassigned">View Unassigned Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-3">
        <Lightbulb className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 font-medium">No skills yet</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Create a skill to start tracking your learning journey
      </p>
      <Button size="sm" asChild>
        <Link to="/app/skills/new">
          <Plus className="mr-1 size-4" />
          Create Skill
        </Link>
      </Button>
    </div>
  );
}
