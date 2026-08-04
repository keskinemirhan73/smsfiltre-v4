const fs = require('fs');

const targetFile = 'd:/smsfiltre/sms-filter/src/screens/SettingsScreen.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
  // WhitelistScreen
  [/title="Beyaz Liste \(VIP\)"/g, 'title={isEn ? "Whitelist (VIP)" : "Beyaz Liste (VIP)"}'],
  [/text="Buraya eklediğiniz numaralar veya kurum adları HİÇBİR güvenlik filtresine takılmaz\. Aile üyelerinizi veya bankalarınızı ekleyebilirsiniz\."/g, 'text={isEn ? "Numbers or institutions you add here will BYPASS all security filters. You can add your family members or banks." : "Buraya eklediğiniz numaralar veya kurum adları HİÇBİR güvenlik filtresine takılmaz. Aile üyelerinizi veya bankalarınızı ekleyebilirsiniz."}'],
  [/placeholder="Numara veya İsim \(Örn: \+90555\.\.\. veya GARANTI\)"/g, 'placeholder={isEn ? "Number or Name (e.g. +90555... or BANK)" : "Numara veya İsim (Örn: +90555... veya GARANTI)"}'],
  [/>Rehberden Kişi Seç</g, '>{isEn ? "Select from Contacts" : "Rehberden Kişi Seç"}<'],
  [/>Güvenli Numara ve Kurumlar</g, '>{isEn ? "Safe Numbers and Institutions" : "Güvenli Numara ve Kurumlar"}<'],
  [/>Beyaz listenizde hiç numara yok\.</g, '>{isEn ? "There are no numbers in your whitelist." : "Beyaz listenizde hiç numara yok."}<'],
  [/>Kişi Seç</g, '>{isEn ? "Select Contact" : "Kişi Seç"}<'],
  [/placeholder="Kişilerde ara\.\.\."/g, 'placeholder={isEn ? "Search contacts..." : "Kişilerde ara..."}'],
  [/>Rehber yükleniyor\.\.\.</g, '>{isEn ? "Loading contacts..." : "Rehber yükleniyor..."}<'],
  [/>Kişi bulunamadı\.</g, '>{isEn ? "No contacts found." : "Kişi bulunamadı."}<'],
  // ScheduleScreen
  [/title="Zaman Programı"/g, 'title={isEn ? "Schedule" : "Zaman Programı"}'],
  [/title="Aktif Et"/g, 'title={isEn ? "Enable" : "Aktif Et"}'],
  [/text="Zaman programı aktifken, SMS koruması SADECE belirlediğiniz saatler arasında çalışır\. \(Örn: Sadece gece uyurken rahatsız edilmek istemiyorsanız\)"/g, 'text={isEn ? "When schedule is active, SMS protection ONLY works between the hours you specify. (e.g., if you only want protection while sleeping)" : "Zaman programı aktifken, SMS koruması SADECE belirlediğiniz saatler arasında çalışır. (Örn: Sadece gece uyurken rahatsız edilmek istemiyorsanız)"}'],
  [/>Koruma Saatleri</g, '>{isEn ? "Protection Hours" : "Koruma Saatleri"}<'],
  [/>BAŞLANGIÇ</g, '>{isEn ? "START" : "BAŞLANGIÇ"}<'],
  [/>BİTİŞ</g, '>{isEn ? "END" : "BİTİŞ"}<'],
  [/>Saatleri 24-saat formatında girin \(Örn: 22:00\)</g, '>{isEn ? "Enter hours in 24-hour format (e.g. 22:00)" : "Saatleri 24-saat formatında girin (Örn: 22:00)"}<'],
  // MappingScreen
  [/title="Kategori Eşleme"/g, 'title={isEn ? "Category Mapping" : "Kategori Eşleme"}'],
  [/text="SMS Filtresi uygulamasının tespit ettiği mesajların, Apple Mesajlar uygulamasındaki hangi klasörlere gönderileceğini belirleyin\."/g, 'text={isEn ? "Determine which folders the messages detected by the SMS Filter app will be sent to in the Apple Messages app." : "SMS Filtresi uygulamasının tespit ettiği mesajların, Apple Mesajlar uygulamasındaki hangi klasörlere gönderileceğini belirleyin."}'],
  [/title="Spam ve Dolandırıcılık"/g, 'title={isEn ? "Spam & Fraud" : "Spam ve Dolandırıcılık"}'],
  [/desc="Tehlikeli linkler, yasa dışı bahis ve dolandırıcılık mesajları\."/g, 'desc={isEn ? "Dangerous links, illegal betting and fraud messages." : "Tehlikeli linkler, yasa dışı bahis ve dolandırıcılık mesajları."}'],
  [/title="Tanıtım ve Reklam"/g, 'title={isEn ? "Promotion & Ads" : "Tanıtım ve Reklam"}'],
  [/desc="Markaların indirim, kampanya ve bülten mesajları \(Örn: B001\)\."/g, 'desc={isEn ? "Discount, campaign and newsletter messages of brands (e.g. B001)." : "Markaların indirim, kampanya ve bülten mesajları (Örn: B001)."}'],
  [/title="İşlem ve Bilgi"/g, 'title={isEn ? "Transaction & Info" : "İşlem ve Bilgi"}'],
  [/desc="Banka şifreleri, kargo takip kodları ve doğrulama mesajları\."/g, 'desc={isEn ? "Bank passwords, cargo tracking codes and verification messages." : "Banka şifreleri, kargo takip kodları ve doğrulama mesajları."}'],
  [/\{cat === \'junk\' \? \'İstenmeyen \(Junk\)\' : cat === \'transaction\' \? \'İşlemler \(Transactions\)\' : cat === \'promotion\' \? \'Tanıtımlar \(Promotions\)\' : \'Gelen Kutusu \(İzin Ver\)\'\}/g, '{cat === \'junk\' ? (isEn ? \'Junk\' : \'İstenmeyen (Junk)\') : cat === \'transaction\' ? (isEn ? \'Transactions\' : \'İşlemler (Transactions)\') : cat === \'promotion\' ? (isEn ? \'Promotions\' : \'Tanıtımlar (Promotions)\') : (isEn ? \'Inbox (Allow)\' : \'Gelen Kutusu (İzin Ver)\')}'],
  // FraudScreen
  [/title="Dolandırıcılık Filtresi"/g, 'title={isEn ? "Fraud Filter" : "Dolandırıcılık Filtresi"}'],
  [/text="Bu özellik Spam ve Tehdit Veritabanı\'nın bir parçasıdır\."/g, 'text={isEn ? "This feature is part of the Spam and Threat Database." : "Bu özellik Spam ve Tehdit Veritabanı\'nın bir parçasıdır."}'],
  [/>Hassas Kelime Avcısı</g, '>{isEn ? "Sensitive Keyword Hunter" : "Hassas Kelime Avcısı"}<'],
  [/text="Aşağıdaki kelimelerden herhangi birini içeren mesajlar tehlikeli kabul edilir ve anında filtrelenir\."/g, 'text={isEn ? "Messages containing any of the following words are considered dangerous and are instantly filtered." : "Aşağıdaki kelimelerden herhangi birini içeren mesajlar tehlikeli kabul edilir ve anında filtrelenir."}'],
  [/placeholder="Yeni kelime \(Örn: Şifre, Banka\)"/g, 'placeholder={isEn ? "New keyword (e.g., Password, Bank)" : "Yeni kelime (Örn: Şifre, Banka)"}'],
  [/>Özel dolandırıcılık kelimesi eklenmemiş\.</g, '>{isEn ? "No custom fraud keywords added." : "Özel dolandırıcılık kelimesi eklenmemiş."}<'],
  // DatabaseScreen
  [/title="Veritabanı Filtresi"/g, 'title={isEn ? "Database Filter" : "Veritabanı Filtresi"}'],
  [/text="Bulut tabanlı tehdit veritabanı korumasını aktif eder\. Sistem arka planda en güncel tehditleri otomatik olarak indirir\."/g, 'text={isEn ? "Activates cloud-based threat database protection. The system automatically downloads the most up-to-date threats in the background." : "Bulut tabanlı tehdit veritabanı korumasını aktif eder. Sistem arka planda en güncel tehditleri otomatik olarak indirir."}'],
  [/>Bulut Eşitlemesi</g, '>{isEn ? "Cloud Sync" : "Bulut Eşitlemesi"}<'],
  [/Son Güncelleme:/g, '{isEn ? "Last Sync:" : "Son Güncelleme:"}'],
  [/\{isSyncing \? \'Eşitleniyor\.\.\.\' : \'Şimdi Eşitle\'\}/g, '{isSyncing ? (isEn ? "Syncing..." : "Eşitleniyor...") : (isEn ? "Sync Now" : "Şimdi Eşitle")}'],
  [/title="Otomatik Arka Plan Güncellemesi"/g, 'title={isEn ? "Auto Background Sync" : "Otomatik Arka Plan Güncellemesi"}'],
  [/text="Uygulama kapalıyken bile günde 2 kez buluttan en yeni tehdit verilerini arka planda cihazınıza indirir\. İnternet ve şarj tüketimi yok denecek kadar azdır\."/g, 'text={isEn ? "Downloads the newest threat data from the cloud in the background twice a day even when the app is closed. Internet and battery consumption are almost negligible." : "Uygulama kapalıyken bile günde 2 kez buluttan en yeni tehdit verilerini arka planda cihazınıza indirir. İnternet ve şarj tüketimi yok denecek kadar azdır."}'],
  // ProactiveScreen
  [/title="Proaktif Filtre"/g, 'title={isEn ? "Proactive Filter" : "Proaktif Filtre"}'],
  [/title="Akıllı Filtre Aktif"/g, 'title={isEn ? "Smart Filter Active" : "Akıllı Filtre Aktif"}'],
  [/text="Makine öğrenmesi tabanlı Olasılık Algoritması ile henüz bilinmeyen, yeni nesil spam mesajları analiz eder ve anında filtrelenir\."/g, 'text={isEn ? "Analyzes and instantly filters unknown, next-generation spam messages with a machine learning-based Probability Algorithm." : "Makine öğrenmesi tabanlı Olasılık Algoritması ile henüz bilinmeyen, yeni nesil spam mesajları analiz eder ve anında filtrelenir."}'],
  [/>Filtre Hassasiyeti</g, '>{isEn ? "Filter Sensitivity" : "Filtre Hassasiyeti"}<'],
  [/text="Filtrenin şüpheli mesajları engellerken ne kadar katı davranacağını seçin\."/g, 'text={isEn ? "Choose how strict the filter will be when blocking suspicious messages." : "Filtrenin şüpheli mesajları engellerken ne kadar katı davranacağını seçin."}'],
  [/\'Düşük\'/g, 'isEn ? "Low" : "Düşük"'],
  [/\'Sadece kesinlikle emin olduğunda engeller\.\'/g, 'isEn ? "Blocks only when absolutely sure." : "Sadece kesinlikle emin olduğunda engeller."'],
  [/\'Orta\'/g, 'isEn ? "Medium" : "Orta"'],
  [/\'Dengeli koruma sağlar \(Önerilen\)\.\'/g, 'isEn ? "Provides balanced protection (Recommended)." : "Dengeli koruma sağlar (Önerilen)."'],
  [/\'Yüksek\'/g, 'isEn ? "High" : "Yüksek"'],
  [/\'Şüpheli bulduğu her mesajı engeller\.\'/g, 'isEn ? "Blocks every message it finds suspicious." : "Şüpheli bulduğu her mesajı engeller."'],
  // InvalidNumberScreen
  [/title="Geçersiz Numara Filtresi"/g, 'title={isEn ? "Invalid Number Filter" : "Geçersiz Numara Filtresi"}'],
  [/text="Gönderici numarasının doğruluğu ve formatı kontrol edilir\."/g, 'text={isEn ? "Sender number\'s accuracy and format are checked." : "Gönderici numarasının doğruluğu ve formatı kontrol edilir."}'],
  [/title="Yurtdışı Numaralarını Engelle"/g, 'title={isEn ? "Block Foreign Numbers" : "Yurtdışı Numaralarını Engelle"}'],
  [/text="Etkinleştirildiğinde, \+90 \(Türkiye\) dışındaki tüm ülke kodlarından gelen sms\'ler otomatik filtrelenir\."/g, 'text={isEn ? "When enabled, SMS from all country codes other than +90 (Turkey) are automatically filtered." : "Etkinleştirildiğinde, +90 (Türkiye) dışındaki tüm ülke kodlarından gelen sms\'ler otomatik filtrelenir."}'],
  // SettingsMainScreen
  [/title="Biyometrik Kilit \(Uygulama İçi\)"/g, 'title={isEn ? "Biometric Lock (In-App)" : "Biyometrik Kilit (Uygulama İçi)"}'],
  [/text="Ayarlar ve kurallar menüsüne girişte FaceID \/ Parmak İzi onayı ister\."/g, 'text={isEn ? "Requires FaceID / Fingerprint approval to enter the settings and rules menu." : "Ayarlar ve kurallar menüsüne girişte FaceID / Parmak İzi onayı ister."}'],
  [/>\s*Android SMS Koruması\s*</g, '>\n            {isEn ? "Android SMS Protection" : "Android SMS Koruması"}\n          <'],
  [/title="Gelen SMS İzni"/g, 'title={isEn ? "Incoming SMS Permission" : "Gelen SMS İzni"}'],
  [/text="Yeni gelen mesajları cihaz üzerinde spam belirtileri için kontrol edebilmek amacıyla gereklidir\."/g, 'text={isEn ? "Required to check incoming messages for spam symptoms on the device." : "Yeni gelen mesajları cihaz üzerinde spam belirtileri için kontrol edebilmek amacıyla gereklidir."}'],
  [/title="Uygulama Kuralları"/g, 'title={isEn ? "App Rules" : "Uygulama Kuralları"}'],
  [/>Hakkında</g, '>{isEn ? "About" : "Hakkında"}<'],
  [/title="Gizlilik Politikası"/g, 'title={isEn ? "Privacy Policy" : "Gizlilik Politikası"}']
];

// Add `const isEn = settings.language === 'en';` to each function component inside SettingsScreen.tsx
content = content.replace(/(function (WhitelistScreen|ScheduleScreen|MappingScreen|FraudScreen|DatabaseScreen|ProactiveScreen|InvalidNumberScreen).*?\{\n)(.*?)const \{ settings/g, '$1$3const { settings, updateSetting, toggleSetting, updateMapping } = useSettings();\n  const isEn = settings.language === \'en\';\n  // DUMMY TO FIX REPLACES');

replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement);
});

// Since the regex might have added duplicate `updateSetting` or `toggleSetting`, we can fix the imports inside the component manually using a simpler approach.
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Done replacing strings.');
