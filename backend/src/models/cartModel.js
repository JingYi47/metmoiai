import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        color: { type: String },
        quantity: { type: Number, default: 1, min: 1 },
        priceAtAddition: { type: Number },
        isSelected: { type: Boolean, default: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    subtotal: { type: Number, default: 0 },
    discountApplied: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },

    isAbandoned: { type: Boolean, default: false },
    abandonedAt: { type: Date },
    reminderSent: { type: Boolean, default: false },

    lastViewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastViewedAt: { type: Date },
  },
  { timestamps: true },
);

export const Cart = mongoose.model("Cart", cartSchema);
