const mongoose = require('mongoose');
require('dotenv').config();

async function checkAuthStatus() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  const Authorization = require('../src/models/Authorization');
  
  const platformId = '6948fca5630729ca224ec425';
  
  // 检查授权给平台的厂家
  const auths = await Authorization.find({
    toManufacturer: platformId,
    authorizationType: 'manufacturer'
  }).populate('fromManufacturer', 'name').select('fromManufacturer isEnabled status').lean();
  
  console.log('=== 授权给平台的厂家 ===');
  const authorizedIds = [platformId];
  auths.forEach(a => {
    const status = a.status === 'active' && a.isEnabled !== false ? '✓' : '✗';
    console.log(`${status} ${a.fromManufacturer?.name || 'N/A'} | status:${a.status} | isEnabled:${a.isEnabled}`);
    if (a.status === 'active' && a.isEnabled !== false) {
      authorizedIds.push(a.fromManufacturer?._id?.toString());
    }
  });
  
  console.log('\n已授权厂家ID:', authorizedIds);
  
  // 公开页面应显示的商品数
  const publicProducts = await Product.countDocuments({
    status: 'active',
    $or: [
      { manufacturerId: { $in: authorizedIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { 'skus.manufacturerId': { $in: authorizedIds.map(id => new mongoose.Types.ObjectId(id)) } }
    ]
  });
  
  console.log('\n公开页面应显示的商品数:', publicProducts);
  
  // 按厂家分布
  console.log('\n=== 商品分布 ===');
  const distribution = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$manufacturerId', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  for (const d of distribution) {
    const mfg = await Manufacturer.findById(d._id).select('name').lean();
    const isAuthorized = authorizedIds.includes(d._id?.toString()) ? '✓' : '✗';
    console.log(`${isAuthorized} ${mfg ? mfg.name : d._id}: ${d.count}个商品`);
  }
  
  process.exit(0);
}

checkAuthStatus().catch(e => { console.error(e); process.exit(1); });
