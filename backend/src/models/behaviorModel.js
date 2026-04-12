import mongoose from "mongoose";

const userBehaviorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Cho phép null nếu là khách
    },
    // TRƯỜNG MỚI: Định danh khách vãng lai
    sessionId: {
      type: String,
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    action: {
      type: String,
      enum: ["view", "search", "cart", "buy", "wishlist", "abandon"],
      required: true,
    },
    keyword: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Đánh index để truy vấn nhanh hơn khi dữ liệu lớn
userBehaviorSchema.index({ user: 1, createdAt: -1 });
userBehaviorSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.models.Behavior ||
  mongoose.model("Behavior", userBehaviorSchema);
