const Order = require('../models/Order')
const Cart = require('../models/Cart')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const Product = require('../models/Product')
const Manufacturer = require('../models/Manufacturer')
const Material = require('../models/Material')
const ManufacturerOrder = require('../models/ManufacturerOrder')
const Authorization = require('../models/Authorization')
const { sendNewOrderNotification } = require('./smsService')
const { generateOrderNo, calculatePagination } = require('../utils/helpers')
const { ORDER_STATUS } = require('../config/constants')
const { NotFoundError, ValidationError } = require('../utils/errors')
const { calculateTieredCommissions } = require('./commissionService')

const enrichItemsWithManufacturer = async (items) => {
  const productIds = (items || [])
    .map(i => i.productId || i.product)
    .filter(Boolean)
    .map(String)

  if (productIds.length === 0) return items

  const products = await Product.find({ _id: { $in: productIds } })
    .select('_id manufacturerId')
    .lean()

  const productMap = new Map(products.map(p => [String(p._id), p]))

  const manufacturerIds = products
    .map(p => p.manufacturerId)
    .filter(Boolean)
    .map(String)

  const manufacturers = manufacturerIds.length
    ? await Manufacturer.find({ _id: { $in: manufacturerIds } })
      .select('_id fullName name shortName')
      .lean()
    : []

  const manufacturerNameMap = new Map(
    manufacturers.map(m => [
      String(m._id),
      m.fullName || m.name || m.shortName || ''
    ])
  )

  return (items || []).map(item => {
    const productId = item.productId || item.product
    const p = productId ? productMap.get(String(productId)) : null
    const mid = item.manufacturerId || p?.manufacturerId
    const inferredName = mid ? manufacturerNameMap.get(String(mid)) : undefined

    return {
      ...item,
      productId: item.productId ?? item.product,
      manufacturerId: item.manufacturerId || p?.manufacturerId,
      manufacturerName: item.manufacturerName || inferredName
    }
  })
}

const formatSpecsForManufacturerOrder = (item) => {
  const specs = item?.specifications || item?.specs || {}
  const selected = item?.selectedMaterials || item?.materials || {}

  const kv = []
  for (const [k, v] of Object.entries(specs)) {
    if (v === undefined || v === null || v === '') continue
    kv.push(`${k}:${v}`)
  }
  for (const [k, v] of Object.entries(selected)) {
    if (v === undefined || v === null || v === '') continue
    kv.push(`${k}:${v}`)
  }

  return kv.join(' | ')
}

const dispatchOrderToManufacturers = async (order) => {
  if (!order?._id) return []

  const already = await ManufacturerOrder.findOne({ orderId: order._id }).select('_id').lean()
  if (already) return []

  const items = order.orderType === 'package'
    ? (order.packageInfo?.selections || []).flatMap(s => (s.products || []).map(p => ({
      ...p,
      category: s.categoryName
    })))
    : (order.items || [])

  if (!items.length) return []

  // ★ 关键修复：如果订单有 ownerManufacturerId，说明是授权商品订单
  // 订单应该分配给下单用户所属的厂家（ownerManufacturerId），而不是商品的原始厂家
  let orderOwnerManufacturerId = order.ownerManufacturerId ? String(order.ownerManufacturerId) : null
  let orderOwnerManufacturerName = null
  
  if (orderOwnerManufacturerId) {
    const ownerManufacturer = await Manufacturer.findById(orderOwnerManufacturerId)
      .select('fullName name shortName')
      .lean()
    orderOwnerManufacturerName = ownerManufacturer?.fullName || ownerManufacturer?.name || ownerManufacturer?.shortName || '未知厂家'
    console.log('📦 [Dispatch] 授权商品订单，分配给下单用户厂家:', orderOwnerManufacturerId, orderOwnerManufacturerName)
  }

  let basePriceMap = null
  let totalWeight = 0
  if (order.orderType === 'package') {
    const productIds = items
      .map(i => i.productId || i.product)
      .filter(Boolean)
      .map(String)
    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id basePrice')
      .lean()
    basePriceMap = new Map(products.map(p => [String(p._id), Number(p.basePrice || 0)]))

    for (const item of items) {
      const pid = item.productId || item.product
      const qty = Number(item.quantity || 1)
      const bp = pid ? (basePriceMap.get(String(pid)) || 0) : 0
      const w = bp > 0 ? (bp * qty) : qty
      totalWeight += w
    }
    if (!totalWeight) totalWeight = items.reduce((s, i) => s + Number(i.quantity || 1), 0) || 1
  }

  const groups = new Map()
  for (const item of items) {
    // ★ 关键修复：优先使用订单的 ownerManufacturerId
    const manufacturerId = orderOwnerManufacturerId || item.manufacturerId
    const manufacturerName = orderOwnerManufacturerName || item.manufacturerName

    const key = manufacturerId ? String(manufacturerId) : 'unknown'
    if (!groups.has(key)) {
      groups.set(key, {
        manufacturerId: manufacturerId || null,
        manufacturerName: manufacturerName || '未分配厂家',
        items: [],
        totalAmount: 0,
        weight: 0
      })
    }

    const group = groups.get(key)
    const quantity = Number(item.quantity || 1)

    let derivedPrice = Number(item.price || 0)
    if (order.orderType === 'package' && derivedPrice === 0) {
      const pid = item.productId || item.product
      const bp = pid && basePriceMap ? (basePriceMap.get(String(pid)) || 0) : 0
      if (bp > 0) derivedPrice = bp
    }
    const subtotal = Number(item.subtotal || (derivedPrice * quantity) || 0)

    group.items.push({
      productId: item.productId || item.product,
      productName: item.productName || item.name,
      skuId: item.skuId,
      skuName: item.skuName,
      specs: formatSpecsForManufacturerOrder(item),
      quantity,
      price: derivedPrice,
      subtotal,
      image: item.image
    })

    if (order.orderType === 'package') {
      const pid = item.productId || item.product
      const bp = pid && basePriceMap ? (basePriceMap.get(String(pid)) || 0) : 0
      const w = bp > 0 ? (bp * quantity) : quantity
      group.weight += w
    } else {
      group.totalAmount += subtotal
    }
  }

  if (order.orderType === 'package') {
    const total = Number(order.totalAmount || 0)
    const groupArr = Array.from(groups.values())
    let remaining = total

    for (let i = 0; i < groupArr.length; i += 1) {
      const g = groupArr[i]
      if (i === groupArr.length - 1) {
        g.totalAmount = remaining
      } else {
        const ratio = g.weight / totalWeight
        const allocated = Math.round(total * ratio)
        g.totalAmount = allocated
        remaining -= allocated
      }
    }
  }

  const createdOrders = []
  for (const group of groups.values()) {
    const manufacturerOrder = await ManufacturerOrder.create({
      orderId: order._id,
      orderNo: order.orderNo,
      manufacturerId: group.manufacturerId,
      manufacturerName: group.manufacturerName,
      items: group.items,
      totalAmount: group.totalAmount,
      customerName: order.recipient?.name,
      customerPhone: order.recipient?.phone,
      customerAddress: order.recipient?.address,
      logs: [{
        action: 'dispatch',
        content: '订单已分发',
        operator: '系统',
        createdAt: new Date()
      }]
    })
    createdOrders.push(manufacturerOrder)

    try {
      if (group.manufacturerId) {
        const manufacturer = await Manufacturer.findById(group.manufacturerId)
          .select('settings.smsNotifyPhone')
          .lean()
        const phone = manufacturer?.settings?.smsNotifyPhone
        if (phone) {
          const itemCount = (group.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0)
          const notifyPayload = {
            orderNo: order.orderNo,
            count: String(itemCount || 0),
            amount: String(Number(group.totalAmount || 0)),
            time: new Date().toLocaleString('zh-CN')
          }
          const result = await sendNewOrderNotification(phone, notifyPayload)
          if (!result?.success) {
            console.error('📱 [SMS] 新订单通知发送失败:', { phone, orderNo: order.orderNo, message: result?.message })
          }
        }
      }
    } catch (err) {
      console.error('📱 [SMS] 新订单通知异常:', err)
    }
  }

  await Order.updateOne(
    { _id: order._id },
    { $set: { dispatchStatus: 'dispatched', dispatchedAt: new Date() } }
  )

  return createdOrders
}

const createOrder = async (userId, { 
  items, 
  recipient, 
  couponCode, 
  ownerManufacturerId, 
  needInvoice,
  invoiceInfo,
  invoiceMarkupPercent,
  invoiceMarkupAmount,
  paymentRatioEnabled: inputPaymentRatioEnabled,
  paymentRatio,
  depositAmount: inputDepositAmount,
  finalPaymentAmount: inputFinalPaymentAmount,
  totalAmount: inputTotalAmount,
  subtotal: inputSubtotal
}) => {
  console.log('🛒 [OrderService] createOrder called');
  console.log('🛒 [OrderService] userId:', userId);
  console.log('🛒 [OrderService] userId type:', typeof userId);
  console.log('🛒 [OrderService] items count:', items?.length);
  console.log('🛒 [OrderService] recipient:', recipient);
  console.log('🛒 [OrderService] ownerManufacturerId:', ownerManufacturerId);
  console.log('🛒 [OrderService] paymentRatio:', paymentRatio);
  console.log('🛒 [OrderService] needInvoice:', needInvoice);
  console.log('🛒 [OrderService] invoiceMarkupPercent:', invoiceMarkupPercent);
  console.log('🛒 [OrderService] invoiceMarkupAmount:', invoiceMarkupAmount);
  
  if (!items || items.length === 0) {
    throw new ValidationError('Order must contain at least one item')
  }
  
  // Calculate totals - 使用前端传入的值或重新计算
  let subtotal = inputSubtotal || 0
  if (!subtotal) {
    items.forEach(item => {
      subtotal += item.subtotal || (item.price * item.quantity) || 0
    })
  }
  console.log('🛒 [OrderService] subtotal:', subtotal);
  
  let discountAmount = 0
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, status: 'active' })
    if (coupon) {
      if (coupon.usageCount >= coupon.usageLimit) {
        throw new ValidationError('Coupon usage limit exceeded')
      }
      
      const now = new Date()
      if (now < coupon.validFrom || now > coupon.validTo) {
        throw new ValidationError('Coupon expired')
      }
      
      if (subtotal < coupon.minAmount) {
        throw new ValidationError(`Minimum order amount is ${coupon.minAmount}`)
      }
      
      if (coupon.type === 'fixed') {
        discountAmount = Math.min(coupon.value, subtotal)
      } else if (coupon.type === 'percentage') {
        discountAmount = Math.round(subtotal * coupon.value / 100)
      }
      
      coupon.usageCount += 1
      await coupon.save()
    }
  }

  const enrichedItems = await enrichItemsWithManufacturer(items)

  // 持久化材质图片与描述（用于订单详情/导出）
  try {
    const nameSet = new Set()
    for (const item of (enrichedItems || [])) {
      const selected = item?.selectedMaterials || {}
      for (const v of Object.values(selected)) {
        if (!v) continue
        if (typeof v === 'string') nameSet.add(v)
        else if (Array.isArray(v)) v.filter(Boolean).forEach(n => nameSet.add(n))
      }
    }

    const names = Array.from(nameSet)
    const materials = names.length
      ? await Material.find({ name: { $in: names } }).select('name image description').lean()
      : []
    const materialMap = new Map(materials.map(m => [String(m.name), m]))

    for (const item of (enrichedItems || [])) {
      const selected = item?.selectedMaterials || {}
      const snapshots = []
      for (const [categoryKey, raw] of Object.entries(selected)) {
        if (!raw) continue
        const values = Array.isArray(raw) ? raw : [raw]
        for (const name of values) {
          if (!name) continue
          const m = materialMap.get(String(name))
          snapshots.push({
            categoryKey,
            name: String(name),
            image: m?.image || '',
            description: m?.description || ''
          })
        }
      }
      item.materialSnapshots = snapshots
    }
  } catch (e) {
    console.error('🛒 [OrderService] Failed to build materialSnapshots:', e)
  }

  // 服务端兜底：确保开票加价与总金额计算正确（避免前端因厂家字段缺失导致 invoiceMarkup 变为 0）
  const needInvoiceBool = !!needInvoice
  let effectiveInvoiceMarkupPercent = 0
  let effectiveInvoiceMarkupAmount = 0
  if (needInvoiceBool) {
    const inputPercent = Number(invoiceMarkupPercent)
    const inputAmount = Number(invoiceMarkupAmount)

    let mfrPercent = 0
    try {
      const mid = enrichedItems?.[0]?.manufacturerId
      if (mid) {
        const mfr = await Manufacturer.findById(mid).select('invoiceMarkupPercent').lean()
        if (typeof mfr?.invoiceMarkupPercent === 'number') {
          mfrPercent = mfr.invoiceMarkupPercent
        }
      }
    } catch (e) {
      console.error('🛒 [OrderService] Failed to load manufacturer invoiceMarkupPercent:', e)
    }

    effectiveInvoiceMarkupPercent = Number.isFinite(inputPercent) && inputPercent > 0
      ? inputPercent
      : (mfrPercent > 0 ? mfrPercent : 0)

    effectiveInvoiceMarkupAmount = 0
  }

  // 计算总金额：服务端统一以 subtotal - discount + invoiceMarkup 为准（确保持久化正确）
  let totalAmount = subtotal - discountAmount
  if (inputTotalAmount && Number(inputTotalAmount) > 0 && Number(inputTotalAmount) !== totalAmount) {
    console.log('🛒 [OrderService] totalAmount differs from inputTotalAmount:', { inputTotalAmount, totalAmount })
  }

  console.log('🛒 [OrderService] effective invoice:', {
    needInvoice: needInvoiceBool,
    invoiceMarkupPercent: effectiveInvoiceMarkupPercent,
    invoiceMarkupAmount: effectiveInvoiceMarkupAmount
  })

  const orderNo = generateOrderNo();
  console.log('🛒 [OrderService] Generated orderNo:', orderNo);
  
  // 计算分层返佣
  let commissions = []
  try {
    // 从订单商品中获取厂家ID和公司信息
    const firstItem = enrichedItems[0]
    const itemManufacturerId = firstItem?.manufacturerId ? String(firstItem.manufacturerId) : null
    
    if (itemManufacturerId) {
      // 查找用户的授权信息，获取 tierCompanyId/tierCompanyName
      const auth = await Authorization.findOne({
        $or: [
          { toDesigner: userId },
          { toManufacturer: userId }
        ],
        fromManufacturer: itemManufacturerId,
        status: 'active'
      }).select('tierCompanyId tierCompanyName').lean()
      
      const tierCompanyId = auth?.tierCompanyId ? String(auth.tierCompanyId) : ''
      const tierCompanyName = auth?.tierCompanyName ? String(auth.tierCompanyName) : ''
      
      commissions = await calculateTieredCommissions(
        userId,
        totalAmount,
        itemManufacturerId,
        tierCompanyId,
        tierCompanyName
      )
      
      console.log('💰 [OrderService] Calculated commissions:', commissions.length, 'items')
    }
  } catch (err) {
    console.error('💰 [OrderService] Commission calculation failed:', err)
  }
  
  // 计算付款比例相关金额
  let paymentRatioEnabled = false
  let firstPaymentAmount = totalAmount
  let remainingPaymentAmount = 0
  let remainingPaymentStatus = null
  let depositAmount = 0
  let finalPaymentAmount = 0

  const activityLogs = []
  if (needInvoiceBool) {
    const title = invoiceInfo?.title || ''
    const taxNumber = invoiceInfo?.taxNumber || ''
    activityLogs.push({
      action: 'invoice_requested',
      timestamp: new Date(),
      details: `用户选择需要发票${title ? `，抬头：${title}` : ''}${taxNumber ? `，税号：${taxNumber}` : ''}`,
      operator: 'user'
    })
  }
  
  const order = await Order.create({
    orderNo,
    userId,
    ownerManufacturerId: ownerManufacturerId || null,
    items: enrichedItems,
    subtotal,
    discountAmount,
    totalAmount,
    recipient,
    status: ORDER_STATUS.PENDING_PAYMENT,
    couponCode,
    commissions,
    activityLogs,
    // 开票信息
    needInvoice: needInvoiceBool,
    invoiceInfo: needInvoiceBool ? (invoiceInfo || undefined) : undefined,
    invoiceMarkupPercent: needInvoiceBool ? effectiveInvoiceMarkupPercent : 0,
    invoiceMarkupAmount: 0,
    // 付款比例
    paymentRatioEnabled,
    paymentRatio: 100,
    depositAmount,
    finalPaymentAmount,
    firstPaymentAmount,
    remainingPaymentAmount,
    remainingPaymentStatus
  })
  
  console.log('✅ [OrderService] Order created successfully!');
  console.log('✅ [OrderService] Order ID:', order._id);
  console.log('✅ [OrderService] Order userId:', order.userId);
  console.log('✅ [OrderService] Order status:', order.status);
  
  // Update user stats
  const user = await User.findById(userId)
  if (user) {
    user.totalOrders = (user.totalOrders || 0) + 1
    user.totalSpent = (user.totalSpent || 0) + totalAmount
    await user.save()
  }
  
  // Clear cart
  await Cart.updateOne({ userId }, { items: [] })

  await dispatchOrderToManufacturers(order)
  
  return order
}

const getOrders = async (userId, page = 1, pageSize = 10, status = null, manufacturerIds = null) => {
  console.log('📋 [OrderService] getOrders called:', { userId, page, pageSize, status, manufacturerIds });
  const { skip, pageSize: size } = calculatePagination(page, pageSize)
  
  const query = { isDeleted: { $ne: true } }  // 排除已删除的订单
  // 如果userId为null，查询所有订单（管理员模式）
  if (userId !== null) {
    query.userId = userId
  }
  console.log('📋 [OrderService] query:', query);
  if (status) {
    query.status = status
  }
  
  // 如果指定了厂家ID，返回该厂家拥有的订单 或 包含该厂家商品的订单
  if (manufacturerIds && manufacturerIds.length > 0) {
    const manufacturerIdStrings = manufacturerIds.map(id => id?.toString ? id.toString() : String(id))
    // 同时匹配：ownerManufacturerId（订单归属厂家）或 items.manufacturerId（商品原厂家）
    query.$or = [
      { ownerManufacturerId: { $in: manufacturerIdStrings } },
      { 'items.manufacturerId': { $in: manufacturerIdStrings } }
    ]
    console.log('📋 [OrderService] filtering by manufacturerIds (owner or item):', manufacturerIdStrings)
  }
  
  const total = await Order.countDocuments(query)
  console.log('📋 [OrderService] total orders found:', total);
  
  const orders = await Order.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(size)
    .lean()
  
  console.log('📋 [OrderService] orders returned:', orders.length);
  if (orders.length > 0) {
    console.log('📋 [OrderService] first order:', orders[0]._id, orders[0].status, 'cancelRequest:', orders[0].cancelRequest);
  }
  
  return { orders, total, page, pageSize: size }
}

const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  return order
}

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT && order.status !== ORDER_STATUS.PENDING_SHIPMENT) {
    throw new ValidationError('Cannot cancel order in current status')
  }
  
  // 修改为提交取消请求，需要管理后台确认
  order.cancelRequest = true
  order.cancelRequestedAt = new Date()
  await order.save()
  
  console.log('📝 用户提交取消请求，订单ID:', orderId)
  
  // 发送取消订单通知给管理员和厂家
  try {
    // 获取订单相关的厂家信息
    const manufacturerIds = [...new Set((order.items || []).map(i => i.manufacturerId).filter(Boolean))]
    
    for (const mfId of manufacturerIds) {
      const manufacturer = await Manufacturer.findById(mfId).select('smsPhone settings').lean()
      const smsPhone = manufacturer?.smsPhone || manufacturer?.settings?.phone
      
      if (smsPhone) {
        // 发送短信通知
        sendNewOrderNotification(smsPhone, {
          orderNo: order.orderNo,
          type: 'cancel_request',
          message: `订单${order.orderNo}客户申请取消，请及时处理`
        }).catch(err => console.error('发送取消通知失败:', err))
      }
    }
    
    console.log('📧 已发送订单取消通知')
  } catch (notifyErr) {
    console.error('发送订单取消通知失败:', notifyErr)
  }
  
  return order
}

const confirmReceipt = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  
  if (order.status !== ORDER_STATUS.PENDING_RECEIPT) {
    throw new ValidationError('Order is not in pending receipt status')
  }
  
  order.status = ORDER_STATUS.COMPLETED
  order.completedAt = new Date()
  await order.save()
  
  return order
}

module.exports = {
  createOrder,
  enrichItemsWithManufacturer,
  dispatchOrderToManufacturers,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmReceipt
}
