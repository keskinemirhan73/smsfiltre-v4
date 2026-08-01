import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, TextInput, Alert, DeviceEventEmitter, ActivityIndicator, Modal, FlatList, Linking, Platform } from 'react-native';
import { ShieldAlert, Brain, Clock, ShieldCheck, Database, Zap, Network, ListFilter, Globe, AlertTriangle, Info, ChevronRight, ChevronLeft, Palette, Languages, Plus, Trash2, CheckCircle2, Server, Key, Phone, Activity, X, Users, Search, FlaskConical } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, AppSettings } from '../modules/FilterManager';
import { ThreatCloudService } from '../services/ThreatCloudService';
import { getT } from '../i18n';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useScrollToTop, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useToast } from '../components/Toast';
import * as Contacts from 'expo-contacts';
import * as LocalAuthentication from 'expo-local-authentication';
import RulesScreen from './RulesScreen';
import {
  hasSmsDetectionPermission,
  requestSmsDetectionPermission,
} from '../services/SmsPermissionService';

let lastAuthTime = 0;
const AUTH_GRACE_PERIOD = 3 * 60 * 1000; // 3 dakika

const SettingsContext = createContext<any>(null);
const useSettings = () => useContext(SettingsContext);

const Stack = createNativeStackNavigator();

const TopHeader = ({ title, navigation }: { title: string, navigation: any }) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerRow, { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl) }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
        <ChevronLeft color={theme.text} size={28} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text, flex: 1 }]}>{title}</Text>
    </View>
  );
};

function WhitelistScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, updateSetting } = useSettings();
  const isEn = settings.language === 'en';
  const { showToast } = useToast();
  const [whitelistNumber, setWhitelistNumber] = useState('');

  // Contacts State
  const [isContactModalVisible, setContactModalVisible] = useState(false);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isContactsLoading, setIsContactsLoading] = useState(false);

  const addNumber = () => {
    if (!whitelistNumber.trim()) return;
    const wl = settings.whitelist || [];
    if (!wl.includes(whitelistNumber.trim())) {
      updateSetting('whitelist', [...wl, whitelistNumber.trim()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`${whitelistNumber.trim()} beyaz listeye eklendi.`, { type: 'success' });
    }
    setWhitelistNumber('');
  };

  const removeNumber = (num: string) => {
    const wl = settings.whitelist || [];
    updateSetting('whitelist', wl.filter((n: string) => n !== num));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(`${num} silindi.`, { type: 'info' });
  };

  const openContactPicker = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      setContactModalVisible(true);
      setIsContactsLoading(true);
      try {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });
        const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
        setContacts(validContacts);
        setFilteredContacts(validContacts);
      } catch(e) {
        console.log(e);
        showToast("Rehber yüklenemedi", {type: 'error'});
      } finally {
        setIsContactsLoading(false);
      }
    } else {
      Alert.alert('İzin Reddedildi', 'Rehberden numara seçebilmek için kişi erişim izni vermelisiniz.');
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if(text.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const q = text.toLowerCase();
      setFilteredContacts(contacts.filter(c => (c.name && c.name.toLowerCase().includes(q))));
    }
  };

  const selectContact = (contact: Contacts.Contact) => {
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      let num = contact.phoneNumbers[0].number || '';
      num = num.replace(/\s+/g, '');
      setWhitelistNumber(num);
      setContactModalVisible(false);
      setSearchQuery('');
    }
  };

  const renderContactItem = ({ item }: { item: Contacts.Contact }) => (
    <TouchableOpacity
      style={[styles.contactItem, { borderBottomColor: theme.border }]}
      onPress={() => selectContact(item)}
    >
      <View style={[styles.contactAvatar, { backgroundColor: theme.primary + '20' }]}>
        <Text style={{color: theme.primary, fontWeight: 'bold'}}>
          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.contactPhone, { color: theme.textMuted }]}>
          {item.phoneNumbers ? item.phoneNumbers[0].number : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{flex:1, backgroundColor: theme.background}}>
      <ScrollView style={[styles.container]} contentContainerStyle={{ paddingBottom: 80 }}>
        <TopHeader title={isEn ? "Whitelist (VIP)" : "Beyaz Liste (VIP)"} navigation={navigation} />
        <View style={styles.section}>
          <SectionDesc text={isEn ? "Numbers or institutions you add here will BYPASS all security filters. You can add your family members or banks." : "Buraya eklediğiniz numaralar veya kurum adları HİÇBİR güvenlik filtresine takılmaz. Aile üyelerinizi veya bankalarınızı ekleyebilirsiniz."} />

          <View style={[styles.premiumInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Phone size={20} color={theme.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={[styles.premiumInput, { color: theme.text }]}
              placeholder={isEn ? "Number or Name (e.g. +90555... or BANK)" : "Numara veya İsim (Örn: +90555... veya GARANTI)"}
              placeholderTextColor={theme.textMuted}
              value={whitelistNumber}
              onChangeText={setWhitelistNumber}
            />
            <TouchableOpacity
              style={[styles.premiumAddBtn, { backgroundColor: theme.primary, opacity: whitelistNumber.trim() ? 1 : 0.6 }]}
              onPress={addNumber}
              disabled={!whitelistNumber.trim()}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.contactPickerBtn, { backgroundColor: theme.secondary + '20', borderColor: theme.secondary + '40' }]}
            onPress={openContactPicker}
          >
            <Users size={20} color={theme.secondary} />
            <Text style={[styles.contactPickerBtnText, { color: theme.secondary }]}>{isEn ? "Select from Contacts" : "Rehberden Kişi Seç"}</Text>
          </TouchableOpacity>

          <View style={{flexDirection: 'column', marginTop: spacing.xl, gap: spacing.sm}}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: spacing.xs }]}>{isEn ? "Safe Numbers and Institutions" : "Güvenli Numara ve Kurumlar"}</Text>

            {(!settings.whitelist || settings.whitelist.length === 0) ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ShieldCheck size={40} color={theme.border} style={{ marginBottom: spacing.md }} />
                <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>{isEn ? "There are no numbers in your whitelist." : "Beyaz listenizde hiç numara yok."}</Text>
              </View>
            ) : (
              (settings.whitelist || []).map((num: string) => (
                <View key={`wl-${num}`} style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: spacing.sm }]}>
                  <View style={[styles.listIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <ShieldCheck size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.listText, { color: theme.text }]}>{num}</Text>
                  <TouchableOpacity onPress={() => removeNumber(num)} style={{ padding: 8 }}>
                    <Trash2 size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Contact Picker Modal */}
      <Modal
        visible={isContactModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md}}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{isEn ? "Select Contact" : "Kişi Seç"}</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={{paddingHorizontal: spacing.lg, paddingBottom: spacing.md}}>
              <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Search size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder={isEn ? "Search contacts..." : "Kişilerde ara..."}
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>
            </View>
          </View>

          {isContactsLoading ? (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={{color: theme.textMuted, marginTop: 10}}>{isEn ? "Loading contacts..." : "Rehber yükleniyor..."}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item: any) => item.id || Math.random().toString()}
              renderItem={renderContactItem}
              initialNumToRender={20}
              ListEmptyComponent={
                <Text style={{color: theme.textMuted, textAlign: 'center', marginTop: 40}}>
                  Kişi bulunamadı.
                </Text>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function ScheduleScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();
  const isEn = settings.language === 'en';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title={isEn ? "Schedule" : "Zaman Programı"} navigation={navigation} />
      <View style={styles.section}>
        <SettingRow
          icon={Clock}
          iconColor={theme.primary}
          title={isEn ? "Enable" : "Aktif Et"}
          value={settings.filterScheduleEnabled}
          onToggle={() => toggleSetting('filterScheduleEnabled')}
        />
        <SectionDesc text={isEn ? "When schedule is active, SMS protection ONLY works between the hours you specify. (e.g., if you only want protection while sleeping)" : "Zaman programı aktifken, SMS koruması SADECE belirlediğiniz saatler arasında çalışır. (Örn: Sadece gece uyurken rahatsız edilmek istemiyorsanız)"} />

        {settings.filterScheduleEnabled && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{isEn ? "Protection Hours" : "Koruma Saatleri"}</Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.sm }}>
              <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>{isEn ? "START" : "BAŞLANGIÇ"}</Text>
                <TextInput
                  style={{ fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center', width: '100%' }}
                  value={settings.scheduleStart}
                  onChangeText={(t) => updateSetting('scheduleStart', t)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>

              <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>{isEn ? "END" : "BİTİŞ"}</Text>
                <TextInput
                  style={{ fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center', width: '100%' }}
                  value={settings.scheduleEnd}
                  onChangeText={(t) => updateSetting('scheduleEnd', t)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 12, textAlign: 'center' }}>{isEn ? "Enter hours in 24-hour format (e.g. 22:00)" : "Saatleri 24-saat formatında girin (Örn: 22:00)"}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function MappingScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, updateMapping } = useSettings();
  const isEn = settings.language === 'en';

  const MappingBlock = ({ id, title, desc, icon: Icon, color }: any) => (
    <View style={{ marginBottom: spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${color}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Icon color={color} size={18} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>{title}</Text>
      </View>
      <SectionDesc text={desc} />

      <View style={{ marginTop: spacing.md, backgroundColor: theme.card, borderRadius: radii.lg, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
        {['junk', 'transaction', 'promotion', 'allowed'].map((cat, index) => {
          const isSelected = settings.categoryMapping[id as keyof typeof settings.categoryMapping] === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: spacing.md,
                borderBottomWidth: index < 3 ? 1 : 0, borderBottomColor: theme.border,
                backgroundColor: isSelected ? `${theme.primary}08` : 'transparent'
              }}
              onPress={() => updateMapping(id as any, cat)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: isSelected ? '700' : '500', color: isSelected ? theme.primary : theme.text }}>
                  {cat === 'junk' ? (isEn ? 'Junk' : 'İstenmeyen (Junk)') : cat === 'transaction' ? (isEn ? 'Transactions' : 'İşlemler (Transactions)') : cat === 'promotion' ? (isEn ? 'Promotions' : 'Tanıtımlar (Promotions)') : (isEn ? 'Inbox (Allow)' : 'Gelen Kutusu (İzin Ver)')}
                </Text>
              </View>
              {isSelected && <CheckCircle2 size={20} color={theme.primary} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title={isEn ? "Category Mapping" : "Kategori Eşleme"} navigation={navigation} />
      <View style={styles.section}>
        <SectionDesc text={isEn ? "Determine which folders the messages detected by the SMS Filter app will be sent to in the Apple Messages app." : "SMS Filtresi uygulamasının tespit ettiği mesajların, Apple Mesajlar uygulamasındaki hangi klasörlere gönderileceğini belirleyin."} />
        <View style={{height: 24}} />
        <MappingBlock id="spam" title={isEn ? "Spam & Fraud" : "Spam ve Dolandırıcılık"} desc={isEn ? "Dangerous links, illegal betting and fraud messages." : "Tehlikeli linkler, yasa dışı bahis ve dolandırıcılık mesajları."} icon={ShieldAlert} color={theme.danger} />
        <MappingBlock id="promotion" title={isEn ? "Promotion & Ads" : "Tanıtım ve Reklam"} desc={isEn ? "Discount, campaign and newsletter messages of brands (e.g. B001)." : "Markaların indirim, kampanya ve bülten mesajları (Örn: B001)."} icon={Zap} color="#F59E0B" />
        <MappingBlock id="transaction" title={isEn ? "Transaction & Info" : "İşlem ve Bilgi"} desc={isEn ? "Bank passwords, cargo tracking codes and verification messages." : "Banka şifreleri, kargo takip kodları ve doğrulama mesajları."} icon={Database} color="#3B82F6" />
      </View>
    </ScrollView>
  );
}

function FraudScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();
  const isEn = settings.language === 'en';
  const { showToast } = useToast();
  const [keyword, setKeyword] = useState('');

  const addKeyword = () => {
    if (!keyword.trim()) return;
    const kws = settings.customFraudKeywords || [];
    if (!kws.includes(keyword.trim())) {
      updateSetting('customFraudKeywords', [...kws, keyword.trim()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`'${keyword.trim()}' filtresi eklendi.`, { type: 'success' });
    }
    setKeyword('');
  };
  const removeKeyword = (kw: string) => {
    const kws = settings.customFraudKeywords || [];
    updateSetting('customFraudKeywords', kws.filter((k: string) => k !== kw));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title={isEn ? "Fraud Filter" : "Dolandırıcılık Filtresi"} navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={ShieldAlert} iconColor={theme.primary} title={isEn ? "Enable" : "Aktif Et"} value={settings.fraudFilter} onToggle={() => toggleSetting('fraudFilter')} />
        <SectionDesc text={isEn ? "This feature is part of the Spam and Threat Database." : "Bu özellik Spam ve Tehdit Veritabanı'nın bir parçasıdır."} />

        <View style={{height: spacing.xl}}/>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{isEn ? "Sensitive Keyword Hunter" : "Hassas Kelime Avcısı"}</Text>
        <SectionDesc text={isEn ? "Messages containing any of the following words are considered dangerous and are instantly filtered." : "Aşağıdaki kelimelerden herhangi birini içeren mesajlar tehlikeli kabul edilir ve anında filtrelenir."} />

        <View style={[styles.premiumInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: spacing.md }]}>
          <Key size={20} color={theme.textMuted} style={{ marginLeft: 12 }} />
          <TextInput
            style={[styles.premiumInput, { color: theme.text }]}
            placeholder={isEn ? "New keyword (e.g., Password, Bank)" : "Yeni kelime (Örn: Şifre, Banka)"}
            placeholderTextColor={theme.textMuted}
            value={keyword}
            onChangeText={setKeyword}
          />
          <TouchableOpacity
            style={[styles.premiumAddBtn, { backgroundColor: theme.primary, opacity: keyword.trim() ? 1 : 0.6 }]}
            onPress={addKeyword}
            disabled={!keyword.trim()}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xl, gap: spacing.sm}}>
          {(settings.customFraudKeywords || []).length === 0 ? (
             <Text style={{ color: theme.textMuted, fontSize: 14 }}>{isEn ? "No custom fraud keywords added." : "Özel dolandırıcılık kelimesi eklenmemiş."}</Text>
          ) : (
            <View style={{ flexDirection: 'column', width: '100%', gap: spacing.sm }}>
              {(settings.customFraudKeywords || []).map((kw: string) => (
                <View key={`kw-${kw}`} style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 0 }]}>
                  <View style={[styles.listIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <Key size={18} color={theme.danger} />
                  </View>
                  <Text style={[styles.listText, { color: theme.danger }]}>{kw}</Text>
                  <TouchableOpacity onPress={() => removeKeyword(kw)} style={{ padding: 8 }}>
                    <Trash2 size={20} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function DatabaseScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting } = useSettings();
  const isEn = settings.language === 'en';
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(isEn ? 'Loading...' : 'Yükleniyor...');

  useEffect(() => {
    ThreatCloudService.getLastSyncDate().then(setLastSync);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await ThreatCloudService.syncDatabase();
    setIsSyncing(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Veritabanı buluttan başarıyla güncellendi!', { type: 'success' });
      ThreatCloudService.getLastSyncDate().then(setLastSync);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Bulut sunucusuna bağlanılamadı.', { type: 'error' });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title={isEn ? "Database Filter" : "Veritabanı Filtresi"} navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Database} iconColor={theme.primary} title={isEn ? "Enable" : "Aktif Et"} value={settings.databaseFilter} onToggle={() => toggleSetting('databaseFilter')} />
        <SectionDesc text={isEn ? "Activates cloud-based threat database protection. The system automatically downloads the most up-to-date threats in the background." : "Bulut tabanlı tehdit veritabanı korumasını aktif eder. Sistem arka planda en güncel tehditleri otomatik olarak indirir."} />
        <View style={{height: spacing.xl}}/>
        <View style={[styles.dbCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.dbHeader}>
            <View style={[styles.dbIconWrapper, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <Server color={theme.primary} size={28} />
            </View>
            <View style={styles.dbInfo}>
              <Text style={[styles.dbTitle, { color: theme.text }]}>{isEn ? "Cloud Sync" : "Bulut Eşitlemesi"}</Text>
              <Text style={[styles.dbSubtitle, { color: theme.textMuted }]}>
                {isEn ? "Last Sync:" : "Son Güncelleme:"} {lastSync}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.dbSyncBtn, { backgroundColor: isSyncing ? theme.border : theme.primary }]}
            onPress={handleSync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator color={theme.textMuted} size="small" />
            ) : (
              <Globe color="#fff" size={20} />
            )}
            <Text style={[styles.dbSyncBtnText, { color: isSyncing ? theme.textMuted : '#fff' }]}>
              {isSyncing ? (isEn ? "Syncing..." : "Eşitleniyor...") : (isEn ? "Sync Now" : "Şimdi Eşitle")}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{height: spacing.xl}}/>
        <SettingRow icon={Activity} iconColor={theme.primary} title={isEn ? "Auto Background Sync" : "Otomatik Arka Plan Güncellemesi"} value={settings.autoSyncEnabled !== false} onToggle={() => toggleSetting('autoSyncEnabled')} />
        <SectionDesc text={isEn ? "Downloads the newest threat data from the cloud in the background twice a day even when the app is closed. Internet and battery consumption are almost negligible." : "Uygulama kapalıyken bile günde 2 kez buluttan en yeni tehdit verilerini arka planda cihazınıza indirir. İnternet ve şarj tüketimi yok denecek kadar azdır."} />
      </View>
    </ScrollView>
  );
}

function ProactiveScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();
  const isEn = settings.language === 'en';

  const aiLevels = [
    { val: 0.9, label: isEn ? "Low" : "Düşük", desc: isEn ? "Blocks only when absolutely sure." : "Sadece kesinlikle emin olduğunda engeller.", color: '#10B981' },
    { val: 0.8, label: isEn ? "Medium" : "Orta", desc: isEn ? "Provides balanced protection (Recommended)." : "Dengeli koruma sağlar (Önerilen).", color: theme.primary },
    { val: 0.6, label: isEn ? "High" : "Yüksek", desc: isEn ? "Blocks every message it finds suspicious." : "Şüpheli bulduğu her mesajı engeller.", color: theme.danger }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title={isEn ? "Proactive Filter" : "Proaktif Filtre"} navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Activity} iconColor={theme.primary} title={isEn ? "Smart Filter Active" : "Akıllı Filtre Aktif"} value={settings.proactiveFilter} onToggle={() => toggleSetting('proactiveFilter')} trackTrue={theme.primary} />
        <SectionDesc text={isEn ? "Analyzes and instantly filters unknown, next-generation spam messages with a machine learning-based Probability Algorithm." : "Makine öğrenmesi tabanlı Olasılık Algoritması ile henüz bilinmeyen, yeni nesil spam mesajları analiz eder ve anında filtrelenir."} />
        <View style={{height: spacing.xl}}/>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{isEn ? "Filter Sensitivity" : "Filtre Hassasiyeti"}</Text>
        <SectionDesc text={isEn ? "Choose how strict the filter will be when blocking suspicious messages." : "Filtrenin şüpheli mesajları engellerken ne kadar katı davranacağını seçin."} />
        <View style={{marginTop: spacing.md, gap: spacing.sm}}>
          {aiLevels.map(lvl => {
            const isSelected = settings.aiSensitivity === lvl.val;
            return (
              <TouchableOpacity
                key={`lvl-${lvl.val}`}
                style={[styles.aiLevelCard, { backgroundColor: theme.card, borderColor: isSelected ? lvl.color : theme.border }]}
                onPress={() => updateSetting('aiSensitivity', lvl.val)}
                activeOpacity={0.7}
              >
                <View style={[styles.aiRadioOuter, { borderColor: isSelected ? lvl.color : theme.border }]}>
                  {isSelected && <View style={[styles.aiRadioInner, { backgroundColor: lvl.color }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiLevelTitle, { color: isSelected ? lvl.color : theme.text }]}>{lvl.label}</Text>
                  <Text style={[styles.aiLevelDesc, { color: theme.textMuted }]}>{lvl.desc}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function InvalidNumberScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting } = useSettings();
  const isEn = settings.language === 'en';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title={isEn ? "Invalid Number Filter" : "Geçersiz Numara Filtresi"} navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Info} iconColor={theme.primary} title={isEn ? "Enable" : "Aktif Et"} value={settings.invalidNumberFilter} onToggle={() => toggleSetting('invalidNumberFilter')} />
        <SectionDesc text={isEn ? "Sender number's accuracy and format are checked." : "Gönderici numarasının doğruluğu ve formatı kontrol edilir."} />
        <View style={{height: spacing.xl}}/>
        <SettingRow icon={AlertTriangle} iconColor={theme.danger} title={isEn ? "Block Foreign Numbers" : "Yurtdışı Numaralarını Engelle"} value={settings.blockForeignNumbers} onToggle={() => toggleSetting('blockForeignNumbers')} danger />
        <SectionDesc text={isEn ? "When enabled, SMS from all country codes other than +90 (Turkey) are automatically filtered." : "Etkinleştirildiğinde, +90 (Türkiye) dışındaki tüm ülke kodlarından gelen sms'ler otomatik filtrelenir."} />
      </View>
    </ScrollView>
  );
}

function SettingsMainScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();
  const isEn = settings.language === 'en';
  const insets = useSafeAreaInsets();
  const t = getT(settings.language || 'tr');
  const scrollRef = React.useRef<ScrollView>(null);
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(
    Platform.OS !== 'android',
  );
  useScrollToTop(scrollRef as any);

  useFocusEffect(
    React.useCallback(() => {
      hasSmsDetectionPermission()
        .then(setSmsPermissionGranted)
        .catch(() => setSmsPermissionGranted(false));
    }, []),
  );

  const handleSmsPermission = async () => {
    const granted = await requestSmsDetectionPermission();
    setSmsPermissionGranted(granted);
  };

  const openPrivacyPolicy = async () => {
    try {
      await Linking.openURL('https://filtreai.vercel.app/privacy');
    } catch {
      Alert.alert(
        'Bağlantı açılamadı',
        'Gizlilik politikasını şu adresten görüntüleyebilirsiniz: https://filtreai.vercel.app/privacy'
      );
    }
  };

  return (
    <ScrollView ref={scrollRef} style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl) }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.settings}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.appearance}</Text>
        <View style={[styles.settingGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.settingGroupItem}>
            <View style={styles.settingIcon}><Languages size={22} color={theme.primary} /></View>
            <View style={styles.settingContent}><Text style={[styles.settingTitle, { color: theme.text }]}>{t.language}</Text></View>
            <View style={{flexDirection: 'row', backgroundColor: theme.background, borderRadius: radii.md, padding: 4}}>
              <TouchableOpacity onPress={() => updateSetting('language', 'tr')} style={[styles.toggleBtn, settings.language === 'tr' && { backgroundColor: theme.primary }]}>
                <Text style={{color: settings.language === 'tr' ? '#fff' : theme.textMuted, fontWeight: 'bold'}}>TR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => updateSetting('language', 'en')} style={[styles.toggleBtn, settings.language === 'en' && { backgroundColor: theme.primary }]}>
                <Text style={{color: settings.language === 'en' ? '#fff' : theme.textMuted, fontWeight: 'bold'}}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <View style={styles.settingGroupItem}>
            <View style={styles.settingIcon}><Palette size={22} color={theme.primary} /></View>
            <View style={styles.settingContent}><Text style={[styles.settingTitle, { color: theme.text }]}>{t.theme}</Text></View>
            <View style={{flexDirection: 'row', backgroundColor: theme.background, borderRadius: radii.md, padding: 4}}>
              {(['system', 'light', 'dark'] as const).map((thm) => (
                <TouchableOpacity key={thm} onPress={() => updateSetting('theme', thm)} style={[styles.toggleBtn, settings.theme === thm && { backgroundColor: theme.primary }]}>
                  <Text style={{color: settings.theme === thm ? '#fff' : theme.textMuted, fontWeight: 'bold', textTransform: 'capitalize'}}>{t[thm] || thm}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={{height: spacing.lg}}/>
        <SettingRow
          icon={Key}
          iconColor={theme.primary}
          title={isEn ? "Biometric Lock (In-App)" : "Biyometrik Kilit (Uygulama İçi)"}
          value={settings.biometricLock}
          onToggle={() => toggleSetting('biometricLock')}
        />
        <SectionDesc text={isEn ? "Requires FaceID / Fingerprint approval to enter the settings and rules menu." : "Ayarlar ve kurallar menüsüne girişte FaceID / Parmak İzi onayı ister."} />
      </View>

      {Platform.OS === 'android' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            {isEn ? "Android SMS Protection" : "Android SMS Koruması"}
          </Text>
          <SettingRow
            icon={ShieldCheck}
            iconColor={smsPermissionGranted ? '#10B981' : theme.danger}
            title={isEn ? "Incoming SMS Permission" : "Gelen SMS İzni"}
            value={smsPermissionGranted}
            isNav
            onPress={handleSmsPermission}
          />
          <SectionDesc text={isEn ? "Required to check incoming messages for spam symptoms on the device." : "Yeni gelen mesajları cihaz üzerinde spam belirtileri için kontrol edebilmek amacıyla gereklidir."} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.smartFilter}</Text>
        <SettingRow icon={Brain} iconColor={theme.primary} title={t.smartFilter} value={settings.smartFilter} onToggle={() => toggleSetting('smartFilter')} />
        <SectionDesc text={t.smartFilterDesc} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.personalProtections}</Text>
        <View style={[styles.settingGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow icon={ShieldCheck} iconColor="#10B981" title={t.whitelist} isNav isGrouped onPress={() => navigation.navigate('Whitelist')} />
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={ListFilter} iconColor={theme.primary} title={isEn ? "App Rules" : "Uygulama Kuralları"} isNav isGrouped onPress={() => navigation.navigate('Rules')} />
        </View>
        <SectionDesc text={t.whitelistDesc} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.intlFilter}</Text>
        <View style={[styles.settingGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow icon={Globe} iconColor={theme.primary} title={t.blockForeign} value={settings.blockForeignNumbers} onToggle={() => toggleSetting('blockForeignNumbers')} isGrouped />
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={AlertTriangle} iconColor="#F59E0B" title={t.blockArabic} value={settings.blockArabic} onToggle={() => toggleSetting('blockArabic')} isGrouped />
        </View>
        <SectionDesc text={t.intlDesc} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.otherFilters}</Text>
        <View style={[styles.settingGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow icon={Clock} iconColor="#8B5CF6" title={t.schedule} isNav onPress={() => navigation.navigate('Schedule')} isGrouped />
          {Platform.OS === 'ios' && (
            <>
              <View style={[styles.separator, { backgroundColor: theme.border }]} />
              <SettingRow icon={ListFilter} iconColor="#EC4899" title={t.mapping} isNav onPress={() => navigation.navigate('Mapping')} isGrouped />
            </>
          )}
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={ShieldAlert} iconColor="#EF4444" title={t.fraud} isNav onPress={() => navigation.navigate('Fraud')} isGrouped />
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={Database} iconColor="#3B82F6" title={t.database} isNav onPress={() => navigation.navigate('Database')} isGrouped />
        </View>
        <SectionDesc text={isEn ? "Configure when filtering runs and which local threat rules are used." : "Filtrelemenin ne zaman çalışacağını ve hangi yerel tehdit kurallarının kullanılacağını ayarlayın."} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{isEn ? "About" : "Hakkında"}</Text>
        <SettingRow
          icon={Info}
          iconColor={theme.primary}
          title={isEn ? "Privacy Policy" : "Gizlilik Politikası"}
          isNav
          onPress={openPrivacyPolicy}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{isEn ? "Developer" : "Geliştirici"}</Text>
        <SettingRow
          icon={FlaskConical}
          iconColor="#8B5CF6"
          title={isEn ? "Test Simulator" : "Test Simülatörü"}
          isNav
          onPress={() => navigation.navigate('Simulator')}
        />
        <SectionDesc text={isEn ? "Test how the app behaves without receiving a real SMS." : "Gerçek bir SMS almadan uygulamanın nasıl davrandığını test edin."} />
      </View>

      {Platform.OS === 'android' && (
        <View style={[styles.section, { marginBottom: 60 }]}>
          <Text style={[styles.sectionTitle, { color: theme.danger }]}>{t.dangerZone}</Text>
          <SettingRow
            icon={Network} iconColor={theme.danger} title={t.underAttack} value={settings.underAttackMode} danger
            onToggle={() => {
              if (!settings.underAttackMode) {
                Alert.alert(t.underAttack, t.underAttackDesc, [
                  { text: isEn ? 'Cancel' : 'İptal', style: 'cancel' },
                  { text: isEn ? 'Activate' : 'Aktifleştir', style: 'destructive', onPress: () => toggleSetting('underAttackMode') }
                ]);
              } else {
                toggleSetting('underAttackMode');
              }
            }}
          />
          <SectionDesc text={t.underAttackDesc} />
        </View>
      )}


    </ScrollView>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();

  const [settings, setSettings] = useState<AppSettings>({
    underAttackMode: false,
    smartFilter: true,
    silentBlocking: true,
    filterScheduleEnabled: false,
    scheduleStart: '22:00',
    scheduleEnd: '08:00',
    filterTransactions: false,
    filterPromotions: false,
    fraudFilter: true,
    databaseFilter: true,
    proactiveFilter: true,
    invalidNumberFilter: false,
    categoryMapping: {
      spam: 'junk',
      transaction: 'transaction',
      promotion: 'promotion',
    },
    aiSensitivity: 0.8,
    blockForeignNumbers: false,
    blockArabic: false,
    theme: 'system',
    language: 'tr',
    customFraudKeywords: [],
    whitelist: [],
    autoSyncEnabled: true,
    biometricLock: false,
  });

  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    FilterManager.loadSettings().then(s => {
      setSettings(s as any);
      if (!s.biometricLock) {
        setIsAuthenticated(true);
      }
      setIsReady(true);
    });
  }, []);

  const authState = React.useRef({ isAuthenticated: false, biometricLock: false });
  useEffect(() => {
    authState.current.isAuthenticated = isAuthenticated;
    authState.current.biometricLock = settings.biometricLock || false;
  }, [isAuthenticated, settings.biometricLock]);

  useFocusEffect(
    React.useCallback(() => {
      if (authState.current.biometricLock && !authState.current.isAuthenticated && isReady) {
        const now = Date.now();
        if (now - lastAuthTime < AUTH_GRACE_PERIOD) {
          setIsAuthenticated(true); // 3 dakika dolmadıysa tekrar sorma
        } else {
          authenticate();
        }
      }
      return () => {
        if (authState.current.biometricLock) {
          setIsAuthenticated(false);
        }
      };
    }, [isReady])
  );

  const authenticate = async () => {
    setIsAuthenticating(true);
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ayarlara Erişmek İçin Doğrulayın',
      fallbackLabel: 'Parola Kullan',
      cancelLabel: 'İptal',
      disableDeviceFallback: false,
    });

    if (result.success) {
      lastAuthTime = Date.now();
      setIsAuthenticated(true);
    }
    setIsAuthenticating(false);
  };

  const toggleSetting = async (key: keyof AppSettings) => {
    let val = settings[key];
    if (val === undefined) val = false; // Fallback

    // Eğer biyometrik kilit açılmak isteniyorsa, cihazın destekleyip desteklemediğini kontrol et
    if (key === 'biometricLock' && !val) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Desteklenmiyor',
          'Cihazınızda Face ID, Touch ID veya herhangi bir biyometrik güvenlik ayarlı değil. Lütfen önce cihaz ayarlarınızdan bir güvenlik yöntemi ekleyin.'
        );
        return; // Açılmasına izin verme
      }
    }

    const newSettings = { ...settings, [key]: !val };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
    DeviceEventEmitter.emit('onSettingsChanged', newSettings);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'autoSyncEnabled') {
      const { registerBackgroundSync, unregisterBackgroundSync } = require('../services/BackgroundSyncService');
      if (!val) { // it was false, now true
        registerBackgroundSync();
      } else {
        unregisterBackgroundSync();
      }
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
    DeviceEventEmitter.emit('onSettingsChanged', newSettings);
    if (key === 'theme') {
      DeviceEventEmitter.emit('onThemeChanged', value);
    }
    Haptics.selectionAsync();
  };

  const updateMapping = async (key: keyof typeof settings.categoryMapping, value: string) => {
    const newSettings = { ...settings, categoryMapping: { ...settings.categoryMapping, [key]: value } };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
    DeviceEventEmitter.emit('onSettingsChanged', newSettings);
    Haptics.selectionAsync();
  };

  const contextValue = {
    settings,
    toggleSetting,
    updateSetting,
    updateMapping,
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  const isGracePeriodActive = Date.now() - lastAuthTime < AUTH_GRACE_PERIOD;

  if (!isAuthenticated && settings.biometricLock && !isGracePeriodActive) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
        <ShieldAlert size={64} color={theme.danger} style={{ marginBottom: spacing.lg }} />
        <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: spacing.md }]}>Erişim Engellendi</Text>
        <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: spacing.xl, fontSize: 16 }}>
          Ayarları ve kuralları görüntülemek için kimliğinizi doğrulamanız gereklidir.
        </Text>
        <TouchableOpacity
          style={[styles.dbSyncBtn, { backgroundColor: theme.primary, paddingHorizontal: spacing.xxl, width: '100%', opacity: isAuthenticating ? 0.7 : 1 }]}
          onPress={authenticate}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.dbSyncBtnText, { color: '#fff' }]}>Tekrar Dene</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SettingsContext.Provider value={contextValue}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background }, animation: 'slide_from_right' }}>
          <Stack.Screen name="SettingsMain" component={SettingsMainScreen} />
          <Stack.Screen name="Whitelist" component={WhitelistScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="Mapping" component={MappingScreen} />
          <Stack.Screen name="Fraud" component={FraudScreen} />
          <Stack.Screen name="Database" component={DatabaseScreen} />
          <Stack.Screen name="Proactive" component={ProactiveScreen} />
          <Stack.Screen name="InvalidNumber" component={InvalidNumberScreen} />
          <Stack.Screen name="Rules" component={RulesScreen} />
        </Stack.Navigator>
      </SettingsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg },
  headerRow: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backBtn: { padding: 4, marginRight: spacing.sm, marginLeft: -8 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionDesc: { fontSize: 13, lineHeight: 18, marginTop: spacing.sm, paddingHorizontal: 4 },

  settingCard: {
    flexDirection: 'row', borderRadius: radii.xl, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, marginBottom: 4,
  },
  settingGroupCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  settingGroupItem: { flexDirection: 'row', padding: spacing.md, alignItems: 'center' },
  separator: { height: 1, marginLeft: 56 },

  settingIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  settingContent: { flex: 1, marginRight: spacing.sm, justifyContent: 'center' },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },

  navAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navValue: { fontSize: 15 },

  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm },

  premiumInputContainer: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden'
  },
  premiumInput: { flex: 1, fontSize: 16, paddingHorizontal: spacing.md, height: '100%' },
  premiumAddBtn: { width: 56, height: '100%', justifyContent: 'center', alignItems: 'center' },

  emptyCard: { padding: spacing.xxl, borderRadius: radii.xl, borderWidth: 1, alignItems: 'center' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.lg, borderWidth: 1 },
  listIcon: { width: 36, height: 36, borderRadius: radii.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  listText: { flex: 1, fontSize: 16, fontWeight: '600' },
  deleteBtn: { padding: spacing.sm },

  tagItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.full, borderWidth: 1 },

  dbCard: { borderRadius: radii.xl, borderWidth: 1, padding: spacing.xl },
  dbHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  dbIconWrapper: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  dbInfo: { flex: 1 },
  dbTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  dbSubtitle: { fontSize: 13 },
  dbSyncBtn: { flexDirection: 'row', height: 56, borderRadius: radii.lg, justifyContent: 'center', alignItems: 'center', gap: 8 },
  dbSyncBtnText: { fontSize: 16, fontWeight: '700' },

  aiLevelCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1 },
  aiRadioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  aiRadioInner: { width: 12, height: 12, borderRadius: 6 },
  aiLevelTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  aiLevelDesc: { fontSize: 13 },

  contactPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  contactPickerBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    borderBottomWidth: 1,
    paddingTop: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  }
});

const SettingRow = ({ icon: Icon, iconColor, title, desc, value, onToggle, trackTrue, danger, isNav, isGrouped, onPress }: any) => {
  const theme = useAppTheme();
  const Wrapper = onPress ? TouchableOpacity : (View as any);
  return (
    <Wrapper
      onPress={() => {
        if (onPress) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      style={[
        isGrouped ? styles.settingGroupItem : styles.settingCard,
        !isGrouped && { backgroundColor: theme.card, borderColor: theme.border },
        danger && value && !isGrouped && { borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.08)' },
        isNav && !isGrouped && { paddingVertical: spacing.md }
      ]}
    >
      <View style={styles.settingIcon}>
        <Icon color={iconColor || theme.textMuted} size={24} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger && value ? theme.danger : theme.text }]}>{title}</Text>
        {desc && <Text style={[styles.settingDesc, { color: theme.textMuted }]}>{desc}</Text>}
      </View>
      {onToggle && !isNav && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: trackTrue || theme.primary }}
        />
      )}
      {isNav && (
        <View style={styles.navAction}>
          {value !== undefined && <Text style={[styles.navValue, { color: theme.textMuted }]}>{value ? 'Açık' : 'Kapalı'}</Text>}
          <ChevronRight color={theme.textMuted} size={20} />
        </View>
      )}
    </Wrapper>
  );
};

const SectionDesc = ({ text }: { text: string }) => {
  const theme = useAppTheme();
  return (
    <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>{text}</Text>
  );
};
