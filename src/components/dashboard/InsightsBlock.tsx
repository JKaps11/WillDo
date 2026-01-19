import { useSuspenseQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Repeat,
} from 'lucide-react';

import type { SkillEngagement } from '@/lib/zod-schemas/metrics';
import { useTRPC } from '@/integrations/trpc/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function InsightsBlock(): React.ReactNode {
  const trpc = useTRPC();
  const { data: insights } = useSuspenseQuery(
    trpc.metrics.getInsights.queryOptions(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Insights</CardTitle>
        <CardDescription>Analytics and patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InsightCard
            icon={<Clock className="size-4 text-blue-500" />}
            label="Avg Time to Complete"
            value={
              insights.avgTimeToCompletion !== null
                ? `${insights.avgTimeToCompletion} days`
                : 'N/A'
            }
          />
          <InsightCard
            icon={<AlertTriangle className="size-4 text-amber-500" />}
            label="Abandonment Rate"
            value={`${insights.abandonmentRate}%`}
          />
          <InsightCard
            icon={<Calendar className="size-4 text-green-500" />}
            label="Most Productive"
            value={insights.mostProductiveDay ?? 'N/A'}
          />
          <InsightCard
            icon={<Repeat className="size-4 text-purple-500" />}
            label="Recurrence Rate"
            value={
              insights.recurrenceEffectiveness !== null
                ? `${insights.recurrenceEffectiveness}%`
                : 'N/A'
            }
          />
        </div>

        {insights.skillEngagement.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Skill Engagement</span>
            </div>
            <div className="space-y-2">
              {insights.skillEngagement.slice(0, 4).map((skill) => (
                <SkillEngagementBar key={skill.skillId} skill={skill} />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Feature Usage
          </p>
          <div className="mt-2 flex gap-4">
            <div>
              <p className="text-sm font-medium">
                {insights.featureUsage.recurrenceUsage}%
              </p>
              <p className="text-xs text-muted-foreground">Use Recurrence</p>
            </div>
            <div>
              <p className="text-sm font-medium">
                {insights.featureUsage.metricsUsage}%
              </p>
              <p className="text-xs text-muted-foreground">Use Metrics</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InsightCard({ icon, label, value }: InsightCardProps): React.ReactNode {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

interface SkillEngagementBarProps {
  skill: SkillEngagement;
}

function SkillEngagementBar({ skill }: SkillEngagementBarProps): React.ReactNode {
  // Find max for relative bar width
  const maxCount = 100; // We'll cap at 100 for display

  return (
    <div className="flex items-center gap-2">
      <div
        className="size-3 rounded-sm"
        style={{ backgroundColor: skill.skillColor }}
      />
      <span className="w-24 truncate text-xs">{skill.skillName}</span>
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min((skill.count / maxCount) * 100, 100)}%`,
              backgroundColor: skill.skillColor,
            }}
          />
        </div>
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">
        {skill.count}
      </span>
    </div>
  );
}
