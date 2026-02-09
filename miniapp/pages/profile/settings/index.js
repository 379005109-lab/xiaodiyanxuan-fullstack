// pages/profile/settings/index.js
Page({
  data: {
    isLoggedIn: false,
    notifyEnabled: true,
    cacheSize: '0 KB'
  },

  onLoad() {
    const token = wx.getStorageSync('token')
    this.setData({ isLoggedIn: !!token })
    this.calcCacheSize()
  },

  calcCacheSize() {
    try {
      const info = wx.getStorageInfoSync()
      this.setData({ cacheSize: (info.currentSize || 0) + ' KB' })
    } catch(e) {}
  },

  toggleNotify(e) {
    this.setData({ notifyEnabled: e.detail.value })
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/profile/privacy/index' })
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.showToast({ title: '已退出', icon: 'success' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/profile/index' })
          }, 1000)
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
