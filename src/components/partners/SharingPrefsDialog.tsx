import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTRPC } from '@/integrations/trpc/react';

interface SharingPrefsDialogProps {
  partnershipId: string;
}

const SHARING_FIELDS: Array<{
  key: string;
  label: string;
}> = [
  { key: 'shareStreaks', label: 'Streaks' },
  { key: 'shareCompletionRate', label: 'Completion Rate' },
  { key: 'shareSkillNames', label: 'Skill Names' },
  { key: 'shareSkillTree', label: 'Skill Tree' },
  { key: 'shareTasks', label: 'Tasks' },
  { key: 'shareXpLevel', label: 'XP & Level' },
];

export function SharingPrefsDialog({
  partnershipId,
}: SharingPrefsDialogProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: dashboard } = useQuery(
    trpc.partnership.getPartnerDashboard.queryOptions({ partnershipId }),
  );

  const updateMutation = useMutation(
    trpc.partnership.updateSharingPrefs.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.getPartnerDashboard.queryKey({
            partnershipId,
          }),
        });
      },
    }),
  );

  const mySharingPrefs = dashboard?.mySharingPrefs as
    | Record<string, string>
    | undefined;

  function handleChange(key: string, value: string): void {
    updateMutation.mutate({
      partnershipId,
      [key]: value,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Settings className="mr-2 size-4" />
        Sharing Preferences
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What You Share</DialogTitle>
          <DialogDescription>
            Control what your partner can see about your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {SHARING_FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex items-center justify-between gap-4"
            >
              <Label className="text-sm">{field.label}</Label>
              <Select
                value={(mySharingPrefs?.[field.key] as string) ?? 'summary'}
                onValueChange={(value) => {
                  if (value) handleChange(field.key, value);
                }}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
