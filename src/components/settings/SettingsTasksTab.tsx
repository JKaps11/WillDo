import {
  TAG_DEFAULT_COLOR,
  TAG_MAX_LENGTH,
  TAG_MAX_WIDTH,
} from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { Settings } from './Settings';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function SettingsTasksTab(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editColor, setEditColor] = useState<string>(TAG_DEFAULT_COLOR);
  const [newTagTitle, setNewTagTitle] = useState<string>('');
  const [newTagColor, setNewTagColor] = useState<string>(TAG_DEFAULT_COLOR);

  const { data: tags = [] } = useQuery(trpc.tag.list.queryOptions());

  const createTagMutation = useMutation(
    trpc.tag.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.tag.list.queryKey() });
        setNewTagTitle('');
        setNewTagColor(TAG_DEFAULT_COLOR);
      },
    }),
  );

  const updateTagMutation = useMutation(
    trpc.tag.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.tag.list.queryKey() });
        setEditingTagId(null);
      },
    }),
  );

  const deleteTagMutation = useMutation(
    trpc.tag.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.tag.list.queryKey() });
      },
    }),
  );

  const handleCreateTag = (): void => {
    if (!newTagTitle.trim()) return;
    createTagMutation.mutate({
      title: newTagTitle.trim(),
      color: newTagColor,
    });
  };

  const handleStartEdit = (
    tagId: string,
    title: string,
    color: string,
  ): void => {
    setEditingTagId(tagId);
    setEditTitle(title);
    setEditColor(color);
  };

  const handleSaveEdit = (): void => {
    if (!editingTagId || !editTitle.trim()) return;
    updateTagMutation.mutate({
      tagId: editingTagId,
      title: editTitle.trim(),
      color: editColor,
    });
  };

  const handleCancelEdit = (): void => {
    setEditingTagId(null);
    setEditTitle('');
    setEditColor(TAG_DEFAULT_COLOR);
  };

  const handleDeleteTag = (tagId: string): void => {
    deleteTagMutation.mutate({ tagId });
  };

  return (
    <Settings.Root>
      <Settings.Header
        title="Tasks"
        description="Configure default task settings."
      />

      <Settings.Section
        title="Tags"
        description="Create and manage tags to categorize your tasks"
      >
        <div className="space-y-4">
          {/* Create New Tag */}
          <div className="flex items-end gap-2 p-4 border rounded-lg bg-muted/30">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">New Tag</label>
              <Input
                placeholder="Tag name"
                value={newTagTitle}
                onChange={(e) => setNewTagTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
                maxLength={TAG_MAX_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Settings.ColorPicker
                value={newTagColor}
                onChange={setNewTagColor}
              />
            </div>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagTitle.trim() || createTagMutation.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>

          {/* Tags List */}
          {tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tags yet. Create your first tag above.
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {tags.map((tag) => (
                <div
                  key={tag.tagId}
                  className={cn(
                    'flex items-center gap-2 p-2 border rounded-lg transition-colors w-fit',
                    editingTagId === tag.tagId
                      ? 'bg-muted/50'
                      : 'hover:bg-muted/30',
                  )}
                >
                  {editingTagId === tag.tagId ? (
                    <>
                      {/* Edit Mode */}
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className="w-32"
                        maxLength={TAG_MAX_LENGTH}
                      />
                      <Settings.ColorPicker
                        value={editColor}
                        onChange={setEditColor}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveEdit}
                        disabled={
                          !editTitle.trim() || updateTagMutation.isPending
                        }
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* View Mode */}
                      <Badge
                        variant="secondary"
                        className="truncate"
                        style={{
                          backgroundColor: tag.color,
                          borderColor: tag.color,
                          maxWidth: TAG_MAX_WIDTH,
                        }}
                      >
                        {tag.title}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleStartEdit(tag.tagId, tag.title, tag.color)
                        }
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTag(tag.tagId)}
                        disabled={deleteTagMutation.isPending}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Settings.Section>
    </Settings.Root>
  );
}
