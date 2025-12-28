import { format } from 'date-fns';
import { TodoListContext, useTodoListContext } from './context';
import { sortAndFilterTasks } from './utils';
import { TodoListDropZone } from './TodoListDropZone';
import type { ReactNode } from 'react';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import type { TodoListOptions, TodoListWithTasks } from './types';

import {
    addDays,
    endOfWeek,
    isSameDay,
    startOfWeek,
    utcDateToLocal,
} from '@/utils/dates';

import { Task } from '@/components/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Skeleton } from '@/components/ui/skeleton';

/* ---------- Root ---------- */

interface RootProps {
    children: ReactNode;
    options: TodoListOptions;
    baseDate: Date;
}

function Root({ children, options, baseDate }: RootProps): ReactNode {
    return (
        <TodoListContext.Provider value={{ options, baseDate }}>
            <div className="mx-auto w-full px-4 py-6">{children}</div>
        </TodoListContext.Provider>
    );
}

/* ---------- Header ---------- */

function Header(): ReactNode {
    const { options, baseDate } = useTodoListContext();

    const title = options.timeSpan === 'week' ? 'This Week' : 'Today';
    const subtitle =
        options.timeSpan === 'week'
            ? `${format(startOfWeek(baseDate), 'MMM d')} – ${format(endOfWeek(baseDate), 'MMM d')}`
            : format(baseDate, 'EEEE, MMM d');

    return (
        <div className="space-y-1">
            <div className="text-2xl font-semibold tracking-tight">{title}</div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
    );
}

/* ---------- Controls ---------- */

function DisplayOptions(): ReactNode {
    const { options } = useTodoListContext();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Sort: {options.sortBy}</Badge>
            <Badge variant="secondary">
                {options.showCompleted ? 'Showing completed' : 'Hiding completed'}
            </Badge>
        </div>
    );
}

/* ---------- DayView ---------- */

interface DayViewProps {
    lists: Array<TodoListWithTasks>;
}

function DayView({ lists }: DayViewProps): ReactNode {
    const { options, baseDate } = useTodoListContext();

    const today = lists.find((l) =>
        isSameDay(utcDateToLocal(l.date), baseDate)
    );

    if (!today) {
        return (
            <Card>
                <CardContent className="py-14 text-center">
                    <div className="mt-2 font-medium text-muted-foreground">
                        Start by creating your first task
                    </div>
                </CardContent>
            </Card>
        );
    }

    const tasks = sortAndFilterTasks(today.tasks, options);
    return <TodoListCard todoList={today} tasks={tasks} />;
}

/* ---------- WeekView ---------- */

interface WeekViewProps {
    lists: Array<TodoListWithTasks>;
}

function WeekView({ lists }: WeekViewProps): ReactNode {
    const { options, baseDate } = useTodoListContext();

    const weekStart = startOfWeek(baseDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const byDay = new Map<string, TodoListWithTasks>();
    for (const l of lists) {
        byDay.set(format(utcDateToLocal(l.date), 'yyyy-MM-dd'), l);
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 auto-rows-fr">
            {days.map((d) => {
                const key = format(d, 'yyyy-MM-dd');
                const entry = byDay.get(key);

                if (!entry) {
                    return <EmptyDayCard key={key} date={d} />;
                }

                const tasks = sortAndFilterTasks(entry.tasks, options);
                return <TodoListCard key={key} todoList={entry} tasks={tasks} />;
            })}
        </div>
    );
}

/* ---------- EmptyDayCard ---------- */

interface EmptyDayCardProps {
    date: Date;
}

function EmptyDayCard({ date }: EmptyDayCardProps): ReactNode {
    return (
        <TodoListDropZone date={date}>
            <Card className="h-full overflow-hidden">
                <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">
                            {format(date, 'EEE')}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            {format(date, 'MMM d')}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">No tasks yet</div>
                </CardContent>
            </Card>
        </TodoListDropZone>
    );
}

/* ---------- TodoListCard ---------- */

interface TodoListCardProps {
    todoList: TodoListWithTasks;
    tasks: Array<TaskType>;
}

function TodoListCard({ todoList, tasks }: TodoListCardProps): ReactNode {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const listDate = utcDateToLocal(todoList.date);

    return (
        <TodoListDropZone date={listDate}>
            <Card className="h-full overflow-hidden">
                <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base font-medium">
                            {format(listDate, 'EEE, MMM d')}
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
                        <TaskList tasks={tasks} />
                    )}
                </CardContent>
            </Card>
        </TodoListDropZone>
    );
}

/* ---------- TaskList ---------- */

interface TaskListProps {
    tasks: Array<TaskType>;
}

function TaskList({ tasks }: TaskListProps): ReactNode {
    return (
        <div className="rounded-md border overflow-hidden">
            <div className="flex flex-col gap-1 p-1 max-h-[420px] overflow-y-auto overflow-x-hidden">
                {tasks.map((task) => (
                    <div key={task.id} className="relative overflow-hidden">
                        <Task.Root task={task}>
                            <Task.Card />
                        </Task.Root>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------- Loading  ---------- */

/** fix styling if you want to use */
// function LoadingSkeleton(): ReactNode {
//     return (
//         <div className="space-y-4">
//             <Skeleton className="h-8 w-32" />
//             <Skeleton className="h-4 w-48" />
//             <Card>
//                 <CardContent className="space-y-3 py-6">
//                     <Skeleton className="h-12 w-full" />
//                     <Skeleton className="h-12 w-full" />
//                     <Skeleton className="h-12 w-full" />
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }

/* ---------- Error State ---------- */

function ErrorState(): ReactNode {
    return (
        <Card>
            <CardContent className="py-14 text-center">
                <div className="text-base font-medium">Couldn't load your lists</div>
                <div className="mt-2 text-sm text-muted-foreground">
                    Please try again.
                </div>
            </CardContent>
        </Card>
    );
}

/* ---------- Export as compound component ---------- */

export const TodoList = {
    Root,
    Header,
    Controls: DisplayOptions,
    DayView,
    WeekView,
    TodoListCard,
    EmptyDayCard,
    ErrorState,
};
