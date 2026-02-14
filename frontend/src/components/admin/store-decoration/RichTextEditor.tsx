import { FileText } from 'lucide-react'
import { RichTextConfig, ComponentStyle } from '@/services/storeDecorationService'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface RichTextEditorProps {
  config: RichTextConfig
  onChange: (config: RichTextConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function RichTextEditor({ config, onChange, style, onStyleChange }: RichTextEditorProps) {
  return (
    <EditorTabs
      title="富文本"
      icon={<FileText className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">内容</label>
        <textarea
          value={config.content}
          onChange={e => onChange({ ...config, content: e.target.value })}
          placeholder="请输入富文本内容，支持HTML标签"
          className="input min-h-[200px] resize-y font-mono text-sm"
        />
        <div className="text-xs text-gray-400 mt-1">支持HTML标签，如 &lt;b&gt;、&lt;i&gt;、&lt;a&gt; 等</div>
      </div>

      {config.content && (
        <div>
          <label className="block text-sm font-medium mb-1">预览</label>
          <div
            className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: config.content }}
          />
        </div>
      )}
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
