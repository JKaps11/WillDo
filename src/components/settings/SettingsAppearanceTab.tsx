import { Monitor, Moon, Sun } from 'lucide-react';

import { Settings } from './Settings';
import type { ReactNode } from 'react';
import type { AppearanceTheme } from '@/db/schemas/user.schema';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface SettingsAppearanceTabProps {
    theme: AppearanceTheme;
    onThemeChange: (theme: AppearanceTheme) => void;
}

export function SettingsAppearanceTab({ theme, onThemeChange }: SettingsAppearanceTabProps): ReactNode {
    return (
        <Settings.Root>
            <Settings.Header
                title="Appearance"
                description="Customize how the app looks and feels."
            />

            <Settings.Section
                title="Theme"
                description="Select your preferred color scheme."
            >
                <Settings.Field
                    label="Color Mode"
                    description="Choose between light, dark, or system preference."
                >
                    <ToggleGroup
                        type="single"
                        value={theme}
                        onValueChange={(value) => {
                            if (value) {
                                onThemeChange(value as AppearanceTheme);
                            }
                        }}
                        variant="outline"
                    >
                        <ToggleGroupItem value="light" aria-label="Light mode">
                            <Sun className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-2">Light</span>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="dark" aria-label="Dark mode">
                            <Moon className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-2">Dark</span>
                        </ToggleGroupItem>
                        <ToggleGroupItem value="system" aria-label="System preference">
                            <Monitor className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-2">System</span>
                        </ToggleGroupItem>
                    </ToggleGroup>
                </Settings.Field>
            </Settings.Section>
        </Settings.Root>
    );
}
