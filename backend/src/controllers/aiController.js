/**
 * AI CONTROLLER - Kết nối Web và AI Service
 * Tích hợp cache, retry, fallback, auto sync
 */

import axios from "axios";
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

export const smartSearch = async (req, res) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const startTime = Date.now();

  if (!q || q.trim() === "") {
    return res.json({
      success: true,
      results: [],
      total: 0,
      message: "Vui lòng nhập từ khóa tìm kiếm",
    });
  }

  const cacheKey = getCacheKey(q, limit);
  const cached = searchCache.get(cacheKey);

  // Cache hit
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`💾 Cache hit: "${q}"`);
    return res.json({
      success: true,
      query: q,
      total: cached.results.length,
      results: cached.results,
      source: "cache",
      duration: `${Date.now() - startTime}ms`,
    });
  }

  console.log(`🔍 Tìm kiếm: "${q}"`);

  try {
    const aiResponse = await callAIWithRetry(`${AI_SERVICE_URL}/api/search`, {
      query: q,
      top_n: limit,
    });

    if (aiResponse.data.results && aiResponse.data.results.length > 0) {
      const slugs = aiResponse.data.results.map((r) => r.slug);

      const products = await Product.find({
        slug: { $in: slugs },
        isActive: true,
      }).lean();

      const productMap = {};
      products.forEach((p) => {
        productMap[p.slug] = p;
      });

      const sortedResults = slugs
        .map((slug) => {
          const prod = productMap[slug];
          if (prod) {
            // Đảm bảo có ít nhất 1 hình ảnh
            prod.thumbnail = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
          }
          return prod;
        })
        .filter(Boolean);

      // Lưu cache
      searchCache.set(cacheKey, {
        results: sortedResults,
        timestamp: Date.now(),
      });

      console.log(`✅ AI tìm thấy ${sortedResults.length} kết quả`);

      return res.json({
        success: true,
        query: q,
        total: sortedResults.length,
        results: sortedResults,
        source: "ai",
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Fallback Level 1
    console.log("⚠️ AI không có kết quả, fallback...");

    const fallbackResults = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
      ],
    })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      query: q,
      total: fallbackResults.length,
      results: fallbackResults,
      source: "fallback",
      duration: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    // Fallback Level 2
    console.error("❌ AI Service lỗi:", error.message);

    const fallbackResults = await Product.find({
      isActive: true,
      name: { $regex: q.split(" ")[0], $options: "i" },
    })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      query: q,
      total: fallbackResults.length,
      results: fallbackResults,
      source: "error_fallback",
      duration: `${Date.now() - startTime}ms`,
    });
  }
};

/**
 * API 3: VISUAL SEARCH
 */
export const visualSearch = async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng tải lên hình ảnh" });
    }

    console.log(`📷 Tìm kiếm bằng hình ảnh: ${req.file.originalname}`);

    // Gửi image sang AI Service
    // Vì dùng axios v1.x, ta có thể dùng FormData native hoặc buffer
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("image", blob, req.file.originalname);
    formData.append("top_n", "20");

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/visual-search`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

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
