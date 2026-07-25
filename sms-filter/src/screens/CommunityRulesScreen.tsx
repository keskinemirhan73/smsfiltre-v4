import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Download, CheckCircle, ShieldCheck, CloudDownload } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager } from '../modules/FilterManager';
import { useToast } from '../components/Toast';
import * as Haptics from 'expo-haptics';

export default function CommunityRulesScreen() {
  const theme = useAppTheme();
  const [rules, setRules] = useState<any[]>([]);
  const [localRules, setLocalRules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const API_URL = 'https://smsfiltre-v4.onrender.com/api/rules/community';

  useEffect(() => {
    fetchRules();
    loadLocalRules();
  }, []);

  const loadLocalRules = async () => {
    const settings = await FilterManager.loadSettings();
    setLocalRules(settings.customFraudKeywords || []);
  };

  const fetchRules = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setRules(data || []);
    } catch (e) {
      showToast('Kurallar alınamadı.', { type: 'error' });
    }
    setIsLoading(false);
  };

  const addRuleToLocal = async (keyword: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const settings = await FilterManager.loadSettings();
    const current = settings.customFraudKeywords || [];
    
    if (!current.includes(keyword)) {
      current.push(keyword);
      await FilterManager.saveSettings({ ...settings, customFraudKeywords: current });
      setLocalRules(current);
      showToast(`"${keyword}" koruma listesine eklendi!`, { type: 'success' });
    }
  };

  const addAllRules = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const settings = await FilterManager.loadSettings();
    let current = [...(settings.customFraudKeywords || [])];
    let added = 0;
    
    rules.forEach(r => {
      if (!current.includes(r.keyword)) {
        current.push(r.keyword);
        added++;
      }
    });
    
    if (added > 0) {
      await FilterManager.saveSettings({ ...settings, customFraudKeywords: current });
      setLocalRules(current);
      showToast(`${added} yeni kural cihazınıza indirildi!`, { type: 'success' });
    } else {
      showToast(`Tüm kurallar zaten cihazınızda güncel.`, { type: 'info' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <CloudDownload size={32} color={theme.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Topluluk Kuralları</Text>
          <Text style={[styles.heroDesc, { color: theme.textMuted }]}>
            Diğer kullanıcıların şikayet edip, yapay zeka tarafından onaylanan spam kelimelerini tek tıkla cihazınıza indirebilirsiniz. İnternetiniz olmasa bile koruma sağlar.
          </Text>
          
          <TouchableOpacity 
            style={[styles.downloadAllBtn, { backgroundColor: theme.primary }]}
            onPress={addAllRules}
          >
            <Download size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.downloadAllTxt}>Tümünü İndir</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Onaylı Kurallar ({rules.length})</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : rules.length === 0 ? (
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 20 }}>Henüz onaylanmış kural yok.</Text>
        ) : (
          <View style={styles.ruleList}>
            {rules.map((rule, idx) => {
              const isAdded = localRules.includes(rule.keyword);
              return (
                <View key={idx} style={[styles.ruleItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ruleKeyword, { color: theme.text }]}>{rule.keyword}</Text>
                    <Text style={[styles.ruleType, { color: theme.textMuted }]}>
                      {rule.type === 'number' ? 'Numara Engeli' : 'Kelime Engeli'}
                    </Text>
                  </View>
                  
                  {isAdded ? (
                    <View style={[styles.addedBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                      <CheckCircle size={16} color={theme.secondary} />
                      <Text style={[styles.addedTxt, { color: theme.secondary }]}>Eklendi</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.addBtn, { backgroundColor: theme.primary }]}
                      onPress={() => addRuleToLocal(rule.keyword)}
                    >
                      <Text style={styles.addBtnTxt}>Ekle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  heroCard: { padding: spacing.xl, borderRadius: radii.xl, borderWidth: 1, alignItems: 'center', marginBottom: spacing.xl },
  iconWrapper: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: spacing.sm },
  heroDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  downloadAllBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: radii.full },
  downloadAllTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  ruleList: { gap: spacing.sm },
  ruleItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.lg, borderWidth: 1 },
  ruleKeyword: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  ruleType: { fontSize: 12 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.md, gap: 4 },
  addedTxt: { fontWeight: '700', fontSize: 13 },
});
