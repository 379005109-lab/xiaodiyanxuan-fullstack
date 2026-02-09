// pages/mall/category-list/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    categoryId: '',
    categoryName: '',
    subCategories: [],
    loading: false
  },

  onLoad(options) {
    if (options.id) this.setData({ categoryId: options.id })
    if (options.name) this.setData({ categoryName: options.name })
    this.loadSubCategories()
  },

  loadSubCategories() {
    this.setData({ loading: true })
    api.getCategories().then((data) => {
      const list = data.list || data || []
      const cat = list.find(c => (c._id || c.id) === this.data.categoryId)
      this.setData({
        subCategories: (cat && cat.children) || [],
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  goProductList(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/mall/list/index?category=${this.data.categoryId}&sub=${item.id || item._id}&subName=${item.name}&title=${item.name}`
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
