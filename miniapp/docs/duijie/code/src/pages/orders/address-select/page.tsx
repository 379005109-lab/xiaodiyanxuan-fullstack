import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockAddresses } from '../../../mocks/address';

export default function AddressSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/orders/confirm';
  
  const [addresses, setAddresses] = useState(mockAddresses);
  const [selectedId, setSelectedId] = useState(
    addresses.find(addr => addr.isDefault)?.id || addresses[0]?.id
  );

  const handleSelectAddress = (addressId: string) => {
    setSelectedId(addressId);
    // 返回上一页并传递选中的地址
    setTimeout(() => {
      navigate(from, { 
        state: { selectedAddressId: addressId },
        replace: true 
      });
    }, 200);
  };

  const handleAddNew = () => {
    navigate('/orders/address-edit', {
      state: { from: location.pathname }
    });
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
          <h1 className="text-[17px] font-semibold text-[#000000]">选择收货地址</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div 
        className="pb-[calc(80px+env(safe-area-inset-bottom))]"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top) + 8px)' }}
      >
        {/* 地址列表 */}
        {addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map((address) => (
              <button
                key={address.id}
                onClick={() => handleSelectAddress(address.id)}
                className={`w-full bg-white p-4 flex items-start gap-3 cursor-pointer transition-all duration-200 ${
                  selectedId === address.id ? 'border-l-4 border-[#FF6B00]' : ''
                }`}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center rounded-full border-2 mt-0.5 transition-all duration-200 ${
                    selectedId === address.id
                      ? 'bg-[#FF6B00] border-[#FF6B00]'
                      : 'border-[#C6C6C8] bg-white'
                  }`}
                >
                  {selectedId === address.id && (
                    <i className="ri-check-line text-[14px] text-white"></i>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-medium text-[#000000]">
                      {address.name}
                    </span>
                    <span className="text-[14px] text-[#8E8E93]">{address.phone}</span>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[11px] rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#8E8E93] leading-[1.5]">
                    {address.province} {address.city} {address.district}
                  </p>
                  <p className="text-[13px] text-[#8E8E93] leading-[1.5] mt-0.5">
                    {address.detail}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/orders/address-edit', {
                      state: { 
                        address,
                        from: location.pathname 
                      }
                    });
                  }}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer"
                >
                  <i className="ri-edit-line text-[18px] text-[#8E8E93]"></i>
                </button>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 flex flex-col items-center justify-center">
            <i className="ri-map-pin-line text-[48px] text-[#C6C6C8] mb-3"></i>
            <p className="text-[14px] text-[#8E8E93]">暂无收货地址</p>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
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
            onClick={handleAddNew}
            className="w-full h-12 bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full text-[16px] text-white font-semibold cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
          >
            <i className="ri-add-line text-[18px]"></i>
            新增地址
          </button>
        </div>
      </div>
    </div>
  );
}
