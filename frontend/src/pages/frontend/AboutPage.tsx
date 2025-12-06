import { useEffect, useState } from 'react'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'
import { getAllSiteConfigs } from '@/services/siteConfigService'

export default function AboutPage() {
  const [config, setConfig] = useState<any>({
    contactPhone: '18573023234',
    contactEmail: '',
    contactWechat: '',
    businessHours: '周一至周日 9:00-18:00',
    address: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getAllSiteConfigs()
        // 合并默认配置和服务器配置
        setConfig((prev: any) => ({
          ...prev,
          ...data,
          contactPhone: data?.contactPhone || '18573023234'
        }))
      } catch (error) {
        console.error('加载配置失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-primary mb-4">关于我们</h1>
          <p className="text-stone-500 text-lg">About Us</p>
        </div>

        {/* 公司介绍 */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">品质家居，源于匠心</h2>
          <div className="prose prose-stone max-w-none">
            <p className="text-gray-600 leading-relaxed mb-4">
              我们专注于为客户提供高品质的家具产品，每一件作品都凝聚着匠人的心血与智慧。
              从选材到工艺，从设计到交付，我们始终坚持最高标准，只为给您带来舒适优雅的居家体验。
            </p>
            <p className="text-gray-600 leading-relaxed">
              多年来，我们服务了众多家庭和设计师，以诚信经营、品质保证赢得了客户的信赖。
              无论您是在装修新家，还是想要升级现有家居，我们都将竭诚为您服务。
            </p>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">联系我们</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {config?.contactPhone && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">联系电话</h3>
                  <a href={`tel:${config.contactPhone}`} className="text-primary hover:underline text-lg">
                    {config.contactPhone}
                  </a>
                </div>
              </div>
            )}

            {config?.contactEmail && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">电子邮箱</h3>
                  <a href={`mailto:${config.contactEmail}`} className="text-primary hover:underline">
                    {config.contactEmail}
                  </a>
                </div>
              </div>
            )}

            {config?.contactWechat && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">微信</h3>
                  <span className="text-gray-600">{config.contactWechat}</span>
                </div>
              </div>
            )}

            {config?.businessHours && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">营业时间</h3>
                  <span className="text-gray-600">{config.businessHours}</span>
                </div>
              </div>
            )}

            {config?.address && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl md:col-span-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">公司地址</h3>
                  <span className="text-gray-600">{config.address}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 服务承诺 */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">我们的承诺</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-semibold text-gray-900 mb-2">品质保证</h3>
              <p className="text-gray-600 text-sm">精选优质材料，严格品控标准</p>
            </div>
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="font-semibold text-gray-900 mb-2">专业配送</h3>
              <p className="text-gray-600 text-sm">专业团队送货上门并安装</p>
            </div>
            <div className="text-center p-6 bg-primary/5 rounded-xl">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-semibold text-gray-900 mb-2">售后无忧</h3>
              <p className="text-gray-600 text-sm">完善的售后服务体系</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
