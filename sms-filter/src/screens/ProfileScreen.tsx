import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Trophy, ShieldAlert, TrendingUp } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { useSettings } from '../context/SettingsContext';
import { getT } from '../i18n';
import { getExistingExpoPushTokenAsync } from '../services/PushNotificationService';
import { createPublicJsonRequest } from '../services/publicApiRequest';

const API_URL = 'https://smsfiltre-v4.onrender.com';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { settings } = useSettings();
  const t = getT(settings.language);
  const isEn = settings.language === 'en';

  const [profile, setProfile] = useState({ points: 0, reportsCount: 0, badge: 'Acemi Kalkan' });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const expoPushToken = await getExistingExpoPushTokenAsync();
      if (!expoPushToken) return;

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'POST',
        ...createPublicJsonRequest({ token: expoPushToken }),
      });
      if (!response.ok) throw new Error(`Profile HTTP ${response.status}`);
      setProfile(await response.json());
    } catch (error) {
      console.log(t.profileLoadError, error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  // Full-screen loading removed to allow instant tab switching

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{isEn ? 'My Contributions' : 'Katkılarım'}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {isEn ? 'A summary of the spam reports you choose to share.' : 'Paylaşmayı seçtiğiniz spam raporlarının özeti.'}
        </Text>
      </View>

      <View style={[styles.promoCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
        <View style={styles.promoIcon}>
          <Trophy color={theme.primary} size={32} />
        </View>
        <View style={styles.promoTextContainer}>
          <Text style={[styles.promoTitle, { color: theme.primary }]}>{isEn ? 'Community Badge' : 'Topluluk Rozeti'}</Text>
          <Text style={[styles.promoDesc, { color: theme.text }]}>
            {profile.badge}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>{isEn ? 'Your Statistics' : 'Senin İstatistiklerin'}</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: theme.primary + '20' }]}>
            <TrendingUp size={24} color={theme.primary} />
          </View>
          {isLoading ? <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 4 }} /> : <Text style={[styles.statValue, { color: theme.text }]}>{profile.points}</Text>}
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>{isEn ? 'Total Points' : 'Toplam Puan'}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: theme.secondary + '20' }]}>
            <ShieldAlert size={24} color={theme.secondary} />
          </View>
          {isLoading ? <ActivityIndicator size="small" color={theme.secondary} style={{ marginVertical: 4 }} /> : <Text style={[styles.statValue, { color: theme.text }]}>{profile.reportsCount}</Text>}
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>{isEn ? 'Reported Spam' : 'Bildirilen Spam'}</Text>
        </View>
      </View>

      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  promoCard: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  promoIcon: {
    marginRight: spacing.md,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  leaderboardContainer: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userBadge: {
    fontSize: 12,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  reportsValue: {
    fontSize: 11,
    marginTop: 2,
  }
});
