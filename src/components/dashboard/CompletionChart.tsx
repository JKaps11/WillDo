import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';

import type {
  TimeSeriesPeriod,
  TimeSeriesPoint,
} from '@/lib/zod-schemas/metrics';
import type { ChartConfig } from '@/components/ui/chart';
import { useTRPC } from '@/integrations/trpc/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig: ChartConfig = {
  tasks: {
    label: 'Tasks',
    color: 'hsl(221.2 83.2% 53.3%)', // Blue
  },
  subSkills: {
    label: 'SubSkills',
    color: 'hsl(262.1 83.3% 57.8%)', // Purple
  },
  skills: {
    label: 'Skills',
    color: 'hsl(142.1 76.2% 36.3%)', // Green
  },
};

interface CompletionChartProps {
  className?: string;
}

export function CompletionChart({
  className,
}: CompletionChartProps): React.ReactNode {
  const [period, setPeriod] = useState<TimeSeriesPeriod>('week');
  const trpc = useTRPC();

  // Preloaded queries for all periods
  const { data: weekData } = useSuspenseQuery(
    trpc.metrics.getTimeSeries.queryOptions({ period: 'week' }),
  );
  const { data: monthData } = useSuspenseQuery(
    trpc.metrics.getTimeSeries.queryOptions({ period: 'month' }),
  );
  const { data: yearData } = useSuspenseQuery(
    trpc.metrics.getTimeSeries.queryOptions({ period: 'year' }),
  );

  const getData = (): Array<TimeSeriesPoint> => {
    switch (period) {
      case 'week':
        return weekData;
      case 'month':
        return monthData;
      case 'year':
        return yearData;
      default:
        return weekData;
    }
  };

  const data = getData();

  const formatXAxis = (dateStr: string): string => {
    if (period === 'year') {
      // Format: "Jan", "Feb", etc.
      const [year, month] = dateStr.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM');
    }
    // Format: "Mon", "Tue" for week, or "1", "2", etc for month
    const date = parseISO(dateStr);
    if (period === 'week') {
      return format(date, 'EEE');
    }
    return format(date, 'd');
  };

  const formatTooltipLabel = (dateStr: string): string => {
    if (period === 'year') {
      const [year, month] = dateStr.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');
    }
    return format(parseISO(dateStr), 'EEEE, MMMM d');
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Completion Trends</CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as TimeSeriesPeriod)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="week" className="text-xs px-2">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-2">
              Month
            </TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-2">
              Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickMargin={8}
              width={30}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={formatTooltipLabel} />
              }
            />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="var(--color-tasks)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="subSkills"
              stroke="var(--color-subSkills)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="skills"
              stroke="var(--color-skills)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-center gap-6">
          <LegendItem color="hsl(221.2 83.2% 53.3%)" label="Tasks" />
          <LegendItem color="hsl(262.1 83.3% 57.8%)" label="SubSkills" />
          <LegendItem color="hsl(142.1 76.2% 36.3%)" label="Skills" />
        </div>
      </CardContent>
    </Card>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
}

function LegendItem({ color, label }: LegendItemProps): React.ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
