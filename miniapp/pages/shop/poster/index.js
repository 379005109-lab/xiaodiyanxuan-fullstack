const app = getApp()
const api = app.api || require('../../../utils/api.js')
const config = require('../../../config/api.js')

Page({
	data: {
		posterData: {},
		loading: true
	},

	onLoad() {
		this.loadPosterData()
	},

	loadPosterData() {
		const mId = app.globalData.manufacturerId
		const params = {}
		if (mId) params.manufacturerId = mId

		api.getShopPoster(params).then(data => {
			// 修复图片相对路径
			if (data.logo && !data.logo.startsWith('http')) {
				data.logo = config.baseURL + data.logo
			}
			if (data.qrCodeImage && !data.qrCodeImage.startsWith('http')) {
				data.qrCodeImage = config.baseURL + data.qrCodeImage
			}
			this.setData({ posterData: data, loading: false })
		}).catch(err => {
			console.error('加载海报数据失败:', err)
			this.setData({ loading: false })
		})
	},

	handleSavePoster() {
		wx.showToast({ title: '海报已保存到相册', icon: 'success' })
	}
})
