import { todoListRouter } from './todo_list.trpc';
import { createTRPCRouter } from '../init';
// import { eventRouter } from './event.trpc'; // DISABLED: Calendar feature
import { userRouter } from './user.trpc';
import { taskRouter } from './task.trpc';
import { tagRouter } from './tag.trpc';

export const trpcRouter = createTRPCRouter({
  // event: eventRouter, // DISABLED: Calendar feature
  tag: tagRouter,
  task: taskRouter,
  todoList: todoListRouter,
  user: userRouter,
});

export type TRPCRouter = typeof trpcRouter;
