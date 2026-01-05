import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RecurringBadge } from './RecurringBadge';
import type { DashboardTask } from '@/integrations/trpc/routes/dashboard.trpc';
import { TaskMetricBadge } from '@/components/task/TaskMetricBadge';
import { SkillColorDot } from '@/components/task/SkillColorDot';
import { useTRPC } from '@/integrations/trpc/react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: DashboardTask;
  className?: string;
}

export function TaskCard({
  task,
  className,
}: TaskCardProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Calculate metric totals
  const totalCurrent = task.metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalTarget = task.metrics.reduce((sum, m) => sum + m.targetValue, 0);
  const isMetricFilled = totalTarget > 0 && totalCurrent >= totalTarget;

  // Use completeWithMetricUpdate for tasks linked to sub-skills
  const completeWithMetricMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getTodaysTasks.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getStats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: ['skill'],
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getTodaysTasks.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getStats.queryKey(),
        });
      },
    }),
  );

  function handleCheckboxChange(checked: boolean | 'indeterminate'): void {
    if (checked === 'indeterminate') return;

    if (task.subSkillId) {
      completeWithMetricMutation.mutate({
        id: task.id,
        completed: checked,
      });
    } else {
      updateMutation.mutate({
        id: task.id,
        completed: checked,
      });
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors',
        task.completed && 'opacity-60',
        isMetricFilled && !task.completed && 'opacity-60',
        className,
      )}
    >
      <Checkbox
        className="mt-0.5 cursor-pointer"
        checked={task.completed}
        onCheckedChange={handleCheckboxChange}
        disabled={isMetricFilled && !task.completed}
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          {task.skill && (
            <SkillColorDot
              color={task.skill.color}
              skillName={task.skill.name}
              className="mt-1 shrink-0"
            />
          )}
          <span
            className={cn(
              'text-sm font-medium',
              task.completed && 'text-muted-foreground line-through',
            )}
          >
            {task.name}
          </span>
        </div>

        {task.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {task.skill && (
            <span className="text-xs text-muted-foreground">
              {task.skill.name}
              {task.subSkill && ` / ${task.subSkill.name}`}
            </span>
          )}

          {task.metrics.length > 0 && totalTarget > 0 && (
            <TaskMetricBadge
              currentValue={totalCurrent}
              targetValue={totalTarget}
            />
          )}

          {task.isRecurring && task.recurrenceRule && (
            <RecurringBadge recurrenceRule={task.recurrenceRule} />
          )}
        </div>
      </div>
    </div>
  );
}
