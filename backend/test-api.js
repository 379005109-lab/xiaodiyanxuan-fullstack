const mongoose = require('mongoose');
require('./src/models/Manufacturer');
require('./src/models/Product');
require('./src/models/Category');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan').then(async () => {
  const Manufacturer = mongoose.model('Manufacturer');
  const Product = mongoose.model('Product');
  const Category = mongoose.model('Category');
  
  const manufacturerId = '695615012b9fa54b2b942e8a';
  const mid = new mongoose.Types.ObjectId(manufacturerId);
  
  const manufacturer = await Manufacturer.findById(mid).select('name fullName shortName code').lean();
  console.log('Manufacturer:', JSON.stringify(manufacturer));
  
  const manufacturerNames = [manufacturer?.name, manufacturer?.fullName, manufacturer?.shortName, manufacturer?.code].filter(Boolean);
  
  const productQuery = {
    status: 'active',
    $or: [
      { manufacturerId: mid },
      { 'skus.manufacturerId': mid }
    ]
  };
  
  if (manufacturerNames.length > 0) {
    productQuery.$or.push({ manufacturerName: { $in: manufacturerNames } });
  }
  
  const products = await Product.find(productQuery).select('category').lean();
  console.log('Products found:', products.length);
  
  const countByCategoryId = new Map();
  for (const p of products) {
    const c = p?.category;
    let categoryId = null;
    if (typeof c === 'string') {
      categoryId = c;
    } else if (c && typeof c === 'object') {
      categoryId = c._id || c.id || c.slug;
    }
    if (!categoryId) continue;
    const key = String(categoryId);
    countByCategoryId.set(key, (countByCategoryId.get(key) || 0) + 1);
  }
  
  console.log('Categories:', JSON.stringify(Object.fromEntries(countByCategoryId)));
  
  const categoryIds = Array.from(countByCategoryId.keys())
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));
  
  const categories = categoryIds.length > 0
    ? await Category.find({ _id: { $in: categoryIds } }).select('_id name parentId').lean()
    : [];
  
  console.log('Category details:', JSON.stringify(categories));
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
