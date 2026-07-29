const SIGNAL_DEFINITIONS = [
  {
    name: 'gambling',
    score: 5,
    matches: ({ normalized, compact }) =>
      /\b(bahis|casino|kumar|iddaa|betting|slot)\b/u.test(normalized) ||
      /(bahis|casino|kumar|iddaa)/u.test(compact),
  },
  {
    name: 'link',
    score: 2,
    matches: ({ original }) =>
      /(?:https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|t\.co\/)/iu.test(
        original,
      ),
  },
  {
    name: 'credential',
    score: 3,
    matches: ({ normalized }) =>
      /\b(sifre(?:niz|nizi)?|parola(?:niz|nizi)?|giris bilgisi|kimlik bilgisi|tc kimlik|hesabiniza giris)\b/u.test(
        normalized,
      ),
  },
  {
    name: 'urgency',
    score: 2,
    matches: ({ normalized }) =>
      /\b(hemen|acilen|son uyari|askiya alindi|kapanacak|kapatilacak|iptal edilecek|24 saat|bugun son)\b/u.test(
        normalized,
      ),
  },
  {
    name: 'impersonation',
    score: 2,
    matches: ({ normalized }) =>
      /\b(banka|e devlet|edevlet|ptt|vergi dairesi|savcilik|polis|kargo)\b/u.test(
        normalized,
      ),
  },
  {
    name: 'reward',
    score: 2,
    matches: ({ normalized }) =>
      /\b(kazandiniz|odul|hediye|bedava|bonus|cekilis)\b/u.test(normalized),
  },
  {
    name: 'financial',
    score: 2,
    matches: ({ normalized }) =>
      /\b(iban|kredi|borc|odeme yap|para gonder|havale|kart bilgisi)\b/u.test(
        normalized,
      ),
  },
  {
    name: 'otp',
    score: 2,
    matches: ({ normalized }) =>
      /\b(dogrulama kodu(?:nuz|nu)?|giris kodu(?:nuz|nu)?|tek kullanimlik kod|otp)\b/u.test(
        normalized,
      ),
  },
  {
    name: 'bulk-spam',
    score: 1,
    matches: ({ normalized }) =>
      /\b(kampanya|firsat|uyelik|abonelik|reklam|indirim)\b/u.test(normalized),
  },
];

function normalizeText(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ı/g, 'i')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}:/.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectSignals(text) {
  const normalized = normalizeText(text);
  const context = {
    original: text,
    normalized,
    compact: normalized.replace(/[^\p{L}\p{N}]/gu, ''),
  };

  return SIGNAL_DEFINITIONS.filter((definition) =>
    definition.matches(context),
  ).map(({ name, score }) => ({ name, score }));
}

function getRiskLevel(score, signalNames) {
  const hasPhishingCombination =
    signalNames.includes('link') &&
    (signalNames.includes('credential') ||
      signalNames.includes('impersonation') ||
      signalNames.includes('urgency'));

  if (
    hasPhishingCombination ||
    (score >= 9 && !signalNames.includes('gambling'))
  ) {
    return 'Çok Yüksek';
  }
  if (score >= 4) return 'Yüksek';
  if (score >= 2) return 'Orta';
  return 'Düşük';
}

function getThreatType(signalNames, riskLevel) {
  if (signalNames.includes('gambling')) {
    return 'Yasa dışı bahis veya kumar reklamı';
  }
  if (
    signalNames.includes('link') &&
    (signalNames.includes('credential') ||
      signalNames.includes('impersonation'))
  ) {
    return 'Oltalama ve hesap ele geçirme riski';
  }
  if (signalNames.includes('otp')) {
    return 'Doğrulama kodu içeren mesaj';
  }
  if (
    signalNames.includes('reward') ||
    signalNames.includes('financial') ||
    signalNames.includes('urgency')
  ) {
    return 'Dolandırıcılık veya yanıltıcı teklif işaretleri';
  }
  if (signalNames.includes('link')) {
    return 'Bağlantı içeren mesaj';
  }
  if (riskLevel === 'Orta') {
    return 'İstenmeyen reklam işaretleri';
  }
  return 'Belirgin tehdit işareti bulunamadı';
}

function getRecommendation(riskLevel) {
  if (riskLevel === 'Çok Yüksek') {
    return 'Bağlantıya dokunmayın, bilgi paylaşmayın ve kurumu yalnızca resmî kanallarından doğrulayın.';
  }
  if (riskLevel === 'Yüksek') {
    return 'Mesaja itibar etmeyin, bağlantılara dokunmayın ve göndericiyi engellemeyi değerlendirin.';
  }
  if (riskLevel === 'Orta') {
    return 'İşlem yapmadan önce göndericiyi ve mesajdaki bilgileri bağımsız olarak doğrulayın.';
  }
  return 'Yine de tanımadığınız göndericilerden gelen bağlantı ve taleplere dikkat edin.';
}

function analyzeMessage(text) {
  const matchedSignals = collectSignals(text);
  const score = matchedSignals.reduce(
    (total, signal) => total + signal.score,
    0,
  );
  const signals = matchedSignals.map((signal) => signal.name);
  const riskLevel = getRiskLevel(score, signals);

  return {
    riskLevel,
    threatType: getThreatType(signals, riskLevel),
    recommendation: getRecommendation(riskLevel),
    signals,
  };
}

function isReportEligible(text) {
  const result = analyzeMessage(text);
  return result.riskLevel === 'Yüksek' || result.riskLevel === 'Çok Yüksek';
}

module.exports = {
  analyzeMessage,
  isReportEligible,
};
