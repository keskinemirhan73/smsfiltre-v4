import React from 'react';
import { Shield, Smartphone, Brain, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'FiltreAI | Akıllı SMS Güvenlik Kalkanı',
  description: 'İstenmeyen mesajlara ve dolandırıcılara son. FiltreAI ile güvende kalın.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#071625] text-[#eef7ff] selection:bg-[#22d3ee] selection:text-[#071625] font-sans overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#071625]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#22d3ee] to-[#7cff5b] shadow-lg shadow-[#22d3ee]/20">
              <Shield className="text-[#071625]" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">FiltreAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold">
            <button className="bg-white text-[#071625] px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors shadow-lg">
              Uygulamayı İndir
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#22d3ee]/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#7cff5b] animate-pulse"></span>
            V5 Güncellemesi Yayında
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">
            Spam Mesajlara <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22d3ee] to-[#7cff5b]">Akıllı Güvenlik Kalkanı</span>
          </h1>
          
          <p className="text-xl text-[#a9bfd3] max-w-2xl mx-auto mb-12 leading-relaxed">
            Gelen mesajları cihazınızda çalışan kurallarla filtreleyin; şüpheli
            metinleri isterseniz çok katmanlı güvenlik kurallarıyla ayrıca analiz edin.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-[#22d3ee] to-[#7cff5b] text-[#071625] px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(34,211,238,0.3)]">
              <Smartphone size={24} />
              App Store&apos;dan İndir
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
              Özellikleri Keşfet
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-3xl border border-white/10 bg-[#0f2438] hover:border-[#22d3ee]/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-[#22d3ee]/20 flex items-center justify-center mb-6 text-[#22d3ee]">
                <Brain size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Akıllı Mesaj Analizi</h3>
              <p className="text-[#a9bfd3] leading-relaxed">
                Yalnızca sizin analiz düğmesine basarak gönderdiğiniz metinler
                bağlantı, aciliyet, kimlik avı ve spam işaretleri için incelenir.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-[#0f2438] hover:border-[#7cff5b]/50 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7cff5b]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-[#7cff5b]/20 flex items-center justify-center mb-6 text-[#7cff5b]">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Topluluk Destekli</h3>
              <p className="text-[#a9bfd3] leading-relaxed">
                Kullanıcıların gönüllü olarak bildirdiği spam işaretleri incelenip onaylandıktan sonra topluluk kurallarına eklenir.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-[#0f2438] hover:border-white/30 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-white">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Cihaz İçi Ana Filtreleme</h3>
              <p className="text-[#a9bfd3] leading-relaxed">
                Otomatik SMS filtreleme ve Akıllı Analiz cihazınızda çalışır.
                Yalnızca Spam Bildir işlemini özellikle başlattığınızda
                maskelenmiş rapor içeriği sunucuya gönderilir.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0f2438] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield size={20} />
            <span className="font-bold">FiltreAI © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-[#a9bfd3] font-medium">
            <Link href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Kullanım Koşulları</Link>
            <Link href="/admin" className="hover:text-[#22d3ee] transition-colors">Yönetici Paneli</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
