import type { SkillMetric } from '@/db/schemas/skill_metric.schema';

interface MetricsSummaryProps {
  metrics: Array<SkillMetric>;
  compact?: boolean;
}

export function MetricsSummary({
  metrics,
  compact = true,
}: MetricsSummaryProps): React.ReactElement {
  if (metrics.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No metrics defined</span>
    );
  }

  const totalCurrent = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const totalTarget = metrics.reduce((sum, m) => sum + m.targetValue, 0);
  const progressPercent =
    totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {progressPercent}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {metrics.map((metric) => {
        const percent =
          metric.targetValue > 0
            ? Math.round((metric.currentValue / metric.targetValue) * 100)
            : 0;

        return (
          <div key={metric.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{metric.name}</span>
              <span className="text-muted-foreground">
                {metric.currentValue}/{metric.targetValue}{' '}
                {metric.unit && `${metric.unit}`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
