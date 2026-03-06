import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useForm } from '@tanstack/react-form';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import type { SkillWithEnrichedSubSkills } from './types';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uiStore, uiStoreActions } from '@/lib/store';
import { useTRPC } from '@/integrations/trpc/react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateSubSkillModalProps {
  skill: SkillWithEnrichedSubSkills;
}

interface MetricFormValue {
  name: string;
  unit: string;
  targetValue: number;
  currentValue: number;
}

export function CreateSubSkillModal({
  skill,
}: CreateSubSkillModalProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const open = useStore(uiStore, (s) => s.showCreateSubSkillModal);

  const createMutation = useMutation(
    trpc.subSkill.create.mutationOptions({
      onMutate: async (newSubSkill) => {
        await queryClient.cancelQueries({
          queryKey: [['skill', 'get'], { input: { id: skill.id } }],
        });

        const previousSkill =
          queryClient.getQueryData<SkillWithEnrichedSubSkills>([
            ['skill', 'get'],
            { input: { id: skill.id }, type: 'query' },
          ]);

        if (previousSkill) {
          const optimisticSubSkill = {
            id: `temp-${Date.now()}`,
            userId: '',
            skillId: skill.id,
            name: newSubSkill.name,
            description: newSubSkill.description ?? null,
            parentSubSkillId: newSubSkill.parentSubSkillId ?? null,
            stage: 'not_started' as const,
            stageStartedAt: null,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            metrics: [],
            isLocked: false,
          };

          queryClient.setQueryData<SkillWithEnrichedSubSkills>(
            [['skill', 'get'], { input: { id: skill.id }, type: 'query' }],
            {
              ...previousSkill,
              subSkills: [...previousSkill.subSkills, optimisticSubSkill],
            },
          );
        }

        return { previousSkill };
      },
      onError: (_err, _newSubSkill, context) => {
        if (context?.previousSkill) {
          queryClient.setQueryData(
            [['skill', 'get'], { input: { id: skill.id }, type: 'query' }],
            context.previousSkill,
          );
        }
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'get']] });
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        void queryClient.invalidateQueries({ queryKey: [['subSkill']] });
      },
      onSuccess: () => {
        handleClose();
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      parentSubSkillId: null as string | null,
      metrics: [] as Array<MetricFormValue>,
    },
    onSubmit: ({ value }) => {
      const metricsToSubmit = value.metrics
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          unit: m.unit.trim() || undefined,
          targetValue: m.targetValue,
          currentValue: m.currentValue,
        }));

      createMutation.mutate({
        skillId: skill.id,
        name: value.name.trim(),
        description: value.description.trim() || undefined,
        parentSubSkillId: value.parentSubSkillId,
        metrics: metricsToSubmit.length > 0 ? metricsToSubmit : undefined,
      });
    },
  });

  const handleClose = (): void => {
    form.reset();
    uiStoreActions.setShowCreateSubSkillModal(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={uiStoreActions.setShowCreateSubSkillModal}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sub-skill</DialogTitle>
          <DialogDescription>
            Add a new sub-skill to your learning plan.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-subskill-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter sub-skill name"
                  autoFocus
                  autoComplete="off"
                />
              </Field>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Description (optional)
                </FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Describe what this sub-skill covers"
                  rows={3}
                />
              </Field>
            )}
          />

          <form.Field
            name="parentSubSkillId"
            children={(field) => (
              <Field>
                <FieldLabel>Parent Sub-skill (optional)</FieldLabel>
                <Select
                  value={field.state.value ?? 'none'}
                  onValueChange={(value) =>
                    field.handleChange(value === 'none' ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent (or leave as root)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">
                        No parent (connects to skill root)
                      </span>
                    </SelectItem>
                    {skill.subSkills.map((subSkill) => (
                      <SelectItem key={subSkill.id} value={subSkill.id}>
                        {subSkill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  The parent determines where this sub-skill appears in the tree
                </FieldDescription>
              </Field>
            )}
          />

          <form.Field
            name="metrics"
            mode="array"
            children={(field) => (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Metrics (optional)</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      field.pushValue({
                        name: '',
                        unit: '',
                        targetValue: 1,
                        currentValue: 0,
                      })
                    }
                  >
                    <Plus className="mr-1 size-3" />
                    Add
                  </Button>
                </div>
                <FieldDescription>
                  Track progress with measurable goals
                </FieldDescription>
                {field.state.value.length > 0 && (
                  <div className="mt-2 space-y-3">
                    {field.state.value.map((metric, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 rounded-md border p-3"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <span className="text-muted-foreground text-xs">
                            Metric {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            onClick={() => field.removeValue(index)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Input
                            placeholder="Metric name"
                            value={metric.name}
                            onChange={(e) => {
                              const updated = [...field.state.value];
                              updated[index] = {
                                ...updated[index],
                                name: e.target.value,
                              };
                              field.handleChange(updated);
                            }}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Unit"
                              value={metric.unit}
                              onChange={(e) => {
                                const updated = [...field.state.value];
                                updated[index] = {
                                  ...updated[index],
                                  unit: e.target.value,
                                };
                                field.handleChange(updated);
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="Target"
                              min={1}
                              value={metric.targetValue}
                              onChange={(e) => {
                                const updated = [...field.state.value];
                                updated[index] = {
                                  ...updated[index],
                                  targetValue:
                                    parseInt(e.target.value, 10) || 1,
                                };
                                field.handleChange(updated);
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="Current"
                              min={0}
                              value={metric.currentValue}
                              onChange={(e) => {
                                const updated = [...field.state.value];
                                updated[index] = {
                                  ...updated[index],
                                  currentValue:
                                    parseInt(e.target.value, 10) || 0,
                                };
                                field.handleChange(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.values.name]}
            children={([canSubmit, name]) => (
              <Button
                type="submit"
                form="create-subskill-form"
                disabled={
                  !canSubmit ||
                  !(name as string).trim() ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Sub-skill'
                )}
              </Button>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
