import { Shield, Lock, FileText, CheckCircle, Mail, Database } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Gizlilik Politikası | FiltreAI',
  description: 'FiltreAI SMS Filtreleme Uygulaması Gizlilik Politikası',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#071625] text-[#eef7ff] selection:bg-[#22d3ee] selection:text-[#071625] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
             style={{ background: 'linear-gradient(135deg, rgba(15, 36, 56, 0.96), rgba(19, 47, 73, 0.92))' }}>
          
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none" 
               style={{ background: 'radial-gradient(circle at top left, rgba(34, 211, 238, 0.1), transparent 400px)' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#042232]"
                 style={{ background: 'linear-gradient(90deg, #22d3ee, #7cff5b)' }}>
              <Shield size={14} />
              Güvenlik Bildirgesi
            </div>
            
            <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Gizlilik Politikası
            </h1>
            <p className="mt-4 text-lg md:text-xl text-[#a9bfd3] font-medium max-w-2xl">
              FiltreAI olarak kişisel verilerinize ve gizliliğinize büyük önem veriyoruz. Sizi nasıl koruduğumuzu öğrenin.
            </p>
            <p className="mt-2 text-sm text-[#22d3ee] font-bold">
              Son Güncelleme: 29 Temmuz 2026
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-white/10 shadow-lg"
               style={{ background: 'rgba(15, 36, 56, 0.84)' }}>
            <Database className="w-8 h-8 text-[#22d3ee] mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Yerel SMS Filtreleme</h2>
            <p className="text-[#a9bfd3] leading-relaxed">
              Gelen SMS&apos;lerin gönderen ve mesaj metni, otomatik filtreleme
              sırasında cihazdaki yerel uzantı tarafından işlenir. Bu otomatik
              işlem mesaj içeriğini sunucumuza göndermez.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 shadow-lg"
               style={{ background: 'rgba(15, 36, 56, 0.84)' }}>
            <Lock className="w-8 h-8 text-[#7cff5b] mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">İsteğe Bağlı Bulut Özellikleri</h2>
            <p className="text-[#a9bfd3] leading-relaxed">
              Akıllı Analiz veya Spam Bildir özelliğini siz başlattığınızda ilgili
              mesaj metni ya da anahtar kelime HTTPS üzerinden işlenmek üzere
              sunucumuza gönderilir. Bu özellikler otomatik değildir.
            </p>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-2xl border border-white/10"
               style={{ background: 'rgba(8, 25, 42, 0.72)' }}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="text-[#22d3ee]" />
              1. Toplanan Bilgiler
            </h3>
            <ul className="space-y-3 text-[#a9bfd3] ml-4 list-none">
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-[#7cff5b] mt-1 shrink-0" />
                <span><strong>Akıllı analiz metni:</strong> Analiz düğmesine basarak gönderdiğiniz mesaj metni FiltreAI sunucusuna iletilir ve kural tabanlı analiz motoruyla incelenir. Metin başka bir yapay zekâ sağlayıcısına aktarılmaz. Mesaj metni ve analiz sonucu tekrar eden sorguları hızlandırmak amacıyla sunucudaki analiz önbelleğinde saklanır.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-[#7cff5b] mt-1 shrink-0" />
                <span><strong>Gönüllü spam bildirimleri:</strong> Bildirdiğiniz anahtar kelime veya metin, cihaz platformu, push token ve isteğin IP adresi kötüye kullanımı önlemek, raporu saymak ve topluluk kurallarını geliştirmek için saklanabilir.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-[#7cff5b] mt-1 shrink-0" />
                <span><strong>Push bildirim token&apos;ı:</strong> Bildirim izni verdiğinizde cihazınıza ait Expo push token; bildirim göndermek, puan ve rapor sayısı gibi uygulama içi profil özelliklerini sağlamak için saklanır.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-[#7cff5b] mt-1 shrink-0" />
                <span><strong>Rehber erişimi:</strong> İsterseniz bir kişiyi Beyaz Liste&apos;ye eklemek için cihaz rehberine erişim izni verebilirsiniz. Seçilen kişinin adı ve telefon numarası yalnızca cihazdaki filtre ayarına eklenir; rehber sunucuya yüklenmez.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={18} className="text-[#7cff5b] mt-1 shrink-0" />
                <span><strong>Toplanmayan veriler:</strong> Finansal bilgileriniz ve otomatik filtrelenen diğer mesajlar bulut özelliklerini siz başlatmadıkça sunucuya gönderilmez.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-white/10"
               style={{ background: 'rgba(8, 25, 42, 0.72)' }}>
            <h3 className="text-2xl font-bold text-white mb-4">
              2. Bilgilerin Kullanımı
            </h3>
            <p className="text-[#a9bfd3] leading-relaxed mb-4">
              Topladığımız sınırlı veriler yalnızca şu amaçlarla kullanılır:
            </p>
            <ul className="space-y-2 text-[#a9bfd3] list-disc list-inside ml-2">
              <li>Spam filtreleme algoritmamızı iyileştirmek</li>
              <li>İsteğiniz üzerine mesaj metnini kural tabanlı analiz motoruyla incelemek</li>
              <li>Yeni dolandırıcılık yöntemleri hakkında push bildirimi göndermek</li>
              <li>Rapor kötüye kullanımını IP adresi üzerinden sınırlamak</li>
              <li>Uygulamanın düzgün çalışmasını sağlamak ve hataları gidermek</li>
            </ul>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-[#22d3ee]/30"
               style={{ background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(124, 255, 91, 0.08))' }}>
            <h3 className="text-2xl font-bold text-white mb-4">
              3. Hizmet Sağlayıcılar, Saklama ve Güvenlik
            </h3>
            <p className="text-[#a9bfd3] leading-relaxed mb-4">
              Bulut özellikleri; Render üzerinde çalışan FiltreAI sunucusu,
              MongoDB Atlas veritabanı, Expo bildirim hizmeti ve
              tehdit kurallarını dağıtmak için GitHub altyapısını kullanabilir.
              Veriler aktarım sırasında HTTPS ile korunur ve satılmaz veya
              reklam takibi için kullanılmaz.
            </p>
            <p className="text-[#a9bfd3] leading-relaxed">
              Akıllı analiz metni ve sonucu, analiz önbelleğine eklendikten yaklaşık
              7 gün sonra otomatik olarak silinir. Push token&apos;ları, IP
              adresleri ve rapor kayıtları hizmetin çalışması için gerekli
              olduğu sürece veya silinme talebiniz işlenene kadar saklanabilir;
              bu diğer kayıtlar için şu anda sabit bir otomatik silme süresi
              uygulanmamaktadır.
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-[#22d3ee]/30"
               style={{ background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(124, 255, 91, 0.08))' }}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Mail className="text-[#22d3ee]" />
              4. Tercihleriniz, Silinme ve İletişim
            </h3>
            <p className="text-[#a9bfd3] leading-relaxed mb-4">
              Bildirim iznini cihaz ayarlarından kapatabilir, Akıllı Analiz ve Spam
              Bildir özelliklerini kullanmayabilir ve SMS filtreleme uzantısını
              devre dışı bırakabilirsiniz. Saklanan verilerinizin silinmesini
              istemek veya gizlilik politikası hakkında soru sormak için
              aşağıdaki adresten bize ulaşabilirsiniz.
            </p>
            <a href="mailto:keskinemirhan73@gmail.com" className="inline-flex items-center gap-2 text-[#071625] font-bold px-6 py-3 rounded-xl transition-transform hover:scale-105"
               style={{ background: 'linear-gradient(90deg, #22d3ee, #7cff5b)' }}>
              <Mail size={18} />
              keskinemirhan73@gmail.com
            </a>
          </div>
        </div>

        <footer className="text-center text-[#eef7ff]/60 text-sm py-8 border-t border-white/10">
          <p>© {new Date().getFullYear()} FiltreAI. Tüm hakları saklıdır.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="hover:text-[#22d3ee] transition-colors">Ana Sayfa</Link>
            <Link href="/terms" className="hover:text-[#22d3ee] transition-colors">Kullanım Koşulları</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
