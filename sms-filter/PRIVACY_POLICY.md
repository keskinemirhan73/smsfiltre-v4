# FiltreAI Gizlilik Politikası

**Yürürlük ve son güncelleme tarihi:** 1 Ağustos 2026

## 1. Yerel SMS filtreleme

iOS IdentityLookup uzantısı ile Android SMS alıcısının otomatik filtreleme
işlemleri cihaz üzerinde çalışır. Bu işlem sırasında gönderici ve mesaj metni
yerel kurallarla karşılaştırılır; otomatik filtrelenen mesajlar sunucuya
gönderilmez.

1.0.8 ve sonraki sürümlerde Akıllı Analiz cihaz üzerinde kural tabanlı olarak
çalışır. Analiz için seçilen mesaj metni ve sonuç sunucuya ya da başka bir yapay
zekâ sağlayıcısına gönderilmez.

1.0.7 ve önceki test sürümlerinde kullanıcı tarafından başlatılan Akıllı Analiz,
seçilen mesaj metnini sonuç üretmek için FiltreAI sunucusuna gönderebilir. Bu
eski sürümlerden gelen analiz metinlerinin sunucuda yeni bir kaydı oluşturulmaz;
daha önce oluşturulmuş kayıtlar en geç 7 gün içinde otomatik olarak silinir.

## 2. İsteğe bağlı olarak iletilen veriler

- **Gönüllü spam bildirimleri:** Kullanıcının bildirdiği anahtar kelime veya
  maskelenmiş mesaj metni; varsa push token ve isteğin IP adresiyle birlikte
  raporu saymak, kötüye kullanımı önlemek ve topluluk kurallarını geliştirmek
  amacıyla saklanabilir.
- **Push bildirim token'ı:** Kullanıcı bildirim izni verdiğinde Expo push token;
  bildirim göndermek, puan ve rapor sayısı gibi uygulama içi profil
  özelliklerini sağlamak için saklanır.
- **Rehber erişimi:** Kullanıcı isterse bir kişiyi Beyaz Liste'ye eklemek için
  cihaz rehberine erişim izni verebilir. Seçilen kişinin adı ve telefon numarası
  yalnızca cihazdaki filtre ayarına eklenir; rehber sunucuya yüklenmez.

1.0.8 ve sonraki sürümlerde Akıllı Analiz metni; tüm sürümlerde otomatik
filtrelenen mesajlar, rehber ve finansal bilgiler sunucuya gönderilmez.

## 3. Kullanım amaçları

Toplanan veriler; gönüllü spam raporlarını değerlendirmek, topluluk filtre
kurallarını iyileştirmek, bildirim
göndermek, kötüye kullanımı IP adresiyle sınırlamak ve hizmeti işletmek için
kullanılır. Veriler satılmaz ve reklam takibi amacıyla kullanılmaz.

## 4. Hizmet sağlayıcılar

Bulut özellikleri Render üzerinde çalışan FiltreAI sunucusu, MongoDB Atlas,
Expo bildirim hizmeti ve tehdit kurallarını dağıtmak için GitHub
altyapısını kullanabilir. Bu sağlayıcılar yalnızca ilgili hizmeti sunmak için
gerekli verileri işler.

## 5. Saklama ve güvenlik

Veriler aktarım sırasında HTTPS ile korunur. 1.0.8 ve sonraki sürümlerde Akıllı
Analiz metni cihazda kalır. 1.0.7 ve önceki test sürümlerinden daha önce
oluşturulmuş analiz kayıtları en geç 7 gün içinde otomatik olarak silinir. Push
token'ları, IP adresleri ve gönüllü spam raporları hizmet için gerekli
olduğu sürece veya silinme talebi işlenene kadar saklanabilir; bu diğer
kayıtlar için şu anda sabit bir otomatik silme süresi uygulanmamaktadır.

## 6. Kullanıcı tercihleri ve silinme

Kullanıcı bildirim iznini cihaz ayarlarından kapatabilir, Spam Bildir özelliğini
kullanmayabilir ve SMS filtreleme uzantısını devre dışı
bırakabilir. Saklanan verilerin silinmesini istemek için
keskinemirhan73@gmail.com adresine başvurulabilir.
