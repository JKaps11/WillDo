import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { Play } from 'lucide-react';

import { PrePracticeFlow } from './PrePracticeFlow';
import { PostPracticeFlow } from './PostPracticeFlow';
import type { StillTrueResponseValue } from '@willdo/shared';
import type { ReflectionPrompt } from '@/lib/constants/reflection-prompts';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStore, uiStoreActions } from '@/lib/store';

interface StillTrueAnswer {
  sourceSessionId: string;
  sourceResponseId: string | null;
  sourceText: string;
  response: StillTrueResponseValue;
}

interface SessionFormState {
  preConfidence: number;
  postConfidence: number;
  reflectionAnswers: Record<string, string>;
  stillTrueAnswers: Array<StillTrueAnswer>;
  answeredStillTrue: Set<string>;
}

const INITIAL_FORM_STATE: SessionFormState = {
  preConfidence: 5,
  postConfidence: 5,
  reflectionAnswers: {},
  stillTrueAnswers: [],
  answeredStillTrue: new Set(),
};

export function PracticeSessionModal(): React.ReactElement | null {
  const { isOpen, task, occurrenceDate, step } = useStore(
    uiStore,
    (s) => s.sessionModal,
  );

  const [formState, setFormState] =
    useState<SessionFormState>(INITIAL_FORM_STATE);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: prePracticeData } = useQuery({
    ...trpc.practiceSession.getPrePracticeData.queryOptions({
      subSkillId: task?.subSkillId ?? '',
    }),
    enabled: isOpen && !!task?.subSkillId,
  });

  const completeWithSessionMutation = useMutation(
    trpc.task.completeWithSession.mutationOptions({
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
          queryKey: trpc.user.getMetrics.queryKey(),
        });
        handleClose();
      },
    }),
  );

  function handleClose(): void {
    uiStoreActions.closeSessionModal();
    setFormState(INITIAL_FORM_STATE);
  }

  function handlePreConfidenceChange(value: number): void {
    setFormState((prev) => ({
      ...prev,
      preConfidence: value,
      postConfidence: value, // Initialize post to same as pre
    }));
  }

  function handlePostConfidenceChange(value: number): void {
    setFormState((prev) => ({ ...prev, postConfidence: value }));
  }

  function handleStillTrueRespond(answer: StillTrueAnswer): void {
    const key = answer.sourceSessionId + (answer.sourceResponseId ?? '');
    setFormState((prev) => ({
      ...prev,
      stillTrueAnswers: [...prev.stillTrueAnswers, answer],
      answeredStillTrue: new Set([...prev.answeredStillTrue, key]),
    }));
  }

  function handleReflectionChange(promptKey: string, value: string): void {
    setFormState((prev) => ({
      ...prev,
      reflectionAnswers: {
        ...prev.reflectionAnswers,
        [promptKey]: value,
      },
    }));
  }

  function handleBeginPractice(): void {
    uiStoreActions.setSessionStep('practicing');
  }

  function handleDonePracticing(): void {
    uiStoreActions.setSessionStep('post');
  }

  function handleSubmit(): void {
    if (!task || !occurrenceDate || !prePracticeData) return;

    const reflections = prePracticeData.selectedPrompts
      .map((prompt: ReflectionPrompt, i: number) => ({
        promptKey: prompt.key,
        promptText: prompt.text,
        promptCategory: prompt.category,
        responseText: (formState.reflectionAnswers[prompt.key] ?? '').trim(),
        sortOrder: i,
      }))
      .filter((r) => r.responseText.length > 0);

    if (reflections.length === 0) return;

    completeWithSessionMutation.mutate({
      taskId: task.id,
      occurrenceDate,
      session: {
        title: `${task.name} - ${occurrenceDate.toLocaleDateString()}`,
        preConfidence: formState.preConfidence,
        postConfidence: formState.postConfidence,
        reflections,
        stillTrueResponses:
          formState.stillTrueAnswers.length > 0
            ? formState.stillTrueAnswers
            : undefined,
      },
    });
  }

  if (!isOpen || !task) return null;

  const stepTitle =
    step === 'pre'
      ? 'Prepare to Practice'
      : step === 'practicing'
        ? 'Practice Time'
        : 'Reflect on Practice';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{stepTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground">{task.name}</p>
        </DialogHeader>

        {step === 'pre' && prePracticeData && (
          <PrePracticeFlow
            microWin={prePracticeData.microWin}
            momentumText={prePracticeData.momentumText}
            stillTrueCards={prePracticeData.stillTrueCards}
            selectedPrompts={prePracticeData.selectedPrompts}
            preConfidence={formState.preConfidence}
            onConfidenceChange={handlePreConfidenceChange}
            onStillTrueRespond={handleStillTrueRespond}
            answeredStillTrue={formState.answeredStillTrue}
            onBeginPractice={handleBeginPractice}
          />
        )}

        {step === 'pre' && !prePracticeData && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading...
          </div>
        )}

        {step === 'practicing' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <Play className="size-12 text-primary" />
            <p className="text-center text-lg font-medium">
              Go practice! Take your time.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              When you&apos;re done, come back and reflect on your session.
            </p>
            <Button onClick={handleDonePracticing} size="lg" variant="outline">
              I&apos;m done practicing
            </Button>
          </div>
        )}

        {step === 'post' && prePracticeData && (
          <PostPracticeFlow
            selectedPrompts={prePracticeData.selectedPrompts}
            reflectionAnswers={formState.reflectionAnswers}
            onReflectionChange={handleReflectionChange}
            preConfidence={formState.preConfidence}
            postConfidence={formState.postConfidence}
            onPostConfidenceChange={handlePostConfidenceChange}
            onSubmit={handleSubmit}
            isSubmitting={completeWithSessionMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
