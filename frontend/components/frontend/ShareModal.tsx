import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { X, Copy, Check, Gift, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// This would ideally be in a service file
const getShareToken = async (token: string) => {
  const API_URL = import.meta.env.VITE_API_URL || 'https://bcvriiezbpza.sealoshzh.site/api';
  const response = await fetch(`${API_URL}/share/token`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  if (!response.ok) {
    throw new Error('无法获取分享链接');
  }
  return response.json();
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const { token } = useAuthStore();
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      const fetchShareUrl = async () => {
        setLoading(true);
        try {
          const data = await getShareToken(token);
          setShareUrl(data.shareUrl);
        } catch (error: any) {
          toast.error(error.message || '获取分享链接失败');
          onClose();
        }
        setLoading(false);
      };
      fetchShareUrl();
    }
  }, [isOpen, token, onClose]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-primary-600" />
                  推荐好友，同享好礼
                </Dialog.Title>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>

                <div className="mt-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                      <p className="mt-4 text-gray-600">正在生成您的专属链接...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center mb-6">
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                          <QRCodeSVG value={shareUrl} size={180} level="H" includeMargin={true} />
                        </div>
                        <p className="text-sm text-gray-600 text-center">好友扫描二维码或通过链接注册<br/>双方各得 <strong>100元</strong> 奖励券</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">您的专属分享链接</p>
                        <div className="flex items-center gap-2">
                          <input type="text" value={shareUrl} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
                          <button onClick={handleCopy} className={`p-2 rounded-lg border-2 transition-all ${copied ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`} title="复制链接">
                            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

