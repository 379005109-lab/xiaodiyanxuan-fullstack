const app = getApp()
const api = app.api || require('../../../utils/api.js')
const config = require('../../../config/api.js')

Page({
	data: {
		shopInfo: {},
		markers: [],
		loading: true
	},

	onLoad() {
		this.loadShopInfo()
	},

	loadShopInfo() {
		const mId = app.globalData.manufacturerId
		const params = {}
		if (mId) params.manufacturerId = mId

		api.getShopInfo(params).then(data => {
			// 修复图片相对路径
			if (data.logo && !data.logo.startsWith('http')) {
				data.logo = config.baseURL + data.logo
			}
			if (data.qrCodeImage && !data.qrCodeImage.startsWith('http')) {
				data.qrCodeImage = config.baseURL + data.qrCodeImage
			}

			const markers = []
			if (data.latitude && data.longitude) {
				markers.push({
					id: 1,
					latitude: data.latitude,
					longitude: data.longitude,
					title: data.name || '店铺位置',
					iconPath: '',
					width: 30,
					height: 30
				})
			}

			this.setData({ shopInfo: data, markers, loading: false })
		}).catch(err => {
			console.error('加载店铺信息失败:', err)
			this.setData({ loading: false })
		})
	},

	handleCall() {
		const phone = this.data.shopInfo.phone
		if (phone) {
			wx.makePhoneCall({ phoneNumber: phone })
		} else {
			wx.showToast({ title: '暂无联系电话', icon: 'none' })
		}
	},

	handleNavigate() {
		const { address, latitude, longitude, name } = this.data.shopInfo
		if (latitude && longitude) {
			wx.openLocation({
				latitude: Number(latitude),
				longitude: Number(longitude),
				name: name || '店铺位置',
				address: address || ''
			})
		} else if (address) {
			wx.showModal({
				title: '店铺地址',
				content: address,
				showCancel: false,
				confirmText: '知道了'
			})
		} else {
			wx.showToast({ title: '暂无地址信息', icon: 'none' })
		}
	}
})
