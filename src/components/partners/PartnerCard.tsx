import { Pause, Play, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PartnershipWithPartner } from '@/db/repositories/partnership.repository';
import { useTRPC } from '@/integrations/trpc/react';

interface PartnerCardProps {
  partnership: PartnershipWithPartner;
}

export function PartnerCard({
  partnership,
}: PartnerCardProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const pauseMutation = useMutation(
    trpc.partnership.pause.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.list.queryKey(),
        });
      },
    }),
  );

  const resumeMutation = useMutation(
    trpc.partnership.resume.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.list.queryKey(),
        });
      },
    }),
  );

  const endMutation = useMutation(
    trpc.partnership.end.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.list.queryKey(),
        });
      },
    }),
  );

  const statusColor: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    paused: 'bg-yellow-500/10 text-yellow-500',
    ended: 'bg-muted text-muted-foreground',
    pending: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">
            <Link
              to="/app/partners/$id"
              params={{ id: partnership.id }}
              className="hover:underline"
            >
              {partnership.partnerName}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {partnership.partnerEmail}
          </p>
        </div>
        <Badge className={statusColor[partnership.status] ?? ''}>
          {partnership.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Check-in: {partnership.checkInFrequency}</span>
            {partnership.damageEnabled && <span>Damage: On</span>}
          </div>
          <div className="flex gap-1">
            {partnership.status === 'active' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  pauseMutation.mutate({
                    partnershipId: partnership.id,
                  })
                }
                disabled={pauseMutation.isPending}
              >
                <Pause className="size-4" />
              </Button>
            )}
            {partnership.status === 'paused' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  resumeMutation.mutate({
                    partnershipId: partnership.id,
                  })
                }
                disabled={resumeMutation.isPending}
              >
                <Play className="size-4" />
              </Button>
            )}
            {partnership.status !== 'ended' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  endMutation.mutate({
                    partnershipId: partnership.id,
                  })
                }
                disabled={endMutation.isPending}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
