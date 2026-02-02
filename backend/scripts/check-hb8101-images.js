const mongoose = require('mongoose');
require('dotenv').config();

async function checkImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  
  // 查找H-8101或HB-8101
  const products = await Product.find({ 
    $or: [
      { productCode: { $regex: 'H-8101|HB-8101', $options: 'i' } },
      { name: { $regex: 'H-8101|HB-8101', $options: 'i' } }
    ]
  }).select('name productCode thumbnail images skus').lean();
  
  console.log('找到商品数:', products.length);
  
  for (const product of products) {
    console.log('\n商品:', product.name, '(', product.productCode, ')');
    console.log('  thumbnail:', product.thumbnail || '(空)');
    console.log('  images:', JSON.stringify(product.images?.slice(0, 3)) || '(空)');
    
    if (product.skus?.length > 0) {
      const sku = product.skus[0];
      console.log('  SKU[0].images:', JSON.stringify(sku.images?.slice(0, 2)) || '(空)');
      console.log('  SKU[0].fabricImage:', sku.fabricImage || '(空)');
      
      // 检查第一个图片是否存在
      const firstImage = sku.images?.[0] || product.images?.[0];
      if (firstImage) {
        const objectId = new mongoose.Types.ObjectId(firstImage);
        const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: objectId });
        console.log('  第一张图片存在:', !!file, file ? `(${file.filename})` : '');
      }
    }
  }
  
  process.exit(0);
}

checkImages().catch(e => { console.error(e); process.exit(1); });
