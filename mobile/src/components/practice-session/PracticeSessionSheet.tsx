import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react-native';
import { useTRPC } from '@/lib/trpc/client';
import { Button } from '@/components/ui';
import { PrePracticeFlow } from './PrePracticeFlow';
import { PostPracticeFlow } from './PostPracticeFlow';
import type { StillTrueResponseValue, UserMetricsResponse } from '@willdo/shared';
import { DEFAULT_USER_SETTINGS } from '@willdo/shared';
import { checkAndFireCelebrations, rescheduleAllNotifications } from '@/lib/notifications';

type SessionStep = 'pre' | 'practicing' | 'post';

interface StillTrueCardData {
  sessionId: string;
  responseId: string | null;
  text: string;
}

interface ReflectionPrompt {
  key: string;
  text: string;
  category: string;
}

interface PrePracticeData {
  microWin: string | null;
  momentumText: string;
  stillTrueCards: Array<StillTrueCardData>;
  selectedPrompts: Array<ReflectionPrompt>;
}

interface StillTrueAnswer {
  sourceSessionId: string;
  sourceResponseId: string | null;
  sourceText: string;
  response: StillTrueResponseValue;
}

interface SessionFormState {
  step: SessionStep;
  preConfidence: number;
  postConfidence: number;
  reflectionAnswers: Record<string, string>;
  stillTrueAnswers: Array<StillTrueAnswer>;
  answeredStillTrue: Set<string>;
}

const INITIAL_FORM_STATE: SessionFormState = {
  step: 'pre',
  preConfidence: 5,
  postConfidence: 5,
  reflectionAnswers: {},
  stillTrueAnswers: [],
  answeredStillTrue: new Set(),
};

interface TaskForSession {
  id: string;
  name: string;
  subSkillId: string;
}

interface PracticeSessionSheetProps {
  task: TaskForSession | null;
  occurrenceDate: Date | null;
  onClose: () => void;
}

export function PracticeSessionSheet({
  task,
  occurrenceDate,
  onClose,
}: PracticeSessionSheetProps): React.ReactElement | null {
  const [formState, setFormState] = useState<SessionFormState>(INITIAL_FORM_STATE);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const previousMetricsRef = useRef<UserMetricsResponse | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const snapPoints = useMemo(() => ['85%'], []);

  const isOpen = task !== null;

  const { data: prePracticeData } = useQuery({
    ...trpc.practiceSession.getPrePracticeData.queryOptions({
      subSkillId: task?.subSkillId ?? '',
    }),
    enabled: isOpen && !!task?.subSkillId,
  });

  const metricsQuery = useQuery(trpc.metrics.getUserMetrics.queryOptions());
  const userQuery = useQuery(trpc.user.get.queryOptions());

  const completeWithSessionMutation = useMutation(
    trpc.task.completeWithSession.mutationOptions({
      onMutate: () => {
        previousMetricsRef.current = (metricsQuery.data as UserMetricsResponse | undefined) ?? null;
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.dashboard.getTodaysTasks.queryKey() }),
          queryClient.invalidateQueries({ queryKey: ['skill'] }),
          queryClient.invalidateQueries({ queryKey: trpc.metrics.getUserMetrics.queryKey() }),
        ]);

        // Fire celebration notifications
        const newMetrics = queryClient.getQueryData<UserMetricsResponse>(
          trpc.metrics.getUserMetrics.queryKey(),
        );
        const prev = previousMetricsRef.current;
        const userData = userQuery.data as { settings?: { notifications?: typeof DEFAULT_USER_SETTINGS.notifications } } | undefined;
        const notifSettings =
          userData?.settings?.notifications ??
          DEFAULT_USER_SETTINGS.notifications;

        if (prev && newMetrics && notifSettings.celebrations) {
          checkAndFireCelebrations(prev, newMetrics);
        }

        if (newMetrics) {
          const tasks = queryClient.getQueryData<Array<{ completed: boolean }>>(
            trpc.dashboard.getTodaysTasks.queryKey(),
          );
          rescheduleAllNotifications({
            settings: notifSettings,
            currentStreak: newMetrics.currentStreak,
            lastActivityDate: newMetrics.lastActivityDate,
            incompleteTodayCount: (tasks ?? []).filter((t) => !t.completed).length,
          });
        }

        handleClose();
      },
    }),
  );

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    setFormState(INITIAL_FORM_STATE);
    onClose();
  }, [onClose]);

  function handlePreConfidenceChange(value: number): void {
    setFormState((prev) => ({
      ...prev,
      preConfidence: value,
      postConfidence: value,
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
    setFormState((prev) => ({ ...prev, step: 'practicing' }));
  }

  function handleDonePracticing(): void {
    setFormState((prev) => ({ ...prev, step: 'post' }));
  }

  function handleSubmit(): void {
    if (!task || !occurrenceDate || !prePracticeData) return;

    const data = prePracticeData as PrePracticeData;
    const reflections = data.selectedPrompts
      .map((prompt: ReflectionPrompt, i: number) => ({
        promptKey: prompt.key,
        promptText: prompt.text,
        promptCategory: prompt.category,
        responseText: (formState.reflectionAnswers[prompt.key] ?? '').trim(),
        sortOrder: i,
      }))
      .filter((r: { responseText: string }) => r.responseText.length > 0);

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

  if (!isOpen) return null;

  const stepTitle =
    formState.step === 'pre'
      ? 'Prepare to Practice'
      : formState.step === 'practicing'
        ? 'Practice Time'
        : 'Reflect on Practice';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      backgroundStyle={{ backgroundColor: '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB' }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {stepTitle}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {task.name}
          </Text>
        </View>

        {/* Content */}
        {formState.step === 'pre' && prePracticeData ? (
          <PrePracticeFlow
            microWin={(prePracticeData as PrePracticeData).microWin}
            momentumText={(prePracticeData as PrePracticeData).momentumText}
            stillTrueCards={(prePracticeData as PrePracticeData).stillTrueCards}
            selectedPrompts={(prePracticeData as PrePracticeData).selectedPrompts}
            preConfidence={formState.preConfidence}
            onConfidenceChange={handlePreConfidenceChange}
            onStillTrueRespond={handleStillTrueRespond}
            answeredStillTrue={formState.answeredStillTrue}
            onBeginPractice={handleBeginPractice}
          />
        ) : formState.step === 'pre' ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator color="#2DB88A" />
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Loading...
            </Text>
          </View>
        ) : null}

        {formState.step === 'practicing' ? (
          <View className="flex-1 items-center justify-center gap-6 px-4 py-8">
            <Play size={48} color="#2DB88A" />
            <Text className="text-center text-lg font-medium text-gray-900 dark:text-white">
              Go practice! Take your time.
            </Text>
            <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
              When you're done, come back and reflect on your session.
            </Text>
            <Button
              title="I'm done practicing"
              onPress={handleDonePracticing}
              variant="secondary"
              size="lg"
            />
          </View>
        ) : null}

        {formState.step === 'post' && prePracticeData ? (
          <PostPracticeFlow
            selectedPrompts={(prePracticeData as PrePracticeData).selectedPrompts}
            reflectionAnswers={formState.reflectionAnswers}
            onReflectionChange={handleReflectionChange}
            preConfidence={formState.preConfidence}
            postConfidence={formState.postConfidence}
            onPostConfidenceChange={handlePostConfidenceChange}
            onSubmit={handleSubmit}
            isSubmitting={completeWithSessionMutation.isPending}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}
