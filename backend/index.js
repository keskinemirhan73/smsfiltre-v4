require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Expo } = require('expo-server-sdk');
const { createAdminAuth } = require('./src/middleware/adminAuth');
const { analyzeMessage } = require('./src/services/messageAnalysis');
const { deliverPushBroadcast } = require('./src/services/pushDelivery');
const {
  validateAnalyzeInput,
  validateNotificationInput,
  validatePushTokenInput,
  validateReportInput,
} = require('./src/validation/publicInput');

// Models
const Rule = require('./src/models/Rule');
const DeviceToken = require('./src/models/DeviceToken');
const NotificationHistory = require('./src/models/NotificationHistory');

let expo = new Expo();
const app = express();
app.use(cors());
app.use(express.json({ limit: '16kb' }));

// Trust proxy for rate limiter (if behind Heroku, Render, Vercel etc)
app.set('trust proxy', 1);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'filtreai-api' });
});

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter); // Apply rate limiter to all API routes

const expensiveOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Çok fazla analiz isteği gönderdiniz, lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/analyze', expensiveOperationLimiter);
app.use('/api/report', expensiveOperationLimiter);

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const PORT = process.env.PORT || 5000;
const THRESHOLD = 5; 

// Connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('📦 MongoDB Atlas bağlantısı BAŞARILI!'))
    .catch(err => console.error('❌ MongoDB bağlantı hatası:', err));
} else {
  console.warn('⚠️ MONGODB_URI bulunamadı! Lütfen .env dosyanızı kontrol edin.');
}

// Kesinlikle engellenmesi yasak olan kelimeler
const FORBIDDEN_WORDS = [
  'merhaba', 'selam', 'nasılsın', 'naber', 'ne haber', 'evet', 'hayır', 'tamam', 'olur', 'peki',
  'teşekkürler', 'sağ ol', 'günaydın', 'iyi akşamlar', 'iyi geceler', 'yarın', 'bugün', 'şimdi',
  'geldim', 'gittim', 'arıyorum', 'alo', 'anne', 'baba', 'abi', 'abla', 'kardeşim', 'canım', 'aşkım'
];

// Admin Authorization Middleware
const verifyAdmin = createAdminAuth(ADMIN_PASSWORD);

// PUBLIC API: Report a spam keyword
app.post('/api/report', async (req, res) => {
  try {
    const validation = validateReportInput(
      req.body,
      Expo.isExpoPushToken,
    );
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const {
      keyword: lowerKeyword,
      type,
      token,
    } = validation;
    const userIP = String(
      req.ip || req.socket.remoteAddress || 'unknown',
    ).slice(0, 64);

    if (FORBIDDEN_WORDS.includes(lowerKeyword)) {
      return res.status(400).json({ error: 'Güvenlik Kalkanı: Bu kelime günlük bir kelimedir ve engellenemez.' });
    }

    // Upsert Rule in DB
    let rule = await Rule.findOne({ keyword: lowerKeyword });
    
    if (!rule) {
      rule = new Rule({
        keyword: lowerKeyword,
        type,
        status: 'pending',
        reportCount: 1,
        reportedByIPs: [userIP]
      });
    } else {
      if (rule.reportedByIPs.includes(userIP)) {
        return res.status(429).json({ error: 'Bu kelimeyi zaten şikayet ettiniz. Diğer kullanıcıların şikayetleri bekleniyor.' });
      }
      if (rule.status === 'approved') {
         return res.status(200).json({ success: true, message: 'Bu kelime zaten sistemde onaylanmış durumda.' });
      }
      
      rule.reportedByIPs.push(userIP);
      rule.reportCount = rule.reportedByIPs.length;
    }

    await rule.save();
    console.log(`[Yeni Şikayet] "${lowerKeyword}" | Toplam: ${rule.reportCount}/${THRESHOLD}`);

    if (rule.reportCount >= THRESHOLD && rule.status === 'pending') {
      console.log(`[OTO-PİLOT] "${lowerKeyword}" eşiği geçti! Onay bekleniyor.`);
    }

    // Gamification: Give points to the user
    if (token) {
      try {
        await DeviceToken.findOneAndUpdate(
          { token },
          { $inc: { points: 10, reportsCount: 1 }, lastActive: Date.now() }
        );
      } catch (e) {
        console.error('Puan eklenirken hata:', e.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Şikayetiniz alındı! Kelime doğrulanınca engellenecektir.',
      currentCount: rule.reportCount,
      threshold: THRESHOLD
    });

  } catch (error) {
    console.error('[HATA]', error.message);
    res.status(500).json({ error: 'Sunucu hatası, lütfen tekrar deneyin.' });
  }
});

// PUBLIC API: Analyze text with the deterministic FiltreAI rules engine.
// Kept for older clients; submitted message text is processed in memory only.
app.post('/api/analyze', async (req, res) => {
  const validation = validateAnalyzeInput(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const cleanText = validation.text;
  const analysis = analyzeMessage(cleanText);

  return res.json({
    success: true,
    cached: false,
    analysisEngine: 'rules-v1',
    ...analysis,
  });
});

// PUBLIC API: Get community rules (Approved rules)
app.get('/api/rules/community', async (req, res) => {
  try {
    const rules = await Rule.find({ status: 'approved' }).select('keyword type -_id');
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Kurallar alınamadı' });
  }
});

// PUBLIC API: Register Push Token
app.post('/api/push-token', async (req, res) => {
  try {
    const validation = validatePushTokenInput(
      req.body,
      Expo.isExpoPushToken,
    );
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
    const { token } = validation;
    
    await DeviceToken.findOneAndUpdate(
      { token },
      { lastActive: Date.now() },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Token kaydedilemedi' });
  }
});

// PUBLIC API: Get User Profile (Gamification)
app.post('/api/user/profile', async (req, res) => {
  try {
    const validation = validatePushTokenInput(
      req.body,
      Expo.isExpoPushToken,
    );
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }
    const { token } = validation;

    let user = await DeviceToken.findOne({ token });
    if (!user) {
      user = new DeviceToken({ token, points: 0, reportsCount: 0 });
      await user.save();
    }

    // Determine Badge
    let badge = 'Acemi Kalkan';
    if (user.points >= 500) badge = 'Siber Güvenlik Uzmanı';
    else if (user.points >= 100) badge = 'Spam Savaşçısı';
    else if (user.points >= 50) badge = 'Aktif Kalkan';

    res.json({
      points: user.points || 0,
      reportsCount: user.reportsCount || 0,
      badge
    });
  } catch (error) {
    res.status(500).json({ error: 'Profil alınamadı' });
  }
});

// ADMIN API: Get Dashboard Stats
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const pendingCount = await Rule.countDocuments({ status: 'pending' });
    const approvedCount = await Rule.countDocuments({ status: 'approved' });
    const deviceCount = await DeviceToken.countDocuments();
    const recentNotifications = await NotificationHistory.find().sort({ createdAt: -1 }).limit(5);

    // Top reported words
    const topReported = await Rule.find({ status: 'pending' })
      .sort({ reportCount: -1 })
      .limit(5)
      .select('keyword reportCount');

    res.json({
      pendingCount,
      approvedCount,
      deviceCount,
      recentNotifications,
      topReported
    });
  } catch (error) {
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

// ADMIN API: Get Pending Rules
app.get('/api/pending', verifyAdmin, async (req, res) => {
  try {
    const pendingRules = await Rule.find({ status: 'pending', reportCount: { $gte: 1 } }).sort({ reportCount: -1 });
    
    // Map to old frontend structure for compatibility
    const pendingItems = pendingRules.map(r => ({
      id: r._id,
      keyword: r.keyword,
      title: `⚠️ ONAY BEKLENİYOR: "${r.keyword}" (${r.reportCount} şikayet)`,
      created_at: r.createdAt
    }));
    
    res.json(pendingItems);
  } catch (error) {
    res.status(500).json({ error: 'PR verileri alınamadı' });
  }
});

// ADMIN API: Approve Rule
app.post('/api/approve/:id', verifyAdmin, async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ success: true, message: 'Başarıyla onaylandı.' });
  } catch (error) {
    res.status(500).json({ error: 'Onaylama başarısız' });
  }
});

// ADMIN API: Reject Rule
app.post('/api/reject/:id', verifyAdmin, async (req, res) => {
  try {
    await Rule.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.json({ success: true, message: 'Başarıyla reddedildi.' });
  } catch (error) {
    res.status(500).json({ error: 'Reddetme başarısız' });
  }
});

// ADMIN API: Send Global Notification
app.post('/api/admin/send-notification', verifyAdmin, async (req, res) => {
  try {
    const validation = validateNotificationInput(req.body);
    if (!validation.ok) return res.status(400).json({ error: validation.error });
    const { title, body } = validation;

    const devices = await DeviceToken.find();
    const delivery = await deliverPushBroadcast({
      expo,
      isValidToken: Expo.isExpoPushToken,
      tokens: devices.map(device => device.token),
      title,
      body,
    });

    if (delivery.staleTokens.length > 0) {
      await DeviceToken.deleteMany({ token: { $in: delivery.staleTokens } });
    }

    // Save history
    const history = new NotificationHistory({
      title,
      body,
      sentToCount: delivery.attemptedCount,
      successCount: delivery.successCount,
      failureCount: delivery.failureCount,
    });
    await history.save();
    
    res.json({
      success: true,
      message: `${delivery.successCount} cihaza bildirim gönderildi.`,
      ...delivery,
    });
  } catch (error) {
    console.error('[PUSH ERROR]', error);
    res.status(500).json({ error: 'Bildirim gönderilemedi' });
  }
});

// ADMIN API: Get Database Data (for backward compatibility)
app.get('/api/database', verifyAdmin, async (req, res) => {
  try {
    const rules = await Rule.find({ status: 'approved' });
    const spamKeywords = rules.filter(r => r.type === 'word').map(r => r.keyword);
    const blacklistedNumbers = rules.filter(r => r.type === 'number').map(r => r.keyword);
    
    res.json({
      spamKeywords,
      blacklistedNumbers
    });
  } catch (error) {
    res.status(500).json({ error: 'Veritabanı okunamadı' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 FiltreAI sunucusu ${PORT} portunda çalışıyor...`);
    console.log('🛡️ Ücretsiz kural tabanlı mesaj analizi etkin.');
  });
}

module.exports = { app };
