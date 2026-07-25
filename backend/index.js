require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Bellekte tutulan geçici şikayet sayacı
// Artık sadece "sayı" tutmuyor, kimlerin (Hangi IP adreslerinin) şikayet ettiğini tutuyor.
// Örnek: { "çekiliş": Set { "192.168.1.5", "10.0.0.2" } }
const reports = {};

// Eşik değeri: 5 farklı kişiden/cihazdan gelirse onaya sun (Şu an test için 1 yapıldı)
const THRESHOLD = 1; 

// Kesinlikle engellenmesi yasak olan (günlük kullanım) kelimeler karalistesi
const FORBIDDEN_WORDS = [
  'merhaba', 'selam', 'nasılsın', 'naber', 'ne haber', 'evet', 'hayır', 'tamam', 'olur', 'peki',
  'teşekkürler', 'sağ ol', 'günaydın', 'iyi akşamlar', 'iyi geceler', 'yarın', 'bugün', 'şimdi',
  'geldim', 'gittim', 'arıyorum', 'alo', 'anne', 'baba', 'abi', 'abla', 'kardeşim', 'canım', 'aşkım'
];

const GITHUB_PAT = process.env.GITHUB_PAT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'keskinemirhan73';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'sms-filtre-db';
const FILE_PATH = 'database.json';

const octokit = new Octokit({ auth: GITHUB_PAT });
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

app.post('/api/report', async (req, res) => {
  try {
    const { keyword, type } = req.body;
    
    // Güvenlik: İstek atan kişinin IP adresi
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    if (!keyword) {
      return res.status(400).json({ error: 'Kelime boş olamaz' });
    }

    const lowerKeyword = keyword.toLowerCase().trim();
    
    // Güvenlik 1: Çok kısa veya anlamsız (Aşırı genel) kelimeleri baştan reddet
    if (lowerKeyword.length < 3) {
      return res.status(400).json({ error: 'Çok kısa kelimeler engellenemez (En az 3 harf)' });
    }

    // Güvenlik 2: Günlük, masum kelimeleri reddet (Mantık Filtresi)
    if (FORBIDDEN_WORDS.includes(lowerKeyword)) {
      console.log(`[REDDEDİLDİ] Sabotaj girişimi! Günlük kelime engellenmeye çalışıldı: "${lowerKeyword}"`);
      return res.status(400).json({ error: 'Güvenlik Kalkanı: Bu kelime günlük bir kelimedir ve engellenemez.' });
    }

    // Güvenlik 3: Gerçek Yapay Zeka (Gemini AI) Doğrulaması
    if (genAI && lowerKeyword.length > 4) { // Sadece 4 harften uzun kelimeleri/cümleleri AI'a sor
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Kullanıcı şu metni/kelimeyi SMS spam veya dolandırıcılık olarak şikayet etti: "${lowerKeyword}". Sence bu kelime/metin gerçekten bir bahis, casino, dolandırıcılık, yasadışı iddaa veya spam reklam kategorisine girer mi? Sadece "EVET" veya "HAYIR" olarak cevap ver.`;
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text().trim().toUpperCase();
        
        if (aiResponse.includes("HAYIR")) {
          console.log(`[YAPAY ZEKA REDDETTİ] Gemini AI bu kelimenin spam olmadığını düşünüyor: "${lowerKeyword}"`);
          return res.status(400).json({ error: 'Gemini AI Kalkanı: Şikayetiniz Yapay Zeka tarafından incelendi ve spam bulunmadığı için reddedildi.' });
        } else {
          console.log(`[YAPAY ZEKA ONAYLADI] Gemini AI şikayeti haklı buldu: "${lowerKeyword}"`);
        }
      } catch (aiError) {
        console.error('[Gemini AI Hatası]', aiError.message);
      }
    }

    // Set'i başlat (Eğer daha önce kimse bu kelimeyi şikayet etmediyse)
    if (!reports[lowerKeyword]) {
      reports[lowerKeyword] = new Set();
    }

    // IP adresini kontrol et
    if (reports[lowerKeyword].has(userIP)) {
      console.log(`[ENGEL] ${userIP} aynı kelimeyi ("${lowerKeyword}") tekrar şikayet etmeye çalıştı!`);
      return res.status(429).json({ error: 'Bu kelimeyi zaten şikayet ettiniz. Diğer kullanıcıların şikayetleri bekleniyor.' });
    }

    // IP'yi listeye ekle
    reports[lowerKeyword].add(userIP);
    const currentCount = reports[lowerKeyword].size;
    
    console.log(`[Yeni Şikayet] Kelime: "${lowerKeyword}" | Cihaz IP: ${userIP} | Toplam: ${currentCount}/${THRESHOLD}`);

    // Eşik geçildiyse Yönetici Onayına (Pull Request) Gönder
    if (currentCount >= THRESHOLD) {
      console.log(`[OTO-PİLOT] "${lowerKeyword}" eşiği geçti! Yönetici (GitHub PR) Onayına sunuluyor...`);
      
      const branchName = `auto-pilot-${Date.now()}`;

      // 1. Ana dalın (main) son sürümünü bul
      const { data: refData } = await octokit.git.getRef({
        owner: REPO_OWNER, repo: REPO_NAME, ref: 'heads/main'
      });

      // 2. Otonom olarak yeni bir dal (branch) aç
      await octokit.git.createRef({
        owner: REPO_OWNER, repo: REPO_NAME, ref: `refs/heads/${branchName}`, sha: refData.object.sha
      });

      // 3. Dosyayı yeni daldan çek
      const { data: fileData } = await octokit.repos.getContent({
        owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH, ref: branchName
      });

      const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const db = JSON.parse(decodedContent);

      // 4. Kelimeyi ekle
      if (type === 'number' && !db.blacklistedNumbers.includes(lowerKeyword)) {
        db.blacklistedNumbers.push(lowerKeyword);
      } else if (!db.spamKeywords.includes(lowerKeyword)) {
        db.spamKeywords.push(lowerKeyword);
      }

      const newContentStr = JSON.stringify(db, null, 2);
      const newContentBase64 = Buffer.from(newContentStr).toString('base64');

      // 5. Değişikliği yeni dala kaydet
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH,
        message: `🤖 Onay Bekleniyor: "${lowerKeyword}" kelimesi şikayet edildi`,
        content: newContentBase64,
        branch: branchName,
        sha: fileData.sha
      });

      // 6. Patron için Pull Request (Yönetici Onay Ekranı) Aç!
      await octokit.pulls.create({
        owner: REPO_OWNER, repo: REPO_NAME,
        title: `⚠️ YÖNETİCİ ONAYI BEKLENİYOR: "${lowerKeyword}"`,
        head: branchName,
        base: 'main',
        body: `🤖 **Oto-Pilot Yapay Zeka Sistemi**\n\n"${lowerKeyword}" kelimesi ${THRESHOLD} farklı cihazdan (IP) Spam olarak işaretlendi.\n\nEğer bu kelimenin herkesin telefonunda **engellenmesini istiyorsan** aşağıdaki yeşil \`Merge pull request\` butonuna bas.\nEğer bunun yanlış bir şikayet olduğunu düşünüyorsan \`Close pull request\` butonuna basarak iptal et.`
      });

      console.log(`[BAŞARILI] "${lowerKeyword}" için Onay İsteği oluşturuldu!`);
      
      // Temizlik (Tekrar şikayet edilmesini sıfırla)
      reports[lowerKeyword].clear();
    }

    res.status(200).json({ 
      success: true, 
      message: 'Şikayetiniz alındı! Kelime doğrulanınca engellenecektir.',
      currentCount: currentCount,
      threshold: THRESHOLD
    });

  } catch (error) {
    console.error('[HATA]', error.message);
    res.status(500).json({ error: 'Sunucu hatası, lütfen tekrar deneyin.' });
  }
});

// Admin yetkilendirme (Şifre kontrol) ara yazılımı
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345'; // .env dosyasında tanımlı olmalı

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Yetkisiz erişim! Geçersiz şifre.' });
  }
  next();
};

// Admin API: Açık olan (Onay bekleyen) Pull Request'leri getir
app.get('/api/pending', verifyAdmin, async (req, res) => {
  try {
    const { data: pulls } = await octokit.pulls.list({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'open'
    });
    
    const pendingItems = pulls.map(pr => {
      // Başlıktan kelimeyi çıkar: '⚠️ YÖNETİCİ ONAYI BEKLENİYOR: "kelime"' -> 'kelime'
      const match = pr.title.match(/"([^"]+)"/);
      const keyword = match ? match[1] : pr.title;
      return {
        id: pr.number,
        keyword: keyword,
        title: pr.title,
        url: pr.html_url,
        created_at: pr.created_at
      };
    });
    
    res.json(pendingItems);
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({ error: 'PR verileri alınamadı' });
  }
});

// Admin API: Canlı Veritabanını (database.json) GitHub'dan çek
app.get('/api/database', verifyAdmin, async (req, res) => {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH, ref: 'main'
    });
    const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const db = JSON.parse(decodedContent);
    res.json(db);
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({ error: 'Veritabanı okunamadı' });
  }
});

// Admin API: PR'ı Onayla (Merge)
app.post('/api/approve/:pull_number', verifyAdmin, async (req, res) => {
  try {
    const { pull_number } = req.params;
    await octokit.pulls.merge({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pull_number: parseInt(pull_number)
    });
    res.json({ success: true, message: 'Başarıyla onaylandı ve eklendi.' });
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({ error: 'Onaylama başarısız' });
  }
});

// Admin API: PR'ı Reddet (Close)
app.post('/api/reject/:pull_number', verifyAdmin, async (req, res) => {
  try {
    const { pull_number } = req.params;
    await octokit.pulls.update({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pull_number: parseInt(pull_number),
      state: 'closed'
    });
    res.json({ success: true, message: 'Başarıyla reddedildi ve kapatıldı.' });
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({ error: 'Reddetme başarısız' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 (MODERASYONLU & AI DESTEKLİ) Oto-Pilot Sunucusu ${PORT} portunda çalışıyor...`);
  console.log(`⚠️ GitHub PAT Ayarı: ${GITHUB_PAT ? 'BAŞARILI' : 'EKSİK'}`);
  console.log(`🧠 Gemini AI Ayarı: ${GEMINI_API_KEY ? 'BAŞARILI' : 'EKSİK (Pasif)'}`);
});
