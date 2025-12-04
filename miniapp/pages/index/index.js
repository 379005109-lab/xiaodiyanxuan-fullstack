/**
 * 首页
 */

const api = require('../../api/index')

Page({
  data: {
    banners: [],
    hotGoods: [],
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载首页数据
  async loadData() {
    try {
      this.setData({ loading: true })
      
      const res = await api.home.getData()
      
      this.setData({
        banners: res.data.banners || [],
        hotGoods: res.data.hotGoods || [],
        loading: false
      })
    } catch (err) {
      console.error('加载首页失败', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 搜索
  onSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 跳转商品详情
  goDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/goods/detail?id=${id}`
    })
  },

  // 跳转商品列表
  goList() {
    wx.navigateTo({
      url: '/pages/goods/list'
    })
  }
})
