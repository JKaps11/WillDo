import { View, Text } from 'react-native';
import { Slider } from '@/components/ui';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  comparisonValue?: number;
  label?: string;
}

function getAdaptiveMessage(value: number): string {
  if (value <= 3) return 'No pressure — just explore';
  if (value <= 6) return "Good place to be — let's build on what you know";
  return "Let's see what you've got";
}

export function ConfidenceSlider({
  value,
  onChange,
  comparisonValue,
  label = 'Confidence',
}: ConfidenceSliderProps): React.ReactElement {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 dark:text-white">
          {value}/10
        </Text>
      </View>
      <Slider value={value} onValueChange={onChange} min={1} max={10} />
      <Text className="text-xs italic text-gray-500 dark:text-gray-400">
        {getAdaptiveMessage(value)}
      </Text>
      {comparisonValue !== undefined && (
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Pre: {comparisonValue}/10
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500">→</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Post: {value}/10
          </Text>
          <DeltaBadge pre={comparisonValue} post={value} />
        </View>
      )}
    </View>
  );
}

interface DeltaBadgeProps {
  pre: number;
  post: number;
}

function DeltaBadge({ pre, post }: DeltaBadgeProps): React.ReactElement | null {
  const delta = post - pre;
  if (delta === 0) return null;

  return (
    <View
      className={`ml-auto rounded-full px-2 py-0.5 ${
        delta > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          delta > 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {delta > 0 ? '+' : ''}
        {delta}
      </Text>
    </View>
  );
}
