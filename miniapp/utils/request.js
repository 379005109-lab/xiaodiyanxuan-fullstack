/**
 * 网络请求封装
 */

const config = require('../config/api')

/**
 * 发起请求
 * @param {Object} options 请求配置
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    
    wx.request({
      url: config.baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      timeout: config.timeout,
      success: (res) => {
        if (config.debug) {
          console.log('[API]', options.url, res.data)
        }
        
        // 处理业务状态码
        if (res.data.code === 0 || res.data.code === 200) {
          resolve(res.data)
        } else if (res.data.code === 401) {
          // token 过期，清除登录状态
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          reject(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        console.error('[API Error]', options.url, err)
        reject({ code: -1, message: '网络请求失败' })
      }
    })
  })
}

// GET 请求
function get(url, data = {}) {
  return request({ url, method: 'GET', data })
}

// POST 请求
function post(url, data = {}) {
  return request({ url, method: 'POST', data })
}

// PUT 请求
function put(url, data = {}) {
  return request({ url, method: 'PUT', data })
}

// DELETE 请求
function del(url, data = {}) {
  return request({ url, method: 'DELETE', data })
}

module.exports = {
  request,
  get,
  post,
  put,
  del
}
