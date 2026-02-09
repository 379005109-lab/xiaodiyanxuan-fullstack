// pages/mall/media/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
  data: {
    productId: '',
    videos: [],
    scenePhotos: [],
    detailPhotos: [],
    productPhotos: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ productId: options.id })
      this.loadMedia(options.id)
    }
  },

  loadMedia(id) {
    api.getGoodsDetail(id).then((data) => {
      const product = data.product || data || {}
      const images = product.images || []
      const media = product.media || {}

      this.setData({
        videos: media.videos || [],
        scenePhotos: (media.scenePhotos || images.slice(0, 3)).map((url, i) => ({ id: `s${i}`, url: typeof url === 'string' ? url : url.url })),
        detailPhotos: (media.detailPhotos || images.slice(3, 6)).map((url, i) => ({ id: `d${i}`, url: typeof url === 'string' ? url : url.url })),
        productPhotos: (media.productPhotos || images.slice(6)).map((url, i) => ({ id: `p${i}`, url: typeof url === 'string' ? url : url.url }))
      })
    }).catch(err => {
      console.error('加载媒体数据失败:', err)
    })
  },

  playVideo(e) {
    const index = e.currentTarget.dataset.index
    const video = this.data.videos[index]
    if (video && video.url) {
      wx.navigateTo({ url: `/pages/mall/media/index?videoUrl=${encodeURIComponent(video.url)}` })
    }
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.current
    const urls = e.currentTarget.dataset.urls || []
    wx.previewImage({
      current,
      urls: urls.map(p => p.url || p)
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
