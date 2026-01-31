import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const sofaSubCategories = [
  { key: 'electric', label: '电动沙发' },
  { key: 'double', label: '双人沙发' },
  { key: 'triple', label: '三人沙发' },
  { key: 'chaise', label: '带贵妃沙发' },
  { key: 'modular', label: '模块沙发' },
  { key: 'corner', label: '转角沙发' },
]

export default function SofaCategoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const category = searchParams.get('category') || ''
  const parent = searchParams.get('parent') || ''

  const crumb = useMemo(() => {
    const parts = []
    if (parent) parts.push(parent)
    parts.push('沙发')
    return parts
  }, [parent])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-10">
        <div className="text-sm text-stone-500">
          {crumb.join(' > ')}
        </div>

        <h1 className="mt-4 text-4xl font-semibold text-stone-900">沙发</h1>

        <div className="mt-8 flex flex-wrap gap-6">
          {sofaSubCategories.map((sc) => (
            <button
              key={sc.key}
              type="button"
              onClick={() => {
                const params = new URLSearchParams()
                if (category) params.set('category', category)
                if (parent) params.set('parent', parent)
                params.set('sub', sc.key)
                navigate(`/products?${params.toString()}`)
              }}
              className="w-[180px] text-left"
            >
              <div className="w-full aspect-[16/9] rounded-lg bg-stone-100" />
              <div className="mt-2 text-sm text-stone-900">{sc.label}</div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams()
              if (category) params.set('category', category)
              navigate(`/products?${params.toString()}`)
            }}
            className="ml-auto px-4 py-2 border border-stone-300 rounded-full text-sm text-stone-700 hover:bg-stone-50"
          >
            查看所有精选沙发
          </button>
        </div>
      </div>
    </div>
  )
}
