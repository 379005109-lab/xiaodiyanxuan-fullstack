const mongoose = require('mongoose');
require('dotenv').config();

async function checkImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const product = await Product.findOne({ 
    $or: [
      { productCode: 'HB-8101' },
      { productCode: 'H-8101' }
    ]
  }).select('name productCode thumbnail images skus').lean();
  
  if (product) {
    console.log('商品名称:', product.name);
    console.log('productCode:', product.productCode);
    console.log('thumbnail:', product.thumbnail);
    console.log('images:', JSON.stringify(product.images?.slice(0, 3)));
    
    if (product.skus?.length > 0) {
      const sku = product.skus[0];
      console.log('\nSKU 0:');
      console.log('  images:', JSON.stringify(sku.images?.slice(0, 2)));
      console.log('  fabricImage:', sku.fabricImage);
    }
  } else {
    console.log('未找到商品');
  }
  
  // 检查文件服务
  const File = mongoose.connection.collection('files.files');
  const count = await File.countDocuments();
  console.log('\n文件总数:', count);
  
  // 检查一个示例文件
  const sampleFile = await File.findOne();
  if (sampleFile) {
    console.log('示例文件:', {
      _id: sampleFile._id,
      filename: sampleFile.filename,
      contentType: sampleFile.contentType
    });
  }
  
  process.exit(0);
}

checkImages().catch(e => { console.error(e); process.exit(1); });
