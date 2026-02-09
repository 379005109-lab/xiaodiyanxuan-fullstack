Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    activeCategory: 'scene',
    showMenu: false,
    showToast: false,
    toastMessage: '',
    showDeleteConfirm: false,
    showBatchDeleteConfirm: false,
    deletingMaterialId: null,
    activeMaterialId: null,
    isManageMode: false,
    selectedMaterials: [],
    isAllSelected: false,
    filteredMaterials: [],
    materialCategories: [
      { id: 'scene', name: '场景效果图', icon: 'ri-landscape-line' },
      { id: 'furniture', name: '家具白底图', icon: 'ri-image-line' }
    ],
    materials: [
      {
        id: 1, type: 'furniture', title: '现代简约沙发',
        image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20beige%20fabric%20sofa%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20simple%20and%20elegant%20design&width=600&height=600&seq=ai-sofa-1&orientation=squarish',
        date: '2025-12-24', tags: ['沙发', '白底图']
      },
      {
        id: 2, type: 'scene', title: '北欧风客厅',
        image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20living%20room%20interior%20with%20modern%20furniture%2C%20natural%20light%20through%20large%20windows%2C%20minimalist%20design%20with%20wooden%20floor%20and%20neutral%20colors%2C%20professional%20interior%20photography&width=600&height=600&seq=ai-scene-1&orientation=squarish',
        date: '2025-12-24', tags: ['客厅', '北欧风']
      },
      {
        id: 3, type: 'furniture', title: '实木餐桌',
        image: 'https://readdy.ai/api/search-image?query=solid%20wood%20dining%20table%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20natural%20wood%20grain%20texture%20visible&width=600&height=600&seq=ai-table-1&orientation=squarish',
        date: '2025-12-24', tags: ['餐桌', '白底图']
      },
      {
        id: 4, type: 'scene', title: '现代卧室',
        image: 'https://readdy.ai/api/search-image?query=modern%20bedroom%20interior%20with%20comfortable%20bed%20and%20elegant%20furniture%2C%20soft%20ambient%20lighting%2C%20minimalist%20contemporary%20design%20with%20neutral%20color%20palette%2C%20professional%20interior%20photography&width=600&height=600&seq=ai-bedroom-1&orientation=squarish',
        date: '2025-12-23', tags: ['卧室', '现代风']
      },
      {
        id: 5, type: 'furniture', title: '单人沙发椅',
        image: 'https://readdy.ai/api/search-image?query=elegant%20single%20armchair%20in%20dark%20green%20velvet%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20luxury%20design&width=600&height=600&seq=ai-chair-1&orientation=squarish',
        date: '2025-12-23', tags: ['沙发', '白底图']
      },
      {
        id: 6, type: 'texture', title: '布艺材质',
        image: 'https://readdy.ai/api/search-image?query=high%20quality%20fabric%20texture%20close-up%2C%20soft%20beige%20linen%20material%20with%20visible%20weave%20pattern%2C%20professional%20material%20photography%20with%20even%20lighting%2C%20seamless%20tileable%20texture&width=600&height=600&seq=ai-fabric-1&orientation=squarish',
        date: '2025-12-23', tags: ['布艺', '米色']
      },
      {
        id: 7, type: 'scheme', title: '客厅搭配方案',
        image: 'https://readdy.ai/api/search-image?query=living%20room%20furniture%20arrangement%20scheme%20with%20modern%20sofa%2C%20coffee%20table%20and%20decorations%2C%20top%20view%20layout%20design%2C%20professional%20interior%20design%20presentation%20style&width=600&height=600&seq=ai-scheme-1&orientation=squarish',
        date: '2025-12-23', tags: ['客厅', '搭配']
      },
      {
        id: 8, type: 'furniture', title: '双人床',
        image: 'https://readdy.ai/api/search-image?query=modern%20double%20bed%20with%20upholstered%20headboard%20on%20pure%20white%20background%2C%20clean%20product%20photography%20with%20no%20shadows%2C%20professional%20furniture%20catalog%20style%2C%20elegant%20design&width=600&height=600&seq=ai-bed-1&orientation=squarish',
        date: '2025-12-23', tags: ['床', '白底图']
      }
    ],
    menuItems: [
      { id: 'scene', name: '生成场景效果图', emoji: '🏞' },
      { id: 'white-bg', name: '生成白底图', emoji: '🖼' },
      { id: 'replace', name: '家具替换', emoji: '🔄' },
      { id: 'texture', name: '更换材质面料', emoji: '🎨' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    const menuBtn = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = sysInfo.statusBarHeight || 44
    const navBarHeight = menuBtn.bottom + (menuBtn.top - statusBarHeight)
    this.setData({ statusBarHeight, navBarHeight })
    this.filterMaterials()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  filterMaterials() {
    const { materials, activeCategory } = this.data
    const filtered = materials.filter(m => m.type === activeCategory)
    this.setData({ filteredMaterials: filtered })
  },

  onCategoryChange(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCategory: id, selectedMaterials: [] })
    this.filterMaterials()
    this.checkAllSelected()
  },

  onMaterialTap(e) {
    if (this.data.isManageMode) {
      const id = String(e.currentTarget.dataset.id)
      const selected = [...this.data.selectedMaterials]
      const idx = selected.indexOf(id)
      if (idx > -1) {
        selected.splice(idx, 1)
      } else {
        selected.push(id)
      }
      this.setData({ selectedMaterials: selected })
      this.checkAllSelected()
    }
  },

  onMoreTap(e) {
    const id = e.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ['生成场景效果图', '生成白底图', '家具替换', '更换材质面料', '下载', '删除'],
      success: (res) => {
        if (res.tapIndex <= 3) {
          this.showToastMsg('功能开发中')
        } else if (res.tapIndex === 4) {
          this.showToastMsg('素材已开始下载')
        } else if (res.tapIndex === 5) {
          this.setData({ deletingMaterialId: id, showDeleteConfirm: true })
        }
      }
    })
  },

  enterManageMode() {
    this.setData({ isManageMode: true, selectedMaterials: [] })
  },

  exitManageMode() {
    this.setData({ isManageMode: false, selectedMaterials: [] })
  },

  toggleSelectAll() {
    const { filteredMaterials, selectedMaterials } = this.data
    if (selectedMaterials.length === filteredMaterials.length) {
      this.setData({ selectedMaterials: [], isAllSelected: false })
    } else {
      this.setData({
        selectedMaterials: filteredMaterials.map(m => String(m.id)),
        isAllSelected: true
      })
    }
  },

  checkAllSelected() {
    const { filteredMaterials, selectedMaterials } = this.data
    this.setData({
      isAllSelected: filteredMaterials.length > 0 && selectedMaterials.length === filteredMaterials.length
    })
  },

  closeDeleteConfirm() {
    this.setData({ showDeleteConfirm: false, deletingMaterialId: null })
  },

  confirmDelete() {
    this.setData({ showDeleteConfirm: false, deletingMaterialId: null })
    this.showToastMsg('素材已删除')
  },

  closeBatchDeleteConfirm() {
    this.setData({ showBatchDeleteConfirm: false })
  },

  confirmBatchDelete() {
    const count = this.data.selectedMaterials.length
    this.setData({ showBatchDeleteConfirm: false, selectedMaterials: [], isManageMode: false })
    this.showToastMsg('已删除 ' + count + ' 个素材')
  },

  onBatchDelete() {
    if (this.data.selectedMaterials.length > 0) {
      this.setData({ showBatchDeleteConfirm: true })
    }
  },

  onBatchDownload() {
    if (this.data.selectedMaterials.length > 0) {
      this.showToastMsg('已下载 ' + this.data.selectedMaterials.length + ' 个素材')
    }
  },

  onUseInProduct() {
    if (this.data.selectedMaterials.length > 0) {
      this.showToastMsg('功能开发中')
    }
  },

  toggleMenu() {
    this.setData({ showMenu: !this.data.showMenu })
  },

  onMenuClick(e) {
    this.setData({ showMenu: false })
    this.showToastMsg('功能开发中')
  },

  onCameraTap() {
    this.showToastMsg('功能开发中')
  },

  onSearchTap() {
    wx.navigateTo({ url: '/pages/search/index' })
  },

  showToastMsg(msg) {
    this.setData({ showToast: true, toastMessage: msg })
    setTimeout(() => {
      this.setData({ showToast: false, toastMessage: '' })
    }, 2000)
  }
})
