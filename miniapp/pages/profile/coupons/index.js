const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
	data: {
		currentTab: 0, // 0: 可用, 1: 已使用, 2: 已过期
		coupons: []
	},
	onLoad() {
		this.loadCoupons()
	},
	onShow() {
		this.loadCoupons()
	},
	loadCoupons() {
		api.getCoupons().then((data) => {
			const list = data.list || data || []
			const coupons = list.map(c => ({
				id: c._id || c.id,
				name: c.name || c.title || '',
				desc: c.description || c.desc || '',
				amount: c.discount || c.amount || 0,
				minAmount: c.minOrderAmount || c.minAmount || 0,
				startTime: c.startDate || c.startTime || '',
				endTime: c.endDate || c.endTime || '',
				status: c.status || 'available'
			}))
			this.setData({ coupons })
			this.filterCoupons()
		}).catch(() => {
			// fallback to localStorage
			this.loadCouponsFromLocal()
		})
	},
	loadCouponsFromLocal() {
		try {
			let coupons = wx.getStorageSync('coupons') || []
			if (coupons.length === 0) {
				coupons = this.getDefaultCoupons()
				wx.setStorageSync('coupons', coupons)
			}
			const now = new Date().getTime()
			coupons = coupons.map(coupon => {
				const endTime = new Date(coupon.endTime).getTime()
				if (coupon.status === 'used') {
					return coupon
				} else if (endTime < now) {
					return { ...coupon, status: 'expired' }
				} else {
					return { ...coupon, status: 'available' }
				}
			})
			wx.setStorageSync('coupons', coupons)
			this.setData({ coupons })
			this.filterCoupons()
		} catch (e) {
			console.error('加载优惠券失败:', e)
		}
	},
	getDefaultCoupons() {
		const now = new Date()
		const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
		const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
		
		return [
			{
				id: 'c1',
				name: '新人专享',
				desc: '新用户专享优惠券',
				amount: 50,
				minAmount: 500,
				startTime: this.formatDate(now),
				endTime: this.formatDate(nextWeek),
				status: 'available'
			},
			{
				id: 'c2',
				name: '满减优惠',
				desc: '满1000减100',
				amount: 100,
				minAmount: 1000,
				startTime: this.formatDate(now),
				endTime: this.formatDate(nextMonth),
				status: 'available'
			}
		]
	},
	formatDate(date) {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	},
	checkAndPushCoupons() {
		// 模拟定期推送优惠券（每天检查一次）
		const lastCheckTime = wx.getStorageSync('lastCouponCheckTime') || 0
		const now = new Date().getTime()
		const oneDay = 24 * 60 * 60 * 1000
		
		if (now - lastCheckTime > oneDay) {
			// 随机推送优惠券
			const shouldPush = Math.random() > 0.7 // 30% 概率推送
			if (shouldPush) {
				this.pushNewCoupon()
			}
			wx.setStorageSync('lastCouponCheckTime', now)
		}
	},
	pushNewCoupon() {
		try {
			const coupons = wx.getStorageSync('coupons') || []
			const now = new Date()
			const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
			
			const newCoupon = {
				id: 'c' + Date.now(),
				name: '限时优惠',
				desc: '系统推送的优惠券',
				amount: Math.floor(Math.random() * 50) + 20,
				minAmount: Math.floor(Math.random() * 500) + 300,
				startTime: this.formatDate(now),
				endTime: this.formatDate(nextWeek),
				status: 'available'
			}
			
			coupons.unshift(newCoupon)
			wx.setStorageSync('coupons', coupons)
			
			wx.showToast({
				title: '收到新优惠券',
				icon: 'success',
				duration: 2000
			})
		} catch (e) {
			console.error('推送优惠券失败:', e)
		}
	},
	onTabChange(e) {
		const index = parseInt(e.currentTarget.dataset.index)
		this.setData({ currentTab: index })
		this.filterCoupons()
	},
	filterCoupons() {
		const { coupons, currentTab } = this.data
		let filteredCoupons = []
		
		if (currentTab === 0) {
			// 可用
			filteredCoupons = coupons.filter(c => c.status === 'available')
		} else if (currentTab === 1) {
			// 已使用
			filteredCoupons = coupons.filter(c => c.status === 'used')
		} else if (currentTab === 2) {
			// 已过期
			filteredCoupons = coupons.filter(c => c.status === 'expired')
		}
		
		this.setData({ filteredCoupons })
	}
})

