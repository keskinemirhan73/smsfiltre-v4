import { SecureStorage as AsyncStorage } from '../utils/SecureStorage';
import { createPublicJsonRequest } from './publicApiRequest';
import { isSameLocalDay, parseThreatDatabase, ThreatDatabaseShape } from './threatCloudPolicy';

const DB_KEY = '@ThreatCloud_Database';
const LAST_SYNC_KEY = '@ThreatCloud_LastSync';

export interface ThreatDatabase extends ThreatDatabaseShape {}

const DEFAULT_DB: ThreatDatabase = {
  blacklistedNumbers: [],
  spamKeywords: [
    'bahis', 'casino', 'slot', 'rulet', 'jackpot', 'iddaa', 'freespin', 'freebet',
    'deneme bonusu', 'hoşgeldin bonusu', 'hosgeldin bonusu', 'çevrim şartsız', 'cevrim sartsiz',
    'kayıp bonusu', 'yatırım bonusu', 'sweet bonanza', 'vdcasino', 'sahabet', 'matbet',
    'ptt kargo', 'adresinizi güncelleyin', 'adresinizi guncelleyin', 'adresiniz doğrulanamadı',
    'adresiniz dogrulanamadi', 'kargonuz teslim', 'iade edildi', 'gümrükte takıldı', 'gumrukte takildi',
    'ceza dosyası', 'ceza dosyasi', 'icra takibi', 'dosyanız savcılığa', 'hesabınız bloke',
    'sma hastası', 'sma hastasi', 'sadakanızla', 'sadakanizla', 'valilik denetimli', 'sms iptal',
    'vikingmt2', 'nesne marketi', '50.000em', '50000em', 'ret ultr', 'ret yaz', 'mt2', 'pvp server',
    'b011', 'b013', 'b015', 'b018', 'b021', 'b043', 'b356', 'b372', 'b001', 'b002'
  ],
  scamUrls: [
    'is.gd', 'cutt.ly', 'bit.ly', 'tinyurl.com', 't.co', 't.ly', 'rb.gy',
    'shorturl', 'kisa.link', 't.me', 'ngrok-free.app', 'pages.dev'
  ],
  regexPatterns: [
    'b[.\\s]*a[.\\s]*h[.\\s]*i[.\\s]*s',
    'b[.\\s]*o[.\\s]*n[.\\s]*u[.\\s]*s',
    'c[.\\s]*a[.\\s]*s[.\\s]*i[.\\s]*n[.\\s]*o',
    'f[.\\s]*r[.\\s]*e[.\\s]*e[.\\s]*b[.\\s]*e[.\\s]*t',
    'TR\\d{24}',
    'http.*\\.(xyz|cc|top|club|site|gd|me|fun|icu|info)'
  ],
};

export class ThreatCloudService {
  /**
   * Buluttan en güncel veritabanını indirir (CDN/Hosting Yaklaşımı).
   * İleriye dönük en ucuz, en hızlı ve SDK gerektirmeyen (sıfır bloat) mimari budur.
   */
  static async syncDatabase(): Promise<boolean> {
    const cloudUrls = [
      'https://filtreai.vercel.app/api/database',
      'https://cdn.jsdelivr.net/gh/keskinemirhan73/sms-filtre-db@main/database.json',
      'https://raw.githubusercontent.com/keskinemirhan73/sms-filtre-db/main/database.json',
    ];

    for (const url of cloudUrls) {
      try {
        const response = await fetch(url, {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (response.ok) {
          const cloudData = parseThreatDatabase(await response.json());
          await AsyncStorage.setItem(DB_KEY, JSON.stringify(cloudData));
          await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
          return true;
        }
      } catch (e) {
        console.warn(`Threat DB fetch failed for ${url}:`, e);
      }
    }

    return false;
  }

  /**
   * Cihazda kayıtlı en son veritabanını getirir.
   */
  static async getDatabase(): Promise<ThreatDatabase> {
    try {
      const data = await AsyncStorage.getItem(DB_KEY);
      if (data) {
        return parseThreatDatabase(JSON.parse(data));
      }
    } catch (e) {
      console.warn('DB Read Error (handled):', e);
    }
    return DEFAULT_DB;
  }

  /**
   * Son güncellenme tarihini okunabilir formatta döner.
   */
  static async getLastSyncDate(): Promise<string> {
    try {
      const dateStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (!dateStr) return 'Hiç güncellenmedi';
      
      const date = new Date(dateStr);
      const today = new Date();
      
      if (Number.isNaN(date.getTime())) return 'Bilinmiyor';
      const isToday = isSameLocalDay(date, today);
      const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) {
        return `Bugün ${timeStr}`;
      } else {
        return `${date.toLocaleDateString('tr-TR')} ${timeStr}`;
      }
    } catch (e) {
      return 'Bilinmiyor';
    }
  }

  /**
   * Cihazın Push Notification Token'ını sunucuya kaydeder.
   */
  static async registerPushToken(token: string): Promise<boolean> {
    try {
      const BACKEND_URL = 'https://smsfiltre-v4.onrender.com/api/push-token';
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        ...createPublicJsonRequest({ token }),
      });
      return response.ok;
    } catch (error) {
      console.warn('Push token register error:', error);
      return false;
    }
  }
  /**
   * Checks if a given URL is present in the ThreatCloud scamUrls list.
   * Returns true if the URL is dangerous (scam/phishing).
   */
  static async checkUrlSecurity(url: string): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      const lowerUrl = url.toLowerCase();
      // Check if any scam URL keyword/domain is part of this URL
      for (const scamDomain of db.scamUrls) {
        if (lowerUrl.includes(scamDomain.toLowerCase())) {
          return true; // Dangerous
        }
      }
      return false; // Safe
    } catch (e) {
      console.warn('URL check error:', e);
      return false;
    }
  }
}
