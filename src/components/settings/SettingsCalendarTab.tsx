import { Settings } from './Settings';
import type { ReactNode } from 'react';

export function SettingsCalendarTab(): ReactNode {
    return (
        <Settings.Root>
            <Settings.Header
                title="Calendar"
                description="Configure calendar settings and integrations."
            />

            <Settings.Placeholder
                title="Coming Soon"
                description="Calendar settings will be available in a future update."
            />
        </Settings.Root>
    );
}
