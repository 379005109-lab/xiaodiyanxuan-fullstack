const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan';

async function fixEmptySlug() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 查找所有slug为空或null的分类
    const categoriesWithEmptySlug = await Category.find({
      $or: [
        { slug: '' },
        { slug: null },
        { slug: { $exists: false } }
      ]
    });

    console.log(`Found ${categoriesWithEmptySlug.length} categories with empty slug`);

    for (const category of categoriesWithEmptySlug) {
      // 生成新的slug
      let newSlug = category.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '');

      // 如果生成的slug还是空，使用ID
      if (!newSlug) {
        newSlug = `category-${category._id}`;
      }

      // 检查新slug是否已存在
      const existing = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
      if (existing) {
        newSlug = `${newSlug}-${category._id}`;
      }

      // 更新分类
      category.slug = newSlug;
      await category.save();
      console.log(`Updated category "${category.name}" with slug "${newSlug}"`);
    }

    console.log('All categories updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing empty slug:', error);
    process.exit(1);
  }
}

fixEmptySlug();
