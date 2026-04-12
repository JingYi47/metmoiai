export const mockCheckout = {
  user: "66b9c2f8a123456789abcd01", // fake ObjectId

  items: [
    {
      product: "66b9c2f8p00000000000001",
      name: "iphone 17 Bạc Titan 256 GB",
      price: 22190000,
      quantity: 1,
      color: "Silver",
      total: 22190000,
    },
    {
      product: "66b9c2f8p00000000000002",
      name: "Tivi LCD Monitor",
      price: 19950000,
      quantity: 1,
      color: "Black",
      total: 19950000,
    },
  ],

  shippingAddress: {
    fullName: "Nguyễn Văn A",
    phone: "0909123456",
    address: "123 Nguyễn Trãi",
    ward: "Phường 5",
    district: "Quận 5",
    province: "TP Hồ Chí Minh",
  },

  subtotal: 42121000,
  shippingFee: 0,
  discount: 1000000,
  total: 41121000,

  coupon: "66b9c2f8c00000000000001",

  paymentMethod: "COD",
  status: "pending",

  createdAt: new Date(),
};
