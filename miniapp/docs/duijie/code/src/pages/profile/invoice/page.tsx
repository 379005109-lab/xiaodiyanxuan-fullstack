
import { useState } from 'react';
import { mockInvoices } from '../../../mocks/invoice';
import { useNavigate } from 'react-router-dom';

export default function InvoicePage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState(mockInvoices);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setInvoices(invoices.filter((inv) => inv.id !== deleteId));
    }
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const handleSetDefault = (id: string) => {
    setInvoices(
      invoices.map((inv) => ({
        ...inv,
        isDefault: inv.id === id,
      }))
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20">
      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 px-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 flex items-center justify-center active:opacity-60"
          >
            <i className="ri-arrow-left-s-line text-[#1D1D1F] text-xl"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">发票管理</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 发票列表 */}
      <div className="px-4">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="mt-3 bg-white rounded-2xl p-4"
          >
            {/* 标题行 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[17px] font-semibold text-[#1D1D1F]">
                {invoice.title}
              </span>
              {invoice.isDefault && (
                <span className="px-2 py-0.5 bg-[#1D1D1F] text-white text-xs rounded-full">
                  默认
                </span>
              )}
            </div>

            {/* 类型标签 */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-2.5 py-1 bg-[#F5F5F7] text-[#6E6E73] text-[13px] rounded-lg">
                {invoice.type === 'company' ? '企业' : '个人'}
              </span>
            </div>

            {/* 详细信息 */}
            <div className="space-y-1.5">
              {invoice.taxNumber && (
                <div className="flex items-start">
                  <span className="text-[13px] text-[#8E8E93] w-14 shrink-0">税号</span>
                  <span className="text-[14px] text-[#6E6E73]">{invoice.taxNumber}</span>
                </div>
              )}
              {invoice.type === 'company' && (
                <>
                  {invoice.address && (
                    <div className="flex items-start">
                      <span className="text-[13px] text-[#8E8E93] w-14 shrink-0">地址</span>
                      <span className="text-[14px] text-[#6E6E73]">{invoice.address}</span>
                    </div>
                  )}
                  {invoice.phone && (
                    <div className="flex items-start">
                      <span className="text-[13px] text-[#8E8E93] w-14 shrink-0">电话</span>
                      <span className="text-[14px] text-[#6E6E73]">{invoice.phone}</span>
                    </div>
                  )}
                  {invoice.bankName && (
                    <div className="flex items-start">
                      <span className="text-[13px] text-[#8E8E93] w-14 shrink-0">开户行</span>
                      <span className="text-[14px] text-[#6E6E73]">{invoice.bankName}</span>
                    </div>
                  )}
                  {invoice.bankAccount && (
                    <div className="flex items-start">
                      <span className="text-[13px] text-[#8E8E93] w-14 shrink-0">账号</span>
                      <span className="text-[14px] text-[#6E6E73]">{invoice.bankAccount}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3 pt-3 mt-3 border-t border-[#E5E5EA]">
              {!invoice.isDefault && (
                <button
                  onClick={() => handleSetDefault(invoice.id)}
                  className="flex-1 h-10 bg-white text-[#6E6E73] text-[15px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
                >
                  设为默认
                </button>
              )}
              <button
                onClick={() => navigate(`/profile/invoice/edit?id=${invoice.id}`)}
                className="flex-1 h-10 bg-white text-[#6E6E73] text-[15px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(invoice.id)}
                className="flex-1 h-10 bg-white text-[#6E6E73] text-[15px] rounded-xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部添加按钮 */}
      <div className="fixed bottom-24 left-0 right-0 px-4">
        <button
          onClick={() => navigate('/profile/invoice/edit')}
          className="w-full h-12 bg-white text-[#1D1D1F] text-[17px] font-medium rounded-2xl border border-[#D2D2D7] active:bg-[#F5F5F7] transition-all whitespace-nowrap cursor-pointer"
        >
          添加发票抬头
        </button>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-[20px] w-full max-w-xs overflow-hidden">
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F7] rounded-full flex items-center justify-center">
                <i className="ri-delete-bin-line text-[32px] text-[#6E6E73]"></i>
              </div>
              <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">确认删除发票抬头？</h3>
              <p className="text-[15px] text-[#6E6E73]">删除后无法恢复</p>
            </div>
            <div className="grid grid-cols-2 border-t border-[#E5E5EA]">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="h-14 text-[17px] text-[#6E6E73] active:bg-[#F5F5F7] transition-colors border-r border-[#E5E5EA] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="h-14 text-[17px] text-[#1D1D1F] font-medium active:bg-[#F5F5F7] transition-colors cursor-pointer"
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
