import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String },

    // Loại giảm giá
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      default: "percentage",
    },
    discountValue: { type: Number, required: true },

    // Điều kiện
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number }, // Tổng số lần sử dụng
    usageLimitPerUser: { type: Number, default: 1 },

    // Thời gian
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },

    // Áp dụng cho
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    excludeProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    applicableUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    usedCount: { type: Number, default: 0 },
    totalDiscountGiven: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    adminNotes: { type: String },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model("Coupon", couponSchema);
