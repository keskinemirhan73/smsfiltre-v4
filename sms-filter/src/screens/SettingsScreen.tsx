import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, TextInput, Alert, DeviceEventEmitter } from 'react-native';
import { ShieldAlert, Brain, Clock, FolderKanban, ShieldCheck, Database, Zap, Network, ListFilter, Globe, AlertTriangle, Info, ChevronRight, ChevronLeft, FileX, Palette, Languages } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, AppSettings } from '../modules/FilterManager';
import { ThreatCloudService } from '../services/ThreatCloudService';
import { getT } from '../i18n';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const [activePage, setActivePage] = useState<'main' | 'schedule' | 'mapping' | 'fraud' | 'database' | 'proactive' | 'invalidNumber' | 'whitelist'>('main');
  const [keyword, setKeyword] = useState('');
  const [whitelistNumber, setWhitelistNumber] = useState('');
  
  // Database Page States
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Yükleniyor...');
  useEffect(() => {
    ThreatCloudService.getLastSyncDate().then(setLastSync);
  }, []);

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
    setSettings(newSettings);
    await FilterManager.saveSettings(newSettings);
  };

  const updateSetting = async (key: keyof AppSettings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings as any);
    await FilterManager.saveSettings(newSettings as any);
    if (key === 'theme') {
      DeviceEventEmitter.emit('onThemeChanged', value);
    }
  };
  
  const t = getT(settings.language as any || 'tr');

  const updateMapping = async (key: keyof typeof settings.categoryMapping, value: string) => {
    const newSettings = { ...settings, categoryMapping: { ...settings.categoryMapping, [key]: value } };
    setSettings(newSettings);
    await FilterManager.saveSettings(newSettings);
  };

  if (activePage === 'whitelist') {
    const addNumber = () => {
      if (!whitelistNumber.trim()) return;
      const wl = settings.whitelist || [];
      if (!wl.includes(whitelistNumber.trim())) updateSetting('whitelist', [...wl, whitelistNumber.trim()] as any);
      setWhitelistNumber('');
    };
    const removeNumber = (num: string) => {
      const wl = settings.whitelist || [];
      updateSetting('whitelist', wl.filter(n => n !== num) as any);
    };
    
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Beyaz Liste (VIP)</Text>
        </View>
        <View style={styles.section}>
          <SectionDesc text="Buraya eklediğiniz numaralar veya kurum adları HİÇBİR güvenlik filtresine takılmaz. Aile üyelerinizi veya bankalarınızı ekleyebilirsiniz." />
          <View style={{flexDirection: 'row', marginTop: spacing.md, gap: 8}}>
            <TextInput 
              style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Numara / İsim (Örn: +90555... veya GARANTI)"
              placeholderTextColor={theme.textMuted}
              value={whitelistNumber}
              onChangeText={setWhitelistNumber}
            />
            <TouchableOpacity 
              style={{ backgroundColor: theme.primary, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radii.md }}
              onPress={addNumber}
            >
              <Text style={{color: '#fff', fontWeight: '700'}}>Ekle</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{flexDirection: 'column', marginTop: spacing.lg, gap: 8}}>
            {(settings.whitelist || []).map(num => (
              <View key={`wl-${num}`} style={{flexDirection: 'row', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'space-between'}}>
                <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}>{num}</Text>
                <TouchableOpacity onPress={() => removeNumber(num)} style={{padding: 4}}><FileX size={20} color={theme.danger} /></TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (activePage === 'schedule') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Zaman Programı</Text>
        </View>
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

  if (activePage === 'mapping') {
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
                {isSelected && <ShieldCheck size={20} color={theme.primary} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    );

    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Kategori Eşleme</Text>
        </View>
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

  if (activePage === 'fraud') {
    const addKeyword = () => {
      if (!keyword.trim()) return;
      const kws = settings.customFraudKeywords || [];
      if (!kws.includes(keyword.trim())) updateSetting('customFraudKeywords', [...kws, keyword.trim()] as any);
      setKeyword('');
    };
    const removeKeyword = (kw: string) => {
      const kws = settings.customFraudKeywords || [];
      updateSetting('customFraudKeywords', kws.filter(k => k !== kw) as any);
    };
    
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Dolandırıcılık Filtresi</Text>
        </View>
        <View style={styles.section}>
          <SettingRow
            icon={ShieldAlert}
            iconColor={theme.primary}
            title="Aktif Et"
            value={settings.fraudFilter}
            onToggle={() => toggleSetting('fraudFilter')}
          />
          <SectionDesc text="Bu özellik Spam ve Tehdit Veritabanı'nın bir parçasıdır." />
          
          <View style={{height: 24}}/>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Hassas Kelime Avcısı</Text>
          <SectionDesc text="Aşağıdaki kelimelerden herhangi birini içeren mesajlar tehlikeli kabul edilir ve anında filtrelenir." />
          <View style={{flexDirection: 'row', marginTop: spacing.md, gap: 8}}>
            <TextInput 
              style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="Yeni kelime (Örn: Şifre, Banka)"
              placeholderTextColor={theme.textMuted}
              value={keyword}
              onChangeText={setKeyword}
            />
            <TouchableOpacity 
              style={{ backgroundColor: theme.primary, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radii.md }}
              onPress={addKeyword}
            >
              <Text style={{color: '#fff', fontWeight: '700'}}>Ekle</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg, gap: 8}}>
            {(settings.customFraudKeywords || []).map(kw => (
              <View key={`kw-${kw}`} style={{flexDirection: 'row', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center'}}>
                <Text style={{color: theme.text, fontSize: 13, marginRight: 8}}>{kw}</Text>
                <TouchableOpacity onPress={() => removeKeyword(kw)}><FileX size={14} color={theme.danger} /></TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (activePage === 'database') {
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Veritabanı Filtresi</Text>
        </View>
        <View style={styles.section}>
          <SettingRow
            icon={Database}
            iconColor={theme.primary}
            title="Aktif Et"
            value={settings.databaseFilter}
            onToggle={() => toggleSetting('databaseFilter')}
          />
          <SectionDesc text="Bulut tabanlı tehdit veritabanı korumasını aktif eder. Sistem arka planda en güncel tehditleri otomatik olarak indirir." />
          
          <View style={{height: 24}}/>
          <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md}}>
              <Zap color={theme.secondary} size={24} style={{marginRight: 12}} />
              <View>
                <Text style={{color: theme.text, fontSize: 16, fontWeight: '700'}}>Güncelleme Durumu</Text>
                <Text style={{color: theme.secondary, fontSize: 13, marginTop: 2}}>Son Güncelleme: {lastSync}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: isSyncing ? theme.border : theme.primary, paddingVertical: 12, borderRadius: radii.md, alignItems: 'center' }}
              onPress={handleSync}
              disabled={isSyncing}
            >
              <Text style={{color: isSyncing ? theme.textMuted : '#fff', fontWeight: '700', fontSize: 15}}>{isSyncing ? 'Buluta Bağlanılıyor...' : 'Buluttan Şimdi Güncelle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (activePage === 'proactive') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Proaktif Filtre</Text>
        </View>
        <View style={styles.section}>
          <SettingRow
            icon={ShieldCheck}
            iconColor={theme.primary}
            title="Aktif Et"
            value={settings.proactiveFilter}
            onToggle={() => toggleSetting('proactiveFilter')}
            trackTrue={theme.secondary}
          />
          <SectionDesc text="Makine öğrenmesi tabanlı Olasılık Algoritması ile en saldırgan spam mesajlar anında filtrelenir." />
          
          <View style={{height: 24}}/>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Yapay Zeka Hassasiyeti</Text>
          <SectionDesc text="Filtrenin şüpheli mesajları engellerken ne kadar katı davranacağını seçin." />
          
          <View style={{marginTop: spacing.md}}>
            {[
              { val: 0.9, label: 'Düşük (Sadece Çok Emin Olduğunda)' },
              { val: 0.8, label: 'Orta (Dengeli - Önerilen)' },
              { val: 0.6, label: 'Yüksek (Şüphelendiği Her Şeyi Engeller)' }
            ].map(lvl => (
              <TouchableOpacity
                key={`lvl-${lvl.val}`}
                style={[
                  styles.settingCard, 
                  { backgroundColor: settings.aiSensitivity === lvl.val ? `${theme.primary}10` : theme.card, borderColor: settings.aiSensitivity === lvl.val ? theme.primary : theme.border }
                ]}
                onPress={() => updateSetting('aiSensitivity', lvl.val as any)}
              >
                <View style={{width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: settings.aiSensitivity === lvl.val ? theme.primary : theme.border, marginRight: 12, alignItems: 'center', justifyContent: 'center'}}>
                  {settings.aiSensitivity === lvl.val && <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary}} />}
                </View>
                <Text style={{color: theme.text, fontSize: 14, fontWeight: '500'}}>{lvl.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (activePage === 'invalidNumber') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActivePage('main')} style={styles.backBtn}>
            <ChevronLeft color={theme.text} size={28} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text, flex: 1 }]}>Geçersiz Numara Filtresi</Text>
        </View>
        <View style={styles.section}>
          <SettingRow
            icon={Info}
            iconColor={theme.primary}
            title="Aktif Et"
            value={settings.invalidNumberFilter}
            onToggle={() => toggleSetting('invalidNumberFilter')}
          />
          <SectionDesc text="Gönderici numarasının doğruluğu ve formatı kontrol edilir." />
          
          <View style={{height: 24}}/>
          <SettingRow
            icon={ShieldAlert}
            iconColor={theme.danger}
            title="Yurtdışı Numaralarını Engelle"
            value={settings.blockForeignNumbers}
            onToggle={() => toggleSetting('blockForeignNumbers')}
            danger
          />
          <SectionDesc text="Etkinleştirildiğinde, +90 (Türkiye) dışındaki tüm ülke kodlarından gelen sms'ler otomatik filtrelenir." />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t.settings}</Text>
      </View>
      
      {/* Görünüm ve Dil */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.appearance}</Text>
        
        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 8 }]}>
          <View style={styles.settingIcon}>
            <Languages size={22} color={theme.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{t.language}</Text>
          </View>
          <View style={{flexDirection: 'row', backgroundColor: theme.background, borderRadius: 8, padding: 4}}>
            <TouchableOpacity onPress={() => updateSetting('language', 'tr')} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: settings.language === 'tr' ? theme.primary : 'transparent'}}>
              <Text style={{color: settings.language === 'tr' ? '#fff' : theme.textMuted, fontWeight: 'bold'}}>TR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateSetting('language', 'en')} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: settings.language === 'en' ? theme.primary : 'transparent'}}>
              <Text style={{color: settings.language === 'en' ? '#fff' : theme.textMuted, fontWeight: 'bold'}}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.settingIcon}>
            <Palette size={22} color={theme.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{t.theme}</Text>
          </View>
          <View style={{flexDirection: 'row', backgroundColor: theme.background, borderRadius: 8, padding: 4}}>
            {(['system', 'light', 'dark'] as const).map((thm) => (
              <TouchableOpacity key={thm} onPress={() => updateSetting('theme', thm)} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: settings.theme === thm ? theme.primary : 'transparent'}}>
                <Text style={{color: settings.theme === thm ? '#fff' : theme.textMuted, fontWeight: 'bold', textTransform: 'capitalize'}}>{t[thm] || thm}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Akıllı Filtre */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.smartFilter}</Text>
        <SettingRow
          icon={Brain}
          iconColor={theme.primary}
          title={t.smartFilter}
          value={settings.smartFilter}
          onToggle={() => toggleSetting('smartFilter')}
        />
        <SectionDesc text={t.smartFilterDesc} />
      </View>

      {/* Kişisel Korumalar */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.personalProtections}</Text>
        <SettingRow
          icon={ShieldCheck}
          iconColor="#10B981"
          title={t.whitelist}
          isNav
          onPress={() => setActivePage('whitelist')}
        />
        <SectionDesc text={t.whitelistDesc} />
      </View>

      {/* Yabancı Alfabe ve Yurtdışı */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.intlFilter}</Text>
        <SettingRow
          icon={Globe}
          iconColor={theme.primary}
          title={t.blockForeign}
          desc="Türkiye (+90) dışından gelen SMS'leri engeller"
          value={settings.blockForeignNumbers}
          onToggle={() => toggleSetting('blockForeignNumbers')}
        />
        <View style={{height: 12}} />
        <SettingRow
          icon={AlertTriangle}
          iconColor="#F59E0B"
          title={t.blockArabic}
          desc="Arapça karakter içeren SMS'leri engeller"
          value={settings.blockArabic}
          onToggle={() => toggleSetting('blockArabic')}
        />
        <SectionDesc text={t.intlDesc} />
      </View>

      {/* Diğer Filtreler */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.otherFilters}</Text>
        <SettingRow
          icon={Clock}
          iconColor="#8B5CF6"
          title={t.schedule}
          isNav
          onPress={() => setActivePage('schedule')}
        />
        <SettingRow
          icon={ListFilter}
          iconColor="#EC4899"
          title={t.mapping}
          isNav
          onPress={() => setActivePage('mapping')}
        />
        <SettingRow
          icon={ShieldAlert}
          iconColor="#EF4444"
          title={t.fraud}
          isNav
          onPress={() => setActivePage('fraud')}
        />
        <SettingRow
          icon={Database}
          iconColor="#3B82F6"
          title={t.database}
          isNav
          onPress={() => setActivePage('database')}
        />
        <SettingRow
          icon={Zap}
          iconColor="#10B981"
          title={t.proactive}
          isNav
          onPress={() => setActivePage('proactive')}
        />
      </View>

      {/* Tehlikeli Bölge */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { color: theme.danger }]}>{t.dangerZone}</Text>
        <SettingRow
          icon={Network}
          iconColor={theme.danger}
          title={t.underAttack}
          value={settings.underAttackMode}
          onToggle={() => {
            if (!settings.underAttackMode) {
              Alert.alert(
                t.underAttack,
                t.underAttackDesc,
                [
                  { text: 'İptal', style: 'cancel' },
                  { 
                    text: 'Aktifleştir', 
                    style: 'destructive',
                    onPress: () => toggleSetting('underAttackMode')
                  }
                ]
              );
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  headerRow: { padding: spacing.lg, paddingTop: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 4, marginRight: spacing.sm, marginLeft: -8 },
  title: { fontSize: 28, fontWeight: '800' },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', marginBottom: spacing.md,
  },
  sectionDesc: {
    fontSize: 13, lineHeight: 18, marginTop: spacing.sm, paddingHorizontal: 4
  },
  settingCard: {
    flexDirection: 'row', borderRadius: radii.lg, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, marginBottom: 4,
  },
  settingIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  settingContent: { flex: 1, marginRight: spacing.sm, justifyContent: 'center' },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  
  navAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navValue: { fontSize: 15 },
  
  proBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  proText: { color: 'white', fontSize: 10, fontWeight: '800' },

  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, fontSize: 16 },

  mappingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mappingBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1,
    borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  mappingText: { fontSize: 14, fontWeight: '600' },
});

const SettingRow = ({ icon: Icon, iconColor, title, desc, value, onToggle, trackTrue, danger, isNav, isPro, onPress }: any) => {
  const theme = useAppTheme();
  const Wrapper = onPress ? TouchableOpacity : (View as any);
  return (
    <Wrapper 
      onPress={onPress}
      style={[
        styles.settingCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        danger && value && { borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.08)' },
        isNav && { paddingVertical: spacing.md }
      ]}
    >
      <View style={styles.settingIcon}>
        <Icon color={iconColor || theme.textMuted} size={22} />
      </View>
      <View style={styles.settingContent}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {isPro && (
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          )}
        </View>
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

const SectionDesc = ({ text, isProInfo }: { text: string, isProInfo?: boolean }) => {
  const theme = useAppTheme();
  return (
    <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>
      {isProInfo ? (
        <Text>
          <Text style={{color: theme.text}}>{text.split('Pro Paket')[0]}</Text>
          <Text style={{fontWeight: '700', color: theme.text}}>Pro Paket</Text>
          <Text style={{color: theme.text}}>{text.split('Pro Paket')[1]}</Text>
        </Text>
      ) : text}
    </Text>
  );
};
