import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';

export const Route = createFileRoute('/invite/$token')({
  component: InviteAcceptPage,
});

function InviteAcceptPage(): React.ReactNode {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const trpc = useTRPC();

  const { data: inviteInfo, error: inviteError } = useQuery({
    ...trpc.partnership.getInviteByToken.queryOptions({ token }),
    retry: false,
  });

  const acceptMutation = useMutation(
    trpc.partnership.acceptInvite.mutationOptions({
      onSuccess: () => {
        navigate({ to: '/app/partners' });
      },
    }),
  );

  // If not signed in, redirect to sign-in with redirect back
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`;
    }
  }, [isLoaded, isSignedIn, token]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {inviteError.message}
            </p>
            <Button className="mt-4" onClick={() => navigate({ to: '/' })}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Partner Invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            You've been invited to become an accountability partner on Will Do!
          </p>
          {inviteInfo?.inviteeEmail && (
            <p className="text-sm text-muted-foreground">
              Invited as: {inviteInfo.inviteeEmail}
            </p>
          )}
          <Button
            className="w-full"
            onClick={() => acceptMutation.mutate({ token })}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending
              ? 'Accepting...'
              : 'Accept & Become Partners'}
          </Button>
          {acceptMutation.isError && (
            <p className="text-sm text-destructive">
              {acceptMutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
