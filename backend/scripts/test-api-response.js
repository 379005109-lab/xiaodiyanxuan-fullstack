const mongoose = require('mongoose');
require('dotenv').config();

async function testApiResponse() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  
  // 模拟公开页面获取商品的逻辑
  const platformId = '6948fca5630729ca224ec425';
  const authorizedIds = [
    platformId,
    '69550482ecfff5c176ec275d', // 恩都
    '69593aab361d49f2ea692fbf', // 柏胜
    '697c7d46f5d24a227f6aa715'  // 安卧时光
  ].map(id => new mongoose.Types.ObjectId(id));
  
  const products = await Product.find({
    status: 'active',
    $or: [
      { manufacturerId: { $in: authorizedIds } },
      { 'skus.manufacturerId': { $in: authorizedIds } }
    ]
  }).limit(10).lean();
  
  console.log('返回的商品字段示例:');
  products.slice(0, 3).forEach(p => {
    console.log('\n商品:', p.productCode || p.name);
    console.log('  basePrice:', p.basePrice);
    console.log('  labelPrice1:', p.labelPrice1);
    console.log('  takePrice:', p.takePrice);
    console.log('  skus[0].price:', p.skus?.[0]?.price);
    console.log('  字段列表:', Object.keys(p).join(', '));
  });
  
  process.exit(0);
}

testApiResponse().catch(e => { console.error(e); process.exit(1); });
