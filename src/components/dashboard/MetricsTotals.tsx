import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Award,
  Calendar,
  CheckCircle2,
  Percent,
  Target,
  TrendingUp,
} from 'lucide-react';

import { useTRPC } from '@/integrations/trpc/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function MetricsTotals(): React.ReactNode {
  const trpc = useTRPC();
  const { data: metrics } = useSuspenseQuery(
    trpc.metrics.getUserMetrics.queryOptions(),
  );

  return (
    <Card data-testid="metrics-totals">
      <CardHeader>
        <CardTitle className="text-base">Your Stats</CardTitle>
        <CardDescription>Lifetime achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard
            icon={<CheckCircle2 className="size-4 text-green-500" />}
            label="Tasks Completed"
            value={metrics.tasksCompleted}
          />
          <MetricCard
            icon={<Target className="size-4 text-blue-500" />}
            label="Tasks Created"
            value={metrics.tasksCreated}
          />
          <MetricCard
            icon={<Award className="size-4 text-purple-500" />}
            label="SubSkills Done"
            value={metrics.subSkillsCompleted}
          />
          <MetricCard
            icon={<TrendingUp className="size-4 text-amber-500" />}
            label="Skills Archived"
            value={metrics.skillsArchived}
          />
          <MetricCard
            icon={<Calendar className="size-4 text-cyan-500" />}
            label="Avg/Day"
            value={metrics.avgTasksPerDay.toFixed(1)}
          />
          <MetricCard
            icon={<Percent className="size-4 text-rose-500" />}
            label="Completion Rate"
            value={`${metrics.completionRate}%`}
          />
        </div>
        <div className="mt-4 rounded-lg border bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total XP</p>
              <p className="text-2xl font-bold">
                {metrics.totalXp.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Level {metrics.level}
              </p>
              <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{ width: `${metrics.levelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

function MetricCard({ icon, label, value }: MetricCardProps): React.ReactNode {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
