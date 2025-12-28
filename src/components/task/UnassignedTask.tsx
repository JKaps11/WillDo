import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EditTaskModal } from './EditTaskModal';
import PriorityBadge from './PriorityBadge';
import type { ReactNode } from 'react';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import { useTRPC } from '@/integrations/trpc/react';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';

interface UnassignedTaskProps {
    task: TaskType;
    className?: string;
}

export function UnassignedTask({ task, className }: UnassignedTaskProps): ReactNode {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateMutation = useMutation(
        trpc.task.update.mutationOptions({
            onMutate: async (variables) => {
                const queryKey = trpc.task.listUnassigned.queryKey();
                await queryClient.cancelQueries({ queryKey });
                const previous = queryClient.getQueryData(queryKey);

                queryClient.setQueryData(
                    queryKey,
                    (old: Array<TaskType> | undefined) => {
                        if (!old) return old;
                        return old.map((t) =>
                            t.id === variables.id ? { ...t, ...variables } : t
                        );
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
                    queryKey: trpc.task.listUnassigned.queryKey()
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

    function handleCheckboxChange(checked: boolean | 'indeterminate'): void {
        if (checked === 'indeterminate') return;
        handleUpdate({ ...task, completed: checked });
    }

    return (
        <div
            className={cn(
                'group flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-accent/50',
                '[&:has(.task-checkbox:hover)]:bg-transparent [&:has(.task-edit-btn:hover)]:bg-transparent',
                className
            )}
        >
            <div className="flex justify-center items-center gap-1 shrink-0">
                <PriorityBadge priority={task.priority}/>
            </div>
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
