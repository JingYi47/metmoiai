import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    checkout: { type: mongoose.Schema.Types.ObjectId, ref: "Checkout" },

    // Sản phẩm
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number },
        color: { type: String },
        total: { type: Number },
      },
    ],

    // Thông tin giao hàng
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      district: { type: String },
      ward: { type: String },
      province: { type: String },
      note: { type: String },
    },

    // Giá trị
    subtotal: { type: Number },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number },

    // Thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "BANKING", "MOMO", "VNPAY", "cod", "banking", "momo", "vnpay"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "unpaid", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Trạng thái
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    // === ADMIN TRACKING ===
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    confirmedAt: { type: Date },

    shippedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shippedAt: { type: Date },
    trackingNumber: { type: String },

    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveredAt: { type: Date },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    adminNotes: { type: String },
    invoiceNumber: { type: String, unique: true },
    invoiceGeneratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    refundedAt: { type: Date },
    refundAmount: { type: Number },
    refundReason: { type: String },
  },
  { timestamps: true },
);

// Tự động tạo invoice number
orderSchema.pre("save", async function () {
  // Tạo invoiceNumber ngay khi tài liệu chưa có (không phụ thuộc status)
  // để tránh lỗi unique index khi invoiceNumber đang là null.
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: new Date(year, date.getMonth(), 1) },
    });
    this.invoiceNumber = `INV-${year}${month}-${(count + 1).toString().padStart(4, "0")}`;
  }
});

export const Order = mongoose.model("Order", orderSchema);
