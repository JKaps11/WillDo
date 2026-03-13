import { View, Text } from 'react-native';

interface ConfidenceComparisonProps {
  preConfidence: number;
  postConfidence: number;
}

export function ConfidenceComparison({
  preConfidence,
  postConfidence,
}: ConfidenceComparisonProps): React.ReactElement {
  const delta = postConfidence - preConfidence;

  return (
    <View className="flex-row items-center justify-center gap-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <View className="items-center">
        <Text className="text-xs text-gray-500 dark:text-gray-400">Before</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {preConfidence}
        </Text>
      </View>
      <View className="items-center">
        <Text className="text-xs text-transparent">_</Text>
        <Text
          className={`text-lg font-semibold ${
            delta > 0
              ? 'text-green-600 dark:text-green-400'
              : delta < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta}
        </Text>
      </View>
      <View className="items-center">
        <Text className="text-xs text-gray-500 dark:text-gray-400">After</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          {postConfidence}
        </Text>
      </View>
    </View>
  );
}
