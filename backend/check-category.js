const mongoose = require('mongoose');
require('./src/models/Manufacturer');
require('./src/models/Product');
require('./src/models/Category');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan').then(async () => {
  const Product = mongoose.model('Product');
  const Category = mongoose.model('Category');
  
  // 获取藤宝阁的商品分类ID
  const tbgId = new mongoose.Types.ObjectId('695615012b9fa54b2b942e8a');
  const products = await Product.find({ manufacturerId: tbgId, status: 'active' }).select('category').lean();
  
  const categoryIds = new Set();
  products.forEach(p => {
    if (typeof p.category === 'string') {
      categoryIds.add(p.category);
    } else if (p.category && p.category._id) {
      categoryIds.add(String(p.category._id));
    }
  });
  
  console.log('藤宝阁商品引用的分类ID:', Array.from(categoryIds));
  
  // 检查这些分类是否存在
  for (const catId of categoryIds) {
    if (mongoose.Types.ObjectId.isValid(catId)) {
      const cat = await Category.findById(catId).lean();
      console.log('分类', catId, ':', cat ? { name: cat.name, manufacturerId: cat.manufacturerId } : '不存在');
    }
  }
  
  // 检查所有分类
  const allCats = await Category.find({}).select('_id name manufacturerId').limit(10).lean();
  console.log('所有分类(前10):', allCats.map(c => ({ id: c._id, name: c.name, mfr: c.manufacturerId })));
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
