import { Plus } from 'lucide-react';
import { SubSkillEditor } from './SubSkillEditor';
import type { GeneratedSubSkill } from './AIPlanning';
import { Button } from '@/components/ui/button';

interface PlanReviewProps {
  subSkills: Array<GeneratedSubSkill>;
  onChange: (subSkills: Array<GeneratedSubSkill>) => void;
}

export function PlanReview({
  subSkills,
  onChange,
}: PlanReviewProps): React.ReactElement {
  const updateSubSkill = (index: number, updated: GeneratedSubSkill): void => {
    const newSubSkills = [...subSkills];
    newSubSkills[index] = updated;
    onChange(newSubSkills);
  };

  const deleteSubSkill = (index: number): void => {
    // Update dependencies when removing a sub-skill
    const newSubSkills = subSkills
      .filter((_, i) => i !== index)
      .map((ss) => ({
        ...ss,
        dependencies: ss.dependencies
          .filter((d) => d !== index)
          .map((d) => (d > index ? d - 1 : d)),
      }));
    onChange(newSubSkills);
  };

  const addSubSkill = (): void => {
    onChange([
      ...subSkills,
      {
        name: 'New Sub-skill',
        description: '',
        metrics: [{ name: 'Tasks completed', targetValue: 5, unit: 'tasks' }],
        dependencies: subSkills.length > 0 ? [subSkills.length - 1] : [],
      },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Review Your Learning Plan</h3>
          <p className="text-sm text-muted-foreground">
            Customize sub-skills and metrics. Drag to reorder.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addSubSkill}>
          <Plus className="mr-2 size-4" />
          Add Sub-skill
        </Button>
      </div>

      {subSkills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No sub-skills yet. Add some manually or go back to generate with AI.
          </p>
          <Button variant="outline" className="mt-4" onClick={addSubSkill}>
            <Plus className="mr-2 size-4" />
            Add First Sub-skill
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {subSkills.map((subSkill, index) => (
            <SubSkillEditor
              key={index}
              subSkill={subSkill}
              index={index}
              onChange={(updated) => updateSubSkill(index, updated)}
              onDelete={() => deleteSubSkill(index)}
            />
          ))}
        </div>
      )}

      {subSkills.length > 0 && (
        <div className="rounded-lg bg-muted p-4">
          <h4 className="mb-2 font-medium">Summary</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>{subSkills.length} sub-skills</li>
            <li>
              {subSkills.reduce((sum, ss) => sum + ss.metrics.length, 0)} total
              metrics
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
