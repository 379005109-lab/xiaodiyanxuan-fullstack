// pages/guide/index.js
Page({
  data: {
    isLoggedIn: false
  },
  
  onLoad() {
    this.checkLogin()
  },
  
  onShow() {
    this.checkLogin()
  },
  
  checkLogin() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      this.setData({ isLoggedIn: !!userInfo })
    } catch (e) {
      this.setData({ isLoggedIn: false })
    }
  },
  
  // 检查登录状态，未登录则提示登录
  ensureLogin(callback) {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '预约陪买服务需要登录，是否前往登录？',
        confirmText: '去登录',
        confirmColor: '#14452F',
        success: (res) => {
          if (res.confirm) {
            wx.getUserProfile({
              desc: '用于完善用户资料',
              success: (userRes) => {
                try {
                  wx.setStorageSync('userInfo', userRes.userInfo)
                  this.setData({ isLoggedIn: true })
                  wx.showToast({ title: '登录成功', icon: 'success' })
                  // 登录成功后执行回调
                  if (callback) callback()
                } catch (e) {}
              },
              fail: () => {
                wx.showToast({ title: '登录取消', icon: 'none' })
              }
            })
          }
        }
      })
      return false
    }
    return true
  },
  
  // 预约基础陪买服务
  bookStandard() {
    if (!this.ensureLogin(() => this.bookStandard())) return
    
    // 跳转到预约页面
    wx.navigateTo({
      url: '/pages/profile/booking/index?type=standard&price=1000'
    })
  },
  
  // 预约专家定制陪买
  bookExpert() {
    if (!this.ensureLogin(() => this.bookExpert())) return
    
    // 跳转到预约页面
    wx.navigateTo({
      url: '/pages/profile/booking/index?type=expert&price=5000'
    })
  },
  
  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '添加客服微信：xiaodi_service',
      confirmText: '复制微信号',
      confirmColor: '#14452F',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'xiaodi_service',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }
})
