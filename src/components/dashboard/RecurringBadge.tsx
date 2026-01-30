import { Repeat } from 'lucide-react';
import type { RecurrenceRule } from '@/db/schemas/task.schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecurringBadgeProps {
  recurrenceRule: RecurrenceRule;
  className?: string;
}

function formatRecurrence(rule: RecurrenceRule) {
  const { frequency, interval } = rule;

  if (interval === 1) {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      default:
        frequency satisfies never;
    }
  }

  switch (frequency) {
    case 'daily':
      return `Every ${interval} days`;
    case 'weekly':
      return `Every ${interval} weeks`;
    default:
      frequency satisfies never;
  }
}

export function RecurringBadge({
  recurrenceRule,
  className,
}: RecurringBadgeProps): React.ReactElement {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 text-xs font-normal text-muted-foreground',
        className,
      )}
    >
      <Repeat className="size-3" />
      {formatRecurrence(recurrenceRule)}
    </Badge>
  );
}
