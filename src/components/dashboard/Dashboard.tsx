import { SkillsOverview } from './SkillsOverview';
import { TodaysTasks } from './TodaysTasks';
import { cn } from '@/lib/utils';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps): React.ReactElement {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 py-6', className)}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your daily progress and skill development
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysTasks className="min-h-[400px]" />
        <SkillsOverview className="min-h-[400px]" />
      </div>
    </div>
  );
}
