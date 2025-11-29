import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Download, ArrowLeft, User, Phone, MapPin,
  Package, Clock, CheckCircle2, Truck, AlertCircle, FileText, Trash2, Check, XCircle, X,
  Eye, EyeOff, Edit2, Ban, CreditCard, ChevronDown, MessageSquare, Plus, Tag, Image as ImageIcon, Copy, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { Order, OrderStatus } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

type TabType = 'all' | 'pending' | 'shipping' | 'afterSale'

// 订单状态配置 - 支持数字和字符串状态
const statusConfig: Record<number | string, { label: string; color: string; bgColor: string }> = {
  1: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'pending': { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  2: { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'paid': { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  3: { label: '待发货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'processing': { label: '处理中', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  4: { label: '已发货', color: 'text-green-600', bgColor: 'bg-green-100' },
  'shipped': { label: '已发货', color: 'text-green-600', bgColor: 'bg-green-100' },
  5: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'completed': { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  6: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
  'cancelled': { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
  'refunding': { label: '售后中', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// 隐藏手机号中间4位
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 隐藏地址
const maskAddress = (address: string) => {
  if (!address) return ''
  if (address.length > 15) {
    return address.slice(0, 15) + '******'
  }
  return address
}

export default function OrderManagementNew2() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showCustomerInfo, setShowCustomerInfo] = useState(false) // 客户信息显示状态
  const [showStatusEdit, setShowStatusEdit] = useState(false) // 状态编辑弹窗
  const [showPaymentModal, setShowPaymentModal] = useState(false) // 支付渠道选择弹窗
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('') // 选择的支付方式
  const [showShippingModal, setShowShippingModal] = useState(false) // 发货物流弹窗
  const [shippingInfo, setShippingInfo] = useState({ company: '', trackingNo: '' }) // 物流信息
  const [showCancelModal, setShowCancelModal] = useState(false) // 取消订单弹窗
  const [cancelReason, setCancelReason] = useState('') // 取消原因
  const [showRemarkEdit, setShowRemarkEdit] = useState(false) // 备注编辑
  const [remarkText, setRemarkText] = useState('') // 备注内容
  const [showFollowUpModal, setShowFollowUpModal] = useState(false) // 跟进记录弹窗
  const [followUpText, setFollowUpText] = useState('') // 跟进内容
  const [orderLogs, setOrderLogs] = useState<any[]>([]) // 订单动态记录
  const [isAdmin, setIsAdmin] = useState(true) // 是否超级管理员（后续从用户信息获取）
  
  // 统计数据
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    shipping: 0,
    afterSale: 0
  })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('请先登录')
        navigate('/')
        return
      }
      
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('加载失败')
      }
      
      const data = await response.json()
      const allOrders: Order[] = data.data || []
      
      // 按时间倒序
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setOrders(allOrders)
      
      // 计算统计 - 兼容数字和字符串状态
      setStats({
        all: allOrders.length,
        pending: allOrders.filter(o => o.status === 1 || o.status === 'pending').length,
        shipping: allOrders.filter(o => o.status === 2 || o.status === 3 || o.status === 'paid' || o.status === 'processing').length,
        afterSale: allOrders.filter(o => o.status === 'refunding').length,
      })
    } catch (error) {
      console.error('加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  // 过滤订单 - 兼容数字和字符串状态
  const filteredOrders = orders.filter(order => {
    // 搜索过滤 - 支持订单号和买家名字搜索
    const recipient = order.recipient || order.shippingAddress
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchOrderNo = order.orderNo?.toLowerCase().includes(query)
      const matchName = recipient?.name?.toLowerCase().includes(query)
      if (!matchOrderNo && !matchName) {
        return false
      }
    }
    
    // Tab过滤
    switch (activeTab) {
      case 'pending':
        return order.status === 1 || order.status === 'pending'
      case 'shipping':
        return order.status === 2 || order.status === 3 || order.status === 'paid' || order.status === 'processing'
      case 'afterSale':
        return order.status === 'refunding'
      default:
        return true
    }
  })

  const handleMarkPaid = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'paid' })
      })
      
      if (response.ok) {
        toast.success('已标记为已付款')
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const selectedOrder = orders.find(o => o._id === selectedOrderId)

  // 获取商品列表 - 支持套餐订单和普通订单
  const getProducts = (order: Order) => {
    if (order.orderType === 'package' && order.packageInfo) {
      const products: any[] = []
      order.packageInfo.selections?.forEach((selection: any) => {
        selection.products?.forEach((product: any) => {
          const materials = product.selectedMaterials || product.materials || {}
          const upgradePrices = product.materialUpgradePrices || {}
          
          products.push({
            name: product.productName,
            quantity: product.quantity,
            skuName: product.skuName,
            materials: materials,
            selectedMaterials: {
              fabric: materials.fabric || materials['面料'] || '',
              filling: materials.filling || materials['填充'] || '',
              frame: materials.frame || materials['框架'] || '',
              leg: materials.leg || materials['脚架'] || ''
            },
            materialUpgradePrices: {
              fabric: upgradePrices.fabric || upgradePrices['面料'] || 0,
              filling: upgradePrices.filling || upgradePrices['填充'] || 0,
              frame: upgradePrices.frame || upgradePrices['框架'] || 0,
              leg: upgradePrices.leg || upgradePrices['脚架'] || 0
            },
            upgradePrice: product.upgradePrice || product.materialUpgrade || 0,
            image: product.image,
            category: selection.categoryName
          })
        })
      })
      return products
    } else if (order.items) {
      return order.items.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        materials: item.materials,
        specifications: item.specifications,
        selectedMaterials: item.selectedMaterials,
        materialUpgradePrices: item.materialUpgradePrices,
        image: item.image || item.productImage
      }))
    }
    return []
  }

  // 处理发货
  const handleShip = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 4 }) // 4 = 已发货
      })
      
      if (response.ok) {
        toast.success('订单已发货')
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 更新订单状态
  const handleUpdateStatus = async (orderId: string, newStatus: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        toast.success('状态已更新')
        setShowStatusEdit(false)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 取消订单（带原因）
  const handleCancelOrderWithReason = async (orderId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 6, // 6 = 已取消
          cancelReason: reason
        })
      })
      
      if (response.ok) {
        toast.success('订单已取消')
        setShowCancelModal(false)
        setCancelReason('')
        addOrderLog(orderId, 'cancel', `订单已取消，原因：${reason || '未填写'}`)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 删除订单（移至回收站）
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (response.ok) {
        toast.success('订单已移至回收站')
        setSelectedOrderId(null)
        loadOrders()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 标记付款（带支付渠道）
  const handleMarkPaidWithChannel = async (orderId: string, paymentMethod: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 2, // 2 = 已付款
          paymentMethod: paymentMethod
        })
      })
      
      if (response.ok) {
        const methodLabels: Record<string, string> = { wechat: '微信', alipay: '支付宝', bank: '对公账户' }
        toast.success('已标记为已付款')
        setShowPaymentModal(false)
        setSelectedPaymentMethod('')
        addOrderLog(orderId, 'payment', `订单已付款，支付渠道：${methodLabels[paymentMethod] || paymentMethod}`)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 发货（带物流信息）
  const handleShipWithTracking = async (orderId: string) => {
    if (!shippingInfo.company || !shippingInfo.trackingNo) {
      toast.error('请填写完整的物流信息')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 4, // 4 = 已发货
          shippingCompany: shippingInfo.company,
          trackingNumber: shippingInfo.trackingNo
        })
      })
      
      if (response.ok) {
        toast.success('订单已发货')
        setShowShippingModal(false)
        setShippingInfo({ company: '', trackingNo: '' })
        addOrderLog(orderId, 'ship', `订单已发货，${shippingInfo.company}：${shippingInfo.trackingNo}`)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 完成订单
  const handleCompleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 5 }) // 5 = 已完成
      })
      
      if (response.ok) {
        toast.success('订单已完成')
        addOrderLog(orderId, 'complete', '订单已完成')
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 保存商家备注
  const handleSaveRemark = async (orderId: string, remark: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote: remark })
      })
      
      if (response.ok) {
        toast.success('备注已保存')
        setShowRemarkEdit(false)
        addOrderLog(orderId, 'remark', `更新商家备注：${remark}`)
        loadOrders()
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    }
  }

  // 添加跟进记录
  const handleAddFollowUp = async (orderId: string, content: string) => {
    if (!content.trim()) {
      toast.error('请输入跟进内容')
      return
    }
    // TODO: 调用API保存跟进记录
    addOrderLog(orderId, 'followup', content)
    toast.success('跟进记录已添加')
    setShowFollowUpModal(false)
    setFollowUpText('')
  }

  // 添加订单动态记录（本地模拟，后续改为API）
  const addOrderLog = (orderId: string, type: string, content: string) => {
    const newLog = {
      id: Date.now().toString(),
      orderId,
      type,
      content,
      operator: 'admin', // 后续从用户信息获取
      createdAt: new Date().toISOString()
    }
    setOrderLogs(prev => [newLog, ...prev])
  }

  // 导出订单到Excel
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('没有可导出的订单')
      return
    }
    
    const exportData = filteredOrders.map(order => {
      const products = getProducts(order)
      const status = statusConfig[order.status] || statusConfig[1]
      
      return {
        '订单号': order.orderNo,
        '创建时间': new Date(order.createdAt).toLocaleString('zh-CN'),
        '商品信息': products.map((p: any) => `${p.name}x${p.quantity}`).join('; '),
        '订单状态': status.label,
        '商家备注': (order as any).adminNote || '',
        '物流公司': (order as any).shippingCompany || '',
        '物流单号': (order as any).trackingNumber || '',
      }
    })
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '订单列表')
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 }, // 订单号
      { wch: 20 }, // 创建时间
      { wch: 40 }, // 商品信息
      { wch: 10 }, // 订单状态
      { wch: 30 }, // 商家备注
      { wch: 15 }, // 物流公司
      { wch: 20 }, // 物流单号
    ]
    
    XLSX.writeFile(wb, `订单导出_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
    toast.success(`已导出 ${filteredOrders.length} 条订单`)
  }

  // 导出订单清单图片（包含商品图片、规格、材质、数量等）
  const handleExportImages = async () => {
    if (!selectedOrder) {
      toast.error('请先选择一个订单')
      return
    }
    
    const products = getProducts(selectedOrder)
    if (products.length === 0) {
      toast.error('该订单没有商品')
      return
    }
    
    const recipient = selectedOrder.recipient || (selectedOrder as any).shippingAddress || {}
    const status = statusConfig[selectedOrder.status] || statusConfig[1]
    
    // 创建一个临时的订单详情容器用于生成图片
    const container = document.createElement('div')
    container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 40px; font-family: system-ui, -apple-system, sans-serif;'
    
    container.innerHTML = `
      <div style="border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- 订单头部 -->
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">订单商品清单</h1>
          <p style="margin: 0; opacity: 0.9;">订单号：${selectedOrder.orderNo}</p>
          <p style="margin: 4px 0 0 0; opacity: 0.9;">下单时间：${new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        
        <!-- 商品清单 -->
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📦 商品清单</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">商品图片</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">商品名称</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">规格/材质</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">数量</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((p: any) => {
                const specs = p.specifications || p.specs || {}
                // 每个类别换行显示，使用中文格式
                const specLines = Object.entries(specs).map(([k, v]) => {
                  // 翻译常见的英文key为中文
                  const keyMap: Record<string, string> = {
                    'size': '尺寸',
                    'spec': '规格',
                    'material': '材质',
                    'fabric': '面料',
                    'filling': '填充',
                    'fill': '填充',
                    'frame': '框架',
                    'color': '颜色',
                    'style': '风格',
                    'leg': '脚架',
                    'legs': '脚架',
                    'armrest': '扶手',
                    'cushion': '坐垫',
                    'back': '靠背',
                    'width': '宽度',
                    'height': '高度',
                    'depth': '深度',
                    'length': '长度',
                    'seat': '座位',
                    'base': '底座',
                    'cover': '套面',
                    'inner': '内胆',
                    'support': '支撑',
                    'spring': '弹簧',
                    'foam': '海绵',
                    'wood': '木材',
                    'metal': '金属',
                  }
                  const displayKey = keyMap[k.toLowerCase()] || k
                  return `<div style="margin-bottom: 4px;"><span style="color: #6b7280;">${displayKey}：</span>${v}</div>`
                })
                const specHtml = specLines.length > 0 ? specLines.join('') : (p.spec ? `<div>${p.spec}</div>` : '<div>-</div>')
                return `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle;">
                      ${p.image ? `<img src="${getFileUrl(p.image)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" crossorigin="anonymous" />` : '<div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">无图</div>'}
                    </td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle;">
                      <div style="font-weight: 600; color: #1f2937;">${p.name || '未知商品'}</div>
                    </td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: top; color: #4b5563; font-size: 13px;">
                      ${specHtml}
                    </td>
                    <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #1f2937; vertical-align: middle;">
                      ×${p.quantity || 1}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- 订单状态 -->
        <div style="padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; color: #374151;">订单状态：<span style="color: #3b82f6; font-weight: 600;">${status.label}</span></span>
            <span style="font-size: 14px; color: #6b7280;">共 ${products.length} 件商品</span>
          </div>
          ${(selectedOrder as any).adminNote ? `<p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">商家备注：${(selectedOrder as any).adminNote}</p>` : ''}
        </div>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
    `
    
    document.body.appendChild(container)
    
    try {
      toast.loading('正在生成订单图片...')
      
      // 等待图片加载
      const images = container.querySelectorAll('img')
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) resolve(true)
          else {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(true)
          }
        })
      }))
      
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })
      
      // 下载图片
      const link = document.createElement('a')
      link.download = `订单清单_${selectedOrder.orderNo}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      toast.dismiss()
      toast.success('订单清单图片已导出')
    } catch (error) {
      console.error('生成图片失败:', error)
      toast.dismiss()
      toast.error('生成图片失败')
    } finally {
      document.body.removeChild(container)
    }
  }

  // 记录查看客户信息（数据留痕）
  const handleViewCustomerInfo = async (orderId: string) => {
    // 记录查看敏感信息
    addOrderLog(orderId, 'view_sensitive', '查看了客户敏感信息')
    console.log('查看客户信息留痕:', {
      orderId,
      viewedAt: new Date().toISOString(),
      viewedBy: 'admin' // 后续从用户信息获取
    })
    setShowCustomerInfo(true)
  }

  // 关闭敏感信息显示
  const handleHideCustomerInfo = () => {
    setShowCustomerInfo(false)
  }

  // 订单详情页
  if (selectedOrder) {
    const status = statusConfig[selectedOrder.status] || statusConfig[1]
    const recipient = selectedOrder.recipient || selectedOrder.shippingAddress || { name: '', phone: '', address: '' }
    const shippingAddr = selectedOrder.shippingAddress as any
    const address = (recipient as any).address || 
      (shippingAddr ? [shippingAddr.province, shippingAddr.city, shippingAddr.district, shippingAddr.detail].filter(Boolean).join('') : '')
    const products = getProducts(selectedOrder)
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <div className="bg-white px-6 py-4 border-b">
          <button 
            onClick={() => setSelectedOrderId(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            返回订单列表
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* 订单状态头部 */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm ${selectedOrder.status === 6 || selectedOrder.status === 'cancelled' ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${status.bgColor}`}></span>
                <h1 className={`text-2xl font-bold ${selectedOrder.status === 6 || selectedOrder.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>
                  {status.label}
                </h1>
                <button 
                  onClick={() => setShowStatusEdit(!showStatusEdit)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="编辑状态"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <span className="text-gray-400 text-sm">订单号: {selectedOrder.orderNo}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 待付款 -> 标记已付 */}
                {(selectedOrder.status === 1 || selectedOrder.status === 'pending') && (
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    标记已付
                  </button>
                )}
                {/* 已付款 -> 发货 */}
                {(selectedOrder.status === 2 || selectedOrder.status === 3 || selectedOrder.status === 'paid' || selectedOrder.status === 'processing') && (
                  <button 
                    onClick={() => setShowShippingModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    发货
                  </button>
                )}
                {/* 已发货 -> 完成 */}
                {(selectedOrder.status === 4 || selectedOrder.status === 'shipped') && (
                  <button 
                    onClick={() => handleCompleteOrder(selectedOrder._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    完成订单
                  </button>
                )}
                {/* 取消按钮（非已取消/已完成状态可用） */}
                {selectedOrder.status !== 6 && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 5 && selectedOrder.status !== 'completed' && (
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                  >
                    <Ban className="w-4 h-4" />
                    取消
                  </button>
                )}
                {/* 导出订单清单图片按钮 */}
                <button 
                  onClick={handleExportImages}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  导出清单图片
                </button>
                {/* 删除按钮 */}
                <button 
                  onClick={() => handleDeleteOrder(selectedOrder._id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
            
            {/* 状态编辑下拉 */}
            {showStatusEdit && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-3">选择新状态：</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 1, label: '待付款' },
                    { value: 2, label: '已付款' },
                    { value: 3, label: '待发货' },
                    { value: 4, label: '已发货' },
                    { value: 5, label: '已完成' },
                    { value: 6, label: '已取消' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleUpdateStatus(selectedOrder._id, s.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedOrder.status === s.value 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 客户信息 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">客户信息</h2>
                <span className="text-xs text-gray-400">{showCustomerInfo ? '(已解密)' : '(已加密)'}</span>
              </div>
              <button 
                onClick={() => showCustomerInfo ? handleHideCustomerInfo() : handleViewCustomerInfo(selectedOrder._id)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  showCustomerInfo 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={showCustomerInfo ? '点击隐藏' : '点击查看完整信息'}
              >
                {showCustomerInfo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                <span className="text-xs">{showCustomerInfo ? '隐藏' : '查看'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">联系人</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{recipient.name || '未填写'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">联系电话</span>
                <span className="font-medium">
                  {showCustomerInfo ? recipient.phone : (recipient.phone ? maskPhone(recipient.phone) : '未填写')}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-gray-500">收货地址</span>
                <span className="font-medium">
                  {showCustomerInfo ? address : (address ? maskAddress(address) : '未填写')}
                </span>
              </div>
            </div>
          </div>
          
          {/* 支付渠道选择弹窗 */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">选择支付渠道</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { value: 'wechat', label: '微信支付', icon: '💚' },
                    { value: 'alipay', label: '支付宝', icon: '💙' },
                    { value: 'bank', label: '对公账户', icon: '🏦' },
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setSelectedPaymentMethod(method.value)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                        selectedPaymentMethod === method.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                      {selectedPaymentMethod === method.value && (
                        <Check className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => selectedPaymentMethod && handleMarkPaidWithChannel(selectedOrder._id, selectedPaymentMethod)}
                    disabled={!selectedPaymentMethod}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认付款
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 发货物流弹窗 */}
          {showShippingModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    填写物流信息
                  </h3>
                  <button onClick={() => setShowShippingModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">物流公司</label>
                    <select
                      value={shippingInfo.company}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择物流公司</option>
                      <option value="顺丰速运">顺丰速运</option>
                      <option value="京东物流">京东物流</option>
                      <option value="圆通速递">圆通速递</option>
                      <option value="中通快递">中通快递</option>
                      <option value="韵达快递">韵达快递</option>
                      <option value="申通快递">申通快递</option>
                      <option value="德邦物流">德邦物流</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">快递单号</label>
                    <input
                      type="text"
                      value={shippingInfo.trackingNo}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, trackingNo: e.target.value }))}
                      placeholder="请输入快递单号"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setShowShippingModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleShipWithTracking(selectedOrder._id)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认发货
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 取消订单弹窗 */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    取消订单
                  </h3>
                  <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">确定要取消此订单吗？取消后订单将显示为灰色划线状态。</p>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1.5">取消原因（可选）</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="请输入取消原因..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    返回
                  </button>
                  <button 
                    onClick={() => handleCancelOrderWithReason(selectedOrder._id, cancelReason)}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    确认取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 跟进记录弹窗 */}
          {showFollowUpModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    添加跟进记录
                  </h3>
                  <button onClick={() => setShowFollowUpModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <textarea
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    placeholder="请输入跟进内容..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowFollowUpModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleAddFollowUp(selectedOrder._id, followUpText)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 商家备注 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">商家备注</h2>
              </div>
              <button 
                onClick={() => {
                  setRemarkText((selectedOrder as any).adminNote || '')
                  setShowRemarkEdit(!showRemarkEdit)
                }}
                className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                {showRemarkEdit ? '取消' : '编辑'}
              </button>
            </div>
            {showRemarkEdit ? (
              <div className="space-y-3">
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="添加商家备注，如：客户要求加急处理..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setShowRemarkEdit(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleSaveRemark(selectedOrder._id, remarkText)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    保存备注
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(selectedOrder as any).adminNote ? (
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {(selectedOrder as any).adminNote}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">暂无备注，点击编辑添加</span>
                )}
              </div>
            )}
          </div>

          {/* 买家备注 */}
          {selectedOrder.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-amber-700 font-medium">买家备注</span>
              <span className="text-red-500 ml-3">{selectedOrder.notes}</span>
            </div>
          )}

          {/* 商品清单 */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <Package className="w-5 h-5 text-gray-400" />
              <h2 className="font-medium text-gray-700">商品清单</h2>
            </div>
            
            {/* 套餐标签 */}
            {selectedOrder.orderType === 'package' && selectedOrder.packageInfo && (
              <div className="mx-6 mt-4 px-3 py-2 bg-amber-50 rounded-lg">
                <div className="text-sm font-medium text-amber-800">
                  📦 套餐：{selectedOrder.packageInfo.packageName}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  套餐价：¥{formatPrice(selectedOrder.packageInfo.packagePrice)}
                </div>
              </div>
            )}
            
            <div className="divide-y divide-gray-100">
              {products.map((product, index) => {
                // 收集所有材质信息
                const materials: string[] = []
                if (product.selectedMaterials?.fabric || product.specifications?.material) {
                  materials.push(product.selectedMaterials?.fabric || product.specifications?.material)
                }
                if (product.selectedMaterials?.filling || product.specifications?.fill) {
                  materials.push(product.selectedMaterials?.filling || product.specifications?.fill)
                }
                if (product.selectedMaterials?.frame || product.specifications?.frame) {
                  materials.push(product.selectedMaterials?.frame || product.specifications?.frame)
                }
                if (product.selectedMaterials?.leg || product.specifications?.leg) {
                  materials.push(product.selectedMaterials?.leg || product.specifications?.leg)
                }
                
                // 收集加价信息
                const upgrades: { name: string; price: number }[] = []
                if (product.materialUpgradePrices?.fabric > 0) {
                  upgrades.push({ name: '面料', price: product.materialUpgradePrices.fabric })
                }
                if (product.materialUpgradePrices?.filling > 0) {
                  upgrades.push({ name: '填充', price: product.materialUpgradePrices.filling })
                }
                if (product.materialUpgradePrices?.frame > 0) {
                  upgrades.push({ name: '框架', price: product.materialUpgradePrices.frame })
                }
                if (product.materialUpgradePrices?.leg > 0) {
                  upgrades.push({ name: '脚架', price: product.materialUpgradePrices.leg })
                }
                
                return (
                  <div key={index} className="flex items-start gap-4 px-6 py-5">
                    {/* 商品图片 */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image ? (
                        <img 
                          src={getFileUrl(product.image)} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-600">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.skuName || '标准款'} / {product.specifications?.color || '默认'}
                      </p>
                      
                      {/* 标签区域 */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* 尺寸标签 */}
                        {product.specifications?.size && (
                          <span className="px-2.5 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
                            {product.specifications.size}
                          </span>
                        )}
                        
                        {/* 材质标签 */}
                        {materials.map((mat, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
                            {mat}
                          </span>
                        ))}
                      </div>
                      
                      {/* 加价信息 */}
                      {(upgrades.length > 0 || product.upgradePrice > 0) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {upgrades.map((up, i) => (
                            <span key={i} className="text-xs text-red-600">
                              {up.name} +¥{up.price}
                            </span>
                          ))}
                          {product.upgradePrice > 0 && upgrades.length === 0 && (
                            <span className="text-xs text-red-600">加价 +¥{product.upgradePrice}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 数量 */}
                    <div className="text-gray-400 text-sm flex-shrink-0">
                      x{product.quantity}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* 订单金额 */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">商品小计</span>
                <span className="text-gray-800">¥{formatPrice(selectedOrder.subtotal || selectedOrder.totalAmount)}</span>
              </div>
              {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">优惠</span>
                  <span className="text-red-500">-¥{formatPrice(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-800 font-medium">订单总额</span>
                <span className="text-red-600 text-2xl font-bold">¥{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 订单动态 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">订单动态</h2>
              </div>
              <button 
                onClick={() => setShowFollowUpModal(true)}
                className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加跟进
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {/* 系统动态 */}
              <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400 text-xs">{new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</span>
                  <p className="text-gray-600">订单创建</p>
                </div>
              </div>
              {selectedOrder.paidAt && (
                <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(selectedOrder.paidAt).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">订单已付款 {selectedOrder.paymentMethod && `（${selectedOrder.paymentMethod === 'wechat' ? '微信' : selectedOrder.paymentMethod === 'alipay' ? '支付宝' : '对公账户'}）`}</p>
                  </div>
                </div>
              )}
              {selectedOrder.shippedAt && (
                <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <Truck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(selectedOrder.shippedAt).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">订单已发货 {selectedOrder.trackingNumber && `（${selectedOrder.trackingNumber}）`}</p>
                  </div>
                </div>
              )}
              {selectedOrder.completedAt && (
                <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(selectedOrder.completedAt).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">订单已完成</p>
                  </div>
                </div>
              )}
              
              {/* 订单日志记录 */}
              {orderLogs
                .filter(log => log.orderId === selectedOrder._id)
                .filter(log => {
                  // 非管理员看不到查看敏感信息的记录
                  if (log.type === 'view_sensitive' && !isAdmin) return false
                  return true
                })
                .map(log => (
                  <div key={log.id} className="text-sm flex items-start gap-2 pb-3 border-b border-gray-100">
                    {log.type === 'followup' && <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'remark' && <Tag className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'cancel' && <Ban className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'payment' && <CreditCard className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'ship' && <Truck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'complete' && <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'view_sensitive' && <Eye className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <div>
                      <span className="text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                      <p className={`${log.type === 'view_sensitive' ? 'text-red-600' : 'text-gray-600'}`}>{log.content}</p>
                      <span className="text-xs text-gray-400">操作人: {log.operator}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 订单列表页
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 统计Tab */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'all' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">全部</p>
          <p className="text-2xl font-bold mt-1">{stats.all}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'pending' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">待付款</p>
          <p className="text-2xl font-bold mt-1">{stats.pending}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'shipping' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">待发货</p>
          <p className="text-2xl font-bold mt-1">{stats.shipping}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('afterSale')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'afterSale' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">售后</p>
          <p className="text-2xl font-bold mt-1">{stats.afterSale}</p>
        </button>
      </div>

      {/* 搜索和操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">支付方式</option>
            <option value="wechat">微信支付</option>
            <option value="alipay">支付宝</option>
            <option value="bank">银行转账</option>
          </select>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
        
        <button 
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          导出表格
        </button>
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">订单信息</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">买家</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">商家备注 (REMARKS)</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">金额</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                  暂无订单数据
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const status = statusConfig[order.status] || statusConfig[1]
                // 获取买家名字 - 兼容recipient和shippingAddress
                const recipient = order.recipient || order.shippingAddress
                const buyerName = recipient?.name || '未知'
                const buyerInitial = buyerName.charAt(0)
                
                return (
                  <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrderId(order._id)}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrderId(order._id)
                            }}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {order.orderNo}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // 复制订单信息
                              const r = (order.recipient || order.shippingAddress) as any
                              const address = r?.address || 
                                [r?.province, r?.city, r?.district, r?.detail].filter(Boolean).join('')
                              const products = (order.items || (order as any).products || []).map((p: any) => 
                                `${p.name || p.productName} x${p.quantity || 1}`
                              ).join('\n')
                              const orderInfo = `订单号：${order.orderNo}\n收件人：${r?.name || ''}\n电话：${r?.phone || ''}\n地址：${address}\n商品：\n${products}\n总金额：¥${formatPrice(order.totalAmount)}`
                              navigator.clipboard.writeText(orderInfo)
                              toast.success('订单信息已复制')
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="复制订单信息"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('zh-CN')} · 共 {order.items?.length || 0} 件
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                          {buyerInitial}
                        </div>
                        <span className="font-medium">{buyerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 truncate max-w-[200px]">
                        {order.notes || '添加备注...'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600">
                        ¥{formatPrice(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedOrderId(order._id)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
