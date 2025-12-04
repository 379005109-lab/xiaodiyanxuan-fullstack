/**
 * 我的页面
 */

const api = require('../../api/index')
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLogin: false,
    orderCount: {
      unpaid: 0,
      unshipped: 0,
      shipped: 0
    }
  },

  onShow() {
    this.checkLogin()
  },

  checkLogin() {
    const isLogin = app.globalData.isLogin
    const userInfo = app.globalData.userInfo
    
    this.setData({ isLogin, userInfo })
    
    if (isLogin) {
      this.loadOrderCount()
    }
  },

  // 加载订单数量
  async loadOrderCount() {
    // 可以调用接口获取各状态订单数量
  },

  // 登录
  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      await app.login()
      wx.hideLoading()
      this.checkLogin()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  // 跳转订单列表
  goOrders(e) {
    const { status } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/order/list?status=${status || ''}`
    })
  },

  // 跳转地址管理
  goAddress() {
    wx.navigateTo({
      url: '/pages/address/list'
    })
  },

  // 跳转收藏
  goFavorite() {
    wx.showToast({ title: '开发中...', icon: 'none' })
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '微信：xiaodi-service',
      showCancel: false
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.setData({ isLogin: false, userInfo: null })
        }
      }
    })
  }
})
