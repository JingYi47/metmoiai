import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // thông tin ng dùng
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider !== "google";
      },
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // googleId: { type: String, default: null, unique: true, sparse: true },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // xác thực bảo mật
    isVerified: { type: Boolean, default: false },
    // isLoggedIn: { type: Boolean, default: false },
    // token: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null, index: true },

    // hình đại diện
    profilePic: { type: String, default: "" },
    profilePicPublicId: { type: String, default: "" },

    // phân quyền
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },

    // Địa chỉ giao hàng
    phoneNo: {
      type: String,
      trim: true,
      match: [/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ"],
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },

    //  Danh sách yêu thích
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],

    // Lịch sử xem sản phẩm (clickstream)
    viewedProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        viewedAt: { type: Date, default: Date.now },
        viewCount: { type: Number, default: 1 },
      },
    ],

    // Sản phẩm bỏ giỏ chưa mua
    cartAbandonedItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        addedAt: { type: Date, default: Date.now },
        quantity: { type: Number, default: 1 },
      },
    ],

    // Sở thích cá nhân hóa
    preferences: {
      categories: [{ type: String }],
      brands: [{ type: String }],
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100000000 },
      },
    },

    // Lịch sử tìm kiếm
    searchHistory: [
      {
        query: { type: String },
        searchedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
