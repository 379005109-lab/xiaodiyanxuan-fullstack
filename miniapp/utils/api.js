// API 请求工具类
const config = require('../config/api.js')

/**
 * 统一的请求方法
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      needAuth = true // 是否需要认证
    } = options

    // 获取 token（如果已登录）
    let token = ''
    if (needAuth) {
      try {
        token = wx.getStorageSync('token') || ''
      } catch (e) {
        console.error('获取 token 失败:', e)
      }
    }

    // 构建完整的 URL
    const fullUrl = url.startsWith('http') ? url : `${config.baseURL}${url}`

    // 设置请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    }

    // 如果有 token，添加到请求头
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`
    }

    if (config.debug) {
      console.log('API Request:', {
        url: fullUrl,
        method,
        data,
        header: requestHeader
      })
    }

    // 发起请求
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: requestHeader,
      timeout: config.timeout,
      success: (res) => {
        if (config.debug) {
          console.log('API Response:', res)
        }

        // 处理响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 如果后端返回的数据格式是 { code: 0, data: ..., message: ... }
          if (res.data && typeof res.data === 'object' && 'code' in res.data) {
            if (res.data.code === 0 || res.data.code === 200) {
              resolve(res.data.data || res.data)
            } else {
              // 业务错误
              const errorMsg = res.data.message || '请求失败'
              wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 2000
              })
              reject(new Error(errorMsg))
            }
          } else {
            // 直接返回数据
            resolve(res.data)
          }
        } else if (res.statusCode === 401) {
          // 未授权，清除 token 并跳转到登录
          wx.removeStorageSync('token')
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          // 可以在这里跳转到登录页面
          reject(new Error('未授权'))
        } else {
          // HTTP 错误
          const errorMsg = `请求失败 (${res.statusCode})`
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        if (config.debug) {
          console.error('API Request Failed:', err)
        }
        wx.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        })
        reject(err)
      }
    })
  })
}

// ==================== 用户相关 API ====================

/**
 * 微信登录
 * @param {String} code 微信登录 code
 */
function wxLogin(code) {
  return request({
    url: '/api/auth/wxlogin',
    method: 'POST',
    data: { code },
    needAuth: false
  })
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'GET'
  })
}

// ==================== 商品相关 API ====================

/**
 * 获取首页数据
 */
function getHomeData() {
  return request({
    url: '/api/home',
    method: 'GET',
    needAuth: false
  })
}

/**
 * 获取商品列表
 * @param {Object} params 查询参数 { page, pageSize, category, style, keyword, sort }
 */
function getGoodsList(params = {}) {
  return request({
    url: '/api/goods/list',
    method: 'GET',
    data: params,
    needAuth: false
  })
}

/**
 * 获取商品详情
 * @param {String} id 商品ID
 */
function getGoodsDetail(id) {
  return request({
    url: `/api/goods/${id}`,
    method: 'GET',
    needAuth: false
  })
}

/**
 * 搜索商品
 * @param {String} keyword 关键词
 * @param {Object} params 其他参数
 */
function searchGoods(keyword, params = {}) {
  return request({
    url: '/api/goods/search',
    method: 'GET',
    data: { keyword, ...params },
    needAuth: false
  })
}

// ==================== 收藏相关 API ====================

/**
 * 获取收藏列表
 */
function getFavorites() {
  return request({
    url: '/api/favorites',
    method: 'GET'
  })
}

/**
 * 添加收藏
 * @param {String} goodsId 商品ID
 */
function addFavorite(goodsId) {
  return request({
    url: '/api/favorites',
    method: 'POST',
    data: { goodsId }
  })
}

/**
 * 取消收藏
 * @param {String} goodsId 商品ID
 */
function removeFavorite(goodsId) {
  return request({
    url: `/api/favorites/${goodsId}`,
    method: 'DELETE'
  })
}

// ==================== 购物车相关 API ====================

/**
 * 获取购物车
 */
function getCart() {
  return request({
    url: '/api/cart',
    method: 'GET'
  })
}

/**
 * 添加到购物车
 * @param {Object} data { goodsId, count, specs }
 */
function addToCart(data) {
  return request({
    url: '/api/cart',
    method: 'POST',
    data
  })
}

/**
 * 更新购物车商品数量
 * @param {String} cartId 购物车项ID
 * @param {Number} count 数量
 */
function updateCartItem(cartId, count) {
  return request({
    url: `/api/cart/${cartId}`,
    method: 'PUT',
    data: { count }
  })
}

/**
 * 删除购物车商品
 * @param {String} cartId 购物车项ID
 */
function removeCartItem(cartId) {
  return request({
    url: `/api/cart/${cartId}`,
    method: 'DELETE'
  })
}

// ==================== 订单相关 API ====================

/**
 * 创建订单
 * @param {Object} orderData 订单数据
 */
function createOrder(orderData) {
  return request({
    url: '/orders',
    method: 'POST',
    data: orderData
  })
}

/**
 * 获取订单列表
 * @param {Object} params { status, page, pageSize }
 */
function getOrders(params = {}) {
  return request({
    url: '/orders',
    method: 'GET',
    data: params
  })
}

/**
 * 获取订单详情
 * @param {String} orderId 订单ID
 */
function getOrderDetail(orderId) {
  return request({
    url: `/orders/${orderId}`,
    method: 'GET'
  })
}

/**
 * 取消订单
 * @param {String} orderId 订单ID
 */
function cancelOrder(orderId, reason) {
  return request({
    url: `/orders/${orderId}/cancel`,
    method: 'POST',
    data: { reason }
  })
}

/**
 * 确认收货
 * @param {String} orderId 订单ID
 */
function confirmOrder(orderId) {
  return request({
    url: `/orders/${orderId}/confirm`,
    method: 'POST'
  })
}

// ==================== 砍价相关 API ====================

/**
 * 获取砍价商品列表
 */
function getBargainGoods() {
  return request({
    url: '/bargains',
    method: 'GET',
    needAuth: false
  })
}

/**
 * 发起砍价
 * @param {String} goodsId 商品ID
 */
function startBargain(productId, productName, originalPrice, targetPrice, coverImage) {
  return request({
    url: '/bargains',
    method: 'POST',
    data: { productId, productName, originalPrice, targetPrice, coverImage }
  })
}

/**
 * 获取我的砍价列表
 */
function getMyBargains() {
  return request({
    url: '/bargains/my',
    method: 'GET'
  })
}

/**
 * 帮好友砍价
 * @param {String} bargainId 砍价活动ID
 */
function helpBargain(bargainId) {
  return request({
    url: `/bargains/${bargainId}/help`,
    method: 'POST'
  })
}

// ==================== 地址相关 API ====================

/**
 * 获取地址列表
 */
function getAddresses() {
  return request({
    url: '/api/addresses',
    method: 'GET'
  })
}

/**
 * 添加地址
 * @param {Object} addressData 地址数据
 */
function addAddress(addressData) {
  return request({
    url: '/api/addresses',
    method: 'POST',
    data: addressData
  })
}

/**
 * 更新地址
 * @param {String} addressId 地址ID
 * @param {Object} addressData 地址数据
 */
function updateAddress(addressId, addressData) {
  return request({
    url: `/api/addresses/${addressId}`,
    method: 'PUT',
    data: addressData
  })
}

/**
 * 删除地址
 * @param {String} addressId 地址ID
 */
function deleteAddress(addressId) {
  return request({
    url: `/api/addresses/${addressId}`,
    method: 'DELETE'
  })
}

// ==================== 优惠券相关 API ====================

/**
 * 获取优惠券列表
 * @param {Object} params { status: 'available' | 'used' | 'expired' }
 */
function getCoupons(params = {}) {
  return request({
    url: '/api/coupons',
    method: 'GET',
    data: params
  })
}

// ==================== 分类相关 API ====================

/**
 * 获取分类列表
 */
function getCategories() {
  return request({
    url: '/api/categories',
    method: 'GET',
    needAuth: false
  })
}

/**
 * 获取风格列表
 */
function getStyles() {
  return request({
    url: '/api/styles',
    method: 'GET',
    needAuth: false
  })
}

// ==================== 套餐相关 API ====================

/**
 * 获取套餐列表
 */
function getPackages() {
  return request({
    url: '/api/packages',
    method: 'GET',
    needAuth: false
  })
}

/**
 * 获取套餐详情
 * @param {String} id 套餐ID
 */
function getPackageDetail(id) {
  return request({
    url: `/api/packages/${id}`,
    method: 'GET',
    needAuth: false
  })
}

module.exports = {
  // 基础方法
  request,
  
  // 用户相关
  wxLogin,
  getUserInfo,
  
  // 商品相关
  getHomeData,
  getGoodsList,
  getGoodsDetail,
  searchGoods,
  
  // 收藏相关
  getFavorites,
  addFavorite,
  removeFavorite,
  
  // 购物车相关
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  
  // 订单相关
  createOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  confirmOrder,
  
  // 砍价相关
  getBargainGoods,
  startBargain,
  getMyBargains,
  helpBargain,
  
  // 地址相关
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  
  // 优惠券相关
  getCoupons,
  
  // 分类相关
  getCategories,
  
  // 风格相关
  getStyles,
  
  // 套餐相关
  getPackages,
  getPackageDetail
}

