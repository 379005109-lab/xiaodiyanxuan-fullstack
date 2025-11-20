/**
 * 测试数据初始化脚本
 * 用于创建测试客户和订单数据
 */

import { User, CustomerOrder } from '@/types'

/**
 * 初始化测试客户数据
 */
export const initTestCustomer = () => {
  const testCustomer: User = {
    _id: 'test-customer-001',
    username: '丫丫',
    email: 'yaya@test.com',
    phone: '13875695196',
    role: 'customer',
    avatar: '/placeholder.svg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    balance: 0,
  }

  // 保存到localStorage
  const users = JSON.parse(localStorage.getItem('test_users') || '[]')
  const existingIndex = users.findIndex((u: User) => u._id === testCustomer._id)
  
  if (existingIndex >= 0) {
    users[existingIndex] = testCustomer
  } else {
    users.push(testCustomer)
  }
  
  localStorage.setItem('test_users', JSON.stringify(users))
  console.log('✅ 测试客户已创建/更新:', testCustomer)
  
  return testCustomer
}

/**
 * 创建测试订单（后台推送）
 */
export const createTestBackendOrder = () => {
  const testOrder: CustomerOrder = {
    id: 'test-order-backend-001',
    orderNo: `TEST${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`,
    title: '丫丫定制',
    status: 'pending',
    source: 'backend',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalAmount: 5999,
    items: [
      {
        id: 'item-1',
        name: '北欧简约沙发',
        type: 'product',
        image: '/placeholder.svg',
        quantity: 1,
        price: 3999,
        selections: {
          '颜色': '灰色',
          '尺寸': '2.5米',
        },
      },
      {
        id: 'item-2',
        name: '定制茶几',
        type: 'product',
        image: '/placeholder.svg',
        quantity: 1,
        price: 2000,
        selections: {
          '材质': '实木',
        },
      },
    ],
    note: '这是一个后台推送的测试订单',
    address: '浙江省杭州市西湖区',
    phone: '13875695196',
    contactName: '丫丫',
  }

  // 保存到localStorage
  const orders = JSON.parse(localStorage.getItem('customer_orders') || '[]')
  orders.unshift(testOrder)
  localStorage.setItem('customer_orders', JSON.stringify(orders))
  
  console.log('✅ 后台推送测试订单已创建:', testOrder)
  
  return testOrder
}

/**
 * 创建测试订单（客户自己下单）
 */
export const createTestSelfOrder = () => {
  const testOrder: CustomerOrder = {
    id: 'test-order-self-001',
    orderNo: `SELF${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`,
    title: '丫丫自己下单',
    status: 'pending',
    source: 'self',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalAmount: 8999,
    items: [
      {
        id: 'item-3',
        name: '现代风格床架',
        type: 'product',
        image: '/placeholder.svg',
        quantity: 1,
        price: 5999,
        selections: {
          '颜色': '白色',
          '尺寸': '1.8米',
        },
      },
      {
        id: 'item-4',
        name: '床头柜',
        type: 'product',
        image: '/placeholder.svg',
        quantity: 2,
        price: 1500,
        selections: {
          '材质': '橡木',
        },
      },
    ],
    note: '这是一个客户自己下单的测试订单',
    address: '浙江省杭州市西湖区',
    phone: '13875695196',
    contactName: '丫丫',
  }

  // 保存到localStorage
  const orders = JSON.parse(localStorage.getItem('customer_orders') || '[]')
  orders.unshift(testOrder)
  localStorage.setItem('customer_orders', JSON.stringify(orders))
  
  console.log('✅ 客户自己下单测试订单已创建:', testOrder)
  
  return testOrder
}

/**
 * 初始化所有测试数据
 */
export const initAllTestData = () => {
  console.log('🚀 开始初始化测试数据...')
  
  const customer = initTestCustomer()
  const backendOrder = createTestBackendOrder()
  const selfOrder = createTestSelfOrder()
  
  console.log('✅ 所有测试数据初始化完成！')
  console.log('📋 测试客户信息:')
  console.log('   - 用户名: 丫丫')
  console.log('   - 电话: 13875695196')
  console.log('   - 邮箱: yaya@test.com')
  console.log('📦 已创建2个测试订单:')
  console.log('   1. 后台推送订单 (source: backend)')
  console.log('   2. 客户自己下单 (source: self)')
  
  return {
    customer,
    backendOrder,
    selfOrder,
  }
}

/**
 * 获取测试客户
 */
export const getTestCustomer = (): User | null => {
  const users = JSON.parse(localStorage.getItem('test_users') || '[]')
  return users.find((u: User) => u._id === 'test-customer-001') || null
}

/**
 * 获取所有测试订单
 */
export const getTestOrders = (): CustomerOrder[] => {
  const orders = JSON.parse(localStorage.getItem('customer_orders') || '[]')
  return orders.filter((o: CustomerOrder) => o.id.startsWith('test-order-'))
}

/**
 * 清理所有测试数据
 */
export const clearTestData = () => {
  localStorage.removeItem('test_users')
  const orders = JSON.parse(localStorage.getItem('customer_orders') || '[]')
  const filteredOrders = orders.filter((o: CustomerOrder) => !o.id.startsWith('test-order-'))
  localStorage.setItem('customer_orders', JSON.stringify(filteredOrders))
  
  console.log('✅ 测试数据已清理')
}
