/**
 * 微信小程序专用接口
 * 对接文档参考: frontend/duijie/后端对接文档.md
 */

const express = require('express')
const router = express.Router()
const axios = require('axios')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Category = require('../models/Category')
const Material = require('../models/Material')
const Package = require('../models/Package')
const Style = require('../models/Style')
const Banner = require('../models/Banner')
const { auth } = require('../middleware/auth')
const { sendNewOrderNotification } = require('../services/emailService')

// 微信小程序配置
const WX_APPID = process.env.WX_APPID || ''
const WX_SECRET = process.env.WX_SECRET || ''
const JWT_SECRET = process.env.JWT_SECRET || 'xiaodi-jwt-secret'
const API_BASE_URL = process.env.API_BASE_URL || 'https://xiaodiyanxuan.com'

// ========== 响应格式适配 ==========
const success = (data, message = 'success') => ({ code: 0, data, message })
const error = (code, message) => ({ code, message })

// ========== 共享函数：从SKU构建材质分组 ==========
const buildMaterialsFromSkus = async (skus, getImageUrl) => {
  if (!skus || skus.length === 0) return []
  
  // 收集所有材质名称
  const allMaterialNames = new Set()
  skus.forEach(sku => {
    if (sku.material && typeof sku.material === 'object') {
      Object.values(sku.material).forEach(materials => {
        if (Array.isArray(materials)) {
          materials.forEach(name => allMaterialNames.add(name))
        }
      })
    }
  })
  
  if (allMaterialNames.size === 0) return []
  
  // 查询材质图片
  const materialImages = {}
  try {
    const materials = await Material.find({
      name: { $in: Array.from(allMaterialNames) },
      status: 'approved'
    }).select('name image').lean()
    
    materials.forEach(m => {
      if (m.image) {
        materialImages[m.name] = getImageUrl(m.image)
      }
    })
  } catch (e) {
    console.log('查询材质图片失败:', e.message)
  }
  
  // 为第一个SKU构建材质分组
  const sku = skus[0]
  const materialCategoryMap = new Map()
  
  if (sku.material && typeof sku.material === 'object') {
    Object.entries(sku.material).forEach(([categoryType, materials]) => {
      if (!materialCategoryMap.has(categoryType)) {
        materialCategoryMap.set(categoryType, new Map())
      }
      const subCategoryMap = materialCategoryMap.get(categoryType)
      
      if (Array.isArray(materials)) {
        materials.forEach(fullName => {
          const lastDashIndex = fullName.lastIndexOf('-')
          let subCategory = fullName
          let colorName = fullName
          
          if (lastDashIndex > 0) {
            subCategory = fullName.substring(0, lastDashIndex)
            colorName = fullName.substring(lastDashIndex + 1)
          }
          
          if (!subCategoryMap.has(subCategory)) {
            subCategoryMap.set(subCategory, new Set())
          }
          subCategoryMap.get(subCategory).add({ fullName, colorName })
        })
      }
    })
  }
  
  const materialsGroups = []
  let groupIndex = 0
  materialCategoryMap.forEach((subCategoryMap, categoryType) => {
    const colors = []
    subCategoryMap.forEach((colorSet, subCategoryName) => {
      Array.from(colorSet).forEach((item, i) => {
        colors.push({
          id: `color_${groupIndex}_${i}`,
          name: item.colorName,
          fullName: item.fullName,
          img: materialImages[item.fullName] || ''
        })
      })
    })
    
    if (colors.length > 0) {
      materialsGroups.push({
        id: `material_${groupIndex}`,
        name: categoryType,
        colors: colors
      })
      groupIndex++
    }
  })
  
  return materialsGroups
}

// 图片URL处理
const getImageUrl = (img) => {
  if (!img) return ''
  if (img.startsWith('http')) return img
  return `${API_BASE_URL}/api/files/${img}`
}

// ========== 1. 微信登录 ==========
router.post('/auth/wxlogin', async (req, res) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.status(400).json(error(400, '缺少code参数'))
    }

    if (!WX_APPID || !WX_SECRET) {
      return res.status(500).json(error(500, '小程序配置未设置'))
    }

    // 调用微信 code2Session 接口
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: WX_APPID,
        secret: WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    const { openid, session_key, unionid, errcode, errmsg } = wxRes.data

    if (errcode) {
      console.error('微信登录失败:', errcode, errmsg)
      return res.status(400).json(error(errcode, errmsg || '微信登录失败'))
    }

    // 查找或创建用户
    let user = await User.findOne({ openId: openid })
    let isNew = false

    if (!user) {
      isNew = true
      user = await User.create({
        openId: openid,
        unionId: unionid,
        userType: 'customer',
        role: 'customer',
        nickname: '微信用户',
        status: 'active',
        createdAt: new Date()
      })
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user._id, openid },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json(success({
      token,
      userId: user._id,
      isNew
    }))

  } catch (err) {
    console.error('微信登录错误:', err)
    res.status(500).json(error(500, '登录失败'))
  }
})

// ========== 2. 获取用户信息 ==========
router.get('/user/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      return res.status(404).json(error(404, '用户不存在'))
    }
    res.json(success(user))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 3. 风格列表 ==========
router.get('/styles', async (req, res) => {
  try {
    const styles = await Style.find({ status: 'active' })
      .sort({ order: 1 })
      .lean()

    const list = styles.map(s => ({
      id: s._id,
      name: s.name,
      image: getImageUrl(s.image)
    }))

    res.json(success(list))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 4. 分类列表 ==========
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active', level: 1 })
      .sort({ order: 1 })
      .lean()

    const list = categories.map(c => ({
      id: c._id,
      name: c.name,
      image: getImageUrl(c.image),
      children: (c.children || []).map(child => ({
        id: child._id,
        name: child.name,
        image: getImageUrl(child.image)
      }))
    }))

    res.json(success(list))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 4. 首页数据 ==========
router.get('/home', async (req, res) => {
  try {
    // 获取小程序首页轮播图 (HERO 图)
    const now = new Date()
    const banners = await Banner.find({
      platform: { $in: ['miniapp', 'all'] },
      type: 'hero',
      status: 'active',
      $or: [
        { startTime: null, endTime: null },
        { startTime: { $lte: now }, endTime: { $gte: now } },
        { startTime: { $lte: now }, endTime: null },
        { startTime: null, endTime: { $gte: now } }
      ]
    }).sort({ order: 1 }).lean()

    const bannerList = banners.map(b => ({
      id: b._id,
      image: getImageUrl(b.image),
      link: b.link || ''
    }))

    // 获取陪买服务图
    const serviceBanners = await Banner.find({
      platform: { $in: ['miniapp', 'all'] },
      type: 'service',
      status: 'active'
    }).sort({ order: 1 }).lean()

    const serviceList = serviceBanners.map(b => ({
      id: b._id,
      name: b.name,
      image: getImageUrl(b.image),
      link: b.link || ''
    }))

    // 获取分类
    const categories = await Category.find({ status: 'active', level: 1 })
      .sort({ order: 1 })
      .limit(8)
      .lean()

    const categoryList = categories.map(c => ({
      id: c._id,
      name: c.name,
      image: getImageUrl(c.image)
    }))

    // 获取本周热门商品（按浏览量排序，取前4个）
    const hotGoods = await Product.find({ status: 'active' })
      .populate('category', 'name')
      .sort({ views: -1 })  // 按浏览量降序
      .limit(4)
      .lean()

    // 转换格式
    const formattedGoods = hotGoods.map(p => {
      const imageUrl = getImageUrl(p.images?.[0])
      return {
        id: p._id,
        name: p.name,
        price: p.basePrice || p.price || 0,
        originalPrice: p.originalPrice || p.basePrice || p.price || 0,
        // 多个图片字段名兼容
        cover: imageUrl,
        image: imageUrl,
        thumb: imageUrl,
        pic: imageUrl,
        views: p.views || 0,
        sales: p.sales || 0,
        category: p.category?.name || '',
        style: Array.isArray(p.styles) ? p.styles[0] : (p.style || '')
      }
    })

    res.json(success({
      banners: bannerList,
      services: serviceList,
      categories: categoryList,
      hotGoods: formattedGoods
    }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 5. 商品列表 ==========
router.get('/goods/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, style, sort } = req.query
    
    const query = { status: 'active' }
    if (category) query.category = category  // 使用分类ID筛选
    if (style) query.styles = style

    let sortOption = { createdAt: -1 }
    if (sort === 'price_asc') sortOption = { basePrice: 1 }
    if (sort === 'price_desc') sortOption = { basePrice: -1 }
    if (sort === 'sales') sortOption = { sales: -1 }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()

    const list = products.map(p => {
      const imageUrl = getImageUrl(p.images?.[0])
      return {
        id: p._id,
        name: p.name,
        price: p.basePrice || p.price || 0,
        originalPrice: p.originalPrice || p.basePrice || p.price || 0,
        // 多个图片字段名兼容不同小程序前端
        cover: imageUrl,
        image: imageUrl,
        thumb: imageUrl,
        pic: imageUrl,
        sales: p.sales || 0,
        category: p.category?.name || '',
        style: Array.isArray(p.styles) ? p.styles[0] : (p.style || '')
      }
    })

    res.json(success({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 6. 商品详情 ==========
router.get('/goods/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .lean()
    if (!product) {
      return res.status(404).json(error(404, '商品不存在'))
    }

    // 先收集所有材质名称用于查询图片
    const allMaterialNames = new Set()
    if (product.skus) {
      product.skus.forEach(sku => {
        if (sku.material && typeof sku.material === 'object') {
          Object.values(sku.material).forEach(materials => {
            if (Array.isArray(materials)) {
              materials.forEach(name => allMaterialNames.add(name))
            }
          })
        }
      })
    }

    // 从数据库查询材质图片
    const materialImages = {}
    if (allMaterialNames.size > 0) {
      try {
        const materials = await Material.find({
          name: { $in: Array.from(allMaterialNames) },
          status: 'approved'
        }).select('name image').lean()
        
        materials.forEach(m => {
          if (m.image) {
            materialImages[m.name] = getImageUrl(m.image)
          }
        })
      } catch (e) {
        console.log('查询材质图片失败:', e.message)
      }
    }

    // 为每个SKU构建其独立的材质分组
    const buildMaterialsForSku = (sku, skuIndex) => {
      const materialCategoryMap = new Map()
      
      if (sku.material && typeof sku.material === 'object') {
        Object.entries(sku.material).forEach(([categoryType, materials]) => {
          if (!materialCategoryMap.has(categoryType)) {
            materialCategoryMap.set(categoryType, new Map())
          }
          const subCategoryMap = materialCategoryMap.get(categoryType)
          
          if (Array.isArray(materials)) {
            materials.forEach(fullName => {
              const lastDashIndex = fullName.lastIndexOf('-')
              let subCategory = fullName
              let colorName = fullName
              
              if (lastDashIndex > 0) {
                subCategory = fullName.substring(0, lastDashIndex)
                colorName = fullName.substring(lastDashIndex + 1)
              }
              
              if (!subCategoryMap.has(subCategory)) {
                subCategoryMap.set(subCategory, new Set())
              }
              subCategoryMap.get(subCategory).add({ fullName, colorName })
            })
          }
        })
      }

      const materialsGroups = []
      let groupIndex = 0
      materialCategoryMap.forEach((subCategoryMap, categoryType) => {
        const subGroups = []
        let subIndex = 0
        
        subCategoryMap.forEach((colorSet, subCategoryName) => {
          const colors = Array.from(colorSet).map((item, i) => ({
            id: `color_${skuIndex}_${groupIndex}_${subIndex}_${i}`,
            name: item.colorName,
            fullName: item.fullName,
            image: materialImages[item.fullName] || ''
          }))
          
          if (colors.length > 0) {
            subGroups.push({
              id: `subgroup_${skuIndex}_${groupIndex}_${subIndex}`,
              name: subCategoryName,
              count: colors.length,
              colors: colors
            })
            subIndex++
          }
        })
        
        if (subGroups.length > 0) {
          materialsGroups.push({
            id: `material_${skuIndex}_${groupIndex}`,
            name: categoryType,
            subGroups: subGroups
          })
          groupIndex++
        }
      })
      
      return materialsGroups
    }

    // 从 skus 提取规格信息，每个规格包含自己的材质
    const sizes = []
    if (product.skus && product.skus.length > 0) {
      product.skus.forEach((sku, index) => {
        const specName = sku.spec || sku.name || `规格${index + 1}`
        let dims = ''
        if (product.specifications && product.specifications[specName]) {
          dims = product.specifications[specName]
        } else if (sku.length && sku.width && sku.height) {
          dims = `${sku.length}x${sku.width}x${sku.height}CM`
        }
        
        sizes.push({
          id: sku._id || `sku_${index}`,
          name: specName,
          dims: dims,
          price: sku.price || product.basePrice || 0,
          extra: (sku.price || 0) - (product.basePrice || 0),
          images: (sku.images || []).map(img => getImageUrl(img)),
          materialsGroups: buildMaterialsForSku(sku, index)  // 每个规格的材质
        })
      })
    }

    // 默认材质分组（第一个规格的材质，或空数组）
    const materialsGroups = sizes.length > 0 && sizes[0].materialsGroups ? sizes[0].materialsGroups : []

    // 转换为小程序需要的格式
    const data = {
      id: product._id,
      name: product.name,
      price: product.basePrice || product.price || 0,
      originalPrice: product.originalPrice || product.basePrice || product.price || 0,
      images: (product.images || []).map(img => getImageUrl(img)),
      description: product.description || '',
      category: product.category?.name || '',
      style: Array.isArray(product.styles) ? product.styles[0] : (product.style || ''),
      sales: product.sales || 0,
      stock: product.stock || 999,
      // 只返回有数据的字段
      sizes: sizes.length > 0 ? sizes : undefined,
      materialsGroups: materialsGroups.length > 0 ? materialsGroups : undefined
    }

    // 内部结构 - 只有有数据时才添加
    // fills, frames, legs 等字段在有数据时才返回
    if (product.fills && product.fills.length > 0) {
      data.fills = product.fills.map((f, i) => ({
        id: `fill_${i}`,
        name: f.name || f,
        image: getImageUrl(f.image)
      }))
    }
    if (product.frames && product.frames.length > 0) {
      data.frames = product.frames.map((f, i) => ({
        id: `frame_${i}`,
        name: f.name || f,
        image: getImageUrl(f.image)
      }))
    }
    if (product.legs && product.legs.length > 0) {
      data.legs = product.legs.map((f, i) => ({
        id: `leg_${i}`,
        name: f.name || f,
        image: getImageUrl(f.image)
      }))
    }

    res.json(success(data))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 6. 搜索商品 ==========
router.get('/goods/search', async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query
    
    if (!keyword) {
      return res.json(success({ list: [], total: 0 }))
    }

    const query = {
      status: 'active',
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ]
    }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()

    const list = products.map(p => {
      const imageUrl = getImageUrl(p.images?.[0])
      return {
        id: p._id,
        name: p.name,
        price: p.basePrice || p.price || 0,
        originalPrice: p.originalPrice || p.basePrice || p.price || 0,
        cover: imageUrl,
        image: imageUrl,
        thumb: imageUrl,
        pic: imageUrl,
        sales: p.sales || 0
      }
    })

    res.json(success({ list, total }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 7. 获取订单列表 ==========
router.get('/orders', auth, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    
    const query = { userId: req.userId }
    if (status) query.status = parseInt(status)

    const total = await Order.countDocuments(query)
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()

    // 状态文本映射
    const statusTextMap = {
      1: '待付款',
      2: '待发货',
      3: '待收货',
      4: '已完成',
      5: '已取消',
      6: '退款中',
      7: '已退款',
      8: '换货中'
    }

    const list = orders.map(o => ({
      id: o._id,
      orderNo: o.orderNo,
      status: o.status,
      statusText: statusTextMap[o.status] || '未知',
      totalPrice: o.totalAmount,
      createTime: o.createdAt,
      goods: (o.items || []).map(item => ({
        id: item.product,
        name: item.productName,
        thumb: getImageUrl(item.image),
        sizeName: item.specifications?.size || '',
        dims: item.skuDimensions || '',
        fabric: item.selectedMaterials?.fabric || '',
        materialColor: item.selectedMaterials?.color || '',
        fill: item.selectedMaterials?.fill || '',
        frame: item.selectedMaterials?.frame || '',
        leg: item.selectedMaterials?.leg || '',
        count: item.quantity
      })),
      receiverName: o.recipient?.name || '',
      receiverPhone: o.recipient?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '',
      receiverAddress: o.recipient?.address || '',
      modified: o.modified || false,
      modifyAccepted: o.modifyAccepted !== false
    }))

    res.json(success({ list, total }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 8. 创建订单 ==========
router.post('/orders', auth, async (req, res) => {
  try {
    const { type = 'normal', goods, totalPrice, receiver, remark } = req.body

    if (!goods || goods.length === 0) {
      return res.status(400).json(error(400, '商品不能为空'))
    }

    if (!receiver || !receiver.name || !receiver.phone || !receiver.address) {
      return res.status(400).json(error(400, '收货信息不完整'))
    }

    // 生成订单号
    const orderNo = 'XD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()

    // 创建订单
    const order = await Order.create({
      orderNo,
      userId: req.userId,
      items: goods.map(g => ({
        product: g.goodsId,
        productName: g.name,
        image: g.thumb,
        price: g.price,
        quantity: g.count || 1,
        specifications: {
          size: g.specs?.size,
        },
        selectedMaterials: {
          fabric: g.specs?.material,
          color: g.specs?.materialColor,
          fill: g.specs?.fill,
          frame: g.specs?.frame,
          leg: g.specs?.leg
        }
      })),
      totalAmount: totalPrice,
      status: 1, // 待付款
      recipient: {
        name: receiver.name,
        phone: receiver.phone,
        address: receiver.address
      },
      remark,
      createdAt: new Date()
    })

    // 发送新订单邮件通知（异步，不阻塞响应）
    sendNewOrderNotification(order).catch(err => {
      console.error('发送订单通知邮件失败:', err)
    })

    res.json(success({
      orderId: order._id,
      orderNo: order.orderNo,
      totalPrice: order.totalAmount,
      status: 1,
      createTime: order.createdAt
    }, '订单创建成功'))

  } catch (err) {
    console.error('创建订单失败:', err)
    res.status(500).json(error(500, '创建订单失败'))
  }
})

// ========== 9. 取消订单 ==========
router.post('/orders/:orderId/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body
    const order = await Order.findOne({ _id: req.params.orderId, user: req.userId })
    
    if (!order) {
      return res.status(404).json(error(404, '订单不存在'))
    }

    if (order.status !== 1) {
      return res.status(400).json(error(400, '只能取消待付款订单'))
    }

    order.status = 5
    order.cancelReason = reason
    order.cancelledAt = new Date()
    await order.save()

    res.json(success(null, '订单已取消'))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 10. 确认收货 ==========
router.post('/orders/:orderId/confirm', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.userId })
    
    if (!order) {
      return res.status(404).json(error(404, '订单不存在'))
    }

    if (order.status !== 3) {
      return res.status(400).json(error(400, '订单状态不正确'))
    }

    order.status = 4
    order.completedAt = new Date()
    await order.save()

    res.json(success(null, '确认收货成功'))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 11. 获取订单详情 ==========
router.get('/orders/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.userId }).lean()
    
    if (!order) {
      return res.status(404).json(error(404, '订单不存在'))
    }

    const statusTextMap = {
      1: '待付款', 2: '待发货', 3: '待收货',
      4: '已完成', 5: '已取消', 6: '退款中',
      7: '已退款', 8: '换货中'
    }

    const data = {
      id: order._id,
      orderNo: order.orderNo,
      status: order.status,
      statusText: statusTextMap[order.status] || '未知',
      totalPrice: order.totalAmount,
      createTime: order.createdAt,
      goods: (order.items || []).map(item => ({
        id: item.product,
        name: item.productName,
        thumb: item.image,
        price: item.price,
        count: item.quantity,
        sizeName: item.specifications?.size || '',
        fabric: item.selectedMaterials?.fabric || ''
      })),
      receiver: order.recipient,
      remark: order.remark
    }

    res.json(success(data))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 套餐列表 ==========
router.get('/packages', async (req, res) => {
  try {
    const packages = await Package.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .lean()

    const list = packages.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description || '',
      cover: getImageUrl(p.thumbnail),
      image: getImageUrl(p.thumbnail),
      thumb: getImageUrl(p.thumbnail),
      images: (p.images || []).map(img => getImageUrl(img)),
      basePrice: p.basePrice || 0,
      discountPrice: p.discountPrice || p.basePrice || 0,
      channelPrice: p.channelPrice || 0,
      designerPrice: p.designerPrice || 0,
      products: p.products || [],
      categories: p.categories || [],
      sales: p.sales || 0
    }))

    res.json(success(list))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 套餐详情 ==========
router.get('/packages/:id', async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id).lean()
    if (!pkg) {
      return res.status(404).json(error(404, '套餐不存在'))
    }

    // 处理 categories 格式（新格式：按类别分组商品）
    let categoriesWithDetail = []
    if (pkg.categories && pkg.categories.length > 0) {
      // 收集所有商品ID
      const allProductIds = []
      pkg.categories.forEach(cat => {
        if (cat.products) {
          cat.products.forEach(p => {
            const pid = typeof p === 'string' ? p : (p.productId || p._id || p.id)
            if (pid) allProductIds.push(pid)
          })
        }
      })
      
      // 批量查询商品
      const products = await Product.find({ _id: { $in: allProductIds } }).lean()
      const productMap = new Map(products.map(p => [p._id.toString(), p]))
      
      // 为每个商品构建材质数据
      const productMaterialsMap = new Map()
      for (const product of products) {
        if (product.skus && product.skus.length > 0) {
          const materialsGroups = await buildMaterialsFromSkus(product.skus, getImageUrl)
          productMaterialsMap.set(product._id.toString(), materialsGroups)
        }
      }
      
      // 填充每个类别的商品详情
      categoriesWithDetail = pkg.categories.map(cat => ({
        name: cat.name || '未分类',
        required: cat.required || 1,
        products: (cat.products || []).map(p => {
          const pid = typeof p === 'string' ? p : (p.productId || p._id || p.id)
          const product = productMap.get(pid?.toString())
          const materialsGroups = productMaterialsMap.get(pid?.toString()) || []
          return {
            id: pid?.toString() || '',
            name: product?.name || p.productName || '商品已下架',
            image: getImageUrl(product?.images?.[0]),
            thumb: getImageUrl(product?.images?.[0]),
            basePrice: product?.basePrice || 0,
            packagePrice: product?.packagePrice || product?.basePrice || 0,
            specs: product?.skus?.[0]?.dimensions || '',
            skus: product?.skus || [],
            materialsGroups: materialsGroups
          }
        })
      }))
    }
    
    // 处理 products 格式（旧格式：商品列表）
    let productsWithDetail = []
    if (pkg.products && pkg.products.length > 0) {
      const productIds = pkg.products.map(p => p.productId)
      const products = await Product.find({ _id: { $in: productIds } }).lean()
      const productMap = new Map(products.map(p => [p._id.toString(), p]))

      productsWithDetail = pkg.products.map(item => {
        const product = productMap.get(item.productId)
        return {
          id: item.productId,
          name: item.productName || product?.name || '',
          price: item.price || product?.basePrice || 0,
          quantity: item.quantity || 1,
          thumb: getImageUrl(product?.images?.[0])
        }
      })
    }

    const data = {
      id: pkg._id,
      name: pkg.name,
      description: pkg.description || '',
      cover: getImageUrl(pkg.thumbnail),
      images: (pkg.images || []).map(img => getImageUrl(img)),
      basePrice: pkg.basePrice || 0,
      discountPrice: pkg.discountPrice || pkg.basePrice || 0,
      channelPrice: pkg.channelPrice || 0,
      designerPrice: pkg.designerPrice || 0,
      products: productsWithDetail,
      categories: categoriesWithDetail,
      sales: pkg.sales || 0
    }

    res.json(success(data))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 砍价相关 - 转发到主路由 ==========
const bargainsRouter = require('./bargains')
router.use('/bargains', bargainsRouter)

module.exports = router
