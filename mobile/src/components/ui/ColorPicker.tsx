import { View, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#78716C', '#64748B', '#1E293B',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({
  value,
  onChange,
}: ColorPickerProps): React.ReactElement {
  return (
    <View className="flex-row flex-wrap gap-2">
      {PRESET_COLORS.map((color) => (
        <Pressable
          key={color}
          onPress={() => onChange(color)}
          className="rounded-full items-center justify-center"
          style={{
            width: 40,
            height: 40,
            backgroundColor: color,
          }}
        >
          {value === color ? (
            <Check size={20} color="white" strokeWidth={3} />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
