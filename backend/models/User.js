const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  initialLeaves: { type: Number, default: 0 },
  earnedLeavesOffset: { type: Number, default: 0 },
  extraLeavesOffset: { type: Number, default: 0 },
  takenLeavesOffset: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
