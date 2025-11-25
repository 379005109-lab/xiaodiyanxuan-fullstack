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
  const [loginMethod, setLoginMethod] = useState<'password' | 'code'>('password') // 登录方式
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { login } = useAuthStore()
  
  // 登录表单
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: '',
    verifyCode: '' // 添加验证码字段
  })
  
  // 注册表单
  const [registerForm, setRegisterForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    verifyCode: ''
  })

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码（通用）
  const handleSendCode = async (isRegister: boolean = false) => {
    const phone = isRegister ? registerForm.phone : loginForm.phone
    if (!phone) {
      toast.error('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
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
    
    if (!loginForm.phone) {
      toast.error('请输入手机号')
      return
    }
    
    if (loginMethod === 'password' && !loginForm.password) {
      toast.error('请输入密码')
      return
    }
    
    if (loginMethod === 'code' && !loginForm.verifyCode) {
      toast.error('请输入验证码')
      return
    }
    
    try {
      setLoading(true)
      const response = await loginUser({
        username: loginForm.phone,
        password: loginMethod === 'password' ? loginForm.password : loginForm.verifyCode,
        loginType: loginMethod === 'code' ? 'code' : 'password'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-up">
      {/* 蒙版背景 */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
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
          {mode === 'login' ? (
            // 登录表单
            <form onSubmit={handleLogin}>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-stone-900 mb-1">欢迎回来</h2>
                <p className="text-stone-400 text-xs">登录以访问您的定制需求和订单</p>
              </div>

              <div className="space-y-3">
                {/* 手机号 */}
                <div>
                  <label className="text-xs text-stone-600 block mb-1.5">手机号码</label>
                  <input
                    type="tel"
                    placeholder="请输入手机号"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                    className="w-full bg-stone-50 border-0 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                {loginMethod === 'password' ? (
                  /* 密码登录 */
                  <div>
                    <label className="text-xs text-stone-600 block mb-1.5">密码</label>
                    <input
                      type="password"
                      placeholder="请输入密码"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full bg-stone-50 border-0 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                ) : (
                  /* 验证码登录 */
                  <div>
                    <label className="text-xs text-stone-600 block mb-1.5">验证码</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="0000"
                        maxLength={6}
                        value={loginForm.verifyCode}
                        onChange={(e) => setLoginForm({ ...loginForm, verifyCode: e.target.value })}
                        className="flex-1 bg-stone-50 border-0 rounded-lg px-4 py-3 text-sm text-center tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendCode(false)}
                        disabled={countdown > 0 || loading}
                        className="px-4 py-3 bg-stone-50 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {countdown > 0 ? `${countdown}s` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-900 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      登录
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 登录方式切换 */}
                <div className="text-center text-xs text-stone-400 mt-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod(loginMethod === 'password' ? 'code' : 'password')}
                    className="hover:text-primary transition-colors"
                  >
                    {loginMethod === 'password' ? '验证码登录' : '密码登录'}
                  </button>
                </div>
              </div>

              {/* 切换到注册 */}
              <div className="mt-5 text-center text-xs text-stone-400">
                还没有账号？
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-primary ml-1 hover:underline"
                >
                  立即注册
                </button>
              </div>
            </form>
          ) : (
            // 注册表单
            <form onSubmit={handleRegister}>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-stone-900 mb-1">注册账号</h2>
                <p className="text-stone-400 text-xs">加入小迪严选，开启高端家居之旅</p>
              </div>

              <div className="space-y-3">
                {/* 手机号 */}
                <div>
                  <label className="text-xs text-stone-600 block mb-1.5">手机号码</label>
                  <input
                    type="tel"
                    placeholder="请输入手机号"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="w-full bg-stone-50 border-0 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                {/* 密码 */}
                <div>
                  <label className="text-xs text-stone-600 block mb-1.5">密码</label>
                  <input
                    type="password"
                    placeholder="请输入密码"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full bg-stone-50 border-0 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                {/* 验证码 */}
                <div>
                  <label className="text-xs text-stone-600 block mb-1.5">验证码</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0000"
                      maxLength={6}
                      value={registerForm.verifyCode}
                      onChange={(e) => setRegisterForm({ ...registerForm, verifyCode: e.target.value })}
                      className="flex-1 bg-stone-50 border-0 rounded-lg px-4 py-3 text-sm text-center tracking-widest focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendCode(true)}
                      disabled={countdown > 0 || loading}
                      className="px-4 py-3 bg-stone-50 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>

                {/* 注册按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-900 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      立即注册
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* 切换到登录 */}
              <div className="mt-5 text-center text-xs text-stone-400">
                已有账号？
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary ml-1 hover:underline"
                >
                  去登录
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
