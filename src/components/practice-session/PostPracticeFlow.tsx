import { ConfidenceSlider } from './ConfidenceSlider';
import { ConfidenceComparison } from './ConfidenceComparison';
import { ReflectionPromptInput } from './ReflectionPromptInput';
import type { ReflectionPrompt } from '@/lib/constants/reflection-prompts';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-5">
      <h3 className="text-sm font-medium">Reflect on your practice session:</h3>

      {/* Rotating reflection prompts */}
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
        onClick={onSubmit}
        className="w-full"
        size="lg"
        disabled={!allAnswered || isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Complete Session'}
      </Button>
    </div>
  );
}
