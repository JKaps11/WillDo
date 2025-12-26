import { Settings } from './Settings';
import type { ReactNode } from 'react';

export function SettingsTasksTab(): ReactNode {
    return (
        <Settings.Root>
            <Settings.Header
                title="Tasks"
                description="Configure default task settings."
            />

            <Settings.Placeholder
                title="Coming Soon"
                description="Task settings will be available in a future update."
            />
        </Settings.Root>
    );
}
