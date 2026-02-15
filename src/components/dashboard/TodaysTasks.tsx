import { useSuspenseQuery } from '@tanstack/react-query';
import { ListTodo } from 'lucide-react';

import { DashboardEmptyState } from './DashboardEmptyState';
import { TaskCard } from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';

export function TodaysTasks(): React.ReactElement {
  const trpc = useTRPC();

  const { data: tasks } = useSuspenseQuery(
    trpc.dashboard.getTodaysTasks.queryOptions(),
  );

  return (
    <Card className="flex flex-col" data-testid="todays-tasks">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">Today's Tasks</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-0">
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
