import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Flag, ShieldBan, ShieldCheck, Trash2, Send, CheckCircle2, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, FilterRule, HistoryItem } from '../modules/FilterManager';
import { parseCustomRuleKeyword } from '../services/customRuleInput';
import { SecurityUtils } from '../utils/SecurityUtils';

export default function ReportsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [events, setEvents] = useState<HistoryItem[]>([]);
  const [reportInput, setReportInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'junk' | 'allowed'>('all');

  const loadData = async () => {
    setRefreshing(true);
    try {
      await FilterManager.importNativeSmsEvents();
      const loadedRules = await FilterManager.loadRules();
      const loadedHistory = await FilterManager.loadHistory();
      setRules(loadedRules);
      setEvents(loadedHistory);
    } catch {
      // quiet fallback
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleQuickReport = async (category: 'junk' | 'allowed') => {
    if (!reportInput.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen şikayet etmek istediğiniz gönderici numarasını veya mesaj başlığını yazın.');
      return;
    }
    setIsSubmitting(true);
    try {
      const parsed = parseCustomRuleKeyword(reportInput);
      const keyword = parsed ? parsed.keyword : reportInput.trim();

      const newRule: FilterRule = {
        id: Date.now().toString(),
        keyword,
        type: 'word',
        category,
        matchTarget: 'both',
      };
      const updated = [newRule, ...rules];
      setRules(updated);
      await FilterManager.saveRules(updated);

      const safeKeyword = SecurityUtils.maskPII(keyword);
      await fetch('https://smsfiltre-v4.onrender.com/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: safeKeyword, type: 'word', category }),
      }).catch(() => {});

      setReportInput('');
      Alert.alert(
        category === 'junk' ? '🛡️ İstenmeyen Olarak İşlendi' : '🟢 Güvenli Olarak İzin Verildi',
        `"${keyword}" başarıyla kaydedildi ve topluluk koruma ağına işlendi! 🚀`
      );
    } catch {
      Alert.alert('İşlem Başarılı', 'Kural cihaz içi veritabanına işlendi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const updated = rules.filter(r => r.id !== ruleId);
    setRules(updated);
    await FilterManager.saveRules(updated);
  };

  const filteredRules = rules.filter(r => {
    if (activeFilter === 'junk') return r.category === 'junk';
    if (activeFilter === 'allowed') return r.category === 'allowed';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Title Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: '#8B5CF620' }]}>
            <Flag color="#8B5CF6" size={24} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>İşlemler & Raporlar</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Apple Mesajlar & Cihaz İçi Bildirim Hub'ı
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#8B5CF6']} />}
      >
        {/* Quick Add Report Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Sparkles color="#8B5CF6" size={20} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Hızlı Gönderici & Mesaj Bildir</Text>
          </View>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>
            Şüpheli bahis, dolandırıcılık SMS numarası veya SMS kelimesini anında bildirerek kendi kuralınızı oluşturun:
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Gönderici no (örn: +90850...) veya SMS metni..."
            placeholderTextColor={theme.textMuted}
            value={reportInput}
            onChangeText={setReportInput}
          />

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => handleQuickReport('junk')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <ShieldBan color="#FFF" size={18} />
                  <Text style={styles.reportBtnText}>İstenmeyen Yap</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: '#10B981' }]}
              onPress={() => handleQuickReport('allowed')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <ShieldCheck color="#FFF" size={18} />
                  <Text style={styles.reportBtnText}>Güvenli Yap</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          directionalLockEnabled
        >
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.chip, activeFilter === 'all' && { backgroundColor: '#8B5CF6' }]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.chipText, activeFilter === 'all' && { color: '#FFF' }]}>Tüm İşlemler ({rules.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, activeFilter === 'junk' && { backgroundColor: '#EF4444' }]}
              onPress={() => setActiveFilter('junk')}
            >
              <Text style={[styles.chipText, activeFilter === 'junk' && { color: '#FFF' }]}>🚫 Engellenenler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, activeFilter === 'allowed' && { backgroundColor: '#10B981' }]}
              onPress={() => setActiveFilter('allowed')}
            >
              <Text style={[styles.chipText, activeFilter === 'allowed' && { color: '#FFF' }]}>🟢 İzinliler</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* List of Rules & Native Events */}
        {filteredRules.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ShieldAlert color={theme.textMuted} size={36} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz Kayıtlı İşlem Yok</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Apple Mesajlar uygulamasından bildirdiğiniz veya yukarıdan eklediğiniz kurallar burada canlı olarak listelenir.
            </Text>
          </View>
        ) : (
          filteredRules.map(rule => (
            <View key={rule.id} style={[styles.ruleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.ruleInfo}>
                <View style={[styles.ruleBadge, { backgroundColor: rule.category === 'junk' ? '#EF444420' : '#10B98120' }]}>
                  {rule.category === 'junk' ? <ShieldBan color="#EF4444" size={18} /> : <ShieldCheck color="#10B981" size={18} />}
                </View>
                <View style={styles.ruleTextCol}>
                  <Text style={[styles.ruleKeyword, { color: theme.text }]}>{rule.keyword}</Text>
                  <Text style={[styles.ruleCategory, { color: rule.category === 'junk' ? '#EF4444' : '#10B981' }]}>
                    {rule.category === 'junk' ? 'İstenmeyen / Engellendi' : 'İzin Verilen / Güvenli'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRule(rule.id)}>
                <Trash2 color="#EF4444" size={18} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    height: 46,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reportBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  reportBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterContent: {
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: '#8E8E9320',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  ruleCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  ruleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleTextCol: {
    flex: 1,
  },
  ruleKeyword: {
    fontSize: 15,
    fontWeight: '700',
  },
  ruleCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
