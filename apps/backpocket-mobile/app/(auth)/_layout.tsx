import { Redirect, Stack } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSafeAuth, useIsClerkAvailable } from "@/lib/auth/safe-hooks";
import { useOfflineContext } from "@/lib/offline/context";

/**
 * Auth layout - redirects to main app if already signed in
 * Also handles offline case by redirecting to main app with cached auth
 */
export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { isSignedIn, isLoaded } = useSafeAuth();
  const isClerkAvailable = useIsClerkAvailable();
  const { isOffline, cachedUser } = useOfflineContext();

  // If offline with cached user, redirect to main app
  // (can't sign in while offline anyway)
  if (isOffline && cachedUser) {
    return <Redirect href="/(tabs)" />;
  }

  // Show nothing while loading auth state (only when Clerk is available)
  if (isClerkAvailable && !isLoaded) {
    return null;
  }

  // Redirect to main app if already signed in
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
