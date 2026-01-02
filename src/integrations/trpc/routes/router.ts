import { createTRPCRouter } from '../init';
import { todoListRouter } from './todo_list.trpc';
import { eventRouter } from './event.trpc';
import { userRouter } from './user.trpc';
import { taskRouter } from './task.trpc';
import { tagRouter } from './tag.trpc';

export const trpcRouter = createTRPCRouter({
  event: eventRouter,
  tag: tagRouter,
  task: taskRouter,
  todoList: todoListRouter,
  user: userRouter,
});

export type TRPCRouter = typeof trpcRouter;
