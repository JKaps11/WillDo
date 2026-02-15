import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ---------- Root ---------- */

interface RootProps {
  children: ReactNode;
  className?: string;
}

function Root({ children, className }: RootProps): ReactNode {
  return (
    <div className={cn('mx-auto w-full max-w-4xl px-4 py-6', className)}>
      {children}
    </div>
  );
}

/* ---------- Header ---------- */

interface HeaderProps {
  title: string;
  description?: string;
}

function Header({ title, description }: HeaderProps): ReactNode {
  return (
    <div className="space-y-1 mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/* ---------- Section ---------- */

interface SectionProps {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

function Section({
  children,
  title,
  description,
  className,
}: SectionProps): ReactNode {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

/* ---------- Field ---------- */

interface FieldProps {
  children: ReactNode;
  label: string;
  description?: string;
  htmlFor?: string;
}

function Field({
  children,
  label,
  description,
  htmlFor,
}: FieldProps): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ---------- FieldGroup ---------- */

interface FieldGroupProps {
  children: ReactNode;
}

function FieldGroup({ children }: FieldGroupProps): ReactNode {
  return <div className="space-y-4">{children}</div>;
}

/* ---------- FieldSeparator ---------- */

function FieldSeparator(): ReactNode {
  return <Separator className="my-4" />;
}

/* ---------- Placeholder ---------- */

interface PlaceholderProps {
  title: string;
  description?: string;
}

function Placeholder({ title, description }: PlaceholderProps): ReactNode {
  return (
    <Card>
      <CardContent className="py-14 text-center">
        <div className="text-base font-medium text-muted-foreground">
          {title}
        </div>
        {description && (
          <div className="mt-2 text-sm text-muted-foreground">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- ColorPicker ---------- */

const DEFAULT_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
] as const;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: ReadonlyArray<string>;
  label?: string;
}

function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  label = 'Select color',
}: ColorPickerProps): ReactNode {
  const [open, setOpen] = useState<boolean>(false);

  const handleColorSelect = (color: string): void => {
    onChange(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-input transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={label}
        />
      }>
          <div
            className="h-5 w-5 rounded-sm"
            style={{ backgroundColor: value }}
          />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-2">
          <div className="text-sm font-medium">Pick a color</div>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={cn(
                  'h-8 w-8 rounded-md transition-all hover:scale-110',
                  value === color &&
                    'ring-2 ring-ring ring-offset-2 ring-offset-background',
                )}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- Export as compound component ---------- */

export const Settings = {
  Root,
  Header,
  Section,
  Field,
  FieldGroup,
  FieldSeparator,
  Placeholder,
  ColorPicker,
};
