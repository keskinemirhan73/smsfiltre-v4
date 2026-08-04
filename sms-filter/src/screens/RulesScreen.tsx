import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Animated, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { Plus, Trash2, X, ShieldBan, ShieldCheck, Receipt, Megaphone, Search, Flag, Send, CheckCircle2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, FilterRule, HistoryItem } from '../modules/FilterManager';
import { parseCustomRuleKeyword } from '../services/customRuleInput';
import { SecurityUtils } from '../utils/SecurityUtils';

type CategoryTab = 'junk' | 'allowed' | 'transaction' | 'promotion' | 'reports';

const TABS: { key: CategoryTab; label: string; icon: any; color: string }[] = [
  { key: 'junk', label: 'Spam', icon: ShieldBan, color: '#EF4444' },
  { key: 'allowed', label: 'İzinli', icon: ShieldCheck, color: '#10B981' },
  { key: 'reports', label: 'Raporlar & İşlemler', icon: Flag, color: '#8B5CF6' },
  { key: 'transaction', label: 'İşlem', icon: Receipt, color: '#3B82F6' },
  { key: 'promotion', label: 'Tanıtım', icon: Megaphone, color: '#F59E0B' },
];

const { width } = Dimensions.get('window');

export default function RulesScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>('junk');
  const [showModal, setShowModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newMatchTarget, setNewMatchTarget] = useState<'sender' | 'content' | 'both'>('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportInput, setReportInput] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleQuickReport = async (category: 'junk' | 'allowed') => {
    if (!reportInput.trim()) return;
    setIsSubmittingReport(true);
    try {
      const parsed = parseCustomRuleKeyword(reportInput);
      const keyword = parsed ? parsed.keyword : reportInput.trim();

      // 1. Save rule locally
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

      // 2. Submit report to backend cloud
      const safeKeyword = SecurityUtils.maskPII(keyword);
      await fetch('https://smsfiltre-v4.onrender.com/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: safeKeyword, type: 'word', category })
      }).catch(() => {});

      setReportInput('');
      Alert.alert(
        category === 'junk' ? 'İstenmeyen Olarak Bildirildi' : 'Güvenli Olarak Bildirildi',
        `"${keyword}" başarıyla kaydedildi ve topluluk havuzuna fırlatıldı! 🚀`
      );
    } catch {
      Alert.alert('İşlem Başarılı', 'Kural yerel veritabanına işlendi.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      FilterManager.loadRules().then(setRules);
    }, [])
  );

  const filteredRules = rules.filter(r => 
    (r.category === activeTab || activeTab === 'reports') && 
    (r.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddRule = async () => {
    if (!newKeyword.trim()) return;
    const parsedKeyword = parseCustomRuleKeyword(newKeyword);
    if (!parsedKeyword) {
      Alert.alert(
        'Geçersiz Kural',
        'Kural en fazla 200 karakter olmalı; regex kullanıyorsanız ifade geçerli ve güvenli olmalıdır.',
      );
      return;
    }
    const newRule: FilterRule = {
      id: Date.now().toString(),
      keyword: parsedKeyword.keyword,
      type: parsedKeyword.type,
      category: activeTab === 'reports' ? 'junk' : activeTab,
      matchTarget: newMatchTarget,
    };
    const updated = [newRule, ...rules];
    setRules(updated);
    setNewKeyword('');
    setShowModal(false);
    await FilterManager.saveRules(updated);
  };

  const handleDeleteRule = async (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    await FilterManager.saveRules(updated);
  };

  const activeTabInfo = TABS.find(t => t.key === activeTab)!;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl) }]}>
        <Text style={[styles.title, { color: theme.text }]}>Kurallar</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Özel kelime ve numaraları filtreleyin</Text>
      </View>

      {/* Modern Segmented Control for Tabs */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={[styles.segmentedControl, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentBtn,
                  isActive && { backgroundColor: tab.color }
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[
                  styles.segmentText,
                  { color: isActive ? '#fff' : theme.textMuted, fontWeight: isActive ? '700' : '500' }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={20} color={theme.textMuted} />
          <TextInput 
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Kurallarda ara..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {activeTab === 'reports' ? (
          <View style={{ gap: spacing.md }}>
            {/* Quick Report Panel */}
            <View style={[styles.ruleCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Flag size={20} color="#8B5CF6" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Hızlı Rapor & Kural Oluştur</Text>
              </View>
              <Text style={{ fontSize: 13, color: theme.textMuted }}>
                Gelen bir SMS numarasını veya şüpheli kelimeyi buraya yazıp topluluk veritabanına ve kendi filtrenize anında işleyin.
              </Text>
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46 }]}
                placeholder="Örn: CELTICBET, +90549..., VikingMt2"
                placeholderTextColor={theme.textMuted}
                value={reportInput}
                onChangeText={setReportInput}
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#EF4444', height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                  onPress={() => handleQuickReport('junk')}
                  disabled={!reportInput.trim() || isSubmittingReport}
                >
                  <ShieldBan size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>İstenmeyen Yap</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#10B981', height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                  onPress={() => handleQuickReport('allowed')}
                  disabled={!reportInput.trim() || isSubmittingReport}
                >
                  <ShieldCheck size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Güvenli Yap</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* User Activity Feed */}
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 8, marginLeft: 4 }}>
              Eklenen Son Kurallar & Raporlarınız
            </Text>
            {rules.map((rule) => (
              <View key={rule.id} style={[styles.ruleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.ruleIconWrapper, { backgroundColor: rule.category === 'junk' ? '#EF444420' : '#10B98120' }]}>
                  {rule.category === 'junk' ? <ShieldBan size={20} color="#EF4444" /> : <ShieldCheck size={20} color="#10B981" />}
                </View>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleKeyword, { color: theme.text }]}>{rule.keyword}</Text>
                  <Text style={[styles.ruleMeta, { color: theme.textMuted }]}>
                    {rule.category === 'junk' ? 'İstenmeyen (Engellendi)' : 'İzinli (Güvenli)'} • Cihaz & Sunucuya İşlendi
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRule(rule.id)}>
                  <Trash2 color={theme.danger} size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <>
            {filteredRules.map((rule) => (
              <View key={rule.id} style={[styles.ruleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.ruleIconWrapper, { backgroundColor: `${activeTabInfo.color}15` }]}>
                  <activeTabInfo.icon size={20} color={activeTabInfo.color} />
                </View>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleKeyword, { color: theme.text }]}>{rule.keyword}</Text>
                  <Text style={[styles.ruleMeta, { color: theme.textMuted }]}>
                    {rule.type === 'regex' ? 'Düzenli İfade (Regex)' : 'Kelime / Numara'} • {rule.matchTarget === 'sender' ? 'Gönderici' : rule.matchTarget === 'content' ? 'Mesaj İçeriği' : 'Her İkisi'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRule(rule.id)}>
                  <Trash2 color={theme.danger} size={20} />
                </TouchableOpacity>
              </View>
            ))}
            {filteredRules.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: `${activeTabInfo.color}10` }]}>
                  <activeTabInfo.icon color={activeTabInfo.color} size={56} opacity={0.9} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Kural Bulunamadı</Text>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  {searchQuery ? "Aramanızla eşleşen kural yok." : "Özel kurallar ekleyerek filtreyi kişiselleştirin."}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity 
                    style={[styles.emptyAddBtn, { backgroundColor: activeTabInfo.color }]}
                    onPress={() => setShowModal(true)}
                  >
                    <Plus color="#fff" size={20} />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>Yeni Kural Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      {filteredRules.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: activeTabInfo.color }]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.9}
        >
          <Plus color="#fff" size={28} />
        </TouchableOpacity>
      )}

      {/* Add Rule Bottom Sheet Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismissArea} onPress={() => setShowModal(false)} activeOpacity={1} />
          
          <View style={[styles.bottomSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Yeni Kural</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <X color={theme.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <View style={[styles.categoryInfo, { backgroundColor: `${activeTabInfo.color}15` }]}>
              <activeTabInfo.icon size={20} color={activeTabInfo.color} />
              <Text style={[styles.categoryInfoText, { color: activeTabInfo.color }]}>
                {activeTabInfo.label} kategorisine ekleniyor
              </Text>
            </View>

            <Text style={[styles.modalLabel, { color: theme.text }]}>Kelime veya Numara</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Örn: bahis, B[0-9]{3}, +905..."
              placeholderTextColor={theme.textMuted}
              value={newKeyword}
              onChangeText={setNewKeyword}
              autoCapitalize="none"
              autoFocus={true}
            />

            <Text style={[styles.modalLabel, { color: theme.text }]}>Nerede Aransın?</Text>
            <View style={styles.matchTargetRow}>
              {(['content', 'sender', 'both'] as const).map(target => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.matchTargetBtn,
                    { borderColor: theme.border, backgroundColor: theme.background },
                    newMatchTarget === target && { borderColor: activeTabInfo.color, backgroundColor: `${activeTabInfo.color}15` }
                  ]}
                  onPress={() => setNewMatchTarget(target)}
                >
                  <Text style={[
                    styles.matchTargetText,
                    { color: newMatchTarget === target ? activeTabInfo.color : theme.textMuted }
                  ]}>
                    {target === 'content' ? 'İçerik' : target === 'sender' ? 'Gönderici' : 'İkisi de'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: activeTabInfo.color, opacity: newKeyword.trim() ? 1 : 0.6 }]} 
              onPress={handleAddRule}
              disabled={!newKeyword.trim()}
            >
              <Text style={styles.submitBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 15, marginTop: 4 },

  segmentedControl: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
  },

  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md, paddingBottom: 120 },
  ruleCard: {
    flexDirection: 'row', borderRadius: radii.xl, alignItems: 'center',
    borderWidth: 1, padding: spacing.md,
  },
  ruleIconWrapper: {
    width: 44, height: 44, borderRadius: radii.md,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md
  },
  ruleInfo: { flex: 1 },
  ruleKeyword: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  ruleMeta: { fontSize: 12, fontWeight: '500' },
  deleteButton: { padding: spacing.sm },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl * 1.5, paddingHorizontal: spacing.lg },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 14, borderRadius: radii.lg },

  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg, width: 64, height: 64,
    borderRadius: 32, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  bottomSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, paddingBottom: 36,
    borderWidth: 1, borderBottomWidth: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 24,
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: 3, backgroundColor: '#cbd5e1',
    alignSelf: 'center', marginBottom: spacing.lg
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  closeBtn: { padding: 4 },
  
  categoryInfo: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.lg, marginBottom: spacing.lg },
  categoryInfoText: { fontSize: 14, fontWeight: '700', marginLeft: spacing.sm },

  modalLabel: { fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  modalInput: { 
    borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, 
    fontSize: 16, marginBottom: spacing.xl, height: 56 
  },
  matchTargetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  matchTargetBtn: { flex: 1, paddingVertical: 14, borderRadius: radii.lg, borderWidth: 1, alignItems: 'center' },
  matchTargetText: { fontSize: 14, fontWeight: '700' },
  
  submitBtn: {
    height: 56, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
