import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DndStateContext } from './context';

import type { TaskWithSkillInfo } from '@/components/todo-list/types';
import type { RecurringOptions } from '@/components/recurring/RecurringModal';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task } from '@/db/schemas/task.schema';
import type { DndContextValue } from './context';
import type { ReactNode } from 'react';
import { AssignTasksSheet } from '@/components/todo-list/AssignTasksSheet';
import { RecurringModal } from '@/components/recurring/RecurringModal';
import { startOfDay, utcDateToLocal } from '@/utils/dates';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStoreActions } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DndProviderProps {
  children: ReactNode;
  onDragStart?: () => void;
}

interface PendingDrop {
  task: Task | TaskWithSkillInfo;
  targetDate: Date;
}

export function DndProvider({
  children,
  onDragStart: onDragStartCallback,
}: DndProviderProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | TaskWithSkillInfo | null>(
    null,
  );
  const [isMounted, setIsMounted] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [shouldReopenAssignSheet, setShouldReopenAssignSheet] = useState(false);

  // Only render DndContext on client to avoid SSR issues with dnd-kit accessing DOM
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const clearReopenFlag = useCallback(() => {
    setShouldReopenAssignSheet(false);
  }, []);

  const dndStateValue = useMemo<DndContextValue>(
    () => ({
      isDragging: activeTask !== null,
      shouldReopenAssignSheet,
      clearReopenFlag,
    }),
    [activeTask, shouldReopenAssignSheet, clearReopenFlag],
  );

  const updateTaskMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSettled: () => {
        // Invalidate all todoList.list queries regardless of date parameter
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
        // Also invalidate unassigned queries
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.pathKey(),
        });
      },
    }),
  );

  function handleDragStart(event: DragStartEvent): void {
    const task = event.active.data.current?.task as
      | Task
      | TaskWithSkillInfo
      | undefined;
    const source = event.active.data.current?.source as string | undefined;
    if (task) {
      setActiveTask(task);
      setDragSource(source ?? null);
      onDragStartCallback?.();
    }
  }

  /** Execute the actual task move */
  const executeMoveTask = useCallback(
    (task: Task, recurringOptions: RecurringOptions) => {
      const newDate = startOfDay(recurringOptions.selectedDate);

      // Build update payload
      const updatePayload: Parameters<typeof updateTaskMutation.mutate>[0] = {
        id: task.id,
        todoListDate: newDate,
      };

      // Add recurrence rule if making recurring
      if (recurringOptions.isRecurring && recurringOptions.recurrenceRule) {
        updatePayload.recurrenceRule = {
          isRecurring: true,
          frequency: recurringOptions.recurrenceRule.frequency,
          interval: recurringOptions.recurrenceRule.interval,
          daysOfWeek: recurringOptions.recurrenceRule.daysOfWeek,
          endType: recurringOptions.recurrenceEndType ?? 'never',
          endAfterCount:
            recurringOptions.recurrenceEndType === 'after_count'
              ? recurringOptions.recurrenceEndValue
              : undefined,
        };
      } else {
        // Clear recurrence if turning it off
        updatePayload.recurrenceRule = null;
      }

      // Trigger the server mutation
      updateTaskMutation.mutate(updatePayload);
    },
    [updateTaskMutation],
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { over } = event;

    // Use activeTask from state (saved during drag start) instead of event.active.data.current
    // because the source component may have unmounted (e.g., when AssignTasksSheet closes)
    const task = activeTask;
    const targetType = over?.data.current?.type as string | undefined;

    // Track if this was a valid drop to determine sheet behavior
    let wasValidDrop = false;

    // Check if this is a todolist drop
    if (targetType === 'todolist' && task) {
      const rawDate = over?.data.current?.date;
      // Convert string date back to Date object if needed
      const targetDate =
        rawDate instanceof Date
          ? rawDate
          : rawDate
            ? new Date(rawDate)
            : undefined;

      // Check if this is a valid drop that requires an update
      const shouldUpdate = (() => {
        if (!targetDate) return false;
        // Unassigned tasks (null todoListDate) should always be updated when dropped
        if (!task.todoListDate) return true;
        const taskDate = utcDateToLocal(task.todoListDate).toDateString();
        const dropDate = targetDate.toDateString();
        return taskDate !== dropDate;
      })();

      if (shouldUpdate && targetDate) {
        wasValidDrop = true;

        const hasExistingRecurrence = task.recurrenceRule?.isRecurring === true;
        const isAlreadyAssigned = task.todoListDate !== null;

        if (isAlreadyAssigned && hasExistingRecurrence) {
          // Scenario: Moving an existing recurring task occurrence
          // Show MoveRecurringModal with 3 options (this only, this and future, all)
          // task.todoListDate is the expanded occurrence date (set by groupTasksByDate)
          // Non-null assertion safe because isAlreadyAssigned checks todoListDate !== null
          uiStoreActions.openMoveRecurringModal(
            task,
            task.todoListDate!,
            targetDate,
          );
        } else {
          // Scenario: Moving a non-recurring task or assigning an unassigned task
          // Show the schedule modal to allow date editing and recurrence setup
          setPendingDrop({ task, targetDate });
          setShowRecurringModal(true);
        }
      }
    }

    // Only reopen sheet if drop was invalid and came from assign sheet
    if (!wasValidDrop && dragSource === 'assign-sheet') {
      setShouldReopenAssignSheet(true);
    }

    setActiveTask(null);
    setDragSource(null);
  }

  /** Handle recurring modal confirmation */
  const handleRecurringConfirm = useCallback(
    (options: RecurringOptions) => {
      if (pendingDrop) {
        executeMoveTask(pendingDrop.task as Task, options);
      }
      setPendingDrop(null);
      setShowRecurringModal(false);
    },
    [pendingDrop, executeMoveTask],
  );

  /** Handle recurring modal cancel */
  const handleRecurringModalChange = useCallback((open: boolean) => {
    if (!open) {
      setPendingDrop(null);
    }
    setShowRecurringModal(open);
  }, []);

  // During SSR, render children without DndContext to avoid DOM access errors
  if (!isMounted) {
    return (
      <DndStateContext.Provider value={dndStateValue}>
        {children}
      </DndStateContext.Provider>
    );
  }

  return (
    <DndStateContext.Provider value={dndStateValue}>
      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null} className="z-[100]">
          {activeTask && (
            <div className="relative flex items-center gap-3 rounded-md border bg-background px-3 py-2 shadow-lg">
              {'skillColor' in activeTask && activeTask.skillColor && (
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-md"
                  style={{ backgroundColor: activeTask.skillColor }}
                />
              )}
              <span
                className={cn(
                  'truncate',
                  activeTask.completed && 'text-muted-foreground line-through',
                )}
              >
                {activeTask.name}
              </span>
            </div>
          )}
        </DragOverlay>

        {/* Assign Tasks Sheet - must be inside DndContext for draggable to work */}
        <AssignTasksSheet />
      </DndContext>

      {/* Recurring Modal for skill-linked tasks */}
      {pendingDrop && (
        <RecurringModal
          open={showRecurringModal}
          onOpenChange={handleRecurringModalChange}
          task={pendingDrop.task as Task}
          targetDate={pendingDrop.targetDate}
          onConfirm={handleRecurringConfirm}
        />
      )}
    </DndStateContext.Provider>
  );
}
