import type { ThreatDatabaseShape } from './threatCloudPolicy';

export type AnalysisLanguage = 'tr' | 'en';

export interface LocalAnalysisResult {
  riskLevel: 'Düşük' | 'Orta' | 'Yüksek' | 'Low' | 'Medium' | 'High';
  threatType: string;
  recommendation: string;
  cached: false;
  analysisEngine: 'on-device-rules-v1';
}

const URGENCY_MARKERS = [
  'hemen', 'acil', 'son şans', 'hesabınız bloke', 'şifrenizi', 'doğrulama kodu',
  'urgent', 'immediately', 'last chance', 'account suspended', 'password', 'verification code',
];

export function analyzeMessageLocally(
  text: string,
  database: ThreatDatabaseShape,
  language: AnalysisLanguage,
): LocalAnalysisResult {
  const normalized = text.toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');
  const suspiciousUrl = database.scamUrls.some(domain => normalized.includes(domain.toLowerCase()));
  const spamKeyword = database.spamKeywords.some(keyword => normalized.includes(keyword.toLocaleLowerCase('tr-TR')));
  const regexMatch = database.regexPatterns.some(pattern => new RegExp(pattern, 'i').test(normalized));
  const urgencyMatch = URGENCY_MARKERS.some(marker => normalized.includes(marker));

  if (suspiciousUrl) {
    return result(language, 'high', 'link');
  }

  if (spamKeyword || regexMatch) {
    return result(language, 'high', 'spam');
  }

  if (urgencyMatch) {
    return result(language, 'medium', 'urgency');
  }

  return result(language, 'low', 'none');
}

function result(
  language: AnalysisLanguage,
  level: 'low' | 'medium' | 'high',
  type: 'link' | 'spam' | 'urgency' | 'none',
): LocalAnalysisResult {
  const translations = language === 'en'
    ? {
        levels: { low: 'Low', medium: 'Medium', high: 'High' } as const,
        types: {
          link: 'Suspicious Link',
          spam: 'Spam or Scam Pattern',
          urgency: 'Urgency or Credential Request',
          none: 'No Clear Threat',
        },
        recommendations: {
          high: 'Do not open links or share personal information. Delete the message if you do not recognize the sender.',
          medium: 'Verify the sender through an official channel before taking action.',
          low: 'No clear threat was found. Stay cautious with unexpected links or requests.',
        },
      }
    : {
        levels: { low: 'Düşük', medium: 'Orta', high: 'Yüksek' } as const,
        types: {
          link: 'Şüpheli Bağlantı',
          spam: 'Spam veya Dolandırıcılık İşareti',
          urgency: 'Aciliyet veya Bilgi Talebi',
          none: 'Belirgin Tehdit Yok',
        },
        recommendations: {
          high: 'Bağlantıları açmayın ve kişisel bilgi paylaşmayın. Göndereni tanımıyorsanız mesajı silin.',
          medium: 'İşlem yapmadan önce göndereni resmi bir kanaldan doğrulayın.',
          low: 'Belirgin bir tehdit bulunmadı. Beklenmeyen bağlantı ve taleplere karşı yine de dikkatli olun.',
        },
      };

  return {
    riskLevel: translations.levels[level],
    threatType: translations.types[type],
    recommendation: translations.recommendations[level],
    cached: false,
    analysisEngine: 'on-device-rules-v1',
  };
}
