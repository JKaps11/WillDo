import { createTRPCRouter } from "../init"
import { taskRouter } from "./task.trpc"
import { todoListRouter } from "./todo_list.trpc"
import { userRouter } from "./user.trpc"

export const trpcRouter = createTRPCRouter({
  todoList: todoListRouter,
  task: taskRouter,
  user: userRouter,
})
export type TRPCRouter = typeof trpcRouter
