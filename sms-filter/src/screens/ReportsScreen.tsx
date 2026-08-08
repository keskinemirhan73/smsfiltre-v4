import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flag, Megaphone, Receipt, ShieldAlert, ShieldBan, ShieldCheck, Sparkles, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterManager, type FilterRule, type HistoryItem } from '../modules/FilterManager';
import { messageCategoryOption, type MessageCategory } from '../services/messageCategoryPolicy';
import type { PendingSenderCorrection } from '../services/nativeSenderOverrides';
import { parseSenderRuleInput } from '../services/senderRulePolicy';
import { radii, spacing, useAppTheme } from '../theme';

type ActivityCategory = MessageCategory;
type ActivityFilter = 'all' | ActivityCategory;

const historyCategory = (status: HistoryItem['status']): ActivityCategory =>
  status === 'blocked' ? 'junk' : status;

function CategoryIcon({ category, size = 18 }: { category: ActivityCategory; size?: number }) {
  const color = messageCategoryOption(category).color;
  if (category === 'junk') return <ShieldBan color={color} size={size} />;
  if (category === 'allowed') return <ShieldCheck color={color} size={size} />;
  if (category === 'transaction') return <Receipt color={color} size={size} />;
  return <Megaphone color={color} size={size} />;
}

function eventSourceLabel(source: HistoryItem['source']) {
  if (source === 'manual') return 'Manuel düzeltme';
  if (source === 'report') return 'Mesajlar raporu';
  if (source === 'native') return 'Cihaz filtresi';
  if (source === 'simulator') return 'Test simülatörü';
  return 'Yerel geçmiş';
}

export default function ReportsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [events, setEvents] = useState<HistoryItem[]>([]);
  const [pendingCorrections, setPendingCorrections] = useState<PendingSenderCorrection[]>([]);
  const [reportInput, setReportInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');
  const [loadError, setLoadError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const loadData = useCallback(async (showRefreshing = true) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const importedCount = await FilterManager.importNativeSmsEvents();
      const [loadedRules, loadedHistory, loadedPending] = await Promise.all([
        FilterManager.loadRules(),
        FilterManager.loadHistory(),
        FilterManager.loadPendingSenderCorrections(),
      ]);
      setRules(loadedRules);
      setEvents(loadedHistory);
      setPendingCorrections(loadedPending);
      const nativeWarning = FilterManager.getNativeImportWarning();
      setLoadError(nativeWarning ?? '');
      setSyncMessage(
        nativeWarning
          ? ''
          : importedCount > 0
            ? `${importedCount} yeni cihaz işlemi aktarıldı.`
            : 'Bekleyen yeni rapor bulunamadı.',
      );
    } catch {
      setLoadError('İşlem geçmişi okunamadı. Yenilemek için aşağı çekin.');
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') loadData(false);
    });
    return () => subscription.remove();
  }, [loadData]);

  const handleSenderCategoryChange = async (category: ActivityCategory) => {
    const sender = parseSenderRuleInput(reportInput);
    if (!sender) {
      Alert.alert('Geçersiz Bilgi', 'Gönderici adı veya numarası en fazla 64 karakter olmalıdır.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await FilterManager.categorizeSender(sender, category);
      setRules(result.rules);
      setEvents(result.history);

      setReportInput('');
      Alert.alert(
        result.nativeSynced ? 'Gönderen Güncellendi' : 'Yerelde Kaydedildi',
        result.nativeSynced
          ? `“${sender}” bundan sonraki uygun SMS/MMS mesajları için ${messageCategoryOption(category).label} olarak kaydedildi.`
          : 'Kural cihazda saklandı ancak iOS filtresine şu anda aktarılamadı. Uygulamayı yeniden açıp tekrar deneyin.',
      );
    } catch (error) {
      Alert.alert('İşlem Tamamlanamadı', error instanceof Error ? error.message : 'Lütfen yeniden deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePendingConfirmation = async (id: string, category: ActivityCategory) => {
    setIsSubmitting(true);
    try {
      const result = await FilterManager.confirmPendingSenderCorrection(id, category);
      setRules(result.rules);
      setEvents(result.history);
      setPendingCorrections(result.pending);
      Alert.alert(
        result.nativeSynced ? 'Kural Etkinleştirildi' : 'Kural Yerelde Kaydedildi',
        result.nativeSynced
          ? `Göndericinin bundan sonraki uygun mesajları ${messageCategoryOption(category).label} olarak sınıflandırılacak.`
          : 'Kural kaydedildi ancak iOS filtresine aktarılamadı. Uygulamayı yeniden açıp senkronizasyonu tekrar deneyin.',
      );
    } catch (error) {
      Alert.alert('Onaylanamadı', error instanceof Error ? error.message : 'Lütfen yeniden deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePendingDismiss = async (id: string) => {
    setIsSubmitting(true);
    try {
      setPendingCorrections(await FilterManager.dismissPendingSenderCorrection(id));
    } catch {
      Alert.alert('Silinemedi', 'Bekleyen ayar silinemedi. Lütfen yeniden deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const updated = rules.filter(rule => rule.id !== ruleId);
    setRules(updated);
    await FilterManager.saveRules(updated);
  };

  const filteredRules = rules.filter(rule => activeFilter === 'all' || rule.category === activeFilter);
  const filteredEvents = events.filter(event => activeFilter === 'all' || historyCategory(event.status) === activeFilter);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: '#8B5CF620' }]}><Flag color="#8B5CF6" size={24} /></View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>İşlemler & Raporlar</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Geçmiş ve aktif gönderen kuralları</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData()} colors={['#8B5CF6']} />}
      >
        {pendingCorrections.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: '#8B5CF680' }]}>
            <View style={styles.cardHeader}>
              <ShieldCheck color="#8B5CF6" size={20} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Bekleyen Gönderici Ayarları</Text>
            </View>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>
              Mesajlar’da seçtiğiniz kategori henüz kural değildir. Göndericiyi kontrol edip aşağıdan onaylayın. “Sil ve Bildir” kullandıysanız eski mesaj Apple tarafından silinmiştir; bu ayar yalnız sonraki uygun SMS/MMS mesajlarını etkiler.
            </Text>
            {pendingCorrections.map(correction => {
              const selectedOption = messageCategoryOption(correction.category);
              return (
                <View key={correction.id} style={[styles.pendingCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={styles.pendingHeader}>
                    <View style={styles.ruleTextCol}>
                      <Text style={[styles.ruleKeyword, { color: theme.text }]}>{correction.sender}</Text>
                      <Text style={[styles.ruleCategory, { color: selectedOption.color }]}>Mesajlar seçimi: {selectedOption.label}</Text>
                    </View>
                    <TouchableOpacity disabled={isSubmitting} onPress={() => handlePendingDismiss(correction.id)} style={styles.deleteButton}>
                      <Trash2 color="#EF4444" size={18} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.categoryGrid}>
                    {(['junk', 'allowed', 'transaction', 'promotion'] as ActivityCategory[]).map(category => {
                      const option = messageCategoryOption(category);
                      return (
                        <TouchableOpacity
                          key={`${correction.id}-${category}`}
                          style={[styles.categoryButton, { backgroundColor: option.color }, isSubmitting && styles.disabledButton]}
                          disabled={isSubmitting}
                          onPress={() => handlePendingConfirmation(correction.id, category)}
                        >
                          <CategoryIcon category={category} />
                          <Text style={styles.categoryButtonText}>{option.shortLabel}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Sparkles color="#8B5CF6" size={20} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Göndericiyi Düzelt</Text>
          </View>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>
            Bankkart gibi bir göndereni gelecekteki uygun SMS/MMS mesajları için seçtiğiniz kategoriye alın.
            Bu işlem eski mesajı taşımaz. iOS mevcut Mesajlar geçmişine erişmez ve bilinen kişilerde filtreyi çağırmayabilir.
            Mesajlar’da “Sil ve İstenmeyen Olarak Bildir” ile başlarsanız mesaj Apple tarafından silinir; FiltreAI silinen mesajı geri getiremez.
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Gönderen adı veya numarası (ör. Bankkart)"
            placeholderTextColor={theme.textMuted}
            value={reportInput}
            onChangeText={setReportInput}
            maxLength={64}
            autoCapitalize="none"
          />
          <View style={styles.categoryGrid}>
            <TouchableOpacity style={[styles.categoryButton, { backgroundColor: '#EF4444' }]} onPress={() => handleSenderCategoryChange('junk')} disabled={isSubmitting}>
              <CategoryIcon category="junk" /><Text style={styles.categoryButtonText}>İstenmeyen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryButton, { backgroundColor: '#10B981' }]} onPress={() => handleSenderCategoryChange('allowed')} disabled={isSubmitting}>
              <CategoryIcon category="allowed" /><Text style={styles.categoryButtonText}>Güvenli</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryButton, { backgroundColor: '#3B82F6' }]} onPress={() => handleSenderCategoryChange('transaction')} disabled={isSubmitting}>
              <CategoryIcon category="transaction" /><Text style={styles.categoryButtonText}>İşlem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.categoryButton, { backgroundColor: '#F59E0B' }]} onPress={() => handleSenderCategoryChange('promotion')} disabled={isSubmitting}>
              <CategoryIcon category="promotion" /><Text style={styles.categoryButtonText}>Tanıtım</Text>
            </TouchableOpacity>
          </View>
          {isSubmitting && <ActivityIndicator color="#8B5CF6" />}
        </View>

        <View style={[styles.infoCard, { backgroundColor: loadError ? '#EF444415' : '#3B82F615', borderColor: loadError ? '#EF444450' : '#3B82F650' }]}>
          <ShieldAlert color={loadError ? '#EF4444' : '#3B82F6'} size={18} />
          <Text style={[styles.infoText, { color: loadError ? '#EF4444' : theme.textMuted }]}>{loadError || syncMessage}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'junk', 'allowed', 'transaction', 'promotion'] as ActivityFilter[]).map(filter => {
            const active = activeFilter === filter;
            const color = filter === 'all' ? '#8B5CF6' : messageCategoryOption(filter).color;
            const label = filter === 'all' ? 'Tümü' : messageCategoryOption(filter).shortLabel;
            return (
              <TouchableOpacity key={filter} style={[styles.chip, active && { backgroundColor: color }]} onPress={() => setActiveFilter(filter)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>SMS İşlem Geçmişi</Text>
          <Text style={[styles.sectionCount, { color: theme.textMuted }]}>{filteredEvents.length}</Text>
        </View>
        {filteredEvents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ShieldAlert color={theme.textMuted} size={32} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz işlem görünmüyor</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>iOS mevcut Mesajlar geçmişine erişmez. Mesajlar’dan yaptığınız uygun raporlar ve manuel düzeltmeler burada görünür. Önce Ayarlar &gt; Uygulamalar &gt; Telefon &gt; SMS/Arama Raporlama altında FiltreAI’yi seçin. Kategoriye dokunduktan sonra FiltreAI’yi açın.</Text>
          </View>
        ) : filteredEvents.map(event => {
          const category = historyCategory(event.status);
          const option = messageCategoryOption(category);
          return (
            <View key={`event-${event.id}`} style={[styles.ruleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.ruleBadge, { backgroundColor: `${option.color}20` }]}><CategoryIcon category={category} /></View>
              <View style={styles.ruleTextCol}>
                <Text style={[styles.ruleKeyword, { color: theme.text }]}>{event.sender}</Text>
                <Text style={[styles.ruleCategory, { color: option.color }]}>{option.label}</Text>
                <Text style={[styles.eventPreview, { color: theme.textMuted }]}>{event.preview}</Text>
                <Text style={[styles.eventDate, { color: theme.textMuted }]}>{eventSourceLabel(event.source)} · {new Date(event.timestamp).toLocaleString('tr-TR')}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Aktif Cihaz Kuralları</Text>
          <Text style={[styles.sectionCount, { color: theme.textMuted }]}>{filteredRules.length}</Text>
        </View>
        {filteredRules.map(rule => {
          const option = messageCategoryOption(rule.category);
          return (
            <View key={`rule-${rule.id}`} style={[styles.ruleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.ruleBadge, { backgroundColor: `${option.color}20` }]}><CategoryIcon category={rule.category} /></View>
              <View style={styles.ruleTextCol}>
                <Text style={[styles.ruleKeyword, { color: theme.text }]}>{rule.keyword}</Text>
                <Text style={[styles.ruleCategory, { color: option.color }]}>{option.label} · {rule.matchTarget === 'sender' ? 'Gönderen' : rule.matchTarget === 'content' ? 'İçerik' : 'Gönderen + İçerik'}</Text>
              </View>
              <TouchableOpacity style={[styles.deleteButton, isSubmitting && styles.disabledButton]} disabled={isSubmitting} onPress={() => handleDeleteRule(rule.id)}><Trash2 color="#EF4444" size={18} /></TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1 },
  iconBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scrollContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  card: { padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, lineHeight: 19 },
  input: { height: 48, borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, fontSize: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryButton: { width: '48%', minHeight: 44, borderRadius: radii.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  categoryButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  infoCard: { minHeight: 44, borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17 },
  filterRow: { flexGrow: 0 },
  filterContent: { gap: spacing.sm, paddingRight: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: '#8E8E9320' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  chipTextActive: { color: '#FFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '700' },
  emptyCard: { padding: spacing.xl, borderRadius: radii.xl, borderWidth: 1, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  ruleCard: { padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pendingCard: { padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ruleBadge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  ruleTextCol: { flex: 1 },
  ruleKeyword: { fontSize: 15, fontWeight: '700' },
  ruleCategory: { fontSize: 12, marginTop: 2 },
  eventPreview: { fontSize: 12, marginTop: 4 },
  eventDate: { fontSize: 11, marginTop: 3 },
  deleteButton: { padding: spacing.sm },
  disabledButton: { opacity: 0.4 },
});
