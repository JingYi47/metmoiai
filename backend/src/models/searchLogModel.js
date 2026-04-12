import mongoose from "mongoose";

const searchLogSchema = new mongoose.Schema({
  query: { type: String, required: true, index: true },
  resultsCount: { type: Number, default: 0 },
  source: {
    type: String,
    enum: ["ai", "cache", "fallback", "error_fallback"],
    default: "ai",
  },
  responseTime: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  sessionId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

searchLogSchema.index({ query: 1, createdAt: -1 });
searchLogSchema.index({ createdAt: -1 });

export default mongoose.model("SearchLog", searchLogSchema);
