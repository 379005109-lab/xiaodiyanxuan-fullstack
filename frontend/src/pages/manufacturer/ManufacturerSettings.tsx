import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Upload, Phone, CreditCard, Building, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getFileUrl } from '@/services/uploadService'

interface ManufacturerSettings {
  logo: string
  settings: {
    phone: string
    servicePhone: string
    wechatQrCode: string
    alipayQrCode: string
    bankInfo: {
      bankName: string
      accountName: string
      accountNumber: string
    }
    companyAddress: string
    businessLicense: string
  }
}

export default function ManufacturerSettingsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [manufacturerId, setManufacturerId] = useState<string>('')
  const [formData, setFormData] = useState<ManufacturerSettings>({
    logo: '',
    settings: {
      phone: '',
      servicePhone: '',
      wechatQrCode: '',
      alipayQrCode: '',
      bankInfo: {
        bankName: '',
        accountName: '',
        accountNumber: ''
      },
      companyAddress: '',
      businessLicense: ''
    }
  })

  useEffect(() => {
    loadManufacturerInfo()
  }, [])

  const loadManufacturerInfo = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // 获取当前用户的厂家信息
      const response = await fetch('/api/manufacturers/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const manufacturer = data.data
        setManufacturerId(manufacturer._id)
        setFormData({
          logo: manufacturer.logo || '',
          settings: {
            phone: manufacturer.settings?.phone || '',
            servicePhone: manufacturer.settings?.servicePhone || '',
            wechatQrCode: manufacturer.settings?.wechatQrCode || '',
            alipayQrCode: manufacturer.settings?.alipayQrCode || '',
            bankInfo: {
              bankName: manufacturer.settings?.bankInfo?.bankName || '',
              accountName: manufacturer.settings?.bankInfo?.accountName || '',
              accountNumber: manufacturer.settings?.bankInfo?.accountNumber || ''
            },
            companyAddress: manufacturer.settings?.companyAddress || '',
            businessLicense: manufacturer.settings?.businessLicense || ''
          }
        })
      }
    } catch (error) {
      console.error('加载厂家信息失败:', error)
      toast.error('加载信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const token = localStorage.getItem('token')
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      })

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.url || data.fileId

        if (field === 'logo') {
          setFormData(prev => ({ ...prev, logo: imageUrl }))
        } else if (field === 'wechatQrCode') {
          setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, wechatQrCode: imageUrl }
          }))
        } else if (field === 'alipayQrCode') {
          setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, alipayQrCode: imageUrl }
          }))
        } else if (field === 'businessLicense') {
          setFormData(prev => ({
            ...prev,
            settings: { ...prev.settings, businessLicense: imageUrl }
          }))
        }

        toast.success('图片上传成功')
      } else {
        toast.error('图片上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败')
    }
  }

  const handleSave = async () => {
    if (!manufacturerId) {
      toast.error('厂家信息未加载')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')

      const response = await fetch(`/api/manufacturers/${manufacturerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          logo: formData.logo,
          settings: formData.settings
        })
      })

      if (response.ok) {
        toast.success('设置保存成功')
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">厂家设置</h1>
              <p className="text-gray-500">设置公司LOGO、联系电话、收款码等信息</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存设置
          </button>
        </div>

        {/* 公司LOGO */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            公司LOGO
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
              {formData.logo ? (
                <img src={getFileUrl(formData.logo)} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
                <Upload className="w-4 h-4" />
                上传LOGO
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">建议尺寸: 200x200px，支持 PNG、JPG</p>
            </div>
          </div>
        </div>

        {/* 联系电话 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            联系电话
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司电话</label>
              <input
                type="text"
                value={formData.settings.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, phone: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="如: 400-xxx-xxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客服电话</label>
              <input
                type="text"
                value={formData.settings.servicePhone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: { ...prev.settings, servicePhone: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="如: 138xxxx8888"
              />
            </div>
          </div>
        </div>

        {/* 收款码 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            收款码设置
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* 微信收款码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">微信收款码</label>
              <div className="w-full aspect-square max-w-[200px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                {formData.settings.wechatQrCode ? (
                  <img src={getFileUrl(formData.settings.wechatQrCode)} alt="微信收款码" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-xs">微信收款码</span>
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-green-50 text-green-600 rounded-lg cursor-pointer hover:bg-green-100">
                <Upload className="w-4 h-4" />
                上传微信收款码
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'wechatQrCode')}
                />
              </label>
            </div>

            {/* 支付宝收款码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">支付宝收款码</label>
              <div className="w-full aspect-square max-w-[200px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden bg-gray-50">
                {formData.settings.alipayQrCode ? (
                  <img src={getFileUrl(formData.settings.alipayQrCode)} alt="支付宝收款码" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-xs">支付宝收款码</span>
                  </div>
                )}
              </div>
              <label className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
                <Upload className="w-4 h-4" />
                上传支付宝收款码
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'alipayQrCode')}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 银行转账信息 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            银行转账信息
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开户银行</label>
              <input
                type="text"
                value={formData.settings.bankInfo.bankName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    bankInfo: { ...prev.settings.bankInfo, bankName: e.target.value }
                  }
                }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="如: 中国工商银行"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">户名</label>
              <input
                type="text"
                value={formData.settings.bankInfo.accountName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    bankInfo: { ...prev.settings.bankInfo, accountName: e.target.value }
                  }
                }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="公司名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
              <input
                type="text"
                value={formData.settings.bankInfo.accountNumber}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    bankInfo: { ...prev.settings.bankInfo, accountNumber: e.target.value }
                  }
                }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="银行账号"
              />
            </div>
          </div>
        </div>

        {/* 公司地址 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">公司地址</h2>
          <textarea
            value={formData.settings.companyAddress}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              settings: { ...prev.settings, companyAddress: e.target.value }
            }))}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder="请输入详细的公司地址"
          />
        </div>
      </div>
    </div>
  )
}
