import { useState, useEffect } from 'react'
import { Save, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploader from '@/components/admin/ImageUploader'
import { getAllSiteConfigs, batchUpdateSiteConfigs } from '@/services/siteConfigService'
import { getFileUrl } from '@/services/uploadService'

export default function SiteImageManagement() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState({
    // 首页图片
    'home.hero': '',           // 首页Hero背景
    'home.showroom': '',       // 展厅图片
    'home.defaultProduct': '', // 默认商品图片
    // 风格图片
    'style.modern': '',
    'style.vintage': '',
    'style.luxury': '',
    'style.minimal': ''
  })

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    setLoading(true)
    try {
      const configs = await getAllSiteConfigs()
      setImages({
        'home.hero': configs['home.hero'] || '',
        'home.showroom': configs['home.showroom'] || '',
        'home.defaultProduct': configs['home.defaultProduct'] || '',
        'style.modern': configs['style.modern'] || '',
        'style.vintage': configs['style.vintage'] || '',
        'style.luxury': configs['style.luxury'] || '',
        'style.minimal': configs['style.minimal'] || ''
      })
    } catch (error) {
      console.error('加载图片失败:', error)
      toast.error('加载图片失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await batchUpdateSiteConfigs(images)
      toast.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 首页图片配置
  const homeConfigs = [
    { key: 'home.hero', label: '首页横幅背景', color: 'stone', desc: '首页顶部Hero区域背景图' },
    { key: 'home.showroom', label: '展厅图片', color: 'green', desc: '佛山展厅区域的展示图' },
    { key: 'home.defaultProduct', label: '默认商品图', color: 'blue', desc: '商品无图时的默认显示图' },
  ]
  
  // 风格图片配置
  const styleConfigs = [
    { key: 'style.modern', label: '现代风', color: 'blue', desc: '现代风格卡片背景' },
    { key: 'style.vintage', label: '中古风', color: 'amber', desc: '中古风格卡片背景' },
    { key: 'style.luxury', label: '轻奢风', color: 'purple', desc: '轻奢风格卡片背景' },
    { key: 'style.minimal', label: '极简风', color: 'gray', desc: '极简风格卡片背景' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 渲染图片配置卡片
  const renderImageCard = (config: { key: string; label: string; color: string; desc: string }) => (
    <div key={config.key} className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-${config.color}-100`}>
          <ImageIcon className={`h-5 w-5 text-${config.color}-600`} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{config.label}</h3>
          <p className="text-sm text-gray-500">{config.desc}</p>
        </div>
      </div>

      <div className="space-y-4">
        <ImageUploader
          images={images[config.key as keyof typeof images] ? [images[config.key as keyof typeof images]] : []}
          onChange={(imgs) => setImages({ ...images, [config.key]: imgs[0] || '' })}
          multiple={false}
          maxImages={1}
          label={`点击上传${config.label}`}
        />

        {images[config.key as keyof typeof images] && (
          <div className="relative h-32 rounded-lg overflow-hidden">
            <img
              src={getFileUrl(images[config.key as keyof typeof images])}
              alt={config.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
              <div className="text-center">
                <h4 className="text-lg font-bold">{config.label}</h4>
                <p className="text-sm opacity-90">已上传</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">网站图片管理</h1>
          <p className="text-gray-600 mt-1">管理网站首页和商城页面的图片</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {/* 首页图片 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded"></span>
          首页图片
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {homeConfigs.map(renderImageCard)}
        </div>
      </div>

      {/* 风格图片 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-amber-500 rounded"></span>
          风格卡片背景
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {styleConfigs.map(renderImageCard)}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          使用说明
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <b>首页横幅背景</b>：显示在首页顶部Hero区域的背景图</p>
          <p>• <b>展厅图片</b>：显示在佛山展厅介绍区域</p>
          <p>• <b>默认商品图</b>：当商品没有图片时显示的默认图片</p>
          <p>• <b>风格卡片背景</b>：显示在商城页面的风格分类卡片背景</p>
          <p>• 上传后点击"保存设置"按钮，图片才会在网站上生效</p>
          <p>• 推荐尺寸：1200x600px，16:9比例，JPG或PNG格式</p>
        </div>
      </div>
    </div>
  )
}
