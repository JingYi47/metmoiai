import crypto from "crypto";
import moment from "moment";
import { Checkout } from "../models/checkoutModel.js";
import { createOrderFromCheckout } from "./orderController.js";

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function buildQueryString(params) {
  return Object.keys(params)
    .map(
      (key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`,
    )
    .join("&");
}

//  create vnpay
export const createVnpayPayment = async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    // tăng số lần thanh toán
    checkout.paymentAttempts = (checkout.paymentAttempts || 0) + 1;
    checkout.lastPaymentAt = new Date();
    await checkout.save();

    const txnRef = `${checkout._id}_${checkout.paymentAttempts}`;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh_toan_don_${checkout._id}`,
      vnp_OrderType: "other",
      vnp_Amount: checkout.total * 100,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: (() => {
        const raw =
          req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          req.connection?.remoteAddress ||
          "127.0.0.1";
        // Chuẩn hóa IPv6 loopback → IPv4
        const ip = raw.split(",")[0].trim();
        return ip === "::1" || ip === "::ffff:127.0.0.1" ? "127.0.0.1" : ip;
      })(),
      vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = buildQueryString(vnp_Params);

    const secureHash = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    vnp_Params.vnp_SecureHash = secureHash;

    const paymentUrl = process.env.VNP_URL + "?" + buildQueryString(vnp_Params);

    return res.json({ success: true, paymentUrl });
  } catch (err) {
    console.error("VNPAY CREATE ERROR:", err);
    return res.status(500).json({ message: "VNPAY error" });
  }
};

// vnpay return
export const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = buildQueryString(vnp_Params);

    const checkHash = crypto
      .createHmac("sha512", process.env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash !== checkHash) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-fail`);
    }

    if (vnp_Params.vnp_ResponseCode !== "00") {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-fail`);
    }

    //TÁCH TXNREF
    const checkoutId = vnp_Params.vnp_TxnRef.split("_")[0];
    const checkout = await Checkout.findById(checkoutId);

    if (!checkout) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment-fail`);
    }

    // checkout.status = "paid";
    // checkout.paymentMethod = "VNPAY";
    // await checkout.save();
    // await createOrderFromCheckout(checkout._id);

    // nếu chưa paid mới xử lý
    if (checkout.status !== "paid") {
      checkout.status = "paid";
      checkout.paymentMethod = "VNPAY";
      await checkout.save();

      await createOrderFromCheckout(checkout._id);
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-success/${checkout._id}`,
    );
  } catch (err) {
    console.error("VNPAY RETURN ERROR:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-fail`);
  }
};

// VNPAY IPN
export const vnpayIPN = async (req, res) => {
  return res.json({
    RspCode: "00",
    Message: "Confirm Success",
  });
};
