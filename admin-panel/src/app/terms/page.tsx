import { FileText, AlertTriangle, CheckCircle, Scale, Users } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Kullanım Koşulları | FiltreAI',
  description: 'FiltreAI SMS Filtreleme Uygulaması Kullanım Koşulları',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#071625] text-[#eef7ff] selection:bg-[#22d3ee] selection:text-[#071625] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
             style={{ background: 'linear-gradient(135deg, rgba(15, 36, 56, 0.96), rgba(19, 47, 73, 0.92))' }}>
          
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none" 
               style={{ background: 'radial-gradient(circle at top right, rgba(124, 255, 91, 0.1), transparent 400px)' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#042232]"
                 style={{ background: 'linear-gradient(90deg, #7cff5b, #22d3ee)' }}>
              <Scale size={14} />
              Yasal Bildirim
            </div>
            
            <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Kullanım Koşulları
            </h1>
            <p className="mt-4 text-lg md:text-xl text-[#a9bfd3] font-medium max-w-2xl">
              FiltreAI uygulamasını kullanarak kabul etmiş olduğunuz kurallar ve yasal yükümlülükler.
            </p>
            <p className="mt-2 text-sm text-[#7cff5b] font-bold">
              Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-2xl border border-white/10"
               style={{ background: 'rgba(8, 25, 42, 0.72)' }}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Users className="text-[#22d3ee]" />
              1. Hizmetin Sağlanması
            </h3>
            <p className="text-[#a9bfd3] leading-relaxed mb-4">
              FiltreAI, kullanıcılarına SMS mesajlarını filtreleme, kural tabanlı güvenlik analizi yapma ve istenmeyen iletileri (spam) belirleme imkanı sunar.
            </p>
            <ul className="space-y-2 text-[#a9bfd3] list-disc list-inside ml-2">
              <li>Uygulama, %100 doğruluk garantisi vermez.</li>
              <li>Filtreleme işlemi yerel olarak (cihazda) ve isteğe bağlı olarak bulut API&apos;leri kullanılarak yapılır.</li>
              <li>Hizmet kesintisiz veya tamamen hatasız olmayabilir.</li>
            </ul>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg"
               style={{ background: 'rgba(15, 36, 56, 0.84)' }}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <CheckCircle className="text-[#7cff5b]" />
              2. Kullanıcı Sorumlulukları
            </h3>
            <p className="text-[#a9bfd3] leading-relaxed mb-4">
              Uygulamayı indiren ve kullanan herkes aşağıdaki koşulları kabul eder:
            </p>
            <ul className="space-y-3 text-[#a9bfd3] ml-4 list-none">
              <li className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-[#F59E0B] mt-1 shrink-0" />
                <span>Uygulamanın engellediği mesajlardan doğabilecek doğrudan veya dolaylı maddi/manevi zararlardan geliştiriciler sorumlu tutulamaz.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-[#F59E0B] mt-1 shrink-0" />
                <span>Kullanıcı, &quot;Spam Olarak Bildir&quot; özelliğini kötüye kullanamaz veya yanıltıcı bildirimlerde bulunamaz.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-[#F59E0B] mt-1 shrink-0" />
                <span>Hukuka aykırı veya yasadışı hiçbir içerik uygulamanın sunucularına kasıtlı olarak gönderilemez.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 md:p-8 rounded-2xl border border-[#22d3ee]/30"
               style={{ background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(124, 255, 91, 0.08))' }}>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="text-[#22d3ee]" />
              3. Değişiklikler
            </h3>
            <p className="text-[#a9bfd3] leading-relaxed">
              FiltreAI, bu kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar. Değişiklikler bu sayfada yayımlandığı anda yürürlüğe girer. Uygulamayı kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
            </p>
          </div>
        </div>

        <footer className="text-center text-[#eef7ff]/60 text-sm py-8 border-t border-white/10">
          <p>© {new Date().getFullYear()} FiltreAI. Tüm hakları saklıdır.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="hover:text-[#22d3ee] transition-colors">Ana Sayfa</Link>
            <Link href="/privacy" className="hover:text-[#22d3ee] transition-colors">Gizlilik Politikası</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
