import { EmptySkillsState } from './EmptySkillsState';
import { SkillCard } from './SkillCard';
import type { SkillWithSubSkills } from '@/lib/types';

interface SkillsHubProps {
  skills: Array<SkillWithSubSkills>;
  activeSkillId: string | null;
}

export function SkillsHub({
  skills,
  activeSkillId,
}: SkillsHubProps): React.ReactElement {
  if (skills.length === 0) {
    return <EmptySkillsState />;
  }

  return (
    <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          isActive={skill.id === activeSkillId}
        />
      ))}
    </div>
  );
}
