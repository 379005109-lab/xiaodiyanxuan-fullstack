const mongoose = require('mongoose');
require('./src/models/Authorization');
require('./src/models/Manufacturer');
require('./src/models/Product');
require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Authorization = mongoose.model('Authorization');
  const Manufacturer = mongoose.model('Manufacturer');
  const Product = mongoose.model('Product');
  
  // 模拟柏胜厂家的请求
  const bsManufacturer = await Manufacturer.findOne({ name: '柏胜' }).lean();
  if (!bsManufacturer) {
    console.log('柏胜 not found');
    process.exit(1);
  }
  
  console.log('柏胜 defaults:', { discount: bsManufacturer.defaultDiscount, commission: bsManufacturer.defaultCommission });
  
  const authorizations = await Authorization.find({
    fromManufacturer: bsManufacturer._id
  })
    .populate('toManufacturer', 'name')
    .populate('toDesigner', 'nickname username')
    .lean();
  
  const totalProductCount = await Product.countDocuments({
    manufacturerId: bsManufacturer._id,
    status: 'active'
  });
  
  console.log('Total products:', totalProductCount);
  console.log('Authorizations from 柏胜:');
  
  for (const auth of authorizations) {
    let skuCount = 0;
    if (auth.scope === 'all') {
      skuCount = totalProductCount;
    } else if (auth.scope === 'category' && Array.isArray(auth.categories) && auth.categories.length > 0) {
      const count = await Product.countDocuments({
        manufacturerId: bsManufacturer._id,
        status: 'active',
        $or: [
          { 'category': { $in: auth.categories } },
          { 'category._id': { $in: auth.categories } }
        ]
      });
      skuCount = count;
    } else if (Array.isArray(auth.products)) {
      skuCount = auth.products.length;
    }
    
    const toName = auth.toManufacturer?.name || auth.toDesigner?.nickname || auth.toDesigner?.username || 'Unknown';
    console.log(`  To: ${toName}, scope: ${auth.scope}, categories: ${auth.categories?.length || 0}, skuCount: ${skuCount}, minDiscount: ${auth.minDiscountRate || bsManufacturer.defaultDiscount}, commission: ${auth.commissionRate || bsManufacturer.defaultCommission}`);
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
