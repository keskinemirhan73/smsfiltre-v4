import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronDown, Megaphone, Receipt, Send, ShieldAlert, ShieldBan, ShieldCheck, X } from 'lucide-react-native';
import type { HistoryItem } from '../modules/FilterManager';
import { messageCategoryOption, type MessageCategory } from '../services/messageCategoryPolicy';
import { SecurityUtils } from '../utils/SecurityUtils';
import { ThreatCloudService } from '../services/ThreatCloudService';

interface SmsDetailModalProps {
  visible: boolean;
  item: HistoryItem | null;
  onClose: () => void;
  onCreateRule: (sender: string) => void;
  onMarkAsNotJunk?: (sender: string) => Promise<void>;
  onReportAsJunk?: (sender: string, preview: string) => Promise<void>;
  onCategorizeSender: (sender: string, category: MessageCategory) => Promise<void>;
}

const CATEGORIES = [
  { key: 'junk' as const, icon: ShieldBan },
  { key: 'allowed' as const, icon: ShieldCheck },
  { key: 'transaction' as const, icon: Receipt },
  { key: 'promotion' as const, icon: Megaphone },
];

export function SmsDetailModal({
  visible,
  item,
  onClose,
  onCreateRule,
  onMarkAsNotJunk,
  onReportAsJunk,
  onCategorizeSender,
}: SmsDetailModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>('junk');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [checkingUrl, setCheckingUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setSelectedCategory(item.status === 'blocked' ? 'junk' : item.status);
    setShowCategoryDropdown(false);
    setUrls(SecurityUtils.extractUrls(item.preview));
    setIsSaving(false);
  }, [item]);

  if (!item) return null;
  const selectedOption = messageCategoryOption(selectedCategory);
  const SelectedIcon = CATEGORIES.find(category => category.key === selectedCategory)?.icon ?? ShieldAlert;
  const canCreateSenderRule = item.source !== 'native' && !item.sender.includes('*');

  const handleCheckUrl = async (url: string) => {
    setCheckingUrl(url);
    try {
      const isDangerous = await ThreatCloudService.checkUrlSecurity(url);
      if (isDangerous) {
        Alert.alert('Tehlikeli Bağlantı', 'Bu bağlantı tehdit veritabanında işaretli. Açmamanızı öneririz.');
        return;
      }
      Alert.alert('Güvenlik Taraması', 'Bu bağlantı şu an tehdit olarak görünmüyor. Yine de dikkatli olun.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yine de Aç', onPress: () => Linking.openURL(url) },
      ]);
    } catch {
      Alert.alert('Kontrol Edilemedi', 'Bağlantı güvenliği şu anda doğrulanamadı.');
    } finally {
      setCheckingUrl(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconCircleButton}><X color="#3C3C43" size={20} /></TouchableOpacity>
          <Text style={styles.headerTitle}>FiltreAI</Text>
          <TouchableOpacity onPress={onClose} style={styles.iconCircleButton}><Check color="#007AFF" size={20} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Gönderici</Text>
          <View style={styles.infoCard}><Text style={styles.senderText}>{item.sender}</Text></View>

          <Text style={styles.sectionLabel}>Mesaj özeti</Text>
          <View style={styles.infoCard}><Text style={styles.messageText}>{item.preview}</Text></View>

          {urls.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Mesajdaki bağlantılar</Text>
              {urls.map(url => (
                <View key={url} style={styles.urlCard}>
                  <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
                  <TouchableOpacity style={styles.urlButton} onPress={() => handleCheckUrl(url)} disabled={checkingUrl === url}>
                    <Text style={styles.urlButtonText}>{checkingUrl === url ? 'Kontrol ediliyor…' : 'Kontrol Et'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionLabel}>Gönderen kategorisi</Text>
          <TouchableOpacity
            style={[styles.dropdownCard, !canCreateSenderRule && styles.disabledAction]}
            onPress={() => setShowCategoryDropdown(value => !value)}
            disabled={!canCreateSenderRule}
          >
            <View style={styles.row}>
              <SelectedIcon size={22} color={selectedOption.color} />
              <Text style={styles.dropdownText}>{selectedOption.label}</Text>
            </View>
            <ChevronDown size={20} color="#8E8E93" />
          </TouchableOpacity>

          {!canCreateSenderRule && (
            <View style={styles.maskedSenderNotice}>
              <Text style={styles.maskedSenderText}>Gizlilik nedeniyle bu kaydın göndereni maskeli. Çalışan bir kural için Raporlar ekranından gerçek gönderen adını veya numarasını girin.</Text>
            </View>
          )}

          {showCategoryDropdown && canCreateSenderRule && (
            <View style={styles.dropdownMenu}>
              {CATEGORIES.map(category => {
                const option = messageCategoryOption(category.key);
                const Icon = category.icon;
                return (
                  <TouchableOpacity
                    key={category.key}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedCategory(category.key);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Icon size={20} color={option.color} />
                    <View style={styles.dropdownCopy}>
                      <Text style={[styles.dropdownItemTitle, selectedCategory === category.key && { color: option.color }]}>{option.label}</Text>
                      <Text style={styles.dropdownItemDescription}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionLabel}>Hızlı eylemler</Text>
          <View style={styles.quickActions}>
            {onMarkAsNotJunk && (
              <TouchableOpacity style={[styles.quickButton, styles.safeButton, !canCreateSenderRule && styles.disabledAction]} disabled={!canCreateSenderRule || isSaving} onPress={async () => {
                setIsSaving(true);
                try {
                  await onMarkAsNotJunk(item.sender);
                  onClose();
                } catch {
                  Alert.alert('İşlem Tamamlanamadı', 'Gönderen kuralı kaydedilemedi. Lütfen yeniden deneyin.');
                } finally {
                  setIsSaving(false);
                }
              }}>
                <ShieldCheck size={20} color="#059669" />
                <Text style={styles.safeText}>İstenmeyen Değil (Güvenli Yap)</Text>
              </TouchableOpacity>
            )}
            {onReportAsJunk && (
              <TouchableOpacity style={[styles.quickButton, styles.junkButton, !canCreateSenderRule && styles.disabledAction]} disabled={!canCreateSenderRule || isSaving} onPress={async () => {
                setIsSaving(true);
                try {
                  await onReportAsJunk(item.sender, item.preview);
                  onClose();
                } catch {
                  Alert.alert('İşlem Tamamlanamadı', 'Rapor ve gönderen kuralı kaydedilemedi. Lütfen yeniden deneyin.');
                } finally {
                  setIsSaving(false);
                }
              }}>
                <ShieldAlert size={20} color="#DC2626" />
                <Text style={styles.junkText}>İstenmeyen Olarak Bildir</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={[styles.ruleCard, !canCreateSenderRule && styles.disabledAction]} disabled={!canCreateSenderRule} onPress={() => {
            onClose();
            onCreateRule(item.sender);
          }}>
            <ShieldBan size={22} color="#EF4444" />
            <View style={styles.ruleCopy}>
              <Text style={styles.ruleTitle}>Gelişmiş kural oluştur</Text>
              <Text style={styles.ruleDescription}>Gönderen veya içerik için özel bir filtre kuralı ekleyin.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitButton, !canCreateSenderRule && styles.disabledAction]} disabled={!canCreateSenderRule || isSaving} onPress={async () => {
            setIsSaving(true);
            try {
              await onCategorizeSender(item.sender, selectedCategory);
              onClose();
            } catch {
              Alert.alert('İşlem Tamamlanamadı', 'Kategori kaydedilemedi. Lütfen yeniden deneyin.');
            } finally {
              setIsSaving(false);
            }
          }}>
            <Send size={20} color="#FFF" />
            <Text style={styles.submitText}>{isSaving ? 'Kaydediliyor…' : 'Kategoriyi Kaydet'}</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Bu seçim gönderenin bundan sonraki uygun SMS/MMS mesajları için cihaz içi kural oluşturur; eski mesajı taşımaz. iOS bilinen veya yanıt verdiğiniz gönderenlerde filtreyi çağırmayabilir.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  headerBar: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircleButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8E8E9320', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 48 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6C6C70', marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  senderText: { fontSize: 17, fontWeight: '700', color: '#000' },
  messageText: { fontSize: 15, lineHeight: 21, color: '#1C1C1E' },
  urlCard: { marginBottom: 8, backgroundColor: '#FFF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  urlText: { flex: 1, fontSize: 13, color: '#007AFF' },
  urlButton: { backgroundColor: '#007AFF15', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  urlButtonText: { color: '#007AFF', fontSize: 12, fontWeight: '700' },
  dropdownCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  dropdownMenu: { marginTop: 8, borderRadius: 14, backgroundColor: '#FFF', overflow: 'hidden' },
  dropdownItem: { padding: 14, flexDirection: 'row', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D1D1D6' },
  dropdownCopy: { flex: 1 },
  dropdownItemTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  dropdownItemDescription: { marginTop: 2, fontSize: 12, color: '#6C6C70' },
  maskedSenderNotice: { marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#FFF3CD' },
  maskedSenderText: { color: '#7C5A00', fontSize: 12, lineHeight: 17 },
  disabledAction: { opacity: 0.45 },
  quickActions: { gap: 10 },
  quickButton: { minHeight: 48, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  safeButton: { backgroundColor: '#D1FAE5' },
  junkButton: { backgroundColor: '#FEE2E2' },
  safeText: { color: '#047857', fontWeight: '700' },
  junkText: { color: '#B91C1C', fontWeight: '700' },
  ruleCard: { marginTop: 14, backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleCopy: { flex: 1 },
  ruleTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  ruleDescription: { fontSize: 12, color: '#6C6C70', marginTop: 3 },
  submitButton: { marginTop: 14, minHeight: 50, borderRadius: 14, backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  disclaimer: { marginTop: 12, fontSize: 12, lineHeight: 17, color: '#6C6C70', textAlign: 'center' },
});
