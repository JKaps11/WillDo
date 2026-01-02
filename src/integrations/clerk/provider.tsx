import { ClerkProvider } from '@clerk/tanstack-react-start';
import type { Appearance } from '@clerk/types';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env.local file');
}

const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: 'hsl(var(--primary))',
    colorBackground: 'hsl(var(--background))',
    colorText: 'hsl(var(--foreground))',
    colorTextSecondary: 'hsl(var(--muted-foreground))',
    colorInputBackground: 'hsl(var(--input))',
    colorInputText: 'hsl(var(--foreground))',
    colorDanger: 'hsl(var(--destructive))',
    borderRadius: 'var(--radius)',
  },
  elements: {
    card: 'bg-card text-card-foreground shadow-md border border-border',
    headerTitle: 'text-foreground',
    headerSubtitle: 'text-muted-foreground',
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    formFieldInput: 'bg-input border-border',
    footerActionLink: 'text-primary hover:text-primary/90',
    userButtonPopoverCard: 'bg-popover border border-border shadow-md',
    userButtonPopoverActionButton: 'hover:bg-accent',
    userButtonPopoverActionButtonText: 'text-popover-foreground',
    userButtonPopoverFooter: 'hidden',
    userPreviewMainIdentifier: 'text-foreground',
    userPreviewSecondaryIdentifier: 'text-muted-foreground',
  },
};

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
}
