import type { StillTrueResponseValue } from '@willdo/shared';
import { Button } from '@/components/ui/button';

interface StillTrueCardProps {
  text: string;
  onRespond: (response: StillTrueResponseValue) => void;
}

const RESPONSE_OPTIONS: Array<{
  value: StillTrueResponseValue;
  label: string;
  className: string;
}> = [
  {
    value: 'still_struggling',
    label: 'Still Struggling',
    className:
      'border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400',
  },
  {
    value: 'improved',
    label: 'Improved',
    className:
      'border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    className:
      'border-green-500/30 text-green-600 hover:bg-green-500/10 dark:text-green-400',
  },
];

export function StillTrueCard({
  text,
  onRespond,
}: StillTrueCardProps): React.ReactElement {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">Still true?</p>
      <p className="text-sm italic">&ldquo;{text}&rdquo;</p>
      <div className="flex gap-2">
        {RESPONSE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            className={option.className}
            onClick={() => onRespond(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
