const mongoose = require('mongoose');
require('dotenv').config();

async function checkDabadun() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = require('../src/models/Product');
  const product = await Product.findOne({ name: { $regex: '大巴顿' } }).lean();
  
  if (product) {
    console.log('商品名称:', product.name);
    console.log('SKU数量:', product.skus?.length);
    
    product.skus?.forEach((sku, idx) => {
      console.log(`\nSKU ${idx + 1}: ${sku.code || sku.spec}`);
      console.log('  material:', JSON.stringify(sku.material, null, 2));
      console.log('  materialCategories:', JSON.stringify(sku.materialCategories));
      console.log('  materialUpgradePrices:', JSON.stringify(sku.materialUpgradePrices));
    });
  } else {
    console.log('未找到大巴顿商品');
  }
  
  process.exit(0);
}

checkDabadun().catch(e => { console.error(e); process.exit(1); });
