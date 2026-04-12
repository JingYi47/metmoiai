import mongoose from "mongoose";

const spamControlSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  sessionId: {
    type: String,
    index: true,
  },
  ip: {
    type: String,
    index: true,
  },
  messageCount: {
    type: Number,
    default: 1,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  blockedUntil: {
    type: Date,
    default: null,
  },
  blockCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Tự động xóa sau 1 giờ
  },
});

// Tạo compound index để tìm nhanh
spamControlSchema.index({ user: 1, sessionId: 1, ip: 1 });

const SpamControl = mongoose.model("SpamControl", spamControlSchema);
export default SpamControl;
