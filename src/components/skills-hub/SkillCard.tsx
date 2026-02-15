import {
  Archive,
  Focus,
  GitBranch,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { SubSkillStageIndicator } from './SubSkillStageIndicator';
import { DeleteSkillModal } from './DeleteSkillModal';
import { EditSkillModal } from './EditSkillModal';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { Skill } from '@/db/schemas/skill.schema';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';

interface SkillCardProps {
  skill: Skill & { subSkills: Array<SubSkill> };
  isActive: boolean;
}

export function SkillCard({
  skill,
  isActive,
}: SkillCardProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const archiveMutation = useMutation(
    trpc.skill.archive.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
      },
    }),
  );

  const setActiveMutation = useMutation(
    trpc.user.setActiveSkill.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['user', 'get']] });
      },
    }),
  );

  const stages = skill.subSkills.map((s) => s.stage);
  const completedCount = stages.filter((s) => s === 'complete').length;
  const totalCount = stages.length;

  return (
    <Card
      className={`group relative transition-shadow hover:shadow-md" data-testid="skill-card ${isActive ? 'ring-2 ring-primary' : ''}`}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
        style={{ backgroundColor: skill.color }}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {skill.icon && <span className="text-2xl">{skill.icon}</span>}
            <div>
              <Link
                to="/app/skills/$id/planner"
                params={{ id: skill.id }}
                className="font-semibold hover:underline"
              >
                {skill.name}
              </Link>
              {skill.goal && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {skill.goal}
                </p>
              )}
            </div>
          </div>
          <Popover>
            <PopoverTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                data-testid="skill-card-menu"
              />
            }>
                <MoreHorizontal className="size-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                render={<Link to="/app/skills/$id/planner" params={{ id: skill.id }} />}
                nativeButton={false}
              >
                  <GitBranch className="mr-2 size-4" />
                  View Planner
              </Button>
              {!isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    setActiveMutation.mutate({ skillId: skill.id })
                  }
                  disabled={setActiveMutation.isPending}
                >
                  <Focus className="mr-2 size-4" />
                  Set as Active
                </Button>
              )}
              <EditSkillModal
                skill={skill}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => archiveMutation.mutate({ id: skill.id })}
                disabled={archiveMutation.isPending}
              >
                <Archive className="mr-2 size-4" />
                Archive
              </Button>
              <DeleteSkillModal
                skill={skill}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SubSkillStageIndicator stages={stages} />
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} complete
            </span>
          </div>
          <Button variant="outline" size="sm" render={<Link to="/app/skills/$id/planner" params={{ id: skill.id }} />} nativeButton={false}>
              Open Planner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
