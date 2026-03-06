import { Output, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { MODEL, SYSTEM_PROMPT, calculateCost } from './prompts';
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
    has_current_level: !!input.currentLevel,
    has_context: !!input.additionalContext,
  });

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const userPrompt = `Skill: "${input.skillName}"
Goal: ${input.goal}
Current level: ${input.currentLevel || 'Not specified'}
${input.additionalContext ? `Additional context: ${input.additionalContext}` : ''}`;

  try {
    const result = await generateText({
      model: openai(MODEL),
      output: Output.object({ schema: aiSkillPlanOutputSchema }),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const plan = result.output;
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
