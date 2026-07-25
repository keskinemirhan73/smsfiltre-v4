import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Trophy, ShieldAlert, Award, Star, TrendingUp } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { API_URL } from '../config';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const [profile, setProfile] = useState({ points: 0, reportsCount: 0, badge: 'Acemi Kalkan' });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
      const response = await axios.post(`${API_URL}/api/user/profile`, { token: expoPushToken });
      setProfile(response.data);
    } catch (error) {
      console.log('Profil yüklenemedi:', error);
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

  const getBadgeIcon = () => {
    switch(profile.badge) {
      case 'Siber Güvenlik Uzmanı': return <Trophy color="#F59E0B" size={48} />;
      case 'Spam Savaşçısı': return <Star color={theme.primary} size={48} />;
      case 'Aktif Kalkan': return <Award color={theme.secondary} size={48} />;
      default: return <ShieldAlert color={theme.textMuted} size={48} />;
    }
  };

  const getBadgeColor = () => {
    switch(profile.badge) {
      case 'Siber Güvenlik Uzmanı': return '#F59E0B';
      case 'Spam Savaşçısı': return theme.primary;
      case 'Aktif Kalkan': return theme.secondary;
      default: return theme.textMuted;
    }
  };

  const progressToNextBadge = () => {
    const pts = profile.points;
    if (pts < 50) return (pts / 50) * 100;
    if (pts < 100) return ((pts - 50) / 50) * 100;
    if (pts < 500) return ((pts - 100) / 400) * 100;
    return 100; // Max
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Profilim</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Topluluğa yaptığın katkılar ve kazandığın rozetler
        </Text>
      </View>

      <View style={[styles.badgeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.badgeHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: getBadgeColor() + '20' }]}>
            {getBadgeIcon()}
          </View>
          <View style={styles.badgeInfo}>
            <Text style={[styles.badgeTitle, { color: theme.text }]}>Mevcut Rütbe</Text>
            <Text style={[styles.badgeName, { color: getBadgeColor() }]}>{profile.badge}</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: getBadgeColor(), width: `${progressToNextBadge()}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            Sonraki rütbe için bildirim yapmaya devam et!
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: theme.primary + '20' }]}>
            <TrendingUp size={24} color={theme.primary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{profile.points}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Toplam Puan</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: theme.secondary + '20' }]}>
            <ShieldAlert size={24} color={theme.secondary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{profile.reportsCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Bildirilen Spam</Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>Nasıl Puan Kazanırım?</Text>
        <Text style={[styles.infoDesc, { color: theme.textMuted }]}>
          Ana ekrandaki "Spam Bildir" butonunu kullanarak yeni şüpheli kelimeler veya numaralar bildirebilirsiniz. Yapay zeka onayından geçen her geçerli bildiriminiz için +10 Puan kazanırsınız!
        </Text>
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
  badgeCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
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
  infoCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
});
