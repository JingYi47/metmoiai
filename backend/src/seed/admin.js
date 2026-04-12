import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../database/db.js";
import { User } from "../models/userModel.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@gmail.com";

    const exists = await User.findOne({ email });
    if (exists) {
      console.log("Admin đã tồn tại");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
      firstName: "Admin",
      lastName: "System",
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    console.log("Seed admin thành công");
    process.exit();
  } catch (error) {
    console.error("Lỗi seed admin:", error);
    process.exit(1);
  }
};

seedAdmin();
