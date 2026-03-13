import { View, Text, TextInput } from 'react-native';

interface ReflectionPromptInputProps {
  promptText: string;
  value: string;
  onChange: (value: string) => void;
  index: number;
}

export function ReflectionPromptInput({
  promptText,
  value,
  onChange,
}: ReflectionPromptInputProps): React.ReactElement {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gray-900 dark:text-white">
        {promptText}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Write your reflection..."
        placeholderTextColor="#9CA3AF"
        multiline
        textAlignVertical="top"
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[80px]"
      />
    </View>
  );
}
