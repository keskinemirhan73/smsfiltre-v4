import React, { useState, useEffect, useContext, createContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, TextInput, Alert, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import { ShieldAlert, Brain, Clock, ShieldCheck, Database, Zap, Network, ListFilter, Globe, AlertTriangle, Info, ChevronRight, ChevronLeft, Palette, Languages, Plus, Trash2, CheckCircle2, Server, Key, Phone, Activity, X } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, AppSettings } from '../modules/FilterManager';
import { ThreatCloudService } from '../services/ThreatCloudService';
import { getT } from '../i18n';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const SettingsContext = createContext<any>(null);
const useSettings = () => useContext(SettingsContext);

const Stack = createNativeStackNavigator();

const TopHeader = ({ title, navigation }: { title: string, navigation: any }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.headerRow}>
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
  const [whitelistNumber, setWhitelistNumber] = useState('');

  const addNumber = () => {
    if (!whitelistNumber.trim()) return;
    const wl = settings.whitelist || [];
    if (!wl.includes(whitelistNumber.trim())) updateSetting('whitelist', [...wl, whitelistNumber.trim()]);
    setWhitelistNumber('');
  };
  const removeNumber = (num: string) => {
    const wl = settings.whitelist || [];
    updateSetting('whitelist', wl.filter((n: string) => n !== num));
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
        
        <View style={{flexDirection: 'column', marginTop: spacing.xl, gap: spacing.sm}}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: spacing.xs }]}>Güvenli Numara ve Kurumlar</Text>
          
          {(!settings.whitelist || settings.whitelist.length === 0) ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ShieldCheck size={40} color={theme.border} style={{ marginBottom: spacing.md }} />
              <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>Beyaz listenizde hiç numara yok.</Text>
            </View>
          ) : (
            (settings.whitelist || []).map((num: string) => (
              <View key={`wl-${num}`} style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.listIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <ShieldCheck size={18} color="#10B981" />
                </View>
                <Text style={[styles.listText, { color: theme.text }]}>{num}</Text>
                <TouchableOpacity onPress={() => removeNumber(num)} style={styles.deleteBtn}>
                  <Trash2 size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function ScheduleScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting, updateSetting } = useSettings();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
  const [keyword, setKeyword] = useState('');

  const addKeyword = () => {
    if (!keyword.trim()) return;
    const kws = settings.customFraudKeywords || [];
    if (!kws.includes(keyword.trim())) updateSetting('customFraudKeywords', [...kws, keyword.trim()]);
    setKeyword('');
  };
  const removeKeyword = (kw: string) => {
    const kws = settings.customFraudKeywords || [];
    updateSetting('customFraudKeywords', kws.filter((k: string) => k !== kw));
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
            (settings.customFraudKeywords || []).map((kw: string) => (
              <View key={`kw-${kw}`} style={[styles.tagItem, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}>
                <Text style={{color: theme.danger, fontSize: 14, fontWeight: '600', marginRight: 6}}>{kw}</Text>
                <TouchableOpacity onPress={() => removeKeyword(kw)}>
                  <X size={16} color={theme.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function DatabaseScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { settings, toggleSetting } = useSettings();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Yükleniyor...');
  
  useEffect(() => {
    ThreatCloudService.getLastSyncDate().then(setLastSync);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await ThreatCloudService.syncDatabase();
    setIsSyncing(false);
    if (success) {
      Alert.alert('Başarılı', 'Veritabanı buluttan başarıyla güncellendi!\nSpam kelimeleri ve numaralar listeye eklendi.');
      ThreatCloudService.getLastSyncDate().then(setLastSync);
    } else {
      Alert.alert('Hata', 'Bulut sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopHeader title="Proaktif Filtre" navigation={navigation} />
      <View style={styles.section}>
        <SettingRow icon={Activity} iconColor={theme.primary} title="Yapay Zeka (AI) Aktif" value={settings.proactiveFilter} onToggle={() => toggleSetting('proactiveFilter')} trackTrue={theme.primary} />
        <SectionDesc text="Makine öğrenmesi tabanlı Olasılık Algoritması ile henüz bilinmeyen, yeni nesil spam mesajları analiz eder ve anında filtrelenir." />
        <View style={{height: spacing.xl}}/>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Hassasiyeti</Text>
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
  const t = getT(settings.language || 'tr');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
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
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.smartFilter}</Text>
        <SettingRow icon={Brain} iconColor={theme.primary} title={t.smartFilter} value={settings.smartFilter} onToggle={() => toggleSetting('smartFilter')} />
        <SectionDesc text={t.smartFilterDesc} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.personalProtections}</Text>
        <SettingRow icon={ShieldCheck} iconColor="#10B981" title={t.whitelist} isNav onPress={() => navigation.navigate('Whitelist')} />
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
  });

  useEffect(() => {
    FilterManager.loadSettings().then(setSettings);
  }, []);

  const toggleSetting = async (key: keyof AppSettings) => {
    const val = settings[key];
    if (typeof val !== 'boolean') return;
    const newSettings = { ...settings, [key]: !val };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
    if (key === 'theme') {
      DeviceEventEmitter.emit('onThemeChanged', value);
    }
  };

  const updateMapping = async (key: keyof typeof settings.categoryMapping, value: string) => {
    const newSettings = { ...settings, categoryMapping: { ...settings.categoryMapping, [key]: value } };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
  };

  const contextValue = {
    settings,
    toggleSetting,
    updateSetting,
    updateMapping,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'card', animation: 'simple_push', contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="SettingsMain" component={SettingsMainScreen} />
        <Stack.Screen name="Whitelist" component={WhitelistScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="Mapping" component={MappingScreen} />
        <Stack.Screen name="Fraud" component={FraudScreen} />
        <Stack.Screen name="Database" component={DatabaseScreen} />
        <Stack.Screen name="Proactive" component={ProactiveScreen} />
        <Stack.Screen name="InvalidNumber" component={InvalidNumberScreen} />
      </Stack.Navigator>
    </SettingsContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  headerRow: { padding: spacing.lg, paddingTop: spacing.xl, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
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
  aiLevelDesc: { fontSize: 13 }
});

const SettingRow = ({ icon: Icon, iconColor, title, desc, value, onToggle, trackTrue, danger, isNav, isGrouped, onPress }: any) => {
  const theme = useAppTheme();
  const Wrapper = onPress ? TouchableOpacity : (View as any);
  return (
    <Wrapper 
      onPress={onPress}
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
