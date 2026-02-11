import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Paintbrush, Layout, FileText, Edit2, Trash2, Star, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
  getDecorationList,
  deleteDecoration,
  setDefaultDecoration,
  StoreDecoration
} from '@/services/storeDecorationService'
import { getFileUrl } from '@/services/uploadService'

export default function StoreDecorationPage() {
  const navigate = useNavigate()
  const [pages, setPages] = useState<StoreDecoration[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'homepage' | 'custom'>('homepage')

  useEffect(() => {
    loadPages()
  }, [activeTab])

  const loadPages = async () => {
    setLoading(true)
    try {
      const res = await getDecorationList({ type: activeTab, limit: 50 })
      setPages(res.data || [])
    } catch (error) {
      console.error('加载装修页面失败:', error)
      toast.error('加载装修页面失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    navigate('/admin/store-decoration/new', { state: { type: activeTab } })
  }

  const handleEdit = (page: StoreDecoration) => {
    navigate(`/admin/store-decoration/edit/${page._id}`)
  }

  const handleDelete = async (page: StoreDecoration) => {
    if (page.isDefault) {
      toast.error('默认首页不能删除')
      return
    }
    if (!confirm(`确定要删除「${page.name}」吗？`)) return
    try {
      await deleteDecoration(page._id)
      toast.success('删除成功')
      loadPages()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleSetDefault = async (page: StoreDecoration) => {
    if (page.isDefault) return
    try {
      await setDefaultDecoration(page._id)
      toast.success('已设为默认首页')
      loadPages()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '设置失败')
    }
  }

  const getStatusBadge = (page: StoreDecoration) => {
    if (page.isDefault) {
      return <span className="px-2 py-1 text-xs rounded bg-primary-100 text-primary-600 font-medium">默认首页</span>
    }
    switch (page.status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">已启用</span>
      case 'inactive':
        return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">已停用</span>
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-600">草稿</span>
      default:
        return null
    }
  }

  const stats = {
    total: pages.length,
    active: pages.filter(p => p.status === 'active').length,
    defaults: pages.filter(p => p.isDefault).length,
    drafts: pages.filter(p => p.status === 'draft').length,
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">店铺装修</h1>
          <p className="text-gray-600 mt-1">自定义店铺首页和页面布局，打造个性化店铺</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新建页面
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Layout className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">全部页面</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-sm text-gray-500">已启用</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.defaults}</div>
              <div className="text-sm text-gray-500">默认首页</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.drafts}</div>
              <div className="text-sm text-gray-500">草稿</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'homepage'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            店铺首页
          </div>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            自定义页面
          </div>
        </button>
      </div>

      {/* 页面列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : pages.length === 0 ? (
        <div className="card text-center py-16">
          <Paintbrush className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {activeTab === 'homepage' ? '还没有创建店铺首页' : '还没有创建自定义页面'}
          </p>
          <button onClick={handleCreate} className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            立即创建
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map(page => (
            <div key={page._id} className="card group relative overflow-hidden">
              {/* 封面图 */}
              <div className="h-40 -mx-6 -mt-6 mb-4 bg-gray-100 overflow-hidden">
                {page.coverImage ? (
                  <img
                    src={getFileUrl(page.coverImage)}
                    alt={page.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                    <Paintbrush className="h-10 w-10 text-primary-300" />
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{page.name}</h3>
                    {page.title && <p className="text-sm text-gray-500 mt-0.5">{page.title}</p>}
                  </div>
                  {getStatusBadge(page)}
                </div>

                <div className="text-xs text-gray-400">
                  更新于 {new Date(page.updatedAt).toLocaleString('zh-CN')}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(page)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gray-600 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  {activeTab === 'homepage' && !page.isDefault && (
                    <button
                      onClick={() => handleSetDefault(page)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                      设为首页
                    </button>
                  )}
                  {!page.isDefault && (
                    <button
                      onClick={() => handleDelete(page)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
