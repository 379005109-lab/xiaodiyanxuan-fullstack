export const mockOrderItem = {
  id: 'SF001',
  name: '意式轻奢真皮沙发（模块化）',
  image: 'https://readdy.ai/api/search-image?query=luxury%20italian%20leather%20sofa%20in%20elegant%20living%20room%20setting%2C%20modern%20minimalist%20design%20with%20premium%20materials%2C%20professional%20product%20photography%20with%20soft%20natural%20lighting%20and%20clean%20white%20background%2C%20high-end%20furniture%20aesthetic&width=400&height=400&seq=order-sofa-1&orientation=squarish',
  spec: '单扶手 / 标准版',
  size: '1100x1100x600CM',
  material: '进口头层牛皮',
  color: '黑色',
  price: 14550,
  quantity: 1,
  stock: 50
};

export const mockShippingFee = 0; // 免邮

export const mockCoupons = [
  {
    id: '1',
    name: '新用户专享券',
    discount: 500,
    minAmount: 5000,
    expireDate: '2024-12-31'
  },
  {
    id: '2',
    name: '满10000减1000',
    discount: 1000,
    minAmount: 10000,
    expireDate: '2024-12-31'
  }
];

export const mockProductionCycle = '所有产品为定制生产，生产周期 6-8 周，请耐心等待';
