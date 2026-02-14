const app = getApp()
const api = app.api || require('../../utils/api.js')
const config = require('../../config/api.js')

Page({
  data: {
    statusBarHeight: 0,
    topBarHeight: 0,
    categories: [],
    categoryDataMap: {},
    selectedCategory: 'all',
    currentSpace: null,
    isLoading: true
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    const menuBtn = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = sysInfo.statusBarHeight || 44
    const topBarHeight = menuBtn.bottom + (menuBtn.top - statusBarHeight) + 56
    this.setData({ statusBarHeight, topBarHeight })
    this.loadCategories()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  _fixUrl(url) {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return config.baseURL + url
  },

  loadCategories() {
    this.setData({ isLoading: true })
    api.getCategories().then(list => {
      const fix = this._fixUrl.bind(this)

      // 构建分类数据映射（id -> space对象）
      const dataMap = {}
      // 收集所有子分类用于"全部"
      const allChildren = []

      list.forEach(cat => {
        const children = (cat.children || []).map(c => ({
          id: c.id,
          name: c.name,
          image: fix(c.image)
        }))
        allChildren.push(...children)

        dataMap[cat.id] = {
          name: cat.name,
          description: cat.description || '',
          coverImage: fix(cat.image),
          subCategories: children
        }
      })

      // 虚拟"全部"分类
      dataMap['all'] = {
        name: '全部商品',
        description: '精选全屋家具，打造理想生活空间',
        coverImage: '',
        subCategories: allChildren
      }

      // 左侧分类列表：头部插入"全部"
      const categories = [
        { id: 'all', name: '全部' },
        ...list.map(c => ({ id: c.id, name: c.name }))
      ]

      this.setData({
        categories,
        categoryDataMap: dataMap,
        isLoading: false
      })
      this.updateSpace()
    }).catch(err => {
      console.error('加载分类失败:', err)
      this.setData({ isLoading: false })
    })
  },

  updateSpace() {
    const space = this.data.categoryDataMap[this.data.selectedCategory] || null
    this.setData({ currentSpace: space })
  },

  onSelectCategory(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.selectedCategory) return
    this.setData({ selectedCategory: id, isLoading: true })
    setTimeout(() => {
      this.updateSpace()
      this.setData({ isLoading: false })
    }, 200)
  },

  handleViewAll() {
    const { selectedCategory, currentSpace } = this.data
    const title = (currentSpace && currentSpace.name) || '全部商品'
    wx.navigateTo({ url: '/pages/mall/list/index?category=' + selectedCategory + '&title=' + encodeURIComponent(title) })
  },

  handleSubCategoryClick(e) {
    const subId = e.currentTarget.dataset.id
    const subName = e.currentTarget.dataset.name || ''
    const { selectedCategory } = this.data
    wx.navigateTo({ url: '/pages/mall/list/index?category=' + selectedCategory + '&sub=' + subId + '&subName=' + encodeURIComponent(subName) + '&title=' + encodeURIComponent(subName) })
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/index' })
  },

  onCameraTap() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})
