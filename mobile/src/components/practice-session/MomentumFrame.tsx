import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';

interface MomentumFrameProps {
  text: string;
}

export function MomentumFrame({ text }: MomentumFrameProps): React.ReactElement {
  return (
    <View className="flex-row items-center gap-2">
      <TrendingUp size={16} color="#6B7280" />
      <Text className="text-sm text-gray-500 dark:text-gray-400 flex-1">
        {text}
      </Text>
    </View>
  );
}
