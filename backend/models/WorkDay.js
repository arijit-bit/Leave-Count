const mongoose = require('mongoose');

const workDaySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  isWorked: { type: Boolean, default: false },
  isLeaveTaken: { type: Boolean, default: false }
});

// Ensure a user can only have one record per day
workDaySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkDay', workDaySchema);
