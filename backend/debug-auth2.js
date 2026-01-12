const mongoose = require('mongoose');
require('./src/models/Authorization');
require('./src/models/Manufacturer');
require('./src/models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Authorization = mongoose.model('Authorization');
  const Manufacturer = mongoose.model('Manufacturer');
  const Product = mongoose.model('Product');
  
  // 获取所有厂家的默认设置
  const manufacturers = await Manufacturer.find().select('name defaultDiscount defaultCommission').lean();
  console.log('All manufacturers defaults:');
  manufacturers.forEach(m => {
    console.log(`  ${m.name}: discount=${m.defaultDiscount}, commission=${m.defaultCommission}`);
  });
  
  // 获取所有授权记录
  const auths = await Authorization.find({ status: 'active' }).lean();
  console.log('\nAuthorizations:');
  for (const auth of auths) {
    const mfr = await Manufacturer.findById(auth.fromManufacturer).select('name').lean();
    const totalProducts = await Product.countDocuments({ manufacturerId: auth.fromManufacturer, status: 'active' });
    console.log(`  From: ${mfr?.name}, scope: ${auth.scope}, products: ${auth.products?.length || 0}, totalProducts: ${totalProducts}`);
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
