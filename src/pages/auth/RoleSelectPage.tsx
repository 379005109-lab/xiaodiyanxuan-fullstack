import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Home, Hammer, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

type SelectableRole = Extract<UserRole, 'owner' | 'designer' | 'professional'>;

const roles: Array<{
  id: SelectableRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = [
  {
    id: 'owner',
    title: '业主',
    description: '购买家居产品和服务',
    icon: <Home className="h-8 w-8" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'designer',
    title: '设计师',
    description: '为客户提供设计服务',
    icon: <Briefcase className="h-8 w-8" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'professional',
    title: '从业者',
    description: '家居行业专业人士',
    icon: <Hammer className="h-8 w-8" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user, updateUserRole } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 检查用户是否已登录
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleRoleSelect = async (role: SelectableRole) => {
    setSelectedRole(role);
    setIsLoading(true);

    try {
      // 更新用户角色
      updateUserRole(role);
      toast.success(`已选择身份：${roles.find(r => r.id === role)?.title}`);

      // 根据角色跳转到对应的首页
      setTimeout(() => {
        if (role === 'owner') {
          navigate('/');
        } else if (role === 'designer') {
          navigate('/designer/dashboard');
        } else if (role === 'professional') {
          navigate('/professional/dashboard');
        }
      }, 500);
    } catch (error: any) {
      toast.error(error.message || '选择身份失败');
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="card p-8">
          {/* 标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">选择您的身份</h1>
            <p className="text-gray-600">
              选择最符合您的身份，我们将为您提供定制化的服务体验
            </p>
          </div>

          {/* 角色选择卡片 */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {roles.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleRoleSelect(role.id)}
                disabled={isLoading}
                className={`relative p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedRole === role.id
                    ? 'border-primary-600 bg-primary-50 shadow-lg'
                    : 'border-gray-200 hover:border-primary-300 bg-white'
                } ${isLoading && selectedRole !== role.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {/* 选中指示 */}
                {selectedRole === role.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}

                {/* 图标 */}
                <div className={`w-16 h-16 ${role.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <div className={role.color}>{role.icon}</div>
                </div>

                {/* 标题和描述 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.title}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>

                {/* 加载状态 */}
                {selectedRole === role.id && isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center justify-center gap-2 text-primary-600"
                  >
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">正在跳转...</span>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* 底部提示 */}
          <div className="text-center text-sm text-gray-600">
            <p>您可以在账户设置中随时更改身份</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
