import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileJson, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import type { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { importSkillSchema } from '@/lib/zod-schemas/skill';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ImportSkillData = z.infer<typeof importSkillSchema>;

interface ImportPreview {
  skillName: string;
  subSkillCount: number;
  exportedAt: string;
}

interface ImportSkillModalProps {
  trigger?: React.ReactElement;
}

export function ImportSkillModal({
  trigger,
}: ImportSkillModalProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importData, setImportData] = useState<ImportSkillData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const importMutation = useMutation(
    trpc.skill.import.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [['skill', 'list']] });
        handleClose();
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  function handleClose(): void {
    setOpen(false);
    setError(null);
    setPreview(null);
    setImportData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setImportData(null);

    const reader = new FileReader();
    reader.onload = (e): void => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          setError('Failed to read file');
          return;
        }

        const json: unknown = JSON.parse(content);
        const parsed = importSkillSchema.safeParse(json);

        if (!parsed.success) {
          setError(
            `Invalid skill file format: ${parsed.error.issues[0]?.message ?? 'Unknown error'}`,
          );
          return;
        }

        const data = parsed.data;
        setImportData(data);
        setPreview({
          skillName: data.skill.name,
          subSkillCount: data.subSkills.length,
          exportedAt: new Date(data.exportedAt).toLocaleDateString(),
        });
      } catch {
        setError('Invalid JSON file');
      }
    };

    reader.onerror = (): void => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  }

  function handleImport(): void {
    if (!importData) return;
    importMutation.mutate(importData);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button />}>
          <Upload className="mr-2 size-4" />
          Import Skill
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Skill</DialogTitle>
          <DialogDescription>
            Import a skill from a previously exported JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="skill-import-input"
          />

          {!preview && (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="size-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Click to select a .json skill file
              </p>
            </div>
          )}

          {preview && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileJson className="size-5 text-primary" />
                <span className="font-medium">{preview.skillName}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{preview.subSkillCount} sub-skills</p>
                <p>Exported on {preview.exportedAt}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                Choose different file
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importData || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importing...' : 'Import Skill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
