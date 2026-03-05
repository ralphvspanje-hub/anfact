import { Stack } from 'expo-router';
import { View, Platform, Alert, Linking } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { LeagueSpartan_700Bold } from '@expo-google-fonts/league-spartan';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { ThemeProvider, useTheme } from '../theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { submitScore } from '../services/leaderboard';
import { getStreak, getReviewLogs } from '../services/storage';
import { getFacts } from '../services/storage';
import { getRetention } from '../services/srs';
import { authService } from '../services/auth';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Remove browser focus outline on web (the white ring after clicking then pressing Space)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `*:focus { outline: none !important; }`;
  document.head.appendChild(style);
}

/** Submit leaderboard score on app launch (after auth hydration) */
function LeaderboardScoreSubmitter() {
  const { userId, userName, loading } = useAuth();

  useEffect(() => {
    if (loading || !userId || !userName) return;

    (async () => {
      try {
        const [streak, facts, logs] = await Promise.all([
          getStreak(),
          getFacts(),
          getReviewLogs(),
        ]);
        const retention = getRetention(facts);
        const totalReviews = logs.length;
        await submitScore(userId, userName, streak, retention, totalReviews);
      } catch (err) {
        console.error('Failed to submit leaderboard score on launch:', err);
      }
    })();
  }, [loading, userId, userName]);

  return null;
}

const DEEP_LINK_SCHEME = 'anfact://';

async function processDeepLink(url: string) {
  if (!url.startsWith(DEEP_LINK_SCHEME)) return;

  try {
    await authService.handleDeepLink(url);
  } catch {
    await authService.clearPendingConfirmation();
    Alert.alert(
      'Link expired',
      'This confirmation link is no longer valid. Please try registering again.',
    );
  }
}

function DeepLinkHandler() {
  useEffect(() => {
    // Cold-start: app was opened via deep link while closed
    Linking.getInitialURL().then((url) => {
      if (url) processDeepLink(url);
    });

    // Foreground: app is already open and receives a deep link
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return null;
}

function StackNavigator() {
  const { theme } = useTheme();

  return (
    <>
      <LeaderboardScoreSubmitter />
      <DeepLinkHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Recall' }} />
        <Stack.Screen
          name="leaderboard"
          options={{
            headerShown: true,
            title: 'Leaderboard',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontFamily: 'Nunito-Bold' },
            headerBackTitleVisible: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            headerShown: true,
            title: 'Privacy Policy',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontFamily: 'Nunito-Bold' },
            headerBackTitleVisible: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: true,
            title: 'Terms of Service',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontFamily: 'Nunito-Bold' },
            headerBackTitleVisible: false,
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'LeagueSpartan-Bold': LeagueSpartan_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Render once fonts load OR if there's an error (so the app isn't stuck blank)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <StackNavigator />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </View>
  );
}
