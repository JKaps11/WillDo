import { View } from 'react-native';
import type { ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({
  children,
  className = '',
  ...props
}: CardProps): React.ReactElement {
  return (
    <View
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
