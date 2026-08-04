import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing, useAppTheme } from '../../../theme';

interface MessagingScreenShellProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function MessagingScreenShell({
  title,
  subtitle,
  leading,
  actions,
  children,
  footer,
}: MessagingScreenShellProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      <View style={styles.content}>{children}</View>
      {footer ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export const messagingChromeStyles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: radii.full,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leading: { marginRight: spacing.sm },
  heading: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { marginTop: 2, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  content: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
