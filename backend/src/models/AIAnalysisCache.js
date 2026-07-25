const mongoose = require('mongoose');

const aiAnalysisCacheSchema = new mongoose.Schema({
  messageText: {
    type: String,
    required: true,
    unique: true
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['Düşük', 'Orta', 'Yüksek', 'Çok Yüksek']
  },
  threatType: {
    type: String,
    required: true
  },
  recommendation: {
    type: String,
    required: true
  },
  queryCount: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Otomatik silinme: 7 gün (Saniye cinsinden)
  }
});

// Arama hızlandırmak için index
aiAnalysisCacheSchema.index({ messageText: 1 });

module.exports = mongoose.model('AIAnalysisCache', aiAnalysisCacheSchema);
