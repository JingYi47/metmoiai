import Product from "../models/productModel.js";
import Behavior from "../models/behaviorModel.js";

// ─── HÀM CHÍNH: LẤY GỢI Ý CHO TRANG CHỦ ──────────────────────────────
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers["x-session-id"] || req.sessionID;

    console.log("\n" + "=".repeat(60));
    console.log("🚀 STARTING SMART RECOMMENDATION ENGINE");
    console.log("=".repeat(60));

    let recommendations = [];
    let smartPromotions = [];
    let userType = userId ? "logged_in" : "guest";
    let message = "";
    let promotionMessage = "";

    // 1. LẤY HÀNH VI GẦN NHẤT
    const query = userId ? { user: userId } : { sessionId: sessionId };
    const behaviors = await Behavior.find(query)
      .sort({ createdAt: -1 })
      .limit(userId ? 50 : 30)
      .lean();

    // 2. XỬ LÝ LOGIC CÁ NHÂN HÓA SONG SONG
    if (behaviors.length > 0) {
      // Chạy song song tính toán sản phẩm và khuyến mãi để tiết kiệm thời gian
      [recommendations, smartPromotions] = await Promise.all([
        getPersonalizedByBehavior(behaviors),
        getSmartPromotions(behaviors),
      ]);
      message = getPersonalizedMessage(behaviors);
      promotionMessage = getSmartPromotionMessage(smartPromotions, userType);
    } else {
      recommendations = await getTrendingProducts();
      message = userId
        ? "Chào mừng bạn mới! Khám phá sản phẩm hot 🔥"
        : "Sản phẩm được xem nhiều nhất hiện nay";
    }

    // 3. TẢI TẤT CẢ CÁC SECTION KHÁC CÙNG LÚC (TỐI ƯU HIỆU NĂNG)
    const [bestSellers, newProducts, discounted] = await Promise.all([
      getBestSellingProducts(),
      getNewProducts(),
      getDiscountedProducts(),
    ]);

    // 4. ĐÓNG GÓI DỮ LIỆU THEO SECTION (FRONTEND CHỈ VIỆC MAP QUA)
    const sections = [];

    // Section Cá nhân hóa
    if (recommendations.length > 0) {
      sections.push({
        id: "personalized",
        title:
          userType === "logged_in" ? "Dành riêng cho bạn" : "Xu hướng hiện nay",
        subtitle: message,
        products: recommendations.slice(0, 6),
        type: "grid",
        icon: "FaUserCheck",
      });
    }

    // Section Khuyến mãi
    if (smartPromotions.length > 0) {
      sections.push({
        id: "smart_promotions",
        title: "Ưu đãi đặc biệt",
        subtitle: promotionMessage,
        promotions: smartPromotions,
        type: "promotion_banner",
        icon: "FaGift",
      });
    }

    // Section Bán chạy
    if (bestSellers.length > 0) {
      sections.push({
        id: "bestsellers",
        title: "Bán chạy nhất",
        subtitle: "Những sản phẩm được tin dùng nhất",
        products: bestSellers.slice(0, 6),
        type: "slider",
      });
    }

    // Section Hàng mới
    if (newProducts.length > 0) {
      sections.push({
        id: "new",
        title: "Hàng mới về",
        subtitle: "Cập nhật những xu hướng mới nhất",
        products: newProducts.slice(0, 6),
        type: "grid",
      });
    }

    // Section Giảm giá
    if (discounted.length > 0) {
      sections.push({
        id: "discount",
        title: "Siêu giảm giá",
        subtitle: "Săn ngay deal hời có hạn",
        products: discounted.slice(0, 6),
        type: "grid",
      });
    }

    return res.json({
      success: true,
      userType,
      message,
      sections,
      recommendations: recommendations.slice(0, 12), // Trả về thêm mảng phẳng nếu cần
      smartPromotions,
    });
  } catch (error) {
    console.error("❌ Recommendation Error:", error);
    const trending = await getTrendingProducts();
    return res.status(500).json({
      success: true,
      sections: [
        { id: "fallback", title: "Sản phẩm nổi bật", products: trending },
      ],
    });
  }
};

// ─── CÁC HÀM TRUY XUẤT DỮ LIỆU (HELPER FUNCTIONS) ───────────────────

async function getPersonalizedByBehavior(behaviors) {
  const brandScores = new Map();
  const categoryScores = new Map();

  const productIds = behaviors
    .filter((b) => b.product)
    .map((b) => b.product.toString());

  // QUAN TRỌNG: Phải populate category để lấy tên thay vì ID
  const interactedProducts = await Product.find({ _id: { $in: productIds } })
    .populate("category")
    .lean();

  const productInfoMap = {};
  interactedProducts.forEach((p) => {
    productInfoMap[p._id.toString()] = p;
  });

  for (const behavior of behaviors) {
    let weight =
      behavior.action === "buy"
        ? 10
        : behavior.action === "cart"
          ? 5
          : behavior.action === "wishlist"
            ? 3
            : 1;

    const product = productInfoMap[behavior.product?.toString()];
    if (product) {
      if (product.brand)
        brandScores.set(
          product.brand,
          (brandScores.get(product.brand) || 0) + weight,
        );
      if (product.category) {
        const catName = product.category.name || product.category;
        categoryScores.set(
          catName,
          (categoryScores.get(catName) || 0) + weight,
        );
      }
    }
  }

  const topBrands = [...brandScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((e) => e[0]);
  const topCats = [...categoryScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((e) => e[0]);

  // Tìm sản phẩm liên quan (Chỉ lấy sản phẩm đang ACTIVE)
  let products = await Product.find({
    isActive: true,
    $or: [
      { brand: { $in: topBrands } },
      { "category.name": { $in: topCats } }, // Tìm theo tên category đã populate
    ],
  })
    .sort({ views: -1 })
    .limit(12)
    .lean();

  // Nếu thiếu sản phẩm, bù bằng Trending
  if (products.length < 12) {
    const trending = await getTrendingProducts();
    const existingIds = new Set(products.map((p) => p._id.toString()));
    const more = trending.filter((p) => !existingIds.has(p._id.toString()));
    products = [...products, ...more].slice(0, 12);
  }
  return products;
}

// ─── CÁC HÀM LẤY SẢN PHẨM THEO TIÊU CHÍ (ĐÃ THÊM ISACTIVE) ────────────

async function getTrendingProducts() {
  return await Product.find({ isActive: true })
    .sort({ views: -1, rating: -1 })
    .limit(12)
    .lean();
}

async function getBestSellingProducts() {
  return await Product.find({ isActive: true, sold: { $gt: 0 } })
    .sort({ sold: -1 })
    .limit(12)
    .lean();
}

async function getNewProducts() {
  // Lấy 12 sản phẩm mới nhất (không giới hạn 7 ngày để tránh bị rỗng)
  return await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();
}

async function getDiscountedProducts() {
  return await Product.find({
    isActive: true,
    discountPercentage: { $gt: 0 },
    discountExpiry: { $gt: new Date() },
  })
    .sort({ discountPercentage: -1 })
    .limit(12)
    .lean();
}

// ─── LOGIC THÔNG BÁO & KHUYẾN MÃI (SMART PROMOTIONS) ────────────────

function getPersonalizedMessage(behaviors) {
  const lastAction = behaviors[0]?.action;
  if (lastAction === "cart") return "Hoàn tất đơn hàng đang chờ bạn nhé 🛒";
  if (lastAction === "wishlist") return "Sản phẩm bạn thích đang có sẵn ✨";
  return "Dành riêng cho phong cách của bạn 🎯";
}

async function getSmartPromotions(behaviors) {
  const promotions = [];
  const actionCount = behaviors.reduce((acc, b) => {
    acc[b.action] = (acc[b.action] || 0) + 1;
    return acc;
  }, {});

  if (actionCount.buy > 2) {
    promotions.push({
      title: "Voucher VIP",
      description: "Giảm 15% cho khách hàng thân thiết",
      code: "VIP15",
      discount: 15,
    });
  }
  if (actionCount.cart > 0) {
    promotions.push({
      title: "Ưu đãi giỏ hàng",
      description: "Mua ngay kẻo lỡ! Giảm thêm 10%",
      code: "CART10",
      discount: 10,
    });
  }
  return promotions.slice(0, 2);
}

function getSmartPromotionMessage(promotions, userType) {
  if (promotions.length > 0)
    return `Bạn có ${promotions.length} ưu đãi chưa sử dụng!`;
  return userType === "guest"
    ? "Đăng nhập để nhận mã giảm giá riêng"
    : "Xem thêm sản phẩm để săn Voucher";
}
