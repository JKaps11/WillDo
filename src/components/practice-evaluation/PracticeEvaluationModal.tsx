import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { Loader2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ConfidenceRating } from './ConfidenceRating';
import type { z } from 'zod';

import type { evaluationFieldsSchema } from '@/lib/zod-schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uiStore, uiStoreActions } from '@/lib/store';
import { useTRPC } from '@/integrations/trpc/react';

interface MultiInputFieldProps {
  label: string;
  placeholder: string;
  values: Array<string>;
  onChange: (values: Array<string>) => void;
}

function MultiInputField({
  label,
  placeholder,
  values,
  onChange,
}: MultiInputFieldProps): React.ReactElement {
  function handleValueChange(index: number, newValue: string): void {
    const updated = [...values];
    updated[index] = newValue;
    onChange(updated);
  }

  function handleAdd(): void {
    onChange([...values, '']);
  }

  function handleRemove(index: number): void {
    if (values.length <= 1) return;
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea
              value={value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder={placeholder}
              className="min-h-10 flex-1"
            />
            {values.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-1 shrink-0"
                onClick={() => handleRemove(index)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="mr-1 size-4" />
          Add another
        </Button>
      </div>
    </Field>
  );
}

type EvaluationFormState = z.infer<typeof evaluationFieldsSchema>;

const DEFAULT_FORM_STATE: EvaluationFormState = {
  title: '',
  wentWell: [''],
  struggled: [''],
  understandBetter: [''],
  feelings: [''],
  focusNextTime: [''],
  confidenceLevel: 3,
};

export function PracticeEvaluationModal(): React.ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { isOpen, task, occurrenceDate } = useStore(
    uiStore,
    (s) => s.evaluationModal,
  );

  const [formState, setFormState] =
    useState<EvaluationFormState>(DEFAULT_FORM_STATE);

  // Fetch latest evaluation for pre-population
  const { data: latestEvaluation } = useQuery({
    ...trpc.practiceEvaluation.getLatestBySubSkill.queryOptions({
      subSkillId: task?.subSkillId ?? '',
    }),
    enabled: isOpen && !!task?.subSkillId,
  });

  // Generate title and pre-populate when modal opens
  useEffect(() => {
    if (!isOpen || !task || !occurrenceDate) return;

    const dateStr = occurrenceDate.toISOString().split('T')[0];
    const defaultTitle = `${task.name} - ${dateStr}`;

    if (latestEvaluation) {
      setFormState({
        title: defaultTitle,
        wentWell: [''],
        struggled:
          latestEvaluation.struggled.length > 0
            ? [...latestEvaluation.struggled]
            : [''],
        understandBetter: [''],
        feelings: [''],
        focusNextTime:
          latestEvaluation.focusNextTime.length > 0
            ? [...latestEvaluation.focusNextTime]
            : [''],
        confidenceLevel: latestEvaluation.confidenceLevel,
      });
    } else {
      setFormState({
        ...DEFAULT_FORM_STATE,
        title: defaultTitle,
      });
    }
  }, [isOpen, task, occurrenceDate, latestEvaluation]);

  const completeWithEvaluationMutation = useMutation(
    trpc.task.completeWithEvaluation.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.dashboard.getTodaysTasks.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: ['skill'],
        });
        queryClient.invalidateQueries({
          queryKey: trpc.practiceEvaluation.getLatestBySubSkill.pathKey(),
        });
        handleClose();
      },
    }),
  );

  const handleClose = useCallback((): void => {
    uiStoreActions.closeEvaluationModal();
    setFormState(DEFAULT_FORM_STATE);
  }, []);

  function handleOpenChange(open: boolean): void {
    if (!open) {
      handleClose();
    }
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();

    if (!task || !occurrenceDate) return;

    // Filter out empty strings from arrays
    const filterNonEmpty = (arr: Array<string>): Array<string> => {
      const filtered = arr.filter((s) => s.trim().length > 0);
      return filtered.length > 0 ? filtered : [''];
    };

    const wentWell = filterNonEmpty(formState.wentWell);
    const struggled = filterNonEmpty(formState.struggled);
    const understandBetter = filterNonEmpty(formState.understandBetter);
    const feelings = filterNonEmpty(formState.feelings);
    const focusNextTime = filterNonEmpty(formState.focusNextTime);

    // Validate at least one non-empty entry per field
    if (
      !formState.title.trim() ||
      wentWell[0] === '' ||
      struggled[0] === '' ||
      understandBetter[0] === '' ||
      feelings[0] === '' ||
      focusNextTime[0] === ''
    ) {
      return;
    }

    completeWithEvaluationMutation.mutate({
      taskId: task.id,
      occurrenceDate,
      evaluation: {
        title: formState.title.trim(),
        wentWell,
        struggled,
        understandBetter,
        feelings,
        focusNextTime,
        confidenceLevel: formState.confidenceLevel,
      },
    });
  }

  function updateField<TKey extends keyof EvaluationFormState>(
    key: TKey,
    value: EvaluationFormState[TKey],
  ): void {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  if (!task || !occurrenceDate) {
    return null;
  }

  const isPending = completeWithEvaluationMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Practice Evaluation</DialogTitle>
          <DialogDescription>
            Reflect on your practice session before completing this task.
          </DialogDescription>
        </DialogHeader>

        <form
          id="practice-evaluation-form"
          onSubmit={handleSubmit}
          className="max-h-[60vh] space-y-5 overflow-y-auto pr-1"
        >
          <Field>
            <FieldLabel htmlFor="eval-title">Title</FieldLabel>
            <Input
              id="eval-title"
              value={formState.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Evaluation title"
              autoComplete="off"
            />
          </Field>

          <MultiInputField
            label="What went well during practice?"
            placeholder="Something that went well..."
            values={formState.wentWell}
            onChange={(v) => updateField('wentWell', v)}
          />

          <MultiInputField
            label="What did you struggle with?"
            placeholder="Something you struggled with..."
            values={formState.struggled}
            onChange={(v) => updateField('struggled', v)}
          />

          <MultiInputField
            label="What do you understand better now?"
            placeholder="A new insight or understanding..."
            values={formState.understandBetter}
            onChange={(v) => updateField('understandBetter', v)}
          />

          <MultiInputField
            label="What feelings did you experience?"
            placeholder="A feeling you experienced..."
            values={formState.feelings}
            onChange={(v) => updateField('feelings', v)}
          />

          <MultiInputField
            label="What will you focus on next time?"
            placeholder="Something to focus on..."
            values={formState.focusNextTime}
            onChange={(v) => updateField('focusNextTime', v)}
          />

          <Field>
            <FieldLabel>Confidence Level</FieldLabel>
            <ConfidenceRating
              value={formState.confidenceLevel}
              onChange={(v) => updateField('confidenceLevel', v)}
            />
          </Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="practice-evaluation-form"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Complete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
