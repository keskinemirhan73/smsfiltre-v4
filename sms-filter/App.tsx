import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Shield, List, Settings, FlaskConical } from 'lucide-react-native';
import { useColorScheme, DeviceEventEmitter } from 'react-native';
import * as Notifications from 'expo-notifications';

import DashboardScreen from './src/screens/DashboardScreen';
import RulesScreen from './src/screens/RulesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TestSimulatorScreen from './src/screens/TestSimulatorScreen';
import { darkColors, lightColors } from './src/theme';
import { FilterManager } from './src/modules/FilterManager';
import { ToastProvider } from './src/components/Toast';
import { registerForPushNotificationsAsync } from './src/services/PushNotificationService';
import { ThreatCloudService } from './src/services/ThreatCloudService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

    // Register for push notifications and send token to backend
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        ThreatCloudService.registerPushToken(token);
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
            name="Kurallar" 
            component={RulesScreen}
            options={{
              tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
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
  );
}
