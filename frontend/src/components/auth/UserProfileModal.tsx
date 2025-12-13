import { useState, useEffect } from 'react'
import { X, User, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/lib/apiClient'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nickname: '',
    gender: '' as '' | 'male' | 'female'
  })

  useEffect(() => {
    if (user) {
      setForm({
        nickname: user.nickname || '',
        gender: (user as any).gender || ''
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.nickname.trim()) {
      toast.error('请输入您的姓名')
      return
    }
    
    if (!form.gender) {
      toast.error('请选择您的性别')
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.put('/users/profile', {
        nickname: form.nickname.trim(),
        gender: form.gender
      })

      const data = response.data
      if (data?.success) {
        // 更新本地用户信息
        updateUser({ nickname: form.nickname.trim(), gender: form.gender } as any)
        
        // 标记已完善信息，下次不再弹窗
        const userId = (user as any)?._id || (user as any)?.id
        if (userId) {
          localStorage.setItem(`profile_completed_${userId}`, 'true')
        }
        
        toast.success('信息保存成功！')
        onClose()
      } else {
        toast.error(data?.message || '保存失败')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">完善个人信息</h2>
                <p className="text-sm text-white/80">欢迎加入小迪严选</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              您的姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入您的姓名"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              您的性别 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'male' })}
                className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                  form.gender === 'male'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {form.gender === 'male' && <Check className="w-4 h-4" />}
                男
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'female' })}
                className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                  form.gender === 'female'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {form.gender === 'female' && <Check className="w-4 h-4" />}
                女
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存并继续'}
          </button>

          <p className="text-xs text-center text-gray-400">
            完善信息后可享受更好的购物体验
          </p>
        </form>
      </div>
    </div>
  )
}
