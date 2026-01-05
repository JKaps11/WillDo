import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';

import { Check, Plus, X } from 'lucide-react';
import type { StageFilter } from '@/components/unassigned/UnassignedFilters';
import type { TaskWithSkillInfo } from '@/db/repositories/task.repository';
import type { Priority } from '@/db/schemas/task.schema';
import type { UnassignedSortOption } from '@/lib/store';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnassignedFilters } from '@/components/unassigned/UnassignedFilters';
import { SkillGroupHeader } from '@/components/unassigned/SkillGroupHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTRPC } from '@/integrations/trpc/react';
import { UnassignedTask } from '@/components/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { startOfDay } from '@/utils/dates';
import { ensureUser } from '@/utils/auth';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/unassigned')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

const PRIORITY_RANK: Record<Priority, number> = {
  Very_High: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Very_Low: 1,
};

interface SkillGroup {
  skillId: string;
  skillName: string;
  skillColor: string;
  skillIcon: string | null;
  tasks: Array<TaskWithSkillInfo>;
}

function sortTasks(
  tasks: Array<TaskWithSkillInfo>,
  sortBy: UnassignedSortOption,
): Array<TaskWithSkillInfo> {
  const sorted = [...tasks];

  // Always push completed to bottom
  sorted.sort((a, b) => Number(a.completed) - Number(b.completed));

  if (sortBy === 'alphabetical') {
    sorted.sort((a, b) => {
      const c = Number(a.completed) - Number(b.completed);
      if (c !== 0) return c;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }

  // sortBy === 'priority'
  sorted.sort((a, b) => {
    const c = Number(a.completed) - Number(b.completed);
    if (c !== 0) return c;
    return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  });
  return sorted;
}

function filterByStage(
  tasks: Array<TaskWithSkillInfo>,
  stageFilter: StageFilter,
): Array<TaskWithSkillInfo> {
  if (stageFilter === 'all') return tasks;

  return tasks.filter((task) => {
    if (!task.subSkill) return stageFilter === 'not_started';
    if (stageFilter === 'in_progress') {
      return ['practice', 'feedback', 'evaluate'].includes(task.subSkill.stage);
    }
    return task.subSkill.stage === 'not_started';
  });
}

function groupBySkill(
  tasks: Array<TaskWithSkillInfo>,
): Array<SkillGroup | TaskWithSkillInfo> {
  const skillGroups = new Map<string, SkillGroup>();
  const ungroupedTasks: Array<TaskWithSkillInfo> = [];

  for (const task of tasks) {
    if (task.skill) {
      const existing = skillGroups.get(task.skill.id);
      if (existing) {
        existing.tasks.push(task);
      } else {
        skillGroups.set(task.skill.id, {
          skillId: task.skill.id,
          skillName: task.skill.name,
          skillColor: task.skill.color,
          skillIcon: task.skill.icon,
          tasks: [task],
        });
      }
    } else {
      ungroupedTasks.push(task);
    }
  }

  // Return skill groups followed by ungrouped tasks
  const result: Array<SkillGroup | TaskWithSkillInfo> = [];
  result.push(...skillGroups.values());
  result.push(...ungroupedTasks);
  return result;
}

function isSkillGroup(
  item: SkillGroup | TaskWithSkillInfo,
): item is SkillGroup {
  return 'skillId' in item && 'tasks' in item;
}

function RouteComponent(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const sortBy = useStore(uiStore, (s) => s.unassignedSortBy);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [showGroupBySkill, setShowGroupBySkill] = useState<boolean>(true);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: tasks,
    isLoading,
    isError,
  } = useQuery(trpc.task.listUnassignedWithSkillInfo.queryOptions());

  const createTaskMutation = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.task.listUnassignedWithSkillInfo.queryKey(),
        });
        setNewTaskTitle('');
        setIsCreating(false);
      },
    }),
  );

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Initialize expanded skills when data loads
  useEffect(() => {
    if (tasks && expandedSkills.size === 0) {
      const skillIds = new Set<string>();
      for (const task of tasks) {
        if (task.skill) {
          skillIds.add(task.skill.id);
        }
      }
      setExpandedSkills(skillIds);
    }
  }, [tasks, expandedSkills.size]);

  const processedData = useMemo(() => {
    if (!tasks) return { items: [], total: 0, done: 0 };

    const filtered = filterByStage(tasks, stageFilter);
    const sorted = sortTasks(filtered, sortBy);
    const items = showGroupBySkill ? groupBySkill(sorted) : sorted;

    return {
      items,
      total: filtered.length,
      done: filtered.filter((t) => t.completed).length,
    };
  }, [tasks, stageFilter, sortBy, showGroupBySkill]);

  const toggleSkillExpanded = useCallback((skillId: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="mx-auto w-full px-4 py-6">
        <Card>
          <CardContent className="py-14 text-center">
            <div className="text-base font-medium">
              Couldn't load unassigned tasks
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleCreateTask(): void {
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      name: newTaskTitle.trim(),
      todoListDate: startOfDay(new Date()),
    });
  }

  function handleCancel(): void {
    setIsCreating(false);
    setNewTaskTitle('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      handleCreateTask();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }

  return (
    <div className="mx-auto w-full px-4 py-6">
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-medium">
                Tasks Without Date
              </CardTitle>
              <div className="flex items-center gap-2">
                <UnassignedFilters
                  stageFilter={stageFilter}
                  onStageFilterChange={setStageFilter}
                  showGroupBySkill={showGroupBySkill}
                  onGroupBySkillChange={setShowGroupBySkill}
                />
                <Badge variant="secondary" className="shrink-0">
                  {processedData.done}/{processedData.total}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {processedData.items.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {stageFilter !== 'all'
                  ? 'No tasks match the current filter.'
                  : 'No unassigned tasks'}
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto overflow-x-hidden rounded-md">
                <div className="flex flex-col gap-1 p-1">
                  {processedData.items.map((item) => {
                    if (isSkillGroup(item)) {
                      const isExpanded = expandedSkills.has(item.skillId);
                      const completedCount = item.tasks.filter(
                        (t) => t.completed,
                      ).length;

                      return (
                        <div key={item.skillId} className="mb-2">
                          <SkillGroupHeader
                            skillName={item.skillName}
                            skillColor={item.skillColor}
                            skillIcon={item.skillIcon}
                            taskCount={item.tasks.length}
                            completedCount={completedCount}
                            isExpanded={isExpanded}
                            onToggle={() => toggleSkillExpanded(item.skillId)}
                          />
                          {isExpanded && (
                            <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 pl-2">
                              {item.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="relative overflow-hidden"
                                >
                                  <UnassignedTask
                                    task={task}
                                    showSkillInfo={false}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="relative overflow-hidden">
                        <UnassignedTask task={item} showSkillInfo />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inline Task Creation */}
            {isCreating ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <Input
                  ref={inputRef}
                  placeholder="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                  disabled={createTaskMutation.isPending}
                />
                <Button
                  size="icon"
                  onClick={handleCreateTask}
                  disabled={
                    !newTaskTitle.trim() || createTaskMutation.isPending
                  }
                  className="h-9 w-9 shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={createTaskMutation.isPending}
                  className="h-9 w-9 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : // <Button
            //   variant="ghost"
            //   onClick={() => setIsCreating(true)}
            //   className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            // >
            // <Plus className="h-4 w-4" />
            // Add task
            // </Button>
            null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
