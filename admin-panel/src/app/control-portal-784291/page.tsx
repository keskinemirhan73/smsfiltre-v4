'use client';
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Users,
  Settings, Moon, Sun, CheckCircle, XCircle, Lock, LogIn, Bell, Send
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface PendingItem {
  id: string;
  title: string;
}

export default function SecretAdminPortal() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Auth state
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
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
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
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

  const fetchDashboardData = async (pass: string, code?: string) => {
    try {
      const authVal = code ? `${pass}:${code}` : pass;
      const headers = { 'Authorization': `Bearer ${authVal}` };
      
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
    await fetchDashboardData(password, totpCode);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    try {
      await fetch(`${API_BASE}/api/${action}/${id}`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${password}:${totpCode}` }
      });
      await fetchDashboardData(password, totpCode);
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
      const res = await fetch(`/api/admin/send-notification`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${password}:${totpCode}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: notifTitle, body: notifBody })
      });
      const data = await res.json();
      if (res.ok) {
        setNotifStatus({ type: 'success', msg: data.message });
        setNotifTitle('');
        setNotifBody('');
        fetchDashboardData(password, totpCode);
      } else {
        setNotifStatus({ type: 'error', msg: data.error || 'Hata' });
      }
    } catch {
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
            Gizli Yönetici Portalı
          </h1>
          <p className="text-xs text-center text-gray-500 mb-6">FiltreAI Siber Güvenlik Kontrol Paneli</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Yönetici Şifresi
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Yönetici şifreniz..."
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                required
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Google Authenticator (2FA Kodu)
              </label>
              <input 
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6 Haneli Doğrulama Kodu (Örn: 123456)"
                className={`w-full px-4 py-3 rounded-xl border font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-indigo-400' : 'bg-gray-50 border-gray-300 text-indigo-600'}`}
              />
            </div>

            {loginError && <p className="text-rose-500 text-sm text-center">Hatalı şifre veya 2FA kodu!</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" /> 2FA Doğrula ve Giriş Yap
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
            <h1 className="text-2xl font-bold tracking-tight">FiltreAI Yönetici Portalı</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sistem Durumu: Gizli Erişim Modu & 2FA Aktif</p>
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

          {/* BROADCAST PUSH NOTIFICATION CARD */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <Bell className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Canlı Push Bildirimi Gönder</h2>
                <p className="text-xs text-gray-400">Tüm cihazlara anında uyarı veya duyuru iletin</p>
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Bildirim Başlığı</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Örn: ⚠️ Yeni Kargo Oltalama Uyarısı"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Bildirim İçeriği</label>
                <textarea
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="Örn: PTT Kargo adı altında gelen iade linklerine tıklamayın."
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                  required
                />
              </div>

              {notifStatus && (
                <div className={`p-3 rounded-xl text-sm font-medium ${notifStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                  {notifStatus.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingNotif}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
              >
                {isSendingNotif ? (
                  <span>Gönderiliyor...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Tüm Cihazlara Yayınla
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">Kural Dağılımı</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">En Çok Bildirilenler</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#4b5563'} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="sikayet" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* PENDING APPROVALS LIST */}
        <div className={`p-6 rounded-2xl border h-fit ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
            <span>Onay Bekleyenler</span>
            <span className="text-xs px-2.5 py-1 bg-amber-500/20 text-amber-500 rounded-full font-semibold">
              {pendingItems.length} Yeni
            </span>
          </h2>
          
          {pendingItems.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Bekleyen kural bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="font-semibold text-sm truncate">{item.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleAction(item.id, 'approve')}
                      disabled={loadingItems[item.id]}
                      className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={loadingItems[item.id]}
                      className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
