Page({
  data: {
    bookingDate: '',
    minDate: '',
    timeSlots: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'],
    timeIndex: -1,
    name: '',
    phone: '',
    remark: '',
    myBookings: [],
    isLoggedIn: false
  },
  onLoad() {
    // 设置最小日期为明天
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = this.formatDate(tomorrow)
    this.setData({ minDate })
    
    this.checkLogin()
    this.loadMyBookings()
  },
  onShow() {
    this.checkLogin()
    this.loadMyBookings()
  },
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  checkLogin() {
    // 检查登录状态
    try {
      const userInfo = wx.getStorageSync('userInfo')
      this.setData({ isLoggedIn: !!userInfo })
    } catch (e) {
      this.setData({ isLoggedIn: false })
    }
  },
  loadMyBookings() {
    try {
      const bookings = wx.getStorageSync('myBookings') || []
      this.setData({ myBookings: bookings })
    } catch (e) {
      console.error('加载预约记录失败:', e)
    }
  },
  onDateChange(e) {
    this.setData({ bookingDate: e.detail.value })
  },
  onTimeChange(e) {
    this.setData({ timeIndex: parseInt(e.detail.value) })
  },
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },
  onSubmit() {
    // 检查登录
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '预约陪买服务需要登录，是否前往登录？',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            // 模拟登录
            wx.getUserProfile({
              desc: '用于完善用户资料',
              success: (userRes) => {
                try {
                  wx.setStorageSync('userInfo', userRes.userInfo)
                  this.setData({ isLoggedIn: true })
                  wx.showToast({ title: '登录成功', icon: 'success' })
                } catch (e) {}
              },
              fail: () => {
                wx.showToast({ title: '登录取消', icon: 'none' })
              }
            })
          }
        }
      })
      return
    }
    
    // 验证表单
    const { bookingDate, timeIndex, name, phone } = this.data
    if (!bookingDate) {
      wx.showToast({ title: '请选择预约日期', icon: 'none' })
      return
    }
    if (timeIndex < 0) {
      wx.showToast({ title: '请选择预约时间', icon: 'none' })
      return
    }
    if (!name.trim()) {
      wx.showToast({ title: '请输入联系人姓名', icon: 'none' })
      return
    }
    if (!phone.trim() || !/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    
    // 创建预约
    const booking = {
      id: 'booking_' + Date.now(),
      date: bookingDate,
      time: this.data.timeSlots[timeIndex],
      name: name,
      phone: phone,
      remark: this.data.remark,
      status: 'pending',
      statusText: '待确认',
      createTime: Date.now()
    }
    
    try {
      const bookings = wx.getStorageSync('myBookings') || []
      bookings.unshift(booking)
      wx.setStorageSync('myBookings', bookings)
      
      this.setData({
        myBookings: bookings,
        bookingDate: '',
        timeIndex: -1,
        name: '',
        phone: '',
        remark: ''
      })
      
      wx.showToast({ title: '预约成功', icon: 'success' })
    } catch (e) {
      console.error('保存预约失败:', e)
      wx.showToast({ title: '预约失败', icon: 'none' })
    }
  },
  onViewBookingDetail(e) {
    const id = e.currentTarget.dataset.id
    const booking = this.data.myBookings.find(b => b.id === id)
    if (booking) {
      const statusMap = {
        'pending': '待确认',
        'confirmed': '已确认',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      wx.showModal({
        title: '预约详情',
        content: `预约日期: ${booking.date} ${booking.time}\n联系人: ${booking.name}\n联系电话: ${booking.phone}\n状态: ${statusMap[booking.status] || booking.statusText}\n${booking.remark ? '备注: ' + booking.remark : ''}`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },
  onCancelBooking(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const bookings = this.data.myBookings.map(b => {
              if (b.id === id) {
                return { ...b, status: 'cancelled', statusText: '已取消' }
              }
              return b
            })
            wx.setStorageSync('myBookings', bookings)
            this.setData({ myBookings: bookings })
            wx.showToast({ title: '已取消', icon: 'success' })
          } catch (e) {
            wx.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  }
})
