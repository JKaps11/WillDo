import { useQuery } from '@tanstack/react-query';
import { Flame, Trophy, Target, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';

interface PartnerDashboardProps {
  partnershipId: string;
  partnerName: string;
}

export function PartnerDashboard({
  partnershipId,
  partnerName,
}: PartnerDashboardProps): React.ReactElement {
  const trpc = useTRPC();

  const { data: dashboard } = useQuery(
    trpc.partnership.getPartnerDashboard.queryOptions({ partnershipId }),
  );

  const partnerData = (dashboard?.partnerData ?? {}) as Record<
    string,
    unknown
  >;
  const streaks = partnerData.streaks as
    | { currentStreak: number; bestStreak: number }
    | undefined;
  const xp = partnerData.xp as { totalXp: number } | undefined;
  const completionRate = partnerData.completionRate as
    | { tasksCompleted: number; weeklyCompleted: number; weeklyGoal: number }
    | undefined;
  const sharedStreak = (partnerData.sharedStreak as number) ?? 0;
  const todayCheckIn = partnerData.todayCheckIn as
    | { myResponse: string | null; partnerResponded: boolean }
    | undefined;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{partnerName}'s Dashboard</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Shared Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Flame className="size-4 text-orange-500" />
            <CardTitle className="text-sm">Shared Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sharedStreak} days</p>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Target className="size-4 text-blue-500" />
            <CardTitle className="text-sm">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p>
                You:{' '}
                {todayCheckIn?.myResponse ? (
                  <span className="capitalize font-medium">
                    {todayCheckIn.myResponse}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not yet</span>
                )}
              </p>
              <p>
                Partner:{' '}
                {todayCheckIn?.partnerResponded ? (
                  <span className="font-medium text-green-500">
                    Checked in
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not yet</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Partner Streaks */}
        {streaks && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Trophy className="size-4 text-yellow-500" />
              <CardTitle className="text-sm">Partner Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p>Current: {streaks.currentStreak} days</p>
                <p>Best: {streaks.bestStreak} days</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partner XP */}
        {xp && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Zap className="size-4 text-purple-500" />
              <CardTitle className="text-sm">Partner XP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {xp.totalXp.toLocaleString()} XP
              </p>
            </CardContent>
          </Card>
        )}

        {/* Completion Rate */}
        {completionRate && (
          <Card className="sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Partner Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Tasks: </span>
                  <span className="font-medium">
                    {completionRate.tasksCompleted}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">This week: </span>
                  <span className="font-medium">
                    {completionRate.weeklyCompleted}/{completionRate.weeklyGoal}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
