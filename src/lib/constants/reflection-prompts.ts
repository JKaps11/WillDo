import type { PromptCategory } from '@willdo/shared';

export interface ReflectionPrompt {
  key: string;
  text: string;
  category: PromptCategory;
}

export const REFLECTION_PROMPTS: Array<ReflectionPrompt> = [
  // Self-assessment
  {
    key: 'sa_different',
    text: "What felt different about today's practice compared to last time?",
    category: 'self_assessment',
  },
  {
    key: 'sa_harder',
    text: 'What was harder than you expected?',
    category: 'self_assessment',
  },
  {
    key: 'sa_easier',
    text: 'What was easier than you expected?',
    category: 'self_assessment',
  },
  {
    key: 'sa_focus',
    text: 'Rate your focus today: were you scattered or locked in?',
    category: 'self_assessment',
  },

  // Insight extraction
  {
    key: 'ie_surprised',
    text: 'What surprised you today?',
    category: 'insight_extraction',
  },
  {
    key: 'ie_clicked',
    text: "Did anything click that hadn't before?",
    category: 'insight_extraction',
  },
  {
    key: 'ie_teach',
    text: 'What would you tell someone about to attempt this for the first time?',
    category: 'insight_extraction',
  },
  {
    key: 'ie_connection',
    text: 'Did you notice any connections between what you practiced today and something else you know?',
    category: 'insight_extraction',
  },

  // Forward-looking
  {
    key: 'fl_try_differently',
    text: "What's one thing you want to try differently next session?",
    category: 'forward_looking',
  },
  {
    key: 'fl_question',
    text: 'What question do you still have about this skill?',
    category: 'forward_looking',
  },
  {
    key: 'fl_one_aspect',
    text: 'If you could only practice one aspect next time, what would it be?',
    category: 'forward_looking',
  },
  {
    key: 'fl_goal',
    text: "What's a small, specific goal for your next session?",
    category: 'forward_looking',
  },

  // Meta-cognitive
  {
    key: 'mc_head_zone',
    text: 'Were you more in your head or in the zone today?',
    category: 'meta_cognitive',
  },
  {
    key: 'mc_confidence_shift',
    text: 'Did your confidence change during the session? When?',
    category: 'meta_cognitive',
  },
  {
    key: 'mc_ready',
    text: "What's your gut feeling — ready to move on, or want more reps?",
    category: 'meta_cognitive',
  },
  {
    key: 'mc_approach',
    text: 'Did you approach practice differently today than usual? How?',
    category: 'meta_cognitive',
  },
];
