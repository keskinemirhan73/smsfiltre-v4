const mongoose = require('mongoose');

const notificationHistorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  sentToCount: {
    type: Number,
    required: true
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationHistory', notificationHistorySchema);
