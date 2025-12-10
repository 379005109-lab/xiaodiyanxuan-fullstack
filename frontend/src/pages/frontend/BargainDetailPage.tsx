import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Users, Clipboard, X as XIcon } from 'lucide-react';

const mockBargainDetail = {
  id: 1,
  name: '质感沙发 · 莫兰迪灰',
  originalPrice: 3999,
  bargainPrice: 2199,
  currentPrice: 2899,
  helpers: [
    { id: 1, name: '好友A', avatar: '/placeholder.svg', amount: 150 },
    { id: 2, name: '设计师B', avatar: '/placeholder.svg', amount: 200 },
    { id: 3, name: '好友C', avatar: '/placeholder.svg', amount: 100 },
  ],
  imageUrl: '/placeholder.svg',
};

interface BargainRule {
  totalBargainPercent: number;
  firstCutPercent: string;
  nextFourCutsPercent: string;
  remainingCutsPercent: string;
  designerBonus: number;
}

// Helper to get a random number from a range string like '10-20'
const getRandomFromRange = (range: string) => {
  const [min, max] = range.split('-').map(Number);
  return Math.random() * (max - min) + min;
};

interface Helper {
  id: number;
  name: string;
  avatar: string;
  amount: number;
}

interface BargainDetail {
  id: number;
  name: string;
  originalPrice: number;
  bargainPrice: number;
  currentPrice: number;
  helpers: Helper[];
  imageUrl: string;
}

const BargainDetailPage: React.FC = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState<BargainDetail>(mockBargainDetail);
  const [showEgg, setShowEgg] = useState(false);
  const [showServiceCoupon, setShowServiceCoupon] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleBargain = () => {
    const rules: BargainRule | null = JSON.parse(localStorage.getItem(`bargain_rules_${id}`) || 'null');
    if (!rules) {
      alert('该商品未配置砍价规则！');
      return;
    }

    const totalBargainAmount = detail.originalPrice * (rules.totalBargainPercent / 100);
    const helperCount = detail.helpers.length;
    let bargainPercent = 0;

    if (helperCount === 0) { // First cut by the initiator
      bargainPercent = getRandomFromRange(rules.firstCutPercent);
    } else if (helperCount >= 1 && helperCount <= 4) { // Next 4 helpers
      // This is a simplified approach. A real implementation would need to ensure the sum matches the rule.
      bargainPercent = getRandomFromRange(rules.nextFourCutsPercent) / 4;
    } else { // Subsequent helpers
      bargainPercent = getRandomFromRange(rules.remainingCutsPercent);
    }

    let amount = totalBargainAmount * (bargainPercent / 100);

    // Simulate checking if the helper is a designer
    let isDesigner = false;
    const isNewDesigner = Math.random() < 0.15; // 15% chance to be a new designer

    if (isNewDesigner) {
      isDesigner = true;
      amount += rules.designerBonus + 200; // Extra bonus for new designer
      setShowEgg(true);
      setTimeout(() => setShowEgg(false), 4000); // Hide egg message after 4s
    } else {
      isDesigner = Math.random() < 0.3;
      if (isDesigner) {
        amount += rules.designerBonus;
      }
    }

    const helperName = isDesigner ? '设计师好友' : '新好友';

    const newHelpers = [...detail.helpers, { id: Date.now(), name: helperName, avatar: '/placeholder.svg', amount: Math.round(amount) }];

    if (newHelpers.length >= 5) {
      setShowServiceCoupon(true);
    }

    setDetail(prev => ({
      ...prev,
      currentPrice: Math.max(prev.bargainPrice, prev.currentPrice - amount),
      helpers: newHelpers,
    }));
  };

  const progress = ((detail.originalPrice - detail.currentPrice) / (detail.originalPrice - detail.bargainPrice)) * 100;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
      <div className="bg-white rounded-lg shadow-md">
        {showEgg && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">助力彩蛋！</p>
            <p>新设计师好友助力，额外砍掉200元！该设计师已获专属佣金券。</p>
          </div>
        )}
        <div className="p-4 border-b">
          <img src={detail.imageUrl} alt={detail.name} className="w-full h-64 object-cover rounded-lg" />
          <h2 className="text-xl font-bold mt-4">{detail.name}</h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm text-gray-500 line-through">原价: ¥{detail.originalPrice}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold">当前价: <span className="text-red-500">¥{detail.currentPrice}</span></h3>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div className="bg-orange-500 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${Math.min(progress, 100)}%` }}>
              已砍{Math.min(progress, 100).toFixed(0)}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">已砍 <span className="font-bold text-green-500">¥{detail.originalPrice - detail.currentPrice}</span>，继续邀请好友砍价！</p>
        </div>

        {/* Share Button */}
                <div className="p-4 flex gap-4">
          <button onClick={() => setShowShareModal(true)} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
            <Share2 size={20} />
            分享给好友
          </button>
          <button onClick={handleBargain} className="btn btn-secondary flex-1">帮好友砍一刀</button>
        </div>

        {showServiceCoupon && (
          <div className="p-4 bg-blue-50 border-t border-b border-blue-200 text-center">
            <h4 className="font-bold text-blue-600">恭喜！</h4>
            <p className="text-sm text-blue-500">已获得「服务升级券」：下单即享免费上门测量与设计方案服务。</p>
          </div>
        )}

        {/* Helpers List */}
        <div className="p-4 border-t">
          <h4 className="font-semibold flex items-center gap-2"><Users size={20} /> 助力好友</h4>
          <div className="mt-4 space-y-3">
            {detail.helpers.map((helper: Helper) => (
              <div key={helper.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={helper.avatar} alt={helper.name} className="w-10 h-10 rounded-full" />
                  <span>{helper.name}</span>
                </div>
                <span className="font-semibold text-green-600">- ¥{helper.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">分享话术模板</h3>
          <button onClick={onClose}><XIcon size={24} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <h4 className="font-semibold">设计师分享：</h4>
            <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded mt-1">这款沙发我客户很喜欢，我正在砍价，设计师朋友帮忙点一下，你们的一刀比别人管用！</p>
            <button onClick={() => copyToClipboard('这款沙发我客户很喜欢...')} className="btn btn-xs btn-secondary mt-1 flex items-center gap-1"><Clipboard size={14} /> 复制</button>
          </div>
          <div>
            <h4 className="font-semibold">业主分享：</h4>
            <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded mt-1">家里装修，看中了这张5000块的床，我一刀砍了350！前5刀最值钱，大家帮帮忙，砍到4000就下单，还送免费上门服务！</p>
            <button onClick={() => copyToClipboard('家里装修...')} className="btn btn-xs btn-secondary mt-1 flex items-center gap-1"><Clipboard size={14} /> 复制</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BargainDetailPage;

