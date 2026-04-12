import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/tranm/Downloads/web4/web4/backend/.env' });

const MONGO_URI = process.env.MONGO_URI;

const checkDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const productSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', productSchema, 'products');

    const total = await Product.countDocuments();
    const active = await Product.countDocuments({ isActive: true });
    const inactive = await Product.countDocuments({ isActive: false });

    console.log(`📊 Statistics:`);
    console.log(`- Total products: ${total}`);
    console.log(`- Active products (isActive: true): ${active}`);
    console.log(`- Inactive products (isActive: false): ${inactive}`);

    if (total > 0) {
      const sample = await Product.findOne();
      console.log('🔍 Sample Product Slack/Name/isActive:');
      console.log({
        name: sample.name,
        slug: sample.slug,
        isActive: sample.isActive,
        images: sample.images ? `${sample.images.length} images` : 'No images'
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkDB();
