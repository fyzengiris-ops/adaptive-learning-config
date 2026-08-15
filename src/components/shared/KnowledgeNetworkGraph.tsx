'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Plus, Folder } from 'lucide-react';

// 知识点节点类型
export interface KnowledgeNode {
  id: string;
  name: string;
  path?: string;
  stepId?: string;
  stepOrder?: number;
  isModule?: boolean;
  prerequisiteKnowledge?: KnowledgeRelation[]; // 前置知识点
}

// 知识点关联关系类型
export interface KnowledgeRelation {
  id: string;
  name: string;
  isModule?: boolean;
  stepId?: string;
  stepOrder?: number;
}

// 知识分支类型
export interface KnowledgeBranch {
  branchId: string;
  branchName?: string;
  nodes: KnowledgeNode[]; // 链条中的节点，从最远到最近
}

// 组件 Props
interface KnowledgeNetworkGraphProps {
  currentKnowledge: {
    id: string;
    name: string;
  };
  // 直接前置知识点列表（用于编辑和递归构建）
  directPrerequisiteKnowledge?: KnowledgeRelation[];
  // 直接延伸知识点列表
  directExtensionKnowledge?: KnowledgeRelation[];
  // 汇聚节点
  convergenceNode?: KnowledgeNode;
  // 查找知识点详情的函数（用于递归获取前置知识点的前置知识点）
  findNodeById?: (nodeId: string) => KnowledgeNode | null;
  isEditMode?: boolean;
  onRemovePrerequisite?: (nodeId: string, branchId: string) => void;
  onRemoveExtension?: (nodeId: string, branchId: string) => void;
  onNodeClick?: (node: KnowledgeNode) => void;
  onEditPrerequisite?: (node: KnowledgeNode) => void; // 编辑其他知识点的前置知识点
  // 删除非当前知识点的前置知识点（targetNodeId 是被前置的节点ID，prereqId 是要删除的前置知识点ID）
  onRemovePrerequisiteFromNode?: (targetNodeId: string, prereqId: string) => void;
}

export default function KnowledgeNetworkGraph({
  currentKnowledge,
  directPrerequisiteKnowledge = [],
  directExtensionKnowledge = [],
  convergenceNode,
  findNodeById,
  isEditMode = false,
  onRemovePrerequisite,
  onRemoveExtension,
  onNodeClick,
  onEditPrerequisite,
  onRemovePrerequisiteFromNode,
}: KnowledgeNetworkGraphProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const [activeBubbleNodeId, setActiveBubbleNodeId] = useState<string | null>(null);

  // 节点尺寸配置
  const nodeWidth = 120;
  const nodeHeight = 36;
  const nodeRadius = 18;
  const levelGap = 160;
  const branchGap = 60;
  const startX = 80;

  // ==================== 核心布局算法 ====================
  // 
  // 设计思路：
  // 1. 当前知识点(A)在最右边，其前置知识点(a,b,c)在左边
  // 2. 如果a,b,c有各自的前置知识点，则继续向左扩展
  // 3. 连线方向：从当前知识点(A)指向前置知识点(a,b,c)，表示"A依赖a,b,c"
  // 4. 同一层级的节点，如果有共同的后继节点，则平均分布在该后继节点的垂直范围内
  //

  // 完整的DAG布局计算（包含当前知识点）
  const fullDAGLayout = useMemo(() => {
    console.log('[布局计算] 开始', { 
      currentKnowledge: currentKnowledge.name, 
      directPrereqCount: directPrerequisiteKnowledge.length,
      directPrereqNames: directPrerequisiteKnowledge.map(p => p.name)
    });

    interface GraphNode {
      id: string;
      name: string;
      isModule?: boolean;
      stepId?: string;
      stepOrder?: number;
      level: number;
      y: number;
      prerequisites: string[];
      successors: string[];
      isCurrentNode?: boolean;
    }

    const nodeMap = new Map<string, GraphNode>();
    const edges: Array<{ from: string; to: string }> = [];
    const addedEdges = new Set<string>();

    // 步骤1：添加当前知识点(A)到图中
    nodeMap.set(currentKnowledge.id, {
      id: currentKnowledge.id,
      name: currentKnowledge.name,
      level: -1,
      y: 0,
      prerequisites: [],
      successors: [],
      isCurrentNode: true,
    });

    // 步骤2：添加直接前置知识点，并建立边
    // 注意：边的方向是 from -> to，表示 from 是 to 的前置知识点
    // 连线方向将是 to -> from（从当前指向前置）
    directPrerequisiteKnowledge.forEach((prereq) => {
      // 添加前置知识点节点
      if (!nodeMap.has(prereq.id)) {
        nodeMap.set(prereq.id, {
          id: prereq.id,
          name: prereq.name,
          isModule: prereq.isModule,
          stepId: prereq.stepId,
          stepOrder: prereq.stepOrder,
          level: -1,
          y: 0,
          prerequisites: [],
          successors: [],
        });
      }

      // 添加边：prereq -> current（表示 prereq 是 current 的前置）
      const edgeKey = `${prereq.id}->${currentKnowledge.id}`;
      if (!addedEdges.has(edgeKey)) {
        edges.push({ from: prereq.id, to: currentKnowledge.id });
        addedEdges.add(edgeKey);
        
        // 更新节点的邻接关系
        nodeMap.get(prereq.id)!.successors.push(currentKnowledge.id);
        nodeMap.get(currentKnowledge.id)!.prerequisites.push(prereq.id);
      }
    });

    // 步骤3：递归添加前置知识点的前置知识点
    const visitedNodes = new Set<string>([currentKnowledge.id, ...directPrerequisiteKnowledge.map(p => p.id)]);
    
    const addPrerequisiteNodes = (nodeId: string) => {
      const nodeDetails = findNodeById?.(nodeId);
      if (!nodeDetails?.prerequisiteKnowledge) return;

      nodeDetails.prerequisiteKnowledge.forEach((prereq) => {
        // 添加前置知识点节点
        if (!nodeMap.has(prereq.id)) {
          nodeMap.set(prereq.id, {
            id: prereq.id,
            name: prereq.name,
            isModule: prereq.isModule,
            stepId: prereq.stepId,
            stepOrder: prereq.stepOrder,
            level: -1,
            y: 0,
            prerequisites: [],
            successors: [],
          });
        }

        // 添加边
        const edgeKey = `${prereq.id}->${nodeId}`;
        if (!addedEdges.has(edgeKey)) {
          edges.push({ from: prereq.id, to: nodeId });
          addedEdges.add(edgeKey);
          
          nodeMap.get(prereq.id)!.successors.push(nodeId);
          if (nodeMap.has(nodeId)) {
            nodeMap.get(nodeId)!.prerequisites.push(prereq.id);
          }
        }

        // 递归处理
        if (!visitedNodes.has(prereq.id)) {
          visitedNodes.add(prereq.id);
          addPrerequisiteNodes(prereq.id);
        }
      });
    };

    // 对所有直接前置知识点递归处理
    directPrerequisiteKnowledge.forEach((prereq) => {
      addPrerequisiteNodes(prereq.id);
    });

    // 步骤4：计算层级（拓扑排序）
    // 规则：当前知识点(A)在最右边(level最大)，前置知识点在左边(level较小)
    // level = max(所有后继节点的 level) - 1
    // 或者：level = max(所有前置节点的 level) + 1（正向计算）
    
    // 我们采用正向计算：前置知识点的level较小，当前知识点的level最大
    // 找出所有叶子节点（没有前置知识点的节点），它们的 level = 0
    
    const inDegree = new Map<string, number>();
    nodeMap.forEach((node, id) => {
      inDegree.set(id, node.prerequisites.length);
    });

    // 从叶子节点开始（入度为0，即没有前置知识点）
    const queue: string[] = [];
    nodeMap.forEach((node, id) => {
      if (node.prerequisites.length === 0) {
        node.level = 0;
        queue.push(id);
      }
    });

    // 拓扑排序计算层级
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId)!;

      // 对于每个后继节点
      node.successors.forEach((succId) => {
        const succNode = nodeMap.get(succId);
        if (succNode) {
          // 更新层级（取最大值）
          succNode.level = Math.max(succNode.level, node.level + 1);
          
          // 减少入度
          const newDegree = (inDegree.get(succId) ?? 1) - 1;
          inDegree.set(succId, newDegree);
          
          // 入度为0时加入队列
          if (newDegree === 0) {
            queue.push(succId);
          }
        }
      });
    }

    // 步骤5：计算Y坐标
    // 核心策略：后置节点的Y坐标决定其前置知识点的Y坐标分布
    // 即：从右边向左边计算
    
    const maxLevel = Math.max(...Array.from(nodeMap.values()).map(n => n.level));
    
    // 按层级分组
    const levelGroups = new Map<number, string[]>();
    nodeMap.forEach((node) => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node.id);
    });

    // 计算SVG高度
    const totalNodes = nodeMap.size;
    const estimatedHeight = Math.max(300, totalNodes * branchGap / 2 + 120);
    const svgCenterY = estimatedHeight / 2;

    // 步骤5.1：先确定当前知识点(A)的Y坐标（level最大的节点）
    // 如果只有一个节点在最高层，它居中
    // 如果有多个节点在最高层，它们平均分布
    const maxLevelNodes = levelGroups.get(maxLevel) || [];
    if (maxLevelNodes.length === 1) {
      nodeMap.get(maxLevelNodes[0])!.y = svgCenterY;
    } else {
      maxLevelNodes.forEach((nodeId, index) => {
        const totalHeight = (maxLevelNodes.length - 1) * branchGap;
        const startY = svgCenterY - totalHeight / 2;
        nodeMap.get(nodeId)!.y = startY + index * branchGap;
      });
    }

    // 步骤5.2：从高level向低level计算Y坐标
    // 每个节点的Y坐标根据其后继节点的Y坐标来确定
    for (let level = maxLevel - 1; level >= 0; level--) {
      const levelNodes = levelGroups.get(level) || [];
      
      // 按后继节点的Y坐标排序
      const nodesWithSuccessorY = levelNodes.map(nodeId => {
        const node = nodeMap.get(nodeId)!;
        const successorYs = node.successors
          .map(sId => nodeMap.get(sId)?.y)
          .filter(y => y !== undefined) as number[];
        
        // 取后继节点Y坐标的平均值
        const avgSuccessorY = successorYs.length > 0 
          ? successorYs.reduce((sum, y) => sum + y, 0) / successorYs.length 
          : svgCenterY;
        
        return { nodeId, avgSuccessorY, node };
      });

      // 按后继节点平均Y排序
      nodesWithSuccessorY.sort((a, b) => a.avgSuccessorY - b.avgSuccessorY);

      // 对于有相同后继节点的多个前置节点，需要平均分布
      // 例如：A有前置a,b,c，则a,b,c需要在A的垂直范围内平均分布
      
      // 按后继节点分组
      const successorGroups = new Map<string, string[]>();
      nodesWithSuccessorY.forEach(({ nodeId, node }) => {
        // 用后继节点ID列表作为key
        const key = node.successors.sort().join(',');
        if (!successorGroups.has(key)) {
          successorGroups.set(key, []);
        }
        successorGroups.get(key)!.push(nodeId);
      });

      // 对每个后继节点组分配Y坐标
      successorGroups.forEach((nodeIds, key) => {
        if (nodeIds.length === 1) {
          // 只有一个前置节点，Y坐标等于后继节点的平均Y
          const node = nodeMap.get(nodeIds[0])!;
          const successorYs = node.successors
            .map(sId => nodeMap.get(sId)?.y)
            .filter(y => y !== undefined) as number[];
          node.y = successorYs.length > 0 
            ? successorYs.reduce((sum, y) => sum + y, 0) / successorYs.length 
            : svgCenterY;
        } else {
          // 多个前置节点，平均分布在后继节点的垂直范围内
          const firstNode = nodeMap.get(nodeIds[0])!;
          const successorYs = firstNode.successors
            .map(sId => nodeMap.get(sId)?.y)
            .filter(y => y !== undefined) as number[];
          
          if (successorYs.length === 0) {
            // 没有后继节点，居中分布
            const totalHeight = (nodeIds.length - 1) * branchGap;
            const startY = svgCenterY - totalHeight / 2;
            nodeIds.forEach((nodeId, index) => {
              nodeMap.get(nodeId)!.y = startY + index * branchGap;
            });
          } else if (successorYs.length === 1) {
            // 只有一个后继节点，前置节点平均分布在该节点周围
            const targetY = successorYs[0];
            const totalHeight = (nodeIds.length - 1) * branchGap;
            const startY = targetY - totalHeight / 2;
            nodeIds.forEach((nodeId, index) => {
              nodeMap.get(nodeId)!.y = startY + index * branchGap;
            });
          } else {
            // 多个后继节点
            const minY = Math.min(...successorYs);
            const maxY = Math.max(...successorYs);
            const rangeHeight = maxY - minY;
            
            if (rangeHeight < (nodeIds.length - 1) * branchGap) {
              // 后继节点范围不够大，需要扩展
              const totalHeight = (nodeIds.length - 1) * branchGap;
              const centerY = (minY + maxY) / 2;
              const startY = centerY - totalHeight / 2;
              nodeIds.forEach((nodeId, index) => {
                nodeMap.get(nodeId)!.y = startY + index * branchGap;
              });
            } else {
              // 在后继节点范围内分布
              const step = rangeHeight / (nodeIds.length - 1);
              nodeIds.forEach((nodeId, index) => {
                nodeMap.get(nodeId)!.y = minY + index * step;
              });
            }
          }
        }
      });

      // 检查当前层级所有节点的冲突并调整
      const sortedNodes = levelNodes.map(id => nodeMap.get(id)!).sort((a, b) => a.y - b.y);
      for (let i = 1; i < sortedNodes.length; i++) {
        const minGap = nodeHeight + 20;
        if (sortedNodes[i].y - sortedNodes[i - 1].y < minGap) {
          sortedNodes[i].y = sortedNodes[i - 1].y + minGap;
        }
      }
    }

    // 调整SVG高度以适应所有节点
    const allYs = Array.from(nodeMap.values()).map(n => n.y);
    const minY = Math.min(...allYs);
    const maxY = Math.max(...allYs);
    const actualHeight = Math.max(300, maxY - minY + nodeHeight + 120);
    
    // 如果实际高度超过了预估高度，需要调整Y坐标
    const yOffset = (actualHeight / 2) - svgCenterY;
    nodeMap.forEach(node => {
      node.y += yOffset;
    });

    console.log('[布局计算] 完成', {
      节点数: nodeMap.size,
      边数: edges.length,
      节点详情: Array.from(nodeMap.values()).map(n => ({
        id: n.id,
        name: n.name,
        level: n.level,
        y: Math.round(n.y),
        prerequisites: n.prerequisites,
        successors: n.successors,
        isCurrentNode: n.isCurrentNode,
      })),
      边详情: edges,
      SVG高度: actualHeight,
    });

    return { 
      nodes: Array.from(nodeMap.values()), 
      edges, 
      maxLevel,
      svgHeight: actualHeight,
    };
  }, [currentKnowledge, directPrerequisiteKnowledge, findNodeById]);

  // 构建延伸知识分支
  const extensionBranches = useMemo(() => {
    if (!directExtensionKnowledge || directExtensionKnowledge.length === 0) return [];
    
    const stepMap = new Map<string, KnowledgeRelation[]>();
    directExtensionKnowledge.forEach((item, index) => {
      const stepId = item.stepId || `step-${index}`;
      if (!stepMap.has(stepId)) {
        stepMap.set(stepId, []);
      }
      stepMap.get(stepId)!.push(item);
    });

    return Array.from(stepMap.entries())
      .sort((a, b) => (a[1][0]?.stepOrder ?? 0) - (b[1][0]?.stepOrder ?? 0))
      .map(([stepId, items]) => ({
        branchId: stepId,
        nodes: items.map(item => ({
          id: item.id,
          name: item.name,
          stepId: item.stepId,
          stepOrder: item.stepOrder,
          isModule: item.isModule,
        })),
      }));
  }, [directExtensionKnowledge]);

  const extMaxDepth = useMemo(() => {
    return Math.max(...extensionBranches.map(b => b.nodes.length), 0);
  }, [extensionBranches]);

  // 获取当前知识节点的信息
  const currentNodeInfo = useMemo(() => {
    return fullDAGLayout.nodes.find(n => n.id === currentKnowledge.id);
  }, [fullDAGLayout, currentKnowledge.id]);

  // 计算所需宽度和高度
  const { svgHeight, centerY, centerX } = useMemo(() => {
    const height = fullDAGLayout.svgHeight;
    const centerY = height / 2;
    
    // 当前知识点的X坐标
    const currentX = fullDAGLayout.maxLevel > 0 
      ? startX + fullDAGLayout.maxLevel * levelGap 
      : startX;
    
    return { svgHeight: height, centerY, centerX: currentX };
  }, [fullDAGLayout]);

  // 计算SVG宽度
  useEffect(() => {
    let lastColumnX: number;
    if (convergenceNode && extMaxDepth > 0) {
      lastColumnX = centerX + levelGap + extMaxDepth * levelGap;
    } else if (extMaxDepth > 0) {
      lastColumnX = centerX + (extMaxDepth - 1) * levelGap;
    } else {
      lastColumnX = centerX;
    }
    
    const width = Math.max(600, lastColumnX + nodeWidth / 2 + 80);
    setSvgWidth(width);
  }, [centerX, extMaxDepth, convergenceNode]);

  // 渲染单个节点
  const renderNode = (
    node: KnowledgeNode,
    x: number,
    y: number,
    type: 'prerequisite' | 'current' | 'extension',
    branchId: string,
    isDirectPrereq: boolean = true,
    targetNodeId?: string
  ) => {
    const isCurrent = type === 'current';
    const isPrereq = type === 'prerequisite';
    const isActiveBubble = activeBubbleNodeId === node.id;

    const handleNodeClick = (e: React.MouseEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      if (isEditMode && !isCurrent) {
        setActiveBubbleNodeId(isActiveBubble ? null : node.id);
      }
    };

    return (
      <g 
        key={node.id} 
        className="group"
        onClick={handleNodeClick}
      >
        {/* 悬浮提示：显示完整知识点名称 */}
        <title>{node.name}</title>
        
        {/* 大模块知识点样式：阴影 + 文件夹图标 */}
        {node.isModule && !isCurrent && (
          <>
            <rect
              x={x - nodeWidth / 2}
              y={y - nodeHeight / 2}
              width={nodeWidth}
              height={nodeHeight}
              rx={nodeRadius}
              ry={nodeRadius}
              fill={isPrereq ? '#DBEAFE' : '#FFEDD5'}
              stroke="transparent"
              strokeWidth={2}
              style={{
                filter: 'drop-shadow(3px 5px 8px rgba(0, 0, 0, 0.35))'
              }}
              className={isEditMode ? 'cursor-pointer' : ''}
            />
            <g transform={`translate(${x - nodeWidth / 2 + 8}, ${y - 6})`}>
              <Folder
                size={12}
                fill={isPrereq ? '#3B82F6' : '#F97316'}
                color={isPrereq ? '#3B82F6' : '#F97316'}
              />
            </g>
            <text
              x={x + 6}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`select-none text-xs font-bold ${isEditMode ? 'cursor-pointer' : 'cursor-pointer'}`}
              style={{ fill: isPrereq ? '#1E40AF' : '#C2410C' }}
            >
              {node.name.length > 6 ? node.name.slice(0, 6) + '...' : node.name}
            </text>
          </>
        )}
        
        {/* 普通知识点背景 */}
        {!node.isModule && !isCurrent && (
          <rect
            x={x - nodeWidth / 2}
            y={y - nodeHeight / 2}
            width={nodeWidth}
            height={nodeHeight}
            rx={nodeRadius}
            ry={nodeRadius}
            fill={isPrereq ? '#EFF6FF' : '#FFF7ED'}
            stroke="transparent"
            strokeWidth={1.5}
            className={isEditMode ? 'cursor-pointer' : ''}
          />
        )}
        
        {/* 当前知识节点背景 */}
        {isCurrent && (
          <rect
            x={x - nodeWidth / 2}
            y={y - nodeHeight / 2}
            width={nodeWidth}
            height={nodeHeight}
            rx={nodeRadius}
            ry={nodeRadius}
            className="fill-purple-500 stroke-purple-600"
            strokeWidth={3}
          />
        )}
        
        {/* 普通节点和当前节点的文字 */}
        {(!node.isModule || isCurrent) && (
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`
              select-none cursor-pointer
              ${isCurrent ? 'fill-white text-sm font-bold' : isPrereq ? 'fill-blue-700' : 'fill-orange-700'}
              text-sm font-medium
            `}
          >
            {node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name}
          </text>
        )}

      </g>
    );
  };

  // 渲染气泡
  const renderBubble = (item: { node: KnowledgeNode; x: number; y: number; type: 'prerequisite' | 'current' | 'extension' }) => {
    const { node, x, y, type } = item;
    const isCurrent = type === 'current';
    
    if (!isEditMode || activeBubbleNodeId !== node.id || isCurrent || !onEditPrerequisite) {
      return null;
    }
    
    return (
      <g
        key={`bubble-${node.id}`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEditPrerequisite(node);
          setActiveBubbleNodeId(null);
        }}
      >
        <rect
          x={x - 50}
          y={y - nodeHeight / 2 - 32}
          width={100}
          height={24}
          rx={4}
          fill="#FFFFFF"
          stroke="#3B82F6"
          strokeWidth={1}
          style={{ pointerEvents: 'all' }}
        />
        <polygon
          points={`${x - 4},${y - nodeHeight / 2 - 8} ${x + 4},${y - nodeHeight / 2 - 8} ${x},${y - nodeHeight / 2}`}
          fill="#FFFFFF"
          stroke="#3B82F6"
          strokeWidth={1}
        />
        <text
          x={x}
          y={y - nodeHeight / 2 - 20}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '11px', fill: '#3B82F6', fontWeight: '500', pointerEvents: 'none' }}
        >
          编辑前置知识点
        </text>
      </g>
    );
  };

  // 收集所有节点和连接线
  const nodes: Array<{ node: KnowledgeNode; x: number; y: number; type: 'prerequisite' | 'current' | 'extension'; branchId: string; isDirectPrereq?: boolean; targetNodeId?: string }> = [];
  const connections: Array<{ fromX: number; fromY: number; toX: number; toY: number; type: 'prerequisite' | 'extension' }> = [];

  // 添加前置知识节点（从DAG布局）
  const directPrereqIds = new Set(directPrerequisiteKnowledge.map(p => p.id));
  
  fullDAGLayout.nodes.forEach((dagNode) => {
    if (dagNode.isCurrentNode) return; // 当前知识点单独处理

    // X坐标：根据层级计算
    const x = startX + dagNode.level * levelGap;
    const y = dagNode.y;
    const isDirectPrereq = directPrereqIds.has(dagNode.id);

    nodes.push({
      node: {
        id: dagNode.id,
        name: dagNode.name,
        isModule: dagNode.isModule,
        stepId: dagNode.stepId,
        stepOrder: dagNode.stepOrder,
      },
      x,
      y,
      type: 'prerequisite',
      branchId: `dag-${dagNode.id}`,
      isDirectPrereq,
    });
  });

  // 添加DAG的连接线
  // 边的方向：prereq -> current（表示 prereq 是 current 的前置）
  // 连线方向：从 prereq（前置知识点）指向 current（当前知识点）
  // 箭头在当前知识点处，表示"前置知识点指向当前知识点"
  fullDAGLayout.edges.forEach((edge) => {
    const fromNode = fullDAGLayout.nodes.find(n => n.id === edge.from);
    const toNode = fullDAGLayout.nodes.find(n => n.id === edge.to);
    
    if (fromNode && toNode) {
      const fromX = startX + fromNode.level * levelGap;
      const toX = startX + toNode.level * levelGap;
      
      // 连线方向：从前置知识点(from)指向当前知识点(to)
      // 箭头会出现在当前知识点处
      connections.push({
        fromX: fromX,      // 前置节点的X
        fromY: fromNode.y, // 前置节点的Y
        toX: toX,          // 后继节点/当前知识点的X
        toY: toNode.y,     // 后继节点/当前知识点的Y
        type: 'prerequisite',
      });
    }
  });

  // 添加当前知识节点
  if (currentNodeInfo) {
    nodes.push({ 
      node: { id: currentKnowledge.id, name: currentKnowledge.name }, 
      x: centerX, 
      y: currentNodeInfo.y,  // 使用DAG布局计算的Y坐标
      type: 'current',
      branchId: 'current'
    });
  } else {
    // 如果没有前置知识点，当前节点居中
    nodes.push({ 
      node: { id: currentKnowledge.id, name: currentKnowledge.name }, 
      x: centerX, 
      y: centerY, 
      type: 'current',
      branchId: 'current'
    });
  }

  // 添加延伸知识节点（右侧）
  const extStartX = centerX + levelGap;
  const currentY = currentNodeInfo?.y || centerY;
  const totalExtBranches = extensionBranches.length;
  
  extensionBranches.forEach((branch, branchIndex) => {
    let branchY: number;
    if (totalExtBranches === 1) {
      branchY = currentY;
    } else if (totalExtBranches === 2) {
      branchY = branchIndex === 0 ? currentY - branchGap / 2 : currentY + branchGap / 2;
    } else {
      const halfCount = Math.floor(totalExtBranches / 2);
      const offset = (branchIndex - halfCount) * branchGap;
      branchY = currentY + offset;
    }

    branch.nodes.forEach((node, nodeIndex) => {
      const x = extStartX + nodeIndex * levelGap;
      nodes.push({ node, x, y: branchY, type: 'extension', branchId: branch.branchId });
      
      if (nodeIndex === 0) {
        connections.push({ fromX: centerX, fromY: currentY, toX: x, toY: branchY, type: 'extension' });
      } else {
        const prevX = x - levelGap;
        connections.push({ fromX: prevX, fromY: branchY, toX: x, toY: branchY, type: 'extension' });
      }
    });
  });

  // 添加汇聚节点
  if (convergenceNode && extensionBranches.length > 0) {
    const convergenceX = extStartX + extMaxDepth * levelGap;
    nodes.push({ 
      node: convergenceNode, 
      x: convergenceX, 
      y: currentY, 
      type: 'extension', 
      branchId: 'convergence' 
    });
    
    extensionBranches.forEach((branch, branchIndex) => {
      let branchY: number;
      if (totalExtBranches === 1) {
        branchY = currentY;
      } else if (totalExtBranches === 2) {
        branchY = branchIndex === 0 ? currentY - branchGap / 2 : currentY + branchGap / 2;
      } else {
        const halfCount = Math.floor(totalExtBranches / 2);
        const offset = (branchIndex - halfCount) * branchGap;
        branchY = currentY + offset;
      }
      
      const lastNodeX = extStartX + (branch.nodes.length - 1) * levelGap;
      connections.push({ 
        fromX: lastNodeX, 
        fromY: branchY, 
        toX: convergenceX, 
        toY: currentY, 
        type: 'extension' 
      });
    });
  }

  return (
    <div ref={containerRef} className="w-full overflow-x-auto overflow-y-hidden relative">
      <svg 
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="mx-auto"
        style={{ minWidth: svgWidth }}
      >
        {/* 透明背景，用于点击关闭气泡 */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="transparent"
          onClick={() => setActiveBubbleNodeId(null)}
        />
        
        {/* 渲染所有节点 */}
        {nodes.map((item) => renderNode(item.node, item.x, item.y, item.type, item.branchId, item.isDirectPrereq, item.targetNodeId))}
        
        {/* 渲染连接线 */}
        {connections.map((conn, index) => {
          const isPrereq = conn.type === 'prerequisite';
          const lineColor = isPrereq ? '#93C5FD' : '#FDBA74';
          const arrowColor = isPrereq ? '#3B82F6' : '#F97316';
          
          const arrowLength = 10;
          const arrowWidth = 6;
          
          const dx = conn.toX - conn.fromX;
          const dy = conn.toY - conn.fromY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const dirX = dist > 0 ? dx / dist : 1;
          const dirY = dist > 0 ? dy / dist : 0;
          
          // 计算起点（在from节点边缘）
          let startX: number, startY: number;
          
          const tValues: { t: number; edge: 'left' | 'right' | 'top' | 'bottom' }[] = [];
          
          if (dirX !== 0) {
            const tRight = (nodeWidth / 2) / dirX;
            const tLeft = (-nodeWidth / 2) / dirX;
            if (tRight > 0) tValues.push({ t: tRight, edge: 'right' });
            if (tLeft > 0) tValues.push({ t: tLeft, edge: 'left' });
          }
          if (dirY !== 0) {
            const tBottom = (nodeHeight / 2) / dirY;
            const tTop = (-nodeHeight / 2) / dirY;
            if (tBottom > 0) tValues.push({ t: tBottom, edge: 'bottom' });
            if (tTop > 0) tValues.push({ t: tTop, edge: 'top' });
          }
          
          tValues.sort((a, b) => a.t - b.t);
          const firstEdge = tValues[0];
          
          if (firstEdge) {
            startX = conn.fromX + dirX * firstEdge.t;
            startY = conn.fromY + dirY * firstEdge.t;
          } else {
            startX = conn.fromX;
            startY = conn.fromY;
          }
          
          // 计算终点（在to节点边缘）
          let endX: number, endY: number;
          const revDirX = -dirX;
          const revDirY = -dirY;
          
          const tValuesEnd: { t: number; edge: 'left' | 'right' | 'top' | 'bottom' }[] = [];
          
          if (revDirX !== 0) {
            const tRight = (nodeWidth / 2) / revDirX;
            const tLeft = (-nodeWidth / 2) / revDirX;
            if (tRight > 0) tValuesEnd.push({ t: tRight, edge: 'right' });
            if (tLeft > 0) tValuesEnd.push({ t: tLeft, edge: 'left' });
          }
          if (revDirY !== 0) {
            const tBottom = (nodeHeight / 2) / revDirY;
            const tTop = (-nodeHeight / 2) / revDirY;
            if (tBottom > 0) tValuesEnd.push({ t: tBottom, edge: 'bottom' });
            if (tTop > 0) tValuesEnd.push({ t: tTop, edge: 'top' });
          }
          
          tValuesEnd.sort((a, b) => a.t - b.t);
          const firstEdgeEnd = tValuesEnd[0];
          
          if (firstEdgeEnd) {
            endX = conn.toX + revDirX * firstEdgeEnd.t;
            endY = conn.toY + revDirY * firstEdgeEnd.t;
          } else {
            endX = conn.toX;
            endY = conn.toY;
          }
          
          // 箭头在终点（to端，即当前知识点处）
          const tipX = endX;
          const tipY = endY;
          const baseX = tipX - dirX * arrowLength;
          const baseY = tipY - dirY * arrowLength;
          const perpX = -dirY * arrowWidth;
          const perpY = dirX * arrowWidth;
          
          return (
            <g key={`conn-${index}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX - dirX * arrowLength}
                y2={endY - dirY * arrowLength}
                stroke={lineColor}
                strokeWidth={1.5}
              />
              <polygon
                points={`${tipX},${tipY} ${baseX + perpX},${baseY + perpY} ${baseX - perpX},${baseY - perpY}`}
                fill={arrowColor}
              />
            </g>
          );
        })}
        
        {/* 渲染气泡（放在最后，确保在最上层） */}
        {nodes.map((item) => renderBubble(item))}
      </svg>
      
      {/* 删除按钮 - 使用 HTML 元素确保点击事件正常 */}
      {isEditMode && nodes.filter(item => item.type !== 'current').map((item) => (
        <button
          key={`delete-${item.node.id}`}
          className="absolute flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 border border-gray-300 hover:bg-red-100 hover:border-red-300 transition-colors"
          style={{
            left: item.x + nodeWidth / 2 - 6,
            top: item.y - nodeHeight / 2 + 6,
            transform: 'translate(50%, -50%)',
            zIndex: 100,
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('[HTML删除按钮点击]', { 
              nodeId: item.node.id, 
              nodeName: item.node.name,
              type: item.type,
              isDirectPrereq: item.isDirectPrereq,
              targetNodeId: item.targetNodeId,
              targetNodeName: item.targetNodeId ? nodes.find(n => n.node.id === item.targetNodeId)?.node.name : undefined,
              branchId: item.branchId
            });
            if (item.type === 'prerequisite') {
              if (item.isDirectPrereq) {
                onRemovePrerequisite?.(item.node.id, item.branchId);
              } else if (item.targetNodeId) {
                onRemovePrerequisiteFromNode?.(item.targetNodeId, item.node.id);
              }
            } else {
              onRemoveExtension?.(item.node.id, item.branchId);
            }
          }}
        >
          <span className="text-gray-500 hover:text-red-500 text-sm font-bold">×</span>
        </button>
      ))}
    </div>
  );
}
