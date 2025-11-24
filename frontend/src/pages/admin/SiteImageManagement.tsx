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

  const styleConfigs = [
    { key: 'style.modern', label: '现代风', color: 'blue' },
    { key: 'style.vintage', label: '中古风', color: 'amber' },
    { key: 'style.luxury', label: '轻奢风', color: 'purple' },
    { key: 'style.minimal', label: '极简风', color: 'gray' }
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">网站图片管理</h1>
          <p className="text-gray-600 mt-1">管理商城页面的风格卡片背景图</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {styleConfigs.map((config) => (
          <div key={config.key} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                <ImageIcon className={`h-5 w-5 text-${config.color}-600`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{config.label}</h3>
                <p className="text-sm text-gray-500">风格卡片背景图</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 图片上传器 */}
              <ImageUploader
                images={images[config.key] ? [images[config.key]] : []}
                onChange={(imgs) => setImages({ ...images, [config.key]: imgs[0] || '' })}
                multiple={false}
                maxImages={1}
                label={`点击上传${config.label}背景图`}
              />

              {/* 预览 */}
              {images[config.key] && (
                <div className="relative h-32 rounded-lg overflow-hidden">
                  <img
                    src={getFileUrl(images[config.key])}
                    alt={config.label}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br from-${config.color}-500 to-${config.color}-600 opacity-60`}></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <h4 className="text-xl font-bold">{config.label}</h4>
                      <p className="text-sm opacity-90">预览效果</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 推荐尺寸提示 */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">推荐尺寸：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>宽度：800-1200px</li>
                  <li>高度：400-600px</li>
                  <li>比例：16:9 或 2:1</li>
                  <li>格式：JPG 或 PNG</li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 使用说明 */}
      <div className="card p-6 mt-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          使用说明
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• 这些图片将显示在商城页面顶部的风格卡片背景上</p>
          <p>• 图片会自动添加渐变蒙版，确保白色文字清晰可见</p>
          <p>• 建议选择色彩丰富、具有该风格代表性的室内/家具图片</p>
          <p>• 上传后点击"保存设置"按钮，图片才会在商城页面生效</p>
          <p>• 如果不上传图片，将显示纯色渐变背景</p>
        </div>
      </div>
    </div>
  )
}
