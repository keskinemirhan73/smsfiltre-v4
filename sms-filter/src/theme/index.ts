import { useColorScheme } from 'react-native';

export const darkColors = {
  background: '#0F172A',
  card: 'rgba(30, 41, 59, 0.7)',
  surface: '#1E293B',
  primary: '#3B82F6',
  primaryGlow: 'rgba(59, 130, 246, 0.3)',
  secondary: '#10B981',
  danger: '#EF4444',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: 'rgba(148, 163, 184, 0.1)',
};

export const lightColors = {
  background: '#F1F5F9',
  card: 'rgba(255, 255, 255, 0.7)',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryGlow: 'rgba(37, 99, 235, 0.2)',
  secondary: '#059669',
  danger: '#DC2626',
  text: '#0F172A',
  textMuted: '#64748B',
  border: 'rgba(148, 163, 184, 0.3)',
};

// Default static reference for older un-migrated components
export const colors = darkColors;

export const useAppTheme = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
};

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
