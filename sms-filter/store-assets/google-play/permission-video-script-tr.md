# Google Play SMS izin videosu

Hedef süre: 60-90 saniye. Tek kesintisiz ekran kaydı tercih edilir. Bildirimlerde veya SMS ekranında gerçek kişisel bilgi göstermeyin.

1. Uygulamanın verisini temizleyin veya yeni kurulmuş production build'i açın.
2. Ekran kaydını başlatın ve FiltreAI'yi ana ekrandan açın.
3. `SMS Korumasını Etkinleştir` açıklamasının tamamını birkaç saniye görünür tutun.
4. Açıklamada şu noktaların okunabildiğini gösterin:
   - Gönderici ve mesaj metni cihaz üzerinde analiz edilir.
   - SMS içerikleri otomatik olarak sunucuya gönderilmez.
   - Akıllı Analiz ve spam bildirimi yalnızca kullanıcı başlatınca sunucuya gider.
5. İlk denemede `Şimdi Değil` seçeneğine dokunun.
6. Uygulamanın çalışmaya devam ettiğini gösterin.
7. `Ayarlar > Android SMS Koruması > Gelen SMS İzni` yolunu açarak açıklamayı tekrar tetikleyin.
8. Bu kez `Devam Et` seçeneğine dokunun ve Android'in SMS izin penceresinde izin verin.
9. Başka bir telefondan test cihazına kişisel veri içermeyen şüpheli bir örnek SMS gönderin.
10. FiltreAI'nin `Yeni bir şüpheli SMS algılandı` güvenlik bildirimini gösterin.
11. Kısa bir seslendirme veya altyazı ile FiltreAI'nin SMS'i silmediğini; cihaz üzerinde analiz edip şüpheli içerik için uyarı verdiğini belirtin.

Play Console'a tercihen liste dışı YouTube bağlantısı ekleyin. Google Drive kullanılırsa bağlantının giriş istemeden görüntülenebildiğini gizli pencerede kontrol edin.
