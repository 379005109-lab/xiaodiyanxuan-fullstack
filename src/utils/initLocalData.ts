/**
 * 本地化测试数据初始化
 * 用于在 localStorage 中创建测试数据
 */

import { Order } from '@/types'

/**
 * 创建示例订单数据
 */
export const createSampleOrders = (): Order[] => {
  const now = new Date()
  
  return [
    {
      _id: 'order_001',
      orderNo: 'ORD-2024-001',
      user: 'user_001',
      status: 'pending',
      totalAmount: 5999,
      paymentMethod: 'alipay',
      items: [
        {
          product: 'prod_001',
          productName: '现代布艺沙发',
          productImage: 'https://via.placeholder.com/200',
          price: 5999,
          quantity: 1,
          sku: {
            material: '普通皮-黑色'
          }
        }
      ],
      shippingAddress: {
        name: '张三',
        phone: '13800138000',
        address: '北京市朝阳区某某街道123号'
      },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'order_002',
      orderNo: 'ORD-2024-002',
      user: 'user_002',
      status: 'paid',
      totalAmount: 8999,
      paymentMethod: 'wechat',
      items: [
        {
          product: 'prod_002',
          productName: '现代木质餐桌',
          productImage: 'https://via.placeholder.com/200',
          price: 8999,
          quantity: 1,
          sku: {
            material: '全青皮-棕色'
          }
        }
      ],
      shippingAddress: {
        name: '李四',
        phone: '13900139000',
        address: '上海市浦东新区某某路456号'
      },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'order_003',
      orderNo: 'ORD-2024-003',
      user: 'user_003',
      status: 'shipped',
      totalAmount: 12999,
      paymentMethod: 'card',
      items: [
        {
          product: 'prod_003',
          productName: '奶油风床架',
          productImage: 'https://via.placeholder.com/200',
          price: 12999,
          quantity: 1,
          sku: {
            material: '普通皮-灰色'
          }
        }
      ],
      shippingAddress: {
        name: '王五',
        phone: '13700137000',
        address: '深圳市南山区某某大道789号'
      },
      createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'order_004',
      orderNo: 'ORD-2024-004',
      user: 'user_004',
      status: 'completed',
      totalAmount: 3999,
      paymentMethod: 'alipay',
      items: [
        {
          product: 'prod_004',
          productName: '极简风茶几',
          productImage: 'https://via.placeholder.com/200',
          price: 3999,
          quantity: 1,
          sku: {
            material: '全青皮-黑色'
          }
        }
      ],
      shippingAddress: {
        name: '赵六',
        phone: '13600136000',
        address: '杭州市西湖区某某街101号'
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'order_005',
      orderNo: 'ORD-2024-005',
      user: 'user_005',
      status: 'processing',
      totalAmount: 15999,
      paymentMethod: 'wechat',
      items: [
        {
          product: 'prod_005',
          productName: '中古风书柜',
          productImage: 'https://via.placeholder.com/200',
          price: 15999,
          quantity: 1,
          sku: {
            material: '普通皮-红色'
          }
        }
      ],
      shippingAddress: {
        name: '孙七',
        phone: '13500135000',
        address: '成都市武侯区某某路202号'
      },
      createdAt: new Date(now.getTime() - 0.1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 0.1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
}

/**
 * 初始化本地数据
 * 如果 localStorage 中没有订单数据，则创建示例数据
 */
export const initializeLocalData = () => {
  try {
    const stored = localStorage.getItem('local_orders')
    if (!stored) {
      const sampleOrders = createSampleOrders()
      localStorage.setItem('local_orders', JSON.stringify(sampleOrders))
      console.log('✅ 本地订单数据已初始化，共', sampleOrders.length, '个订单')
    }
  } catch (error) {
    console.error('❌ 初始化本地数据失败:', error)
  }
}

/**
 * 清除本地数据
 */
export const clearLocalData = () => {
  try {
    localStorage.removeItem('local_orders')
    console.log('✅ 本地订单数据已清除')
  } catch (error) {
    console.error('❌ 清除本地数据失败:', error)
  }
}

/**
 * 重置本地数据（清除后重新初始化）
 */
export const resetLocalData = () => {
  clearLocalData()
  initializeLocalData()
}
