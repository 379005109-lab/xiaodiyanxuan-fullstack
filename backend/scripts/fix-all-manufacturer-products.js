const mongoose = require('mongoose');
require('dotenv').config();

async function fixAllManufacturerProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('数据库已连接\n');
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  // 获取所有厂家
  const manufacturers = await Manufacturer.find({}).select('_id name shortName fullName').lean();
  
  let totalFixed = 0;
  
  for (const mfg of manufacturers) {
    const names = [mfg.name, mfg.shortName, mfg.fullName].filter(Boolean);
    if (names.length === 0) continue;
    
    // 更新所有 manufacturerName 匹配的商品
    const result = await Product.updateMany(
      {
        manufacturerName: { $in: names },
        manufacturerId: { $ne: mfg._id }
      },
      {
        $set: { manufacturerId: mfg._id }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`${mfg.name}: 修复了 ${result.modifiedCount} 个商品`);
      totalFixed += result.modifiedCount;
    }
    
    // 同时更新 skus.manufacturerName 匹配的商品
    const skuResult = await Product.updateMany(
      {
        'skus.manufacturerName': { $in: names },
        manufacturerId: { $ne: mfg._id }
      },
      {
        $set: { manufacturerId: mfg._id }
      }
    );
    
    if (skuResult.modifiedCount > 0) {
      console.log(`${mfg.name} (SKU): 修复了 ${skuResult.modifiedCount} 个商品`);
      totalFixed += skuResult.modifiedCount;
    }
  }
  
  console.log(`\n总共修复: ${totalFixed} 个商品`);
  
  // 显示最终分布
  const distribution = await Product.aggregate([
    { $group: { _id: '$manufacturerId', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('\n最终商品分布:');
  for (const d of distribution) {
    const mfg = await Manufacturer.findById(d._id).select('name').lean();
    console.log(`${mfg ? mfg.name : d._id}: ${d.count} 个商品`);
  }
  
  process.exit(0);
}

fixAllManufacturerProducts().catch(e => { console.error(e); process.exit(1); });
