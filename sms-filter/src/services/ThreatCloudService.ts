import { SecureStorage as AsyncStorage } from '../utils/SecureStorage';
import { createPublicJsonRequest } from './publicApiRequest';
import { isSameLocalDay, parseThreatDatabase, ThreatDatabaseShape } from './threatCloudPolicy';

const DB_KEY = '@ThreatCloud_Database';
const LAST_SYNC_KEY = '@ThreatCloud_LastSync';

export interface ThreatDatabase extends ThreatDatabaseShape {}

const DEFAULT_DB: ThreatDatabase = {
  blacklistedNumbers: [],
  spamKeywords: ['bet', 'casino', 'bahis', 'kumar', 'bonus', 'çevrimsiz', 'mt2', 'metin2', 'ep hediye', 'sms iptal', 'b011', 'b013', 'b015'],
  scamUrls: ['bit.ly', 'cutt.ly', 'kisa.link', 't.me'],
  regexPatterns: ['b[.\\s]*a[.\\s]*h[.\\s]*i[.\\s]*s', 'b[.\\s]*o[.\\s]*n[.\\s]*u[.\\s]*s', 'c[.\\s]*a[.\\s]*s[.\\s]*i[.\\s]*n[.\\s]*o'],
};

export class ThreatCloudService {
  /**
   * Buluttan en güncel veritabanını indirir (CDN/Hosting Yaklaşımı).
   * İleriye dönük en ucuz, en hızlı ve SDK gerektirmeyen (sıfır bloat) mimari budur.
   */
  static async syncDatabase(): Promise<boolean> {
    try {
      // Kurallar herkese açık, sürümlenmiş bir JSON dosyasından indirilir.
      const CLOUD_JSON_URL = 'https://raw.githubusercontent.com/keskinemirhan73/sms-filtre-db/refs/heads/main/database.json';
      
      const response = await fetch(CLOUD_JSON_URL, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`Threat database HTTP ${response.status}`);
      const cloudData = parseThreatDatabase(await response.json());

      // İndirilen/Yedek veriyi şifreli hafızaya (AsyncStorage) kaydet
      await AsyncStorage.setItem(DB_KEY, JSON.stringify(cloudData));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      return true;
    } catch (error) {
      console.warn('Cloud Sync Error (handled):', error);
      return false;
    }
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
