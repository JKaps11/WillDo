import { useState } from 'react';
import { useUser } from '@clerk/tanstack-react-start';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Check, Flame, Pencil, Target, Trophy, X, Zap } from 'lucide-react';

import { useTRPC } from '@/integrations/trpc/react';
import { getLevelName } from '@/lib/constants/xp';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function WelcomeBlock(): React.ReactNode {
  const { user } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: metrics } = useSuspenseQuery(
    trpc.metrics.getUserMetrics.queryOptions(),
  );

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(metrics.weeklyGoal));

  const updateGoalMutation = useMutation(
    trpc.metrics.updateWeeklyGoal.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.metrics.getUserMetrics.queryKey(),
        });
        setIsEditingGoal(false);
      },
    }),
  );

  const handleSaveGoal = (): void => {
    const newGoal = parseInt(goalInput, 10);
    if (newGoal >= 1 && newGoal <= 100) {
      updateGoalMutation.mutate({ weeklyGoal: newGoal });
    }
  };

  const handleCancelEdit = (): void => {
    setGoalInput(String(metrics.weeklyGoal));
    setIsEditingGoal(false);
  };

  const firstName = user?.firstName ?? 'there';
  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() ||
    'U';

  const motivationalMessage = getMotivationalMessage(metrics.currentStreak);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">Welcome back, {firstName}!</CardTitle>
            <CardDescription className="mt-1">
              {motivationalMessage}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <StatCard
            icon={<Flame className="size-4 text-orange-500" />}
            label="Current Streak"
            value={`${metrics.currentStreak} day${metrics.currentStreak !== 1 ? 's' : ''}`}
          />
          <StatCard
            icon={<Trophy className="size-4 text-yellow-500" />}
            label="Best Streak"
            value={`${metrics.bestStreak} day${metrics.bestStreak !== 1 ? 's' : ''}`}
          />
          {/* Weekly Progress with editable goal */}
          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="mt-0.5">
              <Target className="size-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Weekly Progress</p>
              {isEditingGoal ? (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm font-medium">
                    {metrics.weeklyCompleted}/
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="h-6 w-12 px-1 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={handleSaveGoal}
                    disabled={updateGoalMutation.isPending}
                  >
                    <Check className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={handleCancelEdit}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div className="group flex items-center gap-1">
                  <p className="text-sm font-medium">
                    {metrics.weeklyCompleted}/{metrics.weeklyGoal}
                  </p>
                  <button
                    onClick={() => setIsEditingGoal(true)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    title="Edit weekly goal"
                  >
                    <Pencil className="size-3 text-muted-foreground" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {Math.round((metrics.weeklyCompleted / metrics.weeklyGoal) * 100)}%
              </p>
            </div>
          </div>
          <StatCard
            icon={<Zap className="size-4 text-purple-500" />}
            label={`Level ${metrics.level}`}
            value={getLevelName(metrics.level)}
            subtext={`${metrics.levelProgress}% to next`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps): React.ReactNode {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) {
    return "Start your streak today! Complete a task to begin.";
  }
  if (streak === 1) {
    return "Great start! Keep the momentum going.";
  }
  if (streak < 7) {
    return `${streak} days strong! You're building a habit.`;
  }
  if (streak < 30) {
    return `${streak} day streak! You're on fire!`;
  }
  return `Incredible ${streak} day streak! You're unstoppable!`;
}
