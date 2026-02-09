import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartItems as initialCartItems, CartItem } from '../../mocks/cart';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // 计算选中商品数量和总价
  const { selectedCount, totalPrice, allSelected } = useMemo(() => {
    const selected = cartItems.filter(item => item.selected);
    return {
      selectedCount: selected.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: selected.reduce((sum, item) => sum + item.price * item.quantity, 0),
      allSelected: cartItems.length > 0 && cartItems.every(item => item.selected)
    };
  }, [cartItems]);

  // 切换单个商品选中状态
  const toggleItemSelect = (id: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    setCartItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  // 修改数量
  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity >= 1 && newQuantity <= item.stock) {
          return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }));
  };

  // 删除商品
  const handleDelete = (id: string) => {
    setDeleteItemId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      setCartItems(prev => prev.filter(item => item.id !== deleteItemId));
    }
    setShowDeleteConfirm(false);
    setDeleteItemId(null);
  };

  // 批量删除选中商品
  const deleteSelected = () => {
    setCartItems(prev => prev.filter(item => !item.selected));
  };

  // 结算
  const handleCheckout = () => {
    if (selectedCount === 0) {
      return;
    }
    navigate('/cart/checkout');
  };

  const recommendProducts = [
    {
      id: 'SF002',
      name: '北欧简约布艺沙发',
      price: 5680,
      image: 'https://readdy.ai/api/search-image?query=Scandinavian%20minimalist%20fabric%20sofa%20with%20clean%20lines%20and%20comfortable%20cushions%20in%20neutral%20gray%20color%2C%20modern%20Nordic%20living%20room%20furniture%20with%20wooden%20legs%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20white%20background&width=800&height=800&seq=prod-sf002&orientation=squarish'
    },
    {
      id: 'LT001',
      name: '北欧创意落地灯',
      price: 680,
      image: 'https://readdy.ai/api/search-image?query=Scandinavian%20creative%20floor%20lamp%20with%20modern%20tripod%20design%20in%20natural%20wood%20and%20white%20fabric%20shade%2C%20minimalist%20Nordic%20lighting%20fixture%20with%20adjustable%20height%2C%20professional%20product%20photography%20with%20soft%20lighting%20on%20clean%20white%20background&width=800&height=800&seq=prod-lt001&orientation=squarish'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="h-14 flex items-center justify-between px-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
          >
            <i className="ri-arrow-left-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">购物车</h1>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-[15px] text-[#1D1D1F] cursor-pointer active:scale-95 transition-transform min-w-[50px] text-right"
          >
            {isEditing ? '完成' : '管理'}
          </button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        /* 空购物车 */
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-28 h-28 flex items-center justify-center bg-white rounded-full mb-6 shadow-sm">
            <i className="ri-shopping-cart-line text-5xl text-[#C6C6C8]"></i>
          </div>
          <p className="text-[17px] font-medium text-[#1D1D1F] mb-2">购物车是空的</p>
          <p className="text-[14px] text-[#6E6E73] mb-6">快去挑选心仪的商品吧</p>
          <Link 
            to="/products/category"
            className="h-[48px] px-8 bg-white border border-[#D2D2D7] rounded-[16px] flex items-center justify-center text-[15px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        /* 购物车列表 */
        <div className="p-4 space-y-3">
          {cartItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* 选择框 */}
                <button 
                  onClick={() => toggleItemSelect(item.id)}
                  className="flex-shrink-0 mt-9 cursor-pointer active:scale-90 transition-transform"
                >
                  <div className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all ${
                    item.selected 
                      ? 'bg-[#1D1D1F] border-[#1D1D1F]' 
                      : 'border-[#C6C6C8] bg-white'
                  }`}>
                    {item.selected && (
                      <i className="ri-check-line text-xs text-white"></i>
                    )}
                  </div>
                </button>

                {/* 商品图片 */}
                <Link 
                  to={`/products/detail/${item.productId}`}
                  className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[#F5F5F7] cursor-pointer active:scale-95 transition-transform"
                >
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* 商品信息 */}
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/products/detail/${item.productId}`}
                    className="cursor-pointer block mb-1"
                  >
                    <h3 className="text-[15px] font-medium text-[#1D1D1F] line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-[13px] text-[#6E6E73] mb-0.5">{item.spec}</p>
                  <p className="text-[13px] text-[#6E6E73] mb-3">颜色：{item.color}</p>
                  
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-[#1D1D1F]">¥</span>
                      <span className="text-lg font-bold text-[#1D1D1F]">
                        {item.price.toLocaleString()}
                      </span>
                    </div>

                    {isEditing ? (
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="h-[32px] px-3 bg-white border border-[#D2D2D7] rounded-[10px] text-[13px] text-[#1D1D1F] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 active:bg-[#F5F5F7]"
                      >
                        删除
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                            item.quantity <= 1
                              ? 'bg-[#F5F5F7] text-[#C6C6C8]'
                              : 'bg-[#F5F5F7] text-[#1D1D1F] active:scale-90 active:bg-[#E5E5EA]'
                          }`}
                        >
                          <i className="ri-subtract-line text-sm"></i>
                        </button>
                        <span className="w-9 text-center text-[15px] font-medium text-[#1D1D1F]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                            item.quantity >= item.stock
                              ? 'bg-[#F5F5F7] text-[#C6C6C8]'
                              : 'bg-[#F5F5F7] text-[#1D1D1F] active:scale-90 active:bg-[#E5E5EA]'
                          }`}
                        >
                          <i className="ri-add-line text-sm"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 推荐商品 */}
          <div className="mt-8">
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-4">为你推荐</h3>
            <div className="grid grid-cols-2 gap-3">
              {recommendProducts.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/detail/${item.id}`}
                  className="block bg-white rounded-2xl overflow-hidden cursor-pointer group shadow-sm active:scale-98 transition-all"
                >
                  <div className="relative w-full h-32 overflow-hidden bg-[#F5F5F7]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-[14px] font-medium text-[#1D1D1F] mb-2 line-clamp-2 leading-snug min-h-[2.8em]">
                      {item.name}
                    </h4>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-[#1D1D1F]">¥</span>
                      <span className="text-[17px] font-bold text-[#1D1D1F]">
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部结算栏 */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/5">
          <div className="h-16 flex items-center px-4 gap-3">
            {/* 全选 */}
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all ${
                allSelected 
                  ? 'bg-[#1D1D1F] border-[#1D1D1F]' 
                  : 'border-[#C6C6C8] bg-white'
              }`}>
                {allSelected && (
                  <i className="ri-check-line text-xs text-white"></i>
                )}
              </div>
              <span className="text-[15px] text-[#1D1D1F]">全选</span>
            </button>

            {isEditing ? (
              /* 编辑模式 */
              <div className="flex-1 flex justify-end">
                <button
                  onClick={deleteSelected}
                  disabled={selectedCount === 0}
                  className={`h-[44px] px-7 rounded-[14px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 ${
                    selectedCount > 0
                      ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                      : 'bg-[#E5E5EA] text-[#C6C6C8] border border-transparent'
                  }`}
                >
                  删除({selectedCount})
                </button>
              </div>
            ) : (
              /* 正常模式 */
              <>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <span className="text-[13px] text-[#6E6E73]">合计:</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm text-[#1D1D1F]">¥</span>
                    <span className="text-2xl font-bold text-[#1D1D1F]">
                      {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={selectedCount === 0}
                  className={`h-[44px] px-7 rounded-[14px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 ${
                    selectedCount > 0
                      ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
                      : 'bg-[#E5E5EA] text-[#C6C6C8] border border-transparent'
                  }`}
                >
                  结算({selectedCount})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[280px] bg-white rounded-[20px] overflow-hidden mx-4">
            <div className="p-6 text-center">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">确认删除</h3>
              <p className="text-[15px] text-[#6E6E73] leading-relaxed">确定要删除这件商品吗？</p>
            </div>
            <div className="flex border-t border-black/5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 text-[16px] text-[#1D1D1F] cursor-pointer border-r border-black/5 active:bg-black/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 text-[16px] text-[#1D1D1F] font-semibold cursor-pointer active:bg-black/5 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
