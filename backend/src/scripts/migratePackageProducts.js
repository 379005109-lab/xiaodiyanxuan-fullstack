/**
 * 数据迁移脚本：将套餐中的商品数据从完整对象转换为只存储ID
 * 
 * 运行方式：
 * node src/scripts/migratePackageProducts.js
 */

const mongoose = require('mongoose')
require('dotenv').config()

const packageSchema = new mongoose.Schema({
  name: String,
  categories: [{
    name: String,
    required: Number,
    products: [mongoose.Schema.Types.Mixed]  // 临时使用Mixed类型
  }]
}, { strict: false })

const Package = mongoose.model('Package', packageSchema)

async function migratePackageProducts() {
  try {
    console.log('🔄 开始迁移套餐商品数据...')
    console.log('📡 连接数据库:', process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan')
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan')
    console.log('✅ 数据库连接成功')
    
    // 查找所有套餐
    const packages = await Package.find({}).lean()
    console.log(`📦 找到 ${packages.length} 个套餐`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const pkg of packages) {
      try {
        let needsUpdate = false
        const updatedCategories = []
        
        if (pkg.categories && Array.isArray(pkg.categories)) {
          for (const category of pkg.categories) {
            const updatedCategory = { ...category }
            
            if (category.products && Array.isArray(category.products)) {
              const productIds = []
              let hasObjects = false
              
              for (const product of category.products) {
                if (typeof product === 'string') {
                  // 已经是ID，直接使用
                  productIds.push(product)
                } else if (product && product._id) {
                  // 完整对象，提取ID
                  productIds.push(product._id.toString())
                  hasObjects = true
                } else if (product && product.id) {
                  // 已转换对象，提取id
                  productIds.push(product.id)
                  hasObjects = true
                } else {
                  console.warn(`⚠️  套餐 ${pkg.name} 中的商品数据格式无效:`, product)
                }
              }
              
              if (hasObjects) {
                needsUpdate = true
                updatedCategory.products = productIds
                console.log(`   ├─ 分类 "${category.name}": ${category.products.length} 个商品 → ${productIds.length} 个ID`)
              }
            }
            
            updatedCategories.push(updatedCategory)
          }
        }
        
        if (needsUpdate) {
          // 更新套餐
          await Package.updateOne(
            { _id: pkg._id },
            { $set: { categories: updatedCategories, updatedAt: new Date() } }
          )
          console.log(`✅ 迁移套餐: ${pkg.name}`)
          migratedCount++
        } else {
          console.log(`⏭️  跳过套餐: ${pkg.name} (已经是正确格式)`)
          skippedCount++
        }
      } catch (error) {
        console.error(`❌ 迁移套餐 ${pkg.name} 失败:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n📊 迁移统计:')
    console.log(`   ✅ 成功迁移: ${migratedCount} 个套餐`)
    console.log(`   ⏭️  已跳过: ${skippedCount} 个套餐`)
    console.log(`   ❌ 失败: ${errorCount} 个套餐`)
    console.log('\n🎉 迁移完成!')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('📡 数据库连接已关闭')
    process.exit(0)
  }
}

// 执行迁移
migratePackageProducts()
