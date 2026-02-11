import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Save, Star, User, Image, Tag, Package, Palette, ImageIcon,
  Search, LayoutGrid, Type, Minus, FileText, ChevronDown, Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getDecorationById,
  createDecoration,
  updateDecoration,
  setDefaultDecoration,
  createEmptyPageValue,
  createComponent,
  generateComponentId,
  ComponentItem,
  ComponentType,
  PageValue,
} from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import MobilePreview from '@/components/admin/store-decoration/MobilePreview'
import StoreHeaderEditor from '@/components/admin/store-decoration/StoreHeaderEditor'
import BannerEditor from '@/components/admin/store-decoration/BannerEditor'
import CouponEditor from '@/components/admin/store-decoration/CouponEditor'
import ProductListEditor from '@/components/admin/store-decoration/ProductListEditor'
import TitleEditor from '@/components/admin/store-decoration/TitleEditor'
import SpacerEditor from '@/components/admin/store-decoration/SpacerEditor'
import RichTextEditor from '@/components/admin/store-decoration/RichTextEditor'
import ImageCubeEditor from '@/components/admin/store-decoration/ImageCubeEditor'
import SearchBoxEditor from '@/components/admin/store-decoration/SearchBoxEditor'

const PAGE_SETTINGS_ID = '__page_settings__'

interface ComponentCategory {
  label: string
  items: { type: ComponentType; label: string; icon: any }[]
}

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    label: '基础组件',
    items: [
      { type: 'storeHeader', label: '店铺头部', icon: User },
      { type: 'banner', label: '轮播图', icon: Image },
      { type: 'searchBox', label: '搜索框', icon: Search },
      { type: 'imageCube', label: '图片魔方', icon: LayoutGrid },
      { type: 'productList', label: '商品列表', icon: Package },
    ],
  },
  {
    label: '营销组件',
    items: [
      { type: 'coupon', label: '优惠券', icon: Tag },
    ],
  },
  {
    label: '工具组件',
    items: [
      { type: 'title', label: '标题', icon: Type },
      { type: 'spacer', label: '辅助空白', icon: Minus },
      { type: 'richText', label: '富文本', icon: FileText },
    ],
  },
]

export default function StoreDecorationEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('新页面')
  const [title, setTitle] = useState('')
  const [pageType, setPageType] = useState<'homepage' | 'custom'>('homepage')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [bgImage, setBgImage] = useState('')
  const [components, setComponents] = useState<ComponentItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageId, setPageId] = useState<string | null>(id || null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (id) {
      loadPage(id)
    } else {
      const state = location.state as { type?: string } | null
      if (state?.type === 'custom') setPageType('custom')
    }
  }, [id])

  const loadPage = async (pid: string) => {
    setLoading(true)
    try {
      const page = await getDecorationById(pid)
      if (page) {
        setName(page.name)
        setTitle(page.title)
        setPageType(page.type)
        setBgColor(page.bgColor || '#ffffff')
        setBgImage(page.bgImage || '')
        const val = page.value || createEmptyPageValue()
        setComponents(val.components || [])
      } else {
        toast.error('页面不存在')
        navigate('/admin/store-decoration')
      }
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('请输入页面名称'); return }
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        title: title.trim(),
        type: pageType,
        bgColor,
        bgImage,
        value: { components } as PageValue,
        status: 'draft' as const,
      }
      if (pageId) {
        await updateDecoration(pageId, data)
        toast.success('保存成功')
      } else {
        const res = await createDecoration(data)
        const newId = res.data?._id
        if (newId) { setPageId(newId); navigate(`/admin/store-decoration/edit/${newId}`, { replace: true }) }
        toast.success('创建成功')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async () => {
    if (!pageId) { toast.error('请先保存页面'); return }
    try { await setDefaultDecoration(pageId); toast.success('已设为默认首页') }
    catch (err: any) { toast.error(err.response?.data?.message || '设置失败') }
  }

  // ========== Component CRUD ==========

  const addComponent = (type: ComponentType) => {
    const comp = createComponent(type)
    setComponents(prev => [...prev, comp])
    setSelectedId(comp.id)
  }

  const deleteComponent = (cid: string) => {
    setComponents(prev => prev.filter(c => c.id !== cid))
    if (selectedId === cid) setSelectedId(null)
  }

  const copyComponent = (cid: string) => {
    const idx = components.findIndex(c => c.id === cid)
    if (idx === -1) return
    const src = components[idx]
    const copied: ComponentItem = {
      id: generateComponentId(),
      type: src.type,
      config: JSON.parse(JSON.stringify(src.config)),
    }
    const next = [...components]
    next.splice(idx + 1, 0, copied)
    setComponents(next)
    setSelectedId(copied.id)
  }

  const moveUp = (cid: string) => {
    const idx = components.findIndex(c => c.id === cid)
    if (idx <= 0) return
    const next = [...components]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setComponents(next)
  }

  const moveDown = (cid: string) => {
    const idx = components.findIndex(c => c.id === cid)
    if (idx === -1 || idx >= components.length - 1) return
    const next = [...components]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setComponents(next)
  }

  const updateComponentConfig = (cid: string, config: any) => {
    setComponents(prev => prev.map(c => c.id === cid ? { ...c, config } : c))
  }

  // ========== Background upload ==========

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBg(true)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      setBgImage(url)
      toast.success('背景图上传成功')
    } catch { toast.error('背景图上传失败') }
    finally { setUploadingBg(false) }
  }

  // ========== Right panel renderer ==========

  const selectedComponent = components.find(c => c.id === selectedId)

  const renderEditor = () => {
    if (selectedId === PAGE_SETTINGS_ID) return renderPageSettings()
    if (!selectedComponent) return (
      <div className="text-center py-12 text-gray-400 text-sm">
        请选择组件或点击「页面设置」
      </div>
    )
    const { type, config } = selectedComponent
    const onChange = (cfg: any) => updateComponentConfig(selectedComponent.id, cfg)
    switch (type) {
      case 'storeHeader': return <StoreHeaderEditor config={config} onChange={onChange} />
      case 'banner': return <BannerEditor config={config} onChange={onChange} />
      case 'coupon': return <CouponEditor config={config} onChange={onChange} />
      case 'productList': return <ProductListEditor config={config} onChange={onChange} />
      case 'title': return <TitleEditor config={config} onChange={onChange} />
      case 'spacer': return <SpacerEditor config={config} onChange={onChange} />
      case 'richText': return <RichTextEditor config={config} onChange={onChange} />
      case 'imageCube': return <ImageCubeEditor config={config} onChange={onChange} />
      case 'searchBox': return <SearchBoxEditor config={config} onChange={onChange} />
      default: return <div className="text-center py-12 text-gray-400 text-sm">暂不支持编辑此组件</div>
    }
  }

  const renderPageSettings = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Settings className="h-4 w-4" />
        页面设置
      </h3>
      <div>
        <label className="block text-sm font-medium mb-1">模板名称</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="页面名称" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">页面标题</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="页面标题（选填）" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">背景颜色</label>
        <div className="flex items-center gap-3">
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer" />
          <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="input flex-1" maxLength={7} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">背景图片</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center">
            {bgImage ? (
              <img src={getFileUrl(bgImage)} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <span className="text-sm text-primary hover:underline">{uploadingBg ? '上传中...' : '上传图片'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} disabled={uploadingBg} />
            </label>
            {bgImage && <button onClick={() => setBgImage('')} className="text-sm text-red-500 hover:underline text-left">删除</button>}
          </div>
        </div>
      </div>
    </div>
  )

  const toggleCategory = (label: string) => {
    setCollapsedCategories(prev => ({ ...prev, [label]: !prev[label] }))
  }

  // ========== Render ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/store-decoration')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-xl font-bold">{name || '新页面'}</div>
            {title && <div className="text-sm text-gray-500 mt-0.5">{title}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pageType === 'homepage' && pageId && (
            <button onClick={handleSetDefault} className="flex items-center gap-1.5 px-4 py-2 text-sm border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium">
              <Star className="h-4 w-4" /> 设为首页
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm px-5 py-2.5">
            <Save className="h-4 w-4" /> {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 三栏布局 */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* 左栏 - 分类组件面板 */}
        <div className="w-56 flex-shrink-0">
          <div className="card p-3 sticky top-4">
            {COMPONENT_CATEGORIES.map(cat => (
              <div key={cat.label} className="mb-2">
                <button
                  onClick={() => toggleCategory(cat.label)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                >
                  {cat.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${collapsedCategories[cat.label] ? '-rotate-90' : ''}`} />
                </button>
                {!collapsedCategories[cat.label] && (
                  <div className="space-y-0.5 mt-0.5">
                    {cat.items.map(item => (
                      <button
                        key={item.type}
                        onClick={() => addComponent(item.type)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-primary-50 hover:text-primary transition-colors"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 页面设置按钮 */}
            <div className="border-t border-stone-200 pt-2 mt-2">
              <button
                onClick={() => setSelectedId(PAGE_SETTINGS_ID)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  selectedId === PAGE_SETTINGS_ID
                    ? 'bg-primary-50 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">页面设置</span>
              </button>
            </div>
          </div>
        </div>

        {/* 中栏 - 手机预览 */}
        <div className="flex-1 flex justify-center items-start py-4">
          <MobilePreview
            components={components}
            selectedId={selectedId}
            bgColor={bgColor}
            bgImage={bgImage}
            onSelect={setSelectedId}
            onDelete={deleteComponent}
            onCopy={copyComponent}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        </div>

        {/* 右栏 - 属性编辑 */}
        <div className="w-80 flex-shrink-0">
          <div className="card p-4 sticky top-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {renderEditor()}
          </div>
        </div>
      </div>
    </div>
  )
}
