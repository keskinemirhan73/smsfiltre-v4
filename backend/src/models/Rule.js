const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['word', 'number', 'regex'],
    default: 'word'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reportCount: {
    type: Number,
    default: 1
  },
  reportedByIPs: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Rule', ruleSchema);
