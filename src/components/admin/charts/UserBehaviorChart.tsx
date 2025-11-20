import React from 'react';
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

const defaultData = [
  { value: 100, name: '浏览', fill: '#8884d8' },
  { value: 80, name: '收藏', fill: '#83a6ed' },
  { value: 50, name: '加购', fill: '#8dd1e1' },
  { value: 40, name: '下单', fill: '#82ca9d' },
  { value: 26, name: '支付', fill: '#a4de6c' },
];

export interface UserBehaviorDatum {
  value: number;
  name: string;
  fill?: string;
}

interface Props {
  data?: UserBehaviorDatum[];
}

const UserBehaviorChart: React.FC<Props> = ({ data = defaultData }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="value" data={data} isAnimationActive>
          <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
};

export default UserBehaviorChart;
