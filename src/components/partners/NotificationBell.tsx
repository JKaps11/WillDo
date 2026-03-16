import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTRPC } from '@/integrations/trpc/react';

const NOTIFICATION_LABELS: Record<string, string> = {
  invite_received: 'New partner invite',
  invite_accepted: 'Invite accepted',
  check_in_reminder: 'Check-in reminder',
  partner_checked_in: 'Partner checked in',
  partner_missed: 'Partner missed check-in',
  streak_milestone: 'Streak milestone',
  shared_streak_milestone: 'Shared streak milestone',
  partner_level_up: 'Partner leveled up',
};

export function NotificationBell(): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useQuery(
    trpc.partnerNotification.getUnreadCount.queryOptions(),
  );
  const unreadCount = unreadData?.count ?? 0;

  const { data: notifications } = useQuery({
    ...trpc.partnerNotification.list.queryOptions({ limit: 10 }),
    enabled: open,
  });

  const markAllRead = useMutation(
    trpc.partnerNotification.markRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.partnerNotification.getUnreadCount.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.partnerNotification.list.queryKey(),
        });
      },
    }),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" />}>
        <div className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center p-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllRead.mutate({ markAll: true })}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No notifications
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-md p-2 text-sm ${
                  notif.read ? '' : 'bg-accent'
                }`}
              >
                <p className="font-medium">
                  {NOTIFICATION_LABELS[notif.type] ?? notif.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
