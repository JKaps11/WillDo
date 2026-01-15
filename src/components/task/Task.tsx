import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { SkillColorDot } from './SkillColorDot';
import PriorityBadge from './PriorityBadge';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import type { TaskWithSkillInfo } from '@/db/repositories/task.repository';
import type { ReactNode } from 'react';
import { useTRPC } from '@/integrations/trpc/react';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';

type AnyTask = TaskType | TaskWithSkillInfo;

interface TaskProps {
  task: AnyTask;
  className?: string;
  dragSource?: string;
}

function hasSkillInfo(task: AnyTask): task is TaskWithSkillInfo {
  return 'skillId' in task && 'skillName' in task && 'skillColor' in task;
}

export function Task({ task, className, dragSource }: TaskProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Check if this task has skill info (flat structure from repository)
  const taskHasSkillInfo = hasSkillInfo(task);
  const skill = taskHasSkillInfo
    ? { name: task.skillName, color: task.skillColor }
    : null;

  const updateMutation = useMutation(
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

  // Use completeWithMetricUpdate for tasks linked to sub-skills
  const completeWithMetricMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.pathKey(),
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
      data: { task, source: dragSource },
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
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
      handleUpdate({ ...task, completed: checked } as TaskType);
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
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="task-checkbox flex items-center justify-center">
          <Checkbox
            className="cursor-pointer hover:border-ring hover:ring-[3px] hover:ring-ring/50"
            checked={task.completed}
            onCheckedChange={handleCheckboxChange}
          />
        </div>
      </div>
    </div>
  );
}
