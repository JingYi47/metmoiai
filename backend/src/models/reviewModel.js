import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // 1 user chỉ review 1 lần / sp

export const Review = mongoose.model("Review", reviewSchema);
