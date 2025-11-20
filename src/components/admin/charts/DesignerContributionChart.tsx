import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

const defaultData = [
  { subject: '模型下载', gold: 120, potential: 110, fullMark: 150 },
  { subject: '方案分享', gold: 98, potential: 130, fullMark: 150 },
  { subject: '模型包下单', gold: 86, potential: 130, fullMark: 150 },
  { subject: '点赞数', gold: 99, potential: 100, fullMark: 150 },
  { subject: '活跃度', gold: 85, potential: 90, fullMark: 150 },
];

export interface DesignerContributionDatum {
  subject: string;
  gold: number;
  potential: number;
  fullMark?: number;
}

interface Props {
  data?: DesignerContributionDatum[];
}

const DesignerContributionChart: React.FC<Props> = ({ data = defaultData }) => {
  const mapped = data.map((item) => ({
    ...item,
    A: item.gold,
    B: item.potential,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mapped}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" fontSize={12} />
        <PolarRadiusAxis angle={30} domain={[0, 150]} />
        <Radar name="金牌设计师" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        <Radar name="潜力设计师" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default DesignerContributionChart;
