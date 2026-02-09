import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myBargainList } from '../../../mocks/bargain';

type TabType = 'ongoing' | 'success' | 'expired';

export default function MyBargainPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('ongoing');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 倒计时状态
  const [, setTick] = useState(0);

  useEffect(() => {
    // 模拟加载
    setTimeout(() => setIsLoading(false), 800);

    // 每秒更新倒计时
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化倒计时
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 下拉刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // 筛选数据
  const filteredList = myBargainList.filter(item => {
    if (activeTab === 'ongoing') return item.status === 'ongoing';
    if (activeTab === 'success') return item.status === 'success';
    if (activeTab === 'expired') return item.status === 'expired';
    return false;
  });

  // 获取Tab数量
  const getTabCount = (type: TabType) => {
    return myBargainList.filter(item => {
      if (type === 'ongoing') return item.status === 'ongoing';
      if (type === 'success') return item.status === 'success';
      if (type === 'expired') return item.status === 'expired';
      return false;
    }).length;
  };

  // 骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        {/* 导航栏 */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center h-14 px-4">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1 text-center">
              <div className="h-5 w-20 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Tab栏 */}
        <div className="flex items-center gap-6 px-4 py-3 bg-white border-b border-gray-100">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>

        {/* 列表骨架 */}
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex gap-3">
                <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl text-gray-900"></i>
          </button>
          
          <h1 className="flex-1 text-center text-base font-semibold text-gray-900">
            我的砍价
          </h1>
          
          <div className="w-6"></div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`relative pb-1 text-sm font-medium cursor-pointer whitespace-nowrap ${
              activeTab === 'ongoing' ? 'text-orange-500' : 'text-gray-600'
            }`}
          >
            进行中
            {getTabCount('ongoing') > 0 && (
              <span className="ml-1 text-xs">({getTabCount('ongoing')})</span>
            )}
            {activeTab === 'ongoing' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('success')}
            className={`relative pb-1 text-sm font-medium cursor-pointer whitespace-nowrap ${
              activeTab === 'success' ? 'text-orange-500' : 'text-gray-600'
            }`}
          >
            已成功
            {getTabCount('success') > 0 && (
              <span className="ml-1 text-xs">({getTabCount('success')})</span>
            )}
            {activeTab === 'success' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('expired')}
            className={`relative pb-1 text-sm font-medium cursor-pointer whitespace-nowrap ${
              activeTab === 'expired' ? 'text-orange-500' : 'text-gray-600'
            }`}
          >
            已结束
            {getTabCount('expired') > 0 && (
              <span className="ml-1 text-xs">({getTabCount('expired')})</span>
            )}
            {activeTab === 'expired' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* 下拉刷新提示 */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-3 text-sm text-gray-500">
          <i className="ri-loader-4-line animate-spin mr-2"></i>
          刷新中...
        </div>
      )}

      {/* 砍价记录列表 */}
      <div className="p-4 space-y-3">
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 flex items-center justify-center mb-4">
              <i className="ri-price-tag-3-line text-6xl text-gray-300"></i>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              {activeTab === 'ongoing' && '暂无进行中的砍价'}
              {activeTab === 'success' && '暂无成功的砍价'}
              {activeTab === 'expired' && '暂无已结束的砍价'}
            </p>
            <button
              onClick={() => navigate('/bargain/list')}
              className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm cursor-pointer whitespace-nowrap"
            >
              去砍价
            </button>
          </div>
        ) : (
          filteredList.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/bargain/detail/${item.productId}`)}
              className="bg-white rounded-xl p-3 border border-gray-100 cursor-pointer active:bg-gray-50"
            >
              <div className="flex gap-3">
                {/* 商品图片 */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* 状态角标 */}
                  {item.status === 'success' && (
                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                      已成功
                    </div>
                  )}
                  {item.status === 'expired' && (
                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-gray-500 text-white text-xs rounded">
                      已结束
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  {/* 标题 */}
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                    {item.product.title}
                  </h3>

                  {/* 倒计时或结束时间 */}
                  {item.status === 'ongoing' && item.remainingTime > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <i className="ri-time-line"></i>
                      <span>{formatTime(item.remainingTime)}</span>
                    </div>
                  )}
                  {item.status === 'expired' && (
                    <div className="text-xs text-gray-400">
                      已于 {new Date().toLocaleDateString()} 结束
                    </div>
                  )}
                  {item.status === 'success' && (
                    <div className="text-xs text-green-500">
                      砍价成功
                    </div>
                  )}

                  {/* 价格和进度 */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-orange-500">
                        ¥{item.currentPrice}
                      </span>
                      <span className="text-xs text-gray-400">
                        目标价 ¥{item.targetPrice}
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {item.progress}%
                      </span>
                    </div>

                    {/* 帮砍人数 */}
                    <div className="text-xs text-gray-500">
                      已有 {item.helpersCount}/{item.maxHelpers} 人帮砍
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center">
                  {item.status === 'ongoing' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 打开分享面板
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium cursor-pointer whitespace-nowrap"
                    >
                      继续邀请
                    </button>
                  )}
                  {item.status === 'success' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/cart');
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium cursor-pointer whitespace-nowrap"
                    >
                      去下单
                    </button>
                  )}
                  {item.status === 'expired' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bargain/detail/${item.productId}`);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium cursor-pointer whitespace-nowrap"
                    >
                      再次发起
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
