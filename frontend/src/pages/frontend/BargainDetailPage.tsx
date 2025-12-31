import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Users, Clipboard, X as XIcon, Loader2, Scissors, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { getFileUrl } from '@/services/uploadService';

interface Helper {
  userId: string;
  userName?: string;
  userAvatar?: string;
  helpedAt: string;
  priceReduction: number;
}

interface BargainData {
  _id: string;
  productId: string;
  productName: string;
  thumbnail: string;
  originalPrice: number;
  targetPrice: number;
  currentPrice: number;
  userId: string;
  helpers: Helper[];
  helpCount: number;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiresAt: string;
  product?: {
    coverImage?: string;
    minCutAmount?: number;
    maxCutAmount?: number;
  };
}

const BargainDetailPage: React.FC = () => {
  const { id } = useParams();
  const { isAuthenticated, token } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const [bargain, setBargain] = useState<BargainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [helping, setHelping] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastCutAmount, setLastCutAmount] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadBargainDetail();
    }
  }, [id]);

  const loadBargainDetail = async () => {
    try {
      const response = await fetch(`/api/bargains/${id}`);
      const data = await response.json();
      if (data.success) {
        setBargain(data.data);
      } else {
        toast.error(data.message || '加载失败');
      }
    } catch (error) {
      console.error('加载砍价详情失败:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 帮好友砍一刀
  const handleHelp = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!bargain || bargain.status !== 'active') {
      toast.error('该砍价活动已结束');
      return;
    }

    setHelping(true);
    try {
      const response = await fetch(`/api/bargains/${id}/help`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        const cutAmount = bargain.currentPrice - data.data.currentPrice;
        setLastCutAmount(cutAmount);
        setBargain(data.data);
        toast.success(`砍掉 ¥${cutAmount.toFixed(0)}！`);
        
        // 3秒后隐藏砍价金额提示
        setTimeout(() => setLastCutAmount(null), 3000);
      } else {
        toast.error(data.message || '帮砍失败');
      }
    } catch (error) {
      console.error('帮砍失败:', error);
      toast.error('帮砍失败');
    } finally {
      setHelping(false);
    }
  };

  const getImageUrl = (img: string | undefined) => {
    if (!img) return '/placeholder.svg';
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return getFileUrl(img);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!bargain) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">砍价活动不存在或已失效</p>
        <Link to="/bargain" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回砍价列表 →
        </Link>
      </div>
    );
  }

  const progress = bargain.originalPrice > bargain.targetPrice 
    ? ((bargain.originalPrice - bargain.currentPrice) / (bargain.originalPrice - bargain.targetPrice)) * 100
    : 0;
  const isCompleted = bargain.status === 'completed';
  const isExpired = bargain.status === 'expired' || new Date(bargain.expiresAt) < new Date();

  return (
    <div className="bg-gray-50 min-h-screen">
      {showShareModal && <ShareModal bargain={bargain} onClose={() => setShowShareModal(false)} />}
      
      {/* 砍价成功/失效提示 */}
      {lastCutAmount && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
          <span className="font-bold">🎉 砍掉 ¥{lastCutAmount.toFixed(0)}！</span>
        </div>
      )}
      
      <div className="max-w-lg mx-auto">
        {/* 商品图片 */}
        <div className="relative">
          <img 
            src={getImageUrl(bargain.thumbnail || bargain.product?.coverImage)} 
            alt={bargain.productName} 
            className="w-full h-64 object-cover"
          />
          {isCompleted && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                <p className="text-xl font-bold">砍价成功！</p>
              </div>
            </div>
          )}
          {isExpired && !isCompleted && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <AlertCircle className="w-16 h-16 mx-auto mb-2" />
                <p className="text-xl font-bold">活动已结束</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 shadow-lg">
          {/* 商品信息 */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">{bargain.productName}</h1>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-2xl font-bold text-red-600">¥{bargain.currentPrice.toFixed(0)}</span>
              <span className="text-sm text-gray-400 line-through">原价 ¥{bargain.originalPrice}</span>
              {isCompleted && (
                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">已达到目标价</span>
              )}
            </div>
          </div>

          {/* 砍价进度 */}
          <div className="p-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">砍价进度</span>
              <span className="text-orange-600 font-medium">
                已砍 ¥{(bargain.originalPrice - bargain.currentPrice).toFixed(0)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>¥{bargain.originalPrice}</span>
              <span>目标价 ¥{bargain.targetPrice}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          {!isCompleted && !isExpired && (
            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={() => setShowShareModal(true)} 
                className="flex-1 py-3 border-2 border-orange-500 text-orange-500 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors"
              >
                <Share2 size={18} />
                分享给好友
              </button>
              <button 
                onClick={handleHelp}
                disabled={helping}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-medium flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50"
              >
                {helping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Scissors size={18} />
                    帮TA砍一刀
                  </>
                )}
              </button>
            </div>
          )}

          {/* 助力好友列表 */}
          <div className="p-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Users size={18} />
              助力好友 ({bargain.helpers?.length || 0}人)
            </h3>
            
            {(!bargain.helpers || bargain.helpers.length === 0) ? (
              <div className="text-center py-6 text-gray-400">
                <p>还没有好友帮忙砍价</p>
                <p className="text-sm mt-1">快分享给好友吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bargain.helpers.map((helper, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <img 
                        src={helper.userAvatar || '/placeholder.svg'} 
                        alt={helper.userName || '用户'} 
                        className="w-10 h-10 rounded-full bg-gray-100"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{helper.userName || '好友'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(helper.helpedAt).toLocaleString('zh-CN', { 
                            month: 'numeric', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">-¥{helper.priceReduction}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareModal: React.FC<{ bargain: BargainData; onClose: () => void }> = ({ bargain, onClose }) => {
  const shareUrl = `${window.location.origin}/bargain/${bargain._id}`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板！');
  };

  const designerText = `这款${bargain.productName}我客户很喜欢，我正在砍价，设计师朋友帮忙点一下，你们的一刀比别人管用！\n${shareUrl}`;
  const ownerText = `家里装修，看中了这款¥${bargain.originalPrice}的${bargain.productName}，砍到¥${bargain.targetPrice}就下单！大家帮帮忙！\n${shareUrl}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">分享给好友</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XIcon size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-orange-50 rounded-lg p-3">
            <h4 className="font-semibold text-orange-700 mb-2">📋 设计师分享话术</h4>
            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{designerText}</p>
            <button 
              onClick={() => copyToClipboard(designerText)} 
              className="mt-2 w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-orange-600"
            >
              <Clipboard size={14} /> 复制话术
            </button>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-semibold text-blue-700 mb-2">🏠 业主分享话术</h4>
            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{ownerText}</p>
            <button 
              onClick={() => copyToClipboard(ownerText)} 
              className="mt-2 w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-blue-600"
            >
              <Clipboard size={14} /> 复制话术
            </button>
          </div>
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">复制后发送给微信好友或朋友圈</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BargainDetailPage;

