import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { ColorPicker } from './SkillForm/ColorPicker';
import type { Skill } from '@/db/schemas/skill.schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EditSkillFormData {
  name: string;
  description: string;
  goal: string;
  icon: string;
  color: string;
}

interface EditSkillModalProps {
  skill: Skill;
  trigger?: React.ReactElement;
}

function skillToFormData(skill: Skill): EditSkillFormData {
  return {
    name: skill.name,
    description: skill.description ?? '',
    goal: skill.goal ?? '',
    icon: skill.icon ?? '',
    color: skill.color,
  };
}

interface EditSkillFormContentProps {
  skill: Skill;
  onClose: () => void;
}

function EditSkillFormContent({
  skill,
  onClose,
}: EditSkillFormContentProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EditSkillFormData>(
    skillToFormData(skill),
  );

  const updateMutation = useMutation(
    trpc.skill.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        void queryClient.invalidateQueries({ queryKey: [['skill', 'get']] });
        onClose();
      },
    }),
  );

  const updateField = <TKey extends keyof EditSkillFormData>(
    field: TKey,
    value: EditSkillFormData[TKey],
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (): void => {
    updateMutation.mutate({
      id: skill.id,
      name: formData.name,
      description: formData.description || null,
      goal: formData.goal || null,
      icon: formData.icon || null,
      color: formData.color,
    });
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Skill</DialogTitle>
        <DialogDescription>
          Update the details for &quot;{skill.name}&quot;
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="editSkillName">Skill Name *</Label>
          <Input
            id="editSkillName"
            placeholder="e.g., Learn Spanish, Master Guitar"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="editSkillGoal">Goal</Label>
          <Input
            id="editSkillGoal"
            placeholder="What do you want to achieve?"
            value={formData.goal}
            onChange={(e) => updateField('goal', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="editSkillDescription">Description</Label>
          <Input
            id="editSkillDescription"
            placeholder="Brief description of this skill"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => updateField('color', color)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editSkillIcon">Icon (emoji)</Label>
            <Input
              id="editSkillIcon"
              placeholder="e.g., 🎸, 🇪🇸, 📚"
              value={formData.icon}
              onChange={(e) => updateField('icon', e.target.value)}
              maxLength={4}
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending || !isValid}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function EditSkillModal({
  skill,
  trigger,
}: EditSkillModalProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="size-4" />
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        {open && (
          <EditSkillFormContent
            key={skill.id}
            skill={skill}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
