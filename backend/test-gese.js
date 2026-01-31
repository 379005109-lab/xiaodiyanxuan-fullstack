const mongoose = require('mongoose');
require('./src/models/Manufacturer');
require('./src/models/Product');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan').then(async () => {
  const Manufacturer = mongoose.model('Manufacturer');
  const Product = mongoose.model('Product');
  
  // ;查
  const gs = await Manufacturer.findOne({ $or: [{ code: /GS202512257516/ }, { name: /各色/ }] }).lean();
  console.log('GeSe:', JSON.stringify(gs ? { _id: gs._id, name: gs.name, code: gs.code } : null));
  
  if (gs) {
    const mid = new mongoose.Types.ObjectId(gs._id);
    const count = await Product.countDocuments({ manufacturerId: mid, status: 'active' });
    console.log('GeSe products:', count);
  }
  
  // 列出所有有商品的厂家
  const mfrIds = await Product.distinct('manufacturerId', { status: 'active' });
  console.log('Manufacturers with products:', mfrIds.length);
  
  for (const mfrId of mfrIds.slice(0, 5)) {
    if (mfrId) {
      const mfr = await Manufacturer.findById(mfrId).select('name code').lean();
      const cnt = await Product.countDocuments({ manufacturerId: mfrId, status: 'active' });
      console.log('-', mfr?.name || mfrId, ':', cnt);
    }
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
