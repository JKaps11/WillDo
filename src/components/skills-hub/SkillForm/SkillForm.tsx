import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { BasicInfoStep } from './BasicInfoStep';
import { PlanReview } from './PlanReview';
import { AIPlanning } from './AIPlanning';
import type { SkillBasicInfo } from './BasicInfoStep';
import type { GeneratedSubSkill } from './AIPlanning';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';

type Step = 'basic' | 'ai' | 'review';

const STEPS: Array<{ id: Step; title: string }> = [
  { id: 'basic', title: 'Basic Info' },
  { id: 'ai', title: 'AI Planning' },
  { id: 'review', title: 'Review' },
];

export function SkillForm(): React.ReactElement {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [basicInfo, setBasicInfo] = useState<SkillBasicInfo>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    goal: '',
  });
  const [subSkills, setSubSkills] = useState<Array<GeneratedSubSkill>>([]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const createSkillMutation = useMutation(
    trpc.skill.createWithPlan.mutationOptions({
      onSuccess: (skill) => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        void navigate({ to: '/app/skills/$id/planner', params: { id: skill.id } });
      },
    }),
  );

  const handleNext = (): void => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = (): void => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = (): void => {
    createSkillMutation.mutate({
      name: basicInfo.name,
      description: basicInfo.description || undefined,
      color: basicInfo.color,
      icon: basicInfo.icon || undefined,
      goal: basicInfo.goal || undefined,
      subSkills: subSkills.map((ss) => ({
        name: ss.name,
        description: ss.description,
        metrics: ss.metrics,
        dependencyIndices: ss.dependencies,
      })),
      createTasks: true,
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basic':
        return basicInfo.name.trim().length > 0;
      case 'ai':
        return true; // Can skip AI planning
      case 'review':
        return subSkills.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                  index <= currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStepIndex ? (
                  <Check className="size-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm ${
                  index <= currentStepIndex
                    ? 'font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-12 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        {currentStep === 'basic' && (
          <BasicInfoStep data={basicInfo} onChange={setBasicInfo} />
        )}
        {currentStep === 'ai' && (
          <AIPlanning
            skillInfo={basicInfo}
            onPlanGenerated={setSubSkills}
            existingPlan={subSkills.length > 0 ? subSkills : null}
          />
        )}
        {currentStep === 'review' && (
          <PlanReview subSkills={subSkills} onChange={setSubSkills} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        {currentStep === 'review' ? (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createSkillMutation.isPending}
          >
            {createSkillMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 size-4" />
                Create Skill
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!canProceed()}>
            {currentStep === 'ai' && subSkills.length === 0
              ? 'Skip AI Planning'
              : 'Next'}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
