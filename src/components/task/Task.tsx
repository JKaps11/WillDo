import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Pencil } from 'lucide-react';

// import PriorityBadge from './PriorityBadge';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import type {
  TaskWithOptionalSkillInfo,
  TaskWithSkillInfo,
} from '@/db/repositories/task.repository';
import type { ReactNode } from 'react';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStoreActions } from '@/lib/store';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

type AnyTask = TaskType | TaskWithSkillInfo | TaskWithOptionalSkillInfo;

interface TaskProps {
  task: AnyTask;
  className?: string;
  dragSource?: string;
}

export function Task({ task, className, dragSource }: TaskProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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

  // Create unique draggable ID for recurring tasks (same task.id on multiple days)
  const draggableId = task.todoListDate
    ? `${task.id}-${task.todoListDate.toISOString().split('T')[0]}`
    : task.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
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
      if (checked) {
        // Completing: open evaluation modal instead of mutating directly
        const occurrenceDate = task.todoListDate ?? new Date();
        uiStoreActions.openEvaluationModal(task as TaskType, occurrenceDate);
      } else {
        // Uncompleting: use existing mutation with occurrenceDate for cleanup
        const occurrenceDate = task.todoListDate ?? undefined;
        completeWithMetricMutation.mutate({
          id: task.id,
          completed: false,
          occurrenceDate,
        });
      }
    } else {
      handleUpdate({ ...task, completed: checked } as TaskType);
    }
  }

  // Check if task has skill color info (TaskWithSkillInfo)
  const skillColor = 'skillColor' in task ? task.skillColor : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
      className={cn(
        'group relative flex items-center justify-between gap-3 px-3 py-2 cursor-grab active:cursor-grabbing transition-colors hover:bg-accent/50 select-none border-1',
        '[&:has(.task-checkbox:hover)]:bg-transparent [&:has(.task-edit-btn:hover)]:bg-transparent',
        isDragging && 'overflow-hidden',
        className,
      )}
    >
      {skillColor && (
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: skillColor }}
        />
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* <div className="flex shrink-0 items-center justify-center gap-1">
          <PriorityBadge priority={task.priority} />
        </div> */}

        <span
          className={cn(
            'truncate',
            task.completed && 'text-muted-foreground line-through',
          )}
        >
          {task.name}
        </span>
      </div>

      {task.todoListDate !== null && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="task-edit-btn size-7 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="task-edit-btn"
            onClick={() => uiStoreActions.openRecurrenceModal(task as TaskType)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <div
            className="task-checkbox flex items-center justify-center"
            data-testid="task-checkbox"
          >
            <Checkbox
              className="cursor-pointer hover:border-ring hover:ring-[3px] hover:ring-ring/50"
              checked={task.completed}
              onCheckedChange={handleCheckboxChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
