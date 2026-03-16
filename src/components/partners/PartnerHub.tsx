import { useQuery } from '@tanstack/react-query';

import { InviteDialog } from './InviteDialog';
import { PartnerCard } from './PartnerCard';
import { CheckInPrompt } from './CheckInPrompt';
import { useTRPC } from '@/integrations/trpc/react';

export function PartnerHub(): React.ReactElement {
  const trpc = useTRPC();

  const { data: partnerships } = useQuery(
    trpc.partnership.list.queryOptions(),
  );

  const { data: pendingReminders } = useQuery(
    trpc.checkIn.getPendingReminders.queryOptions(),
  );

  const { data: invites } = useQuery(
    trpc.partnership.listInvites.queryOptions(),
  );

  const activePartnerships = partnerships?.filter(
    (p) => p.status === 'active',
  );

  // Map partnership IDs to partner names for check-in prompts
  const partnerNameMap = new Map(
    partnerships?.map((p) => [p.id, p.partnerName]) ?? [],
  );

  return (
    <div className="mx-auto w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-sm text-muted-foreground">
            Accountability partners to keep you on track
          </p>
        </div>
        <InviteDialog />
      </div>

      {/* Pending Check-ins */}
      {pendingReminders && pendingReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Pending Check-ins</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingReminders.map((reminder) => (
              <CheckInPrompt
                key={reminder.partnershipId}
                partnershipId={reminder.partnershipId}
                partnerName={
                  partnerNameMap.get(reminder.partnershipId) ?? 'Partner'
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Partnerships */}
      {activePartnerships && activePartnerships.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Active Partners</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activePartnerships.map((partnership) => (
              <PartnerCard key={partnership.id} partnership={partnership} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invites && invites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Pending Invites</h2>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {invite.inviteeEmail ?? 'Link invite'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires:{' '}
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!partnerships || partnerships.length === 0) &&
        (!invites || invites.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium">No partners yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Invite a friend to become your accountability partner. Partners
              with accountability buddies complete goals at nearly 2x the rate!
            </p>
          </div>
        )}
    </div>
  );
}
