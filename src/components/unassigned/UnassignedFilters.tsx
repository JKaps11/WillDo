import { Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export type StageFilter = 'all' | 'in_progress' | 'not_started';

interface UnassignedFiltersProps {
  stageFilter: StageFilter;
  onStageFilterChange: (filter: StageFilter) => void;
  showGroupBySkill: boolean;
  onGroupBySkillChange: (show: boolean) => void;
}

export function UnassignedFilters({
  stageFilter,
  onStageFilterChange,
  showGroupBySkill,
  onGroupBySkillChange,
}: UnassignedFiltersProps): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
          <Filter className="size-4" />
          Filters
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Stage</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={stageFilter === 'all'}
          onCheckedChange={() => onStageFilterChange('all')}
        >
          All Stages
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={stageFilter === 'in_progress'}
          onCheckedChange={() => onStageFilterChange('in_progress')}
        >
          In Progress
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={stageFilter === 'not_started'}
          onCheckedChange={() => onStageFilterChange('not_started')}
        >
          Not Started
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Display</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={showGroupBySkill}
          onCheckedChange={onGroupBySkillChange}
        >
          Group by Skill
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
