const mongoose = require('mongoose');
require('dotenv').config();

async function checkProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  const Authorization = require('../src/models/Authorization');
  
  // 查找截图中的商品
  const productCodes = ['1010', '1551', '1222', '040', '9066'];
  
  for (const code of productCodes) {
    const product = await Product.findOne({
      $or: [
        { productCode: code },
        { productCode: { $regex: new RegExp('^' + code) } },
        { name: { $regex: new RegExp(code) } }
      ]
    }).lean();
    
    if (product) {
      const mfg = product.manufacturerId 
        ? await Manufacturer.findById(product.manufacturerId).select('name').lean() 
        : null;
      
      console.log('\n商品:', product.productCode || product.name);
      console.log('  basePrice:', product.basePrice);
      console.log('  厂家ID:', product.manufacturerId);
      console.log('  厂家名:', mfg ? mfg.name : 'N/A');
      console.log('  manufacturerName:', product.manufacturerName);
      console.log('  status:', product.status);
      
      // 检查SKU价格
      if (product.skus && product.skus.length > 0) {
        console.log('  SKU数量:', product.skus.length);
        console.log('  SKU价格:', product.skus.map(s => s.price).join(', '));
      }
    } else {
      console.log('\n未找到商品:', code);
    }
  }
  
  // 检查平台授权状态
  const platformId = '6948fca5630729ca224ec425';
  const auths = await Authorization.find({
    toManufacturer: platformId,
    status: 'active'
  }).populate('fromManufacturer', 'name').select('fromManufacturer isEnabled').lean();
  
  console.log('\n平台已授权厂家:');
  auths.forEach(a => {
    console.log('  -', a.fromManufacturer?.name || 'N/A', '| isEnabled:', a.isEnabled);
  });
  
  process.exit(0);
}

checkProducts().catch(e => { console.error(e); process.exit(1); });
