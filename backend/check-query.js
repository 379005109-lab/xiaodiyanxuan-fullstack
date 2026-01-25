const mongoose = require('mongoose');
require('./src/models/Manufacturer');
require('./src/models/Product');
require('./src/models/Category');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan').then(async () => {
  const Manufacturer = mongoose.model('Manufacturer');
  const Product = mongoose.model('Product');
  const Category = mongoose.model('Category');
  
  // 查找藤宝阁
  const tbg = await Manufacturer.findOne({ name: /藤宝阁/ }).lean();
  console.log('藤宝阁ID:', tbg._id.toString());
  
  const mid = new mongoose.Types.ObjectId(tbg._id);
  
  // 检查商品的manufacturerId类型
  const sampleProduct = await Product.findOne({ manufacturerId: mid }).lean();
  console.log('示例商品:', sampleProduct ? {
    _id: sampleProduct._id,
    name: sampleProduct.name,
    manufacturerId: sampleProduct.manufacturerId,
    manufacturerIdType: typeof sampleProduct.manufacturerId,
    status: sampleProduct.status,
    category: sampleProduct.category
  } : 'null');
  
  // 尝试不同的查询方式
  const query1 = await Product.countDocuments({ manufacturerId: mid });
  const query2 = await Product.countDocuments({ manufacturerId: tbg._id });
  const query3 = await Product.countDocuments({ manufacturerId: tbg._id.toString() });
  const query4 = await Product.countDocuments({ 
    manufacturerId: mid,
    status: 'active'
  });
  
  console.log('查询结果:');
  console.log('- ObjectId查询:', query1);
  console.log('- 原始_id查询:', query2);
  console.log('- 字符串查询:', query3);
  console.log('- 加status=active:', query4);
  
  // 检查Product的status值分布
  const products = await Product.find({ manufacturerId: mid }).select('status').lean();
  const statusDist = {};
  products.forEach(p => {
    statusDist[p.status] = (statusDist[p.status] || 0) + 1;
  });
  console.log('商品status分布:', statusDist);
  
  // 检查分类
  const cats = await Category.find({ manufacturerId: mid }).lean();
  console.log('厂家分类数量:', cats.length);
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
