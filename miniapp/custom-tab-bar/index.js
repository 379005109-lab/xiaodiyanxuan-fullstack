Component({
	data: {
		selected: 0,
		list: [
			{
				pagePath: "/pages/index/index",
				text: "首页",
				icon: "ri-home-5-line",
				activeIcon: "ri-home-5-fill",
				badge: 0
			},
			{
				pagePath: "/pages/mall/index",
				text: "分类",
				icon: "ri-apps-2-line",
				activeIcon: "ri-apps-2-fill",
				badge: 0
			},
			{
				pagePath: "/pages/ai/index",
				text: "AI",
				icon: "ri-magic-line",
				activeIcon: "ri-magic-fill",
				badge: 0
			},
			{
				pagePath: "/pages/package/index",
				text: "套餐",
				icon: "ri-stack-line",
				activeIcon: "ri-stack-fill",
				badge: 0
			},
			{
				pagePath: "/pages/profile/index",
				text: "我的",
				icon: "ri-user-line",
				activeIcon: "ri-user-fill",
				badge: 0
			}
		]
	},
	methods: {
		switchTab(e) {
			const path = e.currentTarget.dataset.path
			const tabBarPages = [
				'/pages/index/index',
				'/pages/mall/index',
				'/pages/ai/index',
				'/pages/package/index',
				'/pages/profile/index'
			]
			if (tabBarPages.includes(path)) {
				wx.switchTab({ url: path })
			} else {
				wx.navigateTo({ url: path }).catch(() => {
					wx.switchTab({ url: path }).catch(() => {})
				})
			}
		}
	}
})


