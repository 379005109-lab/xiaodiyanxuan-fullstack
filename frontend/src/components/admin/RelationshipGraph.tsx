import React from 'react';

const mockData = {
  nodes: [
    { id: 'A', name: '发起者-李女士', type: 'owner-core', x: 50, y: 50 },
    { id: 'B', name: '设计师-王工', type: 'designer-core', x: 30, y: 25 },
    { id: 'C', name: '好友C', type: 'user', x: 70, y: 25 },
    { id: 'D', name: '新设计师-张', type: 'designer-new', x: 10, y: 75 },
    { id: 'E', name: '业主-赵', type: 'owner-potential', x: 40, y: 80 },
    { id: 'F', name: '路人F', type: 'wool-party', x: 90, y: 60 },
  ],
  links: [
    { source: 'A', target: 'B' },
    { source: 'A', target: 'C' },
    { source: 'B', target: 'D' },
    { source: 'B', target: 'E' },
    { source: 'C', target: 'F' },
    { source: 'A', target: 'E' },
  ],
};

const nodeColors: { [key: string]: string } = {
  'owner-core': 'bg-red-500',
  'designer-core': 'bg-blue-500',
  'designer-new': 'bg-purple-500',
  'owner-potential': 'bg-green-500',
  'user': 'bg-gray-400',
  'wool-party': 'bg-yellow-400',
};

const RelationshipGraph: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg border-2 border-dashed">
      {mockData.links.map((link, i) => {
        const sourceNode = mockData.nodes.find(n => n.id === link.source);
        const targetNode = mockData.nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return null;
        return (
          <svg key={i} className="absolute top-0 left-0 w-full h-full overflow-visible">
            <line 
              x1={`${sourceNode.x}%`} 
              y1={`${sourceNode.y}%`} 
              x2={`${targetNode.x}%`} 
              y2={`${targetNode.y}%`} 
              stroke="#cbd5e1" 
              strokeWidth="2"
            />
          </svg>
        );
      })}
      {mockData.nodes.map(node => (
        <div 
          key={node.id} 
          className={`absolute p-2 rounded-lg text-white text-xs shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${nodeColors[node.type]}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          {node.name}
        </div>
      ))}
    </div>
  );
};

export default RelationshipGraph;
