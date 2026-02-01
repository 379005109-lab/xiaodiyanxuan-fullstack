const mongoose = require('mongoose');
require('dotenv').config();

async function syncManufacturerProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('数据库已连接\n');
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  // 获取所有厂家
  const manufacturers = await Manufacturer.find({}).select('_id name shortName fullName').lean();
  console.log('厂家总数:', manufacturers.length);
  
  // 统计每个厂家的商品（通过 manufacturerName 匹配）
  for (const mfg of manufacturers) {
    const names = [mfg.name, mfg.shortName, mfg.fullName].filter(Boolean);
    if (names.length === 0) continue;
    
    // 查找 manufacturerName 匹配但 manufacturerId 不匹配的商品
    const mismatchedProducts = await Product.find({
      manufacturerName: { $in: names },
      manufacturerId: { $ne: mfg._id }
    }).select('productCode name manufacturerId manufacturerName').lean();
    
    if (mismatchedProducts.length > 0) {
      console.log(`\n${mfg.name} (${mfg._id}): ${mismatchedProducts.length} 个商品需要修复`);
      mismatchedProducts.slice(0, 5).forEach(p => {
        console.log(`  - ${p.productCode || p.name} (当前ID: ${p.manufacturerId})`);
      });
    }
    
    // 查找 manufacturerId 正确的商品数
    const correctProducts = await Product.countDocuments({ manufacturerId: mfg._id });
    console.log(`${mfg.name}: ${correctProducts} 个商品(ID正确)`);
  }
  
  // 检查没有 manufacturerName 的商品
  const noNameProducts = await Product.find({
    $or: [
      { manufacturerName: { $exists: false } },
      { manufacturerName: null },
      { manufacturerName: '' }
    ]
  }).select('productCode name manufacturerId').limit(20).lean();
  
  console.log(`\n没有manufacturerName的商品: ${noNameProducts.length}个(前20)`);
  noNameProducts.forEach(p => console.log(`  ${p.productCode || p.name} | mfgId: ${p.manufacturerId}`));
  
  process.exit(0);
}

syncManufacturerProducts().catch(e => { console.error(e); process.exit(1); });
