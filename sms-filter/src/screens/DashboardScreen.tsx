import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Animated, Platform, KeyboardAvoidingView, Easing } from 'react-native';
import { ShieldAlert, Zap, History, ShieldCheck, TrendingUp, Receipt, Megaphone, ShieldBan, X, ArrowRight, Activity, Globe } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, AppSettings, Stats, HistoryItem } from '../modules/FilterManager';
import { ThreatCloudService } from '../services/ThreatCloudService';

const { width } = Dimensions.get('window');

const defaultStats: Stats = { blockedCount: 0, analyzedCount: 0, transactionCount: 0, promotionCount: 0 };

export default function DashboardScreen() {
  const theme = useAppTheme();
  const [settings, setSettings] = useState<AppSettings>({
    underAttackMode: false, smartFilter: true, silentBlocking: true,
    filterScheduleEnabled: false, scheduleStart: '22:00', scheduleEnd: '08:00',
    fraudFilter: true, databaseFilter: true, proactiveFilter: true, invalidNumberFilter: false,
    categoryMapping: { spam: 'junk', transaction: 'transaction', promotion: 'promotion' },
    aiSensitivity: 0.8, blockForeignNumbers: false, blockArabic: false, theme: 'system', language: 'tr',
    customFraudKeywords: [], whitelist: []
  });
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [recentActivity, setRecentActivity] = useState<HistoryItem[]>([]);
  const [cloudThreatCount, setCloudThreatCount] = useState<number>(0);

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportKeyword, setReportKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pulse animation for the shield
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

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
      ThreatCloudService.syncDatabase().then(() => {
        ThreatCloudService.getDatabase().then(db => {
          setCloudThreatCount(db.spamKeywords.length + db.scamUrls.length + (db.regexPatterns?.length || 0));
        });
      });
    }, [])
  );

  const statCards = [
    { label: 'Engellenen', value: stats.blockedCount, icon: ShieldBan, color: theme.danger, bg: 'rgba(239,68,68,0.08)' },
    { label: 'Analiz Edilen', value: stats.analyzedCount, icon: Activity, color: theme.primary, bg: 'rgba(59,130,246,0.08)' },
    { label: 'İşlem', value: stats.transactionCount, icon: Receipt, color: theme.secondary, bg: 'rgba(16,185,129,0.08)' },
    { label: 'Promosyon', value: stats.promotionCount, icon: Megaphone, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'blocked': return { color: theme.danger, text: 'Engellendi', icon: ShieldBan, bg: 'rgba(239,68,68,0.1)' };
      case 'transaction': return { color: theme.primary, text: 'İşlem', icon: Receipt, bg: 'rgba(59,130,246,0.1)' };
      case 'promotion': return { color: '#F59E0B', text: 'Promosyon', icon: Megaphone, bg: 'rgba(245,158,11,0.1)' };
      default: return { color: theme.secondary, text: 'İzinli', icon: ShieldCheck, bg: 'rgba(16,185,129,0.1)' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Premium Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.title, { color: theme.text }]}>Genel Durum</Text>
          
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.heroGlow}>
              <Animated.View style={[styles.heroShieldPulse, { backgroundColor: settings.underAttackMode ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', transform: [{ scale: pulseAnim }] }]} />
              <View style={[styles.heroShieldInner, { backgroundColor: settings.underAttackMode ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                {settings.underAttackMode ? (
                  <ShieldAlert size={40} color={theme.danger} />
                ) : (
                  <ShieldCheck size={40} color={theme.secondary} />
                )}
              </View>
            </View>
            
            <View style={{ alignItems: 'center', marginTop: spacing.md }}>
              <Text style={[styles.heroStatusTitle, { color: settings.underAttackMode ? theme.danger : theme.text }]}>
                {settings.underAttackMode ? 'Saldırı Modu Aktif' : 'Koruma Aktif'}
              </Text>
              <Text style={[styles.heroStatusDesc, { color: theme.textMuted }]}>
                {settings.underAttackMode ? 'Bilinmeyen tüm numaralar engelleniyor.' : 'Yapay zeka arka planda smsleri tarıyor.'}
              </Text>
            </View>

            {/* Cloud Sync Badge */}
            <View style={[styles.cloudBadge, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
              <Globe size={14} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                Bulut Veritabanı Güncel ({cloudThreatCount.toLocaleString('tr-TR')} Tehdit)
              </Text>
            </View>
          </View>
        </View>

        {/* iOS Settings Setup Card */}
        {Platform.OS === 'ios' && (
          <View style={[styles.setupCard, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)' }]}>
            <View style={styles.setupHeader}>
              <View style={[styles.setupIconWrapper, { backgroundColor: '#8B5CF6' }]}>
                <ShieldCheck size={20} color="#fff" />
              </View>
              <Text style={[styles.setupTitle, { color: '#8B5CF6' }]}>Filtreyi Aktifleştirin</Text>
            </View>
            <Text style={[styles.setupDesc, { color: theme.text }]}>
              Filtrelemenin çalışması için telefonunuzun <Text style={{fontWeight: '800'}}>Ayarlar {'>'} Mesajlar {'>'} Bilinmeyenleri Filtrele</Text> menüsüne giderek <Text style={{fontWeight: '800'}}>SmsFiltre</Text>'yi seçmeniz gerekmektedir.
            </Text>
          </View>
        )}

        {/* 2x2 Stats Widget */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>İstatistikler</Text>
        <View style={styles.statsGrid}>
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <View key={i} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statIconWrapper, { backgroundColor: card.bg }]}>
                  <Icon size={20} color={card.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {card.value.toLocaleString('tr-TR')}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{card.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Recent Activity List */}
        <View style={styles.activityHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Son Aktiviteler</Text>
          <TouchableOpacity>
            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.historyList, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {recentActivity.length === 0 ? (
            <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
              <History size={40} color={theme.border} style={{ marginBottom: spacing.md }} />
              <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', fontWeight: '500' }}>Henüz mesaj filtrelenmedi.</Text>
            </View>
          ) : (
            recentActivity.slice(0, 5).map((item, i) => {
              const conf = getStatusConfig(item.status);
              const ItemIcon = conf.icon;
              return (
                <View key={item.id || i} style={[styles.historyItem, { borderBottomColor: theme.border, borderBottomWidth: i === Math.min(recentActivity.length, 5) - 1 ? 0 : 1 }]}>
                  <View style={[styles.historyIcon, { backgroundColor: conf.bg }]}>
                    <ItemIcon size={18} color={conf.color} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={[styles.historySender, { color: theme.text }]} numberOfLines={1}>{item.sender}</Text>
                    <Text style={[styles.historyPreview, { color: theme.textMuted }]} numberOfLines={1}>{item.preview}</Text>
                  </View>
                  <View style={[styles.historyActionBadge, { backgroundColor: conf.bg }]}>
                    <Text style={[styles.statusLabel, { color: conf.color }]}>{conf.text}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Report Button */}
      <View style={styles.floatingBtnContainer}>
        <TouchableOpacity 
          style={[styles.floatingBtn, { backgroundColor: theme.primary }]}
          onPress={() => setIsReportModalVisible(true)}
          activeOpacity={0.8}
        >
          <Megaphone size={22} color="#fff" />
          <Text style={styles.floatingBtnText}>Spam Bildir</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Bottom Sheet Modal */}
      <Modal visible={isReportModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismissArea} onPress={() => setIsReportModalVisible(false)} activeOpacity={1} />
          <View style={[styles.bottomSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Topluluğa Bildir</Text>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.sheetDesc, { color: theme.textMuted }]}>
              Yeni bir spam kelimesini veya numarasını şikayet edin. Şikayetler Yapay Zeka tarafından incelenip bulut veritabanına eklenir.
            </Text>
            
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <ShieldAlert size={20} color={theme.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.sheetInput, { color: theme.text }]}
                placeholder="Örn: deneme bonusu, yasadışı bahis"
                placeholderTextColor={theme.textMuted}
                value={reportKeyword}
                onChangeText={setReportKeyword}
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: reportKeyword.trim() ? 1 : 0.6 }]}
              onPress={handleReportSpam}
              disabled={isSubmitting || !reportKeyword.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Şikayeti Gönder</Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: spacing.lg },
  
  heroSection: { marginBottom: spacing.xl },
  heroCard: {
    borderRadius: radii.xl, padding: spacing.xl, borderWidth: 1,
    alignItems: 'center', overflow: 'hidden'
  },
  heroGlow: { position: 'relative', width: 96, height: 96, justifyContent: 'center', alignItems: 'center' },
  heroShieldPulse: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
  },
  heroShieldInner: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
  },
  heroStatusTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroStatusDesc: { fontSize: 14, textAlign: 'center' },
  cloudBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radii.full, marginTop: spacing.lg
  },

  setupCard: {
    borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1,
    marginBottom: spacing.xxl,
  },
  setupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  setupIconWrapper: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  setupTitle: { fontSize: 16, fontWeight: '800' },
  setupDesc: { fontSize: 14, lineHeight: 22 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md, letterSpacing: -0.5 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1,
  },
  statIconWrapper: {
    width: 40, height: 40, borderRadius: radii.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md
  },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: '600' },

  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  historyList: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  historyItem: {
    flexDirection: 'row', padding: spacing.lg, alignItems: 'center',
  },
  historyIcon: {
    width: 44, height: 44, borderRadius: radii.full,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  historyContent: { flex: 1, marginRight: spacing.sm },
  historySender: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  historyPreview: { fontSize: 13 },
  historyActionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.md },
  statusLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  floatingBtnContainer: {
    position: 'absolute', bottom: spacing.xl, left: spacing.lg, right: spacing.lg,
  },
  floatingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: radii.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  floatingBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalDismissArea: { flex: 1 },
  bottomSheet: {
    borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl,
    padding: spacing.xl, paddingBottom: spacing.xxl * 1.5,
    borderWidth: 1, borderBottomWidth: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 24,
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: 3, backgroundColor: '#cbd5e1',
    alignSelf: 'center', marginBottom: spacing.lg
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  closeBtn: { padding: 4 },
  sheetDesc: { fontSize: 14, lineHeight: 20, marginBottom: spacing.xl },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: radii.lg, paddingHorizontal: spacing.md, height: 56,
    marginBottom: spacing.xl
  },
  sheetInput: { flex: 1, fontSize: 16, fontWeight: '500', height: '100%' },
  
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: radii.lg, gap: 8
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
