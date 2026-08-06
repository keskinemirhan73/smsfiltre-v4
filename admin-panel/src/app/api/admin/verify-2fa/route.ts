import { NextResponse } from 'next/server';
import { verifyTOTP } from '../../../../lib/totp';
import { getAdminSecrets, secretsMatch } from '../../../../lib/adminSecrets';

export async function POST(request: Request) {
  try {
    const { password, totpCode } = await request.json();
    const secrets = getAdminSecrets();
    if (!secrets) {
      return NextResponse.json(
        { error: 'Yönetici erişimi sunucuda yapılandırılmamış.' },
        { status: 503 },
      );
    }

    if (!secretsMatch(password, secrets.password)) {
      return NextResponse.json({ error: 'Yönetici şifresi hatalı!' }, { status: 401 });
    }

    if (!verifyTOTP(totpCode, secrets.totpSecret)) {
      return NextResponse.json({
        error: 'Google Authenticator 2FA Kodu Hatalı veya Süresi Doldu!'
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '2FA Doğrulaması Başarılı! Panele giriş yapıldı.' 
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: 'Doğrulama sırasında sunucu hatası oluştu.' }, { status: 500 });
  }
}
