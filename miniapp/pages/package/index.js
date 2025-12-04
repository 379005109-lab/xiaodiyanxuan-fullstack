Page({
	data: {
		tabs: [{name:'全屋套餐'},{name:'客厅套餐'},{name:'卧室套餐'},{name:'餐厅套餐'}],
		currentTab: 0,
		allPackages: [
			{ id: 'pkg1', name: '北欧风全屋套餐', desc: '沙发 / 茶几 / 电视柜 / 餐桌椅 / 床', price: 19999, save: 3500, cover: 'https://picsum.photos/800/600?random=101', category: 0 },
			{ id: 'pkg2', name: '现代简约全屋套餐', desc: '沙发 / 茶几 / 电视柜 / 餐桌椅 / 床', price: 25999, save: 4200, cover: 'https://picsum.photos/800/600?random=102', category: 0 },
			{ id: 'pkg3', name: '客厅三件套', desc: '沙发 / 茶几 / 电视柜', price: 6999, save: 1200, cover: 'https://picsum.photos/800/600?random=103', category: 1 },
			{ id: 'pkg4', name: '客厅五件套', desc: '沙发 / 茶几 / 电视柜 / 边几 / 落地灯', price: 9999, save: 1800, cover: 'https://picsum.photos/800/600?random=104', category: 1 },
			{ id: 'pkg5', name: '卧室三件套', desc: '床 / 床头柜×2 / 衣柜', price: 8999, save: 1500, cover: 'https://picsum.photos/800/600?random=105', category: 2 },
			{ id: 'pkg6', name: '卧室豪华套餐', desc: '床 / 床头柜×2 / 衣柜 / 梳妆台', price: 12999, save: 2200, cover: 'https://picsum.photos/800/600?random=106', category: 2 },
			{ id: 'pkg7', name: '餐厅四件套', desc: '餐桌 / 餐椅×4', price: 3999, save: 600, cover: 'https://picsum.photos/800/600?random=107', category: 3 },
			{ id: 'pkg8', name: '餐厅六件套', desc: '餐桌 / 餐椅×6 / 餐边柜', price: 5999, save: 900, cover: 'https://picsum.photos/800/600?random=108', category: 3 }
		],
		packages: [],
		selectedCount: 0,
		totalPrice: 0
	},
	onLoad() {
		this.filterPackages()
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 3 })
		}
	},
	onTabChange(e) {
		this.setData({ currentTab: e.currentTarget.dataset.index })
		this.filterPackages()
	},
	filterPackages() {
		const { allPackages, currentTab } = this.data
		const packages = allPackages.filter(p => p.category === currentTab)
		this.setData({ packages })
	},
	goPackageDetail(e) {
		const id = e.currentTarget.dataset.id || 'pkg1'
		wx.navigateTo({ url: `/pages/package/detail/index?id=${id}` })
	},
	goOrder() {
		wx.showToast({ title: '请先选择套餐', icon: 'none' })
	}
})


