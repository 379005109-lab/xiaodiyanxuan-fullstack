Component({
	data: {
		selected: 0,
		list: [
			{ pagePath: "/pages/index/index", text: "首页", icon: "🏠" },
			{ pagePath: "/pages/bargain/index", text: "砍价", icon: "🎫" },
			{ pagePath: "/pages/mall/index", text: "商城", icon: "🛍️" },
			{ pagePath: "/pages/package/index", text: "套餐", icon: "📦" },
			{ pagePath: "/pages/profile/index", text: "我的", icon: "👤" }
		]
	},
	methods: {
		switchTab(e) {
			const path = e.currentTarget.dataset.path
			// 检查是否是tabBar页面
			const tabBarPages = [
				'/pages/index/index',
				'/pages/bargain/index',
				'/pages/mall/index',
				'/pages/package/index',
				'/pages/profile/index'
			]
			if (tabBarPages.includes(path)) {
				wx.switchTab({ url: path })
			} else {
				// 如果不是tabBar页面，使用navigateTo
				wx.navigateTo({ url: path }).catch(() => {
					// 如果navigateTo失败，尝试switchTab
					wx.switchTab({ url: path }).catch(() => {})
				})
			}
		}
	}
})


