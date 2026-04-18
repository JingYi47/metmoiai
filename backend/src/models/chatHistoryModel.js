import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    intent: {
      type: String,
      enum: ["product", "policy", "promotion", "shipping", "consultation", "other"],
      default: "other",
    },
    success: {
      type: Boolean,
      default: true,
    },
    responseTime: {
      type: Number,
      default: 0,
    },
    // Thêm các trường chống spam
    isSpam: {
      type: Boolean,
      default: false,
    },
    spamReason: {
      type: String,
      enum: [
        "none",
        "rate_limit",
        "cooldown",
        "message_length",
        "repeat_pattern",
        "url_spam",
        "blocked",
      ],
      default: "none",
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1, createdAt: -1 });
chatHistorySchema.index({ isSpam: 1 });

export default mongoose.model("ChatHistory", chatHistorySchema);
