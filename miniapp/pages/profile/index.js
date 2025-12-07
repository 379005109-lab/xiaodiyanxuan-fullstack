const app = getApp()
const api = app.api || require('../../utils/api.js')

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
	async loadCounts() {
		// 从本地存储获取
		try {
			const cart = wx.getStorageSync('cart') || []
			const favorites = wx.getStorageSync('favorites') || []
			const bookings = wx.getStorageSync('myBookings') || []
			const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
			this.setData({
				cartCount: cart.length,
				favoriteCount: favorites.length,
				bookingCount: activeBookings.length
			})
		} catch (e) {
			console.error('加载本地统计数据失败:', e)
		}
		
		// 从API获取订单数量
		try {
			const data = await api.getOrders()
			let orders = []
			if (Array.isArray(data)) {
				orders = data
			} else if (data && data.data && Array.isArray(data.data)) {
				orders = data.data
			} else if (data && data.list && Array.isArray(data.list)) {
				orders = data.list
			}
			this.setData({ orderCount: orders.length })
		} catch (e) {
			console.error('加载订单数量失败:', e)
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
	goReferral() {
		wx.navigateTo({ url: '/pages/profile/referral/index' })
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


