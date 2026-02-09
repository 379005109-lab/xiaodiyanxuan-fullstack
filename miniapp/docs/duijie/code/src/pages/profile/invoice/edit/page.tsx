
import { useState, useEffect } from 'react';
import { mockInvoices } from '../../../../mocks/invoice';

type InvoiceType = 'personal' | 'company';

export default function InvoiceEditPage() {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('personal');
  const [isDefault, setIsDefault] = useState(false);
  const [title, setTitle] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // 获取 URL 参数
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (id) {
        const invoice = mockInvoices.find(item => item.id === id);
        if (invoice) {
          setInvoiceType(invoice.type);
          setIsDefault(invoice.isDefault);
          setTitle(invoice.title);
          setTaxNumber(invoice.taxNumber);
          setAddress(invoice.address || '');
          setPhone(invoice.phone || '');
          setBank(invoice.bankName || '');
          setBankAccount(invoice.bankAccount || '');
        }
      }
    } catch (error) {
      console.error('Failed to parse invoice id:', error);
    }
  }, []);

  const handleSave = () => {
    console.log('保存发票信息:', {
      invoiceType,
      isDefault,
      title,
      taxNumber,
      address,
      phone,
      bank,
      bankAccount,
    });
    window.history.back();
  };

  const pageTitle = new URLSearchParams(window.location.search).get('id')
    ? '编辑发票'
    : '添加发票';

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => window.history.back()}
            className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <span className="text-[15px] font-semibold text-[#1D1D1F]">{pageTitle}</span>
          <div className="w-6"></div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="p-4">
        {/* 发票类型 */}
        <div className="bg-white rounded-2xl p-4 mb-3">
          <div className="text-[#1D1D1F] font-medium mb-3">发票类型</div>
          <div className="flex gap-3">
            <button
              onClick={() => setInvoiceType('personal')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                invoiceType === 'personal'
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#F5F5F7] text-[#6E6E73]'
              }`}
            >
              个人
            </button>
            <button
              onClick={() => setInvoiceType('company')}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                invoiceType === 'company'
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#F5F5F7] text-[#6E6E73]'
              }`}
            >
              企业
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-2xl p-4 mb-3">
          <div className="space-y-4">
            <div>
              <label className="block text-[#1D1D1F] text-sm font-medium mb-2">
                {invoiceType === 'personal' ? '姓名' : '企业名称'}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={invoiceType === 'personal' ? '请输入姓名' : '请输入企业名称'}
                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
              />
            </div>

            <div>
              <label className="block text-[#1D1D1F] text-sm font-medium mb-2">税号</label>
              <input
                type="text"
                value={taxNumber}
                onChange={e => setTaxNumber(e.target.value)}
                placeholder="请输入税号"
                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
              />
            </div>
          </div>
        </div>

        {/* 企业详细信息 */}
        {invoiceType === 'company' && (
          <div className="bg-white rounded-2xl p-4 mb-3">
            <div className="space-y-4">
              <div>
                <label className="block text-[#1D1D1F] text-sm font-medium mb-2">注册地址</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="请输入注册地址"
                  className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] text-sm font-medium mb-2">注册电话</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="请输入注册电话"
                  className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] text-sm font-medium mb-2">开户银行</label>
                <input
                  type="text"
                  value={bank}
                  onChange={e => setBank(e.target.value)}
                  placeholder="请输入开户银行"
                  className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] text-sm font-medium mb-2">银行账号</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  placeholder="请输入银行账号"
                  className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#C7C7CC] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* 设为默认 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[#1D1D1F] font-medium">设为默认</span>
            <button
              onClick={() => setIsDefault(!isDefault)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isDefault ? 'bg-[#1D1D1F]' : 'bg-[#E5E5EA]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  isDefault ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7] to-transparent">
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-[#1D1D1F] text-white rounded-full font-medium active:scale-[0.98] transition-transform"
        >
          保存
        </button>
      </div>
    </div>
  );
}
