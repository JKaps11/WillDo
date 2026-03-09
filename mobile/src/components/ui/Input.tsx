import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps): React.ReactElement {
  return (
    <View className="mb-4">
      {label ? (
        <Text className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      ) : null}
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
          error
            ? 'border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error ? (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
