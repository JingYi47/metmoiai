import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "backend/.env") });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const ChatAdmin = mongoose.model("ChatAdmin", new mongoose.Schema({}, { strict: false }), "chatadmins");
  const conversations = await ChatAdmin.find({}).limit(5).lean();

  console.log(`Total conversations check: ${conversations.length}`);
  conversations.forEach(c => {
    console.log(`- ID: ${c._id}, conversationId: ${c.conversationId}, userId: ${c.userId}`);
  });

  process.exit(0);
}

check();
