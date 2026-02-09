// pages/profile/points/index.js
Page({
  data: {
    points: 0,
    records: []
  },

  onLoad() {
    this.loadPoints()
  },

  loadPoints() {
    try {
      const points = wx.getStorageSync('userPoints') || 0
      const records = wx.getStorageSync('pointsRecords') || []
      this.setData({ points, records })
    } catch(e) {}
  },

  goBack() {
    wx.navigateBack()
  }
})
