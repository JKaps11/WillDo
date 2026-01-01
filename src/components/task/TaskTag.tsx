import type { ReactNode } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/integrations/trpc/react';
import type { Tag } from '@/db/schemas/tag.schema';
import { TAG_MAX_WIDTH, TAG_DEFAULT_COLOR } from '@/lib/constants';

interface TagPickerProps {
    value: string[];
    onChange: (tagIds: string[]) => void;
}

export function TagPicker({ value, onChange }: TagPickerProps): ReactNode {
    const [open, setOpen] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>('');
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data: availableTags = [] } = useQuery(trpc.tag.list.queryOptions());

    const createTagMutation = useMutation(
        trpc.tag.create.mutationOptions({
            onSuccess: (newTag) => {
                queryClient.invalidateQueries({ queryKey: trpc.tag.list.queryKey() });
                onChange([...value, newTag.tagId]);
                setSearchValue('');
            },
        })
    );

    const selectedTags = availableTags.filter((tag) => value.includes(tag.tagId));

    const handleSelect = (tagId: string): void => {
        const isSelected = value.includes(tagId);
        if (isSelected) {
            onChange(value.filter((id) => id !== tagId));
        } else {
            onChange([...value, tagId]);
        }
    };

    const handleCreateTag = (): void => {
        if (!searchValue.trim()) return;

        const existingTag = availableTags.find(
            (tag) => tag.title.toLowerCase() === searchValue.toLowerCase()
        );

        if (existingTag) {
            handleSelect(existingTag.tagId);
            setSearchValue('');
        } else {
            createTagMutation.mutate({
                title: searchValue.trim(),
                color: TAG_DEFAULT_COLOR,
            });
        }
    };

    const handleRemoveTag = (tagId: string): void => {
        onChange(value.filter((id) => id !== tagId));
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && searchValue.trim()) {
            e.preventDefault();
            handleCreateTag();
        }
    };

    const filteredTags = availableTags.filter((tag) =>
        tag.title.toLowerCase().includes(searchValue.toLowerCase())
    );

    const showCreateOption = searchValue.trim() && !filteredTags.some(
        (tag) => tag.title.toLowerCase() === searchValue.toLowerCase()
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            {selectedTags.map((tag) => (
                <Badge
                    key={tag.tagId}
                    variant="secondary"
                    className="gap-1 pr-1 truncate"
                    style={{
                        backgroundColor: tag.color,
                        borderColor: tag.color,
                        maxWidth: TAG_MAX_WIDTH,
                    }}
                >
                    <span className="truncate">{tag.title}</span>
                    <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.tagId)}
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5 shrink-0"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed px-2 text-xs hover:bg-accent transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                        Add tag
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search or create tag..."
                            value={searchValue}
                            onValueChange={setSearchValue}
                            onKeyDown={handleKeyDown}
                        />
                        <CommandList>
                            {filteredTags.length === 0 && !showCreateOption && (
                                <CommandEmpty>No tags found.</CommandEmpty>
                            )}
                            {showCreateOption && (
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={handleCreateTag}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create "{searchValue}"
                                    </CommandItem>
                                </CommandGroup>
                            )}
                            {filteredTags.length > 0 && (
                                <CommandGroup heading="Tags">
                                    {filteredTags.map((tag) => {
                                        const isSelected = value.includes(tag.tagId);
                                        return (
                                            <CommandItem
                                                key={tag.tagId}
                                                onSelect={() => handleSelect(tag.tagId)}
                                                className="gap-2"
                                            >
                                                <div
                                                    className={cn(
                                                        'flex h-4 w-4 items-center justify-center rounded-sm border',
                                                        isSelected
                                                            ? 'bg-primary border-primary text-primary-foreground'
                                                            : 'border-input'
                                                    )}
                                                >
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div
                                                    className="h-3 w-3 rounded-sm"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                {tag.title}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

interface TaskTagProps {
    name: string;
    color: string;
}

export default function TaskTag({ name, color }: TaskTagProps): ReactNode {
    return <Badge title={name} color={color} />;
}
