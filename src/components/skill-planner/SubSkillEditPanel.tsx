import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { StageAdvancer } from './StageAdvancer';
import { STAGE_LABELS } from './constants';
import type { EnrichedSubSkill, SkillWithSubSkills } from './types';
import { MetricsSummary } from '@/components/skills-hub/MetricsSummary';
import { Separator } from '@/components/ui/separator';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SubSkillEditPanelProps {
  subSkill: EnrichedSubSkill;
  onClose: () => void;
}

export function SubSkillEditPanel({
  subSkill,
  onClose,
}: SubSkillEditPanelProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: subSkill.name,
    description: subSkill.description || '',
  });

  const updateMutation = useMutation(
    trpc.subSkill.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'get']] });
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.subSkill.delete.mutationOptions({
      onMutate: async () => {
        onClose();

        await queryClient.cancelQueries({
          queryKey: [['skill', 'get'], { input: { id: subSkill.skillId } }],
        });

        const previousSkill = queryClient.getQueryData<SkillWithSubSkills>([
          ['skill', 'get'],
          { input: { id: subSkill.skillId }, type: 'query' },
        ]);

        if (previousSkill) {
          queryClient.setQueryData<SkillWithSubSkills>(
            [
              ['skill', 'get'],
              { input: { id: subSkill.skillId }, type: 'query' },
            ],
            {
              ...previousSkill,
              subSkills: previousSkill.subSkills.filter(
                (ss) => ss.id !== subSkill.id,
              ),
            },
          );
        }

        return { previousSkill };
      },
      onError: (_err, _variables, context) => {
        if (context?.previousSkill) {
          queryClient.setQueryData(
            [
              ['skill', 'get'],
              { input: { id: subSkill.skillId }, type: 'query' },
            ],
            context.previousSkill,
          );
        }
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'get']] });
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        void queryClient.invalidateQueries({ queryKey: [['subSkill']] });
      },
    }),
  );

  const handleSave = (): void => {
    if (
      formData.name !== subSkill.name ||
      formData.description !== subSkill.description
    ) {
      updateMutation.mutate({
        id: subSkill.id,
        name: formData.name,
        description: formData.description || undefined,
      });
    }
  };

  const handleDelete = (): void => {
    deleteMutation.mutate({ id: subSkill.id });
  };

  // Check if metrics are filled
  const totalCurrent = subSkill.metrics.reduce(
    (sum, m) => sum + m.currentValue,
    0,
  );
  const totalTarget = subSkill.metrics.reduce(
    (sum, m) => sum + m.targetValue,
    0,
  );
  const metricsFilled = totalTarget > 0 && totalCurrent >= totalTarget;

  return (
    <div className="absolute right-0 top-0 z-20 h-full w-80 border-l bg-background shadow-lg">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Edit Sub-skill</h3>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Stage Progress */}
            <div>
              <Label className="mb-2 block text-sm font-medium"><strong>Stage: </strong>{STAGE_LABELS[subSkill.stage]}</Label>
              <StageAdvancer
                subSkillId={subSkill.id}
                currentStage={subSkill.stage}
                isLocked={subSkill.isLocked}
                metricsFilled={metricsFilled}
              />
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="subskillName">Name</Label>
              <Input
                id="subskillName"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                onBlur={handleSave}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="subskillDescription">Description</Label>
              <textarea
                id="subskillDescription"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                onBlur={handleSave}
              />
            </div>

            <Separator />

            {/* Metrics */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Metrics</Label>
              {subSkill.metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No metrics defined
                </p>
              ) : (
                <MetricsSummary metrics={subSkill.metrics} compact={false} />
              )}
            </div>

            <Separator />

            {/* Danger Zone */}
            <div>
              <Label className="mb-2 block text-sm font-medium text-destructive">
                Danger Zone
              </Label>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 size-4" />
                Delete Sub-skill
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
