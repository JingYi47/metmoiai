
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const checkDB = async () => {
  try {
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Use connection.db to access collection directly without a schema if needed
    const productsCollection = mongoose.connection.db.collection('products');

    const total = await productsCollection.countDocuments();
    const active = await productsCollection.countDocuments({ isActive: true });
    
    console.log(`📊 Statistics:`);
    console.log(`- Total products: ${total}`);
    console.log(`- Active products (isActive: true): ${active}`);

    if (total > 0) {
      const sample = await productsCollection.findOne();
      console.log('🔍 Sample Product Name/isActive:');
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
