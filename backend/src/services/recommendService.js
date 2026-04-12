import Product from "../models/productModel.js";
import Behavior from "../models/behaviorModel.js";

export const getSimilarProducts = async (productId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) return [];

    // lấy user đã xem sản phẩm này
    const behaviorUsers = await Behavior.find({
      product: productId,
      action: "view",
    }).distinct("user");

    const products = await Product.find({
      _id: { $ne: productId },
      isActive: true,
      $or: [
        { brand: product.brand },
        { category: product.category },
        { createdBy: { $in: behaviorUsers } },
      ],
    })
      .sort({ views: -1 })
      .limit(6);

    return products;
  } catch (err) {
    console.error("getSimilarProducts error:", err);
    return [];
  }
};
