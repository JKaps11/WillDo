import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

import type { PracticeEvaluation } from '@/db/schemas/practice_evaluation.schema';
import type {
  FolderHierarchySkill,
  FolderHierarchySubSkill,
} from '@/db/repositories/practice_evaluation.repository';
import { Badge } from '@/components/ui/badge';
import { useTRPC } from '@/integrations/trpc/react';
import { cn, parseLocalDate } from '@/lib/utils';

interface FolderTreeProps {
  selectedEvaluationId: string | null;
  onSelectEvaluation: (id: string) => void;
}

interface SubSkillFolderProps {
  subSkillId: string;
  subSkillName: string;
  evaluationCount: number;
  selectedEvaluationId: string | null;
  onSelectEvaluation: (id: string) => void;
}

function SubSkillFolder({
  subSkillId,
  subSkillName,
  evaluationCount,
  selectedEvaluationId,
  onSelectEvaluation,
}: SubSkillFolderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();

  const { data: evaluations } = useQuery({
    ...trpc.practiceEvaluation.listBySubSkill.queryOptions({ subSkillId }),
    enabled: isOpen,
  });

  return (
    <div className="ml-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
      >
        {isOpen ? (
          <>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
          </>
        ) : (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{subSkillName}</span>
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
          {evaluationCount}
        </Badge>
      </button>

      {isOpen && evaluations && (
        <div className="ml-4">
          {evaluations.map((evaluation: PracticeEvaluation) => {
            const dateStr = parseLocalDate(
              evaluation.occurrenceDate,
            ).toLocaleDateString();

            return (
              <button
                key={evaluation.id}
                type="button"
                onClick={() => onSelectEvaluation(evaluation.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors',
                  selectedEvaluationId === evaluation.id && 'bg-accent',
                )}
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{evaluation.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {dateStr}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  selectedEvaluationId,
  onSelectEvaluation,
}: FolderTreeProps): React.ReactElement {
  const trpc = useTRPC();
  const [openSkills, setOpenSkills] = useState<Set<string>>(new Set());

  const { data: hierarchy, isLoading } = useQuery(
    trpc.practiceEvaluation.getFolderHierarchy.queryOptions(),
  );

  function toggleSkill(skillId: string): void {
    setOpenSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
        <Folder className="size-10 opacity-30" />
        <p className="text-sm text-center">
          No evaluations yet. Complete a practice task to create your first
          evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {hierarchy.map((skill: FolderHierarchySkill) => {
        const isOpen = openSkills.has(skill.skillId);
        const totalCount = skill.subSkills.reduce(
          (sum: number, ss: FolderHierarchySubSkill) =>
            sum + ss.evaluationCount,
          0,
        );

        return (
          <div key={skill.skillId}>
            <button
              type="button"
              onClick={() => toggleSkill(skill.skillId)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              {isOpen ? (
                <>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  <FolderOpen
                    className="size-4 shrink-0"
                    style={{ color: skill.skillColor }}
                  />
                </>
              ) : (
                <>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <Folder
                    className="size-4 shrink-0"
                    style={{ color: skill.skillColor }}
                  />
                </>
              )}
              <span className="truncate">
                {skill.skillIcon && `${skill.skillIcon} `}
                {skill.skillName}
              </span>
              <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                {totalCount}
              </Badge>
            </button>

            {isOpen &&
              skill.subSkills.map((subSkill: FolderHierarchySubSkill) => (
                <SubSkillFolder
                  key={subSkill.subSkillId}
                  subSkillId={subSkill.subSkillId}
                  subSkillName={subSkill.subSkillName}
                  evaluationCount={subSkill.evaluationCount}
                  selectedEvaluationId={selectedEvaluationId}
                  onSelectEvaluation={onSelectEvaluation}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
