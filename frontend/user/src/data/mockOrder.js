export const mockOrder = [
  {
    _id: "order_mock_001",

    user: {
      _id: "user_mock_01",
      name: "Nguyễn Văn A",
      email: "a@gmail.com",
    },

    items: [
      {
        product: "product_mock_01",
        name: "Áo thun Pandora",
        price: 199000,
        quantity: 2,
        total: 398000,
      },
      {
        product: "product_mock_02",
        name: "Quần jeans Pandora",
        price: 399000,
        quantity: 1,
        total: 399000,
      },
    ],

    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Nguyễn Trãi",
      city: "TP Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Thành",
      note: "Giao giờ hành chính",
    },

    subtotal: 797000,
    shippingFee: 0,
    discount: 50000,
    total: 747000,

    paymentMethod: "cod",
    paymentStatus: "pending",

    status: "pending",

    invoiceNumber: null,

    createdAt: "2026-02-09T10:30:00.000Z",
    updatedAt: "2026-02-09T10:30:00.000Z",
  },
  {
    _id: "order_mock_002",

    user: {
      _id: "user_mock_01",
      name: "Nguyễn Văn A",
      email: "a@gmail.com",
    },

    items: [
      {
        product: "product_mock_01",
        name: "Áo thun Pandora",
        price: 199000,
        quantity: 2,
        total: 398000,
      },
      {
        product: "product_mock_02",
        name: "Quần jeans Pandora",
        price: 399000,
        quantity: 1,
        total: 399000,
      },
    ],

    shippingAddress: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Nguyễn Trãi",
      city: "TP Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Thành",
      note: "Giao giờ hành chính",
    },

    subtotal: 797000,
    shippingFee: 0,
    discount: 50000,
    total: 747000,

    paymentMethod: "cod",
    paymentStatus: "pending",

    status: "delivered",

    invoiceNumber: null,

    createdAt: "2026-02-09T10:30:00.000Z",
    updatedAt: "2026-02-09T10:30:00.000Z",
  },
];
