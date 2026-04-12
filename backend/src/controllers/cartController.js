import { Cart } from "../models/cartModel.js";
import Product from "../models/productModel.js";

// tính lại giỏ hàng
const recalcCart = (cart) => {
  const selectedItems = cart.items.filter((i) => i.isSelected);

  const selectedSubtotal = selectedItems.reduce((sum, item) => {
    return sum + item.priceAtAddition * item.quantity;
  }, 0);

  cart.subtotal = selectedSubtotal;
  cart.total = Math.max(selectedSubtotal - cart.discountApplied, 0);
};

// lấy giỏ hàng
export const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }

  recalcCart(cart);
  await cart.save();

  res.json({ success: true, cart });
};

// thêm sp
export const addToCart = async (req, res) => {
  const { productId, quantity = 1, color } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: "Thiếu productId" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Sản phẩm không tồn tại" });
  }
  if (product.isActive === false) {
    return res
      .status(400)
      .json({ success: false, message: "Sản phẩm đã ngừng bán" });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (i) => i.product.toString() === productId && i.color === color,
  );

  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({
      product: productId,
      color,
      quantity: Number(quantity),
      priceAtAddition: product.price,
      isSelected: true,
    });
  }

  recalcCart(cart);
  await cart.save();

  res.json({ success: true, cart });
};

// update số lượng
export const updateQuantity = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  const qty = Number(quantity);

  if (isNaN(qty)) {
    return res.status(400).json({ message: "Invalid quantity" });
  }

  if (qty <= 0) {
    // xóa item nếu quantity <= 0
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
  } else {
    // update bình thường
    item.quantity = qty;
  }

  recalcCart(cart);
  await cart.save();

  res.json({ success: true, cart });
};

// tick chọn item muốn mua
export const toggleSelectItem = async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  item.isSelected = !item.isSelected;

  recalcCart(cart);
  await cart.save();

  res.json({ success: true, cart });
};

// xóa item
export const removeItem = async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  cart.items = cart.items.filter((i) => i._id.toString() !== itemId);

  recalcCart(cart);
  await cart.save();

  res.json({ success: true, cart });
};
// dọn xóa giỏ hàng
export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  cart.items = [];
  cart.discountApplied = 0;

  recalcCart(cart);
  await cart.save();

  res.json({ success: true, cart });
};
