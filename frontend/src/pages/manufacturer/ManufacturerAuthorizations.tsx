import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import FolderSelectionModal from '@/components/FolderSelectionModal'

interface Authorization {
  _id: string
  fromManufacturer?: any
  toManufacturer?: any
  toDesigner?: any
  authorizationType: 'manufacturer' | 'designer'
  scope?: 'all' | 'category' | 'specific' | 'mixed'
  categories?: string[]
  products?: any[]
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  validUntil?: string
  notes?: string
  savedToFolderId?: string
  savedToFolderName?: string
  isFolderSelected?: boolean
  createdAt?: string
}

type TabKey = 'received' | 'granted' | 'pending'

export default function ManufacturerAuthorizations() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabKey>('received')
  const [loading, setLoading] = useState(false)

  const [receivedAuths, setReceivedAuths] = useState<Authorization[]>([])
  const [grantedAuths, setGrantedAuths] = useState<Authorization[]>([])
  const [pendingAuths, setPendingAuths] = useState<Authorization[]>([])

  const [authTodoCount, setAuthTodoCount] = useState(0)

  const [categories, setCategories] = useState<any[]>([])
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [selectedAuthId, setSelectedAuthId] = useState<string>('')
  const [autoPromptedAuthId, setAutoPromptedAuthId] = useState<string>('')

  const manufacturerToken = useMemo(() => localStorage.getItem('manufacturerToken') || '', [])

  const getAuthHeaders = () => ({ Authorization: `Bearer ${manufacturerToken}` })

  useEffect(() => {
    if (!manufacturerToken) {
      navigate('/manufacturer/login')
    }
  }, [manufacturerToken, navigate])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const resp = await apiClient.get('/categories')
        const data = resp.data
        if (data?.success || data?.data) {
          setCategories(data.data || [])
        } else {
          setCategories([])
        }
      } catch {
        setCategories([])
      }
    }

    loadCategories()
  }, [])

  const loadSummary = async () => {
    try {
      const resp = await apiClient.get('/authorizations/manufacturer/summary', {
        headers: getAuthHeaders()
      })
      if (resp.data?.success) {
        setAuthTodoCount(resp.data.data?.todoCount || 0)
      }
    } catch {
      setAuthTodoCount(0)
    }
  }

  const loadAuthorizations = async () => {
    setLoading(true)
    try {
      if (activeTab === 'received') {
        const resp = await apiClient.get('/authorizations/manufacturer/received', {
          headers: getAuthHeaders()
        })
        if (resp.data?.success) setReceivedAuths(resp.data.data || [])
        else toast.error(resp.data?.message || '加载失败')
      } else if (activeTab === 'granted') {
        const resp = await apiClient.get('/authorizations/manufacturer/my-grants', {
          headers: getAuthHeaders()
        })
        if (resp.data?.success) setGrantedAuths(resp.data.data || [])
        else toast.error(resp.data?.message || '加载失败')
      } else {
        const [designerResp, manufacturerResp] = await Promise.all([
          apiClient.get('/authorizations/manufacturer/designer-requests/pending', { headers: getAuthHeaders() }).catch(() => null as any),
          apiClient.get('/authorizations/manufacturer/manufacturer-requests/pending', { headers: getAuthHeaders() }).catch(() => null as any),
        ])

        const designerList = designerResp?.data?.success ? (designerResp.data.data || []) : []
        const manufacturerList = manufacturerResp?.data?.success ? (manufacturerResp.data.data || []) : []
        setPendingAuths([...(designerList || []), ...(manufacturerList || [])])
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '加载失败')
    } finally {
      setLoading(false)
    }

    await loadSummary()
  }

  useEffect(() => {
    if (activeTab !== 'received') return
    if (showFolderModal) return
    if (selectedAuthId) return
    const next = receivedAuths.find((a) => a.authorizationType === 'manufacturer' && a.status === 'active' && !a.isFolderSelected)
    if (!next?._id) return
    if (autoPromptedAuthId === String(next._id)) return
    setAutoPromptedAuthId(String(next._id))
    openFolderSelection(String(next._id))
  }, [activeTab, autoPromptedAuthId, receivedAuths, selectedAuthId, showFolderModal])

  useEffect(() => {
    loadAuthorizations()
  }, [activeTab])

  const openFolderSelection = (authId: string) => {
    setSelectedAuthId(authId)
    setShowFolderModal(true)
  }

  const handleSaveFolder = async (folderId: string, folderName: string) => {
    try {
      const resp = await apiClient.put(
        `/authorizations/manufacturer/${selectedAuthId}/select-folder`,
        { folderId, folderName },
        { headers: getAuthHeaders() }
      )

      if (resp.data?.success) {
        toast.success('已保存文件夹')
        setShowFolderModal(false)
        setSelectedAuthId('')
        setActiveTab('received')
        await loadAuthorizations()
      } else {
        toast.error(resp.data?.message || '保存失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '保存失败')
    }
  }

  const handleApprove = async (auth: Authorization) => {
    try {
      const endpoint = auth.authorizationType === 'designer'
        ? `/authorizations/manufacturer/designer-requests/${auth._id}/approve`
        : `/authorizations/manufacturer/manufacturer-requests/${auth._id}/approve`

      const resp = await apiClient.put(endpoint, {}, { headers: getAuthHeaders() })
      if (resp.data?.success) {
        toast.success('已通过')
        await loadAuthorizations()
      } else {
        toast.error(resp.data?.message || '操作失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '操作失败')
    }
  }

  const handleReject = async (auth: Authorization) => {
    try {
      const endpoint = auth.authorizationType === 'designer'
        ? `/authorizations/manufacturer/designer-requests/${auth._id}/reject`
        : `/authorizations/manufacturer/manufacturer-requests/${auth._id}/reject`

      const resp = await apiClient.put(endpoint, {}, { headers: getAuthHeaders() })
      if (resp.data?.success) {
        toast.success('已拒绝')
        await loadAuthorizations()
      } else {
        toast.error(resp.data?.message || '操作失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '操作失败')
    }
  }

  const renderAuthRow = (auth: Authorization, kind: 'received' | 'granted' | 'pending') => {
    const fromName = auth.fromManufacturer?.name || auth.fromManufacturer?.shortName || auth.fromManufacturer?.fullName || ''
    const toManufacturerName = auth.toManufacturer?.name || auth.toManufacturer?.shortName || auth.toManufacturer?.fullName || ''
    const toDesignerName = auth.toDesigner?.nickname || auth.toDesigner?.username || auth.toDesigner?.email || ''

    return (
      <div key={auth._id} className="bg-white rounded-xl shadow-sm p-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900">
            {auth.authorizationType === 'designer' ? '设计师授权' : '厂家授权'}
          </div>
          <div className="text-sm text-gray-600 mt-1 break-all">
            {kind === 'received' ? (
              <span>授权方：{fromName || '—'}</span>
            ) : kind === 'granted' ? (
              <span>被授权方：{auth.authorizationType === 'designer' ? (toDesignerName || '—') : (toManufacturerName || '—')}</span>
            ) : (
              <span>申请方：{auth.authorizationType === 'designer' ? (toDesignerName || '—') : (toManufacturerName || '—')}</span>
            )}
          </div>
          {kind === 'received' && (auth.savedToFolderName || auth.isFolderSelected) ? (
            <div className="text-xs text-gray-500 mt-1">归档文件夹：{auth.savedToFolderName || '已选择'}</div>
          ) : null}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {kind === 'received' && auth.authorizationType === 'manufacturer' && !auth.isFolderSelected ? (
            <button
              onClick={() => openFolderSelection(auth._id)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              选择文件夹
            </button>
          ) : null}

          {kind === 'pending' ? (
            <>
              <button
                onClick={() => handleApprove(auth)}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={() => handleReject(auth)}
                className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  const currentList = activeTab === 'received'
    ? receivedAuths
    : activeTab === 'granted'
      ? grantedAuths
      : pendingAuths

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/manufacturer/orders')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">授权管理</h1>
              <p className="text-xs text-gray-500">厂家端</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {authTodoCount > 0 ? `待办 ${authTodoCount}` : '无待办'}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'received' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            我收到的授权
          </button>
          <button
            onClick={() => setActiveTab('granted')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'granted' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            我授权的
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'pending' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            待审核申请
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            加载中...
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-3">
            {currentList.map((auth) => renderAuthRow(auth, activeTab))}
          </div>
        )}
      </div>

      {showFolderModal ? (
        <FolderSelectionModal
          categories={categories}
          onClose={() => {
            setShowFolderModal(false)
            setSelectedAuthId('')
          }}
          onSave={handleSaveFolder}
        />
      ) : null}
    </div>
  )
}
