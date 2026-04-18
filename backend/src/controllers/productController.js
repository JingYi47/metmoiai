import mongoose from "mongoose";
import Product from "../models/productModel.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import { slugify } from "../utils/helpers.js";
import { getSimilarProducts } from "../services/recommendService.js";
import { getAIRecommend } from "../services/aiService.js";
import { smartSearch as aiSmartSearch, autoSyncAI } from "./aiController.js";
import SearchLog from "../models/searchLogModel.js";
import axios from "axios";
// lấy ds sp
export const listProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 12,
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      onSale,
      sortBy = "newest",
      stock,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    let filter = {};

    // phân quyền
    if (!req.user || req.user.role !== "admin") {
      filter.isActive = true;
    }

    // filter khác giữ nguyên
    if (q) filter.name = { $regex: q, $options: "i" };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (featured === "true") filter.isFeatured = true;

    if (onSale === "true") {
      filter.discountPercentage = { $gt: 0 };
      const now = new Date();
      filter.$or = [
        { discountExpiry: { $exists: false } },
        { discountExpiry: null },
        { discountExpiry: { $gt: now } },
      ];
    }

    const sumColorsStock = {
      $reduce: {
        input: { $ifNull: ["$colors", []] },
        initialValue: 0,
        in: { $add: ["$$value", { $ifNull: ["$$this.stock", 0] }] },
      },
    };
    if (stock === "in") {
      filter.$expr = { $gt: [sumColorsStock, 0] };
    } else if (stock === "out") {
      filter.$expr = { $lte: [sumColorsStock, 0] };
    }

    // Xác định thứ tự sắp xếp
    let sortOption = { createdAt: -1 };
    switch (sortBy) {
      case "price-asc":
        sortOption = { price: 1 };
        break;
      case "price-desc":
        sortOption = { price: -1 };
        break;
      case "discount":
        sortOption = { discountPercentage: -1 };
        break;
      case "name":
        sortOption = { name: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    let query = Product.find(filter).sort(sortOption);

    if (limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }

    const products = await query;

    const total = await Product.countDocuments(filter);

    // Trả dữ liệu về client
    res.json({
      success: true,
      products,
      total,
      page,
      pages: limit > 0 ? Math.ceil(total / limit) : 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  lấy sp theo id
export const getProductById = async (req, res) => {
  try {
    // 🔥 Kiểm tra ID hợp lệ để tránh lỗi 500 khi người dùng gửi slug thay vì ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid Product ID format" });
    }

    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Trả sản phẩm về client
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// lấy sp theo slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    });

    // Không tìm thấy sản phẩm
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Trả dữ liệu về client
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// tạo sp mới
export const createProduct = async (req, res, next) => {
  try {
    const body = req.body;

    if (!body.slug && body.name) {
      body.slug = slugify(body.name, { lower: true });
    }

    body.createdBy = req.user._id;

    const product = await Product.create(body);
    autoSyncAI();
    res.status(201).json({
      success: true,
      message: "Product created",
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
  // console.log("USER:", req.user);
};

// cập nhật sp
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedBy: req.user._id };

    if (updateData.originalPrice || updateData.price) {
      const currentProduct = await Product.findById(req.params.id);

      if (updateData.originalPrice && !updateData.price) {
        updateData.price = updateData.originalPrice;
        updateData.discount = 0;
        updateData.discountPercentage = 0;
      } else if (updateData.price && !updateData.originalPrice) {
        updateData.originalPrice = currentProduct.originalPrice;
      }

      if (updateData.originalPrice && updateData.price) {
        if (updateData.originalPrice > updateData.price) {
          updateData.discount = updateData.originalPrice - updateData.price;
          updateData.discountPercentage = Math.round(
            (updateData.discount / updateData.originalPrice) * 100,
          );
        } else {
          updateData.discount = 0;
          updateData.discountPercentage = 0;
        }
      }
    }

    // Cập nhật sản phẩm theo ID
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    autoSyncAI();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    autoSyncAI();
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// thêm ảnh cho sp
export const addProductImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image required",
      });
    }

    const result = await uploadImage(req.file.buffer, "products");

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.images.push({
      url: result.secure_url,
      public_id: result.public_id,
    });

    await product.save();

    res.json({
      success: true,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// xóa sp
export const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "public_id is required",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 🔥 XÓA CLOUD (KHÔNG CRASH)
    try {
      await deleteImage(public_id);
    } catch (err) {
      console.warn("⚠️ Cloud delete fail:", err.message);
    }

    // 🔥 XÓA DB
    product.images = product.images.filter(
      (img) => img.public_id !== public_id,
    );

    await product.save();

    res.status(200).json({
      success: true,
      message: "Image deleted (DB + Cloud)",
    });
  } catch (error) {
    console.error("deleteProductImage error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// xóa ảnh theo màu
export const deleteProductColorImage = async (req, res) => {
  try {
    const { id, colorName } = req.params;
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "public_id is required",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const color = product.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase(),
    );
    if (!color) {
      return res.status(404).json({
        success: false,
        message: "Color not found",
      });
    }

    try {
      await deleteImage(public_id);
    } catch (err) {
      console.warn("⚠️ Cloud delete fail (color):", err.message);
    }

    color.images = color.images.filter((img) => img.public_id !== public_id);
    await product.save();

    res.status(200).json({
      success: true,
      message: "Color image deleted (DB + Cloud)",
    });
  } catch (error) {
    console.error("deleteProductColorImage error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// sp mới thêm
export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "name slug price originalPrice discountPercentage discountExpiry images isFeatured",
      );

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDiscountedProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const now = new Date();

    const products = await Product.find({
      isActive: true,
      discountPercentage: { $gt: 0 },
      $or: [
        { discountExpiry: { $exists: false } },
        { discountExpiry: null },
        { discountExpiry: { $gt: now } },
      ],
    })
      .sort({ discountPercentage: -1 })
      .limit(limit)
      .select(
        "name slug price originalPrice discountPercentage discountExpiry images",
      );

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// sp nổi bật
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;

    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "name slug price originalPrice discountPercentage discountExpiry images",
      );

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// tìm kiếm sp
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = Number(req.query.limit) || 10;

    if (!q) return res.json({ success: true, products: [] });

    const regex = new RegExp(q, "i");

    const products = await Product.find({
      isActive: true,
      $or: [{ name: regex }, { description: regex }],
    })
      .limit(limit)
      .select("name slug price originalPrice discountPercentage images");

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// hide product
export const hideProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Sản phẩm không tồn tại",
    });
  }

  product.isActive = false;
  await product.save();
  autoSyncAI();
  res.json({
    success: true,
    message: "Ẩn sản phẩm thành công",
    product,
  });
};
// hiện sp
export const showProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    product.isActive = true;
    await product.save();
    autoSyncAI();
    res.json({
      success: true,
      message: "Sản phẩm đã được hiện",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// xem ảnh
export const getProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).select("images");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      images: product.images,
    });
  } catch (error) {
    console.error("getProductImages error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// khôi phục product
export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tồn tại sản phẩm",
      });
    }

    if (product.isActive === true) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm đang hoạt động",
      });
    }

    product.isActive = true;
    await product.save();
    autoSyncAI();

    res.json({
      success: true,
      message: "Sản phẩm đã khôi phục",
      product,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// đổi hình theo màu
export const getProductByColor = async (req, res) => {
  try {
    const { id, colorName } = req.params;

    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "Not found" });

    const color = product.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase(),
    );

    if (!color) {
      return res.status(404).json({ message: "Color not found" });
    }

    res.json({
      success: true,
      color: color.name,
      images: color.images,
      stock: color.stock,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// admin thêm ảnh màu
export const addColorImage = async (req, res) => {
  try {
    const { id, colorName } = req.params;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Image required" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Not found" });

    let color = product.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase(),
    );

    if (!color) {
      color = { name: colorName, images: [], stock: 0 };
      product.colors.push(color);
    }
    const result = await uploadImage(
      req.file.buffer,
      `products/${product._id}/${colorName}`,
    );

    color.images.push({
      url: result.secure_url,
      public_id: result.public_id,
    });

    await product.save();

    res.json({ success: true, color });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// stock theo màu
export const updateColorStock = async (req, res) => {
  try {
    const { id, colorName } = req.params;
    const { stock } = req.body;

    if (stock == null) {
      return res.status(400).json({ message: "Stock is required" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Not found" });

    const color = product.colors.find(
      (c) => c.name.toLowerCase() === colorName.toLowerCase(),
    );

    if (!color) return res.status(404).json({ message: "Color not found" });

    color.stock = Number(stock);
    await product.save();

    res.json({
      success: true,
      color: { name: color.name, stock: color.stock },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getRelatedProducts = async (req, res) => {
  try {
    const products = await getSimilarProducts(req.params.id);

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getTrendingProducts = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .sort({ views: -1 })
    .limit(8);

  res.json({ success: true, products });
};
export const getAIProducts = async (req, res) => {
  try {
    const data = await getAIRecommend(req.user._id);

    res.json({
      success: true,
      products: data.result,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const recommendHome = async (req, res) => {
  try {
    let products;

    if (req.user?._id) {
      // User đã có hành vi -> ưu tiên sản phẩm quan tâm
      const topProducts = await Behavior.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: "$product", totalScore: { $sum: "$score" } } },
        { $sort: { totalScore: -1 } },
        { $limit: 8 },
      ]);

      products = await Product.find({
        _id: { $in: topProducts.map((p) => p._id) },
      });
    } else {
      // User mới/guest -> ưu tiên sản phẩm view nhiều
      products = await Product.find({ isActive: true })
        .sort({ views: -1 })
        .limit(8);
    }

    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//TÌM KIẾM THÔNG MINH VỚI AI

export const aiSearchProducts = async (req, res) => {
  const { q } = req.query;
  const startTime = Date.now();

  if (!q || q.trim() === "") {
    return res.json({ success: true, products: [], total: 0 });
  }

  try {
    // Gọi AI search từ controller đã có
    const result = await aiSmartSearch(req, res, true); // true = return data instead of send

    // Nếu result có dữ liệu
    if (result && result.results && result.results.length > 0) {
      // Log tìm kiếm
      await SearchLog.create({
        query: q,
        resultsCount: result.results.length,
        source: result.source || "ai",
        responseTime: Date.now() - startTime,
        userId: req.user?._id,
        sessionId: req.sessionID,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(() => {});

      return res.json({
        success: true,
        results: result.results, // Thêm results cho đồng bộ Frontend
        products: result.results,
        total: result.results.length,
        source: result.source,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Fallback: tìm kiếm thường
    const regex = new RegExp(q, "i");
    const products = await Product.find({
      isActive: true,
      $or: [{ name: regex }, { brand: regex }, { category: regex }],
    })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      products,
      total: products.length,
      source: "fallback",
    });
  } catch (error) {
    console.error("AI Search error:", error.message);

    // Fallback khi lỗi
    const regex = new RegExp(q, "i");
    const products = await Product.find({
      isActive: true,
      name: regex,
    })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      products,
      total: products.length,
      source: "error_fallback",
    });
  }
};
