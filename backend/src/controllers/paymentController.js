import { Checkout } from "../models/checkoutModel.js";
import { createVnpayPayment } from "./vnpayController.js";
import { createMomoPayment } from "./momoController.js";

export const createPayment = async (req, res) => {
  try {
    const { checkoutId } = req.body;

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn" });
    }
    if (!checkout.items || checkout.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Checkout items missing",
      });
    }
    if (checkout.status !== "pending") {
      return res.status(400).json({ success: false, message: "Đơn đã xử lý" });
    }

    // COD
    if (checkout.paymentMethod === "COD") {
      checkout.status = "shipping";
      await checkout.save();

      return res.json({
        success: true,
        message: "Đơn COD đã tạo, chờ giao hàng",
        checkout,
      });
    }

    // VNPAY
    if (checkout.paymentMethod === "VNPAY") {
      return await createVnpayPayment(req, res, checkout);
    }

    // MOMO
    if (checkout.paymentMethod === "MOMO") {
      return await createMomoPayment(req, res, checkout);
    }

    return res
      .status(400)
      .json({ success: false, message: "Phương thức không hợp lệ" });
  } catch (error) {
    console.error("createPayment error:", error);
    res.status(500).json({ success: false, message: "Lỗi tạo thanh toán" });
  }
};
