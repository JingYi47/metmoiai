import crypto from "crypto";
import https from "https";
import { Checkout } from "../models/checkoutModel.js";
import { createOrderFromCheckout } from "./orderController.js";

export const createMomoPayment = async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout)
      return res.status(404).json({ message: "Checkout not found" });

    checkout.paymentMethod = "MOMO";
    checkout.paymentAttempts = (checkout.paymentAttempts || 0) + 1;
    checkout.lastPaymentAt = new Date();
    await checkout.save();

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;
    const endpoint = process.env.MOMO_ENDPOINT;

    // Nếu chưa cấu hình env → fallback simulator (dev mode)
    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      return res.json({
        success: true,
        payUrl: `http://localhost:3000/payment/momo/simulator`,
        checkoutId: checkout._id,
      });
    }

    const orderId = `${checkout._id}_${checkout.paymentAttempts}`;
    const requestId = orderId;
    const amount = String(Math.round(checkout.total));
    const orderInfo = `Thanh toan don hang ${checkout._id}`;
    const requestType = "payWithMethod";
    // const requestType = "captureWallet";
    const extraData = Buffer.from(
      JSON.stringify({ checkoutId: checkout._id }),
    ).toString("base64");

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const body = JSON.stringify({
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    });

    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const payUrl = await new Promise((resolve, reject) => {
      const momoReq = https.request(options, (momoRes) => {
        let data = "";
        momoRes.on("data", (chunk) => (data += chunk));
        momoRes.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.payUrl) resolve(json.payUrl);
            else reject(new Error(json.message || "MoMo: no payUrl"));
          } catch (e) {
            reject(e);
          }
        });
      });
      momoReq.on("error", reject);
      momoReq.write(body);
      momoReq.end();
    });

    return res.json({ success: true, payUrl, checkoutId: checkout._id });
  } catch (err) {
    console.error("CREATE MOMO ERROR:", err);
    res
      .status(500)
      .json({ message: "Create MoMo payment failed", detail: err.message });
  }
};

export const ipnCallback = async (req, res) => {
  console.log("📩 MOMO IPN:", req.body);
  return res.status(204).end();
};

export const handleCallback = async (req, res) => {
  try {
    console.log("MOMO RETURN QUERY:", req.query);

    const { checkoutId, resultCode } = req.query;

    if (!checkoutId) {
      return res.status(400).json({ message: "Missing checkoutId" });
    }

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    // if (resultCode === "0") {
    //   checkout.status = "paid";
    //   checkout.lastPaymentAt = new Date();
    // } else {
    //   checkout.status = "cancelled";
    // }

    // await checkout.save();

    if (resultCode === "0") {
      // chống tạo order trùng
      if (checkout.status !== "paid") {
        checkout.status = "paid";
        checkout.lastPaymentAt = new Date();
        checkout.paymentMethod = "MOMO";
        await checkout.save();

        await createOrderFromCheckout(checkout._id);
      }
    } else {
      checkout.status = "cancelled";
      await checkout.save();
    }

    return res.json({
      message: "MoMo return handled",
      status: checkout.status,
      checkoutId: checkout._id,
    });
  } catch (error) {
    console.error("MOMO RETURN ERROR:", error);
    res.status(500).json({ message: "Handle return failed" });
  }
};

// export const simulateCallback = async (req, res) => {
//   try {
//     const { checkoutId, success = true } = req.body;

//     const checkout = await Checkout.findById(checkoutId);
//     if (!checkout) {
//       return res.status(404).json({ message: "Checkout not found" });
//     }

//     checkout.status = success ? "paid" : "cancelled";
//     checkout.paymentMethod = "MOMO";
//     await checkout.save();

//     return res.json({
//       success: true,
//       message: "MoMo payment simulated",
//       checkout,
//     });
//   } catch (err) {
//     console.error("SIMULATE MOMO ERROR:", err);
//     res.status(500).json({ message: "Simulation failed" });
//   }
// };

export const simulateCallback = async (req, res) => {
  try {
    const { checkoutId, success = true } = req.body;

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (success) {
      // chống duplicate order
      if (checkout.status !== "paid") {
        checkout.status = "paid";
        checkout.paymentMethod = "MOMO";
        checkout.lastPaymentAt = new Date();
        await checkout.save();

        await createOrderFromCheckout(checkout._id);
      }
    } else {
      checkout.status = "cancelled";
      await checkout.save();
    }

    return res.json({
      success: true,
      message: "MoMo payment simulated",
      checkout,
    });
  } catch (err) {
    console.error("SIMULATE MOMO ERROR:", err);
    res.status(500).json({ message: "Simulation failed" });
  }
};
