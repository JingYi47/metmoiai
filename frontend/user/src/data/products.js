import iphone from "../assets/iphone1.jpg";
import iphone1 from "../assets/iphone.png";
import speaker from "../assets/speaker.png";

export const products = [
  {
    id: "1",
    name: "iPhone 14",
    description: "iPhone 14 với chip A15 Bionic mạnh mẽ",
    originalPrice: 15000000,
    price: 12000000,
    discountPercentage: 20,
    rating: 4.8,
    reviewCount: 120,
    isFeatured: true,

    images: [
      {
        url: iphone,
        public_id: "iphone14",
      },
    ],

    colors: [
      {
        name: "Đen",
        stock: 10,
        images: [{ url: iphone1 }],
      },
      {
        name: "Trắng",
        stock: 5,
        images: [{ url: speaker }],
      },
    ],
  },

  // 👉 PRODUCT 2
  {
    id: "2",
    name: "iPhone 13",
    description: "iPhone 13 với chip A15, camera cải tiến",
    originalPrice: 13000000,
    price: 10500000,
    discountPercentage: 19,
    rating: 4.7,
    reviewCount: 98,
    isFeatured: false,

    images: [
      {
        url: iphone1,
        public_id: "iphone13",
      },
    ],

    colors: [
      {
        name: "Đen",
        stock: 8,
        images: [{ url: iphone1 }],
      },
      {
        name: "Xanh",
        stock: 6,
        images: [{ url: iphone }],
      },
    ],
  },

  // 👉 PRODUCT 3
  {
    id: "3",
    name: "iPhone 14 Pro",
    description: "iPhone 14 Pro với chip A16 Bionic, màn hình 120Hz",
    originalPrice: 20000000,
    price: 17500000,
    discountPercentage: 12,
    rating: 4.9,
    reviewCount: 150,
    isFeatured: true,

    images: [
      {
        url: speaker,
        public_id: "iphone14pro",
      },
    ],

    colors: [
      {
        name: "Tím",
        stock: 7,
        images: [{ url: speaker }],
      },
      {
        name: "Đen",
        stock: 4,
        images: [{ url: iphone }],
      },
    ],
  },
];
