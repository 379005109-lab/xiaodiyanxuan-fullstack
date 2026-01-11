// 直接测试 my-grants API 返回的数据
const mongoose = require('mongoose');
const Authorization = require('./src/models/Authorization');
const Manufacturer = require('./src/models/Manufacturer');
const Product = require('./src/models/Product');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // 模拟柏胜厂家用户的请求
  const bsManufacturer = await Manufacturer.findOne({ name: '柏胜' }).lean();
  const manufacturerId = bsManufacturer._id;
  
  // 获取当前厂家信息
  const currentManufacturer = await Manufacturer.findById(manufacturerId)
    .select('defaultDiscount defaultCommission')
    .lean();

  const authorizations = await Authorization.find({
    fromManufacturer: manufacturerId
  })
    .populate('toManufacturer', 'name fullName logo contactPerson')
    .populate('toDesigner', 'username nickname avatar email')
    .populate('products', '_id')
    .sort({ createdAt: -1 })
    .lean();

  const totalProductCount = await Product.countDocuments({
    manufacturerId: manufacturerId,
    status: 'active'
  });
  
  const mfrDefaultDiscount = currentManufacturer?.defaultDiscount || 0;
  const mfrDefaultCommission = currentManufacturer?.defaultCommission || 0;
  
  console.log('Manufacturer defaults:', { mfrDefaultDiscount, mfrDefaultCommission });
  console.log('Total products:', totalProductCount);
  console.log('\nAPI Response simulation:');
  
  for (const auth of authorizations) {
    let skuCount = 0;
    if (auth.scope === 'all') {
      skuCount = totalProductCount;
    } else if (auth.scope === 'category' && Array.isArray(auth.categories) && auth.categories.length > 0) {
      const categoryIds = auth.categories.map(c => typeof c === 'string' ? c : String(c));
      const count = await Product.countDocuments({
        manufacturerId: manufacturerId,
        status: 'active',
        $or: [
          { 'category': { $in: categoryIds } },
          { 'category._id': { $in: categoryIds } }
        ]
      });
      skuCount = count;
    } else if (Array.isArray(auth.products)) {
      skuCount = auth.products.length;
    }
    
    const result = {
      _id: auth._id,
      toName: auth.toManufacturer?.name || auth.toDesigner?.nickname || 'Unknown',
      actualProductCount: skuCount,
      minDiscountRate: auth.minDiscountRate || mfrDefaultDiscount,
      commissionRate: auth.commissionRate || mfrDefaultCommission,
      status: auth.status
    };
    
    if (auth.status === 'active') {
      console.log(JSON.stringify(result));
    }
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
