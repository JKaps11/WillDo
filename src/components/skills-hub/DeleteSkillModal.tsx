import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { Skill } from '@/db/schemas/skill.schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';

interface DeleteSkillModalProps {
  skill: Skill;
  trigger?: React.ReactElement;
}

export function DeleteSkillModal({
  skill,
  trigger,
}: DeleteSkillModalProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.skill.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        setOpen(false);
      },
    }),
  );

  const handleDelete = (): void => {
    deleteMutation.mutate({ id: skill.id });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" className="text-destructive" />
          }
        >
          <Trash2 className="size-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Skill</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{skill.name}&quot;? This will
            also delete all sub-skills, metrics, and associated tasks. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Skill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
