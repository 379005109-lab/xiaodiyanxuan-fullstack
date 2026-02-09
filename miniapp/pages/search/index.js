// pages/search/index.js
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
  data: {
    keyword: '',
    history: [],
    hotWords: ['沙发', '餐桌', '床', '衣柜', '书桌', '茶几', '电视柜', '鞋柜'],
    isSearching: false,
    searched: false,
    loading: false,
    resultList: [],
    total: 0,
    page: 1,
    pageSize: 20,
    hasMore: false
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: options.keyword })
      this.doSearch()
    }
    this.loadHistory()
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || []
      this.setData({ history })
    } catch(e) {}
  },

  saveHistory(keyword) {
    if (!keyword) return
    try {
      let history = wx.getStorageSync('searchHistory') || []
      history = history.filter(h => h !== keyword)
      history.unshift(keyword)
      if (history.length > 20) history = history.slice(0, 20)
      wx.setStorageSync('searchHistory', history)
      this.setData({ history })
    } catch(e) {}
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
    if (!e.detail.value) {
      this.setData({ isSearching: false, searched: false, resultList: [] })
    }
  },

  clearKeyword() {
    this.setData({ keyword: '', isSearching: false, searched: false, resultList: [] })
  },

  doSearch() {
    const keyword = this.data.keyword.trim()
    if (!keyword) return wx.showToast({ title: '请输入搜索内容', icon: 'none' })

    this.saveHistory(keyword)
    this.setData({ isSearching: true, page: 1, resultList: [] })
    this.searchGoods(true)
  },

  tapHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ keyword })
    this.doSearch()
  },

  clearHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定要清空所有搜索记录吗？',
      success: (res) => {
        if (res.confirm) {
          try { wx.removeStorageSync('searchHistory') } catch(e) {}
          this.setData({ history: [] })
        }
      }
    })
  },

  searchGoods(reset) {
    if (this.data.loading) return
    this.setData({ loading: true })

    const page = reset ? 1 : this.data.page
    api.searchGoods(this.data.keyword, {
      page,
      pageSize: this.data.pageSize
    }).then((data) => {
      const list = data.list || data || []
      const total = data.total || list.length
      this.setData({
        resultList: reset ? list : [...this.data.resultList, ...list],
        total,
        page: page + 1,
        hasMore: (reset ? list.length : this.data.resultList.length + list.length) < total,
        loading: false,
        searched: true
      })
    }).catch(() => {
      this.setData({ loading: false, searched: true })
    })
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.searchGoods(false)
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
  },

  goBack() {
    wx.navigateBack()
  }
})