import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    description: { type: String },
    image: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    order: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
  },
  { timestamps: true },
);

export const Category = mongoose.model("Category", categorySchema);
