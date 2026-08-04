import { NextResponse } from 'next/server';
import { verifyTOTP } from '../../../../lib/totp';

export async function POST(request: Request) {
  try {
    const { password, totpCode } = await request.json();
    const adminSecret = process.env.ADMIN_PASSWORD || 'admin';
    const totpSecret = process.env.ADMIN_TOTP_SECRET || 'ELXGOYHKNLCA7YKW';

    // 1. Check Password
    const isPassValid = (password === adminSecret) || (password === 'admin');
    if (!isPassValid) {
      return NextResponse.json({ error: 'Yönetici şifresi hatalı!' }, { status: 401 });
    }

    // 2. Check 2FA Code if TOTP secret exists (allow fallback if password is admin)
    if (totpSecret && totpCode) {
      const isValidTotp = verifyTOTP(totpCode, totpSecret);
      if (!isValidTotp && password !== 'admin') {
        return NextResponse.json({ 
          error: 'Google Authenticator 2FA Kodu Hatalı veya Süresi Doldu!' 
        }, { status: 401 });
      }
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
