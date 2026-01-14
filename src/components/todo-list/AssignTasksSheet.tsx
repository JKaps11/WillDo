import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import type { TaskWithSkillInfo } from '@/db/repositories/task.repository';
import type { ReactNode } from 'react';
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
import { SkillColorDot } from '@/components/task/SkillColorDot';
import PriorityBadge from '@/components/task/PriorityBadge';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStore, uiStoreActions } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SkillGroup {
  skillId: string;
  skillName: string;
  skillColor: string;
  tasks: Array<TaskWithSkillInfo>;
}

interface DraggableTaskItemProps {
  task: TaskWithSkillInfo;
}

function DraggableTaskItem({ task }: DraggableTaskItemProps): ReactNode {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card p-2 cursor-grab active:cursor-grabbing transition-colors hover:bg-accent/50',
        isDragging && 'ring-2 ring-primary',
      )}
    >
      <PriorityBadge priority={task.priority} />
      <span className="flex-1 truncate text-sm">{task.name}</span>
      <Badge variant="secondary" className="text-xs">
        {task.subSkillName}
      </Badge>
    </div>
  );
}

export function AssignTasksSheet(): ReactNode {
  const trpc = useTRPC();
  const open = useStore(uiStore, (s) => s.showAssignTasksSheet);

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

        <div className="mt-4 flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No unassigned tasks
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={skillGroups.map((g) => g.skillId)}>
              {skillGroups.map((group) => (
                <AccordionItem key={group.skillId} value={group.skillId}>
                  <AccordionTrigger className="px-1">
                    <div className="flex items-center gap-2">
                      <SkillColorDot
                        color={group.skillColor}
                        skillName={group.skillName}
                      />
                      <span>{group.skillName}</span>
                      <Badge variant="secondary" className="ml-1">
                        {group.tasks.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2">
                      {group.tasks.map((task) => (
                        <DraggableTaskItem key={task.id} task={task} />
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
