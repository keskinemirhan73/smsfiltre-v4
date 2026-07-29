import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Shield, List, Settings, FlaskConical, Sparkles, Trophy } from 'lucide-react-native';
import { useColorScheme, DeviceEventEmitter } from 'react-native';
import * as Notifications from 'expo-notifications';

import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TestSimulatorScreen from './src/screens/TestSimulatorScreen';
import AIAnalysisScreen from './src/screens/AIAnalysisScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { darkColors, lightColors, ThemeContext } from './src/theme';
import { FilterManager } from './src/modules/FilterManager';
import { ToastProvider } from './src/components/Toast';
import { registerForPushNotificationsAsync } from './src/services/PushNotificationService';
import { ThreatCloudService } from './src/services/ThreatCloudService';
import { registerBackgroundSync, unregisterBackgroundSync } from './src/services/BackgroundSyncService';
import { ensureSmsDetectionPermission } from './src/services/SmsPermissionService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();

export default function App() {
  const systemScheme = useColorScheme();
  const [appTheme, setAppTheme] = useState('system');

  useEffect(() => {
    FilterManager.loadSettings().then(s => setAppTheme(s.theme || 'system'));

    const initializePermissions = async () => {
      await ensureSmsDetectionPermission();

      // Register for push notifications and send token to backend
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await ThreatCloudService.registerPushToken(token);
      }
    };
    initializePermissions().catch(error => {
      console.warn('İzinler hazırlanamadı:', error);
    });

    // Check if background sync is enabled in settings
    FilterManager.loadSettings().then(settings => {
      if (settings.autoSyncEnabled !== false) { // Default true
        registerBackgroundSync();
      }
    });

    const sub = DeviceEventEmitter.addListener('onThemeChanged', (newTheme) => {
      setAppTheme(newTheme);
    });
    return () => sub.remove();
  }, []);

  const isDark = appTheme === 'dark' || (appTheme === 'system' && systemScheme === 'dark');
  const themeColors = isDark ? darkColors : lightColors;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={themeColors}>
        <ToastProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <NavigationContainer theme={{
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
            name="Simülatör"
            component={TestSimulatorScreen}
            options={{
              tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size} />,
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
            name="Liderlik"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Ayarlar"
            component={SettingsScreen}
            options={{
              headerShown: false, // Settings stack will handle its own headers
              tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
