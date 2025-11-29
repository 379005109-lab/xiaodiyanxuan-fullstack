import { useState } from 'react'
import { X, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/lib/apiClient'

interface ProfileCompleteModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileCompleteModal({ isOpen, onClose }: ProfileCompleteModalProps) {
  const [loading, setLoading] = useState(false)
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    gender: user?.gender || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.nickname.trim()) {
      toast.error('请输入姓名')
      return
    }
    
    if (!form.gender) {
      toast.error('请选择性别')
      return
    }
    
    try {
      setLoading(true)
      const response = await apiClient.put('/users/profile', {
        nickname: form.nickname.trim(),
        gender: form.gender
      })
      
      if (response.data.success) {
        // 更新本地用户状态
        updateUser({
          nickname: form.nickname.trim(),
          gender: form.gender as 'male' | 'female' | ''
        })
        
        // 标记用户已完善信息，防止反复弹窗
        const userId = (user as any)?._id || (user as any)?.id
        if (userId) {
          localStorage.setItem(`profile_completed_${userId}`, 'true')
        }
        
        toast.success('信息保存成功！')
        onClose()
      } else {
        toast.error(response.data.message || '保存失败')
      }
    } catch (error: any) {
      toast.error(error?.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
      {/* 蒙版背景 */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-stone-400" />
        </button>

        <div className="p-10 pt-12">
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">完善个人信息</h2>
              <p className="text-stone-500 mt-2 text-sm">请填写您的姓名和性别，方便我们为您提供更好的服务</p>
            </div>
            
            <div className="space-y-4">
              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">姓名</label>
                <input
                  type="text"
                  placeholder="请输入您的姓名"
                  value={form.nickname}
                  onChange={(e) => setForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full h-12 px-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              
              {/* 性别 */}
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">性别</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all ${
                    form.gender === 'male' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={form.gender === 'male'}
                      onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="sr-only"
                    />
                    <span className="font-medium">男</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all ${
                    form.gender === 'female' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={form.gender === 'female'}
                      onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="sr-only"
                    />
                    <span className="font-medium">女</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存信息'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
