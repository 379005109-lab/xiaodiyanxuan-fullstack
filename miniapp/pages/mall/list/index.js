// pages/mall/list/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    pageTitle: '商品列表',
    categoryId: '',
    subCategoryId: '',
    subCategoryName: '',
    keyword: '',

    // 搜索
    searchText: '',

    // 筛选
    showFilter: false,
    styles: [],
    selectedStyle: '',
    minPrice: '',
    maxPrice: '',
    stockOnly: false,

    // 排序
    sortBy: 'default',

    // 商品列表
    goodsList: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    total: 0
  },

  onLoad(options) {
    if (options.category) {
      this.setData({ categoryId: options.category })
    }
    if (options.sub) {
      this.setData({
        subCategoryId: options.sub,
        subCategoryName: options.subName || ''
      })
    }
    if (options.keyword) {
      this.setData({
        keyword: options.keyword,
        searchText: options.keyword,
        pageTitle: `搜索: ${options.keyword}`
      })
    }
    if (options.title) {
      this.setData({ pageTitle: options.title })
    }

    this.loadStyles()
    this.loadGoods(true)
  },

  // ==================== 数据加载 ====================

  loadStyles() {
    api.getStyles().then((data) => {
      const list = (data.list || data || []).map(s => ({
        id: s._id || s.id || s.name,
        name: s.name
      }))
      this.setData({ styles: list })
    }).catch(() => {})
  },

  loadGoods(reset = false) {
    if (this.data.loading) return Promise.resolve()

    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })

    const params = {
      page,
      pageSize: this.data.pageSize
    }

    if (this.data.categoryId) params.category = this.data.categoryId
    if (this.data.subCategoryId) params.subCategory = this.data.subCategoryId
    if (this.data.selectedStyle) params.style = this.data.selectedStyle
    if (this.data.keyword || this.data.searchText) {
      params.keyword = this.data.keyword || this.data.searchText
    }

    if (this.data.sortBy === 'sales') {
      params.sort = 'sales'
    } else if (this.data.sortBy === 'price-asc') {
      params.sort = 'price'
      params.order = 'asc'
    } else if (this.data.sortBy === 'price-desc') {
      params.sort = 'price'
      params.order = 'desc'
    }

    if (this.data.minPrice) params.minPrice = Number(this.data.minPrice)
    if (this.data.maxPrice) params.maxPrice = Number(this.data.maxPrice)
    if (this.data.stockOnly) params.inStock = true

    return api.getGoodsList(params).then((data) => {
      const list = data.list || data || []
      const total = data.total || list.length
      this.setData({
        goodsList: reset ? list : [...this.data.goodsList, ...list],
        page: page + 1,
        hasMore: (reset ? list.length : this.data.goodsList.length + list.length) < total,
        total,
        loading: false
      })
    }).catch((err) => {
      console.error('加载商品列表失败:', err)
      this.setData({ loading: false })
    })
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadGoods(false)
    }
  },

  // ==================== 搜索 ====================

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
  },

  onSearchConfirm() {
    this.setData({ keyword: this.data.searchText })
    this.loadGoods(true)
  },

  clearSubCategory() {
    this.setData({ subCategoryId: '', subCategoryName: '' })
    this.loadGoods(true)
  },

  // ==================== 排序 ====================

  togglePrice() {
    const { sortBy } = this.data
    let next = 'price-asc'
    if (sortBy === 'price-asc') next = 'price-desc'
    else if (sortBy === 'price-desc') next = 'default'
    this.setData({ sortBy: next })
    this.loadGoods(true)
  },

  setSortSales() {
    this.setData({ sortBy: this.data.sortBy === 'sales' ? 'default' : 'sales' })
    this.loadGoods(true)
  },

  toggleStockOnly() {
    this.setData({ stockOnly: !this.data.stockOnly })
    this.loadGoods(true)
  },

  // ==================== 筛选面板 ====================

  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  onSelectStyle(e) {
    const name = e.currentTarget.dataset.name
    this.setData({
      selectedStyle: this.data.selectedStyle === name ? '' : name
    })
  },

  onMinPriceInput(e) {
    this.setData({ minPrice: e.detail.value })
  },

  onMaxPriceInput(e) {
    this.setData({ maxPrice: e.detail.value })
  },

  resetFilter() {
    this.setData({
      selectedStyle: '',
      minPrice: '',
      maxPrice: '',
      stockOnly: false
    })
  },

  applyFilter() {
    this.setData({ showFilter: false })
    this.loadGoods(true)
  },

  // ==================== 导航 ====================

  goBack() {
    wx.navigateBack({ delta: 1 }).catch(() => {
      wx.switchTab({ url: '/pages/mall/index' })
    })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
  },

  addToCart(e) {
    const item = e.currentTarget.dataset.item
    wx.showToast({ title: '已加入购物车', icon: 'success' })
  }
})
