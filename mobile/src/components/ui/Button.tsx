import { Pressable, Text, ActivityIndicator } from 'react-native';
import type { PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-emerald-500 active:bg-emerald-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-gray-100 dark:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700',
    text: 'text-gray-900 dark:text-white',
  },
  destructive: {
    container: 'bg-red-500 active:bg-red-600',
    text: 'text-white',
  },
  ghost: {
    container: 'bg-transparent active:bg-gray-100 dark:active:bg-gray-800',
    text: 'text-gray-900 dark:text-white',
  },
};

const sizeStyles: Record<string, { container: string; text: string }> = {
  sm: { container: 'py-2 px-3 rounded-md', text: 'text-sm' },
  md: { container: 'py-3 px-4 rounded-lg', text: 'text-base' },
  lg: { container: 'py-3.5 px-6 rounded-lg', text: 'text-lg' },
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  ...props
}: ButtonProps): React.ReactElement {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <Pressable
      className={`items-center justify-center flex-row ${sStyle.container} ${vStyle.container} ${disabled || loading ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? 'white' : '#71717A'}
          size="small"
        />
      ) : (
        <Text className={`font-semibold ${sStyle.text} ${vStyle.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
