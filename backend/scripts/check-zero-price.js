const mongoose = require('mongoose');
require('dotenv').config();

async function checkZeroPrice() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  // 查找0元或无价格的活跃商品
  const zeroProducts = await Product.find({
    $or: [
      { basePrice: 0 },
      { basePrice: { $exists: false } },
      { basePrice: null }
    ],
    status: 'active'
  }).select('productCode name basePrice manufacturerId status').limit(30).lean();
  
  console.log('0元或无价格的活跃商品:', zeroProducts.length);
  
  for (const p of zeroProducts) {
    const mfg = p.manufacturerId ? await Manufacturer.findById(p.manufacturerId).select('name').lean() : null;
    console.log(p.productCode || p.name, '| 价格:', p.basePrice, '| 厂家:', mfg ? mfg.name : 'N/A');
  }
  
  process.exit(0);
}

checkZeroPrice().catch(e => { console.error(e); process.exit(1); });
