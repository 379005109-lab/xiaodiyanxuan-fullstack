const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
	data: {
		packageId: '',
		packageData: null,  // 从 API 获取的套餐数据
		loading: true,
		// 当前查看的视角索引
		currentViewIndex: 0,
		currentPreviewLabel: '',
		// 每个类别对应的图片组（从API获取）
		categoryImages: {},
		// 当前类别的预览图列表
		previewImages: [],
		// 当前主图
		currentViewImage: '',
		// 类别配置（从API获取）
		categories: [],
		// 当前选中的类别
		currentCategory: '',
		// 所有商品数据（从API获取）
		allGoods: {},
		// 当前显示的商品列表
		currentGoodsList: [],
		// 总价（一口价，固定不变）
		totalPrice: 0,
		// 原价（划线价，固定不变）
		originalPrice: 0,
		// 选中的商品映射（存储每个商品的选中数量）
		selectedGoods: {},
		// 下一个类别名称
		nextCategoryName: '',
		// 是否有下一个类别
		hasNextCategory: true,
		// 导航栏滚动位置
		scrollIntoView: '',
		// 搭配推荐产品
		recommendations: [],
		hasSelectedGoods: false,
		currentCategoryIndex: 0,
		previewLabels: [],
		// 商品详情弹窗
		showGoodsModal: false,
		goodsModalData: null,
		goodsModalVariants: [],
		goodsModalVariantId: '',
		pendingGoodsId: '',
		selectedGoodsVariant: {},
		// 面料选择
		goodsModalFabrics: [],
		goodsModalFabricGroups: [],
		goodsModalFabricId: '',
		goodsModalFabricIndex: 0,
		goodsModalAllowRepeat: false,
		goodsModalQuantity: 1
	},
	onLoad(query) {
		const { id = '' } = query || {}
		this.setData({ packageId: id, loading: true })
		
		// 从 API 获取套餐详情
		this.loadPackageDetail(id)
	},
	
	// 加载套餐详情
	loadPackageDetail(id) {
		if (!id) {
			wx.showToast({ title: '套餐不存在', icon: 'none' })
			return
		}
		
		api.getPackageDetail(id).then((data) => {
			console.log('套餐详情:', data)
			
			// 解析套餐数据
			const pkg = data
			const categories = []
			const allGoods = {}
			const categoryImages = {}
			
			// 处理套餐中的每个类别
			if (pkg.categories && pkg.categories.length > 0) {
				// 新格式：有 categories 数组
				pkg.categories.forEach((cat, index) => {
					const key = `cat_${index}`
					
					// 类别配置
					categories.push({
						key: key,
						name: cat.name || `类别${index + 1}`,
						required: cat.required || 1,
						selected: false,
						allowRepeat: cat.required > 1,
						remaining: cat.required || 1
					})
					
					// 该类别的商品列表
					const goods = (cat.products || []).map((p, i) => ({
						id: p.id || `${key}_${i}`,
						code: p.name || '',
						name: p.name || '',
						dims: p.specs || '',
						thumb: p.image || p.thumb || 'https://via.placeholder.com/400',
						price: p.packagePrice || p.basePrice || p.price || 0,
						count: 0,
						material: '',
						materialColor: '',
						fill: '',
						frame: '',
						leg: '',
						skus: p.skus || []
					}))
					allGoods[key] = goods
					
					// 类别图片（使用第一个商品的图片）
					categoryImages[key] = goods.length > 0 ? [goods[0].thumb] : []
				})
			} else if (pkg.products && pkg.products.length > 0) {
				// 旧格式：只有 products 数组，按商品名称前缀自动分类
				console.log('使用 products 格式，自动分类')
				
				// 按商品类型分组（沙发、床、床头柜等）
				const productGroups = {}
				pkg.products.forEach(p => {
					// 从商品名称中提取类型
					let type = '其他'
					if (p.name.includes('沙发')) type = '沙发'
					else if (p.name.includes('床头柜')) type = '床头柜'
					else if (p.name.includes('床')) type = '床'
					else if (p.name.includes('餐椅')) type = '餐椅'
					else if (p.name.includes('餐桌')) type = '餐桌'
					else if (p.name.includes('茶几')) type = '茶几'
					else if (p.name.includes('电视柜')) type = '电视柜'
					
					if (!productGroups[type]) productGroups[type] = []
					productGroups[type].push(p)
				})
				
				// 为每个分组创建类别
				Object.keys(productGroups).forEach((type, index) => {
					const key = `cat_${index}`
					const groupProducts = productGroups[type]
					
					categories.push({
						key: key,
						name: type,
						required: 1,
						selected: false,
						allowRepeat: false,
						remaining: 1
					})
					
					const goods = groupProducts.map((p, i) => ({
						id: p.id || `${key}_${i}`,
						code: p.name || '',
						name: p.name || '',
						dims: '',
						thumb: p.thumb || p.image || 'https://via.placeholder.com/400',
						price: p.price || 0,
						count: 0,
						material: '',
						materialColor: '',
						fill: '',
						frame: '',
						leg: '',
						skus: []
					}))
					allGoods[key] = goods
					categoryImages[key] = goods.length > 0 && goods[0].thumb ? [goods[0].thumb] : []
				})
			}
			
			// 设置数据
			const firstCategoryKey = categories.length > 0 ? categories[0].key : ''
			const firstGoods = allGoods[firstCategoryKey] || []
			const firstImages = categoryImages[firstCategoryKey] || []
			
			this.setData({
				packageData: pkg,
				loading: false,
				totalPrice: pkg.discountPrice || pkg.basePrice || pkg.price || 0,
				originalPrice: pkg.basePrice || pkg.originalPrice || pkg.price || 0,
				categories: categories,
				allGoods: allGoods,
				categoryImages: categoryImages,
				currentCategory: firstCategoryKey,
				currentCategoryIndex: 0,
				currentGoodsList: firstGoods.map(item => ({
					...item,
					allowRepeat: categories[0]?.allowRepeat || false,
					variants: this.buildVariants(item, firstCategoryKey)
				})),
				previewImages: firstImages,
				currentViewImage: firstImages[0] || '',
				previewLabels: firstImages.map((_, idx) => `${categories[0]?.name || ''} · ${idx + 1}`),
				currentPreviewLabel: `${categories[0]?.name || ''} · 1`,
				hasNextCategory: categories.length > 1,
				nextCategoryName: categories.length > 1 ? categories[1].name : ''
			})
		}).catch((err) => {
			console.error('加载套餐详情失败:', err)
			this.setData({ loading: false })
			wx.showToast({ title: '加载失败', icon: 'none' })
		})
	},
	// 初始化类别
	initCategory(categoryKey) {
		const categories = this.data.categories || []
		const categoryIndex = categories.findIndex(c => c.key === categoryKey)
		if (categoryIndex === -1) return
		const category = categories[categoryIndex]
		
		// 获取该类别的图片组
		const images = this.data.categoryImages[categoryKey] || []
		
		// 更新商品列表，使用count而不是selected，并添加allowRepeat属性
		const goodsList = (this.data.allGoods[categoryKey] || []).map(item => ({
			...item,
			count: this.data.selectedGoods[item.id] || 0,
			allowRepeat: category.allowRepeat,
			variants: this.buildVariants(item, categoryKey)
		}))
		
		// 当前类别的预览图和标签
		const previewImages = images
		const categoryName = category.name || '视角'
		const previewLabels = images.map((_, idx) => `${categoryName} · 视角 ${idx + 1}`)
		
		this.setData({
			currentCategory: categoryKey,
			currentCategoryIndex: categoryIndex,
			currentViewIndex: 0,
			previewImages: previewImages,
			previewLabels: previewLabels,
			currentViewImage: images[0] || '',
			currentPreviewLabel: previewLabels[0] || '',
			currentGoodsList: goodsList,
			scrollIntoView: `nav-${categoryKey}`
		})
		
		// 异步执行其他逻辑
		setTimeout(() => {
			this.checkCategorySelected(categoryKey)
			this.calculateTotal()
			this.updateNextCategory()
		}, 10)
		
		// 延迟滚动
		setTimeout(() => {
			wx.pageScrollTo({ scrollTop: 0, duration: 300 }).catch(() => {})
		}, 150)
	},
	// 检查类别是否已选择完成
	checkCategorySelected(categoryKey) {
		const category = this.data.categories.find(c => c.key === categoryKey)
		if (!category) return
		
		// 计算该类别的总选中数量
		const totalSelected = this.data.currentGoodsList.reduce((sum, g) => sum + (g.count || 0), 0)
		const isSelected = totalSelected >= category.required
		// 计算剩余需要选择的数量
		const remaining = Math.max(0, category.required - totalSelected)
		
		const categories = this.data.categories.map(c => {
			if (c.key === categoryKey) {
				return { ...c, selected: isSelected, remaining: remaining }
			}
			return c
		})
		
		this.setData({ categories }, () => {
			this.updateNextCategory()
			// 检查是否所有类别都选完了
			const allSelected = categories.every(c => c.selected)
			if (allSelected && isSelected) {
				// 所有类别都选完了，不自动跳转，显示确认订单按钮
				// 用户需要手动点击确认订单按钮
			} else if (isSelected) {
				// 当前类别选完了，但还有未完成的类别，自动跳转到下一个类别
				setTimeout(() => {
					this.autoNextCategory()
				}, 800)
			}
		})
	},
	// 点击预览图
	onTapPreview(e) {
		const index = Number(e.currentTarget.dataset.index || 0)
		const { previewImages = [], previewLabels = [] } = this.data
		const safeIndex = index >= 0 && index < previewImages.length ? index : 0
		const nextImage = previewImages[safeIndex] || ''
		const nextLabel = previewLabels[safeIndex] || ''
		this.setData({
			currentViewIndex: safeIndex,
			currentViewImage: nextImage,
			currentPreviewLabel: nextLabel
		})
	},
	// 点击类别导航
	onTapCategory(e) {
		const key = e.currentTarget.dataset.key
		if (this.data.showGoodsModal) {
			this.closeGoodsModal()
		}
		this.initCategory(key)
	},
	// 减少商品数量（取消）
	onReduceGoods(e) {
		const id = e.currentTarget.dataset.id
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods || goods.count <= 0) return
		
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category || !category.allowRepeat) return
		
		// 减少数量
		const newCount = goods.count - 1
		this.data.selectedGoods[id] = newCount > 0 ? newCount : 0
		if (newCount <= 0) {
			delete this.data.selectedGoodsVariant[id]
		}
		
		// 更新商品列表
		const currentGoodsList = this.data.currentGoodsList.map(g => ({
			...g,
			count: g.id === id ? (newCount > 0 ? newCount : 0) : g.count,
			allowRepeat: category.allowRepeat
		}))
		
		this.setData({ currentGoodsList }, () => {
			this.checkCategorySelected(this.data.currentCategory)
			this.calculateTotal()
			this.updateRecommendations()
		})
	},
	buildVariants(goods, categoryKey) {
		// 优先使用商品的 skus 数据
		if (goods.skus && goods.skus.length > 0) {
			return goods.skus.map((sku, index) => {
				const dims = sku.length && sku.width && sku.height 
					? `${sku.length}×${sku.width}×${sku.height}mm` 
					: ''
				return {
					id: sku._id || sku.code || `${goods.id}-sku-${index}`,
					label: sku.spec || sku.color || `规格${index + 1}`,
					desc: dims,
					priceDelta: (sku.price || goods.price) - goods.price,
					sku: sku  // 保存完整SKU数据
				}
			})
		}
		// 如果没有 skus，使用默认配置
		return [
			{ id: `${goods.id}-default`, label: '标准配置', desc: goods.dims || '', priceDelta: 0 }
		]
	},
	openGoodsModal(goods) {
		const parsedDims = this.parseDims(goods.dims)
		const variants = this.buildVariants(goods, this.data.currentCategory)
		const selectedVariant = this.data.selectedGoodsVariant[goods.id]
		const defaultVariantId = variants.find(v => v.id === selectedVariant)?.id || (variants[0] && variants[0].id) || ''
		
		// 获取当前选中规格的 SKU 数据
		const selectedSku = variants.find(v => v.id === defaultVariantId)?.sku
		
		// 获取分组材质选项
		const fabricGroups = this.getFabricGroups(this.data.currentCategory)
		const defaultFabricId = fabricGroups[0]?.items[0]?.id || ''
		
		// 获取当前类别配置
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		const allowRepeat = category ? category.allowRepeat : false
		const currentQty = goods.count || 1
		
		this.setData({
			showGoodsModal: true,
			pendingGoodsId: goods.id,
			goodsModalData: {
				...goods,
				dimsParsed: parsedDims
			},
			goodsModalVariants: variants,
			goodsModalVariantId: defaultVariantId,
			goodsModalFabricGroups: fabricGroups,
			goodsModalFabricId: goods.fabricId || defaultFabricId,
			goodsModalAllowRepeat: allowRepeat,
			goodsModalQuantity: allowRepeat ? Math.max(1, currentQty) : 1
		})
	},
	// 获取材质选项（按类别分组）- 所有分类都显示材质选择
	getFabricGroups(categoryKey) {
		// 获取当前分类名称
		const category = this.data.categories.find(c => c.key === categoryKey)
		const categoryName = category ? category.name : ''
		
		// 根据分类名称判断材质类型
		const isFabricCategory = /沙发|床|椅/.test(categoryName)
		const isWoodCategory = /桌|柜|茶几/.test(categoryName)
		
		if (isFabricCategory) {
			return [
				{
					groupName: 'A类头层真皮 (荔枝纹)',
					items: [
						{ id: 'a1', colorName: '色号1', img: 'https://picsum.photos/120/120?random=301' },
						{ id: 'a2', colorName: '色号2', img: 'https://picsum.photos/120/120?random=302' },
						{ id: 'a3', colorName: '色号3', img: 'https://picsum.photos/120/120?random=303' },
						{ id: 'a4', colorName: '色号4', img: 'https://picsum.photos/120/120?random=304' },
						{ id: 'a5', colorName: '色号5', img: 'https://picsum.photos/120/120?random=305' },
						{ id: 'a6', colorName: '色号6', img: 'https://picsum.photos/120/120?random=306' }
					]
				},
				{
					groupName: 'B类纳米科技布',
					items: [
						{ id: 'b1', colorName: '色号1', img: 'https://picsum.photos/120/120?random=311' },
						{ id: 'b2', colorName: '色号2', img: 'https://picsum.photos/120/120?random=312' },
						{ id: 'b3', colorName: '色号3', img: 'https://picsum.photos/120/120?random=313' },
						{ id: 'b4', colorName: '色号4', img: 'https://picsum.photos/120/120?random=314' }
					]
				}
			]
		}
		if (isWoodCategory) {
			return [
				{
					groupName: '实木材质',
					items: [
						{ id: 't1', colorName: '原木色', img: 'https://picsum.photos/120/120?random=321' },
						{ id: 't2', colorName: '胡桃色', img: 'https://picsum.photos/120/120?random=322' },
						{ id: 't3', colorName: '樱桃色', img: 'https://picsum.photos/120/120?random=323' }
					]
				},
				{
					groupName: '岩板材质',
					items: [
						{ id: 'r1', colorName: '雪花白', img: 'https://picsum.photos/120/120?random=331' },
						{ id: 'r2', colorName: '灰色', img: 'https://picsum.photos/120/120?random=332' }
					]
				}
			]
		}
		// 默认返回通用材质选项
		return [
			{
				groupName: '标准材质',
				items: [
					{ id: 'd1', colorName: '默认色', img: 'https://picsum.photos/120/120?random=341' },
					{ id: 'd2', colorName: '浅色系', img: 'https://picsum.photos/120/120?random=342' },
					{ id: 'd3', colorName: '深色系', img: 'https://picsum.photos/120/120?random=343' }
				]
			}
		]
	},
	// 选择面料
	onSelectFabric(e) {
		const id = e.currentTarget.dataset.id
		this.setData({ goodsModalFabricId: id })
	},
	// 弹窗内增加数量
	onModalIncreaseQty() {
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category) return
		const currentTotal = this.data.currentGoodsList.reduce((sum, g) => sum + (g.count || 0), 0)
		const goods = this.data.currentGoodsList.find(g => g.id === this.data.pendingGoodsId)
		const existingCount = goods ? goods.count : 0
		const newQty = this.data.goodsModalQuantity + 1
		// 检查是否超过限制
		if (currentTotal - existingCount + newQty > category.required) {
			wx.showToast({ title: `最多选择${category.required}件`, icon: 'none' })
			return
		}
		this.setData({ goodsModalQuantity: newQty })
	},
	// 弹窗内减少数量
	onModalDecreaseQty() {
		if (this.data.goodsModalQuantity <= 1) return
		this.setData({ goodsModalQuantity: this.data.goodsModalQuantity - 1 })
	},
	closeGoodsModal() {
		this.setData({
			showGoodsModal: false,
			goodsModalData: null,
			goodsModalVariants: [],
			goodsModalVariantId: '',
			pendingGoodsId: '',
			goodsModalFabrics: [],
			goodsModalFabricIndex: 0,
			goodsModalAllowRepeat: false,
			goodsModalQuantity: 1
		})
	},
	parseDims(dims = '') {
		if (!dims) return { length: '', width: '', height: '' }
		const clean = dims.replace(/cm|厘米|CM|\s/g, '').replace(/×/g, 'x')
		const parts = clean.split(/[x\*]/).filter(Boolean)
		return {
			length: parts[0] || '',
			width: parts[1] || '',
			height: parts[2] || ''
		}
	},
	onTapGoods(e) {
		const id = e.currentTarget.dataset.id
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods) return
		this.openGoodsModal(goods)
	},
	confirmGoodsSelection() {
		const goodsId = this.data.pendingGoodsId
		if (!goodsId) {
			this.closeGoodsModal()
			return
		}
		
		// 获取选择的面料
		const fabrics = this.data.goodsModalFabrics
		const fabricIndex = this.data.goodsModalFabricIndex
		const selectedFabric = fabrics[fabricIndex]?.name || ''
		const quantity = this.data.goodsModalQuantity || 1
		
		// 更新商品的面料信息
		this.handleSelectGoodsWithOptions(goodsId, this.data.goodsModalVariantId, selectedFabric, quantity)
		this.closeGoodsModal()
	},
	// 带选项的商品选择
	handleSelectGoodsWithOptions(id, variantId, fabric, quantity) {
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category) return
		
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods) return
		
		// 保存变体选择
		if (variantId) {
			this.data.selectedGoodsVariant[id] = variantId
		}
		
		if (category.allowRepeat) {
			// 可重复选择模式：直接设置数量
			this.data.selectedGoods[id] = quantity
			
			const currentGoodsList = this.data.currentGoodsList.map(g => ({
				...g,
				count: g.id === id ? quantity : g.count,
				fabric: g.id === id ? fabric : g.fabric,
				allowRepeat: category.allowRepeat
			}))
			
			this.setData({ currentGoodsList }, () => {
				this.checkCategorySelected(this.data.currentCategory)
				this.calculateTotal()
			})
		} else {
			// 单选模式：取消其他选择
			this.data.currentGoodsList.forEach(g => {
				if (g.id !== id) {
					this.data.selectedGoods[g.id] = 0
					delete this.data.selectedGoodsVariant[g.id]
				}
			})
			this.data.selectedGoods[id] = 1
			
			const currentGoodsList = this.data.currentGoodsList.map(g => ({
				...g,
				count: g.id === id ? 1 : 0,
				fabric: g.id === id ? fabric : g.fabric,
				allowRepeat: category.allowRepeat
			}))
			
			this.setData({ currentGoodsList }, () => {
				this.checkCategorySelected(this.data.currentCategory)
				this.calculateTotal()
				this.updateRecommendations()
			})
		}
	},
	onSelectVariant(e) {
		const id = e.currentTarget.dataset.id
		if (!id) return
		this.setData({ goodsModalVariantId: id })
	},
	handleSelectGoods(id, variantId = '') {
		
		const category = this.data.categories.find(c => c.key === this.data.currentCategory)
		if (!category) return
		
		// 计算当前类别总选中数量
		const currentTotal = this.data.currentGoodsList.reduce((sum, g) => sum + (g.count || 0), 0)
		const goods = this.data.currentGoodsList.find(g => g.id === id)
		if (!goods) return
		const chosenVariantId = variantId || this.data.selectedGoodsVariant[id] || ''
		if (chosenVariantId) {
			this.data.selectedGoodsVariant[id] = chosenVariantId
		}
		const currentCount = goods.count || 0
		
		// 如果允许重复选择（如床头柜、餐椅）
		if (category.allowRepeat) {
			// 每次点击增加数量（可以连续点击多次）
			// 检查增加后是否超过总数限制
			if (currentTotal >= category.required) {
				wx.showToast({ title: `最多选择${category.required}件`, icon: 'none' })
				return
			}
			const newCount = currentCount + 1
			this.data.selectedGoods[id] = newCount
			
			// 更新商品列表
			const currentGoodsList = this.data.currentGoodsList.map(g => ({
				...g,
				count: g.id === id ? newCount : g.count,
				allowRepeat: category.allowRepeat
			}))
			
			this.setData({ currentGoodsList }, () => {
				this.checkCategorySelected(this.data.currentCategory)
				this.calculateTotal()
			})
		} else {
			// 单选模式（如沙发、床、茶几、餐桌）- 只能选一个，选中后取消其他
			if (currentCount > 0) {
				// 取消选择
				this.data.selectedGoods[id] = 0
				const currentGoodsList = this.data.currentGoodsList.map(g => ({
					...g,
					count: g.id === id ? 0 : g.count,
					allowRepeat: category.allowRepeat
				}))
				this.setData({ currentGoodsList }, () => {
					this.checkCategorySelected(this.data.currentCategory)
					this.calculateTotal()
					this.updateRecommendations()
				})
				delete this.data.selectedGoodsVariant[id]
			} else {
				// 选中当前商品，取消其他选择
				this.data.currentGoodsList.forEach(g => {
					if (g.id !== id) {
						this.data.selectedGoods[g.id] = 0
						delete this.data.selectedGoodsVariant[g.id]
					}
				})
				this.data.selectedGoods[id] = 1
				if (chosenVariantId) {
					this.data.selectedGoodsVariant[id] = chosenVariantId
				}
				
				const currentGoodsList = this.data.currentGoodsList.map(g => ({
					...g,
					count: g.id === id ? 1 : 0,
					allowRepeat: category.allowRepeat
				}))
				
				this.setData({ currentGoodsList }, () => {
					this.checkCategorySelected(this.data.currentCategory)
					this.calculateTotal()
					this.updateRecommendations()
				})
			}
		}
	},
	// 自动跳转到下一个未完成的类别
	autoNextCategory() {
		const { categories, currentCategoryIndex } = this.data
		let targetIndex = categories.findIndex((c, idx) => idx > currentCategoryIndex && !c.selected)
		if (targetIndex === -1) {
			targetIndex = categories.findIndex(c => !c.selected)
		}
		if (targetIndex !== -1 && targetIndex !== currentCategoryIndex) {
			if (this.data.showGoodsModal) {
				this.closeGoodsModal()
			}
			this.initCategory(categories[targetIndex].key)
		}
	},
	// 手动点击下一个类别
	onNextCategory() {
		const { currentCategoryIndex, categories } = this.data
		if (currentCategoryIndex < categories.length - 1) {
			if (this.data.showGoodsModal) {
				this.closeGoodsModal()
			}
			this.initCategory(categories[currentCategoryIndex + 1].key)
		}
	},
	// 完成配置并跳转订单页
	onComplete() {
		// 组装订单数据（一口价模式）
		const orderData = {
			packageId: this.data.packageId,
			goods: [],
			totalPrice: this.data.totalPrice, // 一口价
			originalPrice: this.data.originalPrice, // 原价（划线价）
			discount: this.data.originalPrice - this.data.totalPrice, // 优惠金额
			categoryNames: {
				sofa: '沙发',
				table: '茶几',
				bed: '软床',
				nightstand: '床头柜',
				'dining-table': '餐桌',
				'dining-chair': '餐椅'
			}
		}
		
		// 遍历所有选中的商品
		Object.keys(this.data.selectedGoods).forEach(id => {
			const count = this.data.selectedGoods[id] || 0
			if (count > 0) {
				// 在所有商品中查找商品信息
				Object.keys(this.data.allGoods).forEach(categoryKey => {
					const goods = this.data.allGoods[categoryKey].find(g => g.id === id)
					if (goods) {
						const categoryName = orderData.categoryNames[categoryKey] || categoryKey
						const variants = this.buildVariants(goods, categoryKey)
						const variantId = this.data.selectedGoodsVariant[id]
						const variant = variants.find(v => v.id === variantId)
						orderData.goods.push({
							id: goods.id,
							code: goods.code,
							name: goods.code,
							dims: goods.dims,
							price: goods.price, // 商品原价（用于显示）
							originalPrice: goods.price, // 商品原价
							count: count,
							category: categoryKey,
							categoryName: categoryName,
							thumb: goods.thumb,
							material: goods.material || '标准材质',
							materialColor: goods.materialColor || '',
							fill: goods.fill || '',
							frame: goods.frame || '',
							leg: goods.leg || '',
							variantId: variant ? variant.id : '',
							variantLabel: variant ? variant.label : ''
						})
					}
				})
			}
		})
		
		// 检查是否所有类别都选完了
		const allSelected = this.data.categories.every(c => c.selected)
		if (!allSelected) {
			wx.showToast({ title: '请完成所有类别选择', icon: 'none' })
			return
		}
		
		// 保存订单数据到本地存储
		try {
			wx.setStorageSync('packageOrder', orderData)
		} catch (e) {
			console.error('保存订单数据失败:', e)
		}
		
		// 跳转到订单确认页
		wx.navigateTo({ url: '/pages/order/confirm/index?type=package' })
	},
	// 计算总价（一口价模式，总价固定不变）
	calculateTotal() {
		// 一口价模式，总价固定，不需要计算
		// 但需要确保显示正确的价格
		this.setData({ 
			totalPrice: this.data.totalPrice,
			originalPrice: this.data.originalPrice
		})
	},
	// 更新下一个类别信息
	updateNextCategory() {
		const { categories, currentCategoryIndex } = this.data
		const hasNext = currentCategoryIndex < categories.length - 1
		const nextName = hasNext ? categories[currentCategoryIndex + 1].name : ''
		if (this.data.hasNextCategory !== hasNext || this.data.nextCategoryName !== nextName) {
			this.setData({
				hasNextCategory: hasNext,
				nextCategoryName: nextName
			})
		}
	},
	// 更新搭配推荐显示
	updateRecommendations() {
		// 检查是否有选中的商品
		const hasSelected = Object.values(this.data.selectedGoods).some(count => count > 0)
		this.setData({ hasSelectedGoods: hasSelected })
	},
	// 图片加载错误处理（静默处理，不显示错误）
	onImageError(e) {
		// 静默处理图片加载失败，不影响功能
		console.log('Image load error:', e.detail.errMsg)
	}
})

