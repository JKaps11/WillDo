import { View, Text } from 'react-native';
import type { Priority, SubSkillStage } from '@willdo/shared';

type BadgeVariant = 'default' | 'priority' | 'stage';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  Very_Low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
  Low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  Medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  High: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  Very_High: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

const STAGE_COLORS: Record<SubSkillStage, { bg: string; text: string }> = {
  not_started: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
  practice: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  evaluate: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  complete: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
};

export function Badge({ label, variant = 'default' }: BadgeProps): React.ReactElement {
  let bg = 'bg-gray-100 dark:bg-gray-700';
  let textColor = 'text-gray-600 dark:text-gray-300';

  if (variant === 'default') {
    // use defaults
  }

  return (
    <View className={`px-2.5 py-1 rounded-full ${bg}`}>
      <Text className={`text-xs font-medium ${textColor}`}>{label}</Text>
    </View>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }): React.ReactElement {
  const colors = PRIORITY_COLORS[priority];
  const label = priority.replace('_', ' ');
  return (
    <View className={`px-2.5 py-1 rounded-full ${colors.bg}`}>
      <Text className={`text-xs font-medium ${colors.text}`}>{label}</Text>
    </View>
  );
}

export function StageBadge({ stage }: { stage: SubSkillStage }): React.ReactElement {
  const colors = STAGE_COLORS[stage];
  const label = stage.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <View className={`px-2.5 py-1 rounded-full ${colors.bg}`}>
      <Text className={`text-xs font-medium ${colors.text}`}>{label}</Text>
    </View>
  );
}
