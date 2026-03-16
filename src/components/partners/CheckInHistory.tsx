import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CheckInResponse } from '@/db/schemas/check_in.schema';
import { useTRPC } from '@/integrations/trpc/react';

interface CheckInHistoryProps {
  partnershipId: string;
}

const responseIcons: Record<CheckInResponse, React.ReactElement> = {
  yes: <CheckCircle className="size-4 text-green-500" />,
  partial: <MinusCircle className="size-4 text-yellow-500" />,
  no: <XCircle className="size-4 text-red-500" />,
};

export function CheckInHistory({
  partnershipId,
}: CheckInHistoryProps): React.ReactElement {
  const trpc = useTRPC();

  const { data: checkIns } = useQuery(
    trpc.checkIn.getHistory.queryOptions({
      partnershipId,
      limit: 20,
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-In History</CardTitle>
      </CardHeader>
      <CardContent>
        {!checkIns || checkIns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No check-ins yet.
          </p>
        ) : (
          <div className="space-y-2">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                {responseIcons[checkIn.response]}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {checkIn.response}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(checkIn.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {checkIn.note && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {checkIn.note}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  +{checkIn.xpAwarded} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
