import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkProducts() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await mongoose.connection.db.collection('products').find({
    name: { $regex: /Gaming/i }
  }).limit(5).toArray();
  console.log('Gaming Products:', JSON.stringify(products, null, 2));
  process.exit(0);
}
checkProducts();
