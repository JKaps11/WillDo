import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ListTodo, Plus } from 'lucide-react';

import { DashboardEmptyState } from './DashboardEmptyState';
import { TaskCard } from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodaysTasksProps {
  className?: string;
}

export function TodaysTasks({
  className,
}: TodaysTasksProps): React.ReactElement {
  const trpc = useTRPC();

  const { data: tasks } = useSuspenseQuery(
    trpc.dashboard.getTodaysTasks.queryOptions(),
  );

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Today's Tasks</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to="/app/todolist">
                <Plus className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {tasks.length === 0 ? (
          <DashboardEmptyState type="tasks" />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
