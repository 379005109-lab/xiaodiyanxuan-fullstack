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
const auth = require('../middleware/auth')

// 微信小程序配置
const WX_APPID = process.env.WX_APPID || ''
const WX_SECRET = process.env.WX_SECRET || ''
const JWT_SECRET = process.env.JWT_SECRET || 'xiaodi-jwt-secret'

// ========== 响应格式适配 ==========
const success = (data, message = 'success') => ({ code: 0, data, message })
const error = (code, message) => ({ code, message })

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

// ========== 3. 首页数据 ==========
router.get('/home', async (req, res) => {
  try {
    // 获取热门商品
    const hotGoods = await Product.find({ status: 'active' })
      .sort({ sales: -1 })
      .limit(6)
      .lean()

    // 转换格式
    const formattedGoods = hotGoods.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      cover: p.images?.[0] || '',
      sales: p.sales || 0,
      category: p.category?.name || '',
      style: p.style || ''
    }))

    res.json(success({
      banners: [],
      hotGoods: formattedGoods
    }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 4. 商品列表 ==========
router.get('/goods/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, style, sort } = req.query
    
    const query = { status: 'active' }
    if (category) query['category.name'] = category
    if (style) query.style = style

    let sortOption = { createdAt: -1 }
    if (sort === 'price_asc') sortOption = { price: 1 }
    if (sort === 'price_desc') sortOption = { price: -1 }
    if (sort === 'sales') sortOption = { sales: -1 }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()

    const list = products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      cover: p.images?.[0] || '',
      sales: p.sales || 0,
      category: p.category?.name || '',
      style: p.style || ''
    }))

    res.json(success({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 5. 商品详情 ==========
router.get('/goods/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean()
    if (!product) {
      return res.status(404).json(error(404, '商品不存在'))
    }

    // 转换为小程序需要的格式
    const data = {
      id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      images: product.images || [],
      description: product.description || '',
      category: product.category?.name || '',
      style: product.style || '',
      sales: product.sales || 0,
      stock: product.stock || 999,
      // SKU 规格转换
      sizes: (product.skus || []).map(sku => ({
        id: sku._id || sku.id,
        name: sku.name || sku.spec,
        dims: sku.dimensions || '',
        extra: sku.priceAdjustment || 0
      })),
      // 材质转换
      materialsGroups: (product.materialCategories || []).map(mc => ({
        id: mc._id || mc.id,
        name: mc.name,
        extra: 0,
        colors: (mc.materials || []).map(m => ({
          id: m._id || m.id,
          name: m.name,
          image: m.image || ''
        }))
      })),
      fills: [],
      frames: [],
      legs: []
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

    const list = products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      cover: p.images?.[0] || '',
      sales: p.sales || 0
    }))

    res.json(success({ list, total }))
  } catch (err) {
    res.status(500).json(error(500, err.message))
  }
})

// ========== 7. 获取订单列表 ==========
router.get('/orders', auth, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    
    const query = { user: req.userId }
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
        thumb: item.image,
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
      user: req.userId,
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

module.exports = router
