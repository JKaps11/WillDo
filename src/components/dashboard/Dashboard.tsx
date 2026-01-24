import { CompletionChart } from './CompletionChart';
import { MetricsTotals } from './MetricsTotals';
import { SkillsOverview } from './SkillsOverview';
import { TodaysTasks } from './TodaysTasks';
import { WelcomeBlock } from './WelcomeBlock';

export function Dashboard(): React.ReactElement {
  return (
    <div className="mx-auto w-full px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <WelcomeBlock />
        <TodaysTasks />
        <SkillsOverview />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <MetricsTotals />
        <CompletionChart className="col-span-2" />
      </div>
    </div>
  );
}
