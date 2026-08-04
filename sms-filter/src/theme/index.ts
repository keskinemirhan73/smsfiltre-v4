
export const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  surface: '#1E293B',
  primary: '#6366F1',
  primaryGlow: 'rgba(99, 102, 241, 0.25)',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.08)',
};

export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  primary: '#4F46E5',
  primaryGlow: 'rgba(79, 70, 229, 0.15)',
  secondary: '#059669',
  danger: '#DC2626',
  warning: '#D97706',
  text: '#0F172A',
  textMuted: '#64748B',
  border: 'rgba(148, 163, 184, 0.2)',
};

// Default static reference for older un-migrated components
export const colors = darkColors;

import { createContext, useContext } from 'react';

export const ThemeContext = createContext(darkColors);

export const useAppTheme = () => useContext(ThemeContext);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};
