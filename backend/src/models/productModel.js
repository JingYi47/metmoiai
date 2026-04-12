import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: { type: String, unique: true, index: true },

    description: { type: String, required: true },

    originalPrice: { type: Number, required: true, min: 0 },

    price: { type: Number, min: 0 },

    discount: { type: Number, default: 0, min: 0 },

    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

    discountExpiry: { type: Date },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: { type: String, required: true },

    colors: [
      {
        name: { type: String, required: true },
        images: [
          {
            url: { type: String, required: true },
            public_id: { type: String },
          },
        ],
        stock: { type: Number, default: 0 },
      },
    ],

    specifications: { type: Map, of: String, default: {} },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    // stock: { type: Number, default: 0, min: 0 },

    rating: { type: Number, default: 0, min: 0, max: 5 },

    reviewCount: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },

    isFeatured: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    approvedAt: { type: Date },

    adminNotes: { type: String },

    adminStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      default: "approved",
    },
    views: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
productSchema.pre("save", async function (next) {
  if (!this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "") +
      "-" +
      Date.now();
  }
  if (this.discount > this.originalPrice) {
    this.discount = this.originalPrice;
  }

  // Nếu có discount → tính lại price
  if (this.originalPrice > 0 && this.discount > 0) {
    this.price = this.originalPrice - this.discount;
    this.discountPercentage = Math.round(
      (this.discount / this.originalPrice) * 100,
    );
  } else {
    this.price = this.originalPrice;
    this.discount = 0;
    this.discountPercentage = 0;
  }

  if (this.discountPercentage > 100) {
    this.discountPercentage = 100;
  }
});

productSchema.virtual("isOnSale").get(function () {
  const now = new Date();
  return (
    this.discountPercentage > 0 &&
    (!this.discountExpiry || now < this.discountExpiry)
  );
});

productSchema.virtual("salePrice").get(function () {
  return this.isOnSale ? this.price : this.originalPrice;
});
productSchema.virtual("totalStock").get(function () {
  return (this.colors ?? []).reduce((sum, c) => sum + (c.stock || 0), 0);
});

const Product = mongoose.model("Product", productSchema);
export default Product;
