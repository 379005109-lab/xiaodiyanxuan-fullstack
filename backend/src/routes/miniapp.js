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
const bcrypt = require('bcryptjs')
const { auth } = require('../middleware/auth')
const { sendNewOrderNotification } = require('../services/emailService')
const { sendVerificationCode, verifyCode } = require('../services/smsService')

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
  if (!skus || skus.length === 0) {
    console.log('[材质构建] SKU为空')
    return []
  }
  
  // 收集所有材质名称
  const allMaterialNames = new Set()
  skus.forEach(sku => {
    console.log('[材质构建] SKU material类型:', typeof sku.material, sku.material)
    if (sku.material && typeof sku.material === 'object') {
      Object.entries(sku.material).forEach(([key, materials]) => {
        console.log(`[材质构建] 类别 ${key}:`, materials)
        if (Array.isArray(materials)) {
          materials.forEach(name => allMaterialNames.add(name))
        } else if (typeof materials === 'string') {
          // 支持字符串形式的材质
          allMaterialNames.add(materials)
        }
      })
    } else if (typeof sku.material === 'string' && sku.material) {
      // 支持直接字符串材质
      allMaterialNames.add(sku.material)
    }
  })
  
  console.log('[材质构建] 收集到的材质名称:', Array.from(allMaterialNames))
  
  if (allMaterialNames.size === 0) {
    console.log('[材质构建] 没有材质数据')
    return []
  }
  
  // 查询材质图片 - 支持模糊匹配
  const materialImages = {}
  try {
    console.log('[材质] 需要查询的材质名称:', Array.from(allMaterialNames))
    
    // 先尝试精确匹配
    let materials = await Material.find({
      name: { $in: Array.from(allMaterialNames) },
      status: 'approved'
    }).select('name image').lean()
    
    // 如果没找到，尝试用最后一段（颜色名）匹配
    if (materials.length === 0) {
      const colorNames = Array.from(allMaterialNames).map(fullName => {
        const lastDash = fullName.lastIndexOf('-')
        return lastDash > 0 ? fullName.substring(lastDash + 1) : fullName
      })
      console.log('[材质] 尝试用颜色名匹配:', colorNames)
      materials = await Material.find({
        name: { $in: colorNames },
        status: 'approved'
      }).select('name image').lean()
    }
    
    console.log('[材质] 查询到的材质:', materials.length)
    
    materials.forEach(m => {
      if (m.image) {
        materialImages[m.name] = getImageUrl(m.image)
        // 同时用完整名称作为key（方便后续匹配）
        allMaterialNames.forEach(fullName => {
          if (fullName.endsWith(m.name) || fullName === m.name) {
            materialImages[fullName] = getImageUrl(m.image)
          }
        })
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

// ========== 1.1 账号密码登录 ==========
router.post('/auth/login', async (req, res) => {
  try {
    const { account, password } = req.body
    if (!account || !password) {
      return res.status(400).json(error(400, '请输入账号和密码'))
    }

    // 支持用户名或手机号登录
    const user = await User.findOne({
      $or: [{ username: account }, { phone: account }],
      status: 'active'
    })

    if (!user) {
      return res.status(400).json(error(400, '账号或密码错误'))
    }

    if (!user.password) {
      return res.status(400).json(error(400, '该账号未设置密码，请使用其他方式登录'))
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json(error(400, '账号或密码错误'))
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date()
    await user.save()

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json(success({
      token,
      userId: user._id,
      nickname: user.nickname,
      avatar: user.avatar
    }))
  } catch (err) {
    console.error('账号密码登录错误:', err)
    res.status(500).json(error(500, '登录失败'))
  }
})

// ========== 1.2 发送短信验证码 ==========
router.post('/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) {
      return res.status(400).json(error(400, '请输入手机号'))
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json(error(400, '手机号格式不正确'))
    }

    const result = await sendVerificationCode(phone)
    if (result.success) {
      res.json(success(null, '验证码已发送'))
    } else {
      res.status(400).json(error(400, result.message))
    }
  } catch (err) {
    console.error('发送验证码错误:', err)
    res.status(500).json(error(500, '发送失败'))
  }
})

// ========== 1.3 手机号验证码登录 ==========
router.post('/auth/phone-login', async (req, res) => {
  try {
    const { phone, code } = req.body
    if (!phone || !code) {
      return res.status(400).json(error(400, '请输入手机号和验证码'))
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json(error(400, '手机号格式不正确'))
    }

    const isValid = verifyCode(phone, code)
    if (!isValid) {
      return res.status(400).json(error(400, '验证码无效或已过期'))
    }

    // 查找或创建用户
    let user = await User.findOne({ phone, status: 'active' })
    let isNew = false

    if (!user) {
      isNew = true
      user = await User.create({
        phone,
        userType: 'customer',
        role: 'customer',
        nickname: '手机用户',
        status: 'active',
        createdAt: new Date()
      })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json(success({
      token,
      userId: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      isNew
    }))
  } catch (err) {
    console.error('手机号登录错误:', err)
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

// ========== 2.1 更新用户信息 ==========
router.put('/user/update', auth, async (req, res) => {
  try {
    const { nickname, avatar, phone, gender, birthday } = req.body
    const updates = {}
    if (nickname !== undefined) updates.nickname = nickname
    if (avatar !== undefined) updates.avatar = avatar
    if (phone !== undefined) updates.phone = phone
    if (gender !== undefined) updates.gender = gender
    if (birthday !== undefined) updates.birthday = birthday
    updates.updatedAt = new Date()

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password')
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
    let styles = await Style.find({ status: 'active' })
      .sort({ order: 1 })
      .lean()

    // 如果数据库中没有风格数据，创建默认风格
    if (styles.length === 0) {
      console.log('[风格] 数据库为空，创建默认风格数据')
      const defaultStyles = [
        { name: '现代', description: '现代简约风格', order: 1, status: 'active' },
        { name: '北欧', description: '北欧风格', order: 2, status: 'active' },
        { name: '中式', description: '中式风格', order: 3, status: 'active' },
        { name: '美式', description: '美式风格', order: 4, status: 'active' },
        { name: '日式', description: '日式风格', order: 5, status: 'active' },
        { name: '轻奢', description: '轻奢风格', order: 6, status: 'active' },
        { name: '工业', description: '工业风格', order: 7, status: 'active' }
      ]
      styles = await Style.insertMany(defaultStyles)
      console.log('[风格] 已创建默认风格:', styles.length)
    }

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

// ========== 3.5 店铺装修首页配置（公开接口） ==========
router.get('/store-decoration/default', async (req, res) => {
  try {
    const StoreDecoration = require('../models/StoreDecoration')
    const { ownerType, manufacturerId } = req.query
    const query = { isDefault: true, type: 'homepage' }
    if (ownerType) query.ownerType = ownerType
    if (manufacturerId) query.manufacturerId = manufacturerId
    if (!ownerType && !manufacturerId) query.ownerType = 'platform'

    const page = await StoreDecoration.findOne(query).lean()

    if (!page) {
      return res.json(success(null, '暂无默认首页'))
    }

    // 处理 components 中的图片 URL
    if (page.value && page.value.components) {
      page.value.components = page.value.components.map(comp => {
        if (!comp || !comp.config) return comp
        const cfg = comp.config
        // 处理 banner 图片
        if (comp.type === 'banner' && cfg.items) {
          cfg.items = cfg.items.map(item => ({
            ...item,
            image: item.image ? getImageUrl(item.image) : ''
          }))
        }
        // 处理 storeHeader logo
        if (comp.type === 'storeHeader' && cfg.logo) {
          cfg.logo = getImageUrl(cfg.logo)
        }
        // 处理 imageCube 图片
        if (comp.type === 'imageCube' && cfg.images) {
          cfg.images = cfg.images.map(img => ({
            ...img,
            url: img.url ? getImageUrl(img.url) : ''
          }))
        }
        // 处理 video 封面
        if (comp.type === 'video' && cfg.cover) {
          cfg.cover = getImageUrl(cfg.cover)
        }
        // 处理 menuNav 图标
        if (comp.type === 'menuNav' && cfg.items) {
          cfg.items = cfg.items.map(item => ({
            ...item,
            image: item.image ? getImageUrl(item.image) : ''
          }))
        }
        return comp
      })
    }

    // 处理背景图
    if (page.bgImage) page.bgImage = getImageUrl(page.bgImage)

    res.json(success(page))
  } catch (err) {
    console.error('获取装修首页配置失败:', err)
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
      const imageUrl = getImageUrl(p.thumbnail || p.images?.[0])
      return {
        _id: p._id,
        id: p._id,
        name: p.name,
        price: p.basePrice || p.price || 0,
        originalPrice: p.originalPrice || p.basePrice || p.price || 0,
        description: p.description || '',
        thumbnail: getImageUrl(p.thumbnail) || imageUrl,
        // 多个图片字段名兼容
        cover: imageUrl,
        image: imageUrl,
        thumb: imageUrl,
        pic: imageUrl,
        images: (p.images || []).map(img => getImageUrl(img)),
        views: p.views || 0,
        sales: p.sales || 0,
        sold: p.sales || 0,
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

// ========== 6.5 获取推荐商品（关联推荐） ==========
router.get('/recommendations', async (req, res) => {
  try {
    const { productId, categoryId, categoryName, limit = 6 } = req.query
    
    // 定义关联推荐规则
    const recommendationRules = {
      '沙发': ['茶几', '电视柜', '地毯', '落地灯'],
      '床': ['床头柜', '衣柜', '床垫', '台灯'],
      '餐桌': ['餐椅', '餐边柜', '吊灯'],
      '茶几': ['沙发', '地毯', '落地灯'],
      '衣柜': ['床', '梳妆台', '穿衣镜'],
      '书桌': ['书柜', '办公椅', '台灯'],
      '电视柜': ['沙发', '茶几', '落地灯']
    }
    
    let recommendedProducts = []
    
    // 获取当前商品的分类信息
    let currentCategoryName = categoryName
    if (!currentCategoryName && productId) {
      const currentProduct = await Product.findById(productId).populate('category').lean()
      currentCategoryName = currentProduct?.category?.name || ''
    }
    if (!currentCategoryName && categoryId) {
      const category = await Category.findById(categoryId).lean()
      currentCategoryName = category?.name || ''
    }
    
    console.log('[推荐] 当前分类:', currentCategoryName)
    
    // 根据分类名称查找关联分类
    let relatedCategoryNames = []
    for (const [key, values] of Object.entries(recommendationRules)) {
      if (currentCategoryName && currentCategoryName.includes(key)) {
        relatedCategoryNames = values
        break
      }
    }
    
    console.log('[推荐] 关联分类:', relatedCategoryNames)
    
    if (relatedCategoryNames.length > 0) {
      // 查找关联分类的ID
      const relatedCategories = await Category.find({
        status: 'active',
        name: { $in: relatedCategoryNames.map(n => new RegExp(n, 'i')) }
      }).select('_id name').lean()
      
      console.log('[推荐] 找到关联分类:', relatedCategories.map(c => c.name))
      
      if (relatedCategories.length > 0) {
        // 从关联分类中获取商品
        recommendedProducts = await Product.find({
          status: 'active',
          category: { $in: relatedCategories.map(c => c._id) },
          _id: { $ne: productId } // 排除当前商品
        })
        .sort({ sales: -1 })
        .limit(parseInt(limit))
        .lean()
      }
    }
    
    // 如果关联推荐不足，用热门商品补充
    if (recommendedProducts.length < limit) {
      const existingIds = recommendedProducts.map(p => p._id.toString())
      if (productId) existingIds.push(productId)
      
      const hotProducts = await Product.find({
        status: 'active',
        _id: { $nin: existingIds }
      })
      .sort({ sales: -1, views: -1 })
      .limit(parseInt(limit) - recommendedProducts.length)
      .lean()
      
      recommendedProducts = [...recommendedProducts, ...hotProducts]
    }
    
    // 格式化输出
    const list = recommendedProducts.map(p => ({
      id: p._id,
      name: p.name,
      price: p.basePrice || p.price || 0,
      originalPrice: p.originalPrice || p.basePrice || 0,
      thumb: getImageUrl(p.images?.[0]),
      cover: getImageUrl(p.images?.[0]),
      sales: p.sales || 0,
      categoryName: ''
    }))
    
    console.log('[推荐] 返回商品数量:', list.length)
    res.json(success(list))
  } catch (err) {
    console.error('[推荐] 获取失败:', err)
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

    // 收集所有商品ID，用于补充缺失的商品名称
    const productIds = new Set()
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (item.product && !item.productName) {
          productIds.add(item.product.toString())
        }
      })
    })
    
    // 查询缺失的商品信息
    const productMap = new Map()
    if (productIds.size > 0) {
      const products = await Product.find({ _id: { $in: Array.from(productIds) } })
        .select('name images basePrice')
        .lean()
      products.forEach(p => {
        productMap.set(p._id.toString(), p)
      })
    }

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

    const list = orders.map(o => {
      // 计算订单总价（如果没有保存的话）
      let orderTotal = o.totalAmount
      if (!orderTotal || orderTotal === 0) {
        orderTotal = (o.items || []).reduce((sum, item) => {
          const product = productMap.get(item.product?.toString())
          const price = item.price || product?.basePrice || 0
          return sum + (price * (item.quantity || 1))
        }, 0)
      }
      
      return {
        id: o._id,
        orderNo: o.orderNo,
        status: o.status,
        statusText: statusTextMap[o.status] || '未知',
        totalPrice: orderTotal,
        createTime: o.createdAt,
        goods: (o.items || []).map(item => {
          // 补充缺失的商品信息
          const product = productMap.get(item.product?.toString())
          return {
            id: item.product,
            name: item.productName || product?.name || '商品',
            thumb: getImageUrl(item.image || product?.images?.[0]),
            sizeName: item.specifications?.size || '',
            dims: item.skuDimensions || '',
            fabric: item.selectedMaterials?.fabric || '',
            materialColor: item.selectedMaterials?.color || '',
            fill: item.selectedMaterials?.fill || '',
            frame: item.selectedMaterials?.frame || '',
            leg: item.selectedMaterials?.leg || '',
            count: item.quantity || 1
          }
        }),
        receiverName: o.recipient?.name || '',
        receiverPhone: o.recipient?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '',
        receiverAddress: o.recipient?.address || '',
        modified: o.modified || false,
        modifyAccepted: o.modifyAccepted !== false
      }
    })

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
      const productMaterialImagesMap = new Map()
      for (const product of products) {
        console.log(`[套餐] 商品 ${product.name} SKU数量:`, product.skus?.length || 0)
        
        // 优先使用商品本身的 materialsGroups
        if (product.materialsGroups && product.materialsGroups.length > 0) {
          console.log(`[套餐] 商品 ${product.name} 使用商品自带材质分组:`, product.materialsGroups.length)
          const groups = product.materialsGroups.map((mg, idx) => ({
            id: `material_${idx}`,
            name: mg.name,
            colors: (mg.colors || []).map((c, ci) => ({
              id: `color_${idx}_${ci}`,
              name: c.name,
              fullName: c.name,
              img: getImageUrl(c.img || mg.img || '')
            }))
          }))
          productMaterialsMap.set(product._id.toString(), groups)
        } else if (product.skus && product.skus.length > 0) {
          // 否则从 SKU 构建
          console.log(`[套餐] 商品 ${product.name} 第一个SKU材质:`, product.skus[0].material)
          const materialsGroups = await buildMaterialsFromSkus(product.skus, getImageUrl)
          console.log(`[套餐] 商品 ${product.name} 构建的材质分组:`, materialsGroups.length)
          productMaterialsMap.set(product._id.toString(), materialsGroups)
        }
        
        // 同时保留 materialImages 数据（前端可能需要）
        if (product.materialImages) {
          productMaterialImagesMap.set(product._id.toString(), product.materialImages)
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
          const materialImages = productMaterialImagesMap.get(pid?.toString()) || product?.materialImages || null
          return {
            id: pid?.toString() || '',
            name: product?.name || p.productName || '商品已下架',
            image: getImageUrl(product?.images?.[0]),
            thumb: getImageUrl(product?.images?.[0]),
            basePrice: product?.basePrice || 0,
            packagePrice: product?.packagePrice || product?.basePrice || 0,
            specs: product?.skus?.[0]?.dimensions || '',
            skus: product?.skus || [],
            materialsGroups: materialsGroups,
            materialImages: materialImages,
            materialCategories: product?.materialCategories || []
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
