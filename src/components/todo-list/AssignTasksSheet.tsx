import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import type { TaskWithSkillInfo } from '@/db/repositories/task.repository';
import type { ReactNode } from 'react';
import { useDndState } from '@/components/dnd/context';
import { Task } from '@/components/task/Task';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStore, uiStoreActions } from '@/lib/store';

interface SkillGroup {
  skillId: string;
  skillName: string;
  skillColor: string;
  tasks: Array<TaskWithSkillInfo>;
}

export function AssignTasksSheet(): ReactNode {
  const trpc = useTRPC();
  const open = useStore(uiStore, (s) => s.showAssignTasksSheet);
  const { isDragging, shouldReopenAssignSheet, clearReopenFlag } =
    useDndState();
  const wasOpenBeforeDragRef = useRef(false);

  // Close sheet when dragging starts
  useEffect(() => {
    if (isDragging && open) {
      wasOpenBeforeDragRef.current = true;
      uiStoreActions.setShowAssignTasksSheet(false);
    }
  }, [isDragging, open]);

  // Reopen sheet if drop was invalid
  useEffect(() => {
    if (shouldReopenAssignSheet && wasOpenBeforeDragRef.current) {
      uiStoreActions.setShowAssignTasksSheet(true);
      wasOpenBeforeDragRef.current = false;
      clearReopenFlag();
    }
  }, [shouldReopenAssignSheet, clearReopenFlag]);

  const { data: tasks = [] } = useQuery({
    ...trpc.task.listUnassignedWithSkillInfo.queryOptions(),
    enabled: open,
  });

  // Group tasks by skill
  const skillGroups = useMemo((): Array<SkillGroup> => {
    const groupMap = new Map<string, SkillGroup>();

    for (const task of tasks) {
      const existing = groupMap.get(task.skillId);
      if (existing) {
        existing.tasks.push(task);
      } else {
        groupMap.set(task.skillId, {
          skillId: task.skillId,
          skillName: task.skillName,
          skillColor: task.skillColor,
          tasks: [task],
        });
      }
    }

    return Array.from(groupMap.values()).sort((a, b) =>
      a.skillName.localeCompare(b.skillName),
    );
  }, [tasks]);

  function handleOpenChange(isOpen: boolean): void {
    uiStoreActions.setShowAssignTasksSheet(isOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Assign Tasks</SheetTitle>
          <SheetDescription>
            Drag tasks to a day on the calendar to assign them.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 mx-4 flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No unassigned tasks
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={skillGroups.map((g) => g.skillId)}
            >
              {skillGroups.map((group) => (
                <AccordionItem key={group.skillId} value={group.skillId}>
                  <AccordionTrigger className="px-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-1 rounded-full"
                        style={{ backgroundColor: group.skillColor }}
                      />
                      <span>{group.skillName}</span>
                      <Badge variant="secondary" className="ml-1">
                        {group.tasks.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1">
                      {group.tasks.map((task) => (
                        <div key={task.id} className="rounded-md border">
                          <Task task={task} dragSource="assign-sheet" />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
