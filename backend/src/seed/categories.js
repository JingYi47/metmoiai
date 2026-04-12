import dotenv from "dotenv";
import connectDB from "../database/db.js";
import { Category } from "../models/categoryModel.js";
import { User } from "../models/userModel.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CATEGORIES = [
  { name: "iPhone", slug: "iphone", description: "Điện thoại iPhone Apple", isFeatured: true },
  { name: "Laptop", slug: "laptop", description: "Laptop các thương hiệu", isFeatured: true },
  { name: "iPad", slug: "ipad", description: "iPad Apple", isFeatured: true },
  { name: "Headphones", slug: "headphones", description: "Tai nghe các loại", isFeatured: true },
  { name: "Mini Speaker", slug: "minispeaker", description: "Loa mini bluetooth", isFeatured: false },
];

const seedCategories = async () => {
  try {
    await connectDB();

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.error("Chưa có admin. Hãy chạy seed/admin.js trước.");
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;

    for (const cat of CATEGORIES) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (exists) {
        console.log(`  Bỏ qua (đã tồn tại): ${cat.name}`);
        skipped++;
        continue;
      }
      await Category.create({ ...cat, createdBy: admin._id, isActive: true });
      console.log(`  Đã tạo: ${cat.name}`);
      created++;
    }

    console.log(`\nHoàn thành: ${created} tạo mới, ${skipped} bỏ qua.`);
    process.exit(0);
  } catch (err) {
    console.error("Lỗi seed categories:", err);
    process.exit(1);
  }
};

seedCategories();
