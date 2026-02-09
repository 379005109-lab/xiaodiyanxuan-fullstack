
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAddresses } from '../../../../mocks/address';

export default function AddressSelectPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(mockAddresses);
  const [selectedId, setSelectedId] = useState(addresses.find(addr => addr.isDefault)?.id || '');

  const handleSelectAddress = (id: string) => {
    setSelectedId(id);
    setTimeout(() => {
      navigate('/cart/checkout', { state: { selectedAddressId: id } });
    }, 200);
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center active:opacity-60 cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-[#1D1D1F] text-xl"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">选择收货地址</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 地址列表 */}
      <div className="px-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            onClick={() => handleSelectAddress(address.id)}
            className={`mt-3 bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
              selectedId === address.id ? 'ring-1 ring-[#1D1D1F]' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* 选中标记 */}
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-[18px] h-[18px] flex items-center justify-center rounded-full border-[1.5px] transition-all duration-200 ${
                  selectedId === address.id
                    ? 'bg-[#1D1D1F] border-[#1D1F1F]'
                    : 'border-[#C6C6C8] bg-white'
                }`}>
                  {selectedId === address.id && (
                    <i className="ri-check-line text-[11px] text-white"></i>
                  )}
                </div>
              </div>

              {/* 地址信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[17px] font-semibold text-[#1D1D1F]">{address.name}</span>
                  <span className="text-[15px] text-[#6E6E73]">{address.phone}</span>
                  {address.isDefault && (
                    <span className="px-2 py-0.5 bg-[#1D1D1F] text-white text-[11px] rounded-full whitespace-nowrap">默认</span>
                  )}
                </div>
                <p className="text-[14px] text-[#6E6E73] leading-relaxed">
                  {address.province}{address.city}{address.district}{address.detail}
                </p>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="flex items-center gap-3 pt-3 mt-3 border-t border-[#E5E5EA]">
              {!address.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(address.id);
                  }}
                  className="flex-1 h-9 bg-white text-[#6E6E73] text-[14px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
                >
                  设为默认
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/cart/checkout/address-edit?id=${address.id}`);
                }}
                className="flex-1 h-9 bg-white text-[#6E6E73] text-[14px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
              >
                编辑
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="mt-3 bg-white rounded-2xl p-8 flex flex-col items-center justify-center">
            <i className="ri-map-pin-line text-[48px] text-[#C6C6C8] mb-3"></i>
            <p className="text-[14px] text-[#8E8E93]">暂无收货地址</p>
          </div>
        )}
      </div>

      {/* 底部新增按钮 */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <button
          onClick={() => navigate('/cart/checkout/address-edit')}
          className="w-full h-12 bg-white text-[#1D1D1F] text-[17px] font-medium rounded-2xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
        >
          添加新地址
        </button>
      </div>
    </div>
  );
}
