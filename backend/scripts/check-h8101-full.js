const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const product = await Product.findOne({ productCode: 'AW-01' }).select('name productCode skus materialConfigs').lean();
  
  if (product) {
    console.log('商品:', product.name, '(', product.productCode, ')');
    console.log('materialConfigs:', product.materialConfigs?.length || 0);
    product.skus?.forEach((sku, idx) => {
      console.log(`\nSKU ${idx}:`);
      console.log('  code:', sku.code);
      console.log('  fabricName:', sku.fabricName || '(空)');
      console.log('  fabricMaterialId:', sku.fabricMaterialId || '(空)');
      console.log('  fabricImage:', sku.fabricImage || '(空)');
      console.log('  material:', JSON.stringify(sku.material));
      console.log('  materialCategories:', JSON.stringify(sku.materialCategories));
    });
  } else {
    console.log('未找到商品');
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
