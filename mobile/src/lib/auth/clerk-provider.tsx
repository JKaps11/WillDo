import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from './token-cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file',
  );
}

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
