import { View, Text, Pressable } from 'react-native';
import type { StillTrueResponseValue } from '@willdo/shared';

interface StillTrueCardProps {
  text: string;
  onRespond: (response: StillTrueResponseValue) => void;
}

const RESPONSE_OPTIONS: Array<{
  value: StillTrueResponseValue;
  label: string;
  bgClass: string;
  textClass: string;
}> = [
  {
    value: 'still_struggling',
    label: 'Still Struggling',
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-600 dark:text-red-400',
  },
  {
    value: 'improved',
    label: 'Improved',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    bgClass: 'bg-green-500/10 border-green-500/30',
    textClass: 'text-green-600 dark:text-green-400',
  },
];

export function StillTrueCard({
  text,
  onRespond,
}: StillTrueCardProps): React.ReactElement {
  return (
    <View className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 gap-2">
      <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
        Still true?
      </Text>
      <Text className="text-sm italic text-gray-900 dark:text-white">
        &ldquo;{text}&rdquo;
      </Text>
      <View className="flex-row gap-2">
        {RESPONSE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onRespond(option.value)}
            className={`flex-1 items-center py-2 px-2 rounded-lg border ${option.bgClass}`}
          >
            <Text className={`text-xs font-medium ${option.textClass}`}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
