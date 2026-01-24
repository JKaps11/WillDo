import { z } from 'zod';
import { protectedProcedure } from '../init';
import {
  generateSkillPlanSchema,
  skillPlanResultSchema,
} from '@/lib/zod-schemas';
import { addWide } from '@/lib/logging/wideEventStore.server';
import { generateSkillPlan } from '@/lib/ai/skill-planner.server';

type SkillPlanResult = z.infer<typeof skillPlanResultSchema>;

export const aiPlanningRouter = {
  generateSkillPlan: protectedProcedure
    .input(generateSkillPlanSchema)
    .mutation(async ({ ctx, input }): Promise<SkillPlanResult> => {
      const { skillName, goal, additionalContext } = input;
      addWide({ skill_name: skillName, goal_length: goal.length });

      // Try AI generation
      const result = await generateSkillPlan(
        { skillName, goal, additionalContext },
        ctx.userId,
      );

      if (result.success) {
        addWide({
          sub_skills_generated: result.plan.subSkills.length,
          ai_used: true,
        });
        return {
          subSkills: result.plan.subSkills,
        };
      }

      // AI failed - return empty subSkills with error for alert
      addWide({ ai_used: false, ai_error: result.error });

      return {
        subSkills: [],
        aiError: result.error,
      };
    }),

  refineSkillPlan: protectedProcedure
    .input(
      z.object({
        currentPlan: skillPlanResultSchema,
        feedback: z.string().min(1),
      }),
    )
    .mutation(({ input }): SkillPlanResult => {
      addWide({
        current_sub_skills: input.currentPlan.subSkills.length,
        feedback_length: input.feedback.length,
      });
      return input.currentPlan;
    }),
};
