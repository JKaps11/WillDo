import type { PromptCategory } from '@willdo/shared';
import type { ReflectionPrompt } from '@/lib/constants/reflection-prompts';

/**
 * Selects prompts for a practice session, avoiding recently used ones
 * and weighting categories based on iteration number.
 */
export function selectPrompts(
  allPrompts: Array<ReflectionPrompt>,
  recentPromptKeys: Array<string>,
  iterationNumber: number,
  count: number = 3,
): Array<ReflectionPrompt> {
  // Exclude prompts used in last 3 sessions
  const available = allPrompts.filter((p) => !recentPromptKeys.includes(p.key));

  // If we filtered too many, fall back to all prompts
  const pool = available.length >= count ? available : allPrompts;

  // Weight categories based on iteration number
  const weights = getCategoryWeights(iterationNumber);

  // Build weighted pool
  const weighted: Array<ReflectionPrompt> = [];
  for (const prompt of pool) {
    const weight = weights[prompt.category];
    for (let i = 0; i < weight; i++) {
      weighted.push(prompt);
    }
  }

  // Select distinct prompts via weighted random sampling
  const selected: Array<ReflectionPrompt> = [];
  const usedKeys = new Set<string>();
  const shuffled = [...weighted].sort(() => Math.random() - 0.5);

  for (const prompt of shuffled) {
    if (usedKeys.has(prompt.key)) continue;
    usedKeys.add(prompt.key);
    selected.push(prompt);
    if (selected.length >= count) break;
  }

  return selected;
}

function getCategoryWeights(
  iterationNumber: number,
): Record<PromptCategory, number> {
  if (iterationNumber <= 2) {
    // Early: lean toward self-assessment
    return {
      self_assessment: 3,
      insight_extraction: 1,
      forward_looking: 2,
      meta_cognitive: 1,
    };
  }
  if (iterationNumber <= 5) {
    // Mid: balanced
    return {
      self_assessment: 2,
      insight_extraction: 2,
      forward_looking: 2,
      meta_cognitive: 2,
    };
  }
  // Later: lean toward insight and meta-cognitive
  return {
    self_assessment: 1,
    insight_extraction: 3,
    forward_looking: 2,
    meta_cognitive: 3,
  };
}
