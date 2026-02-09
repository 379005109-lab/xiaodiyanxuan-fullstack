import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Toast 组件
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-[#1D1D1F]/90 backdrop-blur-sm text-white text-[15px] px-6 py-3 rounded-2xl shadow-lg animate-[fadeIn_0.2s_ease-out]">
      {message}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<'account' | 'phone'>('account');
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  // 账号密码登录
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 手机号登录
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  
  // 协议勾选
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 显示 Toast
  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone) {
      showToast('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号');
      return;
    }
    if (countdown > 0 || isSending) return;
    
    setIsSending(true);
    // 模拟发送验证码
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSending(false);
    setCountdown(60);
    showToast('验证码已发送');
  };

  // 账号密码登录
  const handleAccountLogin = () => {
    if (!account) {
      showToast('请输入账号');
      return;
    }
    if (!password) {
      showToast('请输入密码');
      return;
    }
    if (!agreeTerms) {
      showToast('请先同意用户协议和隐私政策');
      return;
    }
    // 模拟登录成功
    showToast('登录成功');
    setTimeout(() => {
      navigate('/profile');
    }, 1000);
  };

  // 手机号登录
  const handlePhoneLogin = () => {
    if (!phone) {
      showToast('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号');
      return;
    }
    if (!verifyCode) {
      showToast('请输入验证码');
      return;
    }
    if (verifyCode.length !== 6) {
      showToast('请输入6位验证码');
      return;
    }
    if (!agreeTerms) {
      showToast('请先同意用户协议和隐私政策');
      return;
    }
    // 模拟登录成功
    showToast('登录成功');
    setTimeout(() => {
      navigate('/profile');
    }, 1000);
  };

  // 判断按钮是否可用
  const isAccountLoginDisabled = !account || !password || !agreeTerms;
  const isPhoneLoginDisabled = !phone || !verifyCode || verifyCode.length !== 6 || !agreeTerms;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* 底部背景图片区域 - 占据底部 35-45% */}
      <div className="fixed bottom-0 left-0 right-0 h-[40vh] z-0">
        {/* 背景图片 */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://readdy.ai/api/search-image?query=Cinematic%20luxury%20minimalist%20bedroom%20interior%20with%20soft%20volumetric%20side%20lighting%20and%20gentle%20ambient%20glow%20creating%20atmospheric%20depth.%20Desaturated%20warm%20neutral%20palette%20featuring%20beige%20grey%20sand%20tones%20and%20rich%20walnut%20wood%20accents.%20Clean%20architectural%20composition%20with%20refined%20textures%20subtle%20shadows%20and%20restrained%20contrast.%20Empty%20serene%20space%20with%20no%20human%20presence%20no%20text%20no%20logos%20no%20watermarks%20no%20UI%20elements.%20Professional%20photography%20style%20with%20shallow%20depth%20of%20field%20and%20premium%20material%20finishes.%20High%20end%20residential%20design%20aesthetic%20evoking%20tranquility%20and%20sophisticated%20elegance&width=720&height=1280&seq=login-bg-luxury-bedroom-001&orientation=portrait)'
          }}
        ></div>
        
        {/* 高斯虚化 + 白色渐变蒙版 */}
        <div 
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 15%, rgba(255,255,255,0.7) 35%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%)'
          }}
        ></div>
      </div>

      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
          >
            <i className="ri-arrow-left-s-line text-2xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-[#1D1D1F] pr-8">登录</h1>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 px-6 pt-10">
        {/* Logo 和欢迎语 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 bg-[#F5F5F7] rounded-full flex items-center justify-center border border-[#E5E5EA]">
            <i className="ri-sofa-line text-4xl text-[#1D1D1F]"></i>
          </div>
          <h2 className="text-[24px] font-semibold text-[#1D1D1F] mb-2">欢迎回来</h2>
          <p className="text-[15px] text-[#6E6E73]">登录后享受更多会员专属权益</p>
        </div>

        {/* 登录方式切换 */}
        <div className="flex bg-[#F5F5F7] rounded-full p-1 mb-8">
          <button
            onClick={() => setLoginType('account')}
            className={`flex-1 h-9 rounded-full text-[15px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
              loginType === 'account'
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#8E8E93]'
            }`}
          >
            账号密码登录
          </button>
          <button
            onClick={() => setLoginType('phone')}
            className={`flex-1 h-9 rounded-full text-[15px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
              loginType === 'phone'
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#8E8E93]'
            }`}
          >
            手机号登录
          </button>
        </div>

        {/* 账号密码登录表单 */}
        {loginType === 'account' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            {/* 账号输入 */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-user-line text-lg text-[#8E8E93]"></i>
              </div>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号/手机号"
                className="w-full h-12 pl-12 pr-4 bg-[#F5F5F7] rounded-xl text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93] border border-transparent focus:border-[#C7C7CC] focus:bg-white outline-none transition-all duration-200"
              />
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-lock-line text-lg text-[#8E8E93]"></i>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full h-12 pl-12 pr-12 bg-[#F5F5F7] rounded-xl text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93] border border-transparent focus:border-[#C7C7CC] focus:bg-white outline-none transition-all duration-200"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                <i className={`text-lg text-[#8E8E93] ${showPassword ? 'ri-eye-line' : 'ri-eye-off-line'}`}></i>
              </button>
            </div>

            {/* 忘记密码 */}
            <div className="flex justify-end">
              <button className="text-[14px] text-[#8E8E93] cursor-pointer whitespace-nowrap transition-opacity duration-150 active:opacity-60">
                忘记密码？
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              onClick={handleAccountLogin}
              disabled={isAccountLoginDisabled}
              className={`w-full h-12 rounded-[14px] text-[17px] font-medium whitespace-nowrap cursor-pointer transition-all duration-200 ${
                isAccountLoginDisabled
                  ? 'bg-[#F5F5F7] text-[#C7C7CC] border border-[#E5E5EA]'
                  : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] active:bg-[#F5F5F7] shadow-sm'
              }`}
            >
              登录
            </button>
          </div>
        )}

        {/* 手机号登录表单 */}
        {loginType === 'phone' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            {/* 手机号输入 */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-smartphone-line text-lg text-[#8E8E93]"></i>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                className="w-full h-12 pl-12 pr-4 bg-[#F5F5F7] rounded-xl text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93] border border-transparent focus:border-[#C7C7CC] focus:bg-white outline-none transition-all duration-200"
              />
            </div>

            {/* 验证码输入 */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ri-shield-check-line text-lg text-[#8E8E93]"></i>
              </div>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入验证码"
                className="w-full h-12 pl-12 pr-28 bg-[#F5F5F7] rounded-xl text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93] border border-transparent focus:border-[#C7C7CC] focus:bg-white outline-none transition-all duration-200"
              />
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || isSending}
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-lg text-[14px] font-medium whitespace-nowrap cursor-pointer transition-all duration-200 ${
                  countdown > 0 || isSending
                    ? 'bg-[#F5F5F7] text-[#C7C7CC] border border-[#E5E5EA]'
                    : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] active:bg-[#F5F5F7]'
                }`}
              >
                {isSending ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              onClick={handlePhoneLogin}
              disabled={isPhoneLoginDisabled}
              className={`w-full h-12 rounded-[14px] text-[17px] font-medium whitespace-nowrap cursor-pointer transition-all duration-200 mt-6 ${
                isPhoneLoginDisabled
                  ? 'bg-[#F5F5F7] text-[#C7C7CC] border border-[#E5E5EA]'
                  : 'bg-white text-[#1D1D1F] border border-[#D2D2D7] active:bg-[#F5F5F7] shadow-sm'
              }`}
            >
              登录
            </button>
          </div>
        )}

        {/* 协议勾选 */}
        <div className="flex items-start gap-3 mt-6">
          <button
            onClick={() => setAgreeTerms(!agreeTerms)}
            className={`w-5 h-5 flex-shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
              agreeTerms
                ? 'bg-[#1D1D1F] border-[#1D1D1F]'
                : 'bg-white border-[#D2D2D7]'
            }`}
          >
            {agreeTerms && <i className="ri-check-line text-xs text-white"></i>}
          </button>
          <p className="text-[13px] text-[#8E8E93] leading-relaxed">
            我已阅读并同意
            <button className="text-[#1D1D1F] cursor-pointer whitespace-nowrap">《用户协议》</button>
            和
            <button className="text-[#1D1D1F] cursor-pointer whitespace-nowrap">《隐私政策》</button>
          </p>
        </div>

        {/* 分割线 */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-[#E5E5EA]"></div>
          <span className="text-[13px] text-[#8E8E93]">其他登录方式</span>
          <div className="flex-1 h-px bg-[#E5E5EA]"></div>
        </div>

        {/* 第三方登录 */}
        <div className="flex justify-center gap-8">
          <button className="w-12 h-12 bg-[#07C160]/10 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 border border-[#07C160]/20">
            <i className="ri-wechat-fill text-2xl text-[#07C160]"></i>
          </button>
          <button className="w-12 h-12 bg-[#1296DB]/10 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 border border-[#1296DB]/20">
            <i className="ri-alipay-fill text-2xl text-[#1296DB]"></i>
          </button>
          <button className="w-12 h-12 bg-[#F5F5F7] rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 border border-[#E5E5EA]">
            <i className="ri-apple-fill text-2xl text-[#1D1D1F]"></i>
          </button>
        </div>

        {/* 注册入口 */}
        <div className="text-center mt-10 pb-10">
          <p className="text-[15px] text-[#8E8E93]">
            还没有账号？
            <button 
              onClick={() => navigate('/register')}
              className="text-[#1D1D1F] font-medium ml-1 cursor-pointer whitespace-nowrap transition-opacity duration-150 active:opacity-60"
            >
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
