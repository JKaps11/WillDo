import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'

import { useQuery } from '@tanstack/react-query'
import type { UserSettings } from '@/db/schemas/user.schema'
import type { TodoList } from '@/db/schemas/todo_list.schema'
import type { Task } from '@/db/schemas/task.schema'
import { uiStore } from '@/lib/store'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/integrations/trpc/react'
import { addDays, endOfWeek, format, isSameDay, startOfWeek } from '@/utils.ts/dates'

interface SingleTodoListProps {
  todoList: TodoList
  tasks: Array<Task>
}

// View model returned by todoList.list (TodoList + tasks[])
type TodoListWithTasks = TodoList & { tasks: Array<Task> }

export const Route = createFileRoute('/app/todolist')({
  component: RouteComponent,
})

function RouteComponent() {
  const todoOptions: UserSettings['todoList'] = useStore(uiStore, (s) => s.todoListOptions)

  // You can replace this with a store-driven selected date later
  const baseDate = new Date()

  const trpc = useTRPC()
  const { data, isLoading, isError } = useQuery(
    trpc.todoList.list.queryOptions(baseDate),
  )

  const lists: Array<TodoListWithTasks> = (data ?? []) as Array<TodoListWithTasks>

  const applySortAndFilter = (items: Array<Task>): Array<Task> => {
    const filtered = todoOptions.showCompleted ? items : items.filter((t) => !t.completed)
    const sorted = [...filtered]

    // Always push completed to bottom for readability (keeps “modern minimal” feel)
    sorted.sort((a, b) => Number(a.completed) - Number(b.completed))

    if (todoOptions.sortBy === 'alphabetical') {
      sorted.sort((a, b) => {
        const c = Number(a.completed) - Number(b.completed)
        if (c !== 0) return c
        return a.name.localeCompare(b.name)
      })
      return sorted
    }

    if (todoOptions.sortBy === 'priority') {
      const rank: Record<Task['priority'], number> = {
        Very_High: 5,
        High: 4,
        Medium: 3,
        Low: 2,
        Very_Low: 1,
      }
      sorted.sort((a, b) => {
        const c = Number(a.completed) - Number(b.completed)
        if (c !== 0) return c
        return rank[b.priority] - rank[a.priority]
      })
      return sorted
    }

    // sortBy === 'date' (dueDate first; nulls last)
    sorted.sort((a, b) => {
      const c = Number(a.completed) - Number(b.completed)
      if (c !== 0) return c

      const at = a.dueDate ? new Date(a.dueDate as unknown as Date).getTime() : Number.POSITIVE_INFINITY
      const bt = b.dueDate ? new Date(b.dueDate as unknown as Date).getTime() : Number.POSITIVE_INFINITY
      return at - bt
    })

    return sorted
  }

  // ---------- states ----------
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <div className="mt-6">
          {todoOptions.timeSpan === 'week' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="space-y-2 pb-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <Card>
          <CardContent className="py-14 text-center">
            <div className="text-base font-medium">Couldn’t load your lists</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------- view ----------
  const headerTitle = todoOptions.timeSpan === 'week' ? 'This Week' : 'Today'
  const headerSubtitle =
    todoOptions.timeSpan === 'week'
      ? `${format(startOfWeek(baseDate), 'MMM d')} – ${format(endOfWeek(baseDate), 'MMM d')}`
      : format(baseDate, 'EEEE, MMM d')

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">{headerTitle}</div>
          <div className="text-sm text-muted-foreground">{headerSubtitle}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Sort: {todoOptions.sortBy}</Badge>
          <Badge variant="secondary">
            {todoOptions.showCompleted ? 'Showing completed' : 'Hiding completed'}
          </Badge>

          <Button size="sm" variant="outline">
            New task
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {todoOptions.timeSpan === 'day' ? (
          (() => {
            const today = lists.find((l) => isSameDay(l.date as unknown as Date, baseDate))
            if (!today) {
              return (
                <Card>
                  <CardContent className="py-14 text-center">
                    <div className="text-base font-medium">No list for today</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Create today’s list to start adding tasks.
                    </div>
                    <div className="mt-6">
                      <Button size="sm">Create today’s list</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            return (
              <SingleTodoList
                todoList={today}
                tasks={applySortAndFilter(today.tasks)}
              />
            )
          })()
        ) : (
          (() => {
            const weekStart = startOfWeek(baseDate)
            const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

            const byDay = new Map<string, TodoListWithTasks>()
            for (const l of lists) {
              byDay.set(format(l.date as unknown as Date, 'yyyy-MM-dd'), l)
            }

            return (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {days.map((d) => {
                  const key = format(d, 'yyyy-MM-dd')
                  const entry = byDay.get(key)

                  if (!entry) {
                    return (
                      <Card key={key} className="overflow-hidden">
                        <CardHeader className="space-y-1 pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">
                              {format(d, 'EEE')}
                            </CardTitle>
                            <div className="text-sm text-muted-foreground">
                              {format(d, 'MMM d')}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-sm text-muted-foreground">No list</div>
                        </CardContent>
                      </Card>
                    )
                  }

                  return (
                    <SingleTodoList
                      key={key}
                      todoList={entry}
                      tasks={applySortAndFilter(entry.tasks)}
                    />
                  )
                })}
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}

function SingleTodoList({ todoList, tasks }: SingleTodoListProps) {
  const total = tasks.length
  const done = tasks.filter((t) => t.completed).length

  const prettyPriority = (p: Task['priority']) => {
    const s = p.replaceAll('_', ' ').toLowerCase()
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-medium">
            {format(todoList.date as unknown as Date, 'EEE, MMM d')}
          </CardTitle>

          <Badge variant="secondary" className="shrink-0">
            {done}/{total}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tasks
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="max-h-[420px] overflow-auto">
              {tasks.map((task, idx) => (
                <div key={task.id}>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="pt-0.5">
                      <Checkbox checked={task.completed} disabled />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            'min-w-0 font-medium leading-5',
                            task.completed && 'text-muted-foreground line-through',
                          )}
                        >
                          <div className="truncate">{task.name}</div>
                        </div>

                        <Badge variant="outline" className="shrink-0 text-xs">
                          {prettyPriority(task.priority)}
                        </Badge>
                      </div>

                      {task.description ? (
                        <div
                          className={cn(
                            'mt-1 text-sm text-muted-foreground',
                            task.completed && 'line-through',
                          )}
                        >
                          {task.description}
                        </div>
                      ) : null}

                      {task.dueDate ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Due {format(task.dueDate as unknown as Date, 'MMM d, p')}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {idx !== tasks.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
