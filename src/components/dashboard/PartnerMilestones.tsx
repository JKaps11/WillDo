import { useQuery } from '@tanstack/react-query';
import { Flame, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/integrations/trpc/react';

export function PartnerMilestones(): React.ReactElement {
  const trpc = useTRPC();

  const { data: partnerships } = useQuery(
    trpc.partnership.list.queryOptions(),
  );

  const { data: pendingReminders } = useQuery(
    trpc.checkIn.getPendingReminders.queryOptions(),
  );

  const { data: todayCheckIns } = useQuery(
    trpc.checkIn.getToday.queryOptions(),
  );

  const activePartners = partnerships?.filter((p) => p.status === 'active');
  const pendingCount = pendingReminders?.length ?? 0;
  const completedCount = todayCheckIns?.length ?? 0;

  // Don't show if no partnerships
  if (!activePartners || activePartners.length === 0) return <></>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Users className="size-4" />
        <CardTitle className="text-sm">Partner Check-ins</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Today</span>
          <span className="font-medium">
            {completedCount}/{activePartners.length} done
          </span>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-accent p-2">
            <Flame className="size-4 text-orange-500" />
            <span className="text-sm">
              {pendingCount} check-in{pendingCount > 1 ? 's' : ''} pending
            </span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          render={<Link to="/app/partners" />}
          nativeButton={false}
        >
          View Partners
        </Button>
      </CardContent>
    </Card>
  );
}
