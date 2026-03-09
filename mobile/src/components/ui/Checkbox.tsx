import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: number;
}

export function Checkbox({
  checked,
  onToggle,
  disabled = false,
  size = 24,
}: CheckboxProps): React.ReactElement {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      hitSlop={8}
      className={`items-center justify-center rounded-md border-2 ${
        checked
          ? 'bg-emerald-500 border-emerald-500'
          : 'border-gray-300 dark:border-gray-600 bg-transparent'
      } ${disabled ? 'opacity-50' : ''}`}
      style={{ width: size, height: size }}
    >
      {checked ? (
        <Check size={size - 8} color="white" strokeWidth={3} />
      ) : null}
    </Pressable>
  );
}
