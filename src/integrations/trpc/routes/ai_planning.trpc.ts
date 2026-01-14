import { z } from 'zod';
import { protectedProcedure } from '../init';
import {
  generateSkillPlanSchema,
  skillPlanResultSchema,
} from '@/lib/zod-schemas';
import { addWide } from '@/lib/logging/wideEventStore.server';

type SkillPlanResult = z.infer<typeof skillPlanResultSchema>;

export const aiPlanningRouter = {
  generateSkillPlan: protectedProcedure
    .input(generateSkillPlanSchema)
    .mutation(({ input }): SkillPlanResult => {
      const { skillName, goal } = input;
      addWide({ skill_name: skillName, goal_length: goal.length });

      // Generate a sample plan based on the skill name
      const samplePlan: SkillPlanResult = {
        subSkills: [
          {
            name: `${skillName} Fundamentals`,
            description: `Learn the basic concepts and foundations of ${skillName}`,
            metrics: [
              {
                name: 'Lessons completed',
                unit: 'lessons',
                targetValue: 5,
              },
              {
                name: 'Practice exercises',
                unit: 'exercises',
                targetValue: 10,
              },
            ],
            dependencies: [],
          },
          {
            name: `${skillName} Core Techniques`,
            description: `Master the essential techniques for ${skillName}`,
            metrics: [
              {
                name: 'Techniques practiced',
                unit: 'techniques',
                targetValue: 8,
              },
            ],
            dependencies: [0],
          },
          {
            name: `${skillName} Intermediate Concepts`,
            description: `Explore intermediate-level concepts in ${skillName}`,
            metrics: [
              {
                name: 'Concepts studied',
                unit: 'concepts',
                targetValue: 6,
              },
              {
                name: 'Projects completed',
                unit: 'projects',
                targetValue: 2,
              },
            ],
            dependencies: [1],
          },
          {
            name: `${skillName} Advanced Practice`,
            description: `Apply advanced ${skillName} skills in real-world scenarios`,
            metrics: [
              {
                name: 'Advanced exercises',
                unit: 'exercises',
                targetValue: 5,
              },
              {
                name: 'Real-world projects',
                unit: 'projects',
                targetValue: 1,
              },
            ],
            dependencies: [2],
          },
          {
            name: `${skillName} Mastery`,
            description: `Achieve mastery in ${skillName}: ${goal}`,
            metrics: [
              {
                name: 'Mastery assessments',
                unit: 'assessments',
                targetValue: 3,
              },
            ],
            dependencies: [3],
          },
        ],
      };
      addWide({ sub_skills_generated: samplePlan.subSkills.length });

      return samplePlan;
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
