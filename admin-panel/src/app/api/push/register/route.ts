import { NextResponse } from 'next/server';
import { registerToken } from '../../admin/send-notification/route';

export async function POST(request: Request) {
  try {
    const { token, platform, deviceName } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Push token zorunludur.' }, { status: 400 });
    }

    registerToken(token);
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
