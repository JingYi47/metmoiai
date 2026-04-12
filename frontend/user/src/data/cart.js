import iphone from "../assets/iphone1.jpg";

export const mockCarts = {
  _id: "cart_001",

  user: {
    _id: "user_001",
    name: "Nguyễn Văn A",
    email: "a@gmail.com",
  },

  items: [
    {
      _id: "item_001",

      product: {
        _id: "product_001",
        name: "iPhone 14 Trắng 128GB",
        image: "/images/iphone.png",
      },

      color: "Trắng",
      quantity: 2,
      priceAtAddition: 4990000,
      isSelected: true,
      addedAt: "2025-02-01T10:00:00Z",
    },
    {
      _id: "item_002",

      product: {
        _id: "product_002",
        name: "LCD Monitor 27 inch",
        image: iphone,
      },

      color: "Đen",
      quantity: 1,
      priceAtAddition: 23990000,
      isSelected: true,
      addedAt: "2025-02-02T09:30:00Z",
    },
  ],

  subtotal: 33970000,
  discountApplied: 1000000,
  total: 32970000,

  coupon: {
    _id: "coupon_001",
    code: "TET2025",
    value: 1000000,
  },

  isAbandoned: false,
  reminderSent: false,

  createdAt: "2025-02-01T09:00:00Z",
  updatedAt: "2025-02-02T10:00:00Z",
};
