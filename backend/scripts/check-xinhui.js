const mongoose = require('mongoose');
require('dotenv').config();

async function checkProductDistribution() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  // 所有商品的厂家ID分布
  const products = await Product.find({}).select('productCode manufacturerId').lean();
  const mfgIds = new Set();
  products.forEach(p => {
    if (p.manufacturerId) mfgIds.add(p.manufacturerId.toString());
  });
  
  console.log('商品中的厂家ID分布:');
  for (const id of mfgIds) {
    const mfg = await Manufacturer.findById(id).select('name shortName').lean();
    const count = products.filter(p => p.manufacturerId && p.manufacturerId.toString() === id).length;
    console.log(id, '|', mfg ? mfg.name : '未知', '|', mfg ? mfg.shortName : 'N/A', '| 商品数:', count);
  }
  
  // 检查鑫辉商品
  const xinhuiMfg = await Manufacturer.findOne({ name: '鑫辉' }).lean();
  if (xinhuiMfg) {
    console.log('\n鑫辉商品详情:');
    const xinhuiProducts = await Product.find({ manufacturerId: xinhuiMfg._id }).select('productCode name').lean();
    xinhuiProducts.forEach(p => console.log(p.productCode, '|', p.name));
  }
  
  process.exit(0);
}

checkProductDistribution().catch(e => { console.error(e); process.exit(1); });
