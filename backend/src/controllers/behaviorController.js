import Behavior from "../models/behaviorModel.js";

// Theo dõi hành vi user
export const trackBehavior = async (req, res) => {
  try {
    const { productId, action, keyword } = req.body;

    let score = 1;
    if (action === "view") score = 1;
    else if (action === "wishlist") score = 2;
    else if (action === "cart") score = 3;
    else if (action === "buy") score = 5;

    await Behavior.create({
      user: req.user?._id || null,
      product: productId || null,
      action,
      keyword: keyword || null,
      score,
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
