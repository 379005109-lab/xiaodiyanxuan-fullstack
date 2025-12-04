const api = require('../../api/index')
Page({
  data: { id: '', form: { name: '', phone: '', province: '', city: '', district: '', detail: '' } },
  onLoad(options) { if (options.id) { this.setData({ id: options.id }); this.loadData(options.id) } },
  async loadData(id) { /* 加载地址详情 */ },
  inputField(e) { const { field } = e.currentTarget.dataset; this.setData({ [`form.${field}`]: e.detail.value }) },
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.province': res.address.split('省')[0] + '省',
          'form.detail': res.name
        })
      }
    })
  },
  async submit() {
    const { form, id } = this.data
    if (!form.name || !form.phone || !form.detail) {
      return wx.showToast({ title: '请填写完整', icon: 'none' })
    }
    try {
      if (id) { await api.address.update(id, form) }
      else { await api.address.add(form) }
      wx.navigateBack()
    } catch (err) { wx.showToast({ title: '保存失败', icon: 'none' }) }
  }
})
