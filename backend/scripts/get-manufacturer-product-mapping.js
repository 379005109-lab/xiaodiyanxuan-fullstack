const mongoose = require('mongoose');
require('dotenv').config();

async function getManufacturerProductMapping() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  // 获取所有厂家
  const manufacturers = await Manufacturer.find({}).select('_id name shortName fullName').lean();
  
  console.log('=== 厂家管理中的商品归属 ===\n');
  
  for (const mfg of manufacturers) {
    const mid = mfg._id;
    const names = [mfg.name, mfg.shortName, mfg.fullName].filter(Boolean);
    
    // 通过 manufacturerId 或 manufacturerName 查询
    const query = {
      $or: [
        { manufacturerId: mid },
        { 'skus.manufacturerId': mid }
      ]
    };
    
    if (names.length > 0) {
      query.$or.push({ manufacturerName: { $in: names } });
      query.$or.push({ 'skus.manufacturerName': { $in: names } });
    }
    
    const products = await Product.find(query).select('productCode name manufacturerId manufacturerName').lean();
    
    if (products.length > 0) {
      console.log(`\n${mfg.name} (${mfg._id}) - ${products.length}个商品:`);
      
      // 分组显示
      const byId = products.filter(p => p.manufacturerId?.toString() === mid.toString());
      const byName = products.filter(p => 
        p.manufacturerId?.toString() !== mid.toString() && 
        names.includes(p.manufacturerName)
      );
      
      if (byId.length > 0) {
        console.log(`  通过ID匹配: ${byId.length}个`);
        byId.slice(0, 5).forEach(p => console.log(`    - ${p.productCode || p.name}`));
        if (byId.length > 5) console.log(`    ... 还有${byId.length - 5}个`);
      }
      
      if (byName.length > 0) {
        console.log(`  通过名称匹配(ID不匹配): ${byName.length}个`);
        byName.slice(0, 5).forEach(p => console.log(`    - ${p.productCode || p.name} (当前ID: ${p.manufacturerId})`));
        if (byName.length > 5) console.log(`    ... 还有${byName.length - 5}个`);
      }
    }
  }
  
  // 显示无法归属的商品
  const platformId = '6948fca5630729ca224ec425';
  const noOwnerProducts = await Product.find({
    manufacturerId: platformId,
    $or: [
      { manufacturerName: { $exists: false } },
      { manufacturerName: null },
      { manufacturerName: '' }
    ]
  }).select('productCode name').limit(30).lean();
  
  console.log(`\n\n=== 小迪严选中无manufacturerName的商品(${noOwnerProducts.length}个) ===`);
  noOwnerProducts.forEach(p => console.log(`  ${p.productCode || p.name}`));
  
  process.exit(0);
}

getManufacturerProductMapping().catch(e => { console.error(e); process.exit(1); });
