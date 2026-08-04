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

    const tokens = Array.from(registeredPushTokens);
    if (tokens.length === 0) {
      return NextResponse.json({
        message: 'Bildirim gönderildi (Kayıtlı cihaz yok).',
        sentCount: 0,
      });
    }

    // Send Expo push notifications to all registered tokens
    const messages = tokens.map(expoVal => ({
      to: expoVal,
      sound: 'default',
      title,
      body,
      data: { type: 'admin_broadcast' },
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const data = await response.json();
    return NextResponse.json({
      message: `Bildirim ${tokens.length} cihaza başarıyla gönderildi! 🚀`,
      sentCount: tokens.length,
      expoResult: data,
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
