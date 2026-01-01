import { createTRPCRouter } from "../init"
import { taskRouter } from "./task.trpc"
import { tagRouter } from "./tag.trpc"
import { todoListRouter } from "./todo_list.trpc"
import { userRouter } from "./user.trpc"

export const trpcRouter = createTRPCRouter({
  todoList: todoListRouter,
  task: taskRouter,
  tag: tagRouter,
  user: userRouter,
})
export type TRPCRouter = typeof trpcRouter
