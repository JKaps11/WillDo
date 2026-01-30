import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';

import type { MoveRecurringAction } from '@/lib/store';
import type { RecurrenceException } from '@/db/schemas/task.schema';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStore, uiStoreActions } from '@/lib/store';
import { addDays, startOfDay } from '@/lib/dates';

interface MoveOption {
  value: MoveRecurringAction;
  label: string;
  description: string;
  icon: typeof Calendar;
}

const MOVE_OPTIONS: Array<MoveOption> = [
  {
    value: 'this_only',
    label: 'This occurrence only',
    description: 'Move just this one occurrence to the new date',
    icon: Calendar,
  },
  {
    value: 'this_and_future',
    label: 'This and future occurrences',
    description: 'Start the recurring series from the new date',
    icon: CalendarDays,
  },
  {
    value: 'all',
    label: 'All occurrences',
    description: 'Move the entire recurring series',
    icon: CalendarRange,
  },
];

export function MoveRecurringModal(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { isOpen, task, sourceDate, targetDate } = useStore(
    uiStore,
    (s) => s.moveRecurringModal,
  );

  const updateTaskMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.pathKey(),
        });
      },
    }),
  );

  const createTaskMutation = useMutation(
    trpc.task.create.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
      },
    }),
  );

  function handleOpenChange(open: boolean): void {
    if (!open) {
      uiStoreActions.closeMoveRecurringModal();
    }
  }

  function handleSelectOption(action: MoveRecurringAction): void {
    if (!task || !sourceDate || !targetDate) return;

    const sourceDateKey = sourceDate.toISOString().split('T')[0];
    const targetDateKey = targetDate.toISOString().split('T')[0];
    const rule = task.recurrenceRule;

    if (!rule) return;

    if (action === 'this_only') {
      // Add exception: skip original date, add moved instance at target
      const existingExceptions = rule.exceptions ?? [];

      // Check if this is already a moved exception (moving it again)
      const existingExceptionIndex = existingExceptions.findIndex(
        (ex) => ex.movedToDate === sourceDateKey,
      );

      let newExceptions: Array<RecurrenceException>;

      if (existingExceptionIndex !== -1) {
        // Update existing exception's movedToDate
        newExceptions = existingExceptions.map((ex, index) =>
          index === existingExceptionIndex
            ? { ...ex, movedToDate: targetDateKey }
            : ex,
        );
      } else {
        // Add new moved exception
        newExceptions = [
          ...existingExceptions,
          {
            originalDate: sourceDateKey,
            action: 'moved' as const,
            movedToDate: targetDateKey,
          },
        ];
      }

      updateTaskMutation.mutate({
        id: task.id,
        recurrenceRule: {
          ...rule,
          exceptions: newExceptions,
        },
      });
    } else if (action === 'this_and_future') {
      // End current series at the day before source date
      const dayBeforeSource = addDays(sourceDate, -1);

      // Update original task to end before source date
      updateTaskMutation.mutate({
        id: task.id,
        recurrenceRule: {
          ...rule,
          endType: 'on_date',
          endOnDate: dayBeforeSource.toISOString().split('T')[0],
        },
      });

      // Create new task with same properties starting at target date
      createTaskMutation.mutate({
        name: task.name,
        description: task.description ?? undefined,
        priority: task.priority,
        dueDate: task.dueDate ?? undefined,
        subSkillId: task.subSkillId,
        todoListDate: startOfDay(targetDate),
        recurrenceRule: {
          isRecurring: true,
          frequency: rule.frequency,
          interval: rule.interval,
          daysOfWeek: rule.daysOfWeek,
          endType: rule.endType,
          endAfterCount: rule.endAfterCount,
          endOnDate: rule.endOnDate,
          // Don't copy exceptions - new series starts fresh
        },
      });
    } else {
      // action === 'all': Simply update the start date
      updateTaskMutation.mutate({
        id: task.id,
        todoListDate: startOfDay(targetDate),
      });
    }

    uiStoreActions.closeMoveRecurringModal();
  }

  if (!task || !sourceDate || !targetDate) {
    return null;
  }

  const formattedSource = sourceDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTarget = targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" />
            Move Recurring Task
          </DialogTitle>
          <DialogDescription>
            Moving &quot;{task.name}&quot; from {formattedSource} to{' '}
            {formattedTarget}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {MOVE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3"
              onClick={() => handleSelectOption(option.value)}
            >
              <option.icon className="mr-3 size-5 shrink-0" />
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
