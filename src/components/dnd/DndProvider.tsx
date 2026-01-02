import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@tanstack/react-store';

import { DndStateContext } from './context';

import type { TodoListWithTasks } from '@/components/todo-list/types';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task } from '@/db/schemas/task.schema';
import type { DndContextValue } from './context';
import type { ReactNode } from 'react';
import { formatPriority } from '@/components/todo-list/utils';
import { startOfDay, utcDateToLocal } from '@/utils/dates';
import { useTRPC } from '@/integrations/trpc/react';
import { Badge } from '@/components/ui/badge';
import { uiStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DndProviderProps {
  children: ReactNode;
  onDragStart?: () => void;
}

export function DndProvider({
  children,
  onDragStart: onDragStartCallback,
}: DndProviderProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

  // Only render DndContext on client to avoid SSR issues with dnd-kit accessing DOM
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dndStateValue = useMemo<DndContextValue>(
    () => ({ isDragging: activeTask !== null }),
    [activeTask],
  );

  // Store previous data for rollback on error
  const previousDataRef = useRef<Array<TodoListWithTasks> | null>(null);

  const updateTaskMutation = useMutation(
    trpc.task.update.mutationOptions({
      onError: () => {
        // Rollback to previous data on error
        if (previousDataRef.current) {
          const queryKey = trpc.todoList.list.queryKey(baseDate);
          queryClient.setQueryData(queryKey, previousDataRef.current);
          previousDataRef.current = null;
        }
      },
      onSettled: () => {
        previousDataRef.current = null;
        // Invalidate all todoList.list queries regardless of date parameter
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
      },
    }),
  );

  /** Synchronously update the cache before mutation to prevent flash */
  function optimisticMoveTask(taskId: string, todoListDate: Date): void {
    const queryKey = trpc.todoList.list.queryKey(baseDate);

    // Save previous data for potential rollback
    previousDataRef.current = queryClient.getQueryData(queryKey) ?? null;

    queryClient.setQueryData(
      queryKey,
      (old: Array<TodoListWithTasks> | undefined) => {
        if (!old) return old;

        // Find the task being moved
        let movedTask: Task | undefined;
        for (const list of old) {
          const found = list.tasks.find((t) => t.id === taskId);
          if (found) {
            movedTask = found;
            break;
          }
        }

        if (!movedTask) return old;

        const targetDateStr = todoListDate.toDateString();
        const targetListExists = old.some(
          (list) => utcDateToLocal(list.date).toDateString() === targetDateStr,
        );

        // Remove task from old list
        let result = old.map((list) => ({
          ...list,
          tasks: list.tasks.filter((t) => t.id !== taskId),
        }));

        if (targetListExists) {
          // Add task to existing target list
          result = result.map((list) => {
            if (utcDateToLocal(list.date).toDateString() === targetDateStr) {
              return {
                ...list,
                tasks: [...list.tasks, { ...movedTask, todoListDate }],
              };
            }
            return list;
          });
        } else {
          // Create new todolist entry with the task
          const newList: TodoListWithTasks = {
            userId: movedTask.userId,
            date: todoListDate,
            created_at: new Date(),
            updated_at: new Date(),
            tasks: [{ ...movedTask, todoListDate }],
          };
          result = [...result, newList];
        }

        return result;
      },
    );
  }

  function handleDragStart(event: DragStartEvent): void {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
      onDragStartCallback?.();
    }
  }

  const createEventFromTaskMutation = useMutation(
    trpc.event.createFromTask.mutationOptions({
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.event.list.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassigned.pathKey(),
        });
      },
    }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    const task = active.data.current?.task as Task | undefined;
    const targetType = over?.data.current?.type as string | undefined;

    // Check if this is a calendar drop
    if (targetType === 'calendar-slot' && task) {
      const slotTime = over?.data.current?.slotTime as Date | undefined;
      if (slotTime) {
        const endTime = new Date(slotTime);
        endTime.setHours(endTime.getHours() + 1);

        createEventFromTaskMutation.mutate({
          taskId: task.id,
          startTime: slotTime,
          endTime,
        });
        setActiveTask(null);
        return;
      }
    }

    // Original todo list drop logic
    const targetDate = over?.data.current?.date as Date | undefined;

    // Check if this is a valid drop that requires an update
    const shouldUpdate = (() => {
      if (!over || !task || !targetDate) return false;
      const taskDate = utcDateToLocal(task.todoListDate).toDateString();
      const dropDate = targetDate.toDateString();
      return taskDate !== dropDate;
    })();

    if (shouldUpdate && task && targetDate) {
      const newDate = startOfDay(targetDate);

      // Synchronously update cache BEFORE React re-renders
      optimisticMoveTask(task.id, newDate);

      // Then trigger the server mutation
      updateTaskMutation.mutate({
        id: task.id,
        todoListDate: newDate,
      });
    }

    setActiveTask(null);
  }

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
        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="bg-background border rounded-md shadow-lg px-4 py-3 w-64">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    'min-w-0 font-medium leading-5 truncate',
                    activeTask.completed &&
                      'text-muted-foreground line-through',
                  )}
                >
                  {activeTask.name}
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {formatPriority(activeTask.priority)}
                </Badge>
              </div>
              {activeTask.description && (
                <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {activeTask.description}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DndStateContext.Provider>
  );
}
