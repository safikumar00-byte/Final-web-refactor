import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ThreeStepSplashScreen from '@/components/ThreeStepSplashScreen';
import NotificationPermissionModal from '@/components/NotificationPermissionModal';
import InAppNotificationToast, { NotificationToastData } from '@/components/InAppNotificationToast';

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [activeToast, setActiveToast] = useState<NotificationToastData | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App initializing...');
        const hasSeenSplash = await AsyncStorage.getItem('@has_seen_splash_screen');
        if (hasSeenSplash !== 'true') {
          setShowSplash(true);
        }
        setIsReady(true);
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        setIsReady(true);
      }
    }

    if (fontsLoaded || fontError) {
      prepare().then(() => {
        // Hide native splash screen so the animated hero splash screen smoothly displays
        SplashScreen.hideAsync();
      });
    }
  }, [fontsLoaded, fontError]);

  const handleSplashFinished = async () => {
    try {
      await AsyncStorage.setItem('@has_seen_splash_screen', 'true');
    } catch (e) {
      console.error('Error saving splash screen state:', e);
    }
    setShowSplash(false);
  };

  // When splash is not showing (or finished), check notification prompt and schedule initial notification pop-up
  useEffect(() => {
    if (isReady && !showSplash) {
      AsyncStorage.getItem('@notification_permission_prompt_shown').then((shown) => {
        if (!shown) {
          const promptTimer = setTimeout(() => {
            setShowNotificationModal(true);
          }, 700);
          return () => clearTimeout(promptTimer);
        }
      });

      // Interactive notification pop-up demo shortly after entering
      const toastTimer = setTimeout(() => {
        setActiveToast({
          id: 'live-trade-alert',
          title: 'Live Signal Alert 🔔',
          message: 'XAU/USD BUY Triggered @ 2,345.67 • Target 1: 2,360.00',
          pair: 'XAU/USD',
          type: 'BUY',
          actionLabel: 'View Signals',
          onPressAction: () => {
            router.push('/(tabs)/signals');
          },
        });
      }, 3500);

      return () => clearTimeout(toastTimer);
    }
  }, [isReady, showSplash, router]);

  const handlePermissionGranted = () => {
    setActiveToast({
      id: 'permission-activated',
      title: 'Alerts Activated ⚡',
      message: "You're now subscribed to real-time Gold & Silver trade signal alerts!",
      actionLabel: 'Explore Signals',
      onPressAction: () => {
        router.push('/(tabs)/signals');
      },
    });
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />

            {/* Notification Permission Prompt at the start */}
            <NotificationPermissionModal
              visible={showNotificationModal}
              onClose={() => setShowNotificationModal(false)}
              onPermissionGranted={handlePermissionGranted}
            />

            {/* In-App Floating Notification Pop-up Toast */}
            <InAppNotificationToast
              notification={activeToast}
              onDismiss={() => setActiveToast(null)}
            />

            {/* Native Hero Animated Three-Step Splash Screen (shows only once on first launch) */}
            {showSplash && (
              <ThreeStepSplashScreen
                isReady={isReady}
                onFinish={handleSplashFinished}
              />
            )}
          </ThemeProvider>
        </LanguageProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
