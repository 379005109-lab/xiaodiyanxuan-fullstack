import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultData = [
  { name: '高客单价决策者', ltv: 4000, aov: 2500 },
  { name: '儿童家具关注者', ltv: 3000, aov: 1500 },
  { name: '小户型适配者', ltv: 2000, aov: 900 },
  { name: '分享达人', ltv: 2780, aov: 2000 },
];

export interface TagValueDatum {
  name: string;
  ltv: number;
  aov: number;
}

interface Props {
  data?: TagValueDatum[];
}

const TagValueChart: React.FC<Props> = ({ data = defaultData }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="ltv" fill="#8884d8" name="生命周期价值" />
        <Bar dataKey="aov" fill="#82ca9d" name="平均客单价" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TagValueChart;
