import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, TextInput, Alert, DeviceEventEmitter, ActivityIndicator, Modal, FlatList, Linking, Platform } from 'react-native';
import { ShieldAlert, Brain, Clock, ShieldCheck, Database, Zap, Network, ListFilter, Globe, AlertTriangle, Info, ChevronRight, ChevronLeft, Palette, Languages, Plus, Trash2, CheckCircle2, Server, Key, Phone, Activity, X, Users, Search } from 'lucide-react-native';
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
        <TopHeader title="Beyaz Liste (VIP)" navigation={navigation} />
        <View style={styles.section}>
          <SectionDesc text="Buraya eklediğiniz numaralar veya kurum adları HİÇBİR güvenlik filtresine takılmaz. Aile üyelerinizi veya bankalarınızı ekleyebilirsiniz." />

          <View style={[styles.premiumInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Phone size={20} color={theme.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={[styles.premiumInput, { color: theme.text }]}
              placeholder="Numara veya İsim (Örn: +90555... veya GARANTI)"
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
            <Text style={[styles.contactPickerBtnText, { color: theme.secondary }]}>Rehberden Kişi Seç</Text>
          </TouchableOpacity>

          <View style={{flexDirection: 'column', marginTop: spacing.xl, gap: spacing.sm}}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: spacing.xs }]}>Güvenli Numara ve Kurumlar</Text>

            {(!settings.whitelist || settings.whitelist.length === 0) ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ShieldCheck size={40} color={theme.border} style={{ marginBottom: spacing.md }} />
                <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>Beyaz listenizde hiç numara yok.</Text>
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>Kişi Seç</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={{paddingHorizontal: spacing.lg, paddingBottom: spacing.md}}>
              <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Search size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Kişilerde ara..."
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
              <Text style={{color: theme.textMuted, marginTop: 10}}>Rehber yükleniyor...</Text>
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title="Zaman Programı" navigation={navigation} />
      <View style={styles.section}>
        <SettingRow
          icon={Clock}
          iconColor={theme.primary}
          title="Aktif Et"
          value={settings.filterScheduleEnabled}
          onToggle={() => toggleSetting('filterScheduleEnabled')}
        />
        <SectionDesc text="Zaman programı aktifken, SMS koruması SADECE belirlediğiniz saatler arasında çalışır. (Örn: Sadece gece uyurken rahatsız edilmek istemiyorsanız)" />

        {settings.filterScheduleEnabled && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Koruma Saatleri</Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.sm }}>
              <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>BAŞLANGIÇ</Text>
                <TextInput
                  style={{ fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center', width: '100%' }}
                  value={settings.scheduleStart}
                  onChangeText={(t) => updateSetting('scheduleStart', t)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>

              <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '600' }}>BİTİŞ</Text>
                <TextInput
                  style={{ fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center', width: '100%' }}
                  value={settings.scheduleEnd}
                  onChangeText={(t) => updateSetting('scheduleEnd', t)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 12, textAlign: 'center' }}>Saatleri 24-saat formatında girin (Örn: 22:00)</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function MappingScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, updateMapping } = useSettings();

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
                  {cat === 'junk' ? 'İstenmeyen (Junk)' : cat === 'transaction' ? 'İşlemler (Transactions)' : cat === 'promotion' ? 'Tanıtımlar (Promotions)' : 'Gelen Kutusu (İzin Ver)'}
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
      <TopHeader title="Kategori Eşleme" navigation={navigation} />
      <View style={styles.section}>
        <SectionDesc text="SMS Filtresi uygulamasının tespit ettiği mesajların, Apple Mesajlar uygulamasındaki hangi klasörlere gönderileceğini belirleyin." />
        <View style={{height: 24}} />
        <MappingBlock id="spam" title="Spam ve Dolandırıcılık" desc="Tehlikeli linkler, yasa dışı bahis ve dolandırıcılık mesajları." icon={ShieldAlert} color={theme.danger} />
        <MappingBlock id="promotion" title="Tanıtım ve Reklam" desc="Markaların indirim, kampanya ve bülten mesajları (Örn: B001)." icon={Zap} color="#F59E0B" />
        <MappingBlock id="transaction" title="İşlem ve Bilgi" desc="Banka şifreleri, kargo takip kodları ve doğrulama mesajları." icon={Database} color="#3B82F6" />
      </View>
    </ScrollView>
  );
}

function FraudScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();
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
      <TopHeader title="Dolandırıcılık Filtresi" navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={ShieldAlert} iconColor={theme.primary} title="Aktif Et" value={settings.fraudFilter} onToggle={() => toggleSetting('fraudFilter')} />
        <SectionDesc text="Bu özellik Spam ve Tehdit Veritabanı'nın bir parçasıdır." />

        <View style={{height: spacing.xl}}/>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Hassas Kelime Avcısı</Text>
        <SectionDesc text="Aşağıdaki kelimelerden herhangi birini içeren mesajlar tehlikeli kabul edilir ve anında filtrelenir." />

        <View style={[styles.premiumInputContainer, { backgroundColor: theme.card, borderColor: theme.border, marginTop: spacing.md }]}>
          <Key size={20} color={theme.textMuted} style={{ marginLeft: 12 }} />
          <TextInput
            style={[styles.premiumInput, { color: theme.text }]}
            placeholder="Yeni kelime (Örn: Şifre, Banka)"
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
             <Text style={{ color: theme.textMuted, fontSize: 14 }}>Özel dolandırıcılık kelimesi eklenmemiş.</Text>
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
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Yükleniyor...');

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
      <TopHeader title="Veritabanı Filtresi" navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Database} iconColor={theme.primary} title="Aktif Et" value={settings.databaseFilter} onToggle={() => toggleSetting('databaseFilter')} />
        <SectionDesc text="Bulut tabanlı tehdit veritabanı korumasını aktif eder. Sistem arka planda en güncel tehditleri otomatik olarak indirir." />
        <View style={{height: spacing.xl}}/>
        <View style={[styles.dbCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.dbHeader}>
            <View style={[styles.dbIconWrapper, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <Server color={theme.primary} size={28} />
            </View>
            <View style={styles.dbInfo}>
              <Text style={[styles.dbTitle, { color: theme.text }]}>Bulut Eşitlemesi</Text>
              <Text style={[styles.dbSubtitle, { color: theme.textMuted }]}>
                Son Güncelleme: {lastSync}
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
              {isSyncing ? 'Eşitleniyor...' : 'Şimdi Eşitle'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{height: spacing.xl}}/>
        <SettingRow icon={Activity} iconColor={theme.primary} title="Otomatik Arka Plan Güncellemesi" value={settings.autoSyncEnabled !== false} onToggle={() => toggleSetting('autoSyncEnabled')} />
        <SectionDesc text="Uygulama kapalıyken bile günde 2 kez buluttan en yeni tehdit verilerini arka planda cihazınıza indirir. İnternet ve şarj tüketimi yok denecek kadar azdır." />
      </View>
    </ScrollView>
  );
}

function ProactiveScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();

  const aiLevels = [
    { val: 0.9, label: 'Düşük', desc: 'Sadece kesinlikle emin olduğunda engeller.', color: '#10B981' },
    { val: 0.8, label: 'Orta', desc: 'Dengeli koruma sağlar (Önerilen).', color: theme.primary },
    { val: 0.6, label: 'Yüksek', desc: 'Şüpheli bulduğu her mesajı engeller.', color: theme.danger }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title="Proaktif Filtre" navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Activity} iconColor={theme.primary} title="Akıllı Filtre Aktif" value={settings.proactiveFilter} onToggle={() => toggleSetting('proactiveFilter')} trackTrue={theme.primary} />
        <SectionDesc text="Makine öğrenmesi tabanlı Olasılık Algoritması ile henüz bilinmeyen, yeni nesil spam mesajları analiz eder ve anında filtrelenir." />
        <View style={{height: spacing.xl}}/>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Filtre Hassasiyeti</Text>
        <SectionDesc text="Filtrenin şüpheli mesajları engellerken ne kadar katı davranacağını seçin." />
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 80 }}>
      <TopHeader title="Geçersiz Numara Filtresi" navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Info} iconColor={theme.primary} title="Aktif Et" value={settings.invalidNumberFilter} onToggle={() => toggleSetting('invalidNumberFilter')} />
        <SectionDesc text="Gönderici numarasının doğruluğu ve formatı kontrol edilir." />
        <View style={{height: spacing.xl}}/>
        <SettingRow icon={AlertTriangle} iconColor={theme.danger} title="Yurtdışı Numaralarını Engelle" value={settings.blockForeignNumbers} onToggle={() => toggleSetting('blockForeignNumbers')} danger />
        <SectionDesc text="Etkinleştirildiğinde, +90 (Türkiye) dışındaki tüm ülke kodlarından gelen sms'ler otomatik filtrelenir." />
      </View>
    </ScrollView>
  );
}

function SettingsMainScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();
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
          title="Biyometrik Kilit (Uygulama İçi)"
          value={settings.biometricLock}
          onToggle={() => toggleSetting('biometricLock')}
        />
        <SectionDesc text="Ayarlar ve kurallar menüsüne girişte FaceID / Parmak İzi onayı ister." />
      </View>

      {Platform.OS === 'android' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
            Android SMS Koruması
          </Text>
          <SettingRow
            icon={ShieldCheck}
            iconColor={smsPermissionGranted ? '#10B981' : theme.danger}
            title="Gelen SMS İzni"
            value={smsPermissionGranted}
            isNav
            onPress={handleSmsPermission}
          />
          <SectionDesc text="Yeni gelen mesajları cihaz üzerinde spam belirtileri için kontrol edebilmek amacıyla gereklidir." />
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
          <SettingRow icon={ListFilter} iconColor={theme.primary} title="Uygulama Kuralları" isNav isGrouped onPress={() => navigation.navigate('Rules')} />
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
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={ListFilter} iconColor="#EC4899" title={t.mapping} isNav onPress={() => navigation.navigate('Mapping')} isGrouped />
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={ShieldAlert} iconColor="#EF4444" title={t.fraud} isNav onPress={() => navigation.navigate('Fraud')} isGrouped />
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={Database} iconColor="#3B82F6" title={t.database} isNav onPress={() => navigation.navigate('Database')} isGrouped />
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <SettingRow icon={Activity} iconColor="#10B981" title={t.proactive} isNav onPress={() => navigation.navigate('Proactive')} isGrouped />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Hakkında</Text>
        <SettingRow
          icon={Info}
          iconColor={theme.primary}
          title="Gizlilik Politikası"
          isNav
          onPress={openPrivacyPolicy}
        />
      </View>

      {Platform.OS === 'android' && (
        <View style={[styles.section, { marginBottom: 60 }]}>
          <Text style={[styles.sectionTitle, { color: theme.danger }]}>{t.dangerZone}</Text>
          <SettingRow
            icon={Network} iconColor={theme.danger} title={t.underAttack} value={settings.underAttackMode} danger
            onToggle={() => {
              if (!settings.underAttackMode) {
                Alert.alert(t.underAttack, t.underAttackDesc, [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Aktifleştir', style: 'destructive', onPress: () => toggleSetting('underAttackMode') }
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
    if (key === 'theme') {
      DeviceEventEmitter.emit('onThemeChanged', value);
    }
    Haptics.selectionAsync();
  };

  const updateMapping = async (key: keyof typeof settings.categoryMapping, value: string) => {
    const newSettings = { ...settings, categoryMapping: { ...settings.categoryMapping, [key]: value } };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
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
