import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps): React.ReactElement {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {Icon ? (
        <Icon size={48} color="#9CA3AF" strokeWidth={1.5} />
      ) : null}
      <Text className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-4 text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
