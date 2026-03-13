import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface MicroWinBannerProps {
  text: string;
}

export function MicroWinBanner({ text }: MicroWinBannerProps): React.ReactElement {
  return (
    <View className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
      <View className="flex-row items-start gap-2">
        <Sparkles size={16} color="#F59E0B" style={{ marginTop: 2 }} />
        <View className="flex-1 gap-1">
          <Text className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Your words from a previous session:
          </Text>
          <Text className="text-sm italic text-gray-900 dark:text-white">
            &ldquo;{text}&rdquo;
          </Text>
        </View>
      </View>
    </View>
  );
}
