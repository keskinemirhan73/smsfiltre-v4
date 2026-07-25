'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, BarChart3, Users, 
  Settings, Globe, Moon, Sun, CheckCircle, XCircle, Lock, LogIn, Bell, Send
} from 'lucide-react';

const TRANSLATIONS = {
  tr: {
    title: 'Oto-Pilot Yönetici Paneli',
    subtitle: 'Sistem Durumu: Aktif & Korunuyor',
    stats: 'Genel İstatistikler',
    totalBlocked: 'Engellenen Numara',
    spamKeywords: 'Spam Kelime',
    scamNumbers: 'Aktif Sistem',
    pending: 'Onay Bekleyenler',
    approve: 'Onayla',
    reject: 'Reddet',
    darkMode: 'Karanlık Mod',
    lightMode: 'Aydınlık Mod',
    language: 'Language',
    recentActivity: 'Sistemdeki Kelimeler (Son Eklenenler)',
    activeUsers: 'Veritabanı Durumu',
    loginTitle: 'Yönetici Girişi',
    loginDesc: 'Devam etmek için yönetici şifrenizi girin.',
    loginBtn: 'Giriş Yap',
    passwordPlaceholder: 'Şifre...',
    sendNotif: 'Toplu Bildirim Gönder',
    notifTitle: 'Bildirim Başlığı',
    notifBody: 'Bildirim İçeriği',
    sendBtn: 'Gönder',
    sending: 'Gönderiliyor...'
  },
  en: {
    title: 'Auto-Pilot Admin Panel',
    subtitle: 'System Status: Active & Protected',
    stats: 'Global Statistics',
    totalBlocked: 'Blocked Numbers',
    spamKeywords: 'Spam Keywords',
    scamNumbers: 'Active System',
    pending: 'Pending Approvals',
    approve: 'Approve',
    reject: 'Reject',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Dil',
    recentActivity: 'System Keywords (Recently Added)',
    activeUsers: 'Database Status',
    loginTitle: 'Admin Login',
    loginDesc: 'Enter your admin password to continue.',
    loginBtn: 'Login',
    passwordPlaceholder: 'Password...',
    sendNotif: 'Send Global Notification',
    notifTitle: 'Notification Title',
    notifBody: 'Notification Body',
    sendBtn: 'Send',
    sending: 'Sending...'
  }
};

export default function AdminDashboard() {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [mounted, setMounted] = useState(false);
  
  // Auth state
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  // Data state
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [dbData, setDbData] = useState<{ spamKeywords: string[], blacklistedNumbers: string[] }>({
    spamKeywords: [], blacklistedNumbers: []
  });
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});
  
  // Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifStatus, setNotifStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchDashboardData = async (pass: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${pass}` };
      
      // Fetch Pending PRs
      const pendingRes = await fetch(`${API_BASE}/api/pending`, { headers });
      if (pendingRes.status === 401) {
        setLoginError(true);
        setIsAuthenticated(false);
        return false;
      }
      
      const pendingJson = await pendingRes.json();
      setPendingItems(Array.isArray(pendingJson) ? pendingJson : []);
      
      // Fetch Real DB Data
      const dbRes = await fetch(`${API_BASE}/api/database`, { headers });
      if (dbRes.ok) {
        const dbJson = await dbRes.json();
        setDbData(dbJson);
      }
      
      setIsAuthenticated(true);
      setLoginError(false);
      return true;
    } catch (e) {
      console.error(e);
      setLoginError(true);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchDashboardData(password);
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API_BASE}/api/${action}/${id}`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${password}` }
      });
      await fetchDashboardData(password);
    } catch (e) {
      console.error(e);
    }
    setLoadingItems(prev => ({ ...prev, [id]: false }));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;
    setIsSendingNotif(true);
    setNotifStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/send-notification`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: notifTitle, body: notifBody })
      });
      const data = await res.json();
      if (res.ok) {
        setNotifStatus({ type: 'success', msg: data.message || 'Başarıyla gönderildi.' });
        setNotifTitle('');
        setNotifBody('');
      } else {
        setNotifStatus({ type: 'error', msg: data.error || 'Gönderim başarısız.' });
      }
    } catch (e) {
      setNotifStatus({ type: 'error', msg: 'Sunucuya ulaşılamadı.' });
    }
    setIsSendingNotif(false);
    setTimeout(() => setNotifStatus(null), 5000);
  };

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
    // Attempt auto-login if password is saved in local storage (optional enhancement)
    const savedPass = localStorage.getItem('admin_pass');
    if (savedPass) {
      setPassword(savedPass);
      fetchDashboardData(savedPass).then(success => {
        if (success) setIsAuthenticated(true);
      });
    }
  }, []);
  
  // Save password when authenticated
  useEffect(() => {
    if (isAuthenticated && password) {
      localStorage.setItem('admin_pass', password);
    }
  }, [isAuthenticated, password]);

  if (!mounted) return null;

  const t = TRANSLATIONS[lang];

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className={`p-8 w-full max-w-md rounded-2xl shadow-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-500/20 rounded-full">
              <Lock className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
          <h1 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.loginTitle}
          </h1>
          <p className={`text-center mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t.loginDesc}
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                required
              />
            </div>
            
            {loginError && (
              <p className="text-rose-500 text-sm font-medium text-center">
                {lang === 'tr' ? 'Hatalı şifre veya bağlantı sorunu!' : 'Invalid password or connection error!'}
              </p>
            )}
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              {t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD SCREEN
  // ==========================================
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
                <p className="text-4xl font-black mt-1">{dbData.blacklistedNumbers.length}</p>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <Settings className="w-8 h-8 text-amber-500 mb-4" />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.spamKeywords}</p>
                <p className="text-4xl font-black mt-1">{dbData.spamKeywords.length}</p>
              </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <Users className="w-8 h-8 text-emerald-500 mb-4" />
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.activeUsers}</p>
                <p className="text-4xl font-black mt-1 text-emerald-500">ONLINE</p>
              </div>

            </div>
          </div>

          {/* NOTIFICATION CARD */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" /> {t.sendNotif}
            </h2>
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.notifTitle}</label>
                  <input 
                    type="text" required
                    value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.notifBody}</label>
                  <textarea 
                    required rows={3}
                    value={notifBody} onChange={e => setNotifBody(e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  />
                </div>
                {notifStatus && (
                  <div className={`p-3 rounded-xl text-sm ${notifStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {notifStatus.msg}
                  </div>
                )}
                <button 
                  type="submit" disabled={isSendingNotif}
                  className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${isSendingNotif ? 'opacity-70 bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                >
                  <Send className="w-4 h-4" />
                  {isSendingNotif ? t.sending : t.sendBtn}
                </button>
              </form>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">{t.recentActivity}</h2>
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              
              {dbData.spamKeywords.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Veritabanında henüz kelime yok.</div>
              ) : (
                dbData.spamKeywords.slice(-6).reverse().map((word, idx) => (
                  <div key={idx} className={`p-4 flex justify-between items-center border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> 
                        {word}
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {lang === 'tr' ? 'Veritabanına Eklendi (Aktif Koruma)' : 'Added to DB (Active Protection)'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full text-emerald-500 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      KAYITLI
                    </span>
                  </div>
                ))
              )}
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
                        {lang === 'tr' ? 'Kullanıcı Şikayeti / AI Tarafından İncelendi' : 'User Report / AI Analyzed'}
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
