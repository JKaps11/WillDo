import type { Priority } from '@/db/schemas/task.schema';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityLevels: Record<Priority, number> = {
  Very_Low: 1,
  Low: 2,
  Medium: 3,
  High: 4,
  Very_High: 5,
};

const priorityColors: Record<Priority, string> = {
  Very_Low: 'bg-slate-400',
  Low: 'bg-blue-400',
  Medium: 'bg-yellow-400',
  High: 'bg-orange-400',
  Very_High: 'bg-red-400',
};

export default function PriorityBadge({
  priority,
  className,
}: PriorityBadgeProps): ReactNode {
  const level = priorityLevels[priority];
  const activeColor = priorityColors[priority];

  return (
    <div
      className={cn('flex items-end gap-0.5 h-4', className)}
      aria-label={`Priority: ${priority.replace('_', ' ')}`}
    >
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className={cn(
            'w-0.5 rounded-sm transition-colors',
            bar <= level ? activeColor : 'bg-muted',
          )}
          style={{ height: `${bar * 20}%` }}
        />
      ))}
    </div>
  );
}
