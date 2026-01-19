import { SkillsOverview } from './SkillsOverview';
import { TodaysTasks } from './TodaysTasks';

export function Dashboard(): React.ReactElement {
  return (
    <div className={'mx-auto w-full px-4 py-6'}>
      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysTasks/>
        <SkillsOverview />
      </div>
    </div>
  );
}
