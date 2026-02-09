import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bargainProducts, bargainActivities } from '../../../mocks/bargain';
import BargainDetailHeader from './components/BargainDetailHeader';
import BargainImageGallery from './components/BargainImageGallery';
import BargainPriceSection from './components/BargainPriceSection';
import BargainRulesSection from './components/BargainRulesSection';
import BargainHelpersSection from './components/BargainHelpersSection';
import BargainBottomBar from './components/BargainBottomBar';
import BargainSharePanel from './components/BargainSharePanel';

export default function BargainDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCutAnimation, setShowCutAnimation] = useState(false);
  const [cutAmount, setCutAmount] = useState(0);
  const [userStatus, setUserStatus] = useState<'not_started' | 'ongoing' | 'success' | 'expired'>('not_started');

  // -------------------------------------------------------------------------
  // Load product & activity data (mocked)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const productData = bargainProducts.find(p => p.id === id);
    const activityData = bargainActivities.find(a => a.productId === id);

    // Simulate async fetch
    const timer = setTimeout(() => {
      if (productData) {
        setProduct(productData);
        if (activityData) {
          setActivity(activityData);
          if (activityData.currentPrice <= productData.targetPrice) {
            setUserStatus('success');
          } else if (activityData.status === 'ended') {
            setUserStatus('expired');
          } else {
            setUserStatus('ongoing');
          }
        } else {
          setUserStatus('not_started');
        }
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [id]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleStartBargain = () => {
    if (!product) return;

    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      setUserStatus('ongoing');

      // Create a new activity for the current user
      setActivity({
        id: Date.now(),
        productId: id,
        userId: 'current_user',
        userName: '我',
        originalPrice: product.originalPrice,
        targetPrice: product.targetPrice,
        currentPrice: product.originalPrice - 200,
        startTime: Date.now(),
        endTime: Date.now() + 24 * 3600000,
        status: 'ongoing',
        helpers: [
          { id: 1, name: '好哥A', avatar: '', cutAmount: 120, time: Date.now() - 5 * 60000 },
          { id: 2, name: '好哥B', avatar: '', cutAmount: 80, time: Date.now() - 10 * 60000 },
        ],
      });
    }, 2000);
  };

  const handleCutAgain = () => {
    if (!product || !activity) return;

    const amount = Math.floor(
      Math.random() * (product.maxCutAmount - product.minCutAmount + 1)
    ) + product.minCutAmount;

    setCutAmount(amount);
    setShowCutAnimation(true);

    setTimeout(() => {
      setShowCutAnimation(false);
      const newPrice = Math.max(activity.currentPrice - amount, product.targetPrice);
      setActivity({
        ...activity,
        currentPrice: newPrice,
        helpers: [
          { id: Date.now(), name: '我', avatar: '', cutAmount: amount, time: Date.now() },
          ...activity.helpers,
        ],
      });
      if (newPrice <= product.targetPrice) {
        setUserStatus('success');
      }
    }, 2000);
  };

  // -------------------------------------------------------------------------
  // Loading & Empty states
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
          <div className="flex items-center justify-between h-12 px-4">
            <div className="w-8 h-8 bg-[#F5F5F7] rounded-full animate-pulse" />
            <div className="w-20 h-4 bg-[#F5F5F7] rounded animate-pulse" />
            <div className="w-8 h-8 bg-[#F5F5F7] rounded-full animate-pulse" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="w-full aspect-square bg-[#F5F5F7] rounded-2xl animate-pulse" />
          <div className="space-y-3 pt-2">
            <div className="h-5 bg-[#F5F5F7] rounded-lg animate-pulse w-3/4" />
            <div className="h-5 bg-[#F5F5F7] rounded-lg animate-pulse w-1/2" />
            <div className="h-8 bg-[#F5F5F7] rounded-lg animate-pulse w-1/3 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#F5F5F7] flex items-center justify-center">
            <i className="ri-error-warning-line text-3xl text-[#C6C6C8]" />
          </div>
          <p className="text-[15px] text-[#86868B] mb-6">商品不存在或已下架</p>
          <button
            onClick={() => navigate('/bargain/list')}
            className="px-6 py-2.5 bg-white text-[#1D1D1F] rounded-[14px] text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] border border-[#D2D2D7]"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Calculations
  // -------------------------------------------------------------------------
  const savedAmount = activity ? product.originalPrice - activity.currentPrice : 0;
  const remainingAmount = activity
    ? activity.currentPrice - product.targetPrice
    : product.originalPrice - product.targetPrice;
  const progress = activity
    ? (savedAmount / (product.originalPrice - product.targetPrice)) * 100
    : 0;
  const remainingTime = Math.max(0, Math.floor((product.endTime - Date.now()) / 1000));

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white pb-28">
      <BargainDetailHeader onBack={() => navigate(-1)} onShare={() => setShowSharePanel(true)} />

      <BargainImageGallery
        images={[product.image, product.image, product.image]}
        title={product.title}
        style={product.style}
        hotLevel={product.hotLevel}
      />

      <BargainPriceSection
        currentPrice={activity?.currentPrice || product.currentPrice}
        originalPrice={product.originalPrice}
        targetPrice={product.targetPrice}
        savedAmount={savedAmount}
        remainingAmount={remainingAmount}
        progress={progress}
        remainingTime={remainingTime}
        userStatus={userStatus}
      />

      <BargainRulesSection />

      {activity?.helpers?.length > 0 && <BargainHelpersSection helpers={activity.helpers} />}

      <BargainBottomBar
        userStatus={userStatus}
        onStartBargain={handleStartBargain}
        onCutAgain={handleCutAgain}
        onInviteFriends={() => setShowSharePanel(true)}
        onShare={() => setShowSharePanel(true)}
        onOrder={() => navigate('/cart')}
        onViewSimilar={() => navigate('/bargain/list')}
      />

      {showSharePanel && <BargainSharePanel onClose={() => setShowSharePanel(false)} />}

      {/* 发起成功 Toast */}
      {showSuccessToast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-[#1D1D1F]/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <i className="ri-checkbox-circle-fill text-xl text-[#34C759]" />
            <span className="text-[15px] font-medium">发起成功！快邀请好朋友帮砍吧</span>
          </div>
        </div>
      )}

      {/* 砍金额动画 */}
      {showCutAnimation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-[#1D1D1F] text-white px-10 py-8 rounded-[20px] shadow-2xl animate-[cutBounce_0.5s_ease-out]">
            <div className="text-center">
              <div className="text-[42px] font-bold tracking-tight mb-1">-¥{cutAmount}</div>
              <div className="text-[15px] text-white/70">砍掉成功！</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cutBounce {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
