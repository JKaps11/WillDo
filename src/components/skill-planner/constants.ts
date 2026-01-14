import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';
import { subSkillStageEnum } from '@/db/schemas/sub_skill.schema';

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 120;
export const HORIZONTAL_GAP = 60;
export const VERTICAL_GAP = 60;

/** Ordered array of all subskill stages derived from the schema enum */
export const STAGE_ORDER: Array<SubSkillStage> = [
  ...subSkillStageEnum.enumValues,
];

/** CSS variable colors for each stage - derived from STAGE_ORDER */
export const STAGE_COLORS: Record<SubSkillStage, string> = Object.fromEntries(
  STAGE_ORDER.map((stage) => [
    stage,
    `var(--stage-${stage.replaceAll('_', '-')})`,
  ]),
) as Record<SubSkillStage, string>;

/** Tailwind class colors for each stage (used in dashboard) */
export const STAGE_BG_CLASSES: Record<SubSkillStage, string> = {
  not_started: 'bg-muted-foreground/30',
  practice: 'bg-blue-500',
  evaluate: 'bg-purple-500',
  complete: 'bg-green-500',
};

/** Human-readable labels for each stage */
function getStageLabelText(stage: SubSkillStage): string {
  switch (stage) {
    case 'not_started':
      return 'Not Started';
    case 'practice':
      return 'Practice';
    case 'evaluate':
      return 'Evaluate';
    case 'complete':
      return 'Complete';
  }
}

export const STAGE_LABELS: Record<SubSkillStage, string> = Object.fromEntries(
  STAGE_ORDER.map((stage) => [stage, getStageLabelText(stage)]),
) as Record<SubSkillStage, string>;

/** Action button labels for advancing to each stage */
function getStageActionText(stage: SubSkillStage): string {
  switch (stage) {
    case 'not_started':
      return 'Start Subskill';
    case 'practice':
      return 'Practice';
    case 'evaluate':
      return 'Evaluate';
    case 'complete':
      return 'Complete';
  }
}

export const STAGE_ACTION_LABELS: Record<SubSkillStage, string> =
  Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, getStageActionText(stage)]),
  ) as Record<SubSkillStage, string>;
