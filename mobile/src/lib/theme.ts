/**
 * Theme constants mapping web app CSS variables to RN-compatible values.
 * Used by components that need programmatic color access.
 */
export const colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#1A1B2E',
    card: '#FFFFFF',
    cardForeground: '#1A1B2E',
    primary: '#2DB88A',
    primaryForeground: '#F5FBF8',
    secondary: '#F4F4F5',
    secondaryForeground: '#27272A',
    muted: '#F4F4F5',
    mutedForeground: '#71717A',
    destructive: '#EF4444',
    border: '#E4E4E7',
    input: '#E4E4E7',
  },
  dark: {
    background: '#1A1B2E',
    foreground: '#F9FAFB',
    card: '#2A2B42',
    cardForeground: '#F9FAFB',
    primary: '#3DD9A0',
    primaryForeground: '#1A3A2E',
    secondary: '#3A3B52',
    secondaryForeground: '#F9FAFB',
    muted: '#3A3B52',
    mutedForeground: '#9CA3AF',
    destructive: '#F87171',
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.15)',
  },
  stage: {
    not_started: '#9CA3AF',
    practice: '#3B82F6',
    evaluate: '#8B5CF6',
    complete: '#10B981',
  },
} as const;
