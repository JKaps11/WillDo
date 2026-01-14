import type { SubSkillStage } from '@/db/schemas/sub_skill.schema';

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 120;
export const HORIZONTAL_GAP = 40;
export const VERTICAL_GAP = 60;

export const STAGE_COLORS: Record<SubSkillStage, string> = {
  not_started: 'var(--stage-not-started)',
  practice: 'var(--stage-practice)',
  feedback: 'var(--stage-feedback)',
  evaluate: 'var(--stage-evaluate)',
  complete: 'var(--stage-complete)',
};

export const STAGE_LABELS: Record<SubSkillStage, string> = {
  not_started: 'Not Started',
  practice: 'Practice',
  feedback: 'Feedback',
  evaluate: 'Evaluate',
  complete: 'Complete',
};
