import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  {
    id: 1,
    name: '张三',
    phone: '138****8888',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: '科技园南区深圳湾科技生态园10栋A座',
    isDefault: true,
  },
  {
    id: 2,
    name: '李四',
    phone: '139****9999',
    province: '广东省',
    city: '广州市',
    district: '天河区',
    detail: '珠江新城花城大道88号',
    isDefault: false,
  },
];

export default function AddressPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSetDefault = (id: number) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setAddresses(addresses.filter((addr) => addr.id !== deleteId));
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center active:opacity-60"
          >
            <i className="ri-arrow-left-s-line text-[#1D1D1F] text-xl"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">收货地址</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 地址列表 */}
      <div className="px-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="mt-3 bg-white rounded-2xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[17px] font-semibold text-[#1D1D1F]">
                    {address.name}
                  </span>
                  <span className="text-[17px] text-[#1D1D1F]">{address.phone}</span>
                  {address.isDefault && (
                    <span className="px-2 py-0.5 bg-[#1D1D1F] text-white text-xs rounded-full">
                      默认
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-[#6E6E73] leading-relaxed">
                  {address.province} {address.city} {address.district} {address.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#E5E5EA]">
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="flex-1 h-10 bg-white text-[#6E6E73] text-[15px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap"
                >
                  设为默认
                </button>
              )}
              <button
                onClick={() => navigate(`/profile/address/edit?id=${address.id}`)}
                className="flex-1 h-10 bg-white text-[#6E6E73] text-[15px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(address.id)}
                className="flex-1 h-10 bg-white text-[#6E6E73] text-[15px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加地址按钮 */}
      <div className="fixed bottom-24 left-0 right-0 px-4">
        <button
          onClick={() => navigate('/profile/address/edit')}
          className="w-full h-12 bg-white text-[#1D1D1F] text-[17px] font-medium rounded-2xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap"
        >
          添加新地址
        </button>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-[20px] w-full max-w-xs overflow-hidden">
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F7] rounded-full flex items-center justify-center">
                <i className="ri-delete-bin-line text-[32px] text-[#6E6E73]"></i>
              </div>
              <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">确认删除地址？</h3>
              <p className="text-[15px] text-[#6E6E73]">删除后无法恢复</p>
            </div>
            <div className="grid grid-cols-2 border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="h-14 text-[17px] text-[#6E6E73] active:bg-[#F5F5F7] transition-colors border-r border-[#E5E5EA]"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="h-14 text-[17px] text-[#1D1D1F] font-medium active:bg-[#F5F5F7] transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}