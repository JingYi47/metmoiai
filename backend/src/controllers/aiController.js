/**
 * AI CONTROLLER - Kết nối Web và AI Service
 * Tích hợp cache, retry, fallback, auto sync
 */

import axios from "axios";
import mongoose from "mongoose";
import Product from "../models/productModel.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5002";
const CACHE_TTL = 10 * 60 * 1000; // Increased to 10 minutes

// Cache đơn giản
const searchCache = new Map();

// Queue đồng bộ
let isSyncing = false;
let pendingSync = false;

// ==================== HÀM TIỆN ÍCH ====================

function getCacheKey(query, limit) {
  return `search:${query.toLowerCase().trim()}:${limit}`;
}

async function callAIWithRetry(url, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(url, data, { timeout: 10000 });
      return response;
    } catch (error) {
      const isLast = i === retries - 1;
      if (isLast) throw error;
      console.log(`⚠️ Retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function callDifyAIWithRetry(url, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(url, data, {
        timeout: 12000,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DIFY_API_KEY}`,
        },
      });
      return response;
    } catch (error) {
      const isLast = i === retries - 1;
      if (isLast) throw error;
      console.log(`⚠️ Retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ==================== AUTO SYNC AI ====================

/**
 * TỰ ĐỘNG ĐỒNG BỘ AI (KHÔNG CHỜ RESPONSE)
 * Gọi sau mỗi lần thêm/sửa/xóa sản phẩm
 */
export const autoSyncAI = async () => {
  if (isSyncing) {
    pendingSync = true;
    console.log("⏳ Đang đồng bộ, sẽ chạy sau...");
    return;
  }

  isSyncing = true;

  try {
    console.log("🤖 [Auto-Sync] Bắt đầu cập nhật AI...");

    const products = await Product.find({ isActive: true })
      .populate("category", "name")
      .select(
        "name slug price brand category specs sold rating discountPercentage description images",
      )
      .lean();
      
    // Transform category Object to string for AI
    products.forEach(p => {
      if (p.category && p.category.name) {
        p.category = p.category.name;
      }
    });

    if (products.length === 0) {
      console.log("⚠️ [Auto-Sync] Không có sản phẩm nào");
      return;
    }

    await axios.post(
      `${AI_SERVICE_URL}/api/train`,
      { products },
      { timeout: 60000 },
    );

    // Xóa cache để khách hàng thấy dữ liệu mới ngay
    searchCache.clear();

    console.log(
      `✅ [Auto-Sync] Đã cập nhật ${products.length} sản phẩm vào AI`,
    );
  } catch (error) {
    console.error("❌ [Auto-Sync] Lỗi:", error.message);
  } finally {
    isSyncing = false;

    if (pendingSync) {
      pendingSync = false;
      setTimeout(() => autoSyncAI(), 1000);
    }
  }
};

/**
 * DEBOUNCE SYNC - Tránh gọi AI quá nhiều lần
 */
let syncTimeout = null;
export const debouncedSyncAI = () => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    autoSyncAI();
    syncTimeout = null;
  }, 3000);
};

// ==================== API 1: SYNC ====================

export const syncAIData = async (req, res) => {
  try {
    console.log("🔄 Đồng bộ dữ liệu với AI...");

    const products = await Product.find({ isActive: true })
      .populate("category", "name")
      .select(
        "name slug price brand category specs sold rating discountPercentage description images",
      )
      .lean();
      
    // Transform category Object to string for AI
    products.forEach(p => {
      if (p.category && p.category.name) {
        p.category = p.category.name;
      }
    });

    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chưa có sản phẩm nào trong database!",
      });
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm, gửi sang AI...`);

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/train`,
      { products },
      { timeout: 120000 },
    );

    // Xóa cache sau khi train
    searchCache.clear();

    console.log("✅ Đồng bộ hoàn tất!");

    res.json({
      success: true,
      message: response.data.message,
      count: products.length,
    });
  } catch (error) {
    console.error("❌ Lỗi đồng bộ AI:", error.message);
    res.status(500).json({
      success: false,
      message: "Không thể kết nối đến AI Service",
      error: error.message,
    });
  }
};

// ==================== API 2: SEARCH ====================

export const difySmartSearch = async (req, res) => {
  const { q } = req.query;
  const startTime = Date.now();

  try {
    const aiResponse = await callDifyAIWithRetry(`${AI_SERVICE_URL}/workflows/run`, {
      "inputs": {
          "query": q 
      },
      "response_mode": "blocking",
      "user": "test_user_01",
    });

    const difyResult = aiResponse.data;
    console.log("🔍 Dify Smart Search Response:", JSON.stringify(difyResult, null, 2));

    // Dify Workflow blocking output path: .data.outputs.search_query
    const rawResponse = difyResult?.data?.outputs?.search_query;

    if (!rawResponse) {
      throw new Error("AI không trả về kết quả truy vấn hợp lệ (outputs.search_query missing)");
    }
    const cleanJsonString = rawResponse.replace(/```json|```/g, "").trim();

    const queryObj = JSON.parse(cleanJsonString);
    console.log("🔍 Dify Smart Search Query:", queryObj);

    const collectionName = queryObj.collection || "products";
    const mongoQuery = queryObj.query || {};
    const sort = queryObj.sort || {};
    const limit = parseInt(queryObj.limit) || 20;

    const results = await mongoose.connection.db
      .collection(collectionName)
      .find(mongoQuery)
      .sort(sort)
      .limit(limit)
      .toArray();
    console.log('Mongo results', results);
    const finalResults = results.map((prod) => {
      if (prod.images && prod.images.length > 0) {
        prod.thumbnail = prod.images[0].url;
      }
      return prod;
    });

    return res.json({
      success: true,
      query: q,
      total: finalResults.length,
      results: finalResults,
      duration: `${Date.now() - startTime}ms`,
    });
  } catch (e) {
    console.error("❌ Lỗi Dify Smart Search:", e);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý tìm kiếm thông minh",
      error: e.message,
    });
  }
};

export const smartSearch = async (req, res, returnOnly) => {
  // 🔥 Express truyền next() vào tham số thứ 3, nên phải kiểm tra kiểu dữ liệu
  const isReturnOnly = returnOnly === true;
  const { q } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const startTime = Date.now();

  if (!q || q.trim() === "") {
    const emptyResult = {
      success: true,
      results: [],
      total: 0,
      message: "Vui lòng nhập từ khóa tìm kiếm",
    };
    return isReturnOnly ? emptyResult : res.json(emptyResult);
  }

  const cacheKey = getCacheKey(q, limit);
  const cached = searchCache.get(cacheKey);

  // Cache hit
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`💾 Cache hit: "${q}"`);
    const cachedResult = {
      success: true,
      query: q,
      total: cached.results.length,
      results: cached.results,
      source: "cache",
      duration: `${Date.now() - startTime}ms`,
    };
    return isReturnOnly ? cachedResult : res.json(cachedResult);
  }

  console.log(`🔍 Tìm kiếm kết hợp (Hybrid): "${q}"`);

  try {
    // 1. Chạy AI Search và DB Search song song
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    
    const [aiResponse, dbMatches] = await Promise.all([
      callAIWithRetry(`${AI_SERVICE_URL}/api/search`, {
        query: q,
        top_n: limit,
      }).catch(err => {
        console.error("❌ AI Service failed, using DB only:", err.message);
        return { data: { results: [] } };
      }),
      Product.find({
        isActive: true,
        $or: [
          { name: regex },
          { brand: regex }
        ]
      }).limit(limit).lean()
    ]);

    // 2. Xử lý kết quả từ AI
    let aiProducts = [];
    if (aiResponse.data.results && aiResponse.data.results.length > 0) {
      const slugs = aiResponse.data.results.map((r) => r.slug);
      const productsFromAI = await Product.find({
        slug: { $in: slugs },
        isActive: true,
      }).lean();

      const productMap = {};
      productsFromAI.forEach((p) => {
        productMap[p.slug] = p;
      });

      aiProducts = slugs
        .map((slug) => productMap[slug])
        .filter(Boolean);
    }

    // 3. Gộp kết quả và loại bỏ trùng lặp (Ưu tiên DB Match)
    const combined = [...dbMatches];
    const seenSlugs = new Set(dbMatches.map(p => p.slug));

    aiProducts.forEach(p => {
      if (!seenSlugs.has(p.slug)) {
        combined.push(p);
        seenSlugs.add(p.slug);
      }
    });

    // 4. Giới hạn số lượng trả về
    const finalResults = combined.slice(0, limit).map(prod => {
      prod.thumbnail = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
      return prod;
    });

    // Lưu cache (chỉ lưu nếu có kết quả)
    if (finalResults.length > 0) {
      searchCache.set(cacheKey, {
        results: finalResults,
        timestamp: Date.now(),
      });
    }

    console.log(`✅ Hybrid Search hoàn tất: found ${finalResults.length} kết quả (${dbMatches.length} DB, ${aiProducts.length} AI)`);

    const result = {
      success: true,
      query: q,
      total: finalResults.length,
      results: finalResults,
      products: finalResults, // Thêm products cho đồng bộ
      source: aiProducts.length > 0 ? "hybrid" : "db",
      duration: `${Date.now() - startTime}ms`,
    };

    return isReturnOnly ? result : res.json(result);
  } catch (error) {
    console.error("❌ Hybrid Search error:", error.message);
    
    // Fallback cuối cùng
    const fallbackResults = await Product.find({
      isActive: true,
      name: { $regex: q.split(" ")[0], $options: "i" },
    })
      .limit(limit)
      .lean();

    const errorFallback = {
      success: true,
      query: q,
      total: fallbackResults.length,
      results: fallbackResults,
      source: "error_fallback",
      duration: `${Date.now() - startTime}ms`,
    };

    return isReturnOnly ? errorFallback : res.json(errorFallback);
  }
};

/**
 * API 3: VISUAL SEARCH
 */
export const visualSearch = async (req, res) => {
  const startTime = Date.now();
  try {
    const { image_url } = req.body;
    if (!req.file && !image_url) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp hình ảnh hoặc URL" });
    }

    console.log(`📷 Tìm kiếm bằng hình ảnh: ${req.file?.originalname || image_url}`);

    let aiResponse;
    if (image_url) {
      // Gửi URL sang AI Service thay vì upload lại binary (Tối ưu lớn)
      aiResponse = await axios.post(`${AI_SERVICE_URL}/api/visual-search`, 
        { image_url, top_n: 20 },
        { 
          headers: { "Content-Type": "application/json" },
          timeout: 30000 
        }
      );
    } else {
      // Logic cũ
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname);
      formData.append("top_n", "20");

      aiResponse = await axios.post(`${AI_SERVICE_URL}/api/visual-search`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
    }

    if (aiResponse.data.success && aiResponse.data.results.length > 0) {
      const slugs = aiResponse.data.results.map((r) => r.slug);

      const products = await Product.find({
        slug: { $in: slugs },
        isActive: true,
      }).lean();

      // Sắp xếp theo độ tương đồng từ AI
      const productMap = {};
      products.forEach((p) => {
        productMap[p.slug] = p;
      });

      const sortedResults = slugs
        .map((slug) => {
          const prod = productMap[slug];
          if (prod) {
            prod.thumbnail = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
            // Gắn score để frontend hiển thị nếu cần
            const aiInfo = aiResponse.data.results.find(r => r.slug === slug);
            prod.similarity_score = aiInfo ? aiInfo.similarity_score : 0;
          }
          return prod;
        })
        .filter(Boolean);

      console.log(`✅ AI tìm thấy ${sortedResults.length} sản phẩm tương tự`);

      return res.json({
        success: true,
        total: sortedResults.length,
        results: sortedResults,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    res.json({
      success: true,
      message: "Không tìm thấy sản phẩm tương tự",
      total: 0,
      results: [],
    });
  } catch (error) {
    console.error("❌ Visual Search lỗi:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý tìm kiếm hình ảnh",
      error: error.message,
    });
  }
};

// ==================== API 4: STATUS ====================


export const getAIStatus = async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/health`, {
      timeout: 5000,
    });

    res.json({
      success: true,
      status: "online",
      cache_size: searchCache.size,
      ai_info: response.data,
    });
  } catch (error) {
    res.json({
      success: false,
      status: "offline",
      cache_size: searchCache.size,
      message: "AI Service không hoạt động",
    });
  }
};

// ==================== API 4: CLEAR CACHE ====================

export const clearCache = async (req, res) => {
  const size = searchCache.size;
  searchCache.clear();
  console.log(`🗑️ Đã xóa cache (${size} items)`);
  res.json({
    success: true,
    message: `Đã xóa ${size} cache items`,
  });
};

// ==================== API 5: TRENDING ====================

export const getTrendingSearches = async (req, res) => {
  const defaultTrending = [
    "laptop gaming",
    "điện thoại iphone",
    "tai nghe bluetooth",
    "chuột không dây",
    "bàn phím cơ",
    "pin dự phòng",
  ];

  res.json({
    success: true,
    trending: defaultTrending,
  });
};
