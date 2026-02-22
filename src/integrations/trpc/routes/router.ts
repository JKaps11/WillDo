import { createTRPCRouter } from '../init';
import { skillMetricRouter } from './skill_metric.trpc';
import { aiPlanningRouter } from './ai_planning.trpc';
import { dashboardRouter } from './dashboard.trpc';
import { todoListRouter } from './todo_list.trpc';
import { subSkillRouter } from './sub_skill.trpc';
import { metricsRouter } from './metrics.trpc';
import { skillRouter } from './skill.trpc';
// import { eventRouter } from './event.trpc'; // DISABLED: Calendar feature
import { userRouter } from './user.trpc';
import { practiceEvaluationRouter } from './practice_evaluation.trpc';
import { taskRouter } from './task.trpc';
// import { tagRouter } from './tag.trpc';

export const trpcRouter = createTRPCRouter({
  // event: eventRouter, // DISABLED: Calendar feature
  aiPlanning: aiPlanningRouter,
  dashboard: dashboardRouter,
  metrics: metricsRouter,
  skill: skillRouter,
  skillMetric: skillMetricRouter,
  subSkill: subSkillRouter,
  practiceEvaluation: practiceEvaluationRouter,
  // tag: tagRouter,
  task: taskRouter,
  todoList: todoListRouter,
  user: userRouter,
});

export type TRPCRouter = typeof trpcRouter;
