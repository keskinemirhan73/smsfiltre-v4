import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Shield, List, Settings, FlaskConical } from 'lucide-react-native';
import { useColorScheme, DeviceEventEmitter, TouchableOpacity } from 'react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import RulesScreen from './src/screens/RulesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TestSimulatorScreen from './src/screens/TestSimulatorScreen';
import { darkColors, lightColors } from './src/theme';
import { FilterManager } from './src/modules/FilterManager';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ navigation, themeColors }: any) {
  return (
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
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16 }}
            onPress={() => navigation.navigate('Ayarlar')}
          >
            <Settings color={themeColors.text} size={24} />
          </TouchableOpacity>
        )
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
    </Tab.Navigator>
  );
}

export default function App() {
  const systemScheme = useColorScheme();
  const [appTheme, setAppTheme] = useState('system');

  useEffect(() => {
    FilterManager.loadSettings().then(s => setAppTheme(s.theme || 'system'));
    const sub = DeviceEventEmitter.addListener('onThemeChanged', (newTheme) => {
      setAppTheme(newTheme);
    });
    return () => sub.remove();
  }, []);

  const isDark = appTheme === 'dark' || (appTheme === 'system' && systemScheme === 'dark');
  const themeColors = isDark ? darkColors : lightColors;

  return (
    <>
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
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: themeColors.surface,
            },
            headerTintColor: themeColors.text,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen 
            name="Main" 
            options={{ headerShown: false }}
          >
            {(props) => <MainTabs {...props} themeColors={themeColors} />}
          </Stack.Screen>
          <Stack.Screen 
            name="Ayarlar" 
            component={SettingsScreen}
            options={{
              presentation: 'card', // Ensure standard iOS push transition
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
