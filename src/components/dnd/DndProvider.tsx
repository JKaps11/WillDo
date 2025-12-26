import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import { DndStateContext } from './context';
import { useTRPC } from '@/integrations/trpc/react';
import { startOfDay } from '@/utils/dates';
import { Badge } from '@/components/ui/badge';
import { formatPriority } from '@/components/todo-list/utils';
import { cn } from '@/lib/utils';
import { uiStore } from '@/lib/store';

import type { ReactNode } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task } from '@/db/schemas/task.schema';
import type { TodoListWithTasks } from '@/components/todo-list/types';
import type { z } from 'zod';
import type { updateTaskSchema } from '@/lib/zod-schemas/task';
import type { DndContextValue } from './context';

type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

interface DndProviderProps {
    children: ReactNode;
}

export function DndProvider({ children }: DndProviderProps): ReactNode {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

    const dndStateValue = useMemo<DndContextValue>(
        () => ({ isDragging: activeTask !== null }),
        [activeTask]
    );

    const updateTaskMutation = useMutation(
        trpc.task.update.mutationOptions({
            onMutate: async (variables) => {
                const { id, todoListDate } = variables as UpdateTaskInput;
                const queryKey = trpc.todoList.list.queryKey(baseDate);
                await queryClient.cancelQueries({ queryKey });
                const previous = queryClient.getQueryData(queryKey);

                queryClient.setQueryData(
                    queryKey,
                    (old: Array<TodoListWithTasks> | undefined) => {
                        if (!old || !todoListDate) return old;

                        // Find the task being moved
                        let movedTask: Task | undefined;
                        for (const list of old) {
                            const found = list.tasks.find((t) => t.id === id);
                            if (found) {
                                movedTask = found;
                                break;
                            }
                        }

                        if (!movedTask) return old;

                        const targetDateStr = todoListDate.toDateString();
                        const targetListExists = old.some(
                            (list) => new Date(list.date).toDateString() === targetDateStr
                        );

                        // Remove task from old list
                        let result = old.map((list) => ({
                            ...list,
                            tasks: list.tasks.filter((t) => t.id !== id),
                        }));

                        if (targetListExists) {
                            // Add task to existing target list
                            result = result.map((list) => {
                                if (new Date(list.date).toDateString() === targetDateStr) {
                                    return {
                                        ...list,
                                        tasks: [...list.tasks, { ...movedTask!, todoListDate }],
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
                    }
                );

                return { previous, queryKey };
            },
            onError: (_err, _vars, context) => {
                if (context?.previous && context?.queryKey) {
                    queryClient.setQueryData(context.queryKey, context.previous);
                }
            },
            onSettled: () => {
                // Invalidate all todoList.list queries regardless of date parameter
                queryClient.invalidateQueries({
                    queryKey: trpc.todoList.list.pathKey()
                });
            },
        })
    );

    function handleDragStart(event: DragStartEvent): void {
        const task = event.active.data.current?.task as Task | undefined;
        if (task) {
            setActiveTask(task);
        }
    }

    function handleDragEnd(event: DragEndEvent): void {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const task = active.data.current?.task as Task | undefined;
        const targetDate = over.data.current?.date as Date | undefined;

        if (!task || !targetDate) return;

        // Don't update if dropped on the same date
        const taskDate = new Date(task.todoListDate).toDateString();
        const dropDate = targetDate.toDateString();
        if (taskDate === dropDate) return;

        updateTaskMutation.mutate({
            id: task.id,
            todoListDate: startOfDay(targetDate),
        });
    }

    return (
        <DndStateContext.Provider value={dndStateValue}>
            <DndContext
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {children}
                <DragOverlay>
                    {activeTask && (
                        <div className="bg-background border rounded-md shadow-lg px-4 py-3 w-64">
                            <div className="flex items-start justify-between gap-3">
                                <div
                                    className={cn(
                                        'min-w-0 font-medium leading-5 truncate',
                                        activeTask.completed && 'text-muted-foreground line-through'
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
