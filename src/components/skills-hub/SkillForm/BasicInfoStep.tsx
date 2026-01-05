import { ColorPicker } from './ColorPicker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface SkillBasicInfo {
  name: string;
  description: string;
  color: string;
  icon: string;
  goal: string;
}

interface BasicInfoStepProps {
  data: SkillBasicInfo;
  onChange: (data: SkillBasicInfo) => void;
}

export function BasicInfoStep({
  data,
  onChange,
}: BasicInfoStepProps): React.ReactElement {
  const updateField = <TKey extends keyof SkillBasicInfo>(
    field: TKey,
    value: SkillBasicInfo[TKey],
  ): void => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="skillName">Skill Name *</Label>
        <Input
          id="skillName"
          placeholder="e.g., Learn Spanish, Master Guitar"
          value={data.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillGoal">Goal</Label>
        <Input
          id="skillGoal"
          placeholder="What do you want to achieve?"
          value={data.goal}
          onChange={(e) => updateField('goal', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This helps the AI generate a better learning plan
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillDescription">Description</Label>
        <Input
          id="skillDescription"
          placeholder="Brief description of this skill"
          value={data.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Color</Label>
          <ColorPicker
            value={data.color}
            onChange={(color) => updateField('color', color)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skillIcon">Icon (emoji)</Label>
          <Input
            id="skillIcon"
            placeholder="e.g., 🎸, 🇪🇸, 📚"
            value={data.icon}
            onChange={(e) => updateField('icon', e.target.value)}
            maxLength={4}
          />
        </div>
      </div>
    </div>
  );
}
