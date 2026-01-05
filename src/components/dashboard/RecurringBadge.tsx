import { Repeat } from 'lucide-react';
import type { RecurrenceRule } from '@/db/schemas/task.schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecurringBadgeProps {
  recurrenceRule: RecurrenceRule;
  className?: string;
}

function formatRecurrence(rule: RecurrenceRule): string {
  const { frequency, interval } = rule;

  if (interval === 1) {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Recurring';
    }
  }

  switch (frequency) {
    case 'daily':
      return `Every ${interval} days`;
    case 'weekly':
      return `Every ${interval} weeks`;
    case 'monthly':
      return `Every ${interval} months`;
    default:
      return 'Recurring';
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
