import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export function EditSkillModal({
  skill,
  trigger,
}: EditSkillModalProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<EditSkillFormData>({
    name: skill.name,
    description: skill.description ?? '',
    goal: skill.goal ?? '',
    icon: skill.icon ?? '',
    color: skill.color,
  });

  // Reset form data when modal opens with current skill data
  useEffect(() => {
    if (open) {
      setFormData({
        name: skill.name,
        description: skill.description ?? '',
        goal: skill.goal ?? '',
        icon: skill.icon ?? '',
        color: skill.color,
      });
    }
  }, [open, skill]);

  const updateMutation = useMutation(
    trpc.skill.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        void queryClient.invalidateQueries({ queryKey: [['skill', 'get']] });
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="size-4" />
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !isValid}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
