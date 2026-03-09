import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = false,
  color = 'bg-emerald-500',
  height = 8,
}: ProgressBarProps): React.ReactElement {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View>
      {label || showPercentage ? (
        <View className="flex-row justify-between mb-1">
          {label ? (
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {label}
            </Text>
          ) : null}
          {showPercentage ? (
            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round(clampedProgress)}%
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        className="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        style={{ height }}
      >
        <View
          className={`${color} rounded-full h-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </View>
    </View>
  );
}
