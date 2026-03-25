import { TRPCError } from '@trpc/server';

import { protectedProcedure } from '../init';
import type { ReflectionPrompt } from '@/lib/constants/reflection-prompts';
import type {
  FolderHierarchySkill,
  SessionWithReflections,
} from '@/db/repositories/practice_session.repository';
import type { PracticeSession } from '@/db/schemas/practice_session.schema';
import {
  getPrePracticeDataSchema,
  getSessionSchema,
  listSessionsBySubSkillSchema,
} from '@/lib/zod-schemas';
import { practiceSessionRepository } from '@/db/repositories/practice_session.repository';
import { REFLECTION_PROMPTS } from '@/lib/constants/reflection-prompts';
import { selectPrompts } from '@/lib/reflection/select-prompts';
import { addWide } from '@/lib/logging/wideEventStore.server';

interface PrePracticeData {
  microWin: string | null;
  momentumText: string;
  stillTrueCards: Array<{
    sessionId: string;
    responseId: string | null;
    text: string;
  }>;
  selectedPrompts: Array<ReflectionPrompt>;
  iterationNumber: number;
}

export const practiceSessionRouter = {
  getPrePracticeData: protectedProcedure
    .input(getPrePracticeDataSchema)
    .query(async ({ ctx, input }): Promise<PrePracticeData> => {
      addWide({ sub_skill_id: input.subSkillId });

      const [sessionCount, recentPromptKeys, latestSession, stillTrueCards] =
        await Promise.all([
          practiceSessionRepository.countBySubSkillId(
            input.subSkillId,
            ctx.userId,
          ),
          practiceSessionRepository.getRecentPromptKeys(
            input.subSkillId,
            ctx.userId,
            3,
          ),
          practiceSessionRepository.findLatestBySubSkillId(
            input.subSkillId,
            ctx.userId,
          ),
          practiceSessionRepository.getUnresolvedReflections(
            input.subSkillId,
            ctx.userId,
            2,
          ),
        ]);

      const iterationNumber = sessionCount + 1;

      // Extract a micro-win from the latest session's reflections
      let microWin: string | null = null;
      if (latestSession?.reflections) {
        const positiveReflection = latestSession.reflections.find(
          (r) =>
            r.promptCategory === 'self_assessment' ||
            r.promptCategory === 'insight_extraction',
        );
        if (positiveReflection) {
          microWin = positiveReflection.responseText;
        }
      }

      // Build momentum text
      let momentumText: string;
      if (sessionCount === 0) {
        momentumText = "This is your first session — let's explore!";
      } else if (latestSession) {
        const confDelta =
          latestSession.postConfidence !== null
            ? latestSession.postConfidence - latestSession.preConfidence
            : 0;
        if (confDelta > 0) {
          momentumText = `Last session your confidence grew by ${confDelta} points`;
        } else {
          momentumText = `You've completed ${sessionCount} session${sessionCount > 1 ? 's' : ''} so far`;
        }
      } else {
        momentumText = `You've completed ${sessionCount} session${sessionCount > 1 ? 's' : ''} so far`;
      }

      const selectedPrompts = selectPrompts(
        REFLECTION_PROMPTS,
        recentPromptKeys,
        iterationNumber,
      );

      addWide({
        iteration_number: iterationNumber,
        prompts_selected: selectedPrompts.length,
      });

      return {
        microWin,
        momentumText,
        stillTrueCards,
        selectedPrompts,
        iterationNumber,
      };
    }),

  get: protectedProcedure
    .input(getSessionSchema)
    .query(async ({ ctx, input }): Promise<SessionWithReflections> => {
      addWide({ session_id: input.id });
      const session = await practiceSessionRepository.findById(
        input.id,
        ctx.userId,
      );
      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return session;
    }),

  listBySubSkill: protectedProcedure
    .input(listSessionsBySubSkillSchema)
    .query(async ({ ctx, input }): Promise<Array<PracticeSession>> => {
      addWide({ sub_skill_id: input.subSkillId });
      return practiceSessionRepository.findBySubSkillId(
        input.subSkillId,
        ctx.userId,
      );
    }),

  getFolderHierarchy: protectedProcedure.query(
    async ({ ctx }): Promise<Array<FolderHierarchySkill>> => {
      return practiceSessionRepository.getFolderHierarchy(ctx.userId);
    },
  ),
};
