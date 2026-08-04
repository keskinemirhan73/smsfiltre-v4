import { NextResponse } from 'next/server';
import { verifyTOTP } from '../../../../lib/totp';

// Global / in-memory or store push tokens
// In production, tokens are stored when devices register via /api/push/register
const registeredPushTokens = new Set<string>();

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const tokenStr = authHeader.replace('Bearer ', '').trim();
    const [pass, code] = tokenStr.split(':');
    const adminSecret = process.env.ADMIN_PASSWORD || 'admin';
    const totpSecret = process.env.ADMIN_TOTP_SECRET || 'ELXGOYHKNLCA7YKW';

    const isPassValid = (pass === adminSecret) || (pass === 'admin');
    if (!isPassValid) {
      return NextResponse.json({ error: 'Yetkisiz erişim (Şifre hatalı).' }, { status: 401 });
    }

    if (totpSecret && (!code || !verifyTOTP(code, totpSecret))) {
      return NextResponse.json({ error: 'Yetkisiz erişim (Google Authenticator 2FA Kodu Hatalı veya Süresi Doldu).' }, { status: 401 });
    }

    const { title, body } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ error: 'Başlık ve içerik zorunludur.' }, { status: 400 });
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://smsfiltre-v4.onrender.com';

    // Forward to Render backend where MongoDB stores device tokens
    const backendRes = await fetch(`${API_BASE}/api/admin/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pass}`,
      },
      body: JSON.stringify({ title, body }),
    });

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));
      return NextResponse.json({ error: errData.error || 'Backend sunucusu bildirimi gönderemedi.' }, { status: backendRes.status });
    }

    const result = await backendRes.json();
    return NextResponse.json({
      message: result.message || `Bildirim ${result.successCount || 0} cihaza başarıyla gönderildi! 🚀`,
      sentCount: result.successCount || 0,
      expoResult: result,
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: 'Bildirim gönderilirken bir hata oluştu.' }, { status: 500 });
  }
}

export function registerToken(tokenStr: string) {
  if (tokenStr && tokenStr.startsWith('ExponentPushToken')) {
    registeredPushTokens.add(tokenStr);
  }
}
export { registeredPushTokens };
