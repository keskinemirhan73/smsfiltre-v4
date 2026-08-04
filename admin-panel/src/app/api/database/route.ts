import { NextResponse } from 'next/server';

export async function GET() {
  const defaultDatabase = {
    blacklistedNumbers: [
      "+905550000001",
      "+905329999999",
      "B001",
      "B002",
      "B003"
    ],
    spamKeywords: [
      "bet", "casino", "bahis", "kumar", "bonus", "çevrimsiz", "deneme bonusu",
      "freespin", "freebet", "hoşgeldin bonusu", "kayıp bonusu", "discount", "slot",
      "rulet", "canlı casino", "kredi onayı", "hesabınız bloke", "yasa dışı", "çekiliş",
      "kargonuz teslim edilemedi", "kargo iade", "icra takibi", "dosyanız hukuk bürosuna",
      "ödül kazandınız", "hesabınız kısıtlandı", "şifrenizi sıfırlayın", "hediye çeki",
      "ceza dosyanız var", "uzlaştırma bürosu", "maaşınıza haciz gelecek",
      "dosyanız sisteme düşmüştür", "günde 5.000 tl kazanın", "evden kolay para",
      "beğeni yaparak gelir elde edin", "taahhüdünüz bitti", "ptt kargo",
      "adresinizi güncelleyin", "adresinizi guncelleyin", "adresiniz doğrulanamadı",
      "adresiniz dogrulanamadi", "sma hastası", "sma hastasi", "sadakanızla",
      "sadakanizla", "valilik denetimli"
    ],
    scamUrls: [
      "is.gd", "cutt.ly", "bit.ly", "tinyurl.com", "t.co", "t.ly", "rb.gy",
      "shorturl", "kisa.link", "t.me", "ngrok-free.app", "pages.dev"
    ],
    regexPatterns: [
      "b[.\\s]*a[.\\s]*h[.\\s]*i[.\\s]*s",
      "b[.\\s]*o[.\\s]*n[.\\s]*u[.\\s]*s",
      "c[.\\s]*a[.\\s]*s[.\\s]*i[.\\s]*n[.\\s]*o",
      "f[.\\s]*r[.\\s]*e[.\\s]*e[.\\s]*b[.\\s]*e[.\\s]*t",
      "TR\\d{24}",
      "http.*\\.(xyz|cc|top|club|site|gd|me|fun|icu|info)"
    ],
    version: "1.0.8",
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(defaultDatabase, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
