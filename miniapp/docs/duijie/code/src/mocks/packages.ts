export const packageCategories = [
  { id: 'recommend', name: '推荐', icon: 'ri-star-line' },
  { id: 'hot', name: '热门', icon: 'ri-fire-line' },
  { id: 'new', name: '新上', icon: 'ri-sparkle-line' }
];

export const packages = [
  {
    id: 1,
    name: 'B4尊享套餐',
    subtitle: '精心打造的整体软装方案',
    style: '意式极简',
    material: '头层真皮',
    roomType: '三房两厅',
    category: 'recommend',
    tags: ['推荐', '热门'],
    price: 42830,
    originalPrice: 58600,
    discount: '7.3折',
    targetAudience: '追求品质生活的家庭',
    validDays: 365,
    salesCount: 115,
    image: 'https://readdy.ai/api/search-image?query=luxury%20Italian%20minimalist%20living%20room%20furniture%20set%20with%20premium%20leather%20sofa%20modern%20design%20elegant%20interior%20warm%20brown%20and%20gold%20tones%20professional%20photography&width=600&height=500&seq=pkgnew1&orientation=portrait',
    contentGroups: [
      {
        room: '客厅',
        items: [
          '布艺沙发4款；真皮沙发20款，合计24款任选1款',
          '茶几16款任选1款'
        ]
      },
      {
        room: '餐厅',
        items: [
          '餐桌22款任选1款',
          '餐椅7款选1款4张'
        ]
      },
      {
        room: '卧室',
        items: [
          '主卧床1.8M大床22款任选1款',
          '次卧床1.5M/1.8M床12款任选1款',
          '床头柜8款任选1款'
        ]
      }
    ],
    contents: [
      { name: '布艺沙发', quantity: 1, price: 8800 },
      { name: '实木茶几', quantity: 1, price: 2800 },
      { name: '餐桌', quantity: 1, price: 3200 },
      { name: '餐椅', quantity: 4, price: 4800 },
      { name: '主卧床', quantity: 1, price: 12000 },
      { name: '床头柜', quantity: 2, price: 2400 }
    ],
    highlights: ['更整体', '更高级', '更透明', '更具设计感'],
    benefits: [
      '免费上门量尺',
      '免费设计方案',
      '免费送货安装',
      '一年质保服务',
      '30天无理由退换'
    ],
    description: '专为追求品质生活的家庭设计，意式极简风格，头层真皮材质，彰显生活品味。'
  },
  {
    id: 2,
    name: 'B2逸享套餐',
    subtitle: '轻奢舒适的居家方案',
    style: '现代风格',
    material: '头层真皮',
    roomType: '三房二厅',
    category: 'hot',
    tags: ['热门'],
    price: 28546,
    originalPrice: 42000,
    discount: '6.8折',
    targetAudience: '年轻时尚家庭',
    validDays: 365,
    salesCount: 156,
    image: 'https://readdy.ai/api/search-image?query=modern%20contemporary%20living%20room%20with%20beige%20leather%20sofa%20elegant%20furniture%20set%20warm%20lighting%20professional%20interior%20photography%20cream%20and%20brown%20tones&width=600&height=500&seq=pkgnew2&orientation=portrait',
    contentGroups: [
      {
        room: '客厅',
        items: [
          '布艺沙发15款；真皮沙发25款合计40款任选1款',
          '茶几16款任选1款'
        ]
      },
      {
        room: '餐厅',
        items: [
          '餐桌13款任选1款',
          '餐椅10款选1款4张'
        ]
      },
      {
        room: '卧室',
        items: [
          '主/次卧床1.5M/1.8M床31款任选2款',
          '床头柜6款任选2款'
        ]
      }
    ],
    contents: [
      { name: '真皮沙发组合', quantity: 1, price: 18800 },
      { name: '大理石茶几', quantity: 1, price: 5800 },
      { name: '岩板餐桌', quantity: 1, price: 6800 },
      { name: '餐椅', quantity: 4, price: 4800 }
    ],
    highlights: ['更整体', '更高级', '更透明', '更具设计感'],
    benefits: [
      '免费上门量尺',
      '专属设计师服务',
      '免费送货安装',
      '两年质保服务',
      '30天无理由退换'
    ],
    description: '现代风格设计，头层真皮材质，为年轻时尚家庭打造舒适居家环境。'
  },
  {
    id: 3,
    name: '测试',
    subtitle: '精心打造的整体软装方案',
    style: '轻奢现代',
    material: '进口皮革',
    roomType: '两房一厅',
    category: 'new',
    tags: ['新品'],
    price: 8889,
    originalPrice: 12000,
    discount: '7.4折',
    targetAudience: '小户型业主',
    validDays: 365,
    salesCount: 18,
    image: 'https://readdy.ai/api/search-image?query=modern%20furniture%20collection%20with%20sofa%20dining%20table%20coffee%20table%20bedroom%20set%20elegant%20design%20professional%20product%20photography%20neutral%20tones&width=600&height=500&seq=pkgnew3&orientation=portrait',
    contentGroups: [
      {
        room: '客厅',
        items: [
          '沙发15款任选1款',
          '茶几10款任选1款'
        ]
      },
      {
        room: '餐厅',
        items: [
          '餐桌8款任选1款',
          '餐椅6款选1款4张'
        ]
      }
    ],
    contents: [
      { name: '沙发', quantity: 1, price: 5800 },
      { name: '茶几', quantity: 1, price: 1800 },
      { name: '餐桌', quantity: 1, price: 2800 }
    ],
    highlights: ['更整体', '更高级', '更透明', '更具设计感'],
    benefits: [
      '免费上门量尺',
      '免费设计方案',
      '免费送货安装',
      '一年质保服务'
    ],
    description: '专为小户型设计的入门级软装套餐，轻奢现代风格，性价比超高。'
  },
  {
    id: 4,
    name: '六件套',
    subtitle: '客厅餐厅一站式方案',
    style: '现代简约',
    material: '优质布艺',
    roomType: '客餐厅',
    category: 'hot',
    tags: ['热门', '推荐'],
    price: 25000,
    originalPrice: 35000,
    discount: '7.1折',
    targetAudience: '追求性价比的家庭',
    validDays: 365,
    salesCount: 286,
    image: 'https://readdy.ai/api/search-image?query=six%20piece%20furniture%20set%20including%20sofa%20coffee%20table%20dining%20table%20chairs%20modern%20minimalist%20design%20professional%20photography%20warm%20lighting&width=600&height=500&seq=pkgnew4&orientation=portrait',
    productImages: [
      { name: '圆形茶几', image: 'https://readdy.ai/api/search-image?query=modern%20round%20coffee%20table%20minimalist%20design%20wood%20and%20metal%20professional%20product%20photography%20white%20background&width=150&height=150&seq=prod1&orientation=squarish' },
      { name: '圆形餐桌', image: 'https://readdy.ai/api/search-image?query=modern%20round%20dining%20table%20elegant%20design%20wood%20top%20professional%20product%20photography%20white%20background&width=150&height=150&seq=prod2&orientation=squarish' },
      { name: '芬兰休闲椅', image: 'https://readdy.ai/api/search-image?query=Finnish%20style%20lounge%20chair%20modern%20design%20comfortable%20professional%20product%20photography%20white%20background&width=150&height=150&seq=prod3&orientation=squarish' },
      { name: '沙丘床', image: 'https://readdy.ai/api/search-image?query=modern%20platform%20bed%20elegant%20design%20upholstered%20headboard%20professional%20product%20photography%20white%20background&width=150&height=150&seq=prod4&orientation=squarish' },
      { name: '劳伦斯床', image: 'https://readdy.ai/api/search-image?query=luxury%20bed%20frame%20modern%20design%20leather%20headboard%20professional%20product%20photography%20white%20background&width=150&height=150&seq=prod5&orientation=squarish' }
    ],
    contentGroups: [
      {
        room: '客厅',
        items: [
          '钢琴键沙发 规格：334*117*69',
          '圆形茶几',
          '芬兰休闲椅'
        ]
      },
      {
        room: '餐厅',
        items: [
          '圆形餐桌'
        ]
      },
      {
        room: '卧室',
        items: [
          '沙丘床',
          '劳伦斯床'
        ]
      }
    ],
    contents: [
      { name: '钢琴键沙发', quantity: 1, price: 8800 },
      { name: '圆形茶几', quantity: 1, price: 2800 },
      { name: '圆形餐桌', quantity: 1, price: 4200 },
      { name: '芬兰休闲椅', quantity: 1, price: 3200 },
      { name: '沙丘床', quantity: 1, price: 6800 },
      { name: '劳伦斯床', quantity: 1, price: 5200 }
    ],
    highlights: ['更整体', '更高级', '更透明', '更具设计感'],
    benefits: [
      '免费上门量尺',
      '免费设计方案',
      '免费送货安装',
      '一年质保服务',
      '30天无理由退换'
    ],
    description: '六件套组合，涵盖客厅、餐厅、卧室核心家具，一站式解决方案。'
  }
];

export const purchaseRecords = [
  { id: 1, packageId: 1, packageName: 'B4尊享套餐', purchaseDate: '2024-12-15', status: 'active', expireDate: '2025-12-15' },
  { id: 2, packageId: 2, packageName: 'B2逸享套餐', purchaseDate: '2024-11-20', status: 'active', expireDate: '2025-11-20' }
];

// 套餐配置页面的分类产品数据
export const packageConfigCategories = [
  {
    id: 'sofa',
    name: '沙发',
    icon: 'ri-sofa-line',
    badge: '热销',
    subCategories: ['全部', '大户', '小户'],
    products: [
      { 
        id: 'BST35432', 
        name: 'BST35432', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20sofa%20beige%20fabric%20elegant%20design%20professional%20product%20photography%20white%20background%20studio%20lighting%20front%20view&width=400&height=400&seq=sofa1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20sofa%20beige%20fabric%20elegant%20design%20professional%20product%20photography%20white%20background%20studio%20lighting%20side%20view&width=400&height=400&seq=sofa1b&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20minimalist%20sofa%20beige%20fabric%20elegant%20design%20professional%20product%20photography%20white%20background%20studio%20lighting%20detail%20view&width=400&height=400&seq=sofa1c&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20sofa%20beige%20fabric%20elegant%20design%20professional%20product%20photography%20white%20background%20studio%20lighting&width=200&height=200&seq=sofa1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '三人位', size: '220×95×85cm', price: 8800 },
          { id: 'spec2', name: '双人位', size: '180×95×85cm', price: 6800 },
          { id: 'spec3', name: '单人位', size: '100×95×85cm', price: 3800 }
        ]
      },
      { 
        id: 'BST52931', 
        name: 'BST52931', 
        images: [
          'https://readdy.ai/api/search-image?query=contemporary%20leather%20sofa%20gray%20color%20sleek%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=sofa2a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=contemporary%20leather%20sofa%20gray%20color%20sleek%20design%20professional%20product%20photography%20white%20background%20angle%20view&width=400&height=400&seq=sofa2b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=contemporary%20leather%20sofa%20gray%20color%20sleek%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=sofa2&orientation=squarish',
        specs: [
          { id: 'spec1', name: 'L型组合', size: '280×180×85cm', price: 12800 },
          { id: 'spec2', name: '直排三人', size: '240×95×85cm', price: 9800 }
        ]
      },
      { 
        id: 'BSTJ55701', 
        name: 'BSTJ55701', 
        images: [
          'https://readdy.ai/api/search-image?query=luxury%20sectional%20sofa%20cream%20color%20modern%20style%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=sofa3a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=luxury%20sectional%20sofa%20cream%20color%20modern%20style%20professional%20product%20photography%20white%20background%20side%20view&width=400&height=400&seq=sofa3b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=luxury%20sectional%20sofa%20cream%20color%20modern%20style%20professional%20product%20photography%20white%20background&width=200&height=200&seq=sofa3&orientation=squarish',
        specs: [
          { id: 'spec1', name: '大户型组合', size: '320×200×85cm', price: 15800 },
          { id: 'spec2', name: '中户型组合', size: '280×160×85cm', price: 12800 }
        ]
      },
      { 
        id: 'BST52528', 
        name: 'BST52528', 
        images: [
          'https://readdy.ai/api/search-image?query=elegant%20corner%20sofa%20brown%20leather%20Italian%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=sofa4a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=elegant%20corner%20sofa%20brown%20leather%20Italian%20design%20professional%20product%20photography%20white%20background%20detail%20view&width=400&height=400&seq=sofa4b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=elegant%20corner%20sofa%20brown%20leather%20Italian%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=sofa4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '转角组合', size: '300×180×85cm', price: 13800 }
        ]
      },
      { 
        id: 'BST55124', 
        name: 'BST55124', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20modular%20sofa%20light%20gray%20fabric%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=sofa5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20modular%20sofa%20light%20gray%20fabric%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=sofa5&orientation=squarish',
        specs: [
          { id: 'spec1', name: '模块组合', size: '260×95×85cm', price: 10800 }
        ]
      },
    ]
  },
  {
    id: 'tea-table',
    name: '茶几',
    icon: 'ri-table-line',
    badge: '热销',
    subCategories: ['全部', '大户', '小户'],
    products: [
      { 
        id: 'BSTJB3628A', 
        name: 'BSTJB3628A', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20coffee%20table%20marble%20top%20gold%20legs%20elegant%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=tea1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20coffee%20table%20marble%20top%20gold%20legs%20elegant%20design%20professional%20product%20photography%20white%20background%20top%20view&width=400&height=400&seq=tea1b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20coffee%20table%20marble%20top%20gold%20legs%20elegant%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=tea1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '茶几组合', size: '90×90×33cm', price: 4283 }
        ]
      },
      { 
        id: 'BSTJB3144A', 
        name: 'BSTJB3144A', 
        images: [
          'https://readdy.ai/api/search-image?query=round%20coffee%20table%20wood%20top%20metal%20frame%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=tea2a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=round%20coffee%20table%20wood%20top%20metal%20frame%20minimalist%20professional%20product%20photography%20white%20background%20angle%20view&width=400&height=400&seq=tea2b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=round%20coffee%20table%20wood%20top%20metal%20frame%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=tea2&orientation=squarish',
        specs: [
          { id: 'spec1', name: '圆形茶几', size: '80×80×40cm', price: 3280 },
          { id: 'spec2', name: '椭圆茶几', size: '100×60×40cm', price: 3680 }
        ]
      },
      { 
        id: 'BSTJB3662A', 
        name: 'BSTJB3662A', 
        images: [
          'https://readdy.ai/api/search-image?query=rectangular%20coffee%20table%20glass%20top%20modern%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=tea3a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=rectangular%20coffee%20table%20glass%20top%20modern%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=tea3&orientation=squarish',
        specs: [
          { id: 'spec1', name: '长方形茶几', size: '120×60×45cm', price: 2980 }
        ]
      },
      { 
        id: 'BSTJ03427A', 
        name: 'BSTJ03427A', 
        images: [
          'https://readdy.ai/api/search-image?query=nesting%20coffee%20tables%20set%20modern%20style%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=tea4a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=nesting%20coffee%20tables%20set%20modern%20style%20professional%20product%20photography%20white%20background&width=200&height=200&seq=tea4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '组合套装', size: '大90×小60cm', price: 4580 }
        ]
      },
      { 
        id: 'BSTB034860', 
        name: 'BSTB034860', 
        images: [
          'https://readdy.ai/api/search-image?query=oval%20coffee%20table%20walnut%20wood%20elegant%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=tea5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=oval%20coffee%20table%20walnut%20wood%20elegant%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=tea5&orientation=squarish',
        specs: [
          { id: 'spec1', name: '胡桃木茶几', size: '110×70×42cm', price: 5280 }
        ]
      },
    ]
  },
  {
    id: 'chair',
    name: '椅子',
    icon: 'ri-armchair-line',
    badge: '',
    subCategories: ['全部', '真皮', '布艺'],
    products: [
      { 
        id: 'BST1N7445', 
        name: 'BST1N7445', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20velvet%20upholstery%20gold%20legs%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=chair1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20velvet%20upholstery%20gold%20legs%20professional%20product%20photography%20white%20background%20side%20view&width=400&height=400&seq=chair1b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20dining%20chair%20velvet%20upholstery%20gold%20legs%20professional%20product%20photography%20white%20background&width=200&height=200&seq=chair1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '餐椅单把', size: '45×50×85cm', price: 1280 },
          { id: 'spec2', name: '餐椅4把装', size: '45×50×85cm', price: 4580 }
        ]
      },
      { 
        id: 'BST1N5747', 
        name: 'BST1N5747', 
        images: [
          'https://readdy.ai/api/search-image?query=contemporary%20accent%20chair%20leather%20cushion%20metal%20frame%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=chair2a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=contemporary%20accent%20chair%20leather%20cushion%20metal%20frame%20professional%20product%20photography%20white%20background&width=200&height=200&seq=chair2&orientation=squarish',
        specs: [
          { id: 'spec1', name: '休闲椅', size: '65×70×80cm', price: 2680 }
        ]
      },
      { 
        id: 'BX13N044A', 
        name: 'BX13N044A', 
        images: [
          'https://readdy.ai/api/search-image?query=elegant%20lounge%20chair%20fabric%20upholstery%20wooden%20legs%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=chair3a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=elegant%20lounge%20chair%20fabric%20upholstery%20wooden%20legs%20professional%20product%20photography%20white%20background&width=200&height=200&seq=chair3&orientation=squarish',
        specs: [
          { id: 'spec1', name: '布艺休闲椅', size: '70×75×85cm', price: 2380 }
        ]
      },
      { 
        id: 'BST2N716A', 
        name: 'BST2N716A', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20armchair%20beige%20color%20comfortable%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=chair4a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20armchair%20beige%20color%20comfortable%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=chair4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '单人沙发椅', size: '80×85×90cm', price: 3280 }
        ]
      },
      { 
        id: 'MN1FN014A', 
        name: 'MN1FN014A', 
        images: [
          'https://readdy.ai/api/search-image?query=scandinavian%20style%20chair%20natural%20wood%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=chair5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=scandinavian%20style%20chair%20natural%20wood%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=chair5&orientation=squarish',
        specs: [
          { id: 'spec1', name: '北欧餐椅', size: '45×48×82cm', price: 980 }
        ]
      },
    ]
  },
  {
    id: 'cabinet',
    name: '柜子',
    icon: 'ri-archive-drawer-line',
    badge: '热销',
    subCategories: ['全部', '电视柜', '边柜'],
    products: [
      { 
        id: 'BSTJ93055A', 
        name: 'BSTJ93055A', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20TV%20cabinet%20walnut%20wood%20sleek%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=cab1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20TV%20cabinet%20walnut%20wood%20sleek%20design%20professional%20product%20photography%20white%20background%20angle%20view&width=400&height=400&seq=cab1b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20TV%20cabinet%20walnut%20wood%20sleek%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=cab1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '2米电视柜', size: '200×45×50cm', price: 5680 },
          { id: 'spec2', name: '1.8米电视柜', size: '180×45×50cm', price: 4980 }
        ]
      },
      { 
        id: 'BSTJ93851A', 
        name: 'BSTJ93851A', 
        images: [
          'https://readdy.ai/api/search-image?query=contemporary%20sideboard%20white%20lacquer%20gold%20handles%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=cab2a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=contemporary%20sideboard%20white%20lacquer%20gold%20handles%20professional%20product%20photography%20white%20background&width=200&height=200&seq=cab2&orientation=squarish',
        specs: [
          { id: 'spec1', name: '餐边柜', size: '140×40×85cm', price: 4280 }
        ]
      },
      { 
        id: 'BSTJ93554A', 
        name: 'BSTJ93554A', 
        images: [
          'https://readdy.ai/api/search-image?query=elegant%20bookshelf%20cabinet%20wood%20and%20metal%20modern%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=cab3a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=elegant%20bookshelf%20cabinet%20wood%20and%20metal%20modern%20professional%20product%20photography%20white%20background&width=200&height=200&seq=cab3&orientation=squarish',
        specs: [
          { id: 'spec1', name: '书架柜', size: '120×35×180cm', price: 6880 }
        ]
      },
      { 
        id: 'BSTV93931A', 
        name: 'BSTV93931A', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20storage%20cabinet%20glass%20doors%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=cab4a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20storage%20cabinet%20glass%20doors%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=cab4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '玻璃门柜', size: '100×40×160cm', price: 5280 }
        ]
      },
      { 
        id: 'BSTV9058A', 
        name: 'BSTV9058A', 
        images: [
          'https://readdy.ai/api/search-image?query=contemporary%20console%20cabinet%20marble%20top%20elegant%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=cab5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=contemporary%20console%20cabinet%20marble%20top%20elegant%20professional%20product%20photography%20white%20background&width=200&height=200&seq=cab5&orientation=squarish',
        specs: [
          { id: 'spec1', name: '玄关柜', size: '120×35×85cm', price: 3980 }
        ]
      },
    ]
  },
  {
    id: 'bed',
    name: '床',
    icon: 'ri-hotel-bed-line',
    badge: '',
    subCategories: ['全部', '1.8米', '1.5米'],
    products: [
      { 
        id: 'BSTJC2007', 
        name: 'BSTJC2007', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20platform%20bed%20upholstered%20headboard%20gray%20fabric%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=bed1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20platform%20bed%20upholstered%20headboard%20gray%20fabric%20professional%20product%20photography%20white%20background%20side%20view&width=400&height=400&seq=bed1b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20platform%20bed%20upholstered%20headboard%20gray%20fabric%20professional%20product%20photography%20white%20background&width=200&height=200&seq=bed1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '1.8米床', size: '180×200cm', price: 8800 },
          { id: 'spec2', name: '1.5米床', size: '150×200cm', price: 7200 }
        ]
      },
      { 
        id: 'BSTJC3156', 
        name: 'BSTJC3156', 
        images: [
          'https://readdy.ai/api/search-image?query=luxury%20king%20bed%20leather%20headboard%20elegant%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=bed2a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=luxury%20king%20bed%20leather%20headboard%20elegant%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=bed2&orientation=squarish',
        specs: [
          { id: 'spec1', name: '真皮大床', size: '180×200cm', price: 12800 }
        ]
      },
      { 
        id: 'BSTC2474', 
        name: 'BSTC2474', 
        images: [
          'https://readdy.ai/api/search-image?query=contemporary%20bed%20frame%20wood%20and%20fabric%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=bed3a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=contemporary%20bed%20frame%20wood%20and%20fabric%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=bed3&orientation=squarish',
        specs: [
          { id: 'spec1', name: '布艺床', size: '180×200cm', price: 6800 },
          { id: 'spec2', name: '布艺床', size: '150×200cm', price: 5800 }
        ]
      },
      { 
        id: 'BSTC2415', 
        name: 'BSTC2415', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20storage%20bed%20hydraulic%20lift%20beige%20color%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=bed4a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20storage%20bed%20hydraulic%20lift%20beige%20color%20professional%20product%20photography%20white%20background&width=200&height=200&seq=bed4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '储物床', size: '180×200cm', price: 9800 }
        ]
      },
      { 
        id: 'BSTC3243', 
        name: 'BSTC3243', 
        images: [
          'https://readdy.ai/api/search-image?query=elegant%20canopy%20bed%20metal%20frame%20modern%20style%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=bed5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=elegant%20canopy%20bed%20metal%20frame%20modern%20style%20professional%20product%20photography%20white%20background&width=200&height=200&seq=bed5&orientation=squarish',
        specs: [
          { id: 'spec1', name: '金属框架床', size: '180×200cm', price: 7800 }
        ]
      },
    ]
  },
  {
    id: 'dining-table',
    name: '岩板桌',
    icon: 'ri-layout-grid-line',
    badge: '热销',
    subCategories: ['全部', '圆桌', '方桌'],
    products: [
      { 
        id: 'BSTJC2432', 
        name: 'BSTJC2432', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20sintered%20stone%20dining%20table%20rectangular%20elegant%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=dt1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20sintered%20stone%20dining%20table%20rectangular%20elegant%20professional%20product%20photography%20white%20background%20top%20view&width=400&height=400&seq=dt1b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20sintered%20stone%20dining%20table%20rectangular%20elegant%20professional%20product%20photography%20white%20background&width=200&height=200&seq=dt1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '1.6米餐桌', size: '160×80×75cm', price: 6800 },
          { id: 'spec2', name: '1.4米餐桌', size: '140×80×75cm', price: 5800 }
        ]
      },
      { 
        id: 'BSTJC2431', 
        name: 'BSTJC2431', 
        images: [
          'https://readdy.ai/api/search-image?query=luxury%20marble%20dining%20table%20gold%20base%20contemporary%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=dt2a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=luxury%20marble%20dining%20table%20gold%20base%20contemporary%20professional%20product%20photography%20white%20background&width=200&height=200&seq=dt2&orientation=squarish',
        specs: [
          { id: 'spec1', name: '大理石餐桌', size: '160×90×75cm', price: 8800 }
        ]
      },
      { 
        id: 'BSTJC3445', 
        name: 'BSTJC3445', 
        images: [
          'https://readdy.ai/api/search-image?query=round%20sintered%20stone%20table%20modern%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=dt3a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=round%20sintered%20stone%20table%20modern%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=dt3&orientation=squarish',
        specs: [
          { id: 'spec1', name: '1.3米圆桌', size: '直径130cm', price: 7200 },
          { id: 'spec2', name: '1.5米圆桌', size: '直径150cm', price: 8200 }
        ]
      },
      { 
        id: 'BSTJC2400', 
        name: 'BSTJC2400', 
        images: [
          'https://readdy.ai/api/search-image?query=extendable%20dining%20table%20ceramic%20top%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=dt4a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=extendable%20dining%20table%20ceramic%20top%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=dt4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '可伸缩餐桌', size: '130-180×80×75cm', price: 9800 }
        ]
      },
      { 
        id: 'BSTJC2443', 
        name: 'BSTJC2443', 
        images: [
          'https://readdy.ai/api/search-image?query=oval%20sintered%20stone%20dining%20table%20elegant%20legs%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=dt5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=oval%20sintered%20stone%20dining%20table%20elegant%20legs%20professional%20product%20photography%20white%20background&width=200&height=200&seq=dt5&orientation=squarish',
        specs: [
          { id: 'spec1', name: '椭圆餐桌', size: '160×90×75cm', price: 7800 }
        ]
      },
    ]
  },
  {
    id: 'nightstand',
    name: '书桌',
    icon: 'ri-computer-line',
    badge: '',
    subCategories: ['全部', '大户', '小户'],
    products: [
      { 
        id: 'BSTJX8177', 
        name: 'BSTJX8177', 
        images: [
          'https://readdy.ai/api/search-image?query=modern%20writing%20desk%20wood%20top%20metal%20legs%20minimalist%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=desk1a&orientation=squarish',
          'https://readdy.ai/api/search-image?query=modern%20writing%20desk%20wood%20top%20metal%20legs%20minimalist%20professional%20product%20photography%20white%20background%20angle%20view&width=400&height=400&seq=desk1b&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=modern%20writing%20desk%20wood%20top%20metal%20legs%20minimalist%20professional%20product%20photography%20white%20background&width=200&height=200&seq=desk1&orientation=squarish',
        specs: [
          { id: 'spec1', name: '1.4米书桌', size: '140×60×75cm', price: 3280 },
          { id: 'spec2', name: '1.2米书桌', size: '120×60×75cm', price: 2680 }
        ]
      },
      { 
        id: 'BSTJX2095C', 
        name: 'BSTJX2095C', 
        images: [
          'https://readdy.ai/api/search-image?query=contemporary%20study%20desk%20with%20drawers%20elegant%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=desk2a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=contemporary%20study%20desk%20with%20drawers%20elegant%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=desk2&orientation=squarish',
        specs: [
          { id: 'spec1', name: '带抽屉书桌', size: '140×65×75cm', price: 4280 }
        ]
      },
      { 
        id: 'BSTJX2472C', 
        name: 'BSTJX2472C', 
        images: [
          'https://readdy.ai/api/search-image?query=compact%20computer%20desk%20modern%20design%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=desk4a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=compact%20computer%20desk%20modern%20design%20professional%20product%20photography%20white%20background&width=200&height=200&seq=desk4&orientation=squarish',
        specs: [
          { id: 'spec1', name: '电脑桌', size: '120×55×75cm', price: 2380 }
        ]
      },
      { 
        id: 'BSTJG5179', 
        name: 'BSTJG5179', 
        images: [
          'https://readdy.ai/api/search-image?query=L-shaped%20desk%20home%20office%20modern%20professional%20product%20photography%20white%20background%20front%20view&width=400&height=400&seq=desk5a&orientation=squarish'
        ],
        image: 'https://readdy.ai/api/search-image?query=L-shaped%20desk%20home%20office%20modern%20professional%20product%20photography%20white%20background&width=200&height=200&seq=desk5&orientation=squarish',
        specs: [
          { id: 'spec1', name: 'L型书桌', size: '160×120×75cm', price: 5680 }
        ]
      },
    ]
  }
];

// 右侧配置项数据
export const configOptions = [
  { id: 'sofa', name: '沙发类型配置', selected: false, price: 0 },
  { id: 'tea-table', name: '茶几类型配置', selected: false, price: 0 },
  { id: 'chair', name: '椅子类型配置', selected: false, price: 0 },
  { id: 'cabinet', name: '柜子类型配置', selected: false, price: 0 },
  { id: 'bed', name: '床类型配置', selected: false, price: 0 },
  { id: 'dining-table', name: '岩板桌类型配置', selected: false, price: 0 },
  { id: 'nightstand', name: '书桌类型配置', selected: false, price: 0 },
];
