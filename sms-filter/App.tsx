import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Shield, List, Settings, FlaskConical } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import RulesScreen from './src/screens/RulesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TestSimulatorScreen from './src/screens/TestSimulatorScreen';
import { darkColors, lightColors } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  const scheme = useColorScheme();
  const themeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={{
        dark: scheme === 'dark',
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
              tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
