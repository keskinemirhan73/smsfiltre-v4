import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { Trophy, ShieldAlert, Award, Star, TrendingUp, Crown, Medal } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

const API_URL = 'https://smsfiltre-v4.onrender.com';

// Mock Leaderboard Data
const LEADERBOARD_DATA = [
  { id: '1', name: 'Caner K.', points: 1450, badge: 'Siber Güvenlik Uzmanı', reports: 145 },
  { id: '2', name: 'Ahmet Y.', points: 1200, badge: 'Spam Savaşçısı', reports: 120 },
  { id: '3', name: 'Zeynep A.', points: 850, badge: 'Aktif Kalkan', reports: 85 },
  { id: '4', name: 'Burak T.', points: 640, badge: 'Aktif Kalkan', reports: 64 },
  { id: '5', name: 'Selin D.', points: 420, badge: 'Acemi Kalkan', reports: 42 },
];

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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown color="#F59E0B" size={24} />;
    if (index === 1) return <Medal color="#9CA3AF" size={24} />;
    if (index === 2) return <Medal color="#B45309" size={24} />;
    return <Text style={{ color: theme.textMuted, fontSize: 16, fontWeight: 'bold' }}>{index + 1}</Text>;
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
        <Text style={[styles.title, { color: theme.text }]}>Liderlik Tablosu</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Topluluğu spamdan koruyan en iyi savaşçılar
        </Text>
      </View>

      <View style={[styles.promoCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
        <View style={styles.promoIcon}>
          <Trophy color={theme.primary} size={32} />
        </View>
        <View style={styles.promoTextContainer}>
          <Text style={[styles.promoTitle, { color: theme.primary }]}>Pro Üyelik Hediye!</Text>
          <Text style={[styles.promoDesc, { color: theme.text }]}>
            Her ayın sonunda Liderlik Tablosu'nda <Text style={{fontWeight: 'bold'}}>ilk 3'e giren</Text> kullanıcılara ömür boyu Pro Üyelik hediye edilecektir. Spam bildirmeye devam edin!
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Senin İstatistiklerin</Text>

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

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: spacing.lg }]}>Top 5 Spam Savaşçısı</Text>

      <View style={[styles.leaderboardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {LEADERBOARD_DATA.map((user, index) => (
          <View key={user.id} style={[styles.leaderboardItem, index !== LEADERBOARD_DATA.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
            <View style={styles.rankContainer}>
              {getRankIcon(index)}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
              <Text style={[styles.userBadge, { color: theme.textMuted }]}>{user.badge}</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Text style={[styles.pointsValue, { color: theme.primary }]}>{user.points} P</Text>
              <Text style={[styles.reportsValue, { color: theme.textMuted }]}>{user.reports} Bildirim</Text>
            </View>
          </View>
        ))}
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
