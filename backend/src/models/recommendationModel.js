import mongoose from "mongoose";
const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recommendedProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        score: { type: Number },
        reason: { type: String },
      },
    ],
    modelVersion: { type: String },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
export default mongoose.models.Recommendation ||
  mongoose.model("Recommendation", recommendationSchema);
