import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        color: { type: String },
        total: { type: Number, required: true },
      },
    ],

    // Địa chỉ giao hàng
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      ward: { type: String },
      district: { type: String },
      province: { type: String },
    },

    // Giá trị
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Mã giảm giá (Shopee style)
    coupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
      code: String,
      discount: Number,
    },
    // Thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY", "MOMO", "BANKING"],
      default: "COD",
    },

    // Trạng thái
    status: {
      type: String,
      enum: ["pending", "paid", "shipping", "completed", "cancelled"],
      default: "pending",
    },

    // Thanh toán
    paymentAttempts: { type: Number, default: 0 },
    lastPaymentAt: { type: Date },
  },
  { timestamps: true },
);

export const Checkout = mongoose.model("Checkout", checkoutSchema);
