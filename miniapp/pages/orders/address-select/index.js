// pages/orders/address-select/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')
const { requireLogin } = require('../../../utils/auth.js')

Page({
  data: {
    addresses: [],
    selectedId: '',
    loading: false
  },

  onLoad(options) {
    if (!requireLogin()) return
    if (options.selectedId) {
      this.setData({ selectedId: options.selectedId })
    }
  },

  onShow() {
    this.loadAddresses()
  },

  loadAddresses() {
    this.setData({ loading: true })
    api.getAddresses().then((data) => {
      const list = data.list || data || []
      this.setData({ addresses: list, loading: false })
      if (!this.data.selectedId && list.length > 0) {
        const def = list.find(a => a.isDefault)
        if (def) this.setData({ selectedId: def._id || def.id })
      }
    }).catch(() => {
      // fallback to local storage
      try {
        const local = wx.getStorageSync('addresses') || []
        this.setData({ addresses: local, loading: false })
      } catch(e) {
        this.setData({ loading: false })
      }
    })
  },

  selectAddress(e) {
    const item = e.currentTarget.dataset.item
    // Store selected address and go back
    try {
      wx.setStorageSync('selectedAddress', item)
    } catch(e) {}
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      prevPage.setData({ selectedAddress: item })
    }
    wx.navigateBack()
  },

  goAddAddress() {
    wx.navigateTo({ url: '/pages/orders/address-edit/index' })
  },

  goBack() {
    wx.navigateBack()
  }
})
