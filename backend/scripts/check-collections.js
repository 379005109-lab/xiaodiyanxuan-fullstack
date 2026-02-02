const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('所有集合:');
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} 条记录`);
  }
  
  // 检查是否有 uploads 或其他文件相关集合
  const fileCollections = collections.filter(c => 
    c.name.includes('file') || c.name.includes('upload') || c.name.includes('fs') || c.name.includes('media')
  );
  console.log('\n文件相关集合:', fileCollections.map(c => c.name));
  
  // 检查商品的图片格式
  const Product = require('../src/models/Product');
  const product = await Product.findOne({}).select('name thumbnail images').lean();
  if (product) {
    console.log('\n示例商品:', product.name);
    console.log('  thumbnail:', product.thumbnail);
    console.log('  images[0]:', product.images?.[0]);
  }
  
  process.exit(0);
}

checkCollections().catch(e => { console.error(e); process.exit(1); });
