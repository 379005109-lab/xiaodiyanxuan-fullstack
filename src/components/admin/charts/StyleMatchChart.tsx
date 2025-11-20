import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultData = [
  { name: '意式轻奢', downloads: 4000, conversion: 24 },
  { name: '侘寂风', downloads: 3000, conversion: 13 },
  { name: '北欧风', downloads: 2000, conversion: 8 },
  { name: '现代简约', downloads: 2780, conversion: 19 },
];

export interface StyleMatchDatum {
  name: string;
  downloads: number;
  conversion: number;
}

interface Props {
  data?: StyleMatchDatum[];
}

const StyleMatchChart: React.FC<Props> = ({ data = defaultData }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="downloads" fill="#8884d8" name="模型下载量" />
        <Bar yAxisId="right" dataKey="conversion" fill="#82ca9d" name="方案转化率(%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StyleMatchChart;
