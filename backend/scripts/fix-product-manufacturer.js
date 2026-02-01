const mongoose = require('mongoose');
require('dotenv').config();

// 厂家ID映射
const MANUFACTURERS = {
  '安卧时光': '697c7d46f5d24a227f6aa715',
  '柏胜': '69593aab361d49f2ea692fbf',
  '藤宝阁': '695615012b9fa54b2b942e8a',
  '鑫辉': '696dcd735d2b4ee45484496b',
  '恩都': '69550482ecfff5c176ec275d',
  '小迪严选': '6948fca5630729ca224ec425'
};

// 商品编码规则 -> 厂家
const PRODUCT_RULES = [
  // 安卧时光: HB-*, H-81*, AW-*
  { pattern: /^HB-/i, manufacturer: '安卧时光' },
  { pattern: /^H-81/i, manufacturer: '安卧时光' },
  { pattern: /^AW-/i, manufacturer: '安卧时光' },
  
  // 柏胜: BST*
  { pattern: /^BST/i, manufacturer: '柏胜' },
  
  // 藤宝阁: TC*, 2023-*, 2025-*, SF* (2025-SF13等)
  { pattern: /^TC/i, manufacturer: '藤宝阁' },
  { pattern: /^2023-/i, manufacturer: '藤宝阁' },
  { pattern: /^2025-/i, manufacturer: '藤宝阁' },
  
  // 鑫辉: XH-*, 特定名称
  { pattern: /^XH-/i, manufacturer: '鑫辉' },
  { pattern: /^妈妈的怀抱$/i, manufacturer: '鑫辉', matchName: true },
  { pattern: /^毛毛虫沙发$/i, manufacturer: '鑫辉', matchName: true },
  
  // 恩都: x*, y*, X* (单字母+数字)
  { pattern: /^[xy]\d+$/i, manufacturer: '恩都' },
];

async function fixProductManufacturers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('数据库已连接\n');
  
  const Product = require('../src/models/Product');
  const Manufacturer = require('../src/models/Manufacturer');
  
  // 获取所有商品
  const products = await Product.find({}).lean();
  console.log(`总商品数: ${products.length}\n`);
  
  const updates = [];
  const unmatched = [];
  
  for (const product of products) {
    const code = product.productCode || product.name;
    let matched = false;
    
    for (const rule of PRODUCT_RULES) {
      const testValue = rule.matchName ? product.name : code;
      if (rule.pattern.test(testValue)) {
        const newMfgId = MANUFACTURERS[rule.manufacturer];
        const currentMfgId = product.manufacturerId?.toString();
        
        if (currentMfgId !== newMfgId) {
          updates.push({
            _id: product._id,
            code: code,
            name: product.name,
            oldMfg: currentMfgId,
            newMfg: newMfgId,
            newMfgName: rule.manufacturer
          });
        }
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      unmatched.push({ code, name: product.name, currentMfg: product.manufacturerId?.toString() });
    }
  }
  
  console.log(`需要更新: ${updates.length} 个商品`);
  console.log(`未匹配: ${unmatched.length} 个商品\n`);
  
  // 按厂家分组显示
  const byMfg = {};
  updates.forEach(u => {
    if (!byMfg[u.newMfgName]) byMfg[u.newMfgName] = [];
    byMfg[u.newMfgName].push(u.code);
  });
  
  console.log('=== 将要更新的商品 ===');
  for (const [mfgName, codes] of Object.entries(byMfg)) {
    console.log(`\n${mfgName}: ${codes.length} 个商品`);
    console.log(codes.slice(0, 10).join(', ') + (codes.length > 10 ? '...' : ''));
  }
  
  // 显示部分未匹配的商品
  if (unmatched.length > 0) {
    console.log('\n=== 未匹配的商品(前20个) ===');
    unmatched.slice(0, 20).forEach(u => {
      console.log(`${u.code} (${u.name})`);
    });
  }
  
  // 执行更新
  if (process.argv.includes('--execute')) {
    console.log('\n=== 开始执行更新 ===');
    let successCount = 0;
    
    for (const update of updates) {
      try {
        await Product.updateOne(
          { _id: update._id },
          { 
            $set: { 
              manufacturerId: new mongoose.Types.ObjectId(update.newMfg),
              manufacturerName: update.newMfgName
            } 
          }
        );
        successCount++;
      } catch (e) {
        console.error(`更新失败: ${update.code}`, e.message);
      }
    }
    
    console.log(`\n✅ 成功更新 ${successCount} 个商品`);
  } else {
    console.log('\n⚠️ 预览模式 - 使用 --execute 参数执行实际更新');
  }
  
  process.exit(0);
}

fixProductManufacturers().catch(e => {
  console.error(e);
  process.exit(1);
});
