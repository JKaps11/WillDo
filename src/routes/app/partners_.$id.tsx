import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import {
  PartnerDashboard,
  CheckInHistory,
  CheckInPrompt,
  SharingPrefsDialog,
  PartnerSettingsDialog,
} from '@/components/partners';
import { ensureUser } from '@/serverFunctions/auth';
import { useTRPC } from '@/integrations/trpc/react';

export const Route = createFileRoute('/app/partners_/$id')({
  loader: async ({ context, params }) => {
    await ensureUser();
    await context.queryClient.ensureQueryData(
      context.trpc.partnership.getPartnerDashboard.queryOptions({
        partnershipId: params.id,
      }),
    );
  },
  component: PartnerDetailPage,
});

function PartnerDetailPage(): React.ReactNode {
  const { id } = Route.useParams();
  const trpc = useTRPC();

  const { data: dashboard } = useQuery(
    trpc.partnership.getPartnerDashboard.queryOptions({ partnershipId: id }),
  );

  const partnership = dashboard?.partnership as
    | {
        id: string;
        inviterId: string;
        inviteeId: string;
        status: string;
        checkInFrequency: 'daily' | 'weekly';
        damageEnabled: boolean;
        createdAt: Date;
        updatedAt: Date | null;
      }
    | undefined;

  const { data: partnerships } = useQuery(
    trpc.partnership.list.queryOptions(),
  );

  const partnerName =
    partnerships?.find((p) => p.id === id)?.partnerName ?? 'Partner';

  const todayCheckIn = (
    (dashboard?.partnerData ?? {}) as Record<string, unknown>
  ).todayCheckIn as { myResponse: string | null } | undefined;

  return (
    <div className="mx-auto w-full px-4 py-6 space-y-6">
      {/* Settings bar */}
      <div className="flex items-center justify-end gap-2">
        <SharingPrefsDialog partnershipId={id} />
        {partnership && (
          <PartnerSettingsDialog partnership={partnership as never} />
        )}
      </div>

      {/* Check-in prompt if not done today */}
      {!todayCheckIn?.myResponse && (
        <CheckInPrompt partnershipId={id} partnerName={partnerName} />
      )}

      {/* Partner dashboard */}
      <PartnerDashboard partnershipId={id} partnerName={partnerName} />

      {/* Check-in history */}
      <CheckInHistory partnershipId={id} />
    </div>
  );
}
