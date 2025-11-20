import { CustomerOrder, CustomerOrderItem, Order, OrderItem } from '@/types'
import { SimplifiedCartSourceItem } from '@/store/cartStore'

const formatSelections = (selections?: Record<string, string>) => {
  if (!selections) return undefined
  const entries = Object.entries(selections)
  if (!entries.length) return undefined
  return entries.map(([key, value]) => `${key}: ${value}`).join(' | ')
}

const mapCustomerOrderItem = (item: CustomerOrderItem, index: number, orderNo: string): SimplifiedCartSourceItem => ({
  id: item.id || `${orderNo}-customer-item-${index}`,
  name: item.name,
  price: item.price,
  quantity: item.quantity,
  image: item.image,
  description: formatSelections(item.selections),
})

const mapAdminOrderItem = (item: OrderItem, index: number, orderNo: string): SimplifiedCartSourceItem => ({
  id: (typeof item.product === 'object' ? item.product._id : item.product) || `${orderNo}-admin-item-${index}`,
  name: item.productName || (typeof item.product === 'object' ? item.product.name : '订单商品'),
  price: item.price,
  quantity: item.quantity,
  image: item.productImage || (typeof item.product === 'object' ? item.product.images?.[0] : undefined),
  description: item.sku?.material ? `材质：${item.sku.material}` : undefined,
})

export const mapCustomerOrderToCartItems = (order: CustomerOrder): SimplifiedCartSourceItem[] => {
  if (!order.items?.length) return []
  return order.items.map((item, index) => mapCustomerOrderItem(item, index, order.orderNo))
}

export const mapAdminOrderToCartItems = (order: Order): SimplifiedCartSourceItem[] => {
  if (!order.items?.length) return []
  return order.items.map((item, index) => mapAdminOrderItem(item, index, order.orderNo))
}
