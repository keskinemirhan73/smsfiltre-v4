'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, BarChart3, Users, 
  Settings, Globe, Moon, Sun, CheckCircle, XCircle 
} from 'lucide-react';

const TRANSLATIONS = {
  tr: {
    title: 'Oto-Pilot Yönetici Paneli',
    subtitle: 'Sistem Durumu: Aktif & Korunuyor',
    stats: 'Genel İstatistikler',
    totalBlocked: 'Engellenen Mesaj',
    spamKeywords: 'Spam Kelime',
    scamNumbers: 'Dolandırıcı Numara',
    pending: 'Onay Bekleyenler',
    approve: 'Onayla',
    reject: 'Reddet',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    language: 'Language',
    recentActivity: 'Son Aktiviteler',
    activeUsers: 'Aktif Kullanıcı'
  },
  en: {
    title: 'Auto-Pilot Admin Panel',
    subtitle: 'System Status: Active & Protected',
    stats: 'Global Statistics',
    totalBlocked: 'Blocked Messages',
    spamKeywords: 'Spam Keywords',
    scamNumbers: 'Scam Numbers',
    pending: 'Pending Approvals',
    approve: 'Approve',
    reject: 'Reject',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Dil',
    recentActivity: 'Recent Activity',
    activeUsers: 'Active Users'
  }
};

export default function AdminDashboard() {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [mounted, setMounted] = useState(false);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pending`);
      const data = await res.json();
      setPendingItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API_BASE}/api/${action}/${id}`, { method: 'POST' });
      await fetchPending();
    } catch (e) {
      console.error(e);
    }
    setLoadingItems(prev => ({ ...prev, [id]: false }));
  };

  useEffect(() => {
    setMounted(true);
    // Cihazın varsayılan temasını al (İsteğe bağlı)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
    fetchPending();
  }, []);

  if (!mounted) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* HEADER */}
      <header className={`px-8 py-6 flex justify-between items-center border-b ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.subtitle}</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Globe className="w-4 h-4" />
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-slate-700'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: STATS */}
        <div className="lg:col-span-2 space-y-8">
          
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> {t.stats}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <ShieldAlert className="w-8 h-8 text-rose-500 mb-4" />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.totalBlocked}</p>
                <p className="text-4xl font-black mt-1">1.284</p>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <Settings className="w-8 h-8 text-amber-500 mb-4" />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.spamKeywords}</p>
                <p className="text-4xl font-black mt-1">42</p>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <Users className="w-8 h-8 text-emerald-500 mb-4" />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.activeUsers}</p>
                <p className="text-4xl font-black mt-1">856</p>
              </div>

            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">{t.recentActivity}</h2>
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              {[1,2,3,4].map((i) => (
                <div key={i} className={`p-4 flex justify-between items-center border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> 
                      {i === 1 ? 'deneme bonusu' : i === 2 ? '+90 555 123 4567' : i === 3 ? 't.me/bet' : 'kredi onaylandı'}
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {i * 12} {lang === 'tr' ? 'kişi tarafından engellendi' : 'times blocked'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    {i} {lang === 'tr' ? 'dk önce' : 'mins ago'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PENDING APPROVALS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            {t.pending}
          </h2>
          
          <div className="space-y-4">
            
            {pendingItems.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {lang === 'tr' ? 'Bekleyen şikayet yok' : 'No pending reports'}
                </p>
              </div>
            ) : (
              pendingItems.map((item) => (
                <div key={item.id} className={`p-5 rounded-2xl border ${isDark ? 'bg-gray-900 border-amber-500/30' : 'bg-white border-amber-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-amber-500">"{item.keyword}"</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {lang === 'tr' ? '5+ kullanıcı şikayeti / AI İncelendi' : '5+ user reports / AI Analyzed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(item.id, 'approve')}
                      disabled={loadingItems[item.id]}
                      className={`flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors ${loadingItems[item.id] ? 'opacity-50' : ''}`}
                    >
                      <CheckCircle className="w-4 h-4" /> {t.approve}
                    </button>
                    <button 
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={loadingItems[item.id]}
                      className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-rose-400' : 'bg-gray-100 hover:bg-gray-200 text-rose-600'} ${loadingItems[item.id] ? 'opacity-50' : ''}`}
                    >
                      <XCircle className="w-4 h-4" /> {t.reject}
                    </button>
                  </div>
                </div>
              ))
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
