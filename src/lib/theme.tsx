import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AppearanceTheme } from '@/db/schemas/user.schema';
import type { ReactNode } from 'react';

const THEME_STORAGE_KEY = 'willdo-theme';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppearanceTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: AppearanceTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredTheme(): AppearanceTheme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function applyTheme(theme: AppearanceTheme): void {
  if (typeof document === 'undefined') return;

  const resolved: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: AppearanceTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps): ReactNode {
  const [theme, setThemeState] = useState<AppearanceTheme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return getStoredTheme();
  });

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (theme === 'system') {
      return typeof window !== 'undefined' ? getSystemTheme() : 'light';
    }
    return theme;
  }, [theme]);

  const setTheme = useCallback((newTheme: AppearanceTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when using 'system' preference
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (): void => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Sync with storage changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent): void => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as AppearanceTheme;
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Inline script to prevent FOUC (Flash of Unstyled Content).
 * This script runs before React hydrates to apply the correct theme class.
 * Must be placed in the <head> or at the start of <body>.
 */
export const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  } catch (e) {}
})();
`;
