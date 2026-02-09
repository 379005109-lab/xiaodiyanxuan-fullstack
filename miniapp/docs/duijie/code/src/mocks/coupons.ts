
export interface Coupon {
  id: string;
  type: 'discount' | 'amount' | 'shipping';
  value: number; // 折扣为0.9表示9折，金额为100表示100元
  title: string;
  description: string;
  threshold: number; // 门槛金额，0表示无门槛
  validStart: string;
  validEnd: string;
  code: string;
  usedCount: number;
  totalCount: number;
  status: 'available' | 'used' | 'expired';
  scope: 'all' | 'category' | 'product';
  scopeDesc: string;
  rules: string[];
}

export const mockCoupons: Coupon[] = [
  {
    id: 'c001',
    type: 'amount',
    value: 100,
    title: '新人专享券',
    description: '全场通用',
    threshold: 1000,
    validStart: '2025-01-01',
    validEnd: '2025-03-31',
    code: 'NEW100OFF',
    usedCount: 0,
    totalCount: 1,
    status: 'available',
    scope: 'all',
    scopeDesc: '全场商品可用',
    rules: [
      '本券仅限新用户首单使用',
      '每个账户限领1张',
      '不可与其他优惠券叠加使用',
      '订单取消后优惠券不退还'
    ]
  },
  {
    id: 'c002',
    type: 'discount',
    value: 0.9,
    title: '会员9折券',
    description: '沙发类专享',
    threshold: 500,
    validStart: '2025-01-15',
    validEnd: '2025-02-28',
    code: 'VIP90SOFA',
    usedCount: 0,
    totalCount: 3,
    status: 'available',
    scope: 'category',
    scopeDesc: '仅限沙发类商品',
    rules: [
      '本券仅限沙发类商品使用',
      '每单限用1张',
      '可与满减活动叠加',
      '部分特价商品除外'
    ]
  },
  {
    id: 'c003',
    type: 'amount',
    value: 50,
    title: '满减优惠券',
    description: '床具专区',
    threshold: 500,
    validStart: '2025-01-01',
    validEnd: '2025-04-30',
    code: 'BED50OFF',
    usedCount: 0,
    totalCount: 1,
    status: 'available',
    scope: 'category',
    scopeDesc: '仅限床具类商品',
    rules: [
      '本券仅限床具类商品使用',
      '每单限用1张',
      '不可与其他优惠券叠加'
    ]
  },
  {
    id: 'c004',
    type: 'shipping',
    value: 0,
    title: '免运费券',
    description: '全场通用',
    threshold: 0,
    validStart: '2025-01-01',
    validEnd: '2025-06-30',
    code: 'FREESHIP',
    usedCount: 0,
    totalCount: 5,
    status: 'available',
    scope: 'all',
    scopeDesc: '全场商品可用',
    rules: [
      '本券可免除订单运费',
      '每单限用1张',
      '部分偏远地区除外'
    ]
  },
  {
    id: 'c005',
    type: 'amount',
    value: 200,
    title: '大额满减券',
    description: '全场通用',
    threshold: 2000,
    validStart: '2024-12-01',
    validEnd: '2025-01-15',
    code: 'BIG200OFF',
    usedCount: 1,
    totalCount: 1,
    status: 'used',
    scope: 'all',
    scopeDesc: '全场商品可用',
    rules: [
      '本券全场商品可用',
      '每单限用1张',
      '不可与其他优惠券叠加'
    ]
  },
  {
    id: 'c006',
    type: 'discount',
    value: 0.85,
    title: '85折优惠券',
    description: '灯具专区',
    threshold: 300,
    validStart: '2024-11-01',
    validEnd: '2024-12-31',
    code: 'LIGHT85',
    usedCount: 0,
    totalCount: 1,
    status: 'expired',
    scope: 'category',
    scopeDesc: '仅限灯具类商品',
    rules: [
      '本券仅限灯具类商品使用',
      '每单限用1张'
    ]
  },
  {
    id: 'c007',
    type: 'amount',
    value: 30,
    title: '小额优惠券',
    description: '软装饰品',
    threshold: 200,
    validStart: '2024-10-01',
    validEnd: '2024-11-30',
    code: 'DECO30',
    usedCount: 1,
    totalCount: 1,
    status: 'used',
    scope: 'category',
    scopeDesc: '仅限软装饰品',
    rules: [
      '本券仅限软装饰品使用',
      '每单限用1张'
    ]
  }
];
