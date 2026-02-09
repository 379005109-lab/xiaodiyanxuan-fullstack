// pages/package/config/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    packageId: '',
    packageInfo: {},
    categories: [],
    selectedCount: 0,
    totalPrice: 0,
    canSubmit: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ packageId: options.id })
      this.loadPackageDetail(options.id)
    }
  },

  loadPackageDetail(id) {
    api.getPackageDetail(id).then((data) => {
      const pkg = data.package || data || {}
      const categories = (pkg.categories || []).map(cat => ({
        ...cat,
        products: (cat.products || []).map(p => ({ ...p, selected: false }))
      }))
      this.setData({
        packageInfo: { name: pkg.name, basePrice: pkg.basePrice || pkg.price || 0 },
        categories
      })
    }).catch(err => {
      console.error('加载套餐详情失败:', err)
    })
  },

  toggleProduct(e) {
    const { catidx, prodidx } = e.currentTarget.dataset
    const key = `categories[${catidx}].products[${prodidx}].selected`
    const current = this.data.categories[catidx].products[prodidx].selected
    this.setData({ [key]: !current })
    this.recalculate()
  },

  recalculate() {
    let count = 0
    let price = this.data.packageInfo.basePrice || 0
    this.data.categories.forEach(cat => {
      cat.products.forEach(p => {
        if (p.selected) {
          count++
          price += p.price || 0
        }
      })
    })
    this.setData({
      selectedCount: count,
      totalPrice: price,
      canSubmit: count > 0
    })
  },

  submitConfig() {
    if (!this.data.canSubmit) return
    const selectedItems = []
    this.data.categories.forEach(cat => {
      cat.products.forEach(p => {
        if (p.selected) {
          selectedItems.push({
            id: p._id || p.id,
            name: p.name,
            image: p.thumbnail || (p.images && p.images[0]) || '',
            price: p.price,
            categoryName: cat.name,
            quantity: 1
          })
        }
      })
    })
    try {
      wx.setStorageSync('packageOrderItems', selectedItems)
      wx.setStorageSync('packageOrderInfo', this.data.packageInfo)
    } catch(e) {}
    wx.navigateTo({
      url: `/pages/orders/confirm/index?type=package&packageId=${this.data.packageId}`
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
