import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { TaskContext, useTaskContext } from './context';
import { EditTaskModal } from './EditTaskModal';
import type { ReactNode } from 'react';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import type { TodoListWithTasks } from '@/components/todo-list/types';
import { useTRPC } from '@/integrations/trpc/react';
import { cn } from '@/lib/utils';
import { uiStore } from '@/lib/store';

import { Checkbox } from '@/components/ui/checkbox';

/* ---------- Root ---------- */

interface RootProps {
    children: ReactNode;
    task: TaskType;
}

function Root({ children, task }: RootProps): ReactNode {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

    const updateMutation = useMutation(
        trpc.task.update.mutationOptions({
            onMutate: async (variables) => {
                const queryKey = trpc.todoList.list.queryKey(baseDate);
                await queryClient.cancelQueries({ queryKey });
                const previous = queryClient.getQueryData(queryKey);

                queryClient.setQueryData(
                    queryKey,
                    (old: Array<TodoListWithTasks> | undefined) => {
                        if (!old) return old;
                        return old.map((list) => ({
                            ...list,
                            tasks: list.tasks.map((t) =>
                                t.id === variables.id ? { ...t, ...variables } : t
                            ),
                        }));
                    }
                );

                return { previous, queryKey };
            },
            onError: (_err, _updatedTask, context) => {
                if (context?.previous) {
                    queryClient.setQueryData(context.queryKey, context.previous);
                }
            },
            onSettled: () => {
                queryClient.invalidateQueries({
                    queryKey: trpc.todoList.list.pathKey()
                });
            },
        })
    );

    function handleUpdate(updatedTask: TaskType): void {
        updateMutation.mutate({
            id: updatedTask.id,
            name: updatedTask.name,
            description: updatedTask.description,
            priority: updatedTask.priority,
            dueDate: updatedTask.dueDate ?? undefined,
            completed: updatedTask.completed,
            todoListDate: updatedTask.todoListDate,
        });
    }

    return (
        <TaskContext.Provider value={{ task, onUpdate: handleUpdate }}>
            {children}
        </TaskContext.Provider>
    );
}

/* ---------- Card ---------- */

interface CardProps {
    className?: string;
}

function Card({ className }: CardProps): ReactNode {
    const { task, onUpdate } = useTaskContext();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0 : 1,
    };

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
        const target = e.target as HTMLElement;
        if (target.closest('.task-checkbox, .task-edit-btn')) {
            return;
        }
        listeners?.onPointerDown(e);
    }

    function handleCheckboxChange(checked: boolean | 'indeterminate'): void {
        if (checked === 'indeterminate') return;
        onUpdate({ ...task, completed: checked });
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onPointerDown={handlePointerDown}
            className={cn(
                'group flex items-center justify-between gap-3 px-3 py-2 cursor-grab active:cursor-grabbing transition-colors hover:bg-accent/50',
                '[&:has(.task-checkbox:hover)]:bg-transparent [&:has(.task-edit-btn:hover)]:bg-transparent',
                isDragging && 'overflow-hidden',
                className
            )}
        >
            <span className={cn(
                'truncate',
                task.completed && 'text-muted-foreground line-through'
            )}>
                {task.name}
            </span>

            <div className="flex items-center gap-1 shrink-0">
                <EditTaskModal task={task} />
                <div className="task-checkbox flex items-center justify-center">
                    <Checkbox
                        className="hover:border-ring hover:ring-[3px] hover:ring-ring/50 cursor-pointer"
                        checked={task.completed}
                        onCheckedChange={handleCheckboxChange}
                    />
                </div>
            </div>
        </div>
    );
}

/* ---------- Export as compound component ---------- */

export const Task = {
    Root,
    Card,
};
