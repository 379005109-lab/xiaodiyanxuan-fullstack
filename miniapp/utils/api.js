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
      needAuth = true
    } = options

    let token = ''
    if (needAuth) {
      try {
        token = wx.getStorageSync('token') || ''
      } catch (e) {
        console.error('获取 token 失败:', e)
      }
    }

    const fullUrl = url.startsWith('http') ? url : `${config.baseURL}${url}`

    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    }

    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`
    }

    if (config.debug) {
      console.log('API Request:', { url: fullUrl, method, data })
    }

    wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      timeout: config.timeout,
      success: (res) => {
        if (config.debug) {
          console.log('API Response:', res.statusCode, res.data)
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.data && typeof res.data === 'object' && 'code' in res.data) {
            if (res.data.code === 0 || res.data.code === 200) {
              resolve(res.data.data || res.data)
            } else {
              const errorMsg = res.data.message || '请求失败'
              wx.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
              reject(new Error(errorMsg))
            }
          } else if (res.data && res.data.success !== undefined) {
            if (res.data.success) {
              resolve(res.data.data || res.data)
            } else {
              const errorMsg = res.data.message || '请求失败'
              wx.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
              reject(new Error(errorMsg))
            }
          } else {
            resolve(res.data)
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          reject(new Error('未授权'))
        } else {
          const errorMsg = `请求失败 (${res.statusCode})`
          wx.showToast({ title: errorMsg, icon: 'none' })
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        if (config.debug) {
          console.error('API Request Failed:', err)
        }
        wx.showToast({ title: '网络请求失败，请检查网络连接', icon: 'none', duration: 2000 })
        reject(err)
      }
    })
  })
}

// ==================== 辅助：路径前缀 ====================
const MP = config.miniappPrefix   // /api/miniapp
const AP = config.apiPrefix       // /api

// ==================== 用户相关 API ====================

function wxLogin(code) {
  return request({
    url: `${MP}/auth/wxlogin`,
    method: 'POST',
    data: { code },
    needAuth: false
  })
}

function getUserInfo() {
  return request({
    url: `${MP}/user/info`,
    method: 'GET'
  })
}

function updateProfile(data) {
  return request({
    url: `${MP}/user/update`,
    method: 'PUT',
    data
  })
}

function accountLogin(account, password) {
  return request({
    url: `${MP}/auth/login`,
    method: 'POST',
    data: { account, password },
    needAuth: false
  })
}

function sendSmsCode(phone) {
  return request({
    url: `${MP}/auth/send-code`,
    method: 'POST',
    data: { phone },
    needAuth: false
  })
}

function phoneLogin(phone, code) {
  return request({
    url: `${MP}/auth/phone-login`,
    method: 'POST',
    data: { phone, code },
    needAuth: false
  })
}

// ==================== 首页 & 基础数据 API ====================

function getHomeData() {
  return request({
    url: `${MP}/home`,
    method: 'GET',
    needAuth: false
  })
}

function getStyles() {
  return request({
    url: `${MP}/styles`,
    method: 'GET',
    needAuth: false
  })
}

function getCategories() {
  return request({
    url: `${MP}/categories`,
    method: 'GET',
    needAuth: false
  })
}

// ==================== 商品相关 API ====================

function getGoodsList(params = {}) {
  return request({
    url: `${MP}/goods/list`,
    method: 'GET',
    data: params,
    needAuth: false
  })
}

function getGoodsDetail(id) {
  return request({
    url: `${MP}/goods/${id}`,
    method: 'GET',
    needAuth: false
  })
}

function searchGoods(keyword, params = {}) {
  return request({
    url: `${MP}/goods/search`,
    method: 'GET',
    data: { keyword, ...params },
    needAuth: false
  })
}

function getRecommendations(params = {}) {
  return request({
    url: `${MP}/recommendations`,
    method: 'GET',
    data: params,
    needAuth: false
  })
}

// ==================== 收藏相关 API ====================

function getFavorites() {
  return request({ url: `${AP}/favorites`, method: 'GET' })
}

function addFavorite(productId) {
  return request({
    url: `${AP}/favorites`,
    method: 'POST',
    data: { productId }
  })
}

function removeFavorite(id) {
  return request({
    url: `${AP}/favorites/${id}`,
    method: 'DELETE'
  })
}

function checkFavorite(productId) {
  return request({
    url: `${AP}/favorites/check/${productId}`,
    method: 'GET'
  })
}

// ==================== 购物车相关 API ====================

function getCart() {
  return request({ url: `${AP}/cart`, method: 'GET' })
}

function addToCart(data) {
  return request({
    url: `${AP}/cart`,
    method: 'POST',
    data
  })
}

function updateCartItem(cartId, data) {
  return request({
    url: `${AP}/cart/${cartId}`,
    method: 'PUT',
    data
  })
}

function removeCartItem(cartId) {
  return request({
    url: `${AP}/cart/${cartId}`,
    method: 'DELETE'
  })
}

function clearCart() {
  return request({
    url: `${AP}/cart/clear`,
    method: 'DELETE'
  })
}

// ==================== 订单相关 API ====================

function createOrder(orderData) {
  return request({
    url: `${MP}/orders`,
    method: 'POST',
    data: orderData
  })
}

function getOrders(params = {}) {
  return request({
    url: `${MP}/orders`,
    method: 'GET',
    data: params
  })
}

function getOrderDetail(orderId) {
  return request({
    url: `${MP}/orders/${orderId}`,
    method: 'GET'
  })
}

function cancelOrder(orderId, reason) {
  return request({
    url: `${MP}/orders/${orderId}/cancel`,
    method: 'POST',
    data: { reason }
  })
}

function confirmOrder(orderId) {
  return request({
    url: `${MP}/orders/${orderId}/confirm`,
    method: 'POST'
  })
}

// ==================== 套餐相关 API ====================

function getPackages(params = {}) {
  return request({
    url: `${MP}/packages`,
    method: 'GET',
    data: params,
    needAuth: false
  })
}

function getPackageDetail(id) {
  return request({
    url: `${MP}/packages/${id}`,
    method: 'GET',
    needAuth: false
  })
}

// ==================== 砍价相关 API ====================

function getBargainList(params = {}) {
  return request({
    url: `${MP}/bargains`,
    method: 'GET',
    data: params,
    needAuth: false
  })
}

function getBargainDetail(id) {
  return request({
    url: `${MP}/bargains/${id}`,
    method: 'GET',
    needAuth: false
  })
}

function startBargain(data) {
  return request({
    url: `${MP}/bargains`,
    method: 'POST',
    data
  })
}

function getMyBargains() {
  return request({
    url: `${MP}/bargains/my`,
    method: 'GET'
  })
}

function helpBargain(bargainId) {
  return request({
    url: `${MP}/bargains/${bargainId}/help`,
    method: 'POST'
  })
}

function cancelBargain(bargainId) {
  return request({
    url: `${MP}/bargains/${bargainId}`,
    method: 'DELETE'
  })
}

// ==================== 地址相关 API ====================

function getAddresses() {
  return request({ url: `${AP}/addresses`, method: 'GET' })
}

function addAddress(data) {
  return request({
    url: `${AP}/addresses`,
    method: 'POST',
    data
  })
}

function updateAddress(id, data) {
  return request({
    url: `${AP}/addresses/${id}`,
    method: 'PUT',
    data
  })
}

function deleteAddress(id) {
  return request({
    url: `${AP}/addresses/${id}`,
    method: 'DELETE'
  })
}

function setDefaultAddress(id) {
  return request({
    url: `${AP}/addresses/${id}/default`,
    method: 'PUT'
  })
}

// ==================== 优惠券相关 API ====================

function getCoupons(params = {}) {
  return request({
    url: `${AP}/coupons`,
    method: 'GET',
    data: params,
    needAuth: false
  })
}

function claimCoupon(couponId) {
  return request({
    url: `${AP}/coupons/${couponId}/claim`,
    method: 'POST'
  })
}

// ==================== 发票相关 API ====================

function getInvoiceList() {
  return request({ url: `${AP}/invoice-info`, method: 'GET' })
}

function getInvoiceDetail(id) {
  return request({ url: `${AP}/invoice-info/${id}`, method: 'GET' })
}

function addInvoice(data) {
  return request({
    url: `${AP}/invoice-info`,
    method: 'POST',
    data
  })
}

function updateInvoice(id, data) {
  return request({
    url: `${AP}/invoice-info/${id}`,
    method: 'PUT',
    data
  })
}

function deleteInvoice(id) {
  return request({
    url: `${AP}/invoice-info/${id}`,
    method: 'DELETE'
  })
}

// ==================== 预约陪买相关 API ====================

function createBooking(data) {
  return request({
    url: `${AP}/buying-service-requests`,
    method: 'POST',
    data
  })
}

function getMyBookings() {
  return request({
    url: `${AP}/buying-service-requests`,
    method: 'GET'
  })
}

module.exports = {
  request,
  
  // 用户
  wxLogin,
  getUserInfo,
  updateProfile,
  accountLogin,
  sendSmsCode,
  phoneLogin,
  
  // 首页 & 基础数据
  getHomeData,
  getStyles,
  getCategories,
  
  // 商品
  getGoodsList,
  getGoodsDetail,
  searchGoods,
  getRecommendations,
  
  // 收藏
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  
  // 购物车
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  
  // 订单
  createOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  confirmOrder,
  
  // 套餐
  getPackages,
  getPackageDetail,
  
  // 砍价
  getBargainList,
  getBargainDetail,
  startBargain,
  getMyBargains,
  helpBargain,
  cancelBargain,
  
  // 地址
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  
  // 优惠券
  getCoupons,
  claimCoupon,
  
  // 发票
  getInvoiceList,
  getInvoiceDetail,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  
  // 预约陪买
  createBooking,
  getMyBookings
}
