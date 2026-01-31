const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Add backend node_modules to path
module.paths.unshift(path.join(__dirname, '../backend/node_modules'));

const Category = require('../backend/src/models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan';

const categories = [
  {
    name: '沙发和扶手椅',
    slug: 'sofa-armchair',
    order: 1,
    children: [
      { name: '沙发', slug: 'sofa' },
      { name: '沙发床', slug: 'sofa-bed' },
      { name: '扶手椅', slug: 'armchair' },
      { name: '贵妃椅', slug: 'chaise-lounge' },
      { name: '脚凳', slug: 'footstool' },
      { name: '座垫和头枕', slug: 'cushion-headrest' },
      { name: '沙发套和扶手椅套', slug: 'sofa-cover' },
      { name: '沙发和扶手椅支腿', slug: 'sofa-legs' }
    ]
  },
  {
    name: '餐桌和餐椅',
    slug: 'dining-table-chair',
    order: 2,
    children: [
      { name: '凳子', slug: 'stool' },
      { name: '长凳', slug: 'bench' },
      { name: '茶几和边桌', slug: 'coffee-side-table' },
      { name: '餐厅家具', slug: 'dining-furniture' },
      { name: '吧台家具', slug: 'bar-furniture' },
      { name: '咖啡馆家具', slug: 'cafe-furniture' },
      { name: '儿童桌', slug: 'kids-table' },
      { name: '儿童椅', slug: 'kids-chair' },
      { name: '婴儿高脚椅', slug: 'baby-high-chair' },
      { name: '踏脚凳和梯凳', slug: 'step-stool' },
      { name: '梳妆台椅凳', slug: 'vanity-stool' },
      { name: '餐桌', slug: 'dining-table' },
      { name: '餐椅', slug: 'dining-chair' }
    ]
  },
  {
    name: '书桌和书桌椅',
    slug: 'desk-chair',
    order: 3,
    children: [
      { name: '书桌和办公桌', slug: 'desk-office-desk' },
      { name: '书桌椅和办公椅', slug: 'desk-office-chair' },
      { name: '电竞家具', slug: 'gaming-furniture' },
      { name: '会议桌', slug: 'conference-table' },
      { name: '会议椅', slug: 'conference-chair' },
      { name: '书桌椅组合', slug: 'desk-chair-set' },
      { name: '会议桌椅组合', slug: 'conference-set' }
    ]
  },
  {
    name: '储物家具',
    slug: 'storage-furniture',
    order: 4,
    children: [
      { name: '书柜和置物架', slug: 'bookcase-shelf' },
      { name: '衣柜', slug: 'wardrobe' },
      { name: '斗柜和抽屉柜', slug: 'chest-drawer' },
      { name: '餐边柜和展示柜', slug: 'sideboard-display' },
      { name: '电视柜', slug: 'tv-stand' },
      { name: '储物家具系列', slug: 'storage-series' },
      { name: '储藏室', slug: 'pantry' },
      { name: '餐边柜和长几', slug: 'sideboard-console' },
      { name: '户外储物', slug: 'outdoor-storage' },
      { name: '推车', slug: 'cart' },
      { name: '房间隔断', slug: 'room-divider' },
      { name: '门厅家具组合', slug: 'hallway-set' },
      { name: '玩具收纳', slug: 'toy-storage' },
      { name: '文件储物柜', slug: 'file-cabinet' },
      { name: '鞋柜', slug: 'shoe-cabinet' }
    ]
  },
  {
    name: '储物收纳用品',
    slug: 'storage-accessories',
    order: 5,
    children: [
      { name: '储物盒和储物篮', slug: 'storage-box-basket' },
      { name: '文件和多媒体储藏件', slug: 'file-media-storage' },
      { name: '衣物收纳用品', slug: 'clothes-organizer' },
      { name: '垃圾桶和废纸篓', slug: 'trash-bin' },
      { name: '电线整理和配件', slug: 'cable-organizer' },
      { name: '办公桌整理和配件', slug: 'desk-organizer' },
      { name: '挂钩和墙面收纳件', slug: 'hook-wall-storage' },
      { name: '包袋', slug: 'bag' },
      { name: '搬家用品', slug: 'moving-supplies' },
      { name: '浴室清洁和墙面收纳', slug: 'bathroom-storage' },
      { name: '食品储存与收纳', slug: 'food-storage' }
    ]
  },
  {
    name: '床和床垫',
    slug: 'bed-mattress',
    order: 6,
    children: [
      { name: '床', slug: 'bed' },
      { name: '床垫', slug: 'mattress' },
      { name: '床含床垫', slug: 'bed-with-mattress' },
      { name: '床上用品', slug: 'bedding' },
      { name: '床头柜', slug: 'nightstand' },
      { name: '卧室家具组合', slug: 'bedroom-set' },
      { name: '床底收纳', slug: 'under-bed-storage' },
      { name: '床头板', slug: 'headboard' },
      { name: '床板条', slug: 'bed-slats' },
      { name: '床架套', slug: 'bed-frame-cover' }
    ]
  }
];

async function createCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const parentCat of categories) {
      // Check if parent exists
      let parent = await Category.findOne({ slug: parentCat.slug });
      
      if (!parent) {
        parent = await Category.create({
          name: parentCat.name,
          slug: parentCat.slug,
          order: parentCat.order,
          level: 1,
          status: 'active'
        });
        console.log(`✅ Created parent: ${parentCat.name}`);
      } else {
        console.log(`⏭️ Parent exists: ${parentCat.name}`);
      }

      // Create children
      for (const childCat of parentCat.children) {
        // Check by name OR slug under this parent
        const existingChild = await Category.findOne({ 
          $or: [
            { slug: childCat.slug, parentId: parent._id },
            { name: childCat.name, parentId: parent._id },
            { name: childCat.name } // Also check global name uniqueness
          ]
        });
        
        if (!existingChild) {
          try {
            await Category.create({
              name: childCat.name,
              slug: childCat.slug,
              parentId: parent._id,
              level: 2,
              order: 999,
              status: 'active'
            });
            console.log(`  ✅ Created child: ${childCat.name}`);
          } catch (err) {
            if (err.code === 11000) {
              console.log(`  ⚠️ Duplicate, skipping: ${childCat.name}`);
            } else {
              throw err;
            }
          }
        } else {
          // Update parent if needed
          if (!existingChild.parentId || existingChild.parentId.toString() !== parent._id.toString()) {
            await Category.updateOne({ _id: existingChild._id }, { parentId: parent._id, level: 2 });
            console.log(`  🔄 Updated parent for: ${childCat.name}`);
          } else {
            console.log(`  ⏭️ Child exists: ${childCat.name}`);
          }
        }
      }
    }

    console.log('\n✅ All categories created successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createCategories();
