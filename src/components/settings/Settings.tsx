import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ---------- Root ---------- */

interface RootProps {
    children: ReactNode;
    className?: string;
}

function Root({ children, className }: RootProps): ReactNode {
    return (
        <div className={cn("mx-auto w-full max-w-4xl px-4 py-6", className)}>
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

function Section({ children, title, description, className }: SectionProps): ReactNode {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
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

function Field({ children, label, description, htmlFor }: FieldProps): ReactNode {
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
            <div className="shrink-0">
                {children}
            </div>
        </div>
    );
}

/* ---------- FieldGroup ---------- */

interface FieldGroupProps {
    children: ReactNode;
}

function FieldGroup({ children }: FieldGroupProps): ReactNode {
    return (
        <div className="space-y-4">
            {children}
        </div>
    );
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
                <div className="text-base font-medium text-muted-foreground">{title}</div>
                {description && (
                    <div className="mt-2 text-sm text-muted-foreground">{description}</div>
                )}
            </CardContent>
        </Card>
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
};
