Page({
	data: {
		isDesigner: false,
		avatar: 'https://picsum.photos/400/400?random=700',
		orderCount: 0,
		cartCount: 0,
		favoriteCount: 0,
		bookingCount: 0
	},
	onLoad() {
		this.loadCounts()
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 4 })
		}
		this.loadCounts()
	},
	loadCounts() {
		try {
			const orders = wx.getStorageSync('orders') || []
			const cart = wx.getStorageSync('cart') || []
			const favorites = wx.getStorageSync('favorites') || []
			const bookings = wx.getStorageSync('myBookings') || []
			// 只统计待确认和已确认的预约
			const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
			this.setData({
				orderCount: orders.length,
				cartCount: cart.length,
				favoriteCount: favorites.length,
				bookingCount: activeBookings.length
			})
		} catch (e) {
			console.error('加载统计数据失败:', e)
		}
	},
	goOrders() {
		wx.navigateTo({ url: '/pages/profile/orders/index' })
	},
	goFavorites() {
		wx.navigateTo({ url: '/pages/profile/favorites/index' })
	},
	goCoupons() {
		wx.navigateTo({ url: '/pages/profile/coupons/index' })
	},
	goAddress() {
		wx.navigateTo({ url: '/pages/profile/address/index' })
	},
	goService() {
		wx.navigateTo({ url: '/pages/profile/service/index' })
	},
	goCart() {
		wx.navigateTo({ url: '/pages/profile/cart/index' })
	},
	goBooking() {
		wx.navigateTo({ url: '/pages/profile/booking/index' })
	},
	goLanguage() {
		wx.navigateTo({ url: '/pages/settings/language/index' })
	}
})


