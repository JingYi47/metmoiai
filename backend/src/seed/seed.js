import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env từ thư mục backend
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Import models
import * as UserModule from "../models/userModel.js";
import * as ProductModule from "../models/productModel.js";
import * as CategoryModule from "../models/categoryModel.js";
import * as OrderModule from "../models/orderModel.js";
import * as CartModule from "../models/cartModel.js";
import * as ReviewModule from "../models/reviewModel.js";
import * as CouponModule from "../models/couponModel.js";
import * as AdminLogModule from "../models/adminlogModel.js";
import * as CheckoutModule from "../models/checkoutModel.js";
import * as BehaviorModule from "../models/behaviorModel.js";
import * as SearchModule from "../models/searchModel.js";
import * as RecommendationModule from "../models/recommendationModel.js";
import * as ViewModule from "../models/view.model.js";

const getModel = (module) => module.default || Object.values(module)[0];

const User = getModel(UserModule);
const Product = getModel(ProductModule);
const Category = getModel(CategoryModule);
const Order = getModel(OrderModule);
const Cart = getModel(CartModule);
const Review = getModel(ReviewModule);
const Coupon = getModel(CouponModule);
const AdminLog = getModel(AdminLogModule);
const Checkout = getModel(CheckoutModule);
const Behavior = getModel(BehaviorModule);
const Search = getModel(SearchModule);
const Recommendation = getModel(RecommendationModule);
const View = getModel(ViewModule);

// Lấy model từ module

console.log("\n🔍 KIỂM TRA MODELS:");
console.log("==================");
console.log("User:", User ? "✅" : "❌");
console.log("Product:", Product ? "✅" : "❌");
console.log("Category:", Category ? "✅" : "❌");
console.log("Order:", Order ? "✅" : "❌");
console.log("Cart:", Cart ? "✅" : "❌");
console.log("Review:", Review ? "✅" : "❌");
console.log("Coupon:", Coupon ? "✅" : "❌");
console.log("AdminLog:", AdminLog ? "✅" : "❌");
console.log("Checkout:", Checkout ? "✅" : "❌");
console.log("Behavior:", Behavior ? "✅" : "❌");
console.log("Search:", Search ? "✅" : "❌");
console.log("Recommendation:", Recommendation ? "✅" : "❌");
console.log("View:", View ? "✅" : "❌");
console.log("==================\n");

// Cloudinary config
// const CLOUD_NAME = "deuyaqjju";
// const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
const CLOUDINARY_BASE = "https://res.cloudinary.com/demo/image/upload";

// Cloudinary image URLs
const images = {
  // Avatars
  avatars: {
    admin: `${CLOUDINARY_BASE}/v1/users/admin-avatar.jpg`,
    user1: `${CLOUDINARY_BASE}/v1/users/user1-avatar.jpg`,
    user2: `${CLOUDINARY_BASE}/v1/users/user2-avatar.jpg`,
    user3: `${CLOUDINARY_BASE}/v1/users/user3-avatar.jpg`,
  },

  // Category images
  categories: {
    phone: `${CLOUDINARY_BASE}/sample.jpg`,
    laptop: `${CLOUDINARY_BASE}/sample.jpg`,
    accessory: `${CLOUDINARY_BASE}/sample.jpg`,
    watch: `${CLOUDINARY_BASE}/sample.jpg`,
  },

  // Product images - iPhone 15
  iphone15: {
    main: [
      {
        url: `${CLOUDINARY_BASE}/v1/products/iphone15/iphone15-1.jpg`,
        public_id: "products/iphone15/iphone15-1",
      },
      {
        url: `${CLOUDINARY_BASE}/v1/products/iphone15/iphone15-2.jpg`,
        public_id: "products/iphone15/iphone15-2",
      },
    ],
    colors: {
      blue: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/iphone15/blue-1.jpg`,
          public_id: "products/iphone15/blue-1",
        },
      ],
      natural: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/iphone15/natural-1.jpg`,
          public_id: "products/iphone15/natural-1",
        },
      ],
    },
  },

  // Samsung S24
  s24: {
    main: [
      {
        url: `${CLOUDINARY_BASE}/v1/products/s24/s24-1.jpg`,
        public_id: "products/s24/s24-1",
      },
      {
        url: `${CLOUDINARY_BASE}/v1/products/s24/s24-2.jpg`,
        public_id: "products/s24/s24-2",
      },
    ],
    colors: {
      black: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/s24/black-1.jpg`,
          public_id: "products/s24/black-1",
        },
      ],
      gold: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/s24/gold-1.jpg`,
          public_id: "products/s24/gold-1",
        },
      ],
    },
  },

  // Macbook
  macbook: {
    main: [
      {
        url: `${CLOUDINARY_BASE}/v1/products/macbook/macbook-1.jpg`,
        public_id: "products/macbook/macbook-1",
      },
      {
        url: `${CLOUDINARY_BASE}/v1/products/macbook/macbook-2.jpg`,
        public_id: "products/macbook/macbook-2",
      },
    ],
    colors: {
      spacegray: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/macbook/spacegray-1.jpg`,
          public_id: "products/macbook/spacegray-1",
        },
      ],
      silver: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/macbook/silver-1.jpg`,
          public_id: "products/macbook/silver-1",
        },
      ],
    },
  },

  // Dell XPS
  dell: {
    main: [
      {
        url: `${CLOUDINARY_BASE}/v1/products/dell/dell-1.jpg`,
        public_id: "products/dell/dell-1",
      },
    ],
    colors: {
      silver: [
        {
          url: `${CLOUDINARY_BASE}/v1/products/dell/silver-1.jpg`,
          public_id: "products/dell/silver-1",
        },
      ],
    },
  },

  // Sample images (nếu chưa upload ảnh thật)
  samples: {
    phone: `${CLOUDINARY_BASE}/v1/samples/iphone.jpg`,
    laptop: `${CLOUDINARY_BASE}/v1/samples/laptop.jpg`,
    accessory: `${CLOUDINARY_BASE}/v1/samples/headphones.jpg`,
    watch: `${CLOUDINARY_BASE}/v1/samples/watch.jpg`,
  },
};

// Hàm random trong khoảng
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Danh sách để tạo nhiều users
const firstNames = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Huỳnh",
  "Phan",
  "Vũ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
];
const lastNames = [
  "Văn Anh",
  "Thị Bích",
  "Văn Cường",
  "Thị Dung",
  "Văn Em",
  "Thị Phương",
  "Văn Giàu",
  "Thị Hoa",
  "Văn Ý",
  "Thị Kim",
];
const cities = [
  "Hà Nội",
  "TP.HCM",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Nha Trang",
  "Huế",
  "Đà Lạt",
  "Vũng Tàu",
  "Nam Định",
];
const brands = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "MSI",
  "LG",
];
const categoriesList = [
  "Điện thoại",
  "Laptop",
  "Phụ kiện",
  "Đồng hồ thông minh",
  "Máy tính bảng",
  "Tai nghe",
  "Sạc dự phòng",
  "Ốp lưng",
];

// Danh sách sản phẩm mẫu
const productTemplates = [
  {
    name: "iPhone",
    brand: "Apple",
    basePrice: 20000000,
    category: "Điện thoại",
  },
  {
    name: "Samsung Galaxy",
    brand: "Samsung",
    basePrice: 15000000,
    category: "Điện thoại",
  },
  {
    name: "Xiaomi",
    brand: "Xiaomi",
    basePrice: 8000000,
    category: "Điện thoại",
  },
  { name: "MacBook", brand: "Apple", basePrice: 30000000, category: "Laptop" },
  { name: "Dell XPS", brand: "Dell", basePrice: 25000000, category: "Laptop" },
  { name: "HP Pavilion", brand: "HP", basePrice: 18000000, category: "Laptop" },
  { name: "AirPods", brand: "Apple", basePrice: 4000000, category: "Tai nghe" },
  {
    name: "Samsung Buds",
    brand: "Samsung",
    basePrice: 2500000,
    category: "Tai nghe",
  },
  {
    name: "Apple Watch",
    brand: "Apple",
    basePrice: 8000000,
    category: "Đồng hồ thông minh",
  },
  {
    name: "Samsung Watch",
    brand: "Samsung",
    basePrice: 6000000,
    category: "Đồng hồ thông minh",
  },
  {
    name: "iPad",
    brand: "Apple",
    basePrice: 12000000,
    category: "Máy tính bảng",
  },
  {
    name: "Samsung Tab",
    brand: "Samsung",
    basePrice: 10000000,
    category: "Máy tính bảng",
  },
];

// Màu sắc
const colors = [
  "Đen",
  "Trắng",
  "Xanh",
  "Đỏ",
  "Vàng",
  "Bạc",
  "Xám",
  "Hồng",
  "Tím",
  "Cam",
];

// Hàm tạo email
const generateEmail = (firstName, lastName) => {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
  const randomNum = random(1, 999);
  return `${firstName.toLowerCase()}${lastName.toLowerCase().replace(/\s/g, "")}${randomNum}@${domains[random(0, domains.length - 1)]}`;
};

// Hàm tạo phone
const generatePhone = () => {
  return "0" + random(3, 9) + random(10000000, 99999999).toString();
};

// Kết nối database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce",
    );
    console.log(`✅ Kết nối database thành công: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Lỗi kết nối database:", error);
    process.exit(1);
  }
};

// Hàm kiểm tra dữ liệu đã tồn tại chưa
const checkExists = async (model, filter) => {
  return await model.findOne(filter);
};

// Hàm tạo dữ liệu mẫu (GIỮ LẠI DATA CŨ)
const seedData = async () => {
  try {
    console.log("\n🔄 BẮT ĐẦU THÊM DATA MỚI (GIỮ NGUYÊN DATA CŨ)...\n");

    // await Promise.all([
    // User.deleteMany(),
    // Product.deleteMany(),
    // Category.deleteMany(),
    // Order.deleteMany(),
    // Cart.deleteMany(),
    // Review.deleteMany(),
    // Coupon.deleteMany(),
    // Behavior.deleteMany(),
    // Search.deleteMany(),
    // Recommendation.deleteMany(),
    // AdminLog.deleteMany(),
    // Checkout.deleteMany(),
    // View.deleteMany(),
    // ]);
    // chỉ xóa khi cần
    const RESET = false;

    if (RESET) {
      await Promise.all([
        Product.deleteMany(),
        Order.deleteMany(),
        Review.deleteMany(),
      ]);
    }

    // 1. KIỂM TRA ADMIN - Chỉ tạo nếu chưa có
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    let admin = await checkExists(User, { email: "admin.system@gmail.com" });
    if (!admin) {
      admin = await User.create({
        firstName: "Admin",
        lastName: "System",
        email: "admin.system@gmail.com",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        profilePic: images.avatars.admin,
        profilePicPublicId: "users/admin-avatar",
        phoneNo: "0987654321",
        address: "123 Nguyễn Huệ, Quận 1",
        city: "TP.HCM",
        gender: "male",
        dateOfBirth: new Date("1990-01-01"),
        googleId: `google_admin_${Date.now()}`,
      });
      console.log("✅ Đã tạo admin mới:", admin.email);
    } else {
      console.log("⏭️  Admin đã tồn tại, bỏ qua:", admin.email);
    }

    // 2. KIỂM TRA USERS - Chỉ tạo nếu chưa có
    const userEmails = [
      "nguyenvan.anh@gmail.com",
      "tranthi.bich@gmail.com",
      "levan.cuong@gmail.com",
    ];

    const users = [];
    for (const email of userEmails) {
      let user = await checkExists(User, { email });
      if (!user) {
        const userData = {
          "nguyenvan.anh@gmail.com": {
            firstName: "Nguyễn",
            lastName: "Văn Anh",
            profilePic: images.avatars.user1,
            publicId: "users/user1-avatar",
            phone: "0912345678",
            address: "456 Lê Lợi, Quận 3",
            city: "TP.HCM",
            gender: "male",
            dob: new Date("1995-05-15"),
            preferences: {
              categories: ["Điện thoại", "Laptop"],
              brands: ["Apple", "Samsung"],
              priceRange: { min: 0, max: 30000000 },
            },
          },
          "tranthi.bich@gmail.com": {
            firstName: "Trần",
            lastName: "Thị Bích",
            profilePic: images.avatars.user2,
            publicId: "users/user2-avatar",
            phone: "0923456789",
            address: "789 Nguyễn Trãi, Quận 5",
            city: "Hà Nội",
            gender: "female",
            dob: new Date("1998-10-20"),
            preferences: {
              categories: ["Phụ kiện", "Đồng hồ"],
              brands: ["Xiaomi", "Samsung"],
              priceRange: { min: 0, max: 10000000 },
            },
          },
          "levan.cuong@gmail.com": {
            firstName: "Lê",
            lastName: "Văn Cường",
            profilePic: images.avatars.user3,
            publicId: "users/user3-avatar",
            phone: "0934567890",
            address: "321 Hùng Vương",
            city: "Đà Nẵng",
            gender: "male",
            dob: new Date("1992-03-10"),
            preferences: {
              categories: ["Laptop", "Phụ kiện"],
              brands: ["Dell", "HP"],
              priceRange: { min: 0, max: 25000000 },
            },
          },
        };

        const data = userData[email];
        user = await User.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: email,
          password: hashedPassword,
          role: "user",
          isVerified: true,
          profilePic: data.profilePic,
          profilePicPublicId: data.publicId,
          phoneNo: data.phone,
          address: data.address,
          city: data.city,
          gender: data.gender,
          dateOfBirth: data.dob,
          preferences: data.preferences,
          googleId: `google_${email.replace(/[@.]/g, "_")}_${Date.now()}`,
        });
        console.log(`✅ Đã tạo user mới: ${email}`);
      } else {
        console.log(`⏭️  User ${email} đã tồn tại, bỏ qua`);
      }
      users.push(user);
    }

    //TẠO THÊM 50 USERS NGẪU NHIÊN

    console.log("\n🔄 Đang tạo thêm 50 users ngẫu nhiên...");
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[random(0, firstNames.length - 1)];
      const lastName = lastNames[random(0, lastNames.length - 1)];
      // const email = generateEmail(firstName, lastName);
      let email;
      do {
        email = generateEmail(firstName, lastName);
      } while (await User.findOne({ email }));

      let user = await checkExists(User, { email });
      if (!user) {
        user = await User.create({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          role: random(1, 10) === 1 ? "admin" : "user",
          isVerified: random(0, 1) === 1,
          profilePic: images.avatars[`user${random(1, 3)}`],
          profilePicPublicId: `users/random-avatar-${i}`,
          phoneNo: generatePhone(),
          address: `${random(1, 999)} Đường ${random(1, 50)}, Quận ${random(1, 12)}`,
          city: cities[random(0, cities.length - 1)],
          gender: random(0, 1) === 1 ? "male" : "female",
          dateOfBirth: new Date(
            random(1970, 2005),
            random(0, 11),
            random(1, 28),
          ),
          preferences: {
            categories: [
              categoriesList[random(0, categoriesList.length - 1)],
              categoriesList[random(0, categoriesList.length - 1)],
            ],
            brands: [
              brands[random(0, brands.length - 1)],
              brands[random(0, brands.length - 1)],
            ],
            priceRange: {
              min: random(0, 5000000),
              max: random(10000000, 50000000),
            },
          },
          googleId: `google_random_${i}_${Date.now()}`,
        });
        users.push(user);

        if ((i + 1) % 10 === 0) {
          console.log(`  ✅ Đã tạo ${i + 1}/50 users...`);
        }
      }
    }
    console.log(`✅ Tổng số users hiện tại: ${users.length}`);

    // 3. KIỂM TRA CATEGORIES - Chỉ tạo nếu chưa có

    //MỞ RỘNG categoryNames

    const categoryNames = [
      "Điện thoại",
      "Laptop",
      "Phụ kiện",
      "Đồng hồ thông minh",
      "Máy tính bảng",
      "Tai nghe",
      "Sạc dự phòng",
      "Ốp lưng",
    ];

    const categories = [];

    for (const name of categoryNames) {
      let category = await checkExists(Category, { name });
      if (!category) {
        const categoryData = {
          "Điện thoại": {
            slug: "dien-thoai",
            desc: "Các dòng điện thoại thông minh từ các thương hiệu nổi tiếng",
            image: images.categories.phone,
            order: 1,
            metaTitle: "Điện thoại chính hãng giá tốt",
            metaDesc: "Điện thoại iPhone, Samsung, Xiaomi chính hãng",
            keywords: ["iphone", "samsung", "xiaomi", "điện thoại"],
          },
          Laptop: {
            slug: "laptop",
            desc: "Laptop văn phòng, gaming cao cấp",
            image: images.categories.laptop,
            order: 2,
            metaTitle: "Laptop chính hãng giá rẻ",
            metaDesc: "Macbook, Dell, HP, Asus chính hãng",
            keywords: ["laptop", "macbook", "dell", "hp"],
          },
          "Phụ kiện": {
            slug: "phu-kien",
            desc: "Tai nghe, sạc dự phòng, ốp lưng, cáp sạc",
            image: images.categories.accessory,
            order: 3,
            keywords: ["tai nghe", "sac du phong", "op lung"],
          },
          "Đồng hồ thông minh": {
            slug: "dong-ho-thong-minh",
            desc: "Smartwatch theo dõi sức khỏe, thể thao",
            image: images.categories.watch,
            order: 4,
            metaTitle: "Đồng hồ thông minh chính hãng",
            keywords: ["apple watch", "samsung watch", "xiaomi watch"],
          },
          "Máy tính bảng": {
            slug: "may-tinh-bang",
            desc: "Máy tính bảng chính hãng từ các thương hiệu nổi tiếng",
            image: images.samples.laptop,
            order: 5,
            keywords: ["ipad", "samsung tab", "máy tính bảng"],
          },
          "Tai nghe": {
            slug: "tai-nghe",
            desc: "Tai nghe chất lượng cao, chống ồn",
            image: images.samples.accessory,
            order: 6,
            keywords: ["tai nghe", "airpods", "samsung buds"],
          },
          "Sạc dự phòng": {
            slug: "sac-du-phong",
            desc: "Pin sạc dự phòng dung lượng lớn",
            image: images.samples.accessory,
            order: 7,
            keywords: ["pin sạc", "sac du phong"],
          },
          "Ốp lưng": {
            slug: "op-lung",
            desc: "Ốp lưng bảo vệ điện thoại",
            image: images.samples.accessory,
            order: 8,
            keywords: ["ốp lưng", "bao da"],
          },
        };

        const data = categoryData[name];
        category = await Category.create({
          name: name,
          slug: data.slug,
          description: data.desc,
          image: data.image,
          order: data.order,
          createdBy: admin._id,
          isActive: true,
          isFeatured: name === "Điện thoại" || name === "Laptop",
          metaTitle: data.metaTitle,
          metaDescription: data.metaDesc,
          metaKeywords: data.keywords,
        });
        console.log(`✅ Đã tạo category mới: ${name}`);
      } else {
        console.log(`⏭️  Category ${name} đã tồn tại, bỏ qua`);
      }
      categories.push(category);
    }

    // 4. KIỂM TRA PRODUCTS - Chỉ tạo nếu chưa có
    const productNames = [
      "iPhone 15 Pro Max 256GB",
      "Samsung Galaxy S24 Ultra 512GB",
      "MacBook Pro 14 M3 512GB",
      "Dell XPS 15 9530",
    ];

    const products = [];
    for (let i = 0; i < productNames.length; i++) {
      const name = productNames[i];
      let product = await checkExists(Product, { name });

      if (!product) {
        const productData = [
          {
            // iPhone
            slug: "iphone-15-pro-max-256gb",
            desc: "Điện thoại cao cấp nhất của Apple với chip A17 Pro, camera 48MP, màn hình Super Retina XDR",
            originalPrice: 34990000,
            discount: 3000000,
            price: 31990000,
            discountPercentage: 8.5,
            category: categories.find((c) => c.name === "Điện thoại")._id,
            brand: "Apple",
            colors: [
              {
                name: "Titan Xanh",
                images: images.iphone15.colors.blue,
                stock: 15,
              },
              {
                name: "Titan Tự Nhiên",
                images: images.iphone15.colors.natural,
                stock: 10,
              },
            ],
            images: images.iphone15.main,
            specs: {
              "Màn hình": "6.7 inch Super Retina XDR, 2796x1290 pixels",
              Chip: "Apple A17 Pro (3nm)",
              RAM: "8GB",
              Pin: "4422 mAh, sạc nhanh 27W",
              "Camera sau": "Chính 48MP + góc rộng 12MP + tele 12MP",
              "Camera trước": "12MP",
              "Hệ điều hành": "iOS 17",
              "Trọng lượng": "221g",
            },
          },
          {
            // Samsung
            slug: "samsung-galaxy-s24-ultra-512gb",
            desc: "Điện thoại cao cấp với bút S-Pen và camera 200MP, zoom không gian 100x",
            originalPrice: 28990000,
            discount: 2000000,
            price: 26990000,
            discountPercentage: 6.9,
            category: categories.find((c) => c.name === "Điện thoại")._id,
            brand: "Samsung",
            colors: [
              {
                name: "Titan Đen",
                images: images.s24.colors.black,
                stock: 20,
              },
              {
                name: "Titan Vàng",
                images: images.s24.colors.gold,
                stock: 12,
              },
            ],
            images: images.s24.main,
            specs: {
              "Màn hình": "6.8 inch Dynamic AMOLED 2X, 3088x1440 pixels",
              Chip: "Snapdragon 8 Gen 3",
              RAM: "12GB",
              Pin: "5000 mAh, sạc nhanh 45W",
              "Camera sau":
                "Chính 200MP + góc rộng 12MP + tele 10MP + tele 50MP",
              "Camera trước": "12MP",
              "Bút S-Pen": "Tích hợp",
              "Trọng lượng": "233g",
            },
          },
          {
            // Macbook
            slug: "macbook-pro-14-m3-512gb",
            desc: "Laptop cao cấp với chip M3 Pro, màn hình Liquid Retina XDR, 18GB RAM",
            originalPrice: 49990000,
            discount: 5000000,
            price: 44990000,
            discountPercentage: 10,
            category: categories.find((c) => c.name === "Laptop")._id,
            brand: "Apple",
            colors: [
              {
                name: "Xám Không Gian",
                images: images.macbook.colors.spacegray,
                stock: 8,
              },
              {
                name: "Bạc",
                images: images.macbook.colors.silver,
                stock: 6,
              },
            ],
            images: images.macbook.main,
            specs: {
              "Màn hình": "14 inch Liquid Retina XDR, 3024x1964 pixels",
              Chip: "Apple M3 Pro (12-core CPU, 18-core GPU)",
              RAM: "18GB",
              SSD: "512GB",
              Pin: "70Wh, lên đến 18 giờ",
              "Cổng kết nối": "3x Thunderbolt 4, HDMI, SDXC, MagSafe 3",
              "Trọng lượng": "1.61kg",
            },
          },
          {
            // Dell
            slug: "dell-xps-15-9530",
            desc: "Laptop cao cấp với màn hình OLED 4K, chip Intel Core i9, RAM 32GB",
            originalPrice: 42990000,
            discount: 3000000,
            price: 39990000,
            discountPercentage: 7,
            category: categories.find((c) => c.name === "Laptop")._id,
            brand: "Dell",
            colors: [
              {
                name: "Bạc",
                images: images.dell.colors.silver,
                stock: 5,
              },
            ],
            images: images.dell.main,
            specs: {
              "Màn hình": "15.6 inch OLED 4K (3840x2400), cảm ứng",
              Chip: "Intel Core i9-13900H (14-core)",
              RAM: "32GB DDR5",
              SSD: "1TB NVMe",
              "Card đồ họa": "NVIDIA RTX 4070 8GB",
              Pin: "86Wh",
              "Trọng lượng": "1.86kg",
            },
          },
        ];

        const data = productData[i];
        product = await Product.create({
          name: name,
          slug: data.slug,
          description: data.desc,
          originalPrice: data.originalPrice,
          discount: data.discount,
          price: data.price,
          discountPercentage: data.discountPercentage,
          discountExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: data.category,
          brand: data.brand,
          colors: data.colors,
          images: data.images,
          specifications: data.specs,
          rating: 0,
          reviewCount: 0,
          isActive: true,
          isFeatured: i < 3,
          createdBy: admin._id,
          adminStatus: "approved",
        });
        console.log(`✅ Đã tạo product mới: ${name}`);
      } else {
        console.log(`⏭️  Product ${name} đã tồn tại, bỏ qua`);
      }
      products.push(product);
    }

    //  TẠO THÊM 50 SẢN PHẨM NGẪU NHIÊN

    console.log("\n🔄 Đang tạo thêm 50 sản phẩm ngẫu nhiên...");

    for (let i = 0; i < 50; i++) {
      const template = productTemplates[random(0, productTemplates.length - 1)];
      const category = categories.find((c) => c.name === template.category);
      if (!category) continue;

      const productName = `${template.name} ${random(2020, 2024)} ${random(128, 512)}GB`;

      let product = await checkExists(Product, { name: productName });
      if (!product) {
        const originalPrice = (template.basePrice * random(8, 15)) / 10;
        const discount = Math.floor(Math.random() * (originalPrice * 0.3));
        const price = originalPrice - discount;

        product = await Product.create({
          name: productName,
          slug: `${template.name.toLowerCase().replace(/\s/g, "-")}-${random(1000, 9999)}`,
          description: `Sản phẩm ${template.name} chất lượng cao, chính hãng`,
          originalPrice: originalPrice,
          discount: discount,
          price: price,
          discountPercentage: Math.round((discount / originalPrice) * 100),
          discountExpiry: random(0, 1)
            ? new Date(Date.now() + random(1, 90) * 24 * 60 * 60 * 1000)
            : null,
          category: category._id,
          brand: template.brand,
          colors: [
            {
              name: colors[random(0, colors.length - 1)],
              images: [
                {
                  url: `${CLOUDINARY_BASE}/v1/products/random/product-${i}-1.jpg`,
                  public_id: `products/random/product-${i}-1`,
                },
              ],
              stock: random(0, 50),
            },
            {
              name: colors[random(0, colors.length - 1)],
              images: [
                {
                  url: `${CLOUDINARY_BASE}/v1/products/random/product-${i}-2.jpg`,
                  public_id: `products/random/product-${i}-2`,
                },
              ],
              stock: random(0, 30),
            },
          ],
          images: [
            {
              url: `${CLOUDINARY_BASE}/v1/products/random/product-${i}-main.jpg`,
              public_id: `products/random/product-${i}-main`,
            },
          ],
          specifications: {
            "Thương hiệu": template.brand,
            "Màu sắc": colors[random(0, colors.length - 1)],
            "Bảo hành": `${random(12, 24)} tháng`,
            "Xuất xứ": ["Trung Quốc", "Việt Nam", "Hàn Quốc", "Mỹ"][
              random(0, 3)
            ],
          },
          rating: random(30, 50) / 10,
          reviewCount: 0,
          isActive: random(0, 1) === 1,
          isFeatured: random(0, 1) === 1,
          createdBy: admin._id,
          adminStatus: ["approved", "pending", "approved"][random(0, 2)],
        });
        products.push(product);

        if ((i + 1) % 10 === 0) {
          console.log(`  ✅ Đã tạo ${i + 1}/50 sản phẩm...`);
        }
      }
    }
    console.log(`✅ Tổng số sản phẩm: ${products.length}`);

    // 5. KIỂM TRA REVIEWS - Chỉ tạo nếu chưa có
    if (users.length > 0 && products.length > 0) {
      const reviewPairs = [
        {
          user: users[0],
          product: products[0],
          rating: 5,
          comment:
            "iPhone 15 Pro Max quá đẹp, pin trâu, chụp ảnh đẹp. Màu titan xanh nhìn rất sang!",
        },
        {
          user: users[1],
          product: products[0],
          rating: 4,
          comment:
            "Máy đẹp, chụp ảnh tốt, nhưng hơi nóng khi chơi game nặng. Giao hàng nhanh.",
        },
        {
          user: users[2],
          product: products[1],
          rating: 5,
          comment:
            "S24 Ultra camera zoom siêu đỉnh, chụp mặt trăng rõ. Pin dùng cả ngày.",
        },
        {
          user: users[0],
          product: products[2],
          rating: 5,
          comment:
            "Macbook Pro M3 quá mạnh, render video 4K mượt mà. Màn hình đẹp xuất sắc!",
        },
      ];

      for (const pair of reviewPairs) {
        if (pair.user && pair.product) {
          const existingReview = await checkExists(Review, {
            user: pair.user._id,
            product: pair.product._id,
          });

          if (!existingReview) {
            await Review.create({
              user: pair.user._id,
              product: pair.product._id,
              rating: pair.rating,
              comment: pair.comment,
            });
            console.log(`✅ Đã tạo review cho product ${pair.product.name}`);
          } else {
            console.log(`⏭️  Review đã tồn tại, bỏ qua`);
          }
        }
      }

      // Update product ratings
      if (products[0]) {
        await Product.updateOne(
          { _id: products[0]._id },
          { $set: { rating: 4.5, reviewCount: 2 } },
        );
      }
      if (products[1]) {
        await Product.updateOne(
          { _id: products[1]._id },
          { $set: { rating: 5, reviewCount: 1 } },
        );
      }
      if (products[2]) {
        await Product.updateOne(
          { _id: products[2]._id },
          { $set: { rating: 5, reviewCount: 1 } },
        );
      }
    }

    //  TẠO THÊM 200 REVIEWS NGẪU NHIÊN

    console.log("\n🔄 Đang tạo 200 reviews ngẫu nhiên...");
    let reviewCount = 0;

    for (let i = 0; i < 200; i++) {
      const randomUser = users[random(0, users.length - 1)];
      const randomProduct = products[random(0, products.length - 1)];

      if (randomUser && randomProduct) {
        const existingReview = await checkExists(Review, {
          user: randomUser._id,
          product: randomProduct._id,
        });

        if (!existingReview) {
          await Review.create({
            user: randomUser._id,
            product: randomProduct._id,
            rating: random(3, 5),
            comment: [
              "Sản phẩm tốt, đáng mua!",
              "Giao hàng nhanh, đóng gói cẩn thận",
              "Chất lượng ổn, giá hợp lý",
              "Dùng tốt, sẽ ủng hộ tiếp",
              "Sản phẩm như mô tả",
              "Hơi đắt nhưng xài tốt",
              "Nên mua nha mọi người",
              "Tạm ổn, giao hơi chậm",
            ][random(0, 7)],
          });
          reviewCount++;

          if (reviewCount % 50 === 0) {
            console.log(`  ✅ Đã tạo ${reviewCount}/200 reviews...`);
          }
        }
      }
    }

    // 6. KIỂM TRA COUPONS - Chỉ tạo nếu chưa có
    const couponCodes = ["WELCOME10", "SALE50K", "FREESHIP"];
    for (const code of couponCodes) {
      const existingCoupon = await checkExists(Coupon, { code });
      if (!existingCoupon) {
        const couponData = {
          WELCOME10: {
            name: "Giảm 10% cho đơn đầu tiên",
            desc: "Áp dụng cho khách hàng mới, tối đa 200.000đ",
            type: "percentage",
            value: 10,
            minOrder: 500000,
            maxDiscount: 200000,
          },
          SALE50K: {
            name: "Giảm 50.000đ",
            desc: "Giảm 50.000đ cho đơn hàng từ 300.000đ",
            type: "fixed",
            value: 50000,
            minOrder: 300000,
          },
          FREESHIP: {
            name: "Miễn phí vận chuyển",
            desc: "Miễn phí vận chuyển toàn quốc cho đơn từ 200.000đ",
            type: "free_shipping",
            value: 0,
            minOrder: 200000,
          },
        };

        const data = couponData[code];
        await Coupon.create({
          code: code,
          name: data.name,
          description: data.desc,
          discountType: data.type,
          discountValue: data.value,
          minOrderValue: data.minOrder,
          maxDiscount: data.maxDiscount,
          usageLimit: 100,
          usageLimitPerUser: 1,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          createdBy: admin._id,
          isActive: true,
          isPublic: true,
        });
        console.log(`✅ Đã tạo coupon mới: ${code}`);
      } else {
        console.log(`⏭️  Coupon ${code} đã tồn tại, bỏ qua`);
      }
    }

    // 7. KIỂM TRA CARTS - Chỉ tạo nếu chưa có
    if (users[0] && products[0] && products[3]) {
      const existingCart = await checkExists(Cart, { user: users[0]._id });
      if (!existingCart) {
        await Cart.create({
          user: users[0]._id,
          items: [
            {
              product: products[0]._id,
              color: "Titan Xanh",
              quantity: 1,
              priceAtAddition: products[0].price,
              isSelected: true,
            },
            {
              product: products[3]._id,
              color: "Bạc",
              quantity: 1,
              priceAtAddition: products[3].price,
              isSelected: true,
            },
          ],
          subtotal: products[0].price + products[3].price,
          discountApplied: 0,
          total: products[0].price + products[3].price,
        });
        console.log("✅ Đã tạo cart cho user 1");
      }
    }

    if (users[1] && products[1]) {
      const existingCart = await checkExists(Cart, { user: users[1]._id });
      if (!existingCart) {
        const welcomeCoupon = await checkExists(Coupon, { code: "WELCOME10" });
        await Cart.create({
          user: users[1]._id,
          items: [
            {
              product: products[1]._id,
              color: "Titan Đen",
              quantity: 1,
              priceAtAddition: products[1].price,
              isSelected: true,
            },
          ],
          subtotal: products[1].price,
          discountApplied: 0,
          total: products[1].price,
          coupon: welcomeCoupon?._id,
        });
        console.log("✅ Đã tạo cart cho user 2");
      }
    }

    // 8. KIỂM TRA ORDERS - Chỉ tạo nếu chưa có
    if (users[2] && products[2]) {
      const existingOrder = await checkExists(Order, {
        user: users[2]._id,
        "items.product": products[2]._id,
      });

      if (!existingOrder) {
        await Order.create({
          user: users[2]._id,
          items: [
            {
              product: products[2]._id,
              name: products[2].name,
              price: products[2].price,
              quantity: 1,
              color: "Xám Không Gian",
              total: products[2].price,
            },
          ],
          shippingAddress: {
            fullName: "Lê Văn Cường",
            phone: "0934567890",
            address: "321 Hùng Vương",
            city: "Đà Nẵng",
            district: "Hải Châu",
            ward: "Hải Châu 1",
          },
          subtotal: products[2].price,
          shippingFee: 30000,
          discount: 0,
          total: products[2].price + 30000,
          paymentMethod: "COD",
          paymentStatus: "paid",
          status: "delivered",
          deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        });
        console.log("✅ Đã tạo order cho user 3");
      }
    }

    //
    // THÊM 100 ĐƠN HÀNG NGẪU NHIÊN

    console.log("\n🔄 Đang tạo 100 đơn hàng ngẫu nhiên...");
    const orderStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const paymentMethods = ["COD", "BANKING", "MOMO", "VNPAY"];
    const paymentStatuses = ["pending", "paid", "failed"];

    for (let i = 0; i < 100; i++) {
      const randomUser = users[random(0, users.length - 1)];
      const randomProduct = products[random(0, products.length - 1)];
      const quantity = random(1, 3);

      if (randomUser && randomProduct) {
        const subtotal = randomProduct.price * quantity;
        const shippingFee = random(0, 50000);
        const discount = random(0, 1) ? random(0, subtotal * 0.2) : 0;

        await Order.create({
          user: randomUser._id,
          items: [
            {
              product: randomProduct._id,
              name: randomProduct.name,
              price: randomProduct.price,
              quantity: quantity,
              color: randomProduct.colors?.[0]?.name || "Mặc định",
              total: randomProduct.price * quantity,
            },
          ],
          shippingAddress: {
            fullName: `${randomUser.firstName} ${randomUser.lastName}`,
            phone: randomUser.phoneNo || generatePhone(),
            address: randomUser.address || `${random(1, 999)} Đường ABC`,
            city: randomUser.city || cities[random(0, cities.length - 1)],
          },
          subtotal: subtotal,
          shippingFee: shippingFee,
          discount: discount,
          total: subtotal + shippingFee - discount,
          paymentMethod: paymentMethods[random(0, paymentMethods.length - 1)],
          paymentStatus: paymentStatuses[random(0, paymentStatuses.length - 1)],
          status: orderStatuses[random(0, orderStatuses.length - 1)],
        });

        if ((i + 1) % 20 === 0) {
          console.log(`  ✅ Đã tạo ${i + 1}/100 đơn hàng...`);
        }
      }
    }

    // 9. KIỂM TRA BEHAVIORS - Chỉ tạo nếu chưa có
    if (users[0] && products[0]) {
      const existingBehavior = await checkExists(Behavior, {
        user: users[0]._id,
        behaviorType: "view",
        product: products[0]._id,
      });

      if (!existingBehavior) {
        await Behavior.create([
          {
            user: users[0]._id,
            behaviorType: "view",
            product: products[0]._id,
            metadata: {
              source: "homepage",
              duration: 120,
            },
          },
          {
            user: users[0]._id,
            behaviorType: "add_to_cart",
            product: products[0]._id,
            metadata: {
              quantity: 1,
              color: "Titan Xanh",
            },
          },
        ]);
        console.log("✅ Đã tạo behaviors cho user 1");
      }
    }

    // TẠO THÊM 500 BEHAVIORS NGẪU NHIÊN

    console.log("\n🔄 Đang tạo 500 hành vi người dùng...");
    const behaviorTypes = [
      "view",
      "search",
      "add_to_cart",
      "purchase",
      "wishlist",
    ];

    for (let i = 0; i < 500; i++) {
      const randomUser = users[random(0, users.length - 1)];
      const randomProduct = products[random(0, products.length - 1)];
      const behaviorType = behaviorTypes[random(0, behaviorTypes.length - 1)];

      if (randomUser && randomProduct) {
        await Behavior.create({
          user: randomUser._id,
          behaviorType: behaviorType,
          product: behaviorType !== "search" ? randomProduct._id : undefined,
          metadata: {
            source: ["homepage", "search", "product_detail", "recommendation"][
              random(0, 3)
            ],
            duration: random(10, 300),
            ...(behaviorType === "search" && {
              query: `tìm kiếm ${random(1, 100)}`,
            }),
          },
          timestamp: new Date(Date.now() - random(0, 90) * 24 * 60 * 60 * 1000),
        });
      }

      if ((i + 1) % 100 === 0) {
        console.log(`  ✅ Đã tạo ${i + 1}/500 behaviors...`);
      }
    }

    // 10. KIỂM TRA SEARCHES - Chỉ tạo nếu chưa có
    if (users[0]) {
      const existingSearch = await checkExists(Search, {
        user: users[0]._id,
        query: "laptop apple m3 giá bao nhiêu",
      });

      if (!existingSearch) {
        await Search.create([
          {
            user: users[0]._id,
            query: "laptop apple m3 giá bao nhiêu",
            resultsCount: 3,
            filters: {
              category: "Laptop",
              brand: "Apple",
              priceRange: "30-50 triệu",
            },
            device: "mobile",
          },
          {
            user: users[1]._id,
            query: "samsung galaxy s24 ultra",
            resultsCount: 5,
            filters: {
              category: "Điện thoại",
              brand: "Samsung",
              color: "đen",
            },
            device: "desktop",
          },
        ]);
        console.log("✅ Đã tạo searches");
      }
    }

    //  TẠO THÊM 100 SEARCHES NGẪU NHIÊN

    console.log("\n🔄 Đang tạo thêm 100 searches...");
    for (let i = 0; i < 100; i++) {
      const randomUser = users[random(0, users.length - 1)];
      if (randomUser) {
        await Search.create({
          user: randomUser._id,
          query:
            ["iphone", "samsung", "laptop", "macbook", "tai nghe"][
              random(0, 4)
            ] +
            " " +
            random(1, 100),
          resultsCount: random(1, 50),
          filters: {
            category: categoriesList[random(0, categoriesList.length - 1)],
          },
          device: ["mobile", "desktop", "tablet"][random(0, 2)],
          timestamp: new Date(Date.now() - random(0, 30) * 24 * 60 * 60 * 1000),
        });
      }
    }

    // 11. KIỂM TRA VIEWS - Chỉ tạo nếu chưa có
    if (users[0] && products[0]) {
      const existingView = await checkExists(View, {
        user: users[0]._id,
        product: products[0]._id,
        sessionId: "sess_abc123",
      });

      if (!existingView) {
        await View.create([
          {
            user: users[0]._id,
            product: products[0]._id,
            sessionId: "sess_abc123",
            duration: 180,
            source: "homepage",
            device: "mobile",
            timestamp: new Date(),
          },
          {
            user: users[1]._id,
            product: products[1]._id,
            sessionId: "sess_def456",
            duration: 240,
            source: "search_results",
            device: "desktop",
            timestamp: new Date(),
          },
        ]);
        console.log("✅ Đã tạo views");
      }
    }

    // TẠO THÊM 200 VIEWS NGẪU NHIÊN

    console.log("\n🔄 Đang tạo thêm 200 views...");
    for (let i = 0; i < 200; i++) {
      const randomUser = users[random(0, users.length - 1)];
      const randomProduct = products[random(0, products.length - 1)];
      if (randomUser && randomProduct) {
        await View.create({
          user: randomUser._id,
          product: randomProduct._id,
          sessionId: `sess_${random(1000, 9999)}`,
          duration: random(10, 600),
          source: ["homepage", "search", "direct", "social"][random(0, 3)],
          device: ["mobile", "desktop", "tablet"][random(0, 2)],
          timestamp: new Date(Date.now() - random(0, 30) * 24 * 60 * 60 * 1000),
        });
      }
    }

    // 12. KIỂM TRA ADMIN LOGS - Chỉ tạo nếu chưa có
    if (admin && products[0]) {
      const existingLog = await checkExists(AdminLog, {
        admin: admin._id,
        action: "create",
        entityId: products[0]._id,
      });

      if (!existingLog) {
        await AdminLog.create([
          {
            admin: admin._id,
            action: "create",
            entityType: "product",
            entityId: products[0]._id,
            entityName: products[0].name,
            changes: new Map([["product", "Thêm sản phẩm iPhone 15 Pro Max"]]),
            ipAddress: "192.168.1.100",
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            status: "success",
          },
          {
            admin: admin._id,
            action: "login",
            entityType: "user",
            entityId: admin._id,
            entityName: "Admin System",
            ipAddress: "192.168.1.101",
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            status: "success",
          },
        ]);
        console.log("✅ Đã tạo admin logs");
      }
    }

    // Update user wishlists
    if (users[0] && products[2] && products[1]) {
      await User.updateOne(
        { _id: users[0]._id },
        {
          $addToSet: {
            wishlist: { $each: [products[2]._id, products[1]._id] },
          },
        },
      );
    }

    console.log("\n📊 TỔNG KẾT DỮ LIỆU HIỆN TẠI:");
    console.log("=".repeat(60));
    console.log(`👥 Users: ${await User.countDocuments()}`);
    console.log(`📦 Products: ${await Product.countDocuments()}`);
    console.log(`📑 Categories: ${await Category.countDocuments()}`);
    console.log(`⭐ Reviews: ${await Review.countDocuments()}`);
    console.log(`🛒 Carts: ${await Cart.countDocuments()}`);
    console.log(`📝 Orders: ${await Order.countDocuments()}`);
    console.log(`🎫 Coupons: ${await Coupon.countDocuments()}`);
    console.log(`📊 Behaviors: ${await Behavior.countDocuments()}`);
    console.log(`🔍 Searches: ${await Search.countDocuments()}`);
    console.log(`👁️  Views: ${await View.countDocuments()}`);
    console.log(`📜 AdminLogs: ${await AdminLog.countDocuments()}`);
    console.log("=".repeat(60));

    console.log("\n✅ THÊM DATA MỚI THÀNH CÔNG! (GIỮ NGUYÊN DATA CŨ)");
    console.log("🔐 TÀI KHOẢN ĐĂNG NHẬP:");
    console.log("   👑 Admin: admin.system@gmail.com / Admin@123");
    console.log("   👤 User 1: nguyenvan.anh@gmail.com / Admin@123");
    console.log("   👤 User 2: tranthi.bich@gmail.com / Admin@123");
    console.log("   👤 User 3: levan.cuong@gmail.com / Admin@123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu mẫu:", error);
    process.exit(1);
  }
};

// Chạy seed
connectDB().then(() => seedData());
