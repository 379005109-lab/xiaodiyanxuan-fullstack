const mongoose = require('mongoose');
require('dotenv').config();

async function checkZeroDisplay() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  
  // 检查截图中显示0元的商品
  const codes = ['1010', '1551', '1222', '0378', '034', '029', '6616', '0278', '027A', '027'];
  
  console.log('检查截图中0元商品的数据库价格:\n');
  
  for (const code of codes) {
    const product = await Product.findOne({
      $or: [
        { productCode: code },
        { productCode: { $regex: new RegExp('^' + code + '$', 'i') } },
        { name: { $regex: new RegExp(code) } }
      ]
    }).select('productCode name basePrice skus').lean();
    
    if (product) {
      const skuPrice = product.skus?.[0]?.price;
      console.log(`${product.productCode || product.name}:`);
      console.log(`  basePrice: ${product.basePrice}`);
      console.log(`  skus[0].price: ${skuPrice}`);
      console.log(`  typeof basePrice: ${typeof product.basePrice}`);
    }
  }
  
  // 统计没有basePrice的商品
  const noPrice = await Product.countDocuments({
    status: 'active',
    $or: [
      { basePrice: { $exists: false } },
      { basePrice: null },
      { basePrice: 0 }
    ]
  });
  console.log(`\n没有basePrice或为0的活跃商品: ${noPrice}个`);
  
  process.exit(0);
}

checkZeroDisplay().catch(e => { console.error(e); process.exit(1); });
