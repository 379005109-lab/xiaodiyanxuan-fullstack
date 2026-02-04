const mongoose = require('mongoose');
require('dotenv').config();

async function checkApiResponse() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  
  // 模拟 getProductById 的查询
  const product = await Product.findOne({ 
    $or: [
      { name: { $regex: 'H-8101' } },
      { productCode: 'H-8101' }
    ]
  })
  .select('name productCode skus materialConfigs')
  .lean();
  
  if (product) {
    console.log('商品名称:', product.name);
    console.log('materialConfigs:', product.materialConfigs?.length || 0);
    console.log('\nSKU 详情:');
    product.skus?.forEach((sku, idx) => {
      console.log(`\nSKU ${idx + 1}:`);
      console.log('  code:', sku.code);
      console.log('  material:', JSON.stringify(sku.material));
      console.log('  materialCategories:', JSON.stringify(sku.materialCategories));
      console.log('  fabricName:', sku.fabricName);
    });
  } else {
    console.log('未找到商品');
  }
  
  process.exit(0);
}

checkApiResponse().catch(e => { console.error(e); process.exit(1); });
