import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import type { Partnership } from '@/db/schemas/partnership.schema';
import { useTRPC } from '@/integrations/trpc/react';

interface PartnerSettingsDialogProps {
  partnership: Partnership;
}

export function PartnerSettingsDialog({
  partnership,
}: PartnerSettingsDialogProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation(
    trpc.partnership.updateSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.partnership.getPartnerDashboard.queryKey({
            partnershipId: partnership.id,
          }),
        });
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2 className="mr-2 size-4" />
        Partnership Settings
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partnership Settings</DialogTitle>
          <DialogDescription>
            Configure check-in frequency and damage mechanics.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Check-in Frequency</Label>
            <Select
              value={partnership.checkInFrequency}
              onValueChange={(value) => {
                if (value)
                  updateMutation.mutate({
                    partnershipId: partnership.id,
                    checkInFrequency: value as 'daily' | 'weekly',
                  });
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Damage Mechanic</Label>
              <p className="text-xs text-muted-foreground">
                Lose 5 XP for missed check-ins
              </p>
            </div>
            <Switch
              checked={partnership.damageEnabled}
              onCheckedChange={(checked) =>
                updateMutation.mutate({
                  partnershipId: partnership.id,
                  damageEnabled: checked,
                })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
