import { Settings } from './Settings';
import type { ReactNode } from 'react';

export function SettingsIntegrationsTab(): ReactNode {
  return (
    <Settings.Root>
      <Settings.Header
        title="Integrations"
        description="Connect with external services and apps."
      />

      <Settings.Placeholder
        title="No integrations available"
        description="Integrations will be added in a future update."
      />
    </Settings.Root>
  );
}
