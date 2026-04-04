import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CheckInResponse } from '@/db/schemas/check_in.schema';
import { useTRPC } from '@/integrations/trpc/react';

interface CheckInPromptProps {
  partnershipId: string;
  partnerName: string;
}

export function CheckInPrompt({
  partnershipId,
  partnerName,
}: CheckInPromptProps): React.ReactElement {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [state, setState] = useState<{
    note: string;
    selectedResponse: CheckInResponse | null;
  }>({
    note: '',
    selectedResponse: null,
  });

  const submitMutation = useMutation(
    trpc.checkIn.submit.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.checkIn.getToday.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.checkIn.getPendingReminders.queryKey(),
        });
        setState({ note: '', selectedResponse: null });
      },
    }),
  );

  function handleSubmit(response: CheckInResponse): void {
    submitMutation.mutate({
      partnershipId,
      response,
      note: state.note || undefined,
    });
  }

  const responseButtons: Array<{
    response: CheckInResponse;
    label: string;
    icon: React.ReactElement;
    variant: 'default' | 'destructive' | 'outline';
  }> = [
    {
      response: 'yes',
      label: 'Yes',
      icon: <CheckCircle className="mr-2 size-4" />,
      variant: 'default',
    },
    {
      response: 'partial',
      label: 'Partial',
      icon: <MinusCircle className="mr-2 size-4" />,
      variant: 'outline',
    },
    {
      response: 'no',
      label: 'No',
      icon: <XCircle className="mr-2 size-4" />,
      variant: 'destructive',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Check-in with {partnerName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Did you make progress on your goals today?
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Add a note (optional)"
          value={state.note}
          onChange={(e) =>
            setState((prev) => ({ ...prev, note: e.target.value }))
          }
          rows={2}
        />
        <div className="flex gap-2">
          {responseButtons.map((btn) => (
            <Button
              key={btn.response}
              variant={btn.variant}
              size="sm"
              onClick={() => handleSubmit(btn.response)}
              disabled={submitMutation.isPending}
              className="flex-1"
            >
              {btn.icon}
              {btn.label}
            </Button>
          ))}
        </div>
        {submitMutation.isError && (
          <p className="text-sm text-destructive">
            {submitMutation.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
