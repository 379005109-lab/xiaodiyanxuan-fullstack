const mongoose = require('mongoose');
require('dotenv').config();

async function checkH8101() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const product = await Product.findOne({ 
    $or: [
      { name: { $regex: 'H-8101' } },
      { productCode: 'H-8101' }
    ]
  }).lean();
  
  if (product) {
    console.log('商品名称:', product.name);
    console.log('materialConfigs:', JSON.stringify(product.materialConfigs, null, 2));
    console.log('SKU数量:', product.skus?.length);
    
    product.skus?.forEach((sku, idx) => {
      console.log(`\nSKU ${idx + 1}: ${sku.code || sku.spec}`);
      console.log('  material:', JSON.stringify(sku.material, null, 2));
      console.log('  materialCategories:', JSON.stringify(sku.materialCategories));
      console.log('  fabricName:', sku.fabricName);
      console.log('  fabricMaterialId:', sku.fabricMaterialId);
    });
  } else {
    console.log('未找到H-8101商品');
  }
  
  process.exit(0);
}

checkH8101().catch(e => { console.error(e); process.exit(1); });
