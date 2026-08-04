import React, { useState, useEffect, useContext, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Shield, Settings, Sparkles, Trophy, Flag } from 'lucide-react-native';
import { useColorScheme, DeviceEventEmitter, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

import DashboardScreen from './src/screens/DashboardScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TestSimulatorScreen from './src/screens/TestSimulatorScreen';
import AIAnalysisScreen from './src/screens/AIAnalysisScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import BrandSplashScreen from './src/screens/BrandSplashScreen';
import { darkColors, lightColors, ThemeContext } from './src/theme';
import { FilterManager } from './src/modules/FilterManager';
import { ToastProvider } from './src/components/Toast';
import { registerBackgroundSync } from './src/services/BackgroundSyncService';
import { SettingsProvider } from './src/context/SettingsContext';
import { getInitialRoute, InitialRoute } from './src/app/startupPolicy';
import { hasCompletedOnboarding } from './src/app/onboardingStorage';
import { getRemainingSplashDuration } from './src/app/splashPolicy';

import { registerForPushNotificationsAsync, syncPushTokenWithBackend, scheduleWeeklySafetyNotification } from './src/services/PushNotificationService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const themeColors = useContext(ThemeContext);
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: themeColors.background }}
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.surface,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: themeColors.text,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Raporlar"
        component={ReportsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Flag color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Akıllı Analiz"
        component={AIAnalysisScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Katkılarım"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const appStartedAt = useRef(Date.now());
  const systemScheme = useColorScheme();
  const [appTheme, setAppTheme] = useState('system');
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    FilterManager.loadSettings().then(s => setAppTheme(s.theme || 'system'));

    const initializeApp = async () => {
      const onboardingComplete = await hasCompletedOnboarding();
      await FilterManager.initializeNativeFiltering();
      await FilterManager.importNativeSmsEvents();
      setInitialRoute(getInitialRoute(onboardingComplete));
    };

    initializeApp()
      .catch(error => {
        console.warn('Başlangıç durumu okunamadı:', error);
        setInitialRoute('Onboarding');
      });

    // Deep link listener
    const handleUrl = (url: string | null) => {
      if (url) {
        FilterManager.importNativeSmsEvents().catch(() => {});
      }
    };
    Linking.getInitialURL().then(handleUrl);
    const linkSub = Linking.addEventListener('url', e => handleUrl(e.url));

    // Check if background sync is enabled in settings
    FilterManager.loadSettings().then(settings => {
      if (settings.autoSyncEnabled !== false) {
        registerBackgroundSync();
      }
    });

    registerForPushNotificationsAsync().then(token => {
      if (token) syncPushTokenWithBackend(token);
    });
    scheduleWeeklySafetyNotification();

    const sub = DeviceEventEmitter.addListener('onThemeChanged', (newTheme) => {
      setAppTheme(newTheme);
    });
    return () => {
      sub.remove();
      linkSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!initialRoute) return;

    const remainingDuration = getRemainingSplashDuration(
      appStartedAt.current,
      Date.now(),
    );
    const timer = setTimeout(() => setShowBrandSplash(false), remainingDuration);
    return () => clearTimeout(timer);
  }, [initialRoute]);

  if (!initialRoute || showBrandSplash) {
    return (
      <BrandSplashScreen
        onReady={() => SplashScreen.hideAsync().catch(() => {})}
      />
    );
  }

  const isDark = appTheme === 'dark' || (appTheme === 'system' && systemScheme === 'dark');
  const themeColors = isDark ? darkColors : lightColors;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={themeColors}>
        <SettingsProvider>
          <ToastProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <NavigationContainer
              theme={{
              dark: isDark,
              colors: {
                primary: themeColors.primary,
                background: themeColors.background,
                card: themeColors.surface,
                text: themeColors.text,
                border: themeColors.border,
                notification: themeColors.danger,
              }
            }}>
              <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="Simulator" component={TestSimulatorScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </ToastProvider>
        </SettingsProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
