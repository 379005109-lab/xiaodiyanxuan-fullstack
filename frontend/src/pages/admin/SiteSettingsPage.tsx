import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save, Upload, Image as ImageIcon } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { uploadFile } from '@/services/uploadService'

interface SiteSettings {
  siteName: string
  siteSubtitle: string
  siteLogo: string
}

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'XIAODI',
    siteSubtitle: 'SUPPLY CHAIN',
    siteLogo: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/site-settings/me')
      if (response.data.success && response.data.data) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('加载网站设置失败:', error)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    setUploading(true)
    try {
      const fileId = await uploadFile(file)
      const logoUrl = `https://pkochbpmcgaa.sealoshzh.site/api/files/${fileId}`
      setSettings({ ...settings, siteLogo: logoUrl })
      toast.success('LOGO 上传成功')
    } catch (error: any) {
      toast.error(error.message || 'LOGO 上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!settings.siteName.trim()) {
      toast.error('请输入网站名称')
      return
    }

    setLoading(true)
    try {
      await apiClient.put('/site-settings/me', settings)
      toast.success('网站设置已保存')
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">网站设置</h1>
        <p className="text-gray-500 mt-1">自定义您的网站 LOGO 和名称</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <div className="space-y-6">
          {/* LOGO 上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">网站 LOGO</label>
            <div className="flex items-center gap-4">
              {settings.siteLogo ? (
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                  <img src={settings.siteLogo} alt="LOGO" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-flex">
                  <Upload className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传 LOGO'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">建议尺寸：200x200 像素</p>
                {settings.siteLogo && (
                  <button
                    onClick={() => setSettings({ ...settings, siteLogo: '' })}
                    className="text-sm text-red-600 hover:text-red-700 mt-2"
                  >
                    移除 LOGO
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 网站名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">网站名称</label>
            <input
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              placeholder="例如：佛山甄选家具"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">显示在网站顶部的主标题</p>
          </div>

          {/* 网站副标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">网站副标题</label>
            <input
              value={settings.siteSubtitle}
              onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
              placeholder="例如：SUPPLY CHAIN"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">显示在网站名称下方的副标题</p>
          </div>

          {/* 预览 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">预览效果</label>
            <div className="border-2 border-gray-200 rounded-lg p-8 bg-white flex justify-center">
              <div className="flex flex-col items-center">
                {settings.siteLogo ? (
                  <img src={settings.siteLogo} alt={settings.siteName} className="h-10 object-contain" />
                ) : (
                  <>
                    <div className="text-2xl font-serif font-bold tracking-tighter text-primary leading-none">
                      {settings.siteName || 'XIAODI'}
                    </div>
                    <span className="text-[10px] font-sans font-normal tracking-[0.3em] text-accent uppercase leading-tight mt-1">
                      {settings.siteSubtitle || 'SUPPLY CHAIN'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
