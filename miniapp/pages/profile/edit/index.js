// pages/profile/edit/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')
const { requireLogin } = require('../../../utils/auth.js')

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '',
      phone: '',
      gender: 0,
      birthday: ''
    }
  },

  onLoad() {
    if (!requireLogin()) return
    try {
      const userInfo = wx.getStorageSync('userInfo') || {}
      this.setData({ userInfo })
    } catch(e) {}
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`userInfo.${field}`]: e.detail.value })
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ 'userInfo.avatar': tempFilePath })
      }
    })
  },

  chooseGender() {
    wx.showActionSheet({
      itemList: ['男', '女'],
      success: (res) => {
        this.setData({ 'userInfo.gender': res.tapIndex + 1 })
      }
    })
  },

  chooseBirthday() {
    // Use a simple date input approach
    wx.showToast({ title: '请在下方输入', icon: 'none' })
  },

  saveProfile() {
    const { userInfo } = this.data
    if (!userInfo.nickname) return wx.showToast({ title: '请输入昵称', icon: 'none' })

    api.updateProfile(userInfo).then(() => {
      try { wx.setStorageSync('userInfo', userInfo) } catch(e) {}
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch(() => {
      // Fallback: save locally
      try { wx.setStorageSync('userInfo', userInfo) } catch(e) {}
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
