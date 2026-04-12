import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("🔍 Checking environment:");
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);
console.log("");

const testConnection = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected successfully!\n");

    // Kiểm tra collection products
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("📚 Collections in database:");
    collections.forEach((col) => console.log(`   - ${col.name}`));

    // Kiểm tra products
    const products = await db
      .collection("products")
      .find({})
      .limit(3)
      .toArray();
    console.log(`\n📦 Total products found: ${products.length}`);

    if (products.length > 0) {
      console.log("\n📋 Sample product:");
      const sample = products[0];
      console.log(`   Name: ${sample.name}`);
      console.log(`   Slug: ${sample.slug}`);
      console.log(`   Price: ${sample.price}`);
      console.log(`   IsActive: ${sample.isActive}`);
    } else {
      console.log("\n⚠️ NO PRODUCTS FOUND IN DATABASE!");
      console.log("💡 You need to add products to the database.");
    }

    await mongoose.disconnect();
    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("\n❌ Connection error:", error.message);
    if (error.message.includes("bad auth")) {
      console.error("💡 Wrong username or password in MONGO_URI");
    }
    if (error.message.includes("ENOTFOUND")) {
      console.error(
        "💡 Cannot reach MongoDB Atlas. Check your internet connection.",
      );
    }
  }
};

testConnection();
