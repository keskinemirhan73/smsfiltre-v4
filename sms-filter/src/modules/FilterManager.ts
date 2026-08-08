import { SecureStorage as AsyncStorage } from '../utils/SecureStorage';
import { Platform } from 'react-native';
import { ThreatCloudService } from '../services/ThreatCloudService';
import { buildNativeFilterPayload } from '../services/nativeFilterPayload';
import { mergeNativeSmsEvents, parseNativeSmsEventQueues } from '../services/nativeSmsEvents';
import {
  filterUnprocessedSenderCorrections,
  mergePendingSenderCorrections,
  parseNativeSenderOverride,
  parseNativeSenderOverrideQueue,
  parsePendingSenderOverrideIds,
  type PendingSenderCorrection,
} from '../services/nativeSenderOverrides';
import {
  createManualCategoryHistory,
  resolveUserRuleCategory,
  type MessageCategory,
} from '../services/messageCategoryPolicy';
import { parseSenderRuleInput, senderRuleMatches, setSenderCategory, setSenderWhitelistState } from '../services/senderRulePolicy';

const APP_GROUP = 'group.com.filtreai.app';
const STORAGE_KEY = '@junkman_rules';
const SETTINGS_KEY = '@junkman_settings';
const STATS_KEY = '@junkman_stats';
const LEARNING_KEY = '@junkman_learning_db';
const NATIVE_SMS_EVENT_QUEUE_KEY = 'smsfilter_event_queue_json';
const NATIVE_SMS_REPORT_EVENT_QUEUE_KEY = 'smsfilter_report_event_queue_json';
const NATIVE_PENDING_SENDER_OVERRIDE_QUEUE_KEY = 'smsfilter_pending_sender_override_queue_json';
const NATIVE_PENDING_SENDER_OVERRIDE_IDS_KEY = 'smsfilter_pending_sender_override_ids_json';
const NATIVE_PENDING_SENDER_OVERRIDE_KEY_PREFIX = 'smsfilter_pending_sender_override_';
const NATIVE_PROCESSED_IDS_KEY = '@FiltreAI_Native_Processed_Event_IDs';
const PENDING_SENDER_CORRECTIONS_KEY = '@FiltreAI_Pending_Sender_Corrections';
const PENDING_SENDER_PROCESSED_IDS_KEY = '@junkman_pending_sender_processed_ids';

// ─── Types ───────────────────────────────────────────────────
export interface FilterRule {
  id: string;
  keyword: string;
  type: 'word' | 'regex';
  category: 'junk' | 'transaction' | 'promotion' | 'allowed';
  matchTarget: 'sender' | 'content' | 'both';
  matchMode?: 'exact' | 'contains';
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
  source?: 'native' | 'report' | 'manual' | 'simulator';
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
  { keyword: 'freebet', type: 'word' as const },
  { keyword: 'hoşgeldin bonusu', type: 'word' as const },
  { keyword: 'çevrim şartsız', type: 'word' as const },
  { keyword: 'deneme bonusu', type: 'word' as const },
  { keyword: 'kayıp bonusu', type: 'word' as const },
  // Dolandırıcılık (İcra, Kargo, Kredi, Vergi, Abonelik)
  { keyword: 'icra takibi', type: 'word' as const },
  { keyword: 'dosyanız savcılığa', type: 'word' as const },
  { keyword: 'ceza dosyası', type: 'word' as const },
  { keyword: 'adresinizi güncelleyin', type: 'word' as const },
  { keyword: 'adresinizi guncelleyin', type: 'word' as const },
  { keyword: 'adresiniz doğrulanamadı', type: 'word' as const },
  { keyword: 'adresiniz dogrulanamadi', type: 'word' as const },
  { keyword: 'kargonuz teslim edilemedi', type: 'word' as const },
  { keyword: 'ptt kargo', type: 'word' as const },
  { keyword: 'iade edildi', type: 'word' as const },
  { keyword: 'gümrükte takıldı', type: 'word' as const },
  { keyword: 'gumrukte takildi', type: 'word' as const },
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
  // Bağış / İstenmeyen Toplu SMS / IBAN Spam
  { keyword: 'sma hastası', type: 'word' as const },
  { keyword: 'sma hastasi', type: 'word' as const },
  { keyword: 'sadakanızla', type: 'word' as const },
  { keyword: 'sadakanizla', type: 'word' as const },
  { keyword: 'valilik denetimli', type: 'word' as const },
  { keyword: 'TR\\d{24}', type: 'regex' as const },
  // Kısa Link & Oltalama Alan Adları
  { keyword: 'is\\.gd', type: 'regex' as const },
  { keyword: 'cutt\\.ly', type: 'regex' as const },
  { keyword: 'bit\\.ly', type: 'regex' as const },
  { keyword: 'tinyurl\\.com', type: 'regex' as const },
  { keyword: 't\\.co', type: 'regex' as const },
  { keyword: 't\\.ly', type: 'regex' as const },
  { keyword: 'rb\\.gy', type: 'regex' as const },
  { keyword: 'shorturl', type: 'word' as const },
  { keyword: 'sms iptal için', type: 'word' as const },
  { keyword: 'vip kulüp', type: 'word' as const },
  { keyword: 'vip kulup', type: 'word' as const },
  { keyword: 'http.*\\.(xyz|cc|top|club|site|gd|me|fun|icu|info)', type: 'regex' as const },
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
  blockedCount: 6,
  analyzedCount: 14,
  transactionCount: 3,
  promotionCount: 5,
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
  private static nativeImportInFlight: Promise<number> | null = null;
  private static storageMutationQueue: Promise<unknown> = Promise.resolve();
  private static nativeImportWarning: string | null = null;

  private static withStorageMutation<T>(operation: () => Promise<T>): Promise<T> {
    const queued = this.storageMutationQueue.then(operation, operation);
    this.storageMutationQueue = queued.then(() => undefined, () => undefined);
    return queued;
  }

  // Rules
  static async loadRules(): Promise<FilterRule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : defaultRules;
    } catch { return defaultRules; }
  }

  static saveRules(rules: FilterRule[]) {
    return this.withStorageMutation(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      await this.syncToNative(rules, await this.loadSettings());
    });
  }

  // Settings
  static async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : defaultSettings;
    } catch { return defaultSettings; }
  }

  static saveSettings(settings: AppSettings): Promise<void> {
    return this.withStorageMutation(async () => {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      await this.syncToNative(await this.loadRules(), settings);
    });
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

  private static async addHistoryUnlocked(
    item: Omit<HistoryItem, 'id' | 'timestamp'>,
    stableId?: string,
  ) {
    const history = await this.loadHistory();
    const newItem: HistoryItem = {
      ...item,
      id: stableId ?? Date.now().toString() + Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history.filter(entry => entry.id !== newItem.id)].slice(0, 50);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  }

  static addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
    return this.withStorageMutation(() => this.addHistoryUnlocked(item));
  }

  static categorizeSender(senderInput: string, category: MessageCategory) {
    const sender = parseSenderRuleInput(senderInput);
    if (!sender) return Promise.reject(new Error('Geçerli bir gönderen adı veya numarası girin.'));

    return this.withStorageMutation(() => this.categorizeSenderUnlocked(sender, category));
  }

  private static async categorizeSenderUnlocked(
    sender: string,
    category: MessageCategory,
    pendingId?: string,
  ) {
      const [rules, settings] = await Promise.all([
        this.loadRules(),
        this.loadSettings(),
      ]);
      const updatedRules = setSenderCategory(rules, sender, category);
      const updatedSettings = {
        ...settings,
        whitelist: setSenderWhitelistState(settings.whitelist, sender, category === 'allowed'),
      };
      const originalHistory = await this.loadHistory();
      const originalPending = pendingId ? await this.loadPendingSenderCorrections() : [];
      const updatedPending = pendingId
        ? originalPending.filter(entry => entry.id !== pendingId)
        : originalPending;

      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
        await this.addHistoryUnlocked(
          createManualCategoryHistory(sender, category),
          pendingId ? `manual-${pendingId}` : undefined,
        );
        if (pendingId) {
          await AsyncStorage.setItem(PENDING_SENDER_CORRECTIONS_KEY, JSON.stringify(updatedPending));
        }
      } catch (error) {
        await Promise.allSettled([
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rules)),
          AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)),
          AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(originalHistory)),
          ...(pendingId
            ? [AsyncStorage.setItem(PENDING_SENDER_CORRECTIONS_KEY, JSON.stringify(originalPending))]
            : []),
        ]);
        throw error;
      }
      const nativeSynced = await this.syncToNative(updatedRules, updatedSettings);

      return {
        rules: updatedRules,
        history: await this.loadHistory(),
        nativeSynced,
        pending: updatedPending,
      };
  }

  // (Eski statik metod) Artık kullanılmıyor, classifyMessage içinde doğrudan bulut veritabanını okuyacağız.
  static async loadPendingSenderCorrections(): Promise<PendingSenderCorrection[]> {
    try {
      const raw = await AsyncStorage.getItem(PENDING_SENDER_CORRECTIONS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? mergePendingSenderCorrections([], parsed as PendingSenderCorrection[]) : [];
    } catch {
      return [];
    }
  }

  static async confirmPendingSenderCorrection(id: string, category: MessageCategory) {
    return this.withStorageMutation(async () => {
      const pending = await this.loadPendingSenderCorrections();
      const correction = pending.find(entry => entry.id === id);
      if (!correction) throw new Error('Bekleyen gönderici ayarı bulunamadı. Listeyi yenileyin.');
      return this.categorizeSenderUnlocked(correction.sender, category, id);
    });
  }

  static dismissPendingSenderCorrection(id: string): Promise<PendingSenderCorrection[]> {
    return this.withStorageMutation(async () => {
      const pending = await this.loadPendingSenderCorrections();
      const updated = pending.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(PENDING_SENDER_CORRECTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

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

    // Check schedule
    if (!this.isInSchedule(settings)) return 'allowed';

    // Kullanıcının kesin gönderen tercihi içerik ve risk sezgilerinden daha yüksek önceliklidir.
    const exactSenderOverride = rules.find(rule =>
      rule.matchTarget === 'sender' &&
      rule.matchMode === 'exact' &&
      senderRuleMatches(sender, rule.keyword),
    );
    if (exactSenderOverride) {
      const category = resolveUserRuleCategory(
        exactSenderOverride.category,
        exactSenderOverride.matchTarget,
        settings.filterTransactions,
        settings.filterPromotions,
        exactSenderOverride.matchMode,
      );
      if (category === 'junk') return settings.categoryMapping.spam as any;
      if (category === 'transaction') return settings.categoryMapping.transaction as any;
      if (category === 'promotion') return settings.categoryMapping.promotion as any;
      return category;
    }

    // Beyaz liste büyük-küçük harf duyarsız tam gönderen eşleşmesidir.
    if (settings.whitelist?.some(entry => senderRuleMatches(sender, entry))) {
      return 'allowed';
    }

    // Geçersiz / Yurtdışı Numara & Link Kontrolü (Örn: +855 Kamboçya numaralarından gelen phishing linkleri)
    const isForeignSender = sender.startsWith('+') && !sender.startsWith('+90');
    const hasLink = /(https?:\/\/|[a-z0-9-]+\.(gd|ly|com|cc|top|xyz|me|co|site|info|fun|icu))/i.test(body);
    if (isForeignSender && (hasLink || (settings.invalidNumberFilter && settings.blockForeignNumbers))) {
      return settings.categoryMapping.spam as any;
    }

    // Yabancı Alfabe (Arapça) Kontrolü
    if (settings.blockArabic) {
      if (/[\u0600-\u06FF]/.test(body) || /[\u0600-\u06FF]/.test(sender)) {
        return settings.categoryMapping.spam as any;
      }
    }

    // Fraud heuristics run before general content rules, matching the iOS extension.
    if (settings.fraudFilter && settings.customFraudKeywords?.length > 0) {
      const lowerBody = body.toLowerCase();
      if (settings.customFraudKeywords.some(keyword => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        return normalizedKeyword.length > 0 && lowerBody.includes(normalizedKeyword);
      })) {
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
      } else if (rule.matchTarget === 'sender' && rule.matchMode === 'exact') {
        isMatch = senderRuleMatches(sender, rule.keyword);
      } else {
        isMatch = textToCheck.toLowerCase().includes(rule.keyword.toLowerCase());
      }

      if (isMatch) {
        const category = resolveUserRuleCategory(
          rule.category,
          rule.matchTarget,
          settings.filterTransactions,
          settings.filterPromotions,
          rule.matchMode,
        );
        
        // Kategori Eşleme (Kullanıcı bu kategoriyi farklı bir yere yönlendirmiş olabilir)
        if (category === 'junk') return settings.categoryMapping.spam as any;
        if (category === 'transaction') return settings.categoryMapping.transaction as any;
        if (category === 'promotion') return settings.categoryMapping.promotion as any;
        return category;
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

    return 'allowed';
  }

  // Native sync
  static async initializeNativeFiltering(): Promise<void> {
    await this.syncToNative(await this.loadRules(), await this.loadSettings());
  }

  private static async readNativePreference(key: string): Promise<string | null> {
    const sharedPreferencesModule = require('react-native-shared-preferences');
    const sharedPreferences = sharedPreferencesModule.default ?? sharedPreferencesModule;
    if (!sharedPreferences?.setName || !sharedPreferences?.getItem) return null;

    sharedPreferences.setName('smsfilter_prefs');
    return new Promise(resolve => sharedPreferences.getItem(key, resolve));
  }

  static async importNativeSmsEvents(): Promise<number> {
    if (this.nativeImportInFlight) return this.nativeImportInFlight;

    const operation = this.performNativeSmsEventImport();
    this.nativeImportInFlight = operation;
    try {
      return await operation;
    } finally {
      if (this.nativeImportInFlight === operation) this.nativeImportInFlight = null;
    }
  }

  static getNativeImportWarning(): string | null {
    return this.nativeImportWarning;
  }

  private static performNativeSmsEventImport(): Promise<number> {
    return this.withStorageMutation(() => this.performNativeSmsEventImportUnlocked());
  }

  private static async performNativeSmsEventImportUnlocked(): Promise<number> {
    try {
      this.nativeImportWarning = null;
      let rawEventQueues: Array<string | null> = [];
      let pendingCorrections: PendingSenderCorrection[] = [];
      let pendingKeysToRemove: string[] = [];
      let pendingIdsToMarkProcessed: string[] = [];
      const processedPendingIds = parsePendingSenderOverrideIds(
        await AsyncStorage.getItem(PENDING_SENDER_PROCESSED_IDS_KEY),
      );
      let iosExtensionStorage: {
        get(key: string): unknown;
        getKeys(prefix: string): string[];
        remove(key: string): void;
      } | null = null;
      if (Platform.OS === 'android') {
        rawEventQueues = [await this.readNativePreference(NATIVE_SMS_EVENT_QUEUE_KEY)];
      } else if (Platform.OS === 'ios') {
        try {
          const { ExtensionStorage } = require('@bacons/apple-targets');
          const storage = new ExtensionStorage(APP_GROUP);
          iosExtensionStorage = storage;
          rawEventQueues = [
            storage.get(NATIVE_SMS_EVENT_QUEUE_KEY) as string,
            storage.get(NATIVE_SMS_REPORT_EVENT_QUEUE_KEY) as string,
          ];
          const queuedCorrections = filterUnprocessedSenderCorrections(
            parseNativeSenderOverrideQueue(
              storage.get(NATIVE_PENDING_SENDER_OVERRIDE_QUEUE_KEY) as string,
            ),
            processedPendingIds,
          );
          const indexedIds = parsePendingSenderOverrideIds(
            storage.get(NATIVE_PENDING_SENDER_OVERRIDE_IDS_KEY) as string,
          );
          const enumeratedKeys: string[] = storage.getKeys(
            `${NATIVE_PENDING_SENDER_OVERRIDE_KEY_PREFIX}pending-`,
          );
          const enumeratedIds = enumeratedKeys.map(key =>
            key.slice(NATIVE_PENDING_SENDER_OVERRIDE_KEY_PREFIX.length),
          );
          const pendingIds = parsePendingSenderOverrideIds(JSON.stringify([...indexedIds, ...enumeratedIds]));
          const legacyCorrections = pendingIds.flatMap(id => {
            const key = `${NATIVE_PENDING_SENDER_OVERRIDE_KEY_PREFIX}${id}`;
            const rawCorrection = storage.get(key) as string | null;
            const correction = parseNativeSenderOverride(rawCorrection);
            if (!correction || correction.id !== id) {
              if (rawCorrection !== null) pendingKeysToRemove.push(key);
              return [];
            }
            pendingKeysToRemove.push(key);
            return [correction];
          });
          const unprocessedCorrections = filterUnprocessedSenderCorrections(
            [...queuedCorrections, ...legacyCorrections],
            processedPendingIds,
          );
          pendingCorrections = mergePendingSenderCorrections([], unprocessedCorrections);
          pendingIdsToMarkProcessed = [
            ...new Set(unprocessedCorrections.map(correction => correction.id)),
          ];
        } catch {
          this.nativeImportWarning = 'iOS raporlama bağlantısı okunamadı. FiltreAI’yi kapatıp yeniden açın ve tekrar deneyin.';
        }
      }

      const events = parseNativeSmsEventQueues(rawEventQueues);
      if (pendingCorrections.length > 0) {
        const mergedPending = mergePendingSenderCorrections(
          await this.loadPendingSenderCorrections(),
          pendingCorrections,
        );
        await AsyncStorage.setItem(PENDING_SENDER_CORRECTIONS_KEY, JSON.stringify(mergedPending));
        await AsyncStorage.setItem(
          PENDING_SENDER_PROCESSED_IDS_KEY,
          JSON.stringify(
            [...new Set([...processedPendingIds, ...pendingIdsToMarkProcessed])].slice(-50),
          ),
        );
      }
      pendingKeysToRemove.forEach(key => iosExtensionStorage?.remove(key));

      if (events.length === 0) return 0;

      const processedRaw = await AsyncStorage.getItem(NATIVE_PROCESSED_IDS_KEY);
      const processedIds = processedRaw ? JSON.parse(processedRaw) : [];
      const safeProcessedIds = Array.isArray(processedIds)
        ? processedIds.filter(value => typeof value === 'string')
        : [];
      const merged = mergeNativeSmsEvents(
        await this.loadHistory(),
        await this.loadStats(),
        safeProcessedIds,
        events,
      );
      if (merged.importedCount === 0) return 0;

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(merged.history));
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(merged.stats));
      await AsyncStorage.setItem(
        NATIVE_PROCESSED_IDS_KEY,
        JSON.stringify(merged.processedIds),
      );
      return merged.importedCount;
    } catch (error) {
      this.nativeImportWarning = 'Cihaz işlemleri güvenli depoya aktarılamadı. Lütfen yeniden deneyin.';
      console.warn('Native SMS olayları içe aktarılamadı.');
      return 0;
    }
  }

  static async syncToNative(rules: FilterRule[], settings: AppSettings): Promise<boolean> {
    try {
      const cloudDb = await ThreatCloudService.getDatabase();
      const payload = buildNativeFilterPayload(rules, settings, cloudDb);
      if (Platform.OS === 'ios') {
        const { ExtensionStorage } = require('@bacons/apple-targets');
        const storage = new ExtensionStorage(APP_GROUP);
        storage.set('smsfilter_config_json', payload);
        return storage.get('smsfilter_config_json') === payload;
      } else if (Platform.OS === 'android') {
        const sharedPreferencesModule = require('react-native-shared-preferences');
        const SP = sharedPreferencesModule.default ?? sharedPreferencesModule;
        SP.setName('smsfilter_prefs');
        SP.setItem('smsfilter_config_json', payload);
      }
      return true;
    } catch (error) {
      console.warn('Native filtre ayarları eşitlenemedi.');
      return false;
    }
  }
}
