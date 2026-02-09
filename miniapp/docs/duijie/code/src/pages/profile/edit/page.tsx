
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUser } from '../../../mocks/user';

export default function ProfileEditPage() {
  const navigate = useNavigate();

  // Initialize form data with fallback values to avoid undefined errors
  const [formData, setFormData] = useState({
    name: mockUser?.nickname ?? '',
    phone: mockUser?.phone ?? '',
    email: '',
    gender: 'male',
    birthday: '',
  });

  const [showToast, setShowToast] = useState(false);

  // Save handler with basic validation and error handling
  const handleSave = () => {
    // Simple validation example (you can expand as needed)
    if (!formData.name.trim()) {
      alert('请填写姓名');
      return;
    }
    if (!/^\d{11}$/.test(formData.phone.replace(/\*/g, '1'))) {
      alert('请输入有效的手机号');
      return;
    }

    try {
      // Here you would normally send `formData` to an API.
      // For this mock implementation we just show a toast.
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate(-1);
      }, 1500);
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存时出现错误，请稍后再试');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-6">
      {/* 导航栏 - Apple 风格 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center active:scale-95 transition-transform"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <span className="text-base font-medium text-[#1D1D1F]">编辑资料</span>
          <button
            onClick={handleSave}
            className="px-4 h-8 bg-[#1D1D1F] text-white text-sm font-medium rounded-full active:scale-95 transition-transform"
          >
            保存
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="mt-3 mx-4 bg-white rounded-2xl overflow-hidden">
        {/* 姓名 */}
        <div className="flex items-center px-4 h-14 border-b border-[#E5E5EA]">
          <span className="text-sm text-[#1D1D1F] w-20">姓名</span>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="flex-1 text-sm text-[#1D1D1F] text-right bg-transparent outline-none"
            placeholder="请输入姓名"
          />
        </div>

        {/* 手机号 */}
        <div className="flex items-center px-4 h-14 border-b border-[#E5E5EA]">
          <span className="text-sm text-[#1D1D1F] w-20">手机号</span>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="flex-1 text-sm text-[#1D1D1F] text-right bg-transparent outline-none"
            placeholder="请输入手机号"
          />
        </div>

        {/* 邮箱 */}
        <div className="flex items-center px-4 h-14 border-b border-[#E5E5EA]">
          <span className="text-sm text-[#1D1D1F] w-20">邮箱</span>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="flex-1 text-sm text-[#1D1D1F] text-right bg-transparent outline-none"
            placeholder="请输入邮箱"
          />
        </div>

        {/* 性别 */}
        <div className="flex items-center px-4 h-14 border-b border-[#E5E5EA]">
          <span className="text-sm text-[#1D1D1F] w-20">性别</span>
          <div className="flex-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'male' })}
              className={`px-4 h-8 rounded-full text-sm font-medium transition-all active:scale-95 ${
                formData.gender === 'male'
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#F5F5F7] text-[#6E6E73]'
              }`}
            >
              男
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'female' })}
              className={`px-4 h-8 rounded-full text-sm font-medium transition-all active:scale-95 ${
                formData.gender === 'female'
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#F5F5F7] text-[#6E6E73]'
              }`}
            >
              女
            </button>
          </div>
        </div>

        {/* 生日 */}
        <div className="flex items-center px-4 h-14">
          <span className="text-sm text-[#1D1D1F] w-20">生日</span>
          <input
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            className="flex-1 text-sm text-[#1D1D1F] text-right bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-[#1D1D1F]/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm">
            保存成功
          </div>
        </div>
      )}
    </div>
  );
}
