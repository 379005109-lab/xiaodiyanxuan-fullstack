import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion'
import { Phone, Send, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { registerUser } from '@/services/authService';
import type { RegisterFormData } from '@/types';

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [searchParams] = useSearchParams();

  // 表单数据
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');

  // UI 状态
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [shareToken, setShareToken] = useState('');

  // 初始化分享 token
  useEffect(() => {
    const token = searchParams.get('share_token');
    if (token) {
      setShareToken(token);
      toast.info('您正在通过好友分享链接注册，成功后将获得奖励！');
    }
  }, [searchParams]);

  // 短信倒计时
  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [smsCountdown]);

  // 发送短信验证码
  const handleSendSms = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入有效的手机号');
      return;
    }
    
    // 本地模拟短信验证
    const code = Math.random().toString().slice(2, 8);
    localStorage.setItem(`sms_code_${phone}`, code);
    
    setSmsSent(true);
    setSmsCountdown(60);
    toast.success(`验证码已发送 (测试码: ${code})`);
  };

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      toast.error('请输入手机号');
      return;
    }

    if (!smsCode) {
      toast.error('请输入验证码');
      return;
    }

    // 验证短信码
    const storedCode = localStorage.getItem(`sms_code_${phone}`);
    if (smsCode !== storedCode) {
      toast.error('验证码错误');
      return;
    }

    setIsLoading(true);
    try {
      // 生成临时用户名和邮箱
      const tempUsername = `user_${phone.slice(-4)}`;
      const tempEmail = `${phone}@temp.local`;
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const registerData: RegisterFormData = {
        username: tempUsername,
        email: tempEmail,
        phone: phone,
        password: tempPassword,
        shareToken: shareToken,
      };

      const { data } = await registerUser(registerData);
      if (data) {
        login(data.user, data.token);
        toast.success('注册成功！请选择您的身份');
        // 跳转到身份选择页面
        navigate('/role-select');
      }
    } catch (error: any) {
      toast.error(error.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="card">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">家</span>
              </div>
              <span className="text-2xl font-bold">品质家居</span>
            </Link>
            <h2 className="text-2xl font-bold">快速注册</h2>
            <p className="text-gray-600 mt-2">仅需手机号即可注册</p>
          </div>

          {/* 单页面表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="输入手机号"
                  className="input pl-10"
                  disabled={smsSent}
                />
              </div>
            </div>

            {/* 验证码输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">验证码</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.slice(0, 6))}
                    placeholder="输入6位验证码"
                    className="input text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={smsCountdown > 0 || !phone}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                    smsCountdown > 0 || !phone
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {smsCountdown > 0 ? `${smsCountdown}s` : '发送'}
                </button>
              </div>
              {!smsSent && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 点击"发送"获取验证码
                </p>
              )}
              {smsSent && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ 验证码已发送
                </p>
              )}
            </div>

            {/* 同意条款 */}
            <label className="flex items-start space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary-600 rounded mt-1" required />
              <span className="text-sm text-gray-600">
                我已阅读并同意
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 mx-1">
                  服务条款
                </Link>
                和
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 mx-1">
                  隐私政策
                </Link>
              </span>
            </label>

            {/* 提交按钮 */}
            <button 
              type="submit" 
              disabled={isLoading || !smsSent}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  登录
                </>
              )}
            </button>

            {/* 登录链接 */}
            <div className="text-center text-sm">
              <span className="text-gray-600">已有账号？</span>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 ml-1">
                立即登录
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
