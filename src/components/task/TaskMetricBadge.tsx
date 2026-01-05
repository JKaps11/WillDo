import { cn } from '@/lib/utils';

interface TaskMetricBadgeProps {
  currentValue: number;
  targetValue: number;
  className?: string;
}

export function TaskMetricBadge({
  currentValue,
  targetValue,
  className,
}: TaskMetricBadgeProps): React.ReactElement {
  const progress =
    targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
  const isFilled = currentValue >= targetValue;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs',
        isFilled
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <div className="relative h-1.5 w-8 overflow-hidden rounded-full bg-muted-foreground/20">
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full transition-all',
            isFilled ? 'bg-green-500' : 'bg-primary',
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="font-medium tabular-nums">
        {currentValue}/{targetValue}
      </span>
    </div>
  );
}
