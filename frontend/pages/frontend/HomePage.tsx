import { motion } from 'framer-motion'
import { Factory, Shield, Zap, Award, Download, MessageSquare, Lightbulb, Ruler, Image as ImageIcon, ArrowRight } from 'lucide-react'
import Hero from '@/components/Hero'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero 部分 */}
      <Hero />

      {/* 强大供应链体系 */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">强大供应链体系</h2>
          <p className="text-gray-600 mb-12">不仅仅是平台，更是您直连工厂的桥梁。</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧大图 */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl h-80 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-sm">深入源头、剔除溢价</p>
                  <p className="text-xs mt-2">我们与佛山顶级工厂合作，南海等核心产业带，为您精选最具性价比的产品</p>
                </div>
              </div>
            </div>

            {/* 右侧三个卡片 */}
            <div className="lg:col-span-2 space-y-4">
              {[
                { icon: Factory, title: '200+ 源头工厂', desc: '深入佛山家具产业带，实地考察、户户筛选' },
                { icon: Shield, title: '全品类覆盖', desc: '沙发、床、餐桌等，一站式采购解决方案' },
                { icon: Zap, title: '厂家直发', desc: '没有层层加价，直接从工厂发货到您家' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-blue-50 p-6 rounded-xl flex items-start gap-4"
                >
                  <item.icon className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 覆盖全屋品类 */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8">覆盖全屋品类</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['沙发', '床', '餐桌椅', '茶几'].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-100 rounded-lg h-32 flex items-center justify-center font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 品质透明、价格公开 */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">品质透明、价格公开</h2>
            <p className="text-gray-400">无中间商差价，工厂直销价格。每件产品都有质检报告，价格构成透明。</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-8 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
            >
              甄选款 (¥2,999)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              大师款 PRO (¥5,999)
            </motion.button>
          </div>

          {/* 大师款展示 */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">大师款 PRO</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  进口材料，手工定制
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  设计师1对1服务
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  终身质保、专业维护
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  免费送装、上门安装
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  专属设计师团队
                </li>
              </ul>
              <p className="text-3xl font-bold mt-6 text-blue-400">¥6,899</p>
            </div>
            <div className="md:w-1/2 bg-gray-700 rounded-lg h-64 flex items-center justify-center text-gray-500">
              产品图片
            </div>
          </div>
        </div>
      </section>

      {/* 设计师专属资源库 */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">设计师专属资源库</h2>
              <p className="text-gray-600">150+ 设计师、1200+ 灵感、450+ 色彩方案、CAD 尺寸库</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 bg-black text-white rounded-full flex items-center gap-2"
            >
              进入资源库 <ArrowRight size={18} />
            </motion.button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Lightbulb, title: '3D 模型库', desc: '11+ 设计风格库' },
              { icon: ImageIcon, title: '高清样板图', desc: '6+ 风格、真实场景' },
              { icon: Download, title: '白色产品库', desc: '全品类、可下载' },
              { icon: Ruler, title: 'CAD 尺寸库', desc: '标准、可定制' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-xl text-center hover:bg-gray-100 transition-colors"
              >
                <item.icon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 找不到想要的模型 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">找不到想要的模型？</h2>
            <p className="text-gray-300 mb-8">联系我们的设计师团队，为您定制专属方案</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              <MessageSquare size={18} />
              立即咨询
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  )
}
