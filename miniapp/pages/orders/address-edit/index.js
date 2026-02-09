// pages/orders/address-edit/index.js
const app = getApp()
const api = app.api || require('../../../utils/api.js')

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
    }).catch(() => {})
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },

  chooseRegion() {
    wx.chooseLocation && wx.chooseLocation({
      success: () => {}
    })
    // Fallback: use simple picker
    // In real app, use a region picker component
    wx.showToast({ title: '请手动输入地区', icon: 'none' })
  },

  saveAddress() {
    const { form } = this.data
    if (!form.name) return wx.showToast({ title: '请输入收货人', icon: 'none' })
    if (!form.phone || form.phone.length !== 11) return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    if (!form.address) return wx.showToast({ title: '请输入详细地址', icon: 'none' })

    const saveFunc = this.data.isEdit
      ? api.updateAddress(this.data.addressId, form)
      : api.addAddress(form)

    saveFunc.then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch((err) => {
      // Fallback: save to local storage
      try {
        const addresses = wx.getStorageSync('addresses') || []
        if (this.data.isEdit) {
          const idx = addresses.findIndex(a => (a._id || a.id) === this.data.addressId)
          if (idx >= 0) addresses[idx] = { ...addresses[idx], ...form }
        } else {
          addresses.push({ ...form, id: 'addr_' + Date.now(), _id: 'addr_' + Date.now() })
        }
        if (form.isDefault) {
          addresses.forEach(a => { a.isDefault = (a._id || a.id) === (this.data.isEdit ? this.data.addressId : addresses[addresses.length - 1]._id) })
        }
        wx.setStorageSync('addresses', addresses)
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      } catch(e) {
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  },

  deleteAddress() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          api.deleteAddress(this.data.addressId).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          }).catch(() => {
            try {
              let addresses = wx.getStorageSync('addresses') || []
              addresses = addresses.filter(a => (a._id || a.id) !== this.data.addressId)
              wx.setStorageSync('addresses', addresses)
              wx.showToast({ title: '已删除', icon: 'success' })
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
