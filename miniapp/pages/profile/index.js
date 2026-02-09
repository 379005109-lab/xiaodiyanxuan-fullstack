const app = getApp()
const api = app.api || require('../../utils/api.js')

const mockUser = {
  id: '1001',
  avatar: 'https://readdy.ai/api/search-image?query=professional%20asian%20woman%20portrait%20clean%20white%20background%20friendly%20smile%20business%20casual%20style%20soft%20lighting%20high%20quality%20photography&width=200&height=200&seq=user-avatar-001&orientation=squarish',
  nickname: '软装达人',
  phone: '138****8888',
  points: 2580,
  level: 'VIP',
  stats: { orders: 12, favorites: 28, footprints: 156, coupons: 5 }
}

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    isLoggedIn: false,
    showLogoutConfirm: false,
    userInfo: mockUser,
    orderCounts: { unpaid: 2, unshipped: 0, unreceived: 1 },
    cartCount: 3
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    const menuBtn = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = sysInfo.statusBarHeight || 44
    const navBarHeight = menuBtn.bottom + (menuBtn.top - statusBarHeight)
    this.setData({ statusBarHeight, navBarHeight })
    this.loadUserInfo()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
    this.checkLoginAndLoad()
  },

  checkLoginAndLoad() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ isLoggedIn: false, userInfo: mockUser })
      return
    }
    this.setData({ isLoggedIn: true })
    this.loadUserInfo()
  },

  ensureLogin() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/index' })
      return false
    }
    return true
  },

  loadUserInfo() {
    if (api.getUserInfo) {
      api.getUserInfo().then((data) => {
        if (data && data.nickname) {
          this.setData({ userInfo: data })
        }
      }).catch(() => {})
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  goEditProfile() {
    if (!this.ensureLogin()) return
    wx.navigateTo({ url: '/pages/profile/edit/index' })
  },

  goOrders(e) {
    if (!this.ensureLogin()) return
    const tab = e.currentTarget.dataset.tab || 0
    wx.navigateTo({ url: '/pages/profile/orders/index?tab=' + tab })
  },

  goCart() {
    wx.navigateTo({ url: '/pages/profile/cart/index' })
  },

  goFavorites() {
    wx.navigateTo({ url: '/pages/profile/favorites/index' })
  },

  goCoupons() {
    wx.navigateTo({ url: '/pages/profile/coupons/index' })
  },

  goAddress() {
    wx.navigateTo({ url: '/pages/profile/address/index' })
  },

  goInvoice() {
    wx.navigateTo({ url: '/pages/profile/invoice/index' })
  },

  goPoints() {
    wx.navigateTo({ url: '/pages/profile/points/index' })
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/profile/privacy/index' })
  },

  goRecharge() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goAiGenerate() {
    wx.switchTab({ url: '/pages/ai/index' })
  },

  contactService() {
    wx.makePhoneCall({ phoneNumber: '4008888888' }).catch(() => {})
  },

  onLogout() {
    this.setData({ showLogoutConfirm: true })
  },

  closeLogoutConfirm() {
    this.setData({ showLogoutConfirm: false })
  },

  confirmLogout() {
    this.setData({ showLogoutConfirm: false, isLoggedIn: false, userInfo: mockUser })
    wx.clearStorageSync()
    wx.showToast({ title: '已退出登录', icon: 'none' })
  }
})


