import { useMutation } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { SkillBasicInfo } from './BasicInfoStep';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface GeneratedSubSkill {
  name: string;
  description?: string;
  metrics: Array<{
    name: string;
    unit?: string;
    targetValue: number;
  }>;
  dependencies: Array<number>;
}

interface AIPlanningProps {
  skillInfo: SkillBasicInfo;
  onPlanGenerated: (subSkills: Array<GeneratedSubSkill>) => void;
  existingPlan: Array<GeneratedSubSkill> | null;
}

export function AIPlanning({
  skillInfo,
  onPlanGenerated,
  existingPlan,
}: AIPlanningProps): React.ReactElement {
  const [additionalContext, setAdditionalContext] = useState('');
  const trpc = useTRPC();

  const generateMutation = useMutation(
    trpc.aiPlanning.generateSkillPlan.mutationOptions({
      onSuccess: (data) => {
        console.log('[AIPlanning] Plan generated:', {
          subSkillsCount: data.subSkills.length,
          subSkills: data.subSkills.map((ss) => ({
            name: ss.name,
            metricsCount: ss.metrics.length,
          })),
        });
        onPlanGenerated(data.subSkills);
      },
    }),
  );

  const handleGenerate = (): void => {
    generateMutation.mutate({
      skillName: skillInfo.name,
      goal: skillInfo.goal || `Learn ${skillInfo.name}`,
      additionalContext: additionalContext || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-primary" />
          <div>
            <h3 className="font-medium">AI-Powered Planning</h3>
            <p className="text-sm text-muted-foreground">
              Generate a structured learning plan based on your skill and goal.
              You can customize it in the next step.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 font-medium">Skill Summary</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Name:</dt>
              <dd>{skillInfo.name || 'Not set'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Goal:</dt>
              <dd>{skillInfo.goal || 'Not set'}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalContext">
            Additional Context (optional)
          </Label>
          <textarea
            id="additionalContext"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={3}
            placeholder="Any specific requirements, time constraints, or preferences..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!skillInfo.name || generateMutation.isPending}
          className="w-full"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating Plan...
            </>
          ) : existingPlan ? (
            <>
              <Sparkles className="mr-2 size-4" />
              Regenerate Plan
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Generate Learning Plan
            </>
          )}
        </Button>

        {generateMutation.isError && (
          <p className="text-sm text-destructive">
            Failed to generate plan. Please try again.
          </p>
        )}
      </div>

      {existingPlan && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary">
            Plan generated with {existingPlan.length} sub-skills. Continue to
            review and customize.
          </p>
        </div>
      )}
    </div>
  );
}
