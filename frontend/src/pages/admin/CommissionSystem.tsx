import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Plus, ChevronDown, ChevronRight, Edit, Trash2, Loader2, 
  Building2, Users, ArrowLeft, Eye, EyeOff, Settings,
  TrendingUp, Percent, AlertCircle
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

// 渠道类型定义
const CHANNEL_TYPES = {
  c_end: { label: 'C端业主', color: 'bg-blue-100 text-blue-800' },
  designer: { label: '设计师', color: 'bg-purple-100 text-purple-800' },
  franchise: { label: '加盟渠道', color: 'bg-green-100 text-green-800' },
  flagship: { label: '高定旗舰店', color: 'bg-orange-100 text-orange-800' },
  b_end: { label: 'B端渠道', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-800' }
}

interface ChannelNode {
  _id: string
  code: string
  name: string
  type: keyof typeof CHANNEL_TYPES
  parentId: string | null
  level: number
  commissionRate: number
  allocatedRate: number
  availableRate: number
  contact?: {
    name?: string
    phone?: string
    email?: string
  }
  createdBy?: {
    _id: string
    username: string
    nickname?: string
  }
  isActive: boolean
  children?: ChannelNode[]
  _hiddenInfo?: boolean
  createdAt: string
}

interface CommissionSystemData {
  _id: string
  manufacturerId: string
  manufacturerName: string
  manufacturerCode: string
  totalMarginRate: number
  marginType: 'fixed' | 'variable'
  factoryRetainRate: number
  allocatedRate: number
  availableRate: number
  status: string
}

export default function CommissionSystem() {
  const { manufacturerId } = useParams<{ manufacturerId: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [system, setSystem] = useState<CommissionSystemData | null>(null)
  const [channels, setChannels] = useState<ChannelNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const [manufacturer, setManufacturer] = useState<any>(null)
  
  // 模态框状态
  const [showSystemModal, setShowSystemModal] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelNode | null>(null)
  const [parentChannel, setParentChannel] = useState<ChannelNode | null>(null)
  
  // 表单数据
  const [systemForm, setSystemForm] = useState({
    manufacturerCode: '',
    totalMarginRate: 40,
    factoryRetainRate: 0
  })
  
  const [channelForm, setChannelForm] = useState({
    name: '',
    type: 'designer' as keyof typeof CHANNEL_TYPES,
    commissionRate: 0,
    contactName: '',
    contactPhone: '',
    notes: ''
  })

  useEffect(() => {
    if (manufacturerId) {
      fetchData()
    }
  }, [manufacturerId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/commission-system/manufacturer/${manufacturerId}`)
      
      if (response.data.exists) {
        setSystem(response.data.system)
        setChannels(response.data.channels || [])
        setIsAdmin(response.data.isAdmin || response.data.isManufacturerOwner)
      } else {
        setManufacturer(response.data.manufacturer)
        setSystemForm(prev => ({
          ...prev,
          manufacturerCode: response.data.manufacturer.code || ''
        }))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSystem = async () => {
    try {
      await apiClient.post(`/commission-system/manufacturer/${manufacturerId}`, systemForm)
      toast.success('分成体系创建成功')
      setShowSystemModal(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleUpdateSystem = async () => {
    try {
      await apiClient.put(`/commission-system/manufacturer/${manufacturerId}`, systemForm)
      toast.success('分成体系更新成功')
      setShowSystemModal(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新失败')
    }
  }

  const handleCreateChannel = async () => {
    try {
      const payload = {
        name: channelForm.name,
        type: channelForm.type,
        parentId: parentChannel?._id || null,
        commissionRate: channelForm.commissionRate,
        contact: {
          name: channelForm.contactName,
          phone: channelForm.contactPhone
        },
        notes: channelForm.notes
      }
      
      const response = await apiClient.post(
        `/commission-system/manufacturer/${manufacturerId}/channels`, 
        payload
      )
      
      toast.success(`渠道创建成功，编码: ${response.data.generatedCode}`)
      setShowChannelModal(false)
      resetChannelForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleUpdateChannel = async () => {
    if (!editingChannel) return
    
    try {
      await apiClient.put(`/commission-system/channels/${editingChannel._id}`, {
        name: channelForm.name,
        commissionRate: channelForm.commissionRate,
        contact: {
          name: channelForm.contactName,
          phone: channelForm.contactPhone
        },
        notes: channelForm.notes
      })
      
      toast.success('渠道更新成功')
      setShowChannelModal(false)
      setEditingChannel(null)
      resetChannelForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新失败')
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('确定要删除此渠道吗？')) return
    
    try {
      await apiClient.delete(`/commission-system/channels/${channelId}`)
      toast.success('渠道删除成功')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const openCreateChannelModal = (parent: ChannelNode | null = null) => {
    setParentChannel(parent)
    setEditingChannel(null)
    resetChannelForm()
    
    // 计算可分配比例
    const maxRate = parent 
      ? parent.commissionRate - parent.allocatedRate
      : (system?.availableRate || 0)
    
    setChannelForm(prev => ({
      ...prev,
      commissionRate: Math.min(10, maxRate)
    }))
    
    setShowChannelModal(true)
  }

  const openEditChannelModal = (channel: ChannelNode) => {
    setEditingChannel(channel)
    setParentChannel(null)
    setChannelForm({
      name: channel.name,
      type: channel.type,
      commissionRate: channel.commissionRate,
      contactName: channel.contact?.name || '',
      contactPhone: channel.contact?.phone || '',
      notes: ''
    })
    setShowChannelModal(true)
  }

  const resetChannelForm = () => {
    setChannelForm({
      name: '',
      type: 'designer',
      commissionRate: 0,
      contactName: '',
      contactPhone: '',
      notes: ''
    })
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const getMaxCommissionRate = () => {
    if (editingChannel) {
      // 编辑时，最大值 = 当前值 + 可用值
      return editingChannel.commissionRate + (editingChannel.availableRate || 0)
    }
    if (parentChannel) {
      return parentChannel.commissionRate - parentChannel.allocatedRate
    }
    return system?.availableRate || 0
  }

  // 渲染渠道树节点
  const renderChannelNode = (node: ChannelNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node._id)
    const typeInfo = CHANNEL_TYPES[node.type] || CHANNEL_TYPES.other
    const isHidden = node._hiddenInfo
    
    return (
      <div key={node._id} className="border-l-2 border-gray-200">
        <div 
          className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
            depth > 0 ? 'ml-6' : ''
          }`}
        >
          {/* 展开/折叠按钮 */}
          <button
            onClick={() => toggleNode(node._id)}
            className={`p-1 rounded hover:bg-gray-200 ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {/* 渠道信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{node.name}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {isHidden && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <EyeOff className="w-3 h-3" /> 信息已隐藏
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {node.code}
              </span>
              {!isHidden && (
                <>
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    分成: <span className="font-medium text-green-600">{node.commissionRate}%</span>
                  </span>
                  <span>
                    已分配: {node.allocatedRate}% / 可分配: {node.commissionRate - node.allocatedRate}%
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          {!isHidden && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openCreateChannelModal(node)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="添加下级渠道"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEditChannelModal(node)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                title="编辑"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteChannel(node._id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className="pl-4">
            {node.children!.map(child => renderChannelNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // 未创建分成体系
  if (!system) {
    return (
      <div className="p-6">
        <button 
          onClick={() => navigate('/admin/manufacturers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回厂家管理
        </button>
        
        <div className="max-w-xl mx-auto mt-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {manufacturer?.name || '厂家'} 尚未创建分成体系
          </h2>
          <p className="text-gray-500 mb-6">
            创建分成体系后，可以管理多级渠道的分成规则
          </p>
          <button
            onClick={() => setShowSystemModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            创建分成体系
          </button>
        </div>
        
        {/* 创建体系模态框 */}
        {showSystemModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">创建分成体系</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    厂家代码 <span className="text-gray-400">(用于生成渠道编码)</span>
                  </label>
                  <input
                    type="text"
                    value={systemForm.manufacturerCode}
                    onChange={e => setSystemForm(prev => ({ 
                      ...prev, 
                      manufacturerCode: e.target.value.toUpperCase() 
                    }))}
                    placeholder="如: GS (各色)"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    maxLength={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总毛利率 (%)
                  </label>
                  <input
                    type="number"
                    value={systemForm.totalMarginRate}
                    onChange={e => setSystemForm(prev => ({ 
                      ...prev, 
                      totalMarginRate: Number(e.target.value) 
                    }))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    这是分成的总池，所有渠道的分成都从这个比例中分配
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    厂家自留比例 (%)
                  </label>
                  <input
                    type="number"
                    value={systemForm.factoryRetainRate}
                    onChange={e => setSystemForm(prev => ({ 
                      ...prev, 
                      factoryRetainRate: Number(e.target.value) 
                    }))}
                    min={0}
                    max={systemForm.totalMarginRate}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSystemModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateSystem}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/manufacturers')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {system.manufacturerName} - 分成体系
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              厂家代码: {system.manufacturerCode} | 版本: v1.0
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => {
                setSystemForm({
                  manufacturerCode: system.manufacturerCode,
                  totalMarginRate: system.totalMarginRate,
                  factoryRetainRate: system.factoryRetainRate
                })
                setShowSystemModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              体系设置
            </button>
          )}
          <button
            onClick={() => openCreateChannelModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            新建一级渠道
          </button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">总毛利池</div>
          <div className="text-2xl font-bold text-gray-900">{system.totalMarginRate}%</div>
          <div className="text-xs text-gray-400 mt-1">固定毛利率</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">厂家自留</div>
          <div className="text-2xl font-bold text-blue-600">{system.factoryRetainRate}%</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">已分配</div>
          <div className="text-2xl font-bold text-orange-600">{system.allocatedRate}%</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">可分配</div>
          <div className="text-2xl font-bold text-green-600">{system.availableRate}%</div>
        </div>
      </div>
      
      {/* 渠道树 */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            渠道层级结构
          </h2>
          <div className="flex items-center gap-2 text-sm">
            {Object.entries(CHANNEL_TYPES).map(([key, { label, color }]) => (
              <span key={key} className={`px-2 py-0.5 rounded text-xs ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
        
        <div className="p-4">
          {channels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>暂无渠道，点击上方按钮创建一级渠道</p>
            </div>
          ) : (
            <div className="space-y-1">
              {channels.map(node => renderChannelNode(node))}
            </div>
          )}
        </div>
      </div>
      
      {/* 体系设置模态框 */}
      {showSystemModal && system && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">编辑分成体系</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厂家代码
                </label>
                <input
                  type="text"
                  value={systemForm.manufacturerCode}
                  onChange={e => setSystemForm(prev => ({ 
                    ...prev, 
                    manufacturerCode: e.target.value.toUpperCase() 
                  }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  maxLength={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  总毛利率 (%)
                </label>
                <input
                  type="number"
                  value={systemForm.totalMarginRate}
                  onChange={e => setSystemForm(prev => ({ 
                    ...prev, 
                    totalMarginRate: Number(e.target.value) 
                  }))}
                  min={system.allocatedRate + system.factoryRetainRate}
                  max={100}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  最小值: {system.allocatedRate + system.factoryRetainRate}% (已分配 + 厂家自留)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厂家自留比例 (%)
                </label>
                <input
                  type="number"
                  value={systemForm.factoryRetainRate}
                  onChange={e => setSystemForm(prev => ({ 
                    ...prev, 
                    factoryRetainRate: Number(e.target.value) 
                  }))}
                  min={0}
                  max={systemForm.totalMarginRate - system.allocatedRate}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSystemModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleUpdateSystem}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 渠道模态框 */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingChannel ? '编辑渠道' : (parentChannel ? `新建下级渠道 (上级: ${parentChannel.name})` : '新建一级渠道')}
            </h3>
            
            {/* 可分配提示 */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p>当前可分配比例: <strong>{getMaxCommissionRate()}%</strong></p>
                {parentChannel && (
                  <p className="mt-1 text-blue-600">
                    上级渠道 "{parentChannel.name}" 分成 {parentChannel.commissionRate}%，已分配 {parentChannel.allocatedRate}%
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  渠道名称 *
                </label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={e => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如: 张三工作室"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              {!editingChannel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    渠道类型 *
                  </label>
                  <select
                    value={channelForm.type}
                    onChange={e => setChannelForm(prev => ({ 
                      ...prev, 
                      type: e.target.value as keyof typeof CHANNEL_TYPES 
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {Object.entries(CHANNEL_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    类型将用于生成渠道编码，创建后不可修改
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分成比例 (%) *
                </label>
                <input
                  type="number"
                  value={channelForm.commissionRate}
                  onChange={e => setChannelForm(prev => ({ 
                    ...prev, 
                    commissionRate: Math.min(Number(e.target.value), getMaxCommissionRate())
                  }))}
                  min={0}
                  max={getMaxCommissionRate()}
                  step={0.1}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  最大可设置: {getMaxCommissionRate()}%
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系人
                  </label>
                  <input
                    type="text"
                    value={channelForm.contactName}
                    onChange={e => setChannelForm(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="联系人姓名"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话
                  </label>
                  <input
                    type="text"
                    value={channelForm.contactPhone}
                    onChange={e => setChannelForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="手机号码"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={channelForm.notes}
                  onChange={e => setChannelForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChannelModal(false)
                  setEditingChannel(null)
                  setParentChannel(null)
                  resetChannelForm()
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={editingChannel ? handleUpdateChannel : handleCreateChannel}
                disabled={!channelForm.name || channelForm.commissionRate <= 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingChannel ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
