import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';

interface MessagingEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function MessagingEmptyState({
  icon,
  title,
  description,
  action,
}: MessagingEmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconHalo,
          { backgroundColor: theme.primaryGlow, borderColor: theme.border },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconHalo: {
    width: 88,
    height: 88,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  title: { fontSize: 21, lineHeight: 27, fontWeight: '900', textAlign: 'center' },
  description: {
    maxWidth: 330,
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  action: { marginTop: spacing.lg },
});
