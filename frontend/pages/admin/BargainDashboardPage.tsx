import React from 'react';
import { Share2, Users, Tag } from 'lucide-react';
import RelationshipGraph from '../../components/admin/RelationshipGraph';

const BargainDashboardPage: React.FC = () => {
  // Mock data for dashboard
  const stats = {
    totalBargains: 128,
    totalHelpers: 1560,
    designersIdentified: 76,
    ownersIdentified: 320,
  };

  const topInfluencers = [
    { id: 1, name: '设计师-王工', type: '设计师-核心', brought: 45 },
    { id: 2, name: '业主-李女士', type: '业主-意见领袖', brought: 32 },
    { id: 3, name: '设计师-张工作室', type: '设计师-合作', brought: 28 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">砍价裂变数据看板</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full"><Share2 className="text-blue-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">总砍价数</p>
            <p className="text-2xl font-bold">{stats.totalBargains}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Users className="text-green-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">总助力人数</p>
            <p className="text-2xl font-bold">{stats.totalHelpers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-full"><Tag className="text-purple-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">识别设计师数</p>
            <p className="text-2xl font-bold">{stats.designersIdentified}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full"><Tag className="text-orange-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">识别业主数</p>
            <p className="text-2xl font-bold">{stats.ownersIdentified}</p>
          </div>
        </div>
      </div>

      {/* Relationship Graph & Top Influencers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">裂变关系图谱 (模拟)</h2>
          <div className="w-full h-96">
            <RelationshipGraph />
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>核心业主</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span>核心设计师</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span>新设计师</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>潜在业主</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400"></span>普通用户</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>羊毛党</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Top 3 裂变核心</h2>
          <div className="space-y-4">
            {topInfluencers.map(user => (
              <div key={user.id} className="flex items-center">
                <div className="flex-grow">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-gray-500">标签: <span className="font-mono bg-gray-100 p-1 rounded">{user.type}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{user.brought}</p>
                  <p className="text-xs text-gray-400">带来助力</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BargainDashboardPage;
