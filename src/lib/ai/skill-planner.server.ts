import { Output, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { z } from 'zod';

import type {
  generateSkillPlanSchema,
  skillPlanResultSchema,
} from '@/lib/zod-schemas/skill';
import { aiUsageRepository } from '@/db/repositories/ai_usage.repository';
import { addWide } from '@/lib/logging/index.server';
import { aiSkillPlanOutputSchema } from '@/lib/zod-schemas/skill';
import { getWideEvent } from '@/lib/logging/wideEventStore.server';

/* ---------- Types (derived from schemas) ---------- */

export type GeneratePlanInput = z.infer<typeof generateSkillPlanSchema>;
export type GeneratedPlan = z.infer<typeof skillPlanResultSchema>;

export type GeneratePlanResponse =
  | { success: true; plan: GeneratedPlan }
  | { success: false; error: string };

/* ---------- Cost calculation ---------- */

const MODEL = 'gpt-4.1-nano';
const INPUT_COST_PER_1K = 0.0001;
const OUTPUT_COST_PER_1K = 0.0004;

function calculateCost(inputTokens: number, outputTokens: number): string {
  const cost =
    (inputTokens / 1000) * INPUT_COST_PER_1K +
    (outputTokens / 1000) * OUTPUT_COST_PER_1K;
  return cost.toFixed(6);
}

/* ---------- System prompt ---------- */

const SYSTEM_PROMPT = `You are an expert learning path designer. Your job is to create structured, progressive learning plans for skills.

Rules:
1. Create 3-7 sub-skills that form a logical learning progression
2. Each sub-skill should have 1-3 measurable metrics
3. Sub-skills should build on each other - use parentIndex to show dependencies
4. The first sub-skill(s) should have parentIndex: null (starting points)
5. Later sub-skills should reference earlier ones as prerequisites
6. Be specific to the skill domain - avoid generic placeholders
7. Metrics should be concrete and achievable (e.g., "Complete 5 exercises" not "Master the concept")
8. Descriptions should explain what the learner will achieve

Example structure:
- Sub-skill 0 (parentIndex: null): Foundation skill
- Sub-skill 1 (parentIndex: 0): Builds on foundation
- Sub-skill 2 (parentIndex: 1): Builds on skill 1
- Sub-skill 3 (parentIndex: 1): Alternative path from skill 1
- Sub-skill 4 (parentIndex: 2): Advanced, requires skill 2`;

/* ---------- Main function ---------- */

export async function generateSkillPlan(
  input: GeneratePlanInput,
  userId: string,
): Promise<GeneratePlanResponse> {
  // Capture wide event before async call (context can be lost during external HTTP calls)
  const wideEvent = getWideEvent();

  addWide({
    ai_operation: 'generate_skill_plan',
    skill_name: input.skillName,
    goal_length: input.goal.length,
    has_context: !!input.additionalContext,
  });

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const userPrompt = `Create a learning plan for the skill: "${input.skillName}"

Goal: ${input.goal}
${input.additionalContext ? `\nAdditional context: ${input.additionalContext}` : ''}

Generate a structured plan with progressive sub-skills and measurable metrics.`;

  try {
    console.log('Generating skill plan with prompt:', userPrompt);
    const result = await generateText({
      model: openai(MODEL),
      output: Output.object({ schema: aiSkillPlanOutputSchema }),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const plan = result.output;
    console.log('Generated skill plan:', plan);
    const inputTokens = result.usage.inputTokens ?? 0;
    const outputTokens = result.usage.outputTokens ?? 0;
    const cost = calculateCost(inputTokens, outputTokens);

    // Use captured wideEvent directly for consistency
    if (wideEvent) {
      Object.assign(wideEvent, {
        ai_success: true,
        ai_model: MODEL,
        ai_input_tokens: inputTokens,
        ai_output_tokens: outputTokens,
        ai_cost: cost,
        sub_skills_generated: plan.subSkills.length,
      });
    }

    await aiUsageRepository.create({
      userId,
      model: MODEL,
      operation: 'generate_skill_plan',
      inputTokens,
      outputTokens,
      cost,
      success: 1,
    });

    return {
      success: true,
      plan: { subSkills: plan.subSkills },
    };
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error('Unknown error occurred');

    console.error('Error generating skill plan:', err);

    // Use captured wideEvent directly (AsyncLocalStorage context may be lost after external HTTP calls)
    if (wideEvent) {
      Object.assign(wideEvent, {
        ai_success: false,
        ai_model: MODEL,
        error: {
          message: err.message,
          code: 'AI_PLAN_GENERATION_FAILED',
        },
      });
    }

    await aiUsageRepository.create({
      userId,
      model: MODEL,
      operation: 'generate_skill_plan',
      inputTokens: 0,
      outputTokens: 0,
      cost: '0',
      success: 0,
    });

    return {
      success: false,
      error: err.message,
    };
  }
}
