const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const product = await Product.findOne({ productCode: 'AW-02' }).select('name productCode skus').lean();
  
  if (product) {
    console.log('商品:', product.name, '(', product.productCode, ')');
    product.skus?.forEach((sku, idx) => {
      console.log(`\nSKU ${idx}:`);
      console.log('  code:', sku.code);
      console.log('  fabricName:', sku.fabricName || '(空)');
      console.log('  fabricMaterialId:', sku.fabricMaterialId || '(空)');
      console.log('  fabricImage:', sku.fabricImage || '(空)');
      console.log('  material:', JSON.stringify(sku.material));
      console.log('  materialCategories:', JSON.stringify(sku.materialCategories));
    });
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
