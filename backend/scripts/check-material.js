const mongoose = require('mongoose');
require('dotenv').config();

async function checkMaterial() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Material = require('../src/models/Material');
  
  // 查找awzp相关材质
  const materials = await Material.find({ 
    name: { $regex: 'awzp', $options: 'i' } 
  }).lean();
  
  console.log('找到材质数:', materials.length);
  
  for (const mat of materials) {
    console.log('\n材质:', mat.name);
    console.log('  _id:', mat._id);
    console.log('  image:', mat.image || '(空)');
    console.log('  img:', mat.img || '(空)');
    console.log('  thumbnail:', mat.thumbnail || '(空)');
    console.log('  images:', JSON.stringify(mat.images?.slice(0, 2)) || '(空)');
  }
  
  process.exit(0);
}

checkMaterial().catch(e => { console.error(e); process.exit(1); });
