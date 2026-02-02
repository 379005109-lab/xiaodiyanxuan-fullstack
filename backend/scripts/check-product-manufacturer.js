const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Authorization = require('../src/models/Authorization');
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  console.log('=== 查看授权记录中的商品-厂家关系 ===\n');
  
  // 查看所有授权记录
  const auths = await Authorization.find({ status: 'active' })
    .populate('fromManufacturer', 'name')
    .populate('toManufacturer', 'name')
    .lean();
  
  console.log('授权记录数:', auths.length);
  
  for (const a of auths) {
    const from = a.fromManufacturer ? a.fromManufacturer.name : 'N/A';
    const to = a.toManufacturer ? a.toManufacturer.name : 'N/A';
    const productCount = a.products ? a.products.length : 0;
    console.log(`${from} -> ${to} | 商品数: ${productCount} | scope: ${a.scope}`);
  }
  
  console.log('\n=== 检查商品的原始数据 ===\n');
  
  // 检查是否有商品数据可以推断厂家
  // 比如通过商品编码前缀
  const productPrefixes = await Product.aggregate([
    {
      $project: {
        prefix: { $substr: ['$productCode', 0, 3] },
        manufacturerId: 1
      }
    },
    {
      $group: {
        _id: '$prefix',
        count: { $sum: 1 },
        manufacturerIds: { $addToSet: '$manufacturerId' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  
  console.log('商品编码前缀分布:');
  productPrefixes.forEach(p => {
    console.log(`前缀 ${p._id}: ${p.count}个商品`);
  });
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
