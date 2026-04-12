import axios from "axios";
import Product from "../models/productModel.js";
import Behavior from "../models/behaviorModel.js";

export const getAIRecommend = async (userId) => {
  try {
    let behaviors = [];
    let products = await Product.find({ isActive: true }).limit(30).lean();

    if (userId) {
      behaviors = await Behavior.find({ user: userId }).lean();
    }

    const res = await axios.post("http://localhost:5001/recommend-user", {
      products,
      behaviors,
    });

    console.log("AI RECOMMEND:", res.data);

    //
    const foundProducts = await Product.find({
      slug: { $in: res.data.result || [] },
      isActive: true,
    }).lean();

    //
    const map = {};
    foundProducts.forEach((p) => {
      map[p.slug] = p;
    });

    return (res.data.result || []).map((slug) => map[slug]).filter(Boolean);
  } catch (err) {
    console.error("AI RECOMMEND ERROR:", err);

    // fallback nếu AI chết
    return await Product.find({ isActive: true }).sort({ views: -1 }).limit(6);
  }
};
