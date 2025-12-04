/**
 * API 接口统一管理
 */

const { get, post, put, del } = require('../utils/request')

// ========== 用户认证 ==========
const auth = {
  // 微信登录
  wxLogin: (code) => post('/auth/wxlogin', { code }),
  
  // 获取用户信息
  getUserInfo: () => get('/user/info')
}

// ========== 首页 ==========
const home = {
  // 获取首页数据
  getData: () => get('/home')
}

// ========== 商品 ==========
const goods = {
  // 获取商品列表
  getList: (params) => get('/goods/list', params),
  
  // 获取商品详情
  getDetail: (id) => get(`/goods/${id}`),
  
  // 搜索商品
  search: (keyword, page = 1, pageSize = 10) => 
    get('/goods/search', { keyword, page, pageSize })
}

// ========== 购物车 ==========
const cart = {
  // 获取购物车
  getList: () => get('/cart'),
  
  // 添加到购物车
  add: (data) => post('/cart', data),
  
  // 更新购物车
  update: (cartId, count) => put(`/cart/${cartId}`, { count }),
  
  // 删除购物车商品
  remove: (cartId) => del(`/cart/${cartId}`)
}

// ========== 订单 ==========
const order = {
  // 创建订单
  create: (data) => post('/orders', data),
  
  // 获取订单列表
  getList: (params) => get('/orders', params),
  
  // 获取订单详情
  getDetail: (orderId) => get(`/orders/${orderId}`),
  
  // 取消订单
  cancel: (orderId, reason) => post(`/orders/${orderId}/cancel`, { reason }),
  
  // 确认收货
  confirm: (orderId) => post(`/orders/${orderId}/confirm`)
}

// ========== 收藏 ==========
const favorite = {
  // 获取收藏列表
  getList: () => get('/favorites'),
  
  // 添加收藏
  add: (goodsId) => post('/favorites', { goodsId }),
  
  // 取消收藏
  remove: (goodsId) => del(`/favorites/${goodsId}`)
}

// ========== 地址 ==========
const address = {
  // 获取地址列表
  getList: () => get('/addresses'),
  
  // 添加地址
  add: (data) => post('/addresses', data),
  
  // 更新地址
  update: (addressId, data) => put(`/addresses/${addressId}`, data),
  
  // 删除地址
  remove: (addressId) => del(`/addresses/${addressId}`)
}

module.exports = {
  auth,
  home,
  goods,
  cart,
  order,
  favorite,
  address
}
