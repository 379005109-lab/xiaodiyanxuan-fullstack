import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockAddresses } from '../../../../mocks/address';

export default function AddressEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isAdd = !id;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  });

  useEffect(() => {
    if (id) {
      const address = mockAddresses.find(addr => addr.id === id);
      if (address) {
        setFormData(address);
      }
    }
  }, [id]);

  const handleSubmit = () => {
    // 验证表单
    if (!formData.name || !formData.phone || !formData.province || !formData.city || !formData.district || !formData.detail) {
      return;
    }
    // 保存逻辑
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20">
      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="px-4 h-11 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer active:opacity-60"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-[#1D1D1F]">
            {isAdd ? '添加地址' : '编辑地址'}
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 表单 */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* 收货人 */}
          <div className="flex items-center px-4 py-3 border-b border-[#E5E5EA]">
            <label className="w-20 text-[15px] text-[#1D1D1F]">收货人</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入收货人姓名"
              className="flex-1 text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none bg-transparent"
            />
          </div>

          {/* 手机号 */}
          <div className="flex items-center px-4 py-3 border-b border-[#E5E5EA]">
            <label className="w-20 text-[15px] text-[#1D1D1F]">手机号</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
              className="flex-1 text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none bg-transparent"
            />
          </div>

          {/* 省市区 */}
          <div className="flex items-center px-4 py-3 border-b border-[#E5E5EA]">
            <label className="w-20 text-[15px] text-[#1D1D1F]">所在地区</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="省"
                className="flex-1 px-2 py-1.5 text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none bg-[#F5F5F7] rounded-xl"
              />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="市"
                className="flex-1 px-2 py-1.5 text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none bg-[#F5F5F7] rounded-xl"
              />
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="区"
                className="flex-1 px-2 py-1.5 text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none bg-[#F5F5F7] rounded-xl"
              />
            </div>
          </div>

          {/* 详细地址 */}
          <div className="flex items-start px-4 py-3 border-b border-[#E5E5EA]">
            <label className="w-20 text-[15px] text-[#1D1D1F] pt-2">详细地址</label>
            <textarea
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              placeholder="街道、楼牌号等详细信息"
              rows={3}
              className="flex-1 text-[15px] text-[#1D1D1F] placeholder:text-[#C7C7CC] outline-none resize-none bg-transparent"
            />
          </div>

          {/* 设为默认 */}
          <div className="flex items-center justify-between px-4 py-3">
            <label className="text-[15px] text-[#1D1D1F]">设为默认地址</label>
            <button
              onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${
                formData.isDefault ? 'bg-[#1D1D1F]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  formData.isDefault ? 'translate-x-6' : 'translate-x-1'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-[#E5E5EA]">
        <button
          onClick={handleSubmit}
          className="w-full h-12 bg-white text-[#1D1D1F] text-[17px] font-medium rounded-2xl border border-[#D2D2D7] whitespace-nowrap cursor-pointer active:bg-[#F5F5F7] transition-all"
        >
          保存
        </button>
      </div>
    </div>
  );
}