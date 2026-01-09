import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { TaskMetricBadge } from './TaskMetricBadge';
import { SkillColorDot } from './SkillColorDot';
import { EditTaskModal } from './EditTaskModal';
import PriorityBadge from './PriorityBadge';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import type {
  TaskWithSkillInfo,
  TodoListDay,
} from '@/components/todo-list/types';
import type { ReactNode } from 'react';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStore } from '@/lib/store';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';

interface TaskProps {
  task: TaskType | TaskWithSkillInfo;
  className?: string;
}

function hasSkillContext(
  task: TaskType | TaskWithSkillInfo,
): task is TaskWithSkillInfo {
  return 'skill' in task && 'metrics' in task;
}

export function Task({ task, className }: TaskProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

  // Check if this task has skill context
  const taskHasSkillContext = hasSkillContext(task);
  const skill = taskHasSkillContext ? task.skill : null;
  const metrics = taskHasSkillContext ? task.metrics : [];

  // Calculate metric totals
  const totalCurrent = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalTarget = metrics.reduce((sum, m) => sum + m.targetValue, 0);
  const isMetricFilled = totalTarget > 0 && totalCurrent >= totalTarget;

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = trpc.todoList.list.queryKey(baseDate);
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(
          queryKey,
          (old: Array<TodoListDay> | undefined) => {
            if (!old) return old;
            return old.map((list) => ({
              ...list,
              tasks: list.tasks.map((t) =>
                t.id === variables.id ? { ...t, ...variables } : t,
              ),
            }));
          },
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
          queryKey: trpc.todoList.list.pathKey(),
        });
      },
    }),
  );

  // Use completeWithMetricUpdate for tasks linked to sub-skills
  const completeWithMetricMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
        // Also invalidate skill queries to update metric displays
        queryClient.invalidateQueries({
          queryKey: ['skill'],
        });
      },
    }),
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

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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

    // If task is linked to a sub-skill, use completeWithMetricUpdate
    if (task.subSkillId) {
      completeWithMetricMutation.mutate({
        id: task.id,
        completed: checked,
      });
    } else {
      handleUpdate({ ...task, completed: checked });
    }
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
        isMetricFilled && 'opacity-60',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Skill color dot */}
        {skill && (
          <SkillColorDot
            color={skill.color}
            skillName={skill.name}
            className="shrink-0"
          />
        )}

        <div className="flex shrink-0 items-center justify-center gap-1">
          <PriorityBadge priority={task.priority} />
        </div>

        <span
          className={cn(
            'truncate',
            task.completed && 'text-muted-foreground line-through',
          )}
        >
          {task.name}
        </span>

        {/* Metric badge */}
        {metrics.length > 0 && totalTarget > 0 && (
          <TaskMetricBadge
            currentValue={totalCurrent}
            targetValue={totalTarget}
            className="shrink-0"
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <EditTaskModal task={task} />
        <div className="task-checkbox flex items-center justify-center">
          <Checkbox
            className="cursor-pointer hover:border-ring hover:ring-[3px] hover:ring-ring/50"
            checked={task.completed}
            onCheckedChange={handleCheckboxChange}
            disabled={isMetricFilled && !task.completed}
          />
        </div>
      </div>
    </div>
  );
}
