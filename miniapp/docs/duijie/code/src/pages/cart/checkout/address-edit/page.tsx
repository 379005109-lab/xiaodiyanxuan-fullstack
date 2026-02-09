import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockAddresses } from '../../../../mocks/address';

const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省'];
const cities: Record<string, string[]> = {
  '北京市': ['北京市'],
  '上海市': ['上海市'],
  '广东省': ['广州市', '深圳市', '东莞市', '佛山市'],
  '浙江省': ['杭州市', '宁波市', '温州市'],
  '江苏省': ['南京市', '苏州市', '无锡市'],
  '四川省': ['成都市', '绵阳市']
};
const districts: Record<string, string[]> = {
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区'],
  '广州市': ['天河区', '越秀区', '海珠区'],
  '深圳市': ['南山区', '福田区', '罗湖区'],
  '杭州市': ['西湖区', '上城区', '拱墅区'],
  '成都市': ['武侯区', '锦江区', '青羊区']
};

export default function AddressEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get('id');
  const isEdit = !!addressId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [detail, setDetail] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isEdit) {
      const address = mockAddresses.find(addr => addr.id === addressId);
      if (address) {
        setName(address.name);
        setPhone(address.phone.replace(/\*+/g, ''));
        setProvince(address.province);
        setCity(address.city);
        setDistrict(address.district);
        setDetail(address.detail);
        setIsDefault(address.isDefault);
      }
    }
  }, [isEdit, addressId]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToastMessage('请输入收货人姓名');
      return;
    }
    if (!phone.trim()) {
      showToastMessage('请输入手机号');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToastMessage('请输入正确的手机号');
      return;
    }
    if (!province || !city || !district) {
      showToastMessage('请选择所在地区');
      return;
    }
    if (!detail.trim()) {
      showToastMessage('请输入详细地址');
      return;
    }

    showToastMessage(isEdit ? '保存成功' : '添加成功');
    setTimeout(() => {
      navigate('/cart/checkout/address-select');
    }, 1000);
  };

  const regionText = province && city && district 
    ? `${province} ${city} ${district}`
    : '请选择省市区';

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 顶部导航栏 */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#C6C6C8]/30"
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
            {isEdit ? '编辑地址' : '新增地址'}
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }} className="p-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* 收货人 */}
          <div className="px-4 py-3 border-b border-[#F2F2F7]">
            <div className="flex items-center gap-3">
              <label className="w-20 text-[14px] text-[#000000] flex-shrink-0">收货人</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 text-[14px] text-[#000000] placeholder-[#C6C6C8] outline-none bg-transparent"
              />
            </div>
          </div>

          {/* 手机号 */}
          <div className="px-4 py-3 border-b border-[#F2F2F7]">
            <div className="flex items-center gap-3">
              <label className="w-20 text-[14px] text-[#000000] flex-shrink-0">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="flex-1 text-[14px] text-[#000000] placeholder-[#C6C6C8] outline-none bg-transparent"
              />
            </div>
          </div>

          {/* 所在地区 */}
          <button
            onClick={() => setShowRegionPicker(true)}
            className="w-full px-4 py-3 border-b border-[#F2F2F7] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <label className="w-20 text-[14px] text-[#000000] flex-shrink-0">所在地区</label>
              <span className={`flex-1 text-left text-[14px] ${
                province ? 'text-[#000000]' : 'text-[#C6C6C8]'
              }`}>
                {regionText}
              </span>
              <i className="ri-arrow-right-s-line text-[20px] text-[#C6C6C8]"></i>
            </div>
          </button>

          {/* 详细地址 */}
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <label className="w-20 text-[14px] text-[#000000] flex-shrink-0 pt-2">详细地址</label>
              <textarea
                placeholder="街道、楼牌号等"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="flex-1 h-20 text-[14px] text-[#000000] placeholder-[#C6C6C8] outline-none bg-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* 设为默认 */}
        <div className="mt-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <button
            onClick={() => setIsDefault(!isDefault)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <span className="text-[14px] text-[#000000]">设为默认地址</span>
            <div className={`w-12 h-7 rounded-full transition-colors duration-200 relative ${
              isDefault ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
            }`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                isDefault ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </div>
          </button>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full mt-6 h-[48px] bg-white border border-[#E5E5EA] rounded-full text-[16px] font-semibold text-[#1D1D1F] cursor-pointer whitespace-nowrap active:bg-[#F2F2F7] transition-colors duration-150 shadow-sm"
        >
          保存
        </button>
      </div>

      {/* 地区选择器 */}
      {showRegionPicker && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div 
            className="w-full bg-white rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
              <button
                onClick={() => setShowRegionPicker(false)}
                className="text-[16px] text-[#8E8E93] cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <h3 className="text-[16px] font-semibold text-[#000000]">选择地区</h3>
              <button
                onClick={() => {
                  if (province && city && district) {
                    setShowRegionPicker(false);
                  }
                }}
                className={`text-[16px] font-medium cursor-pointer whitespace-nowrap ${
                  province && city && district ? 'text-[#FF6B00]' : 'text-[#C6C6C8]'
                }`}
              >
                确定
              </button>
            </div>

            <div className="grid grid-cols-3 h-[240px]">
              {/* 省 */}
              <div className="overflow-y-auto border-r border-[#F2F2F7]">
                {provinces.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setProvince(p);
                      setCity('');
                      setDistrict('');
                    }}
                    className={`w-full px-3 py-2.5 text-[14px] text-left cursor-pointer whitespace-nowrap ${
                      province === p
                        ? 'bg-[#F2F2F7] text-[#FF6B00] font-medium'
                        : 'text-[#000000]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* 市 */}
              <div className="overflow-y-auto border-r border-[#F2F2F7]">
                {province && cities[province]?.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      setDistrict('');
                    }}
                    className={`w-full px-3 py-2.5 text-[14px] text-left cursor-pointer whitespace-nowrap ${
                      city === c
                        ? 'bg-[#F2F2F7] text-[#FF6B00] font-medium'
                        : 'text-[#000000]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* 区 */}
              <div className="overflow-y-auto">
                {city && districts[city]?.map(d => (
                  <button
                    key={d}
                    onClick={() => setDistrict(d)}
                    className={`w-full px-3 py-2.5 text-[14px] text-left cursor-pointer whitespace-nowrap ${
                      district === d
                        ? 'bg-[#F2F2F7] text-[#FF6B00] font-medium'
                        : 'text-[#000000]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-black/80 rounded-2xl">
          <p className="text-[14px] text-white whitespace-nowrap">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
