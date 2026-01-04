import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import type { ReactNode } from 'react';
import { Task } from './Task';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';

interface UnassignedTasksSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnassignedTasksSheet({
  open,
  onOpenChange,
}: UnassignedTasksSheetProps): ReactNode {
  const trpc = useTRPC();

  const { data: tasks, isLoading } = useQuery(
    trpc.task.listUnassigned.queryOptions(),
  );

  const taskCount = tasks?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Tasks
          {taskCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {taskCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Unassigned Tasks</SheetTitle>
          <SheetDescription>
            Drag tasks onto the calendar to schedule them as events.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          )}

          {!isLoading && taskCount === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No unassigned tasks
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks without due dates will appear here
              </p>
            </div>
          )}

          {!isLoading &&
            tasks?.map((task) => (
              <div key={task.id} className="rounded-lg border">
                <Task task={task} />
              </div>
            ))}
        </div>

        <div className="mt-6 p-4 border-t">
          <p className="text-xs text-muted-foreground">
            Tip: Drag tasks onto calendar time slots to convert them into
            scheduled events
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
