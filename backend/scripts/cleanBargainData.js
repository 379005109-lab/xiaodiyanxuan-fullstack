/**
 * 清理砍价数据库中的错误数据
 * 运行方式: node scripts/cleanBargainData.js
 */

require('dotenv').config()
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan'

async function cleanBargainData() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✓ 已连接数据库')

    const Bargain = require('../src/models/Bargain')

    // 查找所有砍价记录
    const allBargains = await Bargain.find({}).lean()
    console.log(`\n共找到 ${allBargains.length} 条砍价记录`)

    // 找出有问题的记录（productName包含材质信息或undefined）
    const problematicBargains = allBargains.filter(b => {
      const name = b.productName || ''
      return name.includes('undefined') || 
             name.includes('A类头层') || 
             name.includes('软银') || 
             name.includes('天歌') ||
             name.includes('荔枝纹') ||
             name.length > 50 // 名字太长也可能有问题
    })

    console.log(`\n找到 ${problematicBargains.length} 条有问题的砍价记录:`)
    
    for (const b of problematicBargains) {
      console.log(`\n  ID: ${b._id}`)
      console.log(`  产品名: ${b.productName?.substring(0, 50)}...`)
      console.log(`  状态: ${b.status}`)
      console.log(`  创建时间: ${b.createdAt}`)
    }

    if (problematicBargains.length > 0) {
      console.log('\n开始清理...')
      
      // 删除这些记录
      const result = await Bargain.deleteMany({
        _id: { $in: problematicBargains.map(b => b._id) }
      })
      
      console.log(`✓ 已删除 ${result.deletedCount} 条错误记录`)
    } else {
      console.log('\n没有需要清理的记录')
    }

    // 显示剩余的砍价记录
    const remaining = await Bargain.find({}).lean()
    console.log(`\n剩余 ${remaining.length} 条砍价记录`)
    
    for (const b of remaining) {
      console.log(`  - ${b.productName} (${b.status})`)
    }

    await mongoose.disconnect()
    console.log('\n✓ 数据库连接已关闭')
    
  } catch (error) {
    console.error('清理失败:', error)
    process.exit(1)
  }
}

cleanBargainData()
