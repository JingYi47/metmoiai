import Product from "../models/productModel.js";
import Behavior from "../models/behaviorModel.js";
import ChatHistory from "../models/chatHistoryModel.js";
import ChatAdmin from "../models/chatAdminModel.js";
import axios from "axios";
import mongoose from "mongoose";

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
    console.log("\n>>> NEW AI CHAT REQUEST RECEIVED <<<");
    const { message, contextProductId } = req.body;
    console.log("Message:", message);
    console.log("ContextProductID:", contextProductId);
    // Lấy sessionId cực kỳ quan trọng để gửi sang Python
    const sessionId =
      req.headers["x-session-id"] || req.sessionID || "guest_default";

    const userIp = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // BƯỚC 1: Track hành vi
    await trackBehavior(req, "search", null, message);

    // BƯỚC 2: Lấy sản phẩm liên quan bằng Hybrid Search (AI + DB)
    // Sử dụng logic tương tự smartSearch ở aiController để có độ chính xác cao nhất
    let rawProducts = [];
    let contextProduct = null;

    // 1. Lấy context sản phẩm trước đó (nếu có contextProductId hoặc từ lịch sử)
    if (contextProductId) {
      contextProduct = await Product.findOne({ 
        $or: [{ slug: contextProductId }, { _id: (contextProductId.length === 24 ? contextProductId : undefined) }]
      }).lean();
    }
    
    const msgLower = message.toLowerCase();
    const isAskingAboutContext = /này|đó|kia|thế nào|cấu hình|bảo hành|máy|chi tiết|sản phẩm/.test(msgLower);

    if (!contextProduct && isAskingAboutContext) {
      const lastHistory = await ChatHistory.findOne({ 
        sessionId: sessionId, 
        productId: { $ne: null } 
      }).sort({ createdAt: -1 }).lean();

      if (lastHistory && lastHistory.productId) {
        contextProduct = await Product.findById(lastHistory.productId).lean();
      }
    }

    // 2. Gọi AI Smart Service để lấy top sản phẩm liên quan nhất theo ngữ nghĩa
    // 🔥 Nếu có ngữ cảnh sản phẩm VÀ câu hỏi liên quan đến sản phẩm đó, KHÔNG cần tìm kiếm thêm
    const isContextualQuestion = contextProduct && /này|đó|kia|thế nào|cấu hình|bảo hành|màu|chi tiết|giá|pin|camera|màn hình|chip|ram|rom|bộ nhớ|trọng lượng/.test(msgLower);

    if (isContextualQuestion) {
      // Chỉ gửi đúnh 1 sản phẩm đang hỏi, bức AI trả lời chính xác
      rawProducts = [contextProduct];
      console.log(`🔒 Contextual question detected - lốck vào sản phẩm: "${contextProduct.name}"`);
    } else {
    try {
      // Tối ưu hóa truy vấn bằng cách thêm từ đồng nghĩa (Synonyms)
      let expandedQuery = message;
      const lowerMsg = message.toLowerCase();
      
      const synonymMap = {
        "máy tính": "laptop, macbook, pc, máy tính xách tay, notebook, workstation",
        "laptop": "máy tính xách tay, notebook, máy tính",
        "điện thoại": "iphone, samsung, smartphone, di động, mobile",
        "tai nghe": "airpods, buds, headphone, earphone",
        "đồng hồ": "smartwatch, apple watch, samsung watch"
      };

      for (const [key, synonyms] of Object.entries(synonymMap)) {
        if (lowerMsg.includes(key)) {
          expandedQuery += " " + synonyms;
          break;
        }
      }

      console.log(`🔍 Gọi Hybrid Search cho chat: "${message}" (Expanded: "${expandedQuery}"`);
      const aiQueryResult = await axios.post("http://127.0.0.1:5002/api/search", {
        query: expandedQuery,
        top_n: 15
      }, { timeout: 5000 }).catch(() => ({ data: { results: [] } }));

      const aiSlugs = aiQueryResult.data.results?.map(r => r.slug) || [];
      
      // Tìm trong DB các sản phẩm AI gợi ý + Tìm theo regex cơ bản (Hybrid)
      const regex = new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      
      const combinedProducts = await Product.find({
        isActive: true,
        adminStatus: 'approved',
        $or: [
          { slug: { $in: aiSlugs } },
          { name: regex },
          { brand: regex }
        ]
      }).limit(20).lean();

      rawProducts = combinedProducts;
    } catch (searchErr) {
      console.error("Search integration failed, fallback to trending:", searchErr.message);
      rawProducts = await Product.find({ isActive: true, adminStatus: 'approved' })
        .sort({ sold: -1 })
        .limit(10)
        .lean();
    }

    // Luôn đảm bảo contextProduct nằm ở đầu danh sách nếu có
    if (contextProduct) {
      rawProducts = [contextProduct, ...rawProducts.filter(p => p._id.toString() !== contextProduct._id.toString())];
    }
    } // end else

    console.log(`DEBUG: Sending ${rawProducts.length} relevant products to AI (filtered from query: "${message}")`);
    console.log("Product Names:", rawProducts.map(p => p.name).join(", "));

    if (!rawProducts || rawProducts.length === 0) {
      return res.json({
        success: true,
        reply:
          "Chào bạn, hiện tại shop chưa cập nhật sản phẩm. Bạn hãy để lại thông tin, nhân viên sẽ liên hệ lại nhé!",
        product: null,
      });
    }

    // Chỉ gửi các thông tin cần thiết nhất cho AI (có chứa specs và description cắt ngắn)
    const productsForAI = rawProducts.slice(0, 20).map((p) => {
      // Đảm bảo specs là object sạch
      const specifications = p.specifications || {};

      return {
        name: p.name,
        slug: p.slug,
        price: p.price,
        brand: p.brand,
        category: typeof p.category === "object" ? p.category?.name : p.category,
        specs: specifications,
        description: p.description ? p.description.substring(0, 500) : ""
      };
    });

    // BƯỚC 3: GỌI PYTHON AI
    let aiResponse;
    try {
      aiResponse = await axios.post(
        "http://127.0.0.1:5001/chat",
        {
          message,
          products: productsForAI,
          sessionId: sessionId,
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
    console.log("AI Response Data:", JSON.stringify(aiData).substring(0, 300));

    if (aiData?.productId) {
      try {
        // Tìm lại thông tin đầy đủ của sản phẩm để hiện ảnh ở Frontend
        // 🔥 Nếu có contextProduct, ưu tiên dùng luôn (không cần query thêm)
        if (contextProduct && contextProduct.slug === aiData.productId) {
          resultProduct = contextProduct;
        } else {
          resultProduct = await Product.findOne({
            slug: aiData.productId,
            isActive: true,
          }).lean();
        }

        if (resultProduct) {
          await trackBehavior(req, "view", resultProduct._id, message);
        }
      } catch (productErr) {
        console.error("Error fetching result product:", productErr.message);
      }
    } else if (contextProduct && /bảo hành|màu|cấu hình|chi tiết|pin|camera/.test(message.toLowerCase())) {
      // 🔥 Nếu AI không trả về productId nhưng đây là câu hỏi về context, trả về context product
      resultProduct = contextProduct;
    }

    // BƯỚC 5: Lưu lịch sử chat vào MongoDB (NodeJS) - ChatHistory cho AI
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

    // BƯỚC 6: ĐỒNG BỘ VỚI CHAT ADMIN (ĐỂ ADMIN THEO DÕI)
    try {
      const adminQuery = req.user?._id 
        ? { userId: req.user._id, status: 'active' }
        : { conversationId: { $regex: sessionId }, status: 'active' }; // Fallback to session search if guest

      let adminConversation = await ChatAdmin.findOne(adminQuery);
      
      if (adminConversation) {
        const aiMessage = {
          senderId: req.user?._id || adminConversation.userId, // Use existing userId if guest
          senderType: 'admin',
          message: aiData?.reply || "Tôi có thể giúp gì cho bạn?",
          products: resultProduct ? [resultProduct] : [],
          createdAt: new Date()
        };
        adminConversation.messages.push(aiMessage);
        adminConversation.lastMessageAt = new Date();
        await adminConversation.save();
      }
    } catch (adminErr) {
      console.error("Lỗi đồng bộ ChatAdmin:", adminErr.message);
    }

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

async function callDifyAIWithRetry(url, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(url, data, {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DIFY_API_KEY_CHAT}`,
        },
      });
      return response;
    } catch (error) {
      console.log(error)
      const isLast = i === retries - 1;
      if (isLast) throw error;
      console.log(`⚠️ Retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
export const chatDify = async (req, res) => {
  try {
    console.log("\n>>> NEW AI CHAT REQUEST RECEIVED <<<");
    const { message, conversationId } = req.body;
    console.log("Message:", message);

    const userIp = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await trackBehavior(req, "search", null, message);

    let aiResponse = await callDifyAIWithRetry(`${process.env.AI_SERVICE_URL}/chat-messages`, {
      "inputs": {
          "mode": "query",
          "hasData": "false",
      },
      "conversation_id": conversationId,
      "query": message,
      "response_mode": "blocking",
      "user": "test_user_01"
    });

    const difyResult = aiResponse.data;
    console.log("🔍 Dify Smart Search Response:", JSON.stringify(difyResult, null, 2));

    // Dify Workflow blocking output path: .data.outputs.search_query
    const rawResponse = difyResult?.answer;

    if (!rawResponse) {
      throw new Error("AI không trả về kết quả truy vấn hợp lệ (outputs.search_query missing)");
    }

    let results = [];
    let finalResults = [];
    if (rawResponse?.includes("collection") && rawResponse?.includes("query")) {
      const cleanJsonString = rawResponse.replace(/```json|```/g, "").trim();

      const queryObj = JSON.parse(cleanJsonString);
      console.log("🔍 Dify Smart Search Query:", queryObj);

      const mongoQuery = queryObj.query || {};
      const collectionName = queryObj.collection || "products";
      const sort = queryObj.sort || {};
      const limit = parseInt(queryObj.limit) || 20;
    
      results = await mongoose.connection.db
      .collection(collectionName)
      .find(mongoQuery)
      .sort(sort)
      .limit(limit)
      .toArray();
      console.log('Mongo results', results);
      
      finalResults = results.map((prod) => {
        if (prod.images && prod.images.length > 0) {
          prod.thumbnail = prod.images[0].url;
        }
        return prod;
      });

      aiResponse = await callDifyAIWithRetry(`${process.env.AI_SERVICE_URL}/chat-messages`, {
        "inputs": {
            "mode": "db_result",
            "hasData": (finalResults || []).length > 0 ? "true" : "false",
            "db_result": JSON.stringify((finalResults || []).slice(0, 15).map((prod) => {
              return {
                name: prod.name,
                price: prod.price,
                thumbnail: prod.thumbnail,
                specifications: prod.specifications,
              };
            }))
        },
        "conversation_id": conversationId,
        "query": message,
        "response_mode": "blocking",
        "user": "test_user_01"
      });

      console.log('aiResponseee', aiResponse)
    }

    const sessionId =
      req.headers["x-session-id"] || req.sessionID || "guest_default";

    // Lưu lịch sử chat vào MongoDB (NodeJS) - ChatHistory cho AI
    await ChatHistory.create({
      user: req.user?._id || null,
      sessionId: sessionId,
      message: message,
      response: aiResponse?.data?.answer || "Tôi có thể giúp gì cho bạn?",
      productId: null,
      intent: aiResponse?.data?.intent || "consultation",
      ip: userIp,
      userAgent: userAgent,
    });

    // ĐỒNG BỘ VỚI CHAT ADMIN (ĐỂ ADMIN THEO DÕI)
    try {
      const adminQuery = req.user?._id 
        ? { userId: req.user._id, status: 'active' }
        : { conversationId: { $regex: sessionId }, status: 'active' }; // Fallback to session search if guest

      let adminConversation = await ChatAdmin.findOne(adminQuery);
      
      if (adminConversation) {
        const aiMessage = {
          senderId: req.user?._id || adminConversation.userId, // Use existing userId if guest
          senderType: 'admin',
          message: aiResponse?.data?.answer || "Tôi có thể giúp gì cho bạn?",
          products: finalResults || [],
          createdAt: new Date()
        };
        adminConversation.messages.push(aiMessage);
        adminConversation.lastMessageAt = new Date();
        await adminConversation.save();
      }
    } catch (adminErr) {
      console.error("Lỗi đồng bộ ChatAdmin:", adminErr.message);
    }

    return res.json({
      success: true,
      product: finalResults,
      conversationId: aiResponse?.data?.conversation_id,
      reply: aiResponse?.data?.answer || "Tôi có thể giúp gì cho bạn?",
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
