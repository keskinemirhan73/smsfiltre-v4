'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, BarChart3, Users, 
  Settings, Globe, Moon, Sun, CheckCircle, XCircle, Lock, LogIn, Bell, Send
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [mounted, setMounted] = useState(false);
  
  // Auth state
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  // Data state
  interface StatsData {
    pendingCount: number;
    approvedCount: number;
    deviceCount: number;
    recentNotifications: unknown[];
    topReported: unknown[];
  }
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [stats, setStats] = useState<StatsData>({
    pendingCount: 0,
    approvedCount: 0,
    deviceCount: 0,
    recentNotifications: [],
    topReported: []
  });
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  
  // Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifStatus, setNotifStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchDashboardData = async (pass: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${pass}` };
      
      const pendingRes = await fetch(`${API_BASE}/api/pending`, { headers });
      if (pendingRes.status === 401) {
        setLoginError(true);
        setIsAuthenticated(false);
        return false;
      }
      const pendingJson = await pendingRes.json();
      setPendingItems(Array.isArray(pendingJson) ? pendingJson : []);
      
      const statsRes = await fetch(`${API_BASE}/api/admin/stats`, { headers });
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
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

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
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
        setNotifStatus({ type: 'success', msg: data.message });
        setNotifTitle('');
        setNotifBody('');
        fetchDashboardData(password); // Refresh stats for notif history
      } else {
        setNotifStatus({ type: 'error', msg: data.error || 'Hata' });
      }
    } catch (e) {
      setNotifStatus({ type: 'error', msg: 'Sunucuya ulaşılamadı.' });
    }
    setIsSendingNotif(false);
    setTimeout(() => setNotifStatus(null), 5000);
  };

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  if (!mounted) return null;

  // Chart Data
  const pieData = [
    { name: 'Onaylı', value: stats.approvedCount, color: '#10b981' },
    { name: 'Bekleyen', value: stats.pendingCount, color: '#f59e0b' }
  ];
  const barData = (stats.topReported as Record<string, unknown>[] | undefined)?.map((item) => ({
    name: item.keyword,
    sikayet: item.reportCount
  })) || [];

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
            Yönetici Girişi
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-4 mt-8">
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre..."
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
              required
            />
            {loginError && <p className="text-rose-500 text-sm text-center">Hatalı şifre veya sunucu hatası!</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" /> Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <header className={`px-8 py-6 flex justify-between items-center border-b ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">V5 Analitik Paneli</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sistem Durumu: MongoDB Atlas & Yapay Zeka Aktif</p>
          </div>
        </div>
        <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-slate-700'}`}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* STATS & CHARTS */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <ShieldAlert className="w-8 h-8 text-emerald-500 mb-4" />
              <p className="text-sm font-medium text-gray-400">Onaylı Kurallar</p>
              <p className="text-4xl font-black mt-1">{stats.approvedCount}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <Settings className="w-8 h-8 text-amber-500 mb-4" />
              <p className="text-sm font-medium text-gray-400">Bekleyen Kurallar</p>
              <p className="text-4xl font-black mt-1">{stats.pendingCount}</p>
            </div>
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <Users className="w-8 h-8 text-indigo-500 mb-4" />
              <p className="text-sm font-medium text-gray-400">Kayıtlı Cihaz (Push)</p>
              <p className="text-4xl font-black mt-1">{stats.deviceCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">Veritabanı Dağılımı</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">En Çok Şikayet Edilenler</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke={isDark ? '#4b5563' : '#9ca3af'} />
                    <Tooltip cursor={{fill: isDark ? '#374151' : '#f3f4f6'}} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '8px' }} />
                    <Bar dataKey="sikayet" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* NOTIFICATION CARD */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" /> Toplu Push Bildirimi Gönder
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form onSubmit={handleSendNotification} className="space-y-4">
                <input 
                  type="text" required placeholder="Bildirim Başlığı"
                  value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                />
                <textarea 
                  required rows={3} placeholder="Bildirim İçeriği (Örn: Yeni dolandırıcılık trendi: 'Kargo Takibi', topluluk kurallarından indirebilirsiniz.)"
                  value={notifBody} onChange={e => setNotifBody(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                />
                {notifStatus && (
                  <div className={`p-3 rounded-xl text-sm ${notifStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {notifStatus.msg}
                  </div>
                )}
                <button type="submit" disabled={isSendingNotif} className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${isSendingNotif ? 'opacity-70 bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
                  <Send className="w-4 h-4" /> {isSendingNotif ? 'Gönderiliyor...' : 'Tüm Cihazlara Gönder'}
                </button>
              </form>
              
              <div>
                <h3 className="font-bold text-gray-400 text-sm uppercase mb-3">Son Gönderilen Bildirimler</h3>
                <div className="space-y-3">
                  {(!stats.recentNotifications || (stats.recentNotifications as Record<string, unknown>[]).length === 0) ? (
                    <p className="text-gray-500 text-sm">Hiç bildirim gönderilmedi.</p>
                  ) : (
                    (stats.recentNotifications as Record<string, unknown>[]).map((n, i) => (
                      <div key={i} className={`p-3 rounded-lg text-sm border ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                        <p className="font-bold">{n.title as string}</p>
                        <p className="text-gray-400 mt-1 truncate">{n.body as string}</p>
                        <p className="text-xs text-emerald-500 mt-2">Başarılı: {n.successCount as number} | Hatalı: {n.failureCount as number}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
            Kullanıcı Şikayetleri
          </h2>
          
          <div className="space-y-4">
            {pendingItems.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-gray-500">Bekleyen kural yok</p>
              </div>
            ) : (
              pendingItems.map((item) => (
                <div key={item.id} className={`p-5 rounded-2xl border ${isDark ? 'bg-gray-900 border-amber-500/30' : 'bg-white border-amber-200'}`}>
                  <h3 className="font-bold text-lg text-amber-500 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">Gemini AI tarafından onaylanıp havuza düştü.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(item.id, 'approve')}
                      disabled={loadingItems[item.id]}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Onayla
                    </button>
                    <button 
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={loadingItems[item.id]}
                      className={`flex-1 py-2 rounded-lg font-medium flex justify-center items-center gap-2 ${isDark ? 'bg-gray-800 text-rose-400' : 'bg-gray-100 text-rose-600'}`}
                    >
                      <XCircle className="w-4 h-4" /> Reddet
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
