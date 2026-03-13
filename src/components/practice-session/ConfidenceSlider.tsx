import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  comparisonValue?: number;
  label?: string;
}

function getAdaptiveMessage(value: number): string {
  if (value <= 3) return 'No pressure — just explore';
  if (value <= 6) return "Good place to be — let's build on what you know";
  return "Let's see what you've got";
}

export function ConfidenceSlider({
  value,
  onChange,
  comparisonValue,
  label = 'Confidence',
}: ConfidenceSliderProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold">{value}/10</span>
      </div>
      <Slider
        min={1}
        max={10}
        value={[value]}
        onValueChange={(vals: Array<number>) => onChange(vals[0])}
      />
      <p className="text-xs text-muted-foreground italic">
        {getAdaptiveMessage(value)}
      </p>
      {comparisonValue !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Pre: {comparisonValue}/10</span>
          <span className="text-muted-foreground/50">→</span>
          <span>Post: {value}/10</span>
          <DeltaBadge pre={comparisonValue} post={value} />
        </div>
      )}
    </div>
  );
}

interface DeltaBadgeProps {
  pre: number;
  post: number;
}

function DeltaBadge({ pre, post }: DeltaBadgeProps): React.ReactElement | null {
  const delta = post - pre;
  if (delta === 0) return null;

  return (
    <span
      className={cn(
        'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
        delta > 0
          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400',
      )}
    >
      {delta > 0 ? '+' : ''}
      {delta}
    </span>
  );
}
