import { Review } from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import { Order } from "../models/orderModel.js";

// Admin: lấy tất cả review, có filter và phân trang
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, productId } = req.query;
    const filter = {};
    if (rating) filter.rating = Number(rating);
    if (productId) filter.product = productId;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate("user", "firstName lastName email avatar")
      .populate("product", "name images")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      reviews,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: xóa review và tính lại rating
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy review" });

    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(review.product, {
      rating: stats[0]?.avgRating ?? 0,
      reviewCount: stats[0]?.count ?? 0,
    });

    res.json({ success: true, message: "Xóa review thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "firstName lastName avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createOrUpdateReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?._id || req.user?.userId;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đánh giá",
      });
    }

    const hasPurchased = await Order.exists({
      user: userId,
      status: { $in: ["delivered", "completed"] },
      "items.product": productId,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể đánh giá sau khi đã mua và nhận sản phẩm",
      });
    }

    let review = await Review.findOne({ user: userId, product: productId });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      review = await Review.create({
        user: userId,
        product: productId,
        rating,
        comment,
      });
    }

    //Tính lại rating cho Product
    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length) {
      await Product.findByIdAndUpdate(productId, {
        rating: stats[0].avgRating,
        reviewCount: stats[0].count,
      });
    }

    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
