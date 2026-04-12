import { Coupon } from "../models/couponModel.js";

//  Áp dụng / kiểm tra mã giảm giá
export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code)
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập mã giảm giá" });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });
    if (!coupon)
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
      });

    const now = new Date();
    if (coupon.startDate > now)
      return res
        .status(400)
        .json({ success: false, message: "Mã chưa tới thời gian sử dụng" });
    if (coupon.expiryDate < now)
      return res
        .status(400)
        .json({ success: false, message: "Mã giảm giá đã hết hạn" });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res
        .status(400)
        .json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng" });
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue)
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}đ để dùng mã này`,
      });

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "free_shipping") {
      discount = 0; // phí ship tính ở checkout
    }
    discount = Math.round(discount);

    return res.json({
      success: true,
      message: `Áp dụng "${coupon.name}" thành công`,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// tạo coupon
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      usageLimitPerUser,
      startDate,
      expiryDate,
      applicableCategories,
      applicableProducts,
      excludeProducts,
      applicableUsers,
      isPublic,
      adminNotes,
    } = req.body;

    const exist = await Coupon.findOne({ code: code.toUpperCase() });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Mã coupon đã tồn tại",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      name,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      usageLimitPerUser,
      startDate,
      expiryDate,
      applicableCategories,
      applicableProducts,
      excludeProducts,
      applicableUsers,
      isPublic,
      adminNotes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Tạo coupon thành công",
      coupon,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Lỗi khi tạo coupon",
    });
  }
};

// update coupon
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy coupon",
      });
    }

    Object.assign(coupon, req.body, {
      updatedBy: req.user._id,
    });

    await coupon.save();

    res.json({
      success: true,
      message: "Cập nhật coupon thành công",
      coupon,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật coupon",
    });
  }
};

// tắt/ xóa coupon
export const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy coupon",
    });
  }

  coupon.isActive = false;
  await coupon.save();

  res.json({
    success: true,
    message: "Đã vô hiệu hoá coupon",
  });
};

// xem coupon
export const getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    coupons,
  });
};

// lấy coupon còn hiệu lực
export const getPublicCoupons = async (req, res) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    isPublic: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    coupons,
  });
};
