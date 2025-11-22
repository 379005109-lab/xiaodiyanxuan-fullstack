import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { loginUser } from '@/services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser(formData);
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        toast.success('登录成功！');
        // 根据用户角色跳转
        const user = response.data.user;
        if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'designer') {
          navigate('/admin/products');
        } else {
          navigate('/');
        }
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
            <h2 className="text-2xl font-bold">欢迎回来</h2>
            <p className="text-gray-600 mt-2">登录您的账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 账号 / 手机号 / 邮箱 */}
            <div>
              <label className="block text-sm font-medium mb-2">账号 / 手机号 / 邮箱</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="输入您的账号、手机号或邮箱"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="输入密码"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                <span className="text-sm text-gray-600">记住我</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                忘记密码？
              </Link>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 登录中...</> : '登录'}
            </button>

            <div className="text-center text-sm">
              <span className="text-gray-600">还没有账号？</span>
              <Link to="/register" className="text-primary-600 hover:text-primary-700 ml-1">
                立即注册
              </Link>
            </div>
          </form>

          {/* 快速登录 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="btn-secondary text-sm">
                微信登录
              </button>
              <button className="btn-secondary text-sm">
                手机验证码
              </button>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  )
}

