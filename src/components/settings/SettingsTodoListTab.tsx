import { Settings } from './Settings';
import type { ReactNode } from 'react';

import type {
  TodoListSortBy,
  TodoListTimeSpan,
} from '@/db/schemas/user.schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';

interface SettingsTodoListTabProps {
  sortBy: TodoListSortBy;
  timeSpan: TodoListTimeSpan;
  showCompleted: boolean;
  onSortByChange: (sortBy: TodoListSortBy) => void;
  onTimeSpanChange: (timeSpan: TodoListTimeSpan) => void;
  onShowCompletedChange: (showCompleted: boolean) => void;
}

export function SettingsTodoListTab({
  sortBy,
  timeSpan,
  showCompleted,
  onSortByChange,
  onTimeSpanChange,
  onShowCompletedChange,
}: SettingsTodoListTabProps): ReactNode {
  return (
    <Settings.Root>
      <Settings.Header
        title="Todo List"
        description="Configure how your todo lists are displayed."
      />

      <div className="space-y-6">
        <Settings.Section
          title="Display"
          description="Control what you see in your todo list."
        >
          <Settings.FieldGroup>
            <Settings.Field
              label="Default View"
              description="Choose between daily or weekly view."
            >
              <ToggleGroup
                value={[timeSpan]}
                onValueChange={(value) => {
                  if (value.length > 0) {
                    onTimeSpanChange(value[0] as TodoListTimeSpan);
                  }
                }}
                variant="outline"
              >
                <ToggleGroupItem value="day" aria-label="Day view">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Week view">
                  Week
                </ToggleGroupItem>
              </ToggleGroup>
            </Settings.Field>

            <Settings.FieldSeparator />

            <Settings.Field
              label="Show Completed Tasks"
              description="Display tasks that have been marked as done."
              htmlFor="show-completed"
            >
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={onShowCompletedChange}
              />
            </Settings.Field>
          </Settings.FieldGroup>
        </Settings.Section>

        <Settings.Section
          title="Sorting"
          description="Choose how tasks are ordered in your lists."
        >
          <Settings.Field
            label="Sort By"
            description="Default sorting method for tasks."
          >
            <Select
              value={sortBy}
              onValueChange={(value) => onSortByChange(value as TodoListSortBy)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="date">Due Date</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </Settings.Field>
        </Settings.Section>
      </div>
    </Settings.Root>
  );
}
