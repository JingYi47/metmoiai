import mongoose from "mongoose";
const productViewLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sessionId: { type: String },
    duration: { type: Number },
    source: { type: String },
    device: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
export default mongoose.models.View ||
  mongoose.model("View", productViewLogSchema);
