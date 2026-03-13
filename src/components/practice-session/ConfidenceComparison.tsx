import { cn } from '@/lib/utils';

interface ConfidenceComparisonProps {
  preConfidence: number;
  postConfidence: number;
}

export function ConfidenceComparison({
  preConfidence,
  postConfidence,
}: ConfidenceComparisonProps): React.ReactElement {
  const delta = postConfidence - preConfidence;

  return (
    <div className="flex items-center justify-center gap-6 rounded-lg border bg-card p-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Before</p>
        <p className="text-2xl font-bold">{preConfidence}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">&nbsp;</p>
        <span
          className={cn(
            'text-lg font-semibold',
            delta > 0 && 'text-green-600 dark:text-green-400',
            delta < 0 && 'text-red-600 dark:text-red-400',
            delta === 0 && 'text-muted-foreground',
          )}
        >
          {delta > 0 ? '+' : ''}
          {delta}
        </span>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">After</p>
        <p className="text-2xl font-bold">{postConfidence}</p>
      </div>
    </div>
  );
}
