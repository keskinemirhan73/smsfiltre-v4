import { NextResponse } from 'next/server';

const EXPO_PUSH_TOKEN_PATTERN = /^(?:ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/;

export async function POST(request: Request) {
  try {
    const { token, platform, deviceName } = await request.json();
    if (
      typeof token !== 'string' ||
      token.length > 256 ||
      !EXPO_PUSH_TOKEN_PATTERN.test(token)
    ) {
      return NextResponse.json({ error: 'Geçerli bir push token zorunludur.' }, { status: 400 });
    }

    const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://smsfiltre-v4.onrender.com';
    const backendResponse = await fetch(`${API_BASE}/api/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform, deviceName }),
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'Push token kalıcı sunucuya kaydedilemedi.' },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Push token başarıyla kaydoldu.',
    });
  } catch (error) {
    console.error('Push register error:', error);
    return NextResponse.json({ error: 'Kayıt başarısız.' }, { status: 500 });
  }
}
