import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AddressEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editAddress = location.state?.address;
  const from = location.state?.from || '/orders/address-select';

  const [name, setName] = useState(editAddress?.name || '');
  const [phone, setPhone] = useState(editAddress?.phone || '');
  const [province, setProvince] = useState(editAddress?.province || '');
  const [city, setCity] = useState(editAddress?.city || '');
  const [district, setDistrict] = useState(editAddress?.district || '');
  const [detail, setDetail] = useState(editAddress?.detail || '');
  const [isDefault, setIsDefault] = useState(editAddress?.isDefault || false);
  const [showToast, setShowToast] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const canSave = name && phone && province && city && district && detail;

  const handleSave = () => {
    if (!canSave) return;

    // 显示成功提示
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate(from, { replace: true });
    }, 1500);
  };

  const handleRegionSelect = () => {
    // 模拟选择地区
    setProvince('广东省');
    setCity('深圳市');
    setDistrict('南山区');
    setShowRegionPicker(false);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 导航栏 */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-[44px] flex items-center justify-between px-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-line text-[20px] text-[#000000]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#000000]">
            {editAddress ? '编辑地址' : '新增地址'}
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div 
        className="pb-[calc(80px+env(safe-area-inset-bottom))]"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top) + 8px)' }}
      >
        <div className="bg-white">
          {/* 收货人姓名 */}
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <label className="text-[13px] text-[#8E8E93] mb-2 block">收货人</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入收货人姓名"
              className="w-full h-11 px-4 bg-[#F2F2F7] rounded-lg text-[14px] text-[#000000] placeholder:text-[#C6C6C8] outline-none"
            />
          </div>

          {/* 手机号 */}
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <label className="text-[13px] text-[#8E8E93] mb-2 block">手机号码</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号码"
              maxLength={11}
              className="w-full h-11 px-4 bg-[#F2F2F7] rounded-lg text-[14px] text-[#000000] placeholder:text-[#C6C6C8] outline-none"
            />
          </div>

          {/* 所在地区 */}
          <div className="px-4 py-3 border-b border-[#E5E5EA]">
            <label className="text-[13px] text-[#8E8E93] mb-2 block">所在地区</label>
            <button
              onClick={() => setShowRegionPicker(true)}
              className="w-full h-11 px-4 bg-[#F2F2F7] rounded-lg text-[14px] text-left flex items-center justify-between cursor-pointer"
            >
              <span className={province ? 'text-[#000000]' : 'text-[#C6C6C8]'}>
                {province && city && district
                  ? `${province} ${city} ${district}`
                  : '请选择省市区'}
              </span>
              <i className="ri-arrow-right-s-line text-[18px] text-[#C6C6C8]"></i>
            </button>
          </div>

          {/* 详细地址 */}
          <div className="px-4 py-3">
            <label className="text-[13px] text-[#8E8E93] mb-2 block">详细地址</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="街道、楼牌号等详细信息"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-[#F2F2F7] rounded-lg text-[14px] text-[#000000] placeholder:text-[#C6C6C8] outline-none resize-none"
            />
            <div className="flex items-center justify-end mt-2">
              <span className="text-[11px] text-[#C6C6C8]">{detail.length}/200</span>
            </div>
          </div>
        </div>

        {/* 设为默认 */}
        <div className="bg-white mt-2 px-4 py-3">
          <button
            onClick={() => setIsDefault(!isDefault)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <span className="text-[15px] text-[#000000]">设为默认地址</span>
            <div
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                isDefault ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  isDefault ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div 
        className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E5EA]"
        style={{ 
          bottom: '0',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          paddingTop: '12px'
        }}
      >
        <div className="px-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full h-12 rounded-full text-[16px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 ${
              canSave
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white'
                : 'bg-[#E5E5EA] text-[#C6C6C8]'
            }`}
          >
            保存
          </button>
        </div>
      </div>

      {/* 地区选择器 */}
      {showRegionPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div 
            className="w-full bg-white rounded-t-2xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
              <button
                onClick={() => setShowRegionPicker(false)}
                className="text-[16px] text-[#8E8E93] cursor-pointer"
              >
                取消
              </button>
              <h3 className="text-[17px] font-semibold text-[#000000]">选择地区</h3>
              <button
                onClick={handleRegionSelect}
                className="text-[16px] text-[#FF6B00] font-medium cursor-pointer"
              >
                确定
              </button>
            </div>
            <div className="p-8 text-center">
              <p className="text-[14px] text-[#8E8E93]">地区选择器占位</p>
              <p className="text-[12px] text-[#C6C6C8] mt-2">
                实际项目中可接入省市区三级联动选择器
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 rounded-2xl px-6 py-4 flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-[#34C759] rounded-full mb-2">
              <i className="ri-check-line text-[24px] text-white"></i>
            </div>
            <p className="text-[14px] text-white">保存成功</p>
          </div>
        </div>
      )}
    </div>
  );
}
