import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RecurringBadge } from './RecurringBadge';
import type { DashboardTask } from '@/integrations/trpc/routes/dashboard.trpc';
import { TaskMetricBadge } from '@/components/task/TaskMetricBadge';
import { useTRPC } from '@/integrations/trpc/react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: DashboardTask;
}

export function TaskCard({ task }: TaskCardProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Calculate metric totals
  const totalCurrent = task.metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalTarget = task.metrics.reduce((sum, m) => sum + m.targetValue, 0);
  const isMetricFilled = totalTarget > 0 && totalCurrent >= totalTarget;

  const completeWithMetricMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getTodaysTasks.queryKey(),
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
        'relative flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors',
        task.completed && 'opacity-60',
        isMetricFilled && !task.completed && 'opacity-60',
      )}
    >
      {/* Skill color bar */}
      {task.skill && (
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
          style={{ backgroundColor: task.skill.color }}
        />
      )}

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Task name */}
        <span
          className={cn(
            'block text-sm font-medium leading-tight',
            task.completed && 'text-muted-foreground line-through',
          )}
        >
          {task.name}
        </span>

        {/* Skill path */}
        {task.skill && (
          <span className="text-xs text-muted-foreground">
            {task.skill.name}
            {task.subSkill && (
              <span className="text-muted-foreground/60">
                {' › '}
                {task.subSkill.name}
              </span>
            )}
          </span>
        )}

        {/* Description styled as a note */}
        {task.description && (
          <p className="line-clamp-2 text-xs italic text-muted-foreground/80">
            {task.description}
          </p>
        )}

        {/* Badges row */}
        {(task.metrics.length > 0 || task.isRecurring) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
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
        )}
      </div>

      <Checkbox
        className="mt-0.5 shrink-0 cursor-pointer"
        checked={task.completed}
        onCheckedChange={handleCheckboxChange}
        disabled={isMetricFilled && !task.completed}
      />
    </div>
  );
}
