import { ClerkProvider } from '@clerk/tanstack-react-start';
import type { ComponentProps } from 'react';

type Appearance = NonNullable<
  ComponentProps<typeof ClerkProvider>['appearance']
>;

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env.local file');
}

const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: 'oklch(0.7 0.15 162)',
    colorBackground: 'oklch(0.13 0.028 261.692)',
    colorText: 'oklch(0.985 0.002 247.839)',
    colorTextSecondary: 'oklch(0.707 0.022 261.325)',
    colorInputBackground: 'oklch(0.21 0.034 264.665)',
    colorInputText: 'oklch(0.985 0.002 247.839)',
    colorDanger: 'oklch(0.704 0.191 22.216)',
    colorSuccess: 'oklch(0.7 0.15 162)',
    colorWarning: 'oklch(0.8 0.15 85)',
    colorNeutral: 'oklch(0.707 0.022 261.325)',
    colorTextOnPrimaryBackground: 'oklch(0.26 0.05 173)',
    borderRadius: '0px',
  },
  elements: {
    // Root and modal elements
    rootBox: 'font-sans',
    card: 'bg-card text-card-foreground shadow-lg border border-border max-h-[85vh] overflow-hidden',
    modalContent: 'bg-card text-card-foreground max-h-[85vh]',
    modalBackdrop: 'bg-background/80 backdrop-blur-sm',

    // Header
    headerTitle: 'text-foreground',
    headerSubtitle: 'text-muted-foreground',

    // Form elements
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    formButtonReset: 'text-muted-foreground hover:text-foreground',
    formFieldLabel: 'text-foreground',
    formFieldInput:
      'bg-input border-border text-foreground placeholder:text-muted-foreground',
    formFieldInputShowPasswordButton: 'text-muted-foreground',
    formFieldAction: 'text-primary hover:text-primary/80',
    formFieldHintText: 'text-muted-foreground',
    formFieldErrorText: 'text-destructive',
    formFieldSuccessText: 'text-primary',

    // User button and popover
    userButtonBox: 'text-foreground',
    userButtonTrigger: 'text-foreground',
    userButtonPopoverCard: 'bg-popover border border-border shadow-lg',
    userButtonPopoverActions: 'bg-popover',
    userButtonPopoverActionButton:
      'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
    userButtonPopoverActionButtonIcon: 'text-muted-foreground',
    userButtonPopoverActionButtonText: 'text-popover-foreground',
    userButtonPopoverFooter: 'hidden',

    // User preview
    userPreview: 'text-foreground',
    userPreviewMainIdentifier: 'text-foreground',
    userPreviewSecondaryIdentifier: 'text-muted-foreground',
    userPreviewAvatarBox: 'border-border',

    // Profile and account pages
    profilePage: 'bg-card text-card-foreground',
    profileSection: 'border-border',
    profileSectionTitle: 'text-foreground border-border',
    profileSectionTitleText: 'text-foreground',
    profileSectionContent: 'text-foreground',
    profileSectionPrimaryButton:
      'bg-primary text-primary-foreground hover:bg-primary/90',

    // Account page
    page: 'bg-card text-card-foreground max-h-[85vh]',
    pageScrollBox: 'bg-card max-h-[80vh] overflow-y-auto',
    navbar: 'bg-card border-border',
    navbarButton: 'text-foreground hover:bg-accent',
    navbarButtonIcon: 'text-muted-foreground',
    navbarMobileMenuButton: 'text-foreground',
    navbarMobileMenuRow: 'bg-card border-border',

    // Active device and sessions
    activeDevice: 'bg-muted/50 border-border',
    activeDeviceIcon: 'text-primary',

    // Badge
    badge: 'bg-primary/10 text-primary',
    badgePrimary: 'bg-primary text-primary-foreground',

    // Buttons
    button: 'text-foreground',
    buttonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    buttonArrowIcon: 'text-muted-foreground',

    // Alerts and notifications
    alert: 'bg-muted border-border text-foreground',
    alertText: 'text-foreground',
    alertIcon: 'text-primary',

    // Menu and dropdown
    menuButton: 'text-foreground hover:bg-accent',
    menuItem: 'text-foreground hover:bg-accent',
    menuList: 'bg-popover border-border',

    // Avatar
    avatarBox: 'border-border',
    avatarImageActionsUpload: 'text-primary',
    avatarImageActionsRemove: 'text-destructive',

    // Identity preview
    identityPreview: 'bg-muted/50 border-border',
    identityPreviewText: 'text-foreground',
    identityPreviewEditButton: 'text-primary hover:text-primary/80',

    // Footer - hide Clerk branding
    footer: 'hidden',
    footerAction: 'hidden',
    footerActionLink: 'hidden',
    footerActionText: 'hidden',
    footerPages: 'hidden',
    footerPagesLink: 'hidden',

    // Hide development mode elements
    impersonationFab: 'hidden',
    devModeLabel: 'hidden',
    devModeBadge: 'hidden',

    // Other elements
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',
    socialButtonsBlockButton:
      'bg-muted border-border text-foreground hover:bg-accent',
    socialButtonsBlockButtonText: 'text-foreground',
    otpCodeFieldInput: 'border-border text-foreground',
    phoneInputBox: 'border-border',
    selectButton: 'bg-input border-border text-foreground',
    selectOptionsContainer: 'bg-popover border-border',
    selectOption: 'text-foreground hover:bg-accent',
    tagInputContainer: 'bg-input border-border',
    tagPillContainer: 'bg-primary/10 text-primary',

    // Scrollbox for modals
    scrollBox: 'bg-card max-h-[75vh] overflow-y-auto',

    // Table elements
    tableHead: 'text-muted-foreground border-border',
    tableCell: 'text-foreground border-border',
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
