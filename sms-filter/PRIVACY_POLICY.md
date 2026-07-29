# FiltreAI Gizlilik Politikası

**Yürürlük ve son güncelleme tarihi:** 29 Temmuz 2026

## 1. Yerel SMS filtreleme

iOS IdentityLookup uzantısı ile Android SMS alıcısının otomatik filtreleme
işlemleri cihaz üzerinde çalışır. Bu işlem sırasında gönderici ve mesaj metni
yerel kurallarla karşılaştırılır; otomatik filtrelenen mesajlar sunucuya
gönderilmez.

## 2. İsteğe bağlı olarak iletilen veriler

- **Akıllı analiz metni:** Kullanıcı "Mesajı Analiz Et" düğmesine bastığında
  ilgili mesaj metni HTTPS üzerinden FiltreAI sunucusuna gönderilir ve kural
  tabanlı analiz motoruyla incelenir. Metin başka bir yapay zekâ sağlayıcısına
  aktarılmaz. Mesaj metni ve analiz sonucu sunucudaki analiz önbelleğinde
  saklanır.
- **Gönüllü spam bildirimleri:** Kullanıcının bildirdiği anahtar kelime veya
  mesaj metni; cihaz platformu, push token ve isteğin IP adresiyle birlikte
  raporu saymak, kötüye kullanımı önlemek ve topluluk kurallarını geliştirmek
  amacıyla saklanabilir.
- **Push bildirim token'ı:** Kullanıcı bildirim izni verdiğinde Expo push token;
  bildirim göndermek, puan ve rapor sayısı gibi uygulama içi profil
  özelliklerini sağlamak için saklanır.
- **Rehber erişimi:** Kullanıcı isterse bir kişiyi Beyaz Liste'ye eklemek için
  cihaz rehberine erişim izni verebilir. Seçilen kişinin adı ve telefon numarası
  yalnızca cihazdaki filtre ayarına eklenir; rehber sunucuya yüklenmez.

Finansal bilgi ve otomatik filtrelenen diğer mesajlar kullanıcı Akıllı Analiz veya
Spam Bildir özelliğini başlatmadıkça sunucuya gönderilmez.

## 3. Kullanım amaçları

Toplanan veriler; kullanıcının istediği kural tabanlı mesaj analizini gerçekleştirmek, spam
raporlarını değerlendirmek, topluluk filtre kurallarını iyileştirmek, bildirim
göndermek, kötüye kullanımı IP adresiyle sınırlamak ve hizmeti işletmek için
kullanılır. Veriler satılmaz ve reklam takibi amacıyla kullanılmaz.

## 4. Hizmet sağlayıcılar

Bulut özellikleri Render üzerinde çalışan FiltreAI sunucusu, MongoDB Atlas,
Expo bildirim hizmeti ve tehdit kurallarını dağıtmak için GitHub
altyapısını kullanabilir. Bu sağlayıcılar yalnızca ilgili hizmeti sunmak için
gerekli verileri işler.

## 5. Saklama ve güvenlik

Veriler aktarım sırasında HTTPS ile korunur. Akıllı analiz metni ve sonucu,
analiz önbelleğine eklendikten yaklaşık **7 gün** sonra otomatik olarak
silinir. Push token'ları, IP adresleri ve rapor kayıtları hizmet için gerekli
olduğu sürece veya silinme talebi işlenene kadar saklanabilir; bu diğer
kayıtlar için şu anda sabit bir otomatik silme süresi uygulanmamaktadır.

## 6. Kullanıcı tercihleri ve silinme

Kullanıcı bildirim iznini cihaz ayarlarından kapatabilir, Akıllı Analiz ve Spam
Bildir özelliklerini kullanmayabilir ve SMS filtreleme uzantısını devre dışı
bırakabilir. Saklanan verilerin silinmesini istemek için
keskinemirhan73@gmail.com adresine başvurulabilir.
