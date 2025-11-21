import { useState } from 'react'
import ImageUploader from '@/components/admin/ImageUploader'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface ImageSection {
  id: string
  title: string
  url: string
  image: string
  order: number
}

export default function ImageManagement() {
  const [webHomeBanners, setWebHomeBanners] = useState<string[]>([])
  const [webPackageBanners, setWebPackageBanners] = useState<string[]>([])
  const [miniProgramPlaceholders, setMiniProgramPlaceholders] = useState<string[]>([])
  
  // 首页各部分图片管理
  const [supplyChainImage, setSupplyChainImage] = useState<string>('')
  const [supplyChainUrl, setSupplyChainUrl] = useState<string>('/supply-chain')
  
  const [fullHouseImages, setFullHouseImages] = useState<ImageSection[]>([
    { id: '1', title: '沙发', url: '/products?category=3', image: '', order: 1 },
    { id: '2', title: '床', url: '/products?category=6', image: '', order: 2 },
    { id: '3', title: '餐桌椅', url: '/products?category=403,501', image: '', order: 3 },
    { id: '4', title: '全屋定制', url: '/products?category=custom', image: '', order: 4 },
  ])

  const [pricingImages, setPricingImages] = useState<ImageSection[]>([
    { id: '1', title: '甄选款', url: '/pricing?type=select', image: '', order: 1 },
    { id: '2', title: '大师款 PRO', url: '/pricing?type=pro', image: '', order: 2 },
  ])

  const [designerResourceUrl, setDesignerResourceUrl] = useState<string>('/designer-resources')

  const handleImageSectionChange = (
    sections: ImageSection[],
    setSections: (sections: ImageSection[]) => void,
    id: string,
    field: 'image' | 'url' | 'title',
    value: string
  ) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    ))
  }

  const handleDeleteImageSection = (
    sections: ImageSection[],
    setSections: (sections: ImageSection[]) => void,
    id: string
  ) => {
    setSections(sections.filter(section => section.id !== id))
  }

  const handleAddImageSection = (
    sections: ImageSection[],
    setSections: (sections: ImageSection[]) => void
  ) => {
    const newId = String(Math.max(...sections.map(s => parseInt(s.id)), 0) + 1)
    setSections([...sections, {
      id: newId,
      title: '新分类',
      url: '',
      image: '',
      order: sections.length + 1
    }])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">网站图片管理</h1>
          <p className="text-sm text-gray-500">管理首页各部分的图片、URL 跳转和排序</p>
        </div>
        <button className="btn-primary">保存所有调整</button>
      </div>

      {/* Web 首页区 */}
      <div className="card space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Web 首页展示</h2>
          <p className="text-xs text-gray-500">配置首页各部分的图片、链接和排序</p>
        </div>

        {/* 强大供应链体系 */}
        <div className="border-t pt-6">
          <h3 className="text-base font-semibold mb-4">强大供应链体系</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">背景图片</label>
              <p className="text-xs text-gray-500 mb-2">推荐尺寸 800×600</p>
              <ImageUploader
                images={supplyChainImage ? [supplyChainImage] : []}
                onChange={(images) => setSupplyChainImage(images[0] || '')}
                label="上传供应链图片"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">跳转链接</label>
              <input
                type="text"
                value={supplyChainUrl}
                onChange={(e) => setSupplyChainUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="/supply-chain"
              />
              <p className="text-xs text-gray-500 mt-1">例如: /supply-chain 或 https://example.com</p>
            </div>
          </div>
        </div>

        {/* 覆盖全屋品类 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">覆盖全屋品类</h3>
            <button
              onClick={() => handleAddImageSection(fullHouseImages, setFullHouseImages)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              <Plus size={16} /> 新增分类
            </button>
          </div>
          <div className="space-y-4">
            {fullHouseImages.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleImageSectionChange(fullHouseImages, setFullHouseImages, item.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">跳转链接</label>
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => handleImageSectionChange(fullHouseImages, setFullHouseImages, item.id, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="/products?category=3"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => handleDeleteImageSection(fullHouseImages, setFullHouseImages, item.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} /> 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 品质透明、价格公开 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">品质透明、价格公开</h3>
            <button
              onClick={() => handleAddImageSection(pricingImages, setPricingImages)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              <Plus size={16} /> 新增款式
            </button>
          </div>
          <div className="space-y-4">
            {pricingImages.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">款式名称</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleImageSectionChange(pricingImages, setPricingImages, item.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">跳转链接</label>
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => handleImageSectionChange(pricingImages, setPricingImages, item.id, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="/pricing?type=select"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => handleDeleteImageSection(pricingImages, setPricingImages, item.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} /> 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 设计师专属资源库 */}
        <div className="border-t pt-6">
          <h3 className="text-base font-semibold mb-4">设计师专属资源库</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">跳转链接</label>
            <input
              type="text"
              value={designerResourceUrl}
              onChange={(e) => setDesignerResourceUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="/designer-resources"
            />
            <p className="text-xs text-gray-500 mt-1">点击"进入资源库"按钮的跳转链接</p>
          </div>
        </div>
      </div>

      {/* 微信小程序区 */}
      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">微信小程序区</h2>
          <p className="text-xs text-gray-500">等待运营提供正式素材前，先预留上传窗口与尺寸说明</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 bg-gray-50 text-sm text-gray-500">
            <p className="font-medium text-gray-800 mb-2">小程序首页 Banner</p>
            <p>建议尺寸 1080×540，统一使用 jpg/webp。素材到位后，可直接通过下方上传入口补齐。</p>
            <div className="mt-4 opacity-60 pointer-events-none">
              <ImageUploader
                images={miniProgramPlaceholders}
                onChange={setMiniProgramPlaceholders}
                multiple
                maxImages={5}
                label="待运营提供素材"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 bg-gray-50 text-sm text-gray-500">
            <p className="font-medium text-gray-800 mb-2">小程序二级页面 / Banner Slot</p>
            <p>本区域预留给套餐、砍价、拼团入口图。可记录需求后统一上传，暂不影响线上展示。</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500 space-y-1">
        <p>当前为前端演示层，点击"保存所有调整"后可将配置通过 API 提交至后台素材库。</p>
        <p>支持动态新增/删除分类和款式，以及自定义 URL 跳转链接。</p>
      </div>
    </div>
  )
}

