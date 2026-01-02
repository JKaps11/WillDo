import { Settings } from './Settings';
import type { ReactNode } from 'react';

import type { DefaultHomePage } from '@/db/schemas/user.schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingsGeneralTabProps {
  defaultHomePage: DefaultHomePage;
  onDefaultHomePageChange: (defaultHomePage: DefaultHomePage) => void;
}

const HOME_PAGE_LABELS: Record<DefaultHomePage, string> = {
  todolist: 'Todo List',
  unassigned: 'Unassigned Tasks',
  calendar: 'Calendar',
};

export function SettingsGeneralTab({
  defaultHomePage,
  onDefaultHomePageChange,
}: SettingsGeneralTabProps): ReactNode {
  return (
    <Settings.Root>
      <Settings.Header
        title="General"
        description="Configure general application settings."
      />

      <Settings.Section
        title="Navigation"
        description="Set your preferred navigation defaults."
      >
        <Settings.Field
          label="Default Home Page"
          description="The page to show when you open the app."
        >
          <Select
            value={defaultHomePage}
            onValueChange={(value) =>
              onDefaultHomePageChange(value as DefaultHomePage)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue>{HOME_PAGE_LABELS[defaultHomePage]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todolist">Todo List</SelectItem>
              <SelectItem value="unassigned">Unassigned Tasks</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
            </SelectContent>
          </Select>
        </Settings.Field>
      </Settings.Section>
    </Settings.Root>
  );
}
