import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import { Category } from "./src/models/categoryModel.js";
import Product from "./src/models/productModel.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5002";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sync() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const products = await Product.find({ isActive: true })
    .populate("category", "name")
    .select(
      "name slug price brand category specs sold rating discountPercentage description images",
    )
    .lean();

  products.forEach(p => {
    if (p.category && p.category.name) {
      p.category = p.category.name;
    }
  });

  console.log(`Sending ${products.length} products to AI Service...`);
  
  let success = false;
  while (!success) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/api/train`,
        { products },
        { timeout: 300000 } 
      );
      console.log("Done syncing!", response.data);
      success = true;
    } catch (err) {
      console.log("Error or Not Ready... waiting 5 seconds. Msg:", err.message);
      await sleep(5000);
    }
  }
  process.exit(0);
}

sync();
