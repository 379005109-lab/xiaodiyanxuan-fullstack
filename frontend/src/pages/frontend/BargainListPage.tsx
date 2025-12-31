import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Scissors, Users, Tag, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { getFileUrl } from '@/services/uploadService';

interface BargainProduct {
  _id: string;
  name: string;
  coverImage: string;
  originalPrice: number;
  targetPrice: number;
  category: string;
  style: string;
  status: string;
  totalBargains: number;
  successBargains: number;
  minCutAmount: number;
  maxCutAmount: number;
}

const BargainListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const [products, setProducts] = useState<BargainProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingBargain, setStartingBargain] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/bargains');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('加载砍价商品失败:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 发起砍价
  const handleStartBargain = async (product: BargainProduct) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    setStartingBargain(product._id);
    try {
      const response = await fetch('/api/bargains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          originalPrice: product.originalPrice,
          targetPrice: product.targetPrice,
          coverImage: product.coverImage
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('砍价已发起！');
        navigate(`/bargain/${data.data._id}`);
      } else {
        toast.error(data.message || '发起砍价失败');
      }
    } catch (error) {
      console.error('发起砍价失败:', error);
      toast.error('发起砍价失败');
    } finally {
      setStartingBargain(null);
    }
  };

  const getImageUrl = (img: string) => {
    if (!img) return '/placeholder.svg';
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return getFileUrl(img);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
          <h1 className="text-3xl font-bold text-white">🔥 砍价活动</h1>
          <p className="text-white/80 mt-2">邀请好友助力，享超低价格！</p>
        </div>
        <div className="p-8 text-center">
          <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无砍价商品</p>
          <Link to="/products" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            去商城逛逛 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">🔥 砍价活动进行中</h1>
        <p className="text-white/80 mt-1">邀请好友助力，享超低价格！</p>
      </div>

      {/* 商品列表 */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {products.map(product => {
          const savingAmount = product.originalPrice - product.targetPrice;
          const savingPercent = Math.round((savingAmount / product.originalPrice) * 100);
          
          return (
            <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex">
                {/* 商品图片 */}
                <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                  <img 
                    src={getImageUrl(product.coverImage)} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* 商品信息 */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex-shrink-0">
                        最高省{savingPercent}%
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500">{product.category}</span>
                      {product.style && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-gray-500">{product.style}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-red-600">¥{product.targetPrice}</span>
                      <span className="text-sm text-gray-400 line-through">¥{product.originalPrice}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{product.totalBargains || 0}人已发起</span>
                    </div>
                    
                    <button
                      onClick={() => handleStartBargain(product)}
                      disabled={startingBargain === product._id}
                      className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-full hover:from-red-600 hover:to-orange-600 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {startingBargain === product._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Scissors className="w-4 h-4" />
                          发起砍价
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BargainListPage;
