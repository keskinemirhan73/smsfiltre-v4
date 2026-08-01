import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, Alert, TextInput } from 'react-native';
import { ShieldAlert, ShieldCheck, X, ShieldBan, Flag, Send, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme, spacing, radii } from '../theme';
import { HistoryItem } from '../modules/FilterManager';
import { SecurityUtils } from '../utils/SecurityUtils';
import { ThreatCloudService } from '../services/ThreatCloudService';

interface SmsDetailModalProps {
  visible: boolean;
  item: HistoryItem | null;
  onClose: () => void;
  onCreateRule: (sender: string) => void;
  onReport: (keyword: string, category: string, notes: string) => void;
}

export function SmsDetailModal({ visible, item, onClose, onCreateRule, onReport }: SmsDetailModalProps) {
  const theme = useAppTheme();
  const [urls, setUrls] = useState<string[]>([]);
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('İstenmeyen');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (item && item.preview) {
      setUrls(SecurityUtils.extractUrls(item.preview));
      setSelectedCategory('İstenmeyen'); // default
      setNotes('');
    } else {
      setUrls([]);
    }
  }, [item]);

  if (!item) return null;

  const handleCheckUrl = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckingUrl(url);
    const isDangerous = await ThreatCloudService.checkUrlSecurity(url);
    setCheckingUrl(null);

    if (isDangerous) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Tehlikeli Bağlantı!",
        "Bu URL (link) veritabanımızda dolandırıcılık / oltalama (phishing) olarak işaretlenmiş. Kesinlikle açmamanızı öneririz.",
        [{ text: "Anladım", style: "cancel" }]
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Güvenlik Taraması",
        "Bu bağlantı şu anki veritabanımızda tehdit olarak görünmüyor. Yine de bilmediğiniz linkleri açarken dikkatli olun.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Yine de Aç", onPress: () => Linking.openURL(url) }
        ]
      );
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'blocked': return theme.danger;
      case 'transaction': return theme.primary;
      case 'promotion': return '#F59E0B';
      default: return theme.secondary;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case 'blocked': return 'İstenmeyen (Spam/Dolandırıcılık)';
      case 'transaction': return 'İşlem (Banka/Kod)';
      case 'promotion': return 'Promosyon (Reklam/Kampanya)';
      default: return 'İzin Verilen (Güvenli)';
    }
  };

  const StatusIcon = item.status === 'blocked' ? ShieldBan : ShieldCheck;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>FiltreAI Detay</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={theme.textMuted} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Sender and Message Body */}
            <View style={[styles.card, { backgroundColor: theme.background }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Gönderici</Text>
              <Text style={[styles.value, { color: theme.text }]}>{item.sender}</Text>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <Text style={[styles.label, { color: theme.textMuted }]}>Mesaj İçeriği</Text>
              <Text style={[styles.messageBody, { color: theme.text }]}>{item.preview}</Text>
            </View>

            {/* App Decision */}
            <View style={[styles.card, { backgroundColor: theme.background }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Uygulamanın Kararı</Text>
              <View style={styles.decisionRow}>
                <StatusIcon color={getStatusColor()} size={20} />
                <Text style={[styles.decisionText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              {item.category && (
                <Text style={[styles.categoryInfo, { color: theme.textMuted }]}>
                  Nedeni: {item.category}
                </Text>
              )}
            </View>

            {/* URL Section */}
            {urls.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.background }]}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Mesajdaki Bağlantılar (URL)</Text>
                {urls.map((url, index) => (
                  <View key={index} style={styles.urlRow}>
                    <Text style={[styles.urlText, { color: theme.primary }]} numberOfLines={1}>
                      {url}
                    </Text>
                    <TouchableOpacity
                      style={[styles.urlActionBtn, { backgroundColor: theme.primary + '20' }]}
                      onPress={() => handleCheckUrl(url)}
                      disabled={checkingUrl === url}
                    >
                      {checkingUrl === url ? (
                        <Text style={[styles.urlActionText, { color: theme.primary }]}>...</Text>
                      ) : (
                        <>
                          <ShieldAlert color={theme.primary} size={16} />
                          <Text style={[styles.urlActionText, { color: theme.primary }]}>Kontrol Et</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Actions Section */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => {
                  onClose();
                  onCreateRule(item.sender);
                }}
              >
                <ShieldBan color={theme.text} size={20} />
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Gönderici İçin Kural Oluştur</Text>
              </TouchableOpacity>
            </View>

            {/* Detailed Reporting Section (Sizin Sınıflandırmanız) */}
            <View style={[styles.card, { backgroundColor: theme.background, marginTop: spacing.md }]}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Sizin Sınıflandırmanız</Text>

              <View style={styles.categoryChips}>
                {['İstenmeyen', 'İzin Verilen', 'İşlem', 'Promosyon'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selectedCategory === cat ? theme.primary + '20' : theme.surface,
                        borderColor: selectedCategory === cat ? theme.primary : theme.border
                      }
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, { color: selectedCategory === cat ? theme.primary : theme.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.textMuted, marginTop: spacing.md }]}>Ek Notlar (İsteğe Bağlı)</Text>
              <TextInput
                style={[styles.notesInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Raporunuz için ek not yazabilirsiniz..."
                placeholderTextColor={theme.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.submitReportBtn, { backgroundColor: theme.primary, marginTop: spacing.md }]}
                onPress={() => {
                  onClose();
                  onReport(item.preview, selectedCategory, notes);
                }}
              >
                <Send color="#fff" size={20} />
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Rapor Gönder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    minHeight: '50%',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 0,
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  decisionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categoryInfo: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  urlText: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
  },
  urlActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  urlActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  submitReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  }
});
