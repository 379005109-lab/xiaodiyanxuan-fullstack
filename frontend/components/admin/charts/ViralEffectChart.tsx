import React from 'react';

const defaultData = {
  visits: 1250,
  conversionRate: 3.5,
  orders: 42,
};

export interface ViralMetric {
  visits: number;
  conversionRate: number; // percentage value
  orders?: number;
}

interface Props {
  data?: ViralMetric;
}

const ViralEffectChart: React.FC<Props> = ({ data = defaultData }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6">
      <div className="text-center">
        <p className="text-gray-500 text-sm">分享链接访问量</p>
        <p className="text-4xl font-bold text-gray-800">{data.visits.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-500 text-sm">转化率</p>
        <p className="text-4xl font-bold text-green-600">{data.conversionRate.toFixed(1)}%</p>
      </div>
      {data.orders != null && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">带来订单</p>
          <p className="text-3xl font-semibold text-primary-600">{data.orders}</p>
        </div>
      )}
    </div>
  );
};

export default ViralEffectChart;
