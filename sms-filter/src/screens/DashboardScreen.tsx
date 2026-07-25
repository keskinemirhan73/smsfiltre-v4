import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ShieldAlert, Zap, History, ShieldCheck, TrendingUp, Receipt, Megaphone, ShieldBan } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, AppSettings, Stats, HistoryItem, THREAT_DATABASE } from '../modules/FilterManager';
import { ThreatCloudService } from '../services/ThreatCloudService';

const { width } = Dimensions.get('window');

const defaultStats: Stats = { blockedCount: 0, analyzedCount: 0, transactionCount: 0, promotionCount: 0 };

export default function DashboardScreen() {
  const theme = useAppTheme();
  const [settings, setSettings] = useState<AppSettings>({
    underAttackMode: false, smartFilter: true, silentBlocking: true,
    filterScheduleEnabled: false, scheduleStart: '22:00', scheduleEnd: '08:00'
  });
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [recentActivity, setRecentActivity] = useState<HistoryItem[]>([]);
  const [cloudThreatCount, setCloudThreatCount] = useState<number>(0);

  // Spam Bildirme State'leri
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportKeyword, setReportKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Oto-Pilot Sunucu Adresi (Geçici olarak Localhost, yayınlanınca değişecek)
  const BACKEND_URL = 'https://smsfiltre-v4.onrender.com/api/report';

  const handleReportSpam = async () => {
    if (!reportKeyword.trim()) {
      Alert.alert('Hata', 'Lütfen bir kelime veya numara girin.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: reportKeyword, type: 'word' })
      });
      
      const result = await response.json();
      if (response.ok) {
        Alert.alert('Teşekkürler!', result.message);
        setReportKeyword('');
        setIsReportModalVisible(false);
      } else {
        Alert.alert('Hata', result.error || 'Şikayet gönderilemedi.');
      }
    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Oto-Pilot sunucusuna ulaşılamadı. Sunucunun açık olduğundan emin olun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      FilterManager.loadSettings().then(setSettings);
      FilterManager.loadStats().then(setStats);
      FilterManager.loadHistory().then(setRecentActivity);
      // Önce buluttan senkronize et, sonra sayıyı güncelle
      ThreatCloudService.syncDatabase().then(() => {
        ThreatCloudService.getDatabase().then(db => {
          const cloudCount = db.blacklistedNumbers.length + db.spamKeywords.length + db.scamUrls.length + (db.regexPatterns?.length || 0);
          const localCount = THREAT_DATABASE.length;
          // Tekrarlayanları çıkar, toplamı göster
          setCloudThreatCount(cloudCount + localCount);
        });
      });
    }, [])
  );

  const statCards = [
    { label: 'Engellenen', value: stats.blockedCount, icon: ShieldBan, color: theme.danger, glowColor: 'rgba(239,68,68,0.2)' },
    { label: 'Analiz Edilen', value: stats.analyzedCount, icon: Zap, color: theme.primary, glowColor: 'rgba(59,130,246,0.2)' },
    { label: 'İşlem', value: stats.transactionCount, icon: Receipt, color: theme.secondary, glowColor: 'rgba(16,185,129,0.2)' },
    { label: 'Promosyon', value: stats.promotionCount, icon: Megaphone, color: '#F59E0B', glowColor: 'rgba(245,158,11,0.2)' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'blocked': return { color: theme.danger, text: 'Engellendi' };
      case 'transaction': return { color: theme.secondary, text: 'İşlem' };
      case 'promotion': return { color: '#F59E0B', text: 'Promosyon' };
      default: return { color: theme.textMuted, text: 'İzin Verildi' };
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>FiltreAI</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: settings.underAttackMode ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }
        ]}>
          {settings.underAttackMode ? (
            <ShieldAlert size={16} color={theme.danger} />
          ) : (
            <ShieldCheck size={16} color={theme.secondary} />
          )}
          <Text style={[styles.statusText, { color: settings.underAttackMode ? theme.danger : theme.secondary }]}>
            {settings.underAttackMode ? 'Saldırı Modu' : 'Koruma Aktif'}
          </Text>
        </View>
      </View>

      {/* Stats Grid 2x2 */}
      <View style={styles.statsGrid}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <View key={i} style={[styles.statCard, {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: card.color,
            }]}>
              <Icon size={22} color={card.color} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {card.value.toLocaleString('tr-TR')}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{card.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Threat DB Banner */}
      <View style={[styles.threatBanner, { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }]}>
        <TrendingUp size={20} color={theme.primary} />
        <View style={styles.threatContent}>
          <Text style={[styles.threatTitle, { color: theme.text }]}>Tehdit Veritabanı Güncel</Text>
          <Text style={[styles.threatDesc, { color: theme.textMuted }]}>{cloudThreatCount} bilinen spam kaynağı aktif olarak engelleniyor</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Son Aktiviteler</Text>
      
      <View style={[styles.historyList, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {recentActivity.length === 0 ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <History size={32} color={theme.border} style={{ marginBottom: spacing.md }} />
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>Henüz hiçbir mesaj filtrelenmedi.</Text>
          </View>
        ) : (
          recentActivity.map((item, i) => {
            const status = getStatusStyle(item.status);
            return (
              <View key={item.id || i} style={[styles.historyItem, { borderBottomColor: theme.border }]}>
                <View style={[styles.historyIcon, { backgroundColor: theme.background }]}>
                  <History size={18} color={theme.textMuted} />
                </View>
                <View style={styles.historyContent}>
                  <View style={styles.historyTop}>
                    <Text style={[styles.historySender, { color: theme.text }]}>{item.sender}</Text>
                    <Text style={[styles.historyCategory, { color: theme.textMuted }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.historyPreview, { color: theme.textMuted }]} numberOfLines={1}>{item.preview}</Text>
                </View>
                <View style={styles.historyAction}>
                  <Text style={[styles.statusLabel, { color: status.color }]}>{status.text}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Raporlama Butonu (Yüzen Buton veya Alt Buton) */}
      <TouchableOpacity 
        style={[styles.reportButton, { backgroundColor: theme.primary }]}
        onPress={() => setIsReportModalVisible(true)}
      >
        <Megaphone size={20} color="#fff" />
        <Text style={styles.reportButtonText}>Spam Bildir</Text>
      </TouchableOpacity>

      {/* Spam Bildir Modalı */}
      <Modal visible={isReportModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Spam Bildir</Text>
            <Text style={[styles.modalDesc, { color: theme.textMuted }]}>
              Size gelen spam mesajındaki belirgin bir kelimeyi veya gönderen numarayı yazın. 
              Topluluk şikayetleri 5'e ulaştığında yapay zeka bulut veritabanını otomatik güncelleyecektir.
            </Text>
            
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Örn: deneme bonusu veya +905..."
              placeholderTextColor={theme.textMuted}
              value={reportKeyword}
              onChangeText={setReportKeyword}
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.background }]}
                onPress={() => setIsReportModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.modalBtnText, { color: theme.text }]}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={handleReportSpam}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg,
  },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: radii.full, gap: spacing.xs,
  },
  statusText: { fontWeight: '600', fontSize: 13 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    borderRadius: radii.lg, padding: spacing.md, borderWidth: 1,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  statValue: { fontSize: 26, fontWeight: '700', marginTop: spacing.sm, marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  threatBanner: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: radii.md, borderWidth: 1, marginBottom: spacing.lg, gap: spacing.md,
  },
  threatContent: { flex: 1 },
  threatTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  threatDesc: { fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md },

  historyList: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  historyItem: {
    flexDirection: 'row', padding: spacing.md, alignItems: 'center', borderBottomWidth: 1,
  },
  historyIcon: {
    width: 36, height: 36, borderRadius: radii.full,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  historyContent: { flex: 1 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  historySender: { fontSize: 15, fontWeight: '600' },
  historyCategory: { fontSize: 11, fontWeight: '500' },
  historyPreview: { fontSize: 13 },
  historyAction: { marginLeft: spacing.sm },
  statusLabel: { fontSize: 11, fontWeight: '700' },

  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  reportButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg
  },
  modalContent: {
    width: '100%', padding: spacing.xl, borderRadius: radii.xl, borderWidth: 1
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  modalDesc: { fontSize: 13, marginBottom: spacing.lg, lineHeight: 18 },
  input: {
    borderWidth: 1, borderRadius: radii.md, padding: spacing.md,
    fontSize: 15, marginBottom: spacing.lg
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  modalBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  modalBtnText: { fontWeight: '600', fontSize: 15 }
});
