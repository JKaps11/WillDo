import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Link as LinkIcon, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTRPC } from '@/integrations/trpc/react';

export function InviteDialog(): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{
    email: string;
    inviteLink: string | null;
    copied: boolean;
  }>({
    email: '',
    inviteLink: null,
    copied: false,
  });

  const createInvite = useMutation(
    trpc.partnership.createInvite.mutationOptions({
      onSuccess: (invite) => {
        const link = `${window.location.origin}/invite/${invite.token}`;
        setState((prev) => ({ ...prev, inviteLink: link }));
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.listInvites.queryKey(),
        });
      },
    }),
  );

  function handleCreateLink(): void {
    createInvite.mutate({
      inviteeEmail: state.email || undefined,
    });
  }

  function handleCopy(): void {
    if (state.inviteLink) {
      navigator.clipboard.writeText(state.inviteLink);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(
        () => setState((prev) => ({ ...prev, copied: false })),
        2000,
      );
    }
  }

  function handleClose(isOpen: boolean): void {
    setOpen(isOpen);
    if (!isOpen) {
      setState({ email: '', inviteLink: null, copied: false });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger render={<Button />}>
        <LinkIcon className="mr-2 size-4" />
        Invite Partner
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite an Accountability Partner</DialogTitle>
          <DialogDescription>
            Generate an invite link to share with a friend. Links expire in 7
            days.
          </DialogDescription>
        </DialogHeader>

        {!state.inviteLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitee-email">
                Email (optional)
              </Label>
              <Input
                id="invitee-email"
                type="email"
                placeholder="friend@example.com"
                value={state.email}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional — helps identify who the invite is for.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleCreateLink}
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? 'Creating...' : 'Generate Invite Link'}
            </Button>

            {createInvite.isError && (
              <p className="text-sm text-destructive">
                {createInvite.error.message}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input value={state.inviteLink} readOnly />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {state.copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with your accountability partner. It expires in 7
              days.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
