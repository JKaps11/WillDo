import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { SkillBasicInfo } from './BasicInfoStep';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SUPPORT_EMAIL } from '@/lib/constants/contact';

export interface GeneratedSubSkill {
  name: string;
  description: string;
  metrics: Array<{
    name: string;
    unit: string | null;
    targetValue: number;
  }>;
  parentIndex: number | null;
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
  const [currentLevel, setCurrentLevel] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const trpc = useTRPC();

  const generateMutation = useMutation(
    trpc.aiPlanning.generateSkillPlan.mutationOptions({
      onSuccess: (data) => {
        if (data.aiError) {
          // AI generation failed - show alert
          setAiError(data.aiError);
          return;
        }

        // AI generation succeeded
        setAiError(null);
        onPlanGenerated(data.subSkills);
      },
      onError: (error) => {
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          setAiError(
            "You've reached the AI generation limit (10/hour). Please try again later.",
          );
        }
      },
    }),
  );

  const handleGenerate = (): void => {
    setAiError(null);
    generateMutation.mutate({
      skillName: skillInfo.name,
      goal: skillInfo.goal || `Learn ${skillInfo.name}`,
      currentLevel: currentLevel || undefined,
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

      {aiError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>AI Generation Failed</AlertTitle>
          <AlertDescription>
            Unable to generate a plan automatically. Please try again or create
            your plan manually. If the issue persists, contact{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
              {SUPPORT_EMAIL}
            </a>
          </AlertDescription>
        </Alert>
      )}

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
          <Label htmlFor="currentLevel">Where are you now?</Label>
          <textarea
            id="currentLevel"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            rows={3}
            placeholder="e.g. I've been playing acoustic guitar for 6 months. I can play basic open chords (G, C, D, Em) and switch between them slowly, but I struggle with barre chords and strumming patterns..."
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value)}
          />
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
