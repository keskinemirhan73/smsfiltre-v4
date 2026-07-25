import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Plus, Trash2, X, ShieldBan, ShieldCheck, Receipt, Megaphone } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, FilterRule } from '../modules/FilterManager';

type CategoryTab = 'junk' | 'transaction' | 'promotion' | 'allowed';

const TABS: { key: CategoryTab; label: string; icon: any; color: string }[] = [
  { key: 'junk', label: 'Spam', icon: ShieldBan, color: '#EF4444' },
  { key: 'allowed', label: 'İzinli', icon: ShieldCheck, color: '#10B981' },
  { key: 'transaction', label: 'İşlem', icon: Receipt, color: '#3B82F6' },
  { key: 'promotion', label: 'Tanıtım', icon: Megaphone, color: '#F59E0B' },
];

export default function RulesScreen() {
  const theme = useAppTheme();
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>('junk');
  const [showModal, setShowModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newMatchTarget, setNewMatchTarget] = useState<'sender' | 'content' | 'both'>('content');

  useFocusEffect(
    useCallback(() => {
      FilterManager.loadRules().then(setRules);
    }, [])
  );

  const filteredRules = rules.filter(r => r.category === activeTab);

  const handleAddRule = async () => {
    if (!newKeyword.trim()) return;
    const isRegex = newKeyword.includes('[') || newKeyword.includes('\\') || newKeyword.includes('+') || newKeyword.includes('*');
    const newRule: FilterRule = {
      id: Date.now().toString(),
      keyword: newKeyword.trim(),
      type: isRegex ? 'regex' : 'word',
      category: activeTab,
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Filtre Kuralları</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Mesajları kategorilere göre yönetin</Text>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = rules.filter(r => r.category === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                { borderColor: theme.border, backgroundColor: theme.card },
                isActive && { borderColor: tab.color, backgroundColor: `${tab.color}15` },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon size={16} color={isActive ? tab.color : theme.textMuted} />
              <Text style={[styles.tabText, { color: isActive ? tab.color : theme.textMuted }]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: isActive ? tab.color : theme.border }]}>
                <Text style={styles.tabBadgeText}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Rules List */}
      <ScrollView contentContainerStyle={styles.list}>
        {filteredRules.map((rule) => (
          <View key={rule.id} style={[styles.ruleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.ruleAccent, { backgroundColor: activeTabInfo.color }]} />
            <View style={styles.ruleInfo}>
              <Text style={[styles.ruleKeyword, { color: theme.text }]}>{rule.keyword}</Text>
              <View style={styles.ruleMetaRow}>
                <View style={[styles.badge, { backgroundColor: `${activeTabInfo.color}20` }]}>
                  <Text style={[styles.badgeText, { color: activeTabInfo.color }]}>
                    {rule.type === 'regex' ? 'Regex' : 'Kelime'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.background }]}>
                  <Text style={[styles.badgeText, { color: theme.textMuted }]}>
                    {rule.matchTarget === 'sender' ? 'Gönderici' : rule.matchTarget === 'content' ? 'İçerik' : 'Her İkisi'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRule(rule.id)}>
              <Trash2 color={theme.danger} size={18} />
            </TouchableOpacity>
          </View>
        ))}
        {filteredRules.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${activeTabInfo.color}15` }]}>
              <activeTabInfo.icon color={activeTabInfo.color} size={48} opacity={0.8} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Liste Boş</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Bu kategoride henüz bir kural bulunmuyor. Yeni bir kural eklemek için sağ alt köşedeki + butonuna tıklayabilirsiniz.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: activeTabInfo.color }]}
        onPress={() => setShowModal(true)}
      >
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      {/* Add Rule Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Yeni Kural Ekle</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color={theme.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Kategori</Text>
            <View style={[styles.modalCategoryBadge, { backgroundColor: `${activeTabInfo.color}15` }]}>
              <Text style={[styles.modalCategoryText, { color: activeTabInfo.color }]}>{activeTabInfo.label}</Text>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Kelime veya Regex</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Örn: bahis, casino, B[0-9]{3}"
              placeholderTextColor={theme.textMuted}
              value={newKeyword}
              onChangeText={setNewKeyword}
            />

            <Text style={[styles.modalLabel, { color: theme.textMuted }]}>Eşleşme Hedefi</Text>
            <View style={styles.matchTargetRow}>
              {(['content', 'sender', 'both'] as const).map(target => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.matchTargetBtn,
                    { borderColor: theme.border, backgroundColor: theme.card },
                    newMatchTarget === target && { borderColor: activeTabInfo.color, backgroundColor: `${activeTabInfo.color}15` }
                  ]}
                  onPress={() => setNewMatchTarget(target)}
                >
                  <Text style={[
                    styles.matchTargetText,
                    { color: newMatchTarget === target ? activeTabInfo.color : theme.textMuted }
                  ]}>
                    {target === 'content' ? 'İçerik' : target === 'sender' ? 'Gönderici' : 'Her İkisi'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: activeTabInfo.color }]} onPress={handleAddRule}>
              <Text style={styles.modalSaveBtnText}>Kuralı Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: spacing.xs },

  tabBar: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md, height: 44 },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.full, borderWidth: 1, gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabBadge: {
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm, paddingBottom: 100 },
  ruleCard: {
    flexDirection: 'row', borderRadius: radii.md, alignItems: 'center',
    borderWidth: 1, overflow: 'hidden',
  },
  ruleAccent: { width: 4, alignSelf: 'stretch' },
  ruleInfo: { flex: 1, padding: spacing.md },
  ruleKeyword: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  ruleMetaRow: { flexDirection: 'row', gap: spacing.xs },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.sm },
  badgeText: { fontSize: 11, fontWeight: '600' },
  deleteButton: { padding: spacing.md },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl * 2, paddingHorizontal: spacing.lg },
  emptyIconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.xs },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm },
  modalCategoryText: { fontSize: 14, fontWeight: '600' },
  modalInput: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, fontSize: 16 },
  matchTargetRow: { flexDirection: 'row', gap: spacing.sm },
  matchTargetBtn: { flex: 1, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, alignItems: 'center' },
  matchTargetText: { fontSize: 13, fontWeight: '600' },
  modalSaveBtn: {
    marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.md, alignItems: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
