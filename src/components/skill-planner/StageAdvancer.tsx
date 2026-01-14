import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight } from 'lucide-react';

import { STAGE_ACTION_LABELS, STAGE_ORDER } from './constants';
import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';

interface StageAdvancerProps {
  subSkillId: string;
  currentStage: SubSkillStage;
  isLocked: boolean;
  metricsFilled: boolean;
}

export function StageAdvancer({
  subSkillId,
  currentStage,
  isLocked,
  metricsFilled,
}: StageAdvancerProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const advanceMutation = useMutation(
    trpc.subSkill.advanceStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['skill'] });
      },
    }),
  );

  const completeMutation = useMutation(
    trpc.subSkill.complete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['skill'] });
      },
    }),
  );

  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const isComplete = currentStage === 'complete';
  const canAdvance =
    !isLocked && !isComplete && currentIndex < STAGE_ORDER.length - 2;
  const canComplete = !isLocked && !isComplete && metricsFilled;

  const nextStage = canAdvance ? STAGE_ORDER[currentIndex] : null;

  const handleAdvance = (): void => {
    advanceMutation.mutate({ id: subSkillId });
  };

  const handleComplete = (): void => {
    completeMutation.mutate({ id: subSkillId });
  };

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="size-4" />
        <span>Completed</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {STAGE_ORDER.map((stage, index) => (
          <div key={stage} className="flex items-center">
            <div
              className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                index <= currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            {index < STAGE_ORDER.length - 1 && (
              <div
                className={`h-0.5 w-4 ${
                  index < currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {canAdvance && (
          <Button
            size="sm"
            variant="default"
            onClick={handleAdvance}
            disabled={advanceMutation.isPending}
          >
            {nextStage && STAGE_ACTION_LABELS[nextStage]}
            <ChevronRight className="ml-1 size-4" />
          </Button>
        )}

        {canComplete && (
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={completeMutation.isPending}
          >
            <CheckCircle2 className="mr-1 size-4" />
            Mark Complete
          </Button>
        )}

        {isLocked && (
          <p className="text-sm text-muted-foreground">
            Complete prerequisite sub-skills first
          </p>
        )}
      </div>
    </div>
  );
}
