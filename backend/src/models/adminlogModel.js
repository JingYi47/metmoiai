import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "approve",
        "reject",
        "confirm",
        "ship",
        "deliver",
        "cancel",
        "refund",
        "login",
        "logout",
        "export",
        "import",
        "restore",
      ],
    },

    entityType: {
      type: String,
      required: true,
      enum: [
        "product",
        "order",
        "user",
        "category",
        "coupon",
        "review",
        "banner",
      ],
    },

    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityName: { type: String },

    changes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    ipAddress: { type: String },
    userAgent: { type: String },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },

    errorMessage: { type: String },

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

// Index để query nhanh
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ entityType: 1, entityId: 1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

export const AdminLog =
  mongoose.models.AdminLog || mongoose.model("AdminLog", adminLogSchema);
