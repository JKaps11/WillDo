import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui';
import { ConfidenceSlider } from './ConfidenceSlider';
import { ConfidenceComparison } from './ConfidenceComparison';
import { ReflectionPromptInput } from './ReflectionPromptInput';

interface ReflectionPrompt {
  key: string;
  text: string;
  category: string;
}

interface PostPracticeFlowProps {
  selectedPrompts: Array<ReflectionPrompt>;
  reflectionAnswers: Record<string, string>;
  onReflectionChange: (promptKey: string, value: string) => void;
  preConfidence: number;
  postConfidence: number;
  onPostConfidenceChange: (value: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PostPracticeFlow({
  selectedPrompts,
  reflectionAnswers,
  onReflectionChange,
  preConfidence,
  postConfidence,
  onPostConfidenceChange,
  onSubmit,
  isSubmitting,
}: PostPracticeFlowProps): React.ReactElement {
  const allAnswered = selectedPrompts.every(
    (p) => (reflectionAnswers[p.key] ?? '').trim().length > 0,
  );

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-sm font-medium text-gray-900 dark:text-white">
        Reflect on your practice session:
      </Text>

      {/* Reflection prompts */}
      {selectedPrompts.map((prompt, i) => (
        <ReflectionPromptInput
          key={prompt.key}
          promptText={prompt.text}
          value={reflectionAnswers[prompt.key] ?? ''}
          onChange={(val) => onReflectionChange(prompt.key, val)}
          index={i}
        />
      ))}

      {/* Post-confidence slider with comparison */}
      <ConfidenceSlider
        value={postConfidence}
        onChange={onPostConfidenceChange}
        comparisonValue={preConfidence}
        label="How confident are you now?"
      />

      {/* Pre vs post comparison */}
      <ConfidenceComparison
        preConfidence={preConfidence}
        postConfidence={postConfidence}
      />

      {/* Submit */}
      <Button
        title={isSubmitting ? 'Saving...' : 'Complete Session'}
        onPress={onSubmit}
        size="lg"
        disabled={!allAnswered || isSubmitting}
        loading={isSubmitting}
      />
    </ScrollView>
  );
}
