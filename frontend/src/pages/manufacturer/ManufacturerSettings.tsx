import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Upload, Phone, CreditCard, Building, Image as ImageIcon, Loader2, ArrowLeft, Shield, Package } from 'lucide-react'
import { toast } from 'sonner'
import { getFileUrl } from '@/services/uploadService'
import { uploadFile } from '@/services/uploadService'
import apiClient from '@/lib/apiClient'

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
  const [authTodoCount, setAuthTodoCount] = useState(0)
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsBinding, setSmsBinding] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [smsStatus, setSmsStatus] = useState<{ phone: string; verifiedAt: string | null }>({
    phone: '',
    verifiedAt: null
  })
  const [smsPhoneInput, setSmsPhoneInput] = useState('')
  const [smsCodeInput, setSmsCodeInput] = useState('')
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('manufacturerToken')
    return { Authorization: `Bearer ${token}` }
  }

  const loadAuthorizationSummary = async () => {
    try {
      const res = await apiClient.get('/authorizations/manufacturer/summary', {
        headers: getAuthHeaders()
      })
      if (res.data?.success) {
        setAuthTodoCount(res.data.data?.todoCount || 0)
      }
    } catch {
      setAuthTodoCount(0)
    }
  }

  useEffect(() => {
    if (smsCountdown <= 0) return
    const t = setInterval(() => {
      setSmsCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [smsCountdown])

  const loadManufacturerInfo = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('manufacturerToken')
      
      // 获取当前用户的厂家信息
      const response = await apiClient.get('/manufacturer-orders/manufacturer/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        const manufacturer = response.data.data
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

      await loadSmsStatus()
      await loadAuthorizationSummary()
    } catch (error) {
      console.error('加载厂家信息失败:', error)
      toast.error('加载信息失败')
    } finally {
      setLoading(false)
    }
  }

  const loadSmsStatus = async () => {
    try {
      setSmsLoading(true)
      const token = localStorage.getItem('manufacturerToken')
      const res = await apiClient.get('/manufacturer-orders/manufacturer/sms/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data?.success) {
        setSmsStatus({
          phone: res.data.data?.smsNotifyPhone || '',
          verifiedAt: res.data.data?.smsNotifyVerifiedAt || null
        })
      }
    } catch (error) {
      console.error('加载短信绑定状态失败:', error)
    } finally {
      setSmsLoading(false)
    }
  }

  const handleSendSmsCode = async () => {
    // 如果当前没有绑定手机号，但输入框有手机号，先自动绑定
    if (!smsStatus.phone && smsPhoneInput) {
      try {
        setSmsSending(true)
        const token = localStorage.getItem('manufacturerToken')
        const bindRes = await apiClient.post(
          '/manufacturer-orders/manufacturer/sms/bind',
          { phone: smsPhoneInput },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (bindRes.data?.success) {
          await loadSmsStatus() // 重新加载绑定状态
        } else {
          toast.error(bindRes.data?.message || '绑定失败')
          setSmsSending(false)
          return
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || '绑定失败')
        setSmsSending(false)
        return
      }
    }

    try {
      setSmsSending(true)
      const token = localStorage.getItem('manufacturerToken')
      const res = await apiClient.post(
        '/manufacturer-orders/manufacturer/sms/send-code',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.success) {
        toast.success('验证码已发送')
        setSmsCountdown(60)
      } else {
        toast.error(res.data?.message || '发送失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '发送失败')
    } finally {
      setSmsSending(false)
    }
  }

  const handleBindSmsPhone = async () => {
    if (!smsPhoneInput) {
      toast.error('请输入手机号')
      return
    }
    try {
      setSmsBinding(true)
      const token = localStorage.getItem('manufacturerToken')
      const res = await apiClient.post(
        '/manufacturer-orders/manufacturer/sms/bind',
        { phone: smsPhoneInput },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.success) {
        toast.success('手机号已绑定，请发送验证码完成验证')
        await loadSmsStatus()
      } else {
        toast.error(res.data?.message || '绑定失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '绑定失败')
    } finally {
      setSmsBinding(false)
    }
  }

  const handleVerifySmsPhone = async () => {
    if (!smsCodeInput) {
      toast.error('请输入验证码')
      return
    }
    try {
      setSmsBinding(true)
      const token = localStorage.getItem('manufacturerToken')
      const res = await apiClient.post(
        '/manufacturer-orders/manufacturer/sms/bind',
        { code: smsCodeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.success) {
        toast.success('验证成功')
        setSmsCodeInput('')
        await loadSmsStatus()
      } else {
        toast.error(res.data?.message || '验证失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '验证失败')
    } finally {
      setSmsBinding(false)
    }
  }

  const handleUnbindSmsPhone = async () => {
    try {
      setSmsBinding(true)
      const token = localStorage.getItem('manufacturerToken')
      const res = await apiClient.post(
        '/manufacturer-orders/manufacturer/sms/unbind',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.success) {
        toast.success('已解绑')
        await loadSmsStatus()
      } else {
        toast.error(res.data?.message || '解绑失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '解绑失败')
    } finally {
      setSmsBinding(false)
    }
  }

  const formatVerifiedAt = (v: string | null) => {
    if (!v) return ''
    try {
      return new Date(v).toLocaleString('zh-CN')
    } catch {
      return String(v)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadFile(file)
      const imageUrl = result?.data?.fileId

      if (imageUrl) {

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
    try {
      setSaving(true)
      const token = localStorage.getItem('manufacturerToken')

      const response = await apiClient.put(
        '/manufacturer-orders/manufacturer/profile',
        {
          logo: formData.logo,
          settings: formData.settings
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        toast.success('设置保存成功')
      } else {
        toast.error(response.data.message || '保存失败')
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/manufacturer/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Package className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/manufacturer/authorizations')}
              className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Shield className="w-5 h-5" />
              {authTodoCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {authTodoCount}
                </span>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存设置
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-600" />
              短信通知绑定
            </h2>
            {smsLoading ? (
              <div className="text-sm text-gray-400">加载中...</div>
            ) : smsStatus.phone ? (
              <div className="text-sm text-gray-600">
                已绑定：<span className="font-medium">{smsStatus.phone}</span>
                {smsStatus.verifiedAt ? (
                  <span className="text-gray-400">（{formatVerifiedAt(smsStatus.verifiedAt)}）</span>
                ) : (
                  <span className="text-amber-600">（未验证）</span>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">未绑定</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <input
                type="tel"
                value={smsPhoneInput}
                onChange={(e) => setSmsPhoneInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="请输入手机号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <input
                type="text"
                value={smsCodeInput}
                onChange={(e) => setSmsCodeInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="请输入验证码"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSendSmsCode}
                disabled={smsSending || smsCountdown > 0 || (!smsStatus.phone && !smsPhoneInput)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {smsSending ? '发送中...' : smsCountdown > 0 ? `${smsCountdown}s` : '发送验证码'}
              </button>
              <button
                onClick={handleBindSmsPhone}
                disabled={smsBinding}
                className="px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                绑定手机号
              </button>
              <button
                onClick={handleVerifySmsPhone}
                disabled={smsBinding || !smsStatus.phone}
                className="px-4 py-2.5 bg-cyan-700 text-white rounded-xl hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                验证
              </button>
              {smsStatus.phone ? (
                <button
                  onClick={handleUnbindSmsPhone}
                  disabled={smsBinding}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  解绑
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            绑定后，当有新订单分发到该厂家时，将向此手机号发送短信提醒。
          </div>
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
