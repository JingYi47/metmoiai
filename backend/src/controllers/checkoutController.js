import { Checkout } from "../models/checkoutModel.js";
import { Cart } from "../models/cartModel.js";
import { Coupon } from "../models/couponModel.js";

//  TẠO CHECKOUT
export const createCheckout = async (req, res) => {
  try {
    // const { shippingAddress, paymentMethod, couponCode } = req.body;
    const { shippingAddress, paymentMethod, couponId } = req.body;
    // Kiểm tra thông tin giao hàng
    if (
      !shippingAddress?.fullName ||
      !shippingAddress?.phone ||
      !shippingAddress?.address
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin giao hàng",
      });
    }

    // Kiểm tra phương thức thanh toán
    const allowedMethods = ["COD", "MOMO", "VNPAY", "BANKING"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán không hợp lệ",
      });
    }

    //Lấy giỏ hàng
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );

    if (!cart || cart.items.length === 0) {
      console.log("Giỏ hàng đang trống", cart);
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng đang trống",
      });
    }

    //  Chỉ lấy item được tick
    const selectedItems = cart.items.filter((i) => i.isSelected);
    if (selectedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bạn chưa chọn sản phẩm để thanh toán",
      });
    }
    for (let item of selectedItems) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm không tồn tại",
        });
      }

      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.product.name} không đủ hàng`,
        });
      }
    }

    // Snapshot item
    let subtotal = 0;

    const checkoutItems = selectedItems.map((item) => {
      const total = item.priceAtAddition * item.quantity;
      subtotal += total;

      return {
        product: item.product._id,
        name: item.product.name,
        price: item.priceAtAddition,
        quantity: item.quantity,
        color: item.color,
        total,
      };
    });

    // Tính phí vận chuyển
    const shippingFee = subtotal >= 500000 ? 0 : 30000;

    // Áp mã giảm giá
    let discount = 0;
    let couponDoc = null;

    // if (couponCode) {
    //   couponDoc = await Coupon.findOne({
    //     code: couponCode.toUpperCase(),
    //     isActive: true,
    //   });

    //   if (!couponDoc) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Mã giảm giá không hợp lệ",
    //     });
    //   }

    //   const now = new Date();

    //   // Kiểm tra thời gian áp dụng
    //   if (couponDoc.startDate > now || couponDoc.expiryDate < now) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Mã giảm giá đã hết hạn hoặc chưa tới thời gian sử dụng",
    //     });
    //   }

    //   // Kiểm tra giá trị đơn tối thiểu
    //   if (couponDoc.minOrderValue && subtotal < couponDoc.minOrderValue) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Đơn hàng chưa đủ điều kiện áp dụng mã giảm giá",
    //     });
    //   }

    //   // Tính discount
    //   if (couponDoc.discountType === "percentage") {
    //     discount = (subtotal * couponDoc.discountValue) / 100;

    //     if (couponDoc.maxDiscount) {
    //       discount = Math.min(discount, couponDoc.maxDiscount);
    //     }
    //   } else if (couponDoc.discountType === "fixed") {
    //     discount = couponDoc.discountValue;
    //   } else if (couponDoc.discountType === "free_shipping") {
    //     discount = shippingFee;
    //   }
    // }
    if (couponId) {
      couponDoc = await Coupon.findById(couponId);

      if (!couponDoc || !couponDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: "Voucher không hợp lệ",
        });
      }

      const now = new Date();

      if (couponDoc.startDate > now || couponDoc.expiryDate < now) {
        return res.status(400).json({
          success: false,
          message: "Voucher đã hết hạn",
        });
      }

      if (subtotal < couponDoc.minOrderValue) {
        return res.status(400).json({
          success: false,
          message: "Không đủ điều kiện áp dụng",
        });
      }

      if (couponDoc.discountType === "percentage") {
        discount = (subtotal * couponDoc.discountValue) / 100;

        if (couponDoc.maxDiscount) {
          discount = Math.min(discount, couponDoc.maxDiscount);
        }
      } else if (couponDoc.discountType === "fixed") {
        discount = couponDoc.discountValue;
      } else if (couponDoc.discountType === "free_shipping") {
        discount = shippingFee;
      }

      discount = Math.round(discount);
    }
    //Tổng tiền cuối
    const total = Math.max(subtotal + shippingFee - discount, 0);

    // Tạo checkout
    const checkout = await Checkout.create({
      user: req.user._id,
      items: checkoutItems,
      shippingAddress,
      subtotal,
      shippingFee,
      discount,
      total,
      // coupon: couponDoc?._id,
      coupon: couponDoc
        ? {
            couponId: couponDoc._id,
            code: couponDoc.code,
            discount,
          }
        : null,
      paymentMethod,
      status: "pending",
    });

    // Xóa các item đã chọn khỏi giỏ hàng
    const selectedIds = selectedItems.map((i) => i._id.toString());
    cart.items = cart.items.filter(
      (i) => !selectedIds.includes(i._id.toString()),
    );
    cart.discountApplied = 0;
    cart.coupon = null;
    // Tính lại subtotal/total sau khi xóa
    const remaining = cart.items.filter((i) => i.isSelected);
    cart.subtotal = remaining.reduce(
      (s, i) => s + i.priceAtAddition * i.quantity,
      0,
    );
    cart.total = cart.subtotal;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Tạo checkout thành công",
      checkout,
    });
  } catch (error) {
    console.error("Lỗi createCheckout:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tạo checkout",
    });
  }
};

// LẤY CHECKOUT CỦA USER
export const getMyCheckouts = async (req, res) => {
  const checkouts = await Checkout.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json({
    success: true,
    checkouts,
  });
};

// LẤY 1 CHECKOUT CỦA USER
export const getOneCheckout = async (req, res) => {
  try {
    const checkout = await Checkout.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("items.product", "name images imageUrl")
      .populate("coupon", "code name");

    if (!checkout) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    res.json({ success: true, checkout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN CẬP NHẬT TRẠNG THÁI
export const updateCheckoutStatus = async (req, res) => {
  const { status } = req.body;

  const allowedStatus = [
    "pending",
    "paid",
    "shipping",
    "completed",
    "cancelled",
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Trạng thái đơn hàng không hợp lệ",
    });
  }

  const checkout = await Checkout.findById(req.params.id);
  if (!checkout) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy đơn checkout",
    });
  }

  checkout.status = status;
  await checkout.save();

  res.json({
    success: true,
    message: "Cập nhật trạng thái thành công",
    checkout,
  });
};

// ADMIN: LẤY TẤT CẢ ĐƠN HÀNG
export const getAllCheckouts = async (req, res) => {
  try {
    const checkouts = await Checkout.find()
      .populate("user", "username email")
      .sort({ createdAt: -1 });
    res.json({ success: true, checkouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// lấy voucher
export const getAvailableCoupons = async (req, res) => {
  try {
    const { subtotal = 0 } = req.body;
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      isPublic: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
    });

    let validCoupons = [];

    for (let coupon of coupons) {
      if (subtotal < coupon.minOrderValue) continue;

      let discount = 0;

      if (coupon.discountType === "percentage") {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount)
          discount = Math.min(discount, coupon.maxDiscount);
      } else if (coupon.discountType === "fixed") {
        discount = coupon.discountValue;
      }

      discount = Math.round(discount);

      validCoupons.push({
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        discount,
      });
    }

    validCoupons.sort((a, b) => b.discount - a.discount);

    res.json({
      success: true,
      bestCoupon: validCoupons[0] || null,
      coupons: validCoupons,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
