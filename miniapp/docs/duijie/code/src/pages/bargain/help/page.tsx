import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bargainActivities, bargainProducts } from '../../../mocks/bargain';

export default function BargainHelpPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [helping, setHelping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'already' | 'full' | 'ended'>('success');
  const [cutAmount, setCutAmount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      const foundActivity = bargainActivities.find(a => a.id === activityId);
      if (foundActivity) {
        setActivity(foundActivity);
        const foundProduct = bargainProducts.find(p => p.id === foundActivity.productId);
        setProduct(foundProduct);
        setRemainingTime(Math.floor((foundActivity.endTime - Date.now()) / 1000));
      }
      setLoading(false);
    }, 500);
  }, [activityId]);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleHelp = () => {
    if (!activity || !product) return;

    // 检查是否已结束
    if (remainingTime <= 0) {
      setResultType('ended');
      setShowResult(true);
      return;
    }

    // 检查是否已帮砍过（模拟）
    const hasHelped = Math.random() > 0.7;
    if (hasHelped) {
      setResultType('already');
      setShowResult(true);
      return;
    }

    // 检查人数是否已满
    if (activity.helpers.length >= product.maxHelpers) {
      setResultType('full');
      setShowResult(true);
      return;
    }

    setHelping(true);

    // 模拟帮砍
    setTimeout(() => {
      const amount = Math.floor(Math.random() * (product.maxCutAmount - product.minCutAmount + 1)) + product.minCutAmount;
      setCutAmount(amount);
      setResultType('success');
      setHelping(false);
      setShowResult(true);

      // 3秒后自动关闭结果弹窗
      setTimeout(() => {
        setShowResult(false);
      }, 3000);
    }, 1500);
  };

  const handleStartMyBargain = () => {
    if (product) {
      navigate(`/bargain/detail/${product.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* 骨架屏 */}
        <div className="px-4 pt-6 pb-24">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-8"></div>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="h-64 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
            <i className="ri-error-warning-line text-5xl text-gray-400"></i>
          </div>
          <p className="text-gray-500 mb-6">砍价活动不存在或已结束</p>
          <button
            onClick={() => navigate('/bargain/list')}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm rounded-full whitespace-nowrap"
          >
            查看其他砍价
          </button>
        </div>
      </div>
    );
  }

  const progress = ((activity.originalPrice - activity.currentPrice) / (activity.originalPrice - activity.targetPrice)) * 100;
  const remainingAmount = activity.currentPrice - activity.targetPrice;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部发起人信息 */}
      <div className="bg-white px-4 py-6 text-center border-b border-gray-100">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-400 rounded-full text-white text-sm">
            {activity.userName.charAt(0)}
          </div>
          <span className="text-base text-gray-900">{activity.userName}</span>
        </div>
        <p className="text-sm text-gray-500">正在砍这件商品</p>
      </div>

      {/* 商品信息卡片 */}
      <div className="px-4 pt-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* 商品图片 */}
          <div className="relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-64 object-cover"
            />
            {product.hotLevel >= 90 && (
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full whitespace-nowrap">
                🔥 热度 {product.hotLevel}
              </div>
            )}
          </div>

          {/* 商品信息 */}
          <div className="p-4">
            <h2 className="text-base text-gray-900 mb-2 line-clamp-2">{product.title}</h2>
            <div className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {product.style}
            </div>
          </div>
        </div>
      </div>

      {/* 价格与进度信息 */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          {/* 价格区 */}
          <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <div className="text-xs text-gray-500 mb-1">当前价</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-orange-500">¥{activity.currentPrice}</span>
                <span className="text-sm text-gray-400 line-through mb-1">¥{activity.originalPrice}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">目标价</div>
              <div className="text-xl font-bold text-red-500">¥{activity.targetPrice}</div>
            </div>
          </div>

          {/* 还差金额 */}
          <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
            <div className="text-center">
              <span className="text-sm text-gray-600">还差 </span>
              <span className="text-2xl font-bold text-red-500">¥{remainingAmount}</span>
              <span className="text-sm text-gray-600"> 到目标价</span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>已砍 ¥{activity.originalPrice - activity.currentPrice}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* 倒计时 */}
          <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-xl">
            <i className="ri-time-line text-red-500"></i>
            <span className="text-sm text-gray-600">距离结束</span>
            <span className="text-base font-mono font-bold text-red-500">
              {formatTime(remainingTime)}
            </span>
          </div>

          {/* 帮砍人数 */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600">已有好友帮砍</span>
            <span className="text-sm">
              <span className="text-orange-500 font-bold">{activity.helpers.length}</span>
              <span className="text-gray-400">/{product.maxHelpers}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 帮砍列表 */}
      {activity.helpers.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">帮砍记录</h3>
            <div className="space-y-3">
              {activity.helpers.slice(0, 5).map((helper: any) => (
                <div key={helper.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-400 rounded-full text-white text-xs">
                      {helper.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-gray-900">{helper.name}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(helper.time).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-red-500">-¥{helper.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部吸底按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleStartMyBargain}
            className="flex-1 py-3.5 bg-white border-2 border-orange-500 text-orange-500 text-base font-medium rounded-full whitespace-nowrap"
          >
            我也要砍
          </button>
          <button
            onClick={handleHelp}
            disabled={helping || remainingTime <= 0}
            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-medium rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {helping ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i>
                砍价中...
              </span>
            ) : remainingTime <= 0 ? (
              '已结束'
            ) : (
              '帮TA砍一刀'
            )}
          </button>
        </div>
      </div>

      {/* 结果弹窗 */}
      {showResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-scale-in">
            {resultType === 'success' && (
              <>
                <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-400 rounded-full">
                  <i className="ri-check-line text-5xl text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">砍价成功！</h3>
                <div className="text-center mb-6">
                  <span className="text-sm text-gray-600">本次帮砍 </span>
                  <span className="text-3xl font-bold text-red-500">¥{cutAmount}</span>
                </div>
                <button
                  onClick={() => setShowResult(false)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-medium rounded-full whitespace-nowrap"
                >
                  太棒了
                </button>
              </>
            )}

            {resultType === 'already' && (
              <>
                <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                  <i className="ri-information-line text-5xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">已经帮砍过了</h3>
                <p className="text-sm text-gray-500 text-center mb-6">每人只能帮砍一次哦</p>
                <button
                  onClick={() => setShowResult(false)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-medium rounded-full whitespace-nowrap"
                >
                  知道了
                </button>
              </>
            )}

            {resultType === 'full' && (
              <>
                <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                  <i className="ri-user-line text-5xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">帮砍人数已满</h3>
                <p className="text-sm text-gray-500 text-center mb-6">来晚了一步，下次早点来哦</p>
                <button
                  onClick={() => setShowResult(false)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-medium rounded-full whitespace-nowrap"
                >
                  知道了
                </button>
              </>
            )}

            {resultType === 'ended' && (
              <>
                <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                  <i className="ri-time-line text-5xl text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">砍价已结束</h3>
                <p className="text-sm text-gray-500 text-center mb-6">活动时间已到，无法继续砍价</p>
                <button
                  onClick={() => setShowResult(false)}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base font-medium rounded-full whitespace-nowrap"
                >
                  知道了
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
