const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
module.paths.unshift(path.join(__dirname, '../backend/node_modules'));

const Category = require('../backend/src/models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan';

// 三级分类结构
const level3Categories = [
  {
    parentName: '沙发',
    children: [
      { name: '电动沙发', slug: 'electric-sofa' },
      { name: '双人沙发', slug: 'two-seater-sofa' },
      { name: '三人沙发', slug: 'three-seater-sofa' },
      { name: '带贵妃椅沙发', slug: 'sofa-with-chaise' },
      { name: '模块沙发', slug: 'modular-sofa' },
      { name: '转角沙发', slug: 'corner-sofa' }
    ]
  },
  {
    parentName: '沙发床',
    children: [
      { name: '双人沙发床', slug: 'double-sofa-bed' },
      { name: '三人沙发床', slug: 'triple-sofa-bed' },
      { name: '单人沙发床', slug: 'single-sofa-bed' },
      { name: '沙发床带贵妃椅', slug: 'sofa-bed-with-chaise' },
      { name: '转角沙发床', slug: 'corner-sofa-bed' },
      { name: '坐卧两用床和客厅用床', slug: 'daybed-living-room' },
      { name: '沙发床床垫', slug: 'sofa-bed-mattress' }
    ]
  },
  {
    parentName: '扶手椅',
    children: [
      { name: '布艺扶手椅', slug: 'fabric-armchair' },
      { name: '皮革扶手椅', slug: 'leather-armchair' },
      { name: '躺椅', slug: 'recliner' },
      { name: '藤椅', slug: 'rattan-chair' },
      { name: '休闲椅', slug: 'lounge-chair' },
      { name: '儿童扶手椅', slug: 'kids-armchair' }
    ]
  },
  {
    parentName: '脚凳',
    children: [
      { name: '布艺脚凳', slug: 'fabric-footstool' },
      { name: '皮革脚凳', slug: 'leather-footstool' },
      { name: '藤脚凳', slug: 'rattan-footstool' },
      { name: '脚凳垫套', slug: 'footstool-cover' }
    ]
  },
  {
    parentName: '床',
    children: [
      { name: '双人床', slug: 'double-bed' },
      { name: '单人床', slug: 'single-bed' },
      { name: '软包床架', slug: 'upholstered-bed' },
      { name: '储物功能床', slug: 'storage-bed' },
      { name: '儿童床', slug: 'kids-bed' },
      { name: '高架床和双层床', slug: 'bunk-loft-bed' }
    ]
  },
  {
    parentName: '餐厅家具',
    children: [
      { name: '餐厅餐桌', slug: 'dining-room-table' },
      { name: '餐厅餐椅', slug: 'dining-room-chair' },
      { name: '餐桌椅组合', slug: 'dining-set' },
      { name: '餐厅凳', slug: 'dining-stool' },
      { name: '餐边柜和长几', slug: 'dining-sideboard' }
    ]
  }
];

async function createLevel3Categories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const group of level3Categories) {
      // Find parent category
      const parent = await Category.findOne({ name: group.parentName });
      
      if (!parent) {
        console.log(`❌ Parent not found: ${group.parentName}`);
        continue;
      }
      
      console.log(`\n📁 Parent: ${group.parentName} (ID: ${parent._id})`);

      for (const child of group.children) {
        const existing = await Category.findOne({ name: child.name });
        
        if (!existing) {
          try {
            await Category.create({
              name: child.name,
              slug: child.slug,
              parentId: parent._id,
              level: 3,
              order: 999,
              status: 'active'
            });
            console.log(`  ✅ Created: ${child.name}`);
          } catch (err) {
            if (err.code === 11000) {
              console.log(`  ⚠️ Duplicate, skipping: ${child.name}`);
            } else {
              throw err;
            }
          }
        } else {
          if (!existing.parentId || existing.parentId.toString() !== parent._id.toString()) {
            await Category.updateOne({ _id: existing._id }, { parentId: parent._id, level: 3 });
            console.log(`  🔄 Updated parent for: ${child.name}`);
          } else {
            console.log(`  ⏭️ Exists: ${child.name}`);
          }
        }
      }
    }

    console.log('\n✅ All level 3 categories created!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createLevel3Categories();
