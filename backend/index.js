require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Expo } = require('expo-server-sdk');

// Models
const Rule = require('./src/models/Rule');
const DeviceToken = require('./src/models/DeviceToken');
const NotificationHistory = require('./src/models/NotificationHistory');

let expo = new Expo();
const app = express();
app.use(cors());
app.use(express.json());

// Trust proxy for rate limiter (if behind Heroku, Render, Vercel etc)
app.set('trust proxy', 1);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter); // Apply rate limiter to all API routes

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345';
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

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

app.get('/api/models', async (req, res) => {
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'No API KEY' });
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kesinlikle engellenmesi yasak olan kelimeler
const FORBIDDEN_WORDS = [
  'merhaba', 'selam', 'nasılsın', 'naber', 'ne haber', 'evet', 'hayır', 'tamam', 'olur', 'peki',
  'teşekkürler', 'sağ ol', 'günaydın', 'iyi akşamlar', 'iyi geceler', 'yarın', 'bugün', 'şimdi',
  'geldim', 'gittim', 'arıyorum', 'alo', 'anne', 'baba', 'abi', 'abla', 'kardeşim', 'canım', 'aşkım'
];

// Admin Authorization Middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Yetkisiz erişim! Geçersiz şifre.' });
  }
  next();
};

// PUBLIC API: Report a spam keyword
app.post('/api/report', async (req, res) => {
  try {
    const { keyword, type, token } = req.body;
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    if (!keyword) return res.status(400).json({ error: 'Kelime boş olamaz' });
    const lowerKeyword = keyword.toLowerCase().trim();
    
    if (lowerKeyword.length < 3) {
      return res.status(400).json({ error: 'Çok kısa kelimeler engellenemez (En az 3 harf)' });
    }

    if (FORBIDDEN_WORDS.includes(lowerKeyword)) {
      return res.status(400).json({ error: 'Güvenlik Kalkanı: Bu kelime günlük bir kelimedir ve engellenemez.' });
    }

    // AI Verification
    if (genAI && lowerKeyword.length > 4) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Kullanıcı şu metni/kelimeyi SMS spam veya dolandırıcılık olarak şikayet etti: "${lowerKeyword}". Sence bu kelime/metin gerçekten bir bahis, casino, dolandırıcılık, yasadışı iddaa veya spam reklam kategorisine girer mi? Sadece "EVET" veya "HAYIR" olarak cevap ver.`;
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text().trim().toUpperCase();
        
        if (aiResponse.includes("HAYIR")) {
          return res.status(400).json({ error: 'Gemini AI Kalkanı: Şikayetiniz Yapay Zeka tarafından incelendi ve spam bulunmadığı için reddedildi.' });
        }
      } catch (aiError) {
        console.error('[Gemini AI Hatası]', aiError.message);
      }
    }

    // Upsert Rule in DB
    let rule = await Rule.findOne({ keyword: lowerKeyword });
    
    if (!rule) {
      rule = new Rule({
        keyword: lowerKeyword,
        type: type === 'number' ? 'number' : 'word',
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

const AIAnalysisCache = require('./src/models/AIAnalysisCache');

// PUBLIC API: Analyze text with Gemini AI (with Cache)
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ error: 'Lütfen analiz edilecek anlamlı bir metin girin.' });
    }

    const cleanText = text.trim();

    // 1. Check Cache
    const cached = await AIAnalysisCache.findOne({ messageText: cleanText });
    if (cached) {
      cached.queryCount += 1;
      await cached.save();
      return res.json({
        success: true,
        cached: true,
        riskLevel: cached.riskLevel,
        threatType: cached.threatType,
        recommendation: cached.recommendation
      });
    }

    // 2. Ask Gemini
    if (!genAI) {
      return res.status(500).json({ error: 'Yapay Zeka servisi şu an kullanılamıyor.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Şu SMS metnini analiz et: "${cleanText}"
Görev: Bu metin bir dolandırıcılık, oltalama (phishing), yasadışı bahis veya spam mıdır?
Lütfen SADECE aşağıdaki JSON formatında ve Türkçe cevap ver, ekstra hiçbir kelime yazma:
{
  "riskLevel": "Düşük" | "Orta" | "Yüksek" | "Çok Yüksek",
  "threatType": "Kısa bir tehdit özeti (Örn: Zararlı Link, Aciliyet Hissi, Zararsız vb.)",
  "recommendation": "Kullanıcıya 1 cümlelik tavsiye"
}`;

    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text().trim();
    
    // Remove markdown code blocks if Gemini added them
    if (aiResponse.startsWith('\`\`\`json')) {
      aiResponse = aiResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Gemini JSON Parse Hatası:', aiResponse);
      return res.status(500).json({ error: 'Yapay zeka yanıtı anlaşılamadı.' });
    }

    // 3. Save to Cache
    const newCache = new AIAnalysisCache({
      messageText: cleanText,
      riskLevel: parsedResponse.riskLevel || 'Orta',
      threatType: parsedResponse.threatType || 'Bilinmiyor',
      recommendation: parsedResponse.recommendation || 'Dikkatli olun.'
    });
    await newCache.save();

    res.json({
      success: true,
      cached: false,
      ...parsedResponse
    });

  } catch (error) {
    console.error('[ANALYZE HATA]', error.message);
    
    // YZ hatası durumunda (429 Quota vb.) uygulamanın çökmemesi için Fallback
    const fallbackText = req.body.text ? req.body.text.trim().toLowerCase() : '';
    const isSpam = fallbackText.includes('bahis') || fallbackText.includes('casino') || fallbackText.includes('bonus') || fallbackText.includes('kredi') || fallbackText.includes('borç') || fallbackText.includes('kazandınız') || fallbackText.includes('bet');
    
    res.json({
      success: true,
      cached: false,
      isFallback: true,
      riskLevel: isSpam ? 'Yüksek' : 'Düşük',
      threatType: isSpam ? 'Şüpheli Kelimeler İçeriyor (Sistem Taraması)' : 'Temiz Görünüyor (AI Beklemede)',
      recommendation: isSpam ? 'Bu mesaja itibar etmeyin ve linklere tıklamayın.' : 'Yapay zeka analiz servisi şu an yoğun, ancak mesaj standart sistem taramasından geçti. Yine de dikkatli olun.'
    });
  }
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
    const { token } = req.body;
    if (!token || !Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Geçersiz Token' });
    }
    
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
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token gerekli' });

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
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Başlık ve mesaj gereklidir' });

    const devices = await DeviceToken.find();
    let messages = [];
    
    for (let device of devices) {
      messages.push({
        to: device.token,
        sound: 'default',
        title: title,
        body: body,
      });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let successCount = 0;
    let failureCount = 0;

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        for (let ticket of ticketChunk) {
          if (ticket.status === 'ok') successCount++;
          else failureCount++;
        }
      } catch (error) {
        console.error(error);
        failureCount += chunk.length;
      }
    }

    // Save history
    const history = new NotificationHistory({
      title, body, sentToCount: devices.length, successCount, failureCount
    });
    await history.save();
    
    res.json({ success: true, message: `${successCount} cihaza bildirim gönderildi.`, successCount, failureCount });
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

app.listen(PORT, () => {
  console.log(`🚀 (MODERASYONLU & AI DESTEKLİ) Mongoose Sunucusu ${PORT} portunda çalışıyor...`);
  console.log(`🧠 Gemini AI Ayarı: ${GEMINI_API_KEY ? 'BAŞARILI' : 'EKSİK (Pasif)'}`);
});
