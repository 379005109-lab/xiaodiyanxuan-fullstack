/**
 * 初始化砍价商品测试数据
 * 运行: node scripts/initBargainProducts.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const BargainProduct = require('../src/models/BargainProduct')

const testProducts = [
  {
    name: '北欧风布艺沙发·莫兰迪灰',
    coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    originalPrice: 3999,
    targetPrice: 2199,
    category: '沙发',
    style: '北欧风',
    minCutAmount: 10,
    maxCutAmount: 100,
    maxHelpers: 20,
    sortOrder: 10
  },
  {
    name: '现代简约真皮沙发·头层牛皮',
    coverImage: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400',
    originalPrice: 5999,
    targetPrice: 3999,
    category: '沙发',
    style: '现代简约',
    minCutAmount: 20,
    maxCutAmount: 150,
    maxHelpers: 25,
    sortOrder: 9
  },
  {
    name: '轻奢电视柜·岩板台面',
    coverImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400',
    originalPrice: 2999,
    targetPrice: 1899,
    category: '柜类',
    style: '轻奢',
    minCutAmount: 10,
    maxCutAmount: 80,
    maxHelpers: 15,
    sortOrder: 8
  },
  {
    name: '实木双人床·胡桃木',
    coverImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
    originalPrice: 4599,
    targetPrice: 2999,
    category: '床具',
    style: '中式',
    minCutAmount: 15,
    maxCutAmount: 120,
    maxHelpers: 20,
    sortOrder: 7
  },
  {
    name: '北欧餐椅四件套·实木框架',
    coverImage: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
    originalPrice: 1599,
    targetPrice: 999,
    category: '餐桌椅',
    style: '北欧风',
    minCutAmount: 5,
    maxCutAmount: 50,
    maxHelpers: 12,
    sortOrder: 6
  },
  {
    name: '意式极简茶几·大理石面',
    coverImage: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400',
    originalPrice: 1899,
    targetPrice: 1199,
    category: '柜类',
    style: '现代简约',
    minCutAmount: 8,
    maxCutAmount: 60,
    maxHelpers: 10,
    sortOrder: 5
  }
]

async function init() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('数据库连接成功')
    
    // 检查是否已有数据
    const count = await BargainProduct.countDocuments()
    if (count > 0) {
      console.log(`已存在 ${count} 个砍价商品，跳过初始化`)
      console.log('如需重新初始化，请先删除现有数据')
      process.exit(0)
    }
    
    // 插入测试数据
    const result = await BargainProduct.insertMany(testProducts)
    console.log(`成功创建 ${result.length} 个砍价商品:`)
    result.forEach(p => console.log(`  - ${p.name}: ¥${p.originalPrice} → ¥${p.targetPrice}`))
    
    process.exit(0)
  } catch (error) {
    console.error('初始化失败:', error)
    process.exit(1)
  }
}

init()
