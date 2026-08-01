export class SecurityUtils {
  /**
   * Masks Personally Identifiable Information (PII) such as Credit Cards, TC Kimlik Numbers, and Phone Numbers
   * before sending data to external AI APIs.
   */
  static maskPII(text: string): string {
    if (!text) return text;

    let maskedText = text;

    // Mask Credit Card Numbers (16 digits with optional spaces/dashes)
    const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    maskedText = maskedText.replace(ccRegex, '[KREDİ_KARTI_GİZLENDİ]');

    // Mask TC Kimlik Numbers (11 digits, strictly starting with non-zero, but we'll use a simple 11 digit regex)
    const tcRegex = /\b[1-9]\d{10}\b/g;
    maskedText = maskedText.replace(tcRegex, '[TC_KİMLİK_GİZLENDİ]');

    // Mask Phone Numbers (Common Turkish formats e.g. +90 5xx, +905xx, 05xx, 5xx)
    const phoneRegex = /(^|[^\d])(?:(?:\+?90)[ -]?|0?)5\d{2}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}(?=$|[^\d])/g;
    maskedText = maskedText.replace(
      phoneRegex,
      (_match, prefix: string) => `${prefix}[TELEFON_GİZLENDİ]`,
    );

    // Mask Email Addresses
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    maskedText = maskedText.replace(emailRegex, '[E-POSTA_GİZLENDİ]');

    // Mask OTP / Verification Codes (e.g. 4 to 8 digit standalone numbers, or G-123456)
    // This is crucial to protect 2FA codes (Doğrulama kodları)
    const otpRegex = /\b(G-\d{4,8}|\d{4,8})\b/g;
    maskedText = maskedText.replace(otpRegex, '[DOĞRULAMA_KODU_GİZLENDİ]');

    return maskedText;
  }

  /**
   * Extracts all http and https URLs from a given text.
   */
  static extractUrls(text: string): string[] {
    if (!text) return [];
    // Basic regex for http/https URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];

    const cleanedUrls = matches
      .map(url => url.replace(/[)\]}>.,!?;:'"]+$/g, ''))
      .filter(Boolean);
    return Array.from(new Set(cleanedUrls));
  }
}
