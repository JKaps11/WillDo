import { cn } from '@/lib/utils';

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Not confident',
  2: 'Slightly confident',
  3: 'Somewhat confident',
  4: 'Confident',
  5: 'Very confident',
};

interface ConfidenceRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export function ConfidenceRating({
  value,
  onChange,
}: ConfidenceRatingProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              'flex-1 h-8 rounded-md text-sm font-medium transition-colors border',
              level <= value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent',
            )}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Not confident</span>
        <span>Very confident</span>
      </div>
      {value > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {CONFIDENCE_LABELS[value]}
        </p>
      )}
    </div>
  );
}
