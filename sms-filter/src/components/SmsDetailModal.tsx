import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking, Alert, TextInput, Platform } from 'react-native';
import { ShieldAlert, ShieldCheck, X, ShieldBan, Send, Check, ChevronDown, HelpCircle, ArrowRight } from 'lucide-react-native';
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
  onMarkAsNotJunk?: (sender: string) => void;
  onReportAsJunk?: (sender: string, preview: string) => void;
  onReport: (keyword: string, category: string, notes: string) => void;
}

const CATEGORIES = [
  { key: 'İstenmeyen', label: 'İstenmeyen', icon: ShieldBan, color: '#EF4444' },
  { key: 'İzin Verilen', label: 'İzin Verilen', icon: ShieldCheck, color: '#10B981' },
  { key: 'İşlem', label: 'İşlem', icon: Send, color: '#3B82F6' },
  { key: 'Promosyon', label: 'Promosyon', icon: ShieldAlert, color: '#F59E0B' },
];

export function SmsDetailModal({ visible, item, onClose, onCreateRule, onMarkAsNotJunk, onReportAsJunk, onReport }: SmsDetailModalProps) {
  const theme = useAppTheme();
  const [urls, setUrls] = useState<string[]>([]);
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('İstenmeyen');
  const [notes, setNotes] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (item && item.preview) {
      setUrls(SecurityUtils.extractUrls(item.preview));
      setSelectedCategory('İstenmeyen');
      setNotes('');
      setShowCategoryDropdown(false);
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

  const getStatusText = () => {
    switch (item.status) {
      case 'blocked': return '🛡️ Engellendi (Spam)';
      case 'transaction': return '💳 Güvenli İşlem';
      case 'promotion': return '📢 Tanıtım Mesajı';
      default: return '❓ Sonuç Yok / Bilinmeyen';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: '#F2F2F7' }]}>
        
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconCircleBtn}>
            <X color="#3C3C43" size={20} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>FiltreAI</Text>

          <TouchableOpacity onPress={onClose} style={[styles.iconCircleBtn, { backgroundColor: '#8E8E9320' }]}>
            <Check color="#007AFF" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Gönderici Card */}
          <Text style={styles.sectionLabel}>Gönderici</Text>
          <View style={styles.infoCard}>
            <Text style={styles.flagIcon}>🇹🇷</Text>
            <Text style={styles.senderText}>{item.sender}</Text>
          </View>

          {/* Mesaj Card */}
          <Text style={styles.sectionLabel}>Mesaj</Text>
          <View style={styles.infoCard}>
            <Text style={styles.messageText}>{item.preview}</Text>
          </View>

          {/* Sizin Sınıflandırmanız Card */}
          <Text style={styles.sectionLabel}>Sizin Sınıflandırmanız</Text>
          <TouchableOpacity
            style={styles.dropdownCard}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ShieldBan size={22} color="#EF4444" />
              <Text style={styles.dropdownCardText}>{selectedCategory}</Text>
            </View>
            <ChevronDown size={20} color="#8E8E93" />
          </TouchableOpacity>

          {/* Category Dropdown Selector */}
          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setSelectedCategory(cat.key);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <CatIcon size={20} color={cat.color} />
                    <Text style={[styles.dropdownMenuItemText, { color: cat.key === selectedCategory ? '#007AFF' : '#000000' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Uygulamanın Şu Anki Kararı */}
          <Text style={styles.sectionLabel}>Uygulamanın Şu Anki Kararı</Text>
          <View style={styles.infoCard}>
            <HelpCircle size={22} color="#8E8E93" />
            <Text style={styles.decisionText}>{getStatusText()}</Text>
          </View>

          {/* URL Section */}
          {urls.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Mesajdaki Bağlantılar (URL)</Text>
              {urls.map((url, index) => (
                <View key={index} style={styles.urlCard}>
                  <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
                  <TouchableOpacity
                    style={styles.urlCheckBtn}
                    onPress={() => handleCheckUrl(url)}
                    disabled={checkingUrl === url}
                  >
                    <Text style={styles.urlCheckBtnText}>
                      {checkingUrl === url ? '...' : 'Kontrol Et'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Eylemler Section */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Eylemler</Text>

          <View style={styles.quickActions}>
            {onMarkAsNotJunk && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.safeActionButton]}
                onPress={() => {
                  onClose();
                  onMarkAsNotJunk(item.sender);
                }}
                activeOpacity={0.8}
              >
                <ShieldCheck size={20} color="#059669" />
                <Text style={[styles.quickActionText, { color: '#047857' }]}>
                  İstenmeyen Değil (Güvenli Yap)
                </Text>
              </TouchableOpacity>
            )}

            {onReportAsJunk && (
              <TouchableOpacity
                style={[styles.quickActionButton, styles.junkActionButton]}
                onPress={() => {
                  onClose();
                  onReportAsJunk(item.sender, item.preview);
                }}
                activeOpacity={0.8}
              >
                <ShieldAlert size={20} color="#DC2626" />
                <Text style={[styles.quickActionText, { color: '#B91C1C' }]}>
                  İstenmeyen Olarak Bildir
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Gönderici İçin Bir Kural Oluştur Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              onClose();
              onCreateRule(item.sender);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.actionCardHeader}>
              <ShieldBan size={22} color="#EF4444" />
              <Text style={styles.actionCardTitle}>Gönderici İçin Bir Kural Oluştur</Text>
            </View>
            <Text style={styles.actionCardSubtext}>
              Bu göndericiden ileride gelecek tüm mesajları filtrelemek için bir kural oluşturun. Mesajlar istenmeyen olarak, sessiz ve bildirimsiz şekilde gelecek.
            </Text>
          </TouchableOpacity>

          {/* Ek Notlar Input */}
          <View style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              placeholder="Ek notlar"
              placeholderTextColor="#8E8E93"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Rapor Gönder Button */}
          <TouchableOpacity
            style={styles.submitReportBtn}
            onPress={() => {
              onClose();
              onReport(item.preview, selectedCategory, notes);
            }}
            activeOpacity={0.85}
          >
            <Send size={22} color="#007AFF" />
            <Text style={styles.submitReportBtnText}>Rapor Gönder</Text>
          </TouchableOpacity>

          <Text style={styles.reportDisclaimer}>
            Raporlanan mesajlar manuel olarak incelenir ve Akıllı Filtre’nin gelecek sürümlerini eğitmek için kullanılabilir. Lütfen hassas bilgi içermediklerinden emin olun.
          </Text>

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8E8E9330',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagIcon: {
    fontSize: 22,
  },
  senderText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1C1C1E',
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownCardText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  decisionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  urlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 15,
    color: '#007AFF',
    marginRight: 10,
  },
  urlCheckBtn: {
    backgroundColor: '#007AFF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urlCheckBtnText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  quickActions: {
    gap: 10,
    marginBottom: 12,
  },
  quickActionButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  safeActionButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  junkActionButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  actionCardSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },
  notesInput: {
    fontSize: 16,
    color: '#000000',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitReportBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  submitReportBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
  },
  reportDisclaimer: {
    fontSize: 12,
    lineHeight: 16,
    color: '#8E8E93',
    marginTop: 10,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
});
