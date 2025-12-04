const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		packages: [],
		loading: false,
		selectedCount: 0,
		totalPrice: 0
	},
	onLoad() {
		this.loadPackages()
	},
	// 加载套餐列表
	loadPackages() {
		this.setData({ loading: true })
		api.getPackages().then((data) => {
			const packages = Array.isArray(data) ? data : []
			// 格式化数据
			const formattedPackages = packages.map(p => ({
				id: p.id,
				name: p.name,
				desc: p.description || '',
				price: p.discountPrice || p.basePrice || 0,
				originalPrice: p.basePrice || 0,
				save: (p.basePrice || 0) - (p.discountPrice || p.basePrice || 0),
				cover: p.cover || p.thumb || p.image || '',
				products: p.products || []
			}))
			this.setData({ packages: formattedPackages, loading: false })
		}).catch((err) => {
			console.error('加载套餐失败:', err)
			this.setData({ loading: false, packages: [] })
		})
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 3 })
		}
	},
	goPackageDetail(e) {
		const id = e.currentTarget.dataset.id
		if (id) {
			wx.navigateTo({ url: `/pages/package/detail/index?id=${id}` })
		}
	},
	goOrder() {
		wx.showToast({ title: '请先选择套餐', icon: 'none' })
	}
})


