export const mockPointsData = {
  balance: 2580,
  monthlyStats: {
    earned: 320,
    consumed: 180,
    expiring: 50,
    expiringDate: '2025-01-31'
  }
};

export const mockPointsRecords = [
  {
    id: '1',
    type: 'consume',
    title: 'AI-白底图',
    description: '生成商品白底图',
    points: -20,
    time: '2025-01-15 14:32',
    orderId: 'AI20250115143201'
  },
  {
    id: '2',
    type: 'earn',
    title: '充值赠送',
    description: '充值100元赠送积分',
    points: 100,
    time: '2025-01-14 10:20',
    orderId: 'CZ20250114102001'
  },
  {
    id: '3',
    type: 'consume',
    title: 'AI-产品替换',
    description: '替换产品场景图',
    points: -20,
    time: '2025-01-13 16:45',
    orderId: 'AI20250113164501'
  },
  {
    id: '4',
    type: 'consume',
    title: 'AI-搭配空间',
    description: '生成空间搭配效果图',
    points: -20,
    time: '2025-01-12 09:18',
    orderId: 'AI20250112091801'
  },
  {
    id: '5',
    type: 'earn',
    title: '每日签到',
    description: '连续签到7天奖励',
    points: 10,
    time: '2025-01-11 08:00',
    orderId: 'QD20250111080001'
  },
  {
    id: '6',
    type: 'consume',
    title: 'AI-更换面料',
    description: '更换家具面料材质',
    points: -20,
    time: '2025-01-10 15:22',
    orderId: 'AI20250110152201'
  },
  {
    id: '7',
    type: 'refund',
    title: '生成失败退款',
    description: 'AI-白底图生成失败退回',
    points: 20,
    time: '2025-01-09 11:30',
    orderId: 'TK20250109113001'
  },
  {
    id: '8',
    type: 'earn',
    title: '邀请好友',
    description: '成功邀请1位好友注册',
    points: 50,
    time: '2025-01-08 14:00',
    orderId: 'YQ20250108140001'
  },
  {
    id: '9',
    type: 'consume',
    title: 'AI-场景效果图',
    description: '生成家具场景效果图',
    points: -20,
    time: '2025-01-07 10:15',
    orderId: 'AI20250107101501'
  },
  {
    id: '10',
    type: 'earn',
    title: '首次注册',
    description: '新用户注册奖励',
    points: 200,
    time: '2025-01-01 12:00',
    orderId: 'ZC20250101120001'
  }
];

export const aiConsumptionReference = [
  { name: '白底图', points: 20, icon: 'ri-image-line' },
  { name: '场景效果图', points: 20, icon: 'ri-landscape-line' },
  { name: '产品替换', points: 20, icon: 'ri-swap-line' },
  { name: '软装搭配', points: 20, icon: 'ri-home-smile-line' },
  { name: '更换面料', points: 20, icon: 'ri-palette-line' },
  { name: '公库场景', points: 0, icon: 'ri-gallery-line' }
];

export const pointsRules = [
  {
    title: '如何获取积分',
    items: [
      '积分通过充值购买获得',
      '充值套餐：50元=500积分、100元=1100积分、200元=2400积分、500元=6500积分',
      '充值金额越大，赠送比例越高',
      '充值成功后积分即时到账'
    ]
  },
  {
    title: '积分使用规则',
    items: [
      '积分可用于AI生图功能消耗',
      '每次AI生图消耗20积分/张',
      '积分不可提现、不可转让',
      '积分有效期为获得后12个月'
    ]
  },
  {
    title: '积分过期说明',
    items: [
      '积分按照先进先出原则消耗',
      '即将过期积分会提前30天提醒',
      '过期积分将自动清零，无法恢复'
    ]
  }
];

export const rechargePackages = [
  { id: '1', amount: 50, points: 500, bonus: 0, label: '' },
  { id: '2', amount: 100, points: 1100, bonus: 100, label: '热门' },
  { id: '3', amount: 200, points: 2400, bonus: 400, label: '超值' },
  { id: '4', amount: 500, points: 6500, bonus: 1500, label: '最划算' },
];

export const pointsData = {
  balance: 2580,
  expiringSoon: 50,
  aiCostPerUse: 20,
  records: [
    {
      id: '1',
      type: 'spend' as const,
      description: 'AI-白底图生成',
      date: '2025-01-15 14:32',
      amount: 20,
      balance: 2580
    },
    {
      id: '2',
      type: 'earn' as const,
      description: '充值购买 - 100元套餐',
      date: '2025-01-14 10:20',
      amount: 1100,
      balance: 2600
    },
    {
      id: '3',
      type: 'spend' as const,
      description: 'AI-产品替换',
      date: '2025-01-13 16:45',
      amount: 20,
      balance: 1500
    },
    {
      id: '4',
      type: 'spend' as const,
      description: 'AI-搭配空间',
      date: '2025-01-12 09:18',
      amount: 20,
      balance: 1520
    },
    {
      id: '5',
      type: 'earn' as const,
      description: '充值购买 - 200元套餐',
      date: '2025-01-10 18:00',
      amount: 2400,
      balance: 1540
    },
    {
      id: '6',
      type: 'spend' as const,
      description: 'AI-更换面料',
      date: '2025-01-10 15:22',
      amount: 20,
      balance: -860
    },
    {
      id: '7',
      type: 'earn' as const,
      description: '生成失败退款',
      date: '2025-01-09 11:30',
      amount: 20,
      balance: -840
    },
    {
      id: '8',
      type: 'spend' as const,
      description: 'AI-家具替换',
      date: '2025-01-08 14:00',
      amount: 20,
      balance: -860
    },
    {
      id: '9',
      type: 'spend' as const,
      description: 'AI-场景效果图',
      date: '2025-01-07 10:15',
      amount: 20,
      balance: -840
    },
    {
      id: '10',
      type: 'earn' as const,
      description: '充值购买 - 50元套餐',
      date: '2025-01-01 12:00',
      amount: 500,
      balance: -820
    }
  ],
  rules: [
    {
      title: '如何获取积分',
      items: [
        '积分通过充值购买获得',
        '充值套餐：50元=500积分、100元=1100积分、200元=2400积分、500元=6500积分',
        '充值金额越大，赠送比例越高',
        '充值成功后积分即时到账'
      ]
    },
    {
      title: '积分使用规则',
      items: [
        '积分可用于AI生图功能消耗',
        '每次AI生图消耗20积分/张',
        '积分不可提现、不可转让',
        '积分有效期为获得后12个月'
      ]
    },
    {
      title: '积分过期说明',
      items: [
        '积分按照先进先出原则消耗',
        '即将过期积分会提前30天提醒',
        '过期积分将自动清零，无法恢复'
      ]
    }
  ]
};
