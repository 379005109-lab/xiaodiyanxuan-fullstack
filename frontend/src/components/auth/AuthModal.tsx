import { useState, useEffect } from 'react'
import { X, User, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { loginUser } from '@/services/authService'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  })
  
  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    verifyCode: ''
  })
  
  // 验证码倒计时
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码
  const handleSendCode = async () => {
    if (!registerForm.phone) {
      toast.error('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
      toast.error('请输入正确的手机号')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: registerForm.phone })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('验证码已发送')
        setCountdown(60)
      } else {
        toast.error(data.message || '发送失败')
      }
    } catch (error) {
      toast.error('发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginForm.phone || !loginForm.password) {
      toast.error('请填写完整信息')
      return
    }
    
    try {
      setLoading(true)
      const response = await loginUser({
        username: loginForm.phone,
        password: loginForm.password
      })
      
      if (response.success && response.data) {
        login(response.data.user, response.data.token)
        toast.success('登录成功！')
        onClose()
      } else {
        toast.error(response.message || '登录失败')
      }
    } catch (error: any) {
      toast.error(error?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registerForm.phone || !registerForm.password || !registerForm.verifyCode) {
      toast.error('请填写完整信息')
      return
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('两次密码不一致')
      return
    }
    
    if (registerForm.password.length < 6) {
      toast.error('密码至少6位')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: registerForm.phone,
          password: registerForm.password,
          verifyCode: registerForm.verifyCode
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('注册成功！')
        // 自动登录
        login(data.data.user, data.data.token)
        onClose()
      } else {
        toast.error(data.message || '注册失败')
      }
    } catch (error: any) {
      toast.error(error?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙版背景 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in duration-200">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'login' ? (
          // 登录表单
          <form onSubmit={handleLogin}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-green-800">欢迎回来</h2>
              <p className="text-gray-500 mt-2">登录以访问您的定制需求和订单</p>
            </div>

            <div className="space-y-5">
              {/* 手机号 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">手机号码</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="请输入手机号"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    登录
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* 切换到注册 */}
            <div className="text-center mt-6">
              <span className="text-gray-500">还没有账号？</span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-green-700 hover:text-green-800 font-medium ml-1"
              >
                立即注册
              </button>
            </div>
          </form>
        ) : (
          // 注册表单
          <form onSubmit={handleRegister}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-green-800">注册账号</h2>
              <p className="text-gray-500 mt-2">加入小迪严选，开启高端家居之旅</p>
            </div>

            <div className="space-y-4">
              {/* 手机号 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">手机号码</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="请输入手机号"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="请输入密码"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 验证码 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="0000"
                    maxLength={6}
                    value={registerForm.verifyCode}
                    onChange={(e) => setRegisterForm({ ...registerForm, verifyCode: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-center tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || loading}
                    className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* 注册按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    立即注册
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* 切换到登录 */}
            <div className="text-center mt-6">
              <span className="text-gray-500">已有账号？</span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-green-700 hover:text-green-800 font-medium ml-1"
              >
                去登录
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
