import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppClerkProvider from '@/lib/auth/clerk-provider';
import { TRPCQueryProvider } from '@/lib/trpc/provider';
import { PracticeSessionProvider } from '@/components/practice-session';
// TODO: Re-enable notifications when using a development build instead of Expo Go
// import { useNotificationSetup } from '@/lib/notifications';
import '../global.css';

function AuthGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // TODO: Re-enable when using development build
  // useNotificationSetup();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return <>{children}</>;
}

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppClerkProvider>
        <TRPCQueryProvider>
          <PracticeSessionProvider>
            <AuthGuard>
              <StatusBar style="auto" />
              <Slot />
            </AuthGuard>
          </PracticeSessionProvider>
        </TRPCQueryProvider>
      </AppClerkProvider>
    </GestureHandlerRootView>
  );
}
