// pages/profile/address/edit/index.js
const app = getApp()
const api = app.api || require('../../../../utils/api.js')
const { requireLogin } = require('../../../../utils/auth.js')

Page({
  data: {
    isEdit: false,
    addressId: '',
    form: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      address: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (!requireLogin()) return
    if (options.id) {
      this.setData({ isEdit: true, addressId: options.id })
      this.loadAddress(options.id)
    }
  },

  loadAddress(id) {
    api.getAddresses().then((data) => {
      const list = data.list || data || []
      const addr = list.find(a => (a._id || a.id) === id)
      if (addr) {
        this.setData({
          form: {
            name: addr.name || '',
            phone: addr.phone || '',
            province: addr.province || '',
            city: addr.city || '',
            district: addr.district || '',
            address: addr.address || '',
            isDefault: addr.isDefault || false
          }
        })
      }
    }).catch(() => {
      try {
        const addresses = wx.getStorageSync('addresses') || []
        const addr = addresses.find(a => (a._id || a.id) === id)
        if (addr) {
          this.setData({
            form: {
              name: addr.name || '',
              phone: addr.phone || '',
              province: addr.province || '',
              city: addr.city || '',
              district: addr.district || '',
              address: addr.address || '',
              isDefault: addr.isDefault || false
            }
          })
        }
      } catch(e) {}
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  chooseRegion() {
    wx.chooseLocation && wx.chooseLocation({
      success: () => {},
      fail: () => {}
    })
    // Fallback: use simple input if chooseLocation not available
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },

  saveAddress() {
    const { form } = this.data
    if (!form.name) return wx.showToast({ title: '\u8BF7\u8F93\u5165\u6536\u8D27\u4EBA', icon: 'none' })
    if (!form.phone || form.phone.length < 11) return wx.showToast({ title: '\u8BF7\u8F93\u5165\u6B63\u786E\u624B\u673A\u53F7', icon: 'none' })
    if (!form.address) return wx.showToast({ title: '\u8BF7\u8F93\u5165\u8BE6\u7EC6\u5730\u5740', icon: 'none' })

    const saveFunc = this.data.isEdit
      ? api.updateAddress(this.data.addressId, form)
      : api.addAddress(form)

    saveFunc.then(() => {
      wx.showToast({ title: '\u4FDD\u5B58\u6210\u529F', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch(() => {
      // Fallback: save to local storage
      try {
        let addresses = wx.getStorageSync('addresses') || []
        if (this.data.isEdit) {
          const idx = addresses.findIndex(a => (a._id || a.id) === this.data.addressId)
          if (idx >= 0) addresses[idx] = { ...addresses[idx], ...form }
        } else {
          addresses.push({ _id: 'addr_' + Date.now(), ...form })
        }
        if (form.isDefault) {
          addresses = addresses.map(a => ({ ...a, isDefault: (a._id || a.id) === (this.data.isEdit ? this.data.addressId : addresses[addresses.length - 1]._id) }))
        }
        wx.setStorageSync('addresses', addresses)
        wx.showToast({ title: '\u4FDD\u5B58\u6210\u529F', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      } catch(e) {
        wx.showToast({ title: '\u4FDD\u5B58\u5931\u8D25', icon: 'none' })
      }
    })
  },

  deleteAddress() {
    wx.showModal({
      title: '\u786E\u8BA4\u5220\u9664',
      content: '\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u5730\u5740\u5417\uFF1F',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          api.deleteAddress(this.data.addressId).then(() => {
            wx.showToast({ title: '\u5DF2\u5220\u9664', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          }).catch(() => {
            try {
              let addresses = wx.getStorageSync('addresses') || []
              addresses = addresses.filter(a => (a._id || a.id) !== this.data.addressId)
              wx.setStorageSync('addresses', addresses)
              wx.showToast({ title: '\u5DF2\u5220\u9664', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1000)
            } catch(e) {}
          })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})