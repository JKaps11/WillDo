import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import { RecurringModal } from './RecurringModal';
import type { RecurringOptions } from './RecurringModal';
import type { ReactNode } from 'react';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStore, uiStoreActions } from '@/lib/store';
import { startOfDay } from '@/utils/dates';

export function GlobalRecurringModal(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { isOpen, task, targetDate } = useStore(
    uiStore,
    (s) => s.recurrenceModal,
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

  function handleConfirm(options: RecurringOptions): void {
    if (!task || !targetDate) return;

    const newDate = startOfDay(options.selectedDate);

    const updatePayload: Parameters<typeof updateTaskMutation.mutate>[0] = {
      id: task.id,
      todoListDate: newDate,
    };

    // Add recurrence rule if making recurring
    if (options.isRecurring && options.recurrenceRule) {
      updatePayload.recurrenceRule = {
        isRecurring: true,
        frequency: options.recurrenceRule.frequency,
        interval: options.recurrenceRule.interval,
        daysOfWeek: options.recurrenceRule.daysOfWeek,
        endType: options.recurrenceEndType ?? 'never',
        endAfterCount:
          options.recurrenceEndType === 'after_count'
            ? options.recurrenceEndValue
            : undefined,
      };
    } else {
      // Clear recurrence if turning it off
      updatePayload.recurrenceRule = null;
    }

    updateTaskMutation.mutate(updatePayload);
    uiStoreActions.closeRecurrenceModal();
  }

  function handleOpenChange(open: boolean): void {
    if (!open) {
      uiStoreActions.closeRecurrenceModal();
    }
  }

  if (!task || !targetDate) {
    return null;
  }

  return (
    <RecurringModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      task={task}
      targetDate={targetDate}
      onConfirm={handleConfirm}
    />
  );
}
