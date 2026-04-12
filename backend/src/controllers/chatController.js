import Product from "../models/productModel.js";
import Behavior from "../models/behaviorModel.js";
import ChatHistory from "../models/chatHistoryModel.js";
import axios from "axios";

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================
const trackBehavior = async (req, action, productId = null, keyword = null) => {
  try {
    const userId = req.user?._id;
    // Đảm bảo lấy đúng sessionId từ header hoặc session mặc định
    const sessionId =
      req.headers["x-session-id"] || req.sessionID || "guest_session";

    const score = action === "search" ? 2 : action === "view" ? 3 : 1;

    await Behavior.create({
      user: userId,
      sessionId: sessionId,
      action: action,
      product: productId,
      keyword: keyword,
      score: score,
    });
  } catch (err) {
    console.error("Lỗi ghi hành vi:", err.message);
  }
};

// ==========================================
// 2. CHAT CONTROLLER (ĐÃ SỬA LỖI KẾT NỐI AI)
// ==========================================
export const chat = async (req, res) => {
  try {
    console.log("\n--- CHAT SESSION STARTED ---");
    const { message } = req.body;
    // Lấy sessionId cực kỳ quan trọng để gửi sang Python
    const sessionId =
      req.headers["x-session-id"] || req.sessionID || "guest_default";

    const userIp = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // BƯỚC 1: Track hành vi
    await trackBehavior(req, "search", null, message);

    // BƯỚC 2: Lấy sản phẩm gửi cho AI
    let rawProducts = await Product.find({ isActive: true }).lean();

    if (!rawProducts || rawProducts.length === 0) {
      return res.json({
        success: true,
        reply:
          "Chào bạn, hiện tại shop chưa cập nhật sản phẩm. Bạn quay lại sau nhé!",
        product: null,
      });
    }

    // Chỉ gửi các thông tin cần thiết nhất cho AI (giảm tải dung lượng)
    const productsForAI = rawProducts.map((p) => ({
      name: p.name,
      slug: p.slug, // AI sẽ trả về cái này làm productId
      price: p.price,
      brand: p.brand,
      category: typeof p.category === "object" ? p.category.name : p.category,
    }));

    // BƯỚC 3: GỌI PYTHON AI (SỬA LẠI PAYLOAD)
    let aiResponse;
    try {
      aiResponse = await axios.post(
        "http://127.0.0.1:5001/chat", // Cổng 5001 khớp với app.py của bạn
        {
          message,
          products: productsForAI,
          sessionId: sessionId, // Gửi kèm sessionId để AI nhớ hội thoại
        },
        { timeout: 15000 },
      );
    } catch (aiError) {
      console.error("AI Call Failed (Python Server):", aiError.message);
      // Trả về lỗi thân thiện thay vì crash app
      return res.status(500).json({
        success: false,
        reply:
          "AI của shop đang bận xử lý dữ liệu, bạn thử lại sau vài giây nhé!",
      });
    }

    // BƯỚC 4: Xử lý kết quả từ AI
    let resultProduct = null;
    const aiData = aiResponse.data; // { reply, productId, discount... }

    if (aiData?.productId) {
      // Tìm lại thông tin đầy đủ của sản phẩm để hiện ảnh ở Frontend
      resultProduct = await Product.findOne({
        slug: aiData.productId,
        isActive: true,
      }).lean();

      if (resultProduct) {
        await trackBehavior(req, "view", resultProduct._id, message);
      }
    }

    // BƯỚC 5: Lưu lịch sử chat vào MongoDB (NodeJS)
    await ChatHistory.create({
      user: req.user?._id || null,
      sessionId: sessionId,
      message: message,
      response: aiData?.reply || "Tôi có thể giúp gì cho bạn?",
      productId: resultProduct?._id || null,
      intent: aiData?.intent || "consultation",
      ip: userIp,
      userAgent: userAgent,
    });

    // Trả về kết quả hoàn chỉnh cho React
    return res.json({
      success: true,
      reply: aiData?.reply,
      product: resultProduct, // Có chứa images, price, name để render Card
      discount: aiData?.discount || 0,
    });
  } catch (err) {
    console.error("Chat Controller Critical Error:", err.message);
    return res.status(500).json({
      success: false,
      reply: "Rất tiếc, hệ thống đang bận. Vui lòng thử lại sau!",
    });
  }
};

// ==========================================
// 3. RECOMMENDATION CONTROLLERS
// ==========================================
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    const sessionId =
      req.headers["x-session-id"] || req.sessionID || "guest_session";

    let recommendations = [];
    const query = userId ? { user: userId } : { sessionId: sessionId };

    const behaviors = await Behavior.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    if (behaviors.length > 0) {
      recommendations = await getPersonalizedByBehavior(behaviors);
    } else {
      recommendations = await getTrendingProducts();
    }

    const sections = [
      {
        id: "personalized",
        title: userId ? "Dành riêng cho bạn" : "Gợi ý cho bạn",
        products: recommendations.slice(0, 6),
      },
    ];

    res.json({ success: true, sections, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function getPersonalizedByBehavior(behaviors) {
  const brandScores = new Map();
  const productIds = behaviors
    .filter((b) => b.product)
    .map((b) => b.product.toString());

  const products = await Product.find({ _id: { $in: productIds } }).lean();
  products.forEach((p) => {
    if (p.brand) brandScores.set(p.brand, (brandScores.get(p.brand) || 0) + 1);
  });

  const topBrand = Array.from(brandScores.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  return await Product.find({
    isActive: true,
    $or: [{ brand: topBrand }, { rating: { $gte: 4 } }],
  })
    .limit(12)
    .lean();
}

async function getTrendingProducts() {
  return await Product.find({ isActive: true })
    .sort({ views: -1 })
    .limit(12)
    .lean();
}

// ==========================================
// 4. HISTORY CONTROLLERS
// ==========================================
export const getChatHistory = async (req, res) => {
  const query = req.user?._id
    ? { user: req.user._id }
    : { sessionId: req.headers["x-session-id"] || req.sessionID };
  const history = await ChatHistory.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ success: true, history });
};

export const clearChatHistory = async (req, res) => {
  const query = req.user?._id
    ? { user: req.user._id }
    : { sessionId: req.headers["x-session-id"] || req.sessionID };
  await ChatHistory.deleteMany(query);
  res.json({ success: true, message: "Đã xóa!" });
};
