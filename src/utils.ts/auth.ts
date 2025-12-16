import { auth } from "@clerk/tanstack-react-start/server"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

export const authStateFn = createServerFn({ method: 'GET' }).handler(async () => {
    const { isAuthenticated } = await auth()

    if (isAuthenticated) {
        throw redirect({
            to: '/app/todolist',
        })
    }
})