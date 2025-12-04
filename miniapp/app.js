/**
 * 小迪严选 - 小程序入口
 */

const api = require('./api/index')

App({
  globalData: {
    userInfo: null,
    isLogin: false
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.isLogin = true
      this.globalData.userInfo = userInfo
    }
  },

  // 微信登录
  async login() {
    try {
      // 获取微信 code
      const { code } = await wx.login()
      console.log('[Login] code:', code)
      
      // 调用后端登录接口
      const res = await api.auth.wxLogin(code)
      
      // 保存 token
      wx.setStorageSync('token', res.data.token)
      
      // 获取用户信息
      const userRes = await api.auth.getUserInfo()
      wx.setStorageSync('userInfo', userRes.data)
      
      this.globalData.isLogin = true
      this.globalData.userInfo = userRes.data
      
      return res.data
    } catch (err) {
      console.error('[Login Error]', err)
      throw err
    }
  },

  // 退出登录
  logout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    this.globalData.isLogin = false
    this.globalData.userInfo = null
  },

  // 检查是否登录，未登录则跳转登录
  checkLogin() {
    if (!this.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.login()
          }
        }
      })
      return false
    }
    return true
  }
})
