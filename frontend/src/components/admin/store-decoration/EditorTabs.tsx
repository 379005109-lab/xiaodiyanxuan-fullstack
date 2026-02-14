import { useState, ReactNode } from 'react'

interface EditorTabsProps {
  title: string
  icon: ReactNode
  contentPanel: ReactNode
  stylePanel: ReactNode
}

export default function EditorTabs({ title, icon, contentPanel, stylePanel }: EditorTabsProps) {
  const [tab, setTab] = useState<'content' | 'style'>('content')

  return (
    <div className="space-y-4">
      {/* 头部：标题 + 内容/样式切换 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className="flex bg-stone-100 rounded-full p-0.5">
          <button
            onClick={() => setTab('content')}
            className={`px-4 py-1 text-xs rounded-full transition-colors ${
              tab === 'content'
                ? 'bg-primary text-white font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            内容
          </button>
          <button
            onClick={() => setTab('style')}
            className={`px-4 py-1 text-xs rounded-full transition-colors ${
              tab === 'style'
                ? 'bg-primary text-white font-medium shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            样式
          </button>
        </div>
      </div>

      {/* 面板内容 */}
      {tab === 'content' ? contentPanel : stylePanel}
    </div>
  )
}
