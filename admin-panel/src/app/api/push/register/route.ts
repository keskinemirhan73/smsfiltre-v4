import { NextResponse } from 'next/server';
import { registerToken } from '../../admin/send-notification/route';

export async function POST(request: Request) {
  try {
    const { token, platform, deviceName } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Push token zorunludur.' }, { status: 400 });
    }

    registerToken(token);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://smsfiltre-v4.onrender.com';
    await fetch(`${API_BASE}/api/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform, deviceName }),
    }).catch(() => {});

    console.log(`[Push Register] Device registered: ${deviceName} (${platform}) - ${token}`);

    return NextResponse.json({
      success: true,
      message: 'Push token başarıyla kaydoldu.',
    });
  } catch (error) {
    console.error('Push register error:', error);
    return NextResponse.json({ error: 'Kayıt başarısız.' }, { status: 500 });
  }
}
