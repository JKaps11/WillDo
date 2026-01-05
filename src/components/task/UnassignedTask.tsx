import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Trash2 } from 'lucide-react';
import { TaskMetricBadge } from './TaskMetricBadge';
import { SkillColorDot } from './SkillColorDot';
import { EditTaskModal } from './EditTaskModal';
import PriorityBadge from './PriorityBadge';
import type { TaskWithSkillInfo } from '@/db/repositories/task.repository';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import type { ReactNode } from 'react';
import { useTRPC } from '@/integrations/trpc/react';
import { TAG_MAX_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UnassignedTaskProps {
  task: TaskType | TaskWithSkillInfo;
  className?: string;
  showSkillInfo?: boolean;
}

function hasSkillInfo(
  task: TaskType | TaskWithSkillInfo,
): task is TaskWithSkillInfo {
  return 'skill' in task && 'metrics' in task;
}

export function UnassignedTask({
  task,
  className,
  showSkillInfo = true,
}: UnassignedTaskProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: allTags = [] } = useQuery(trpc.tag.list.queryOptions());
  const taskTags = allTags.filter((tag) => task.tagIds.includes(tag.tagId));

  // Check if this task has skill info for display
  const taskHasSkillInfo = hasSkillInfo(task);
  const skill = taskHasSkillInfo ? task.skill : null;
  const metrics = taskHasSkillInfo ? task.metrics : [];

  // Calculate metric totals for badge
  const totalCurrent = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalTarget = metrics.reduce((sum, m) => sum + m.targetValue, 0);
  const isMetricFilled = totalTarget > 0 && totalCurrent >= totalTarget;

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onMutate: async (variables) => {
        const queryKey = trpc.task.listUnassignedWithSkillInfo.queryKey();
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(
          queryKey,
          (old: Array<TaskWithSkillInfo> | undefined) => {
            if (!old) return old;
            return old.map((t) =>
              t.id === variables.id ? { ...t, ...variables } : t,
            );
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
          queryKey: trpc.task.listUnassignedWithSkillInfo.queryKey(),
        });
      },
    }),
  );

  // Use completeWithMetricUpdate for tasks linked to sub-skills
  const completeWithMetricMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.queryKey(),
        });
        // Also invalidate skill queries to update metric displays
        queryClient.invalidateQueries({
          queryKey: ['skill'],
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.queryKey(),
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

  function handleDelete(): void {
    deleteMutation.mutate({ id: task.id });
  }

  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-3 px-3 py-2 border rounded-lg transition-colors hover:bg-accent/50',
        '[&:has(.task-checkbox:hover)]:bg-transparent [&:has(.task-edit-btn:hover)]:bg-transparent [&:has(.task-delete-btn:hover)]:bg-transparent',
        isMetricFilled && 'opacity-60',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Skill color dot */}
        {showSkillInfo && skill && (
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

        {taskTags.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-1">
            {taskTags.map((tag) => (
              <Badge
                key={tag.tagId}
                variant="secondary"
                className="truncate text-xs"
                style={{
                  backgroundColor: tag.color,
                  borderColor: tag.color,
                  maxWidth: TAG_MAX_WIDTH,
                }}
              >
                {tag.title}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <EditTaskModal task={task} />
        <div className="task-delete-btn">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
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
