const mongoose = require('mongoose');
require('./src/models/Manufacturer');
require('./src/models/Product');
require('./src/models/Authorization');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan').then(async () => {
  const Manufacturer = mongoose.model('Manufacturer');
  const Product = mongoose.model('Product');
  const Authorization = mongoose.model('Authorization');
  
  // 查找藤宝阁
  const tbg = await Manufacturer.findOne({ name: /藤宝阁/ }).select('_id name fullName shortName code').lean();
  console.log('藤宝阁厂家:', JSON.stringify(tbg));
  
  if (tbg) {
    const byId = await Product.countDocuments({ manufacturerId: tbg._id, status: 'active' });
    const byName = await Product.countDocuments({ manufacturerName: tbg.name, status: 'active' });
    console.log('藤宝阁商品 - 按ID:', byId, '按name:', byName);
  }
  
  // 查看所有商品的manufacturerName分布
  const names = await Product.distinct('manufacturerName', { status: 'active' });
  console.log('所有商品manufacturerName:', names);
  
  // 查看所有授权数量
  const allAuths = await Authorization.countDocuments({});
  const activeAuths = await Authorization.countDocuments({ status: 'active' });
  console.log('所有授权:', allAuths, '活跃授权:', activeAuths);
  
  // 查看授权状态分布
  const statuses = await Authorization.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('授权状态分布:', JSON.stringify(statuses));
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
