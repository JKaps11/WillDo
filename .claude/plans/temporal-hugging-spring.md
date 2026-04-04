# Plan: Rate Limit AI Endpoint

## Context

The `aiPlanning.generateSkillPlan` tRPC mutation calls OpenAI with no usage limits. A user can repeatedly click "Generate" and rack up API costs. The `ai_usage` table already tracks every call but doesn't enforce any cap. We'll add a per-user rate limit check before allowing the AI call.

## Implementation

### 1. Add `countRecentUsage` to `aiUsageRepository`

**File:** `src/db/repositories/ai_usage.repository.ts`

Add a lightweight count query that returns how many AI requests a user has made since a given timestamp. This avoids fetching full rows like `getUsageInPeriod` does.

```ts
countRecentUsage: async (userId: string, since: Date): Promise<number> => {
  return withDbError('aiUsage.countRecentUsage', async () => {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, userId), gte(aiUsage.createdAt, since)));
    return result[0]?.count ?? 0;
  });
},
```

### 2. Add rate limit check in `generateSkillPlan` procedure

**File:** `src/integrations/trpc/routes/ai_planning.trpc.ts`

Before calling `generateSkillPlan`, query the count of recent usage and throw a `TOO_MANY_REQUESTS` TRPCError if exceeded.

```ts
// At top of mutation handler, before the existing code:
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentCount = await aiUsageRepository.countRecentUsage(ctx.userId, oneHourAgo);

const AI_RATE_LIMIT_PER_HOUR = 10;
if (recentCount >= AI_RATE_LIMIT_PER_HOUR) {
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: 'AI generation limit reached. Please try again later.',
  });
}
```

### 3. Handle the error in the frontend

**File:** `src/components/skills-hub/SkillForm/AIPlanning.tsx`

Add an `onError` handler to `generateMutation` that checks for `TOO_MANY_REQUESTS` and sets a user-friendly message via the existing `aiError` state.

```ts
onError: (error) => {
  if (error.data?.code === 'TOO_MANY_REQUESTS') {
    setAiError('You\'ve reached the AI generation limit (10/hour). Please try again later.');
  }
},
```

## Files Modified

1. `src/db/repositories/ai_usage.repository.ts` — add `countRecentUsage`
2. `src/integrations/trpc/routes/ai_planning.trpc.ts` — add rate limit check
3. `src/components/skills-hub/SkillForm/AIPlanning.tsx` — handle rate limit error in UI

## Verification

1. Run `bun run check` to verify no lint/format issues
2. Run `bun run build` to verify no type errors
3. Manual test: trigger AI generation, verify it works normally; verify the error path by temporarily lowering the limit to 0
