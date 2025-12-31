import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronRight, Edit, Trash2, Loader2, Info } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

interface ProfitDistribution {
  role: string
  roleCode: string
  percentage: number
  type: 'gross_margin' | 'fixed' | 'tiered'
}

interface SubRule {
  _id?: string
  code: string
  channelPath: string
  channelType: string
  description?: string
  profitDistribution: ProfitDistribution[]
  isActive: boolean
}

interface Channel {
  _id?: string
  index: number
  code: string
  name: string
  type: string
  grossMargin: number
  description?: string
  subRules: SubRule[]
  expanded?: boolean
  isActive: boolean
}

interface CommissionRule {
  _id?: string
  manufacturerId: string
  manufacturerName: string
  manufacturerCode: string
  channels: Channel[]
  status: string
}

interface Manufacturer {
  _id: string
  name: string
  fullName?: string
  shortName?: string
  code?: string
}

export default function CommissionRules() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('')
  const [rule, setRule] = useState<CommissionRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set())
  
  // 弹窗状态
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [channelForm, setChannelForm] = useState({
    code: '',
    name: '',
    type: '2C',
    grossMargin: 40,
    description: ''
  })
  
  const [showSubRuleModal, setShowSubRuleModal] = useState(false)
  const [editingSubRule, setEditingSubRule] = useState<{ channelId: string; subRule: SubRule | null }>({ channelId: '', subRule: null })
  const [subRuleForm, setSubRuleForm] = useState({
    code: '',
    channelPath: '',
    channelType: 'direct',
    description: '',
    profitDistribution: [
      { role: 'Factory', roleCode: 'F', percentage: 40, type: 'gross_margin' as const }
    ]
  })

  // 加载厂家列表
  useEffect(() => {
    fetchManufacturers()
  }, [])

  // 当选择厂家变化时加载分成规则
  useEffect(() => {
    if (selectedManufacturer) {
      fetchRule(selectedManufacturer)
    }
  }, [selectedManufacturer])

  const fetchManufacturers = async () => {
    try {
      const response = await apiClient.get('/manufacturers/all')
      const list = response.data.data || []
      setManufacturers(list)
      if (list.length > 0) {
        setSelectedManufacturer(list[0]._id)
      }
    } catch (error) {
      console.error('获取厂家列表失败:', error)
      toast.error('获取厂家列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRule = async (manufacturerId: string) => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/commission-rules/manufacturer/${manufacturerId}`)
      setRule(response.data.data)
    } catch (error) {
      console.error('获取分成规则失败:', error)
      setRule(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => {
      const next = new Set(prev)
      if (next.has(channelId)) {
        next.delete(channelId)
      } else {
        next.add(channelId)
      }
      return next
    })
  }

  const openAddChannelModal = () => {
    setEditingChannel(null)
    setChannelForm({
      code: '',
      name: '',
      type: '2C',
      grossMargin: 40,
      description: ''
    })
    setShowChannelModal(true)
  }

  const openEditChannelModal = (channel: Channel) => {
    setEditingChannel(channel)
    setChannelForm({
      code: channel.code,
      name: channel.name,
      type: channel.type,
      grossMargin: channel.grossMargin,
      description: channel.description || ''
    })
    setShowChannelModal(true)
  }

  const handleSaveChannel = async () => {
    if (!selectedManufacturer) return
    if (!channelForm.code.trim() || !channelForm.name.trim()) {
      toast.error('请填写渠道代码和名称')
      return
    }

    try {
      setSaving(true)
      if (editingChannel?._id) {
        await apiClient.put(`/commission-rules/manufacturer/${selectedManufacturer}/channels/${editingChannel._id}`, channelForm)
        toast.success('渠道更新成功')
      } else {
        await apiClient.post(`/commission-rules/manufacturer/${selectedManufacturer}/channels`, {
          ...channelForm,
          subRules: [],
          isActive: true
        })
        toast.success('渠道添加成功')
      }
      setShowChannelModal(false)
      fetchRule(selectedManufacturer)
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!selectedManufacturer) return
    if (!confirm('确定要删除该渠道吗？')) return

    try {
      await apiClient.delete(`/commission-rules/manufacturer/${selectedManufacturer}/channels/${channelId}`)
      toast.success('渠道已删除')
      fetchRule(selectedManufacturer)
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const openAddSubRuleModal = (channelId: string) => {
    setEditingSubRule({ channelId, subRule: null })
    setSubRuleForm({
      code: '',
      channelPath: '',
      channelType: 'direct',
      description: '',
      profitDistribution: [
        { role: 'Factory', roleCode: 'F', percentage: 40, type: 'gross_margin' }
      ]
    })
    setShowSubRuleModal(true)
  }

  const handleSaveSubRule = async () => {
    if (!selectedManufacturer || !editingSubRule.channelId) return
    if (!subRuleForm.code.trim() || !subRuleForm.channelPath.trim()) {
      toast.error('请填写规则代码和渠道路径')
      return
    }

    try {
      setSaving(true)
      await apiClient.post(
        `/commission-rules/manufacturer/${selectedManufacturer}/channels/${editingSubRule.channelId}/sub-rules`,
        { ...subRuleForm, isActive: true }
      )
      toast.success('子规则添加成功')
      setShowSubRuleModal(false)
      fetchRule(selectedManufacturer)
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const getChannelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '2C': '直接客户',
      '2F': '加盟商渠道',
      '2D': '设计师渠道',
      '2S': '高定旗舰店',
      '2B': 'B端渠道',
      'other': '其他'
    }
    return labels[type] || type
  }

  const getChannelTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '2C': 'bg-purple-100 text-purple-700 border-purple-200',
      '2F': 'bg-blue-100 text-blue-700 border-blue-200',
      '2D': 'bg-orange-100 text-orange-700 border-orange-200',
      '2S': 'bg-green-100 text-green-700 border-green-200',
      '2B': 'bg-pink-100 text-pink-700 border-pink-200',
      'other': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[type] || colors['other']
  }

  const currentManufacturer = manufacturers.find(m => m._id === selectedManufacturer)

  return (
    <div className="p-6">
      {/* 标题区 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分成规则体系</h1>
        <p className="text-sm text-gray-500 mt-1">
          可视化管理"各色/诗歌/科凡/美的"的全链路分润逻辑
        </p>
      </div>

      {/* 厂家 Tab 切换 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {manufacturers.map((manufacturer) => (
            <button
              key={manufacturer._id}
              onClick={() => setSelectedManufacturer(manufacturer._id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedManufacturer === manufacturer._id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {manufacturer.fullName || manufacturer.name}
              {manufacturer.shortName && (
                <span className="ml-1 text-gray-400">({manufacturer.shortName})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {/* 规则标题 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-lg">≋</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentManufacturer?.fullName || currentManufacturer?.name || '厂家'} 
                {currentManufacturer?.shortName && (
                  <span className="text-gray-400 ml-1">({currentManufacturer.shortName})</span>
                )}
                {' '}分成逻辑全景图
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openAddChannelModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                添加渠道
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
                <Info className="w-4 h-4" />
                点击节点展开详情
              </button>
            </div>
          </div>

          {/* 渠道列表 */}
          {(!rule || rule.channels.length === 0) ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-4">暂未配置分成规则</p>
              <button
                onClick={openAddChannelModal}
                className="text-primary hover:underline"
              >
                点击添加第一个渠道
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rule.channels.map((channel, idx) => (
                <div key={channel._id || idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* 渠道头部 */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => channel._id && toggleChannel(channel._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {channel.index || idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {currentManufacturer?.shortName || ''} {channel.code}
                          </span>
                          <span className="text-gray-600">({channel.name})</span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded font-medium">
                            毛利 {channel.grossMargin}%
                          </span>
                        </div>
                        {channel.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{channel.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 mr-2">
                        {channel.subRules?.length || 0} 个子规则
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditChannelModal(channel)
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          channel._id && handleDeleteChannel(channel._id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {channel._id && expandedChannels.has(channel._id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* 展开的子规则 */}
                  {channel._id && expandedChannels.has(channel._id) && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                      {channel.subRules?.length > 0 ? (
                        <div className="space-y-3">
                          {channel.subRules.map((subRule, subIdx) => (
                            <div key={subRule._id || subIdx} className="ml-8 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-400 font-mono">{subRule.code}</span>
                                <span className="font-medium text-gray-800">{subRule.channelPath}</span>
                                <span className={`px-2 py-0.5 text-xs rounded ${getChannelTypeColor(channel.type)}`}>
                                  {subRule.channelType === 'direct' ? 'Standard Direct' : subRule.channelType}
                                </span>
                              </div>
                              {subRule.description && (
                                <p className="text-xs text-gray-500 mb-3">{subRule.description}</p>
                              )}
                              
                              {/* 利益分配详情 */}
                              {subRule.profitDistribution?.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                    <span>⤷</span> 利益分配详情
                                  </p>
                                  <div className="flex flex-wrap gap-3">
                                    {subRule.profitDistribution.map((dist, distIdx) => (
                                      <div key={distIdx} className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                                        <div className="text-sm text-gray-600">{dist.role} ({dist.roleCode})</div>
                                        <div className="text-lg font-bold text-green-600">{dist.percentage}%</div>
                                        <div className="text-xs text-gray-400">
                                          {dist.type === 'gross_margin' ? 'Gross Margin' : dist.type}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          暂无子规则
                        </div>
                      )}
                      
                      <button
                        onClick={() => channel._id && openAddSubRuleModal(channel._id)}
                        className="mt-4 ml-8 flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        添加子规则
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加/编辑渠道弹窗 */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingChannel ? '编辑渠道' : '添加渠道'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">渠道代码 *</label>
                  <input
                    type="text"
                    value={channelForm.code}
                    onChange={(e) => setChannelForm({ ...channelForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：2C, 2F, 2D"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">渠道类型</label>
                  <select
                    value={channelForm.type}
                    onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="2C">2C - 直接客户</option>
                    <option value="2F">2F - 加盟商渠道</option>
                    <option value="2D">2D - 设计师渠道</option>
                    <option value="2S">2S - 高定旗舰店</option>
                    <option value="2B">2B - B端渠道</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">渠道名称 *</label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="如：直接客户、加盟商渠道"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">毛利率 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={channelForm.grossMargin}
                  onChange={(e) => setChannelForm({ ...channelForm, grossMargin: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  value={channelForm.description}
                  onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="渠道描述说明"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowChannelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveChannel}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加子规则弹窗 */}
      {showSubRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">添加子规则</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">规则编号 *</label>
                  <input
                    type="text"
                    value={subRuleForm.code}
                    onChange={(e) => setSubRuleForm({ ...subRuleForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：1.1, 2.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">渠道路径 *</label>
                  <input
                    type="text"
                    value={subRuleForm.channelPath}
                    onChange={(e) => setSubRuleForm({ ...subRuleForm, channelPath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：F > C, F > B > C"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">渠道类型</label>
                <select
                  value={subRuleForm.channelType}
                  onChange={(e) => setSubRuleForm({ ...subRuleForm, channelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="direct">直销</option>
                  <option value="franchise">加盟商</option>
                  <option value="designer">设计师</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  value={subRuleForm.description}
                  onChange={(e) => setSubRuleForm({ ...subRuleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="如：厂家直接销售给终端客户"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">利益分配</label>
                <div className="space-y-2">
                  {subRuleForm.profitDistribution.map((dist, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={dist.role}
                        onChange={(e) => {
                          const newDist = [...subRuleForm.profitDistribution]
                          newDist[idx].role = e.target.value
                          setSubRuleForm({ ...subRuleForm, profitDistribution: newDist })
                        }}
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                        placeholder="角色名"
                      />
                      <input
                        type="text"
                        value={dist.roleCode}
                        onChange={(e) => {
                          const newDist = [...subRuleForm.profitDistribution]
                          newDist[idx].roleCode = e.target.value.toUpperCase()
                          setSubRuleForm({ ...subRuleForm, profitDistribution: newDist })
                        }}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        placeholder="代码"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={dist.percentage}
                        onChange={(e) => {
                          const newDist = [...subRuleForm.profitDistribution]
                          newDist[idx].percentage = parseInt(e.target.value) || 0
                          setSubRuleForm({ ...subRuleForm, profitDistribution: newDist })
                        }}
                        className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-center"
                        placeholder="%"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      {subRuleForm.profitDistribution.length > 1 && (
                        <button
                          onClick={() => {
                            const newDist = subRuleForm.profitDistribution.filter((_, i) => i !== idx)
                            setSubRuleForm({ ...subRuleForm, profitDistribution: newDist })
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSubRuleForm({
                      ...subRuleForm,
                      profitDistribution: [
                        ...subRuleForm.profitDistribution,
                        { role: '', roleCode: '', percentage: 0, type: 'gross_margin' }
                      ]
                    })
                  }}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  + 添加分配项
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubRuleModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveSubRule}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
