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
import { startOfDay, utcDateToLocal } from '@/lib/dates';
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
  const [isMounted, setIsMounted] = useState(false);
  const [dragState, setDragState] = useState<{
    activeTask: Task | TaskWithSkillInfo | null;
    dragSource: string | null;
  }>({ activeTask: null, dragSource: null });
  const [dropState, setDropState] = useState<{
    pendingDrop: PendingDrop | null;
    showRecurringModal: boolean;
    shouldReopenAssignSheet: boolean;
  }>({
    pendingDrop: null,
    showRecurringModal: false,
    shouldReopenAssignSheet: false,
  });

  // Only render DndContext on client to avoid SSR issues with dnd-kit accessing DOM
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const clearReopenFlag = useCallback(() => {
    setDropState((prev) => ({ ...prev, shouldReopenAssignSheet: false }));
  }, []);

  const dndStateValue = useMemo<DndContextValue>(
    () => ({
      isDragging: dragState.activeTask !== null,
      shouldReopenAssignSheet: dropState.shouldReopenAssignSheet,
      clearReopenFlag,
    }),
    [dragState.activeTask, dropState.shouldReopenAssignSheet, clearReopenFlag],
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
        // Invalidate dashboard today tasks
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getTodaysTasks.pathKey(),
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
      setDragState({ activeTask: task, dragSource: source ?? null });
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
    const task = dragState.activeTask;
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
          setDropState((prev) => ({
            ...prev,
            pendingDrop: { task, targetDate },
            showRecurringModal: true,
          }));
        }
      }
    }

    // Only reopen sheet if drop was invalid and came from assign sheet
    if (!wasValidDrop && dragState.dragSource === 'assign-sheet') {
      setDropState((prev) => ({ ...prev, shouldReopenAssignSheet: true }));
    }

    setDragState({ activeTask: null, dragSource: null });
  }

  /** Handle recurring modal confirmation */
  const handleRecurringConfirm = useCallback(
    (options: RecurringOptions) => {
      if (dropState.pendingDrop) {
        executeMoveTask(dropState.pendingDrop.task as Task, options);
      }
      setDropState((prev) => ({
        ...prev,
        pendingDrop: null,
        showRecurringModal: false,
      }));
    },
    [dropState.pendingDrop, executeMoveTask],
  );

  /** Handle recurring modal cancel */
  const handleRecurringModalChange = useCallback((open: boolean) => {
    setDropState((prev) => ({
      ...prev,
      pendingDrop: open ? prev.pendingDrop : null,
      showRecurringModal: open,
    }));
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
          {dragState.activeTask && (
            <div className="relative flex items-center gap-3 rounded-md border bg-background px-3 py-2 shadow-lg">
              {'skillColor' in dragState.activeTask &&
                dragState.activeTask.skillColor && (
                  <div
                    className="absolute left-0 top-0 h-full w-1 rounded-l-md"
                    style={{ backgroundColor: dragState.activeTask.skillColor }}
                  />
                )}
              <span
                className={cn(
                  'truncate',
                  dragState.activeTask.completed &&
                    'text-muted-foreground line-through',
                )}
              >
                {dragState.activeTask.name}
              </span>
            </div>
          )}
        </DragOverlay>

        {/* Assign Tasks Sheet - must be inside DndContext for draggable to work */}
        <AssignTasksSheet />
      </DndContext>

      {/* Recurring Modal for skill-linked tasks */}
      {dropState.pendingDrop && (
        <RecurringModal
          open={dropState.showRecurringModal}
          onOpenChange={handleRecurringModalChange}
          task={dropState.pendingDrop.task as Task}
          targetDate={dropState.pendingDrop.targetDate}
          onConfirm={handleRecurringConfirm}
        />
      )}
    </DndStateContext.Provider>
  );
}
