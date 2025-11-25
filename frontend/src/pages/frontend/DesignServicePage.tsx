import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Check, ArrowRight, Ruler, Image as ImageIcon, MessageSquare } from 'lucide-react';

const FreeDesign: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => setSubmitted(true), 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">提交成功</h2>
          <p className="text-xl text-gray-500 mb-8">
            我们的设计团队已收到您的需求。将在 24 小时内通过电话或微信联系您，提供初步方案。
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
          >
            免费全屋设计服务
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto"
          >
            只需上传您的户型图或喜欢的风格图片，我们的专业设计师为您量身打造理想家。
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="md:col-span-1 space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h3 className="text-lg font-bold mb-4">服务流程</h3>
              <ul className="space-y-6">
                {[
                  { icon: Ruler, title: '提交需求', desc: '上传户型图/尺寸' },
                  { icon: MessageSquare, title: '沟通细节', desc: '设计师1对1对接' },
                  { icon: ImageIcon, title: '出具方案', desc: '3D效果图 + 清单' },
                ].map((step, i) => (
                  <li key={i} className="flex items-start">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-3 mt-1">
                      <step.icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg">
              <h3 className="text-lg font-bold mb-2">为什么免费？</h3>
              <p className="text-blue-100 text-sm leading-relaxed opacity-90">
                依托佛山源头工厂优势，我们将设计费用包含在后端供应链整合中。您不仅获得免费设计，更能以出厂价购买到高品质家具。
              </p>
            </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="md:col-span-2"
          >
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">开始您的设计咨询</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">上传图片 (户型图/参考图)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <UploadCloud className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <p className="mt-2 text-sm text-gray-500">点击上传或拖拽文件至此</p>
                    <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG, PDF (最大 10MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">您的称呼</label>
                    <input 
                      type="text" 
                      id="name" 
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="怎么称呼您"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">联系电话/微信</label>
                    <input 
                      type="text" 
                      id="phone" 
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="方便设计师联系您"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1">设计需求描述</label>
                  <textarea 
                    id="desc" 
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                    placeholder="例如：三室两厅，现代简约风格，预算 5-8 万，家里有宠物..."
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
                  >
                    提交申请 <ArrowRight size={20} />
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    提交即代表同意我们的隐私政策。您的信息仅用于设计服务沟通。
                  </p>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FreeDesign;
