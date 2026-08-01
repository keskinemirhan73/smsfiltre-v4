import { SecureStorage as AsyncStorage } from '../utils/SecureStorage';
import { Platform } from 'react-native';
import { ThreatCloudService } from '../services/ThreatCloudService';

const APP_GROUP = 'group.com.filtreai.app';
const STORAGE_KEY = '@junkman_rules';
const SETTINGS_KEY = '@junkman_settings';
const STATS_KEY = '@junkman_stats';
const LEARNING_KEY = '@junkman_learning_db';

// ─── Types ───────────────────────────────────────────────────
export interface FilterRule {
  id: string;
  keyword: string;
  type: 'word' | 'regex';
  category: 'junk' | 'transaction' | 'promotion' | 'allowed';
  matchTarget: 'sender' | 'content' | 'both';
}

export interface AppSettings {
  underAttackMode: boolean;
  smartFilter: boolean;
  silentBlocking: boolean;
  filterScheduleEnabled: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  filterTransactions: boolean;
  filterPromotions: boolean;
  fraudFilter: boolean;
  databaseFilter: boolean;
  proactiveFilter: boolean;
  invalidNumberFilter: boolean;
  categoryMapping: {
    spam: string;
    transaction: string;
    promotion: string;
  };
  aiSensitivity: number;
  blockForeignNumbers: boolean;
  blockArabic: boolean;
  theme: 'system' | 'dark' | 'light';
  language: 'tr' | 'en';
  customFraudKeywords: string[];
  whitelist: string[];
  autoSyncEnabled: boolean;
  biometricLock?: boolean;
  dailySummaryOnly?: boolean;
}

export interface Stats {
  blockedCount: number;
  analyzedCount: number;
  transactionCount: number;
  promotionCount: number;
}

export interface LearningDB {
  words: { [word: string]: { spamCount: number; hamCount: number } };
  totalSpam: number;
  totalHam: number;
}

export interface HistoryItem {
  id: string;
  sender: string;
  preview: string;
  status: 'blocked' | 'transaction' | 'promotion' | 'allowed';
  category: string;
  timestamp: number;
}

const HISTORY_KEY = '@junkman_history';

export const THREAT_DATABASE = [
  // Yasa dışı bahis ve kumar
  { keyword: 'bahis', type: 'word' as const },
  { keyword: 'casino', type: 'word' as const },
  { keyword: 'canlı bahis', type: 'word' as const },
  { keyword: 'slot', type: 'word' as const },
  { keyword: 'rulet', type: 'word' as const },
  { keyword: 'jackpot', type: 'word' as const },
  { keyword: 'iddaa', type: 'word' as const },
  { keyword: 'freespin', type: 'word' as const },
  { keyword: 'hoşgeldin bonusu', type: 'word' as const },
  { keyword: 'çevrim şartsız', type: 'word' as const },
  { keyword: 'deneme bonusu', type: 'word' as const },
  { keyword: 'kayıp bonusu', type: 'word' as const },
  // Dolandırıcılık (İcra, Kargo, Kredi, Vergi, Abonelik)
  { keyword: 'icra takibi', type: 'word' as const },
  { keyword: 'dosyanız savcılığa', type: 'word' as const },
  { keyword: 'ceza dosyası', type: 'word' as const },
  { keyword: 'adresiniz doğrulanamadı', type: 'word' as const },
  { keyword: 'kargonuz teslim edilemedi', type: 'word' as const },
  { keyword: 'gümrükte takıldı', type: 'word' as const },
  { keyword: 'şüpheli işlem', type: 'word' as const },
  { keyword: 'hesabınız bloke', type: 'word' as const },
  { keyword: 'hesabınız kilitlendi', type: 'word' as const },
  { keyword: 'şifre sıfırlama talebiniz', type: 'word' as const },
  { keyword: 'ödemeniz alınamadı', type: 'word' as const },
  { keyword: 'aboneliğiniz askıya alındı', type: 'word' as const },
  { keyword: 'yatırım fırsatı', type: 'word' as const },
  { keyword: 'kripto yatırım', type: 'word' as const },
  { keyword: 'garanti kazanç', type: 'word' as const },
  { keyword: 'evden çalışarak', type: 'word' as const },
  { keyword: 'yarı zamanlı iş', type: 'word' as const },
  { keyword: 'hemen kazan', type: 'word' as const },
  { keyword: 'hediye çeki', type: 'word' as const },
  { keyword: 'şans oyunu', type: 'word' as const },
  { keyword: 'ödül kazandınız', type: 'word' as const },
  { keyword: 'kredi onayı', type: 'word' as const },
  { keyword: 'tıkla kazan', type: 'word' as const },
  // Kullanıcıdan Gelen Örneklerden Çıkarılanlar
  { keyword: 'freebet', type: 'word' as const },
  { keyword: 'cutt.ly', type: 'word' as const },
  { keyword: 'sms iptal için', type: 'word' as const },
  { keyword: 'vip kulüp', type: 'word' as const },
  { keyword: 'vip kulup', type: 'word' as const },
  { keyword: 'http.*\\.(xyz|cc|top|club|site)', type: 'regex' as const },
];

// ─── Defaults ────────────────────────────────────────────────
const defaultRules: FilterRule[] = [
  { id: '1', keyword: 'bahis', type: 'word', category: 'junk', matchTarget: 'content' },
  { id: '2', keyword: 'casino', type: 'word', category: 'junk', matchTarget: 'content' },
  { id: '4', keyword: 'onay kodu', type: 'word', category: 'transaction', matchTarget: 'content' },
  { id: '5', keyword: 'doğrulama', type: 'word', category: 'transaction', matchTarget: 'content' },
  { id: '6', keyword: 'şifreniz', type: 'word', category: 'transaction', matchTarget: 'content' },
  { id: '7', keyword: 'indirim', type: 'word', category: 'promotion', matchTarget: 'content' },
  { id: '8', keyword: 'kampanya', type: 'word', category: 'promotion', matchTarget: 'content' },
  { id: '9', keyword: 'fırsat', type: 'word', category: 'promotion', matchTarget: 'content' },
];

const defaultSettings: AppSettings = {
  underAttackMode: false,
  smartFilter: true,
  silentBlocking: true,
  filterScheduleEnabled: false,
  scheduleStart: '22:00',
  scheduleEnd: '08:00',
  filterTransactions: false,
  filterPromotions: false,
  fraudFilter: true,
  databaseFilter: true,
  proactiveFilter: true,
  invalidNumberFilter: false,
  categoryMapping: {
    spam: 'junk',
    transaction: 'transaction',
    promotion: 'promotion',
  },
  aiSensitivity: 0.8,
  blockForeignNumbers: false,
  blockArabic: false,
  theme: 'system',
  language: 'tr',
  customFraudKeywords: [],
  whitelist: [],
  autoSyncEnabled: true,
  biometricLock: false,
  dailySummaryOnly: false,
};

const defaultStats: Stats = {
  blockedCount: 0,
  analyzedCount: 0,
  transactionCount: 0,
  promotionCount: 0,
};

const defaultLearningDB: LearningDB = {
  words: {},
  totalSpam: 0,
  totalHam: 0,
};

const STOP_WORDS = new Set(['ve', 'ile', 'veya', 'ama', 'icin', 'için', 'bir', 'bu', 'da', 'de', 'ki', 'mi', 'daha', 'en', 'cok', 'çok', 'gibi', 'kadar', 'olan', 'var', 'yok', 'siz', 'biz']);

// ─── Naive Bayes Classifier ──────────────────────────────────
export class NaiveBayesClassifier {
  static async loadDB(): Promise<LearningDB> {
    try {
      const data = await AsyncStorage.getItem(LEARNING_KEY);
      return data ? JSON.parse(data) : defaultLearningDB;
    } catch { return defaultLearningDB; }
  }

  static async saveDB(db: LearningDB) {
    await AsyncStorage.setItem(LEARNING_KEY, JSON.stringify(db));
  }

  static tokenize(text: string): string[] {
    const cleanText = text.toLocaleLowerCase('tr-TR')
      .replace(/https?:\/\/[^\s]+/g, ' url ')
      .replace(/[^\w\sğüşöçı]/g, ' ')
      .replace(/\s+/g, ' ');
    
    return cleanText.split(' ')
      .filter(w => w.length > 2)
      .filter(w => !STOP_WORDS.has(w))
      .map(w => w.length > 6 ? w.substring(0, 6) : w); // pseudo-stemming
  }

  static async cleanup(db: LearningDB): Promise<LearningDB> {
    const keys = Object.keys(db.words);
    if (keys.length > 500) {
      // Sadece 1-2 kez geçmiş, ağırlığı düşük kelimeleri unut (Hafıza şişmesini/zehirlenmeyi önler)
      for (const key of keys) {
        if (db.words[key].spamCount + db.words[key].hamCount <= 2) {
          delete db.words[key];
        }
      }
    }
    return db;
  }

  static async train(message: string, isSpam: boolean) {
    let db = await this.loadDB();
    const tokens = [...new Set(this.tokenize(message))]; // unique words
    
    if (isSpam) db.totalSpam++; else db.totalHam++;

    for (const token of tokens) {
      if (!db.words[token]) db.words[token] = { spamCount: 0, hamCount: 0 };
      if (isSpam) db.words[token].spamCount++;
      else db.words[token].hamCount++;
    }

    // Zehirlenme ve hafıza şişmesini önlemek için periyodik temizlik
    db = await this.cleanup(db);

    await this.saveDB(db);
  }

  static async predict(message: string): Promise<number> {
    const db = await this.loadDB();
    if (db.totalSpam === 0 && db.totalHam === 0) return 0;

    const tokens = [...new Set(this.tokenize(message))];
    const pSpam = db.totalSpam / (db.totalSpam + db.totalHam);
    const pHam = db.totalHam / (db.totalSpam + db.totalHam);

    let logSpam = Math.log(pSpam);
    let logHam = Math.log(pHam);

    const alpha = 1;

    for (const token of tokens) {
      const wordStats = db.words[token] || { spamCount: 0, hamCount: 0 };
      // Laplace smoothing
      const pWordSpam = (wordStats.spamCount + alpha) / (db.totalSpam + alpha * 2);
      const pWordHam = (wordStats.hamCount + alpha) / (db.totalHam + alpha * 2);
      
      logSpam += Math.log(pWordSpam);
      logHam += Math.log(pWordHam);
    }

    return 1 / (1 + Math.exp(logHam - logSpam));
  }
}

// ─── FilterManager Class ─────────────────────────────────────
export class FilterManager {

  // Rules
  static async loadRules(): Promise<FilterRule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : defaultRules;
    } catch { return defaultRules; }
  }

  static async saveRules(rules: FilterRule[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    await this.syncToNative(rules, await this.loadSettings());
  }

  // Settings
  static async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : defaultSettings;
    } catch { return defaultSettings; }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage Error:', e);
    }
    await this.syncToNative(await this.loadRules(), settings);
  }

  // Stats
  static async loadStats(): Promise<Stats> {
    try {
      const data = await AsyncStorage.getItem(STATS_KEY);
      return data ? JSON.parse(data) : defaultStats;
    } catch { return defaultStats; }
  }

  static async incrementStat(key: keyof Stats, amount: number = 1) {
    const stats = await this.loadStats();
    const updatedStats = { ...stats, [key]: stats[key] + amount };
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
  }

  // History
  static async loadHistory(): Promise<HistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  static async addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    const history = await this.loadHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history].slice(0, 50);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn('Storage Error:', e);
    }
  }

  // (Eski statik metod) Artık kullanılmıyor, classifyMessage içinde doğrudan bulut veritabanını okuyacağız.
  static checkThreatDatabase(sender: string, body: string): boolean {
    return false;
  }

  // Schedule check
  static isInSchedule(settings: AppSettings): boolean {
    if (!settings.filterScheduleEnabled) return true; // always active if schedule disabled
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.scheduleStart.split(':').map(Number);
    const [endH, endM] = settings.scheduleEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // overnight schedule (e.g., 22:00 - 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  // Classify a message using rules
  static async classifyMessage(sender: string, body: string): Promise<'junk' | 'transaction' | 'promotion' | 'allowed'> {
    const settings = await this.loadSettings();
    const rules = await this.loadRules();

    // Android can raise sensitivity without moving messages in the iOS extension.
    if (Platform.OS === 'android' && settings.underAttackMode) {
      return settings.categoryMapping.spam as any;
    }

    // Check whitelist (Beyaz Liste kontrolü en başta yapılır, yasaklardan bile güçlüdür)
    if (settings.whitelist && settings.whitelist.includes(sender)) {
      return 'allowed';
    }

    // Check schedule
    if (!this.isInSchedule(settings)) return 'allowed';

    // Geçersiz / Yurtdışı Numara Kontrolü
    if (settings.invalidNumberFilter && settings.blockForeignNumbers) {
      if (sender.startsWith('+') && !sender.startsWith('+90')) {
         return settings.categoryMapping.spam as any;
      }
    }

    // Yabancı Alfabe (Arapça) Kontrolü
    if (settings.blockArabic) {
      if (/[\u0600-\u06FF]/.test(body) || /[\u0600-\u06FF]/.test(sender)) {
        return settings.categoryMapping.spam as any;
      }
    }

    // Check custom rules (order matters — first match wins)
    for (const rule of rules) {
      const textToCheck = rule.matchTarget === 'sender' ? sender
        : rule.matchTarget === 'content' ? body
        : `${sender} ${body}`;
      
      let isMatch = false;
      if (rule.type === 'regex') {
        try { isMatch = new RegExp(rule.keyword, 'i').test(textToCheck); } catch {}
      } else {
        isMatch = textToCheck.toLowerCase().includes(rule.keyword.toLowerCase());
      }

      if (isMatch) {
        if (rule.category === 'transaction' && !settings.filterTransactions) return 'allowed';
        if (rule.category === 'promotion' && !settings.filterPromotions) return 'allowed';
        
        // Kategori Eşleme (Kullanıcı bu kategoriyi farklı bir yere yönlendirmiş olabilir)
        if (rule.category === 'junk') return settings.categoryMapping.spam as any;
        if (rule.category === 'transaction') return settings.categoryMapping.transaction as any;
        if (rule.category === 'promotion') return settings.categoryMapping.promotion as any;
        return rule.category;
      }
    }

    // Threat database (Veritabanı Filtresi / Dolandırıcılık Filtresi)
    if (settings.databaseFilter || settings.fraudFilter) {
      const cloudDb = await ThreatCloudService.getDatabase();
      const lowerBody = body.toLowerCase();
      
      // Gönderici kara listede mi?
      if (cloudDb.blacklistedNumbers.includes(sender)) {
        return settings.categoryMapping.spam as any;
      }
      
      // Metin içinde bilinen spam kelimeleri veya oltalama (scam) linkleri var mı?
      const isThreat = [...cloudDb.spamKeywords, ...cloudDb.scamUrls].some(keyword => 
        lowerBody.includes(keyword.toLowerCase())
      );
      
      if (isThreat) {
        return settings.categoryMapping.spam as any;
      }
    }

    // Özel Hassas Kelime Avcısı (Dolandırıcılık Filtresi)
    if (settings.fraudFilter && settings.customFraudKeywords && settings.customFraudKeywords.length > 0) {
      const lowerBody = body.toLowerCase();
      if (settings.customFraudKeywords.some(kw => lowerBody.includes(kw.toLowerCase()))) {
        return settings.categoryMapping.spam as any;
      }
    }

    // Naive Bayes ML Check (Akıllı Filtre / Proaktif Filtre)
    if (settings.smartFilter && settings.proactiveFilter) {
      const spamProbability = await NaiveBayesClassifier.predict(body);
      // Hassasiyet eşiği (0.6 çok hassas, 0.9 daha gevşek vb.)
      if (spamProbability >= (settings.aiSensitivity || 0.8)) {
        return settings.categoryMapping.spam as any;
      }
    }

    return 'allowed';
  }

  // Native sync
  static async syncToNative(rules: FilterRule[], settings: AppSettings) {
    try {
      const cloudDb = await ThreatCloudService.getDatabase();
      
      const cloudThreats = [
        ...cloudDb.spamKeywords.map(kw => ({ keyword: kw, type: 'word' })),
        ...cloudDb.scamUrls.map(url => ({ keyword: url, type: 'word' })),
        ...(cloudDb.regexPatterns || []).map(regex => ({ keyword: regex, type: 'regex' }))
      ];

      const payload = JSON.stringify({ rules, settings, threatDb: cloudThreats });
      if (Platform.OS === 'ios') {
        try {
          const { ExtensionStorage } = require('@bacons/apple-targets');
          const storage = new ExtensionStorage(APP_GROUP);
          storage.set('smsfilter_config_json', payload);
        } catch {}
      } else if (Platform.OS === 'android') {
        try {
          const SP = require('react-native-shared-preferences').default;
          SP.setName('smsfilter_prefs');
          SP.setItem('smsfilter_config_json', payload);
        } catch {}
      }
    } catch (error) {
      console.log('Error syncing to native:', error);
    }
  }
}
