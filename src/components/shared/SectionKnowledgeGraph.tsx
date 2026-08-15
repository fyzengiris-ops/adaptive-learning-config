'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';

// 知识点节点类型
export interface KnowledgeNode {
  id: string;
  name: string;
  isModule?: boolean;
  prerequisiteKnowledge?: KnowledgeRelation[];
}

// 知识点关联关系类型
export interface KnowledgeRelation {
  id: string;
  name: string;
  isModule?: boolean;
}

// 组件 Props
interface SectionKnowledgeGraphProps {
  // 当前小节的所有知识点
  sectionKnowledgePoints: KnowledgeRelation[];
  // 查找知识点详情的函数（用于获取前置关系）
  findNodeById: (nodeId: string) => KnowledgeNode | null;
  // 根据名称查找知识点详情
  findNodeByName?: (name: string) => KnowledgeNode | null;
}

export default function SectionKnowledgeGraph({
  sectionKnowledgePoints,
  findNodeById,
  findNodeByName,
}: SectionKnowledgeGraphProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(1000);
  const [svgHeight, setSvgHeight] = useState(400);

  // 节点尺寸配置
  const nodeWidth = 120;
  const nodeHeight = 36;
  const levelGap = 180;
  const branchGap = 70;
  const startX = 80;

  // 构建图谱数据
  const graphData = useMemo(() => {
    interface GraphNode {
      id: string;
      name: string;
      level: number; // 层级：前置知识点在左边，本节知识点在右边
      y: number; // Y坐标
      isInSection: boolean; // 是否是小节内的知识点
      prerequisites: string[]; // 前置知识点名称列表
    }

    const nodeMap = new Map<string, GraphNode>(); // key: 知识点名称
    const edges: Array<{ from: string; to: string }> = []; // from/to: 知识点名称
    const addedNodes = new Set<string>(); // 已添加的节点名称
    const addedEdges = new Set<string>(); // 已添加的边

    // 规范化名称函数（用于匹配）
    // 移除空格、标点等，便于模糊匹配
    const normalizeName = (name: string): string => {
      return name.replace(/[\s\u3000\-_·•●○■□▲△▼▽◆◇★☆]/g, '').toLowerCase();
    };

    // 本小节知识点的名称集合（规范化后的名称）
    const sectionNodeNames = new Set(
      sectionKnowledgePoints.map(kp => normalizeName(kp.name))
    );

    console.log('[SectionKnowledgeGraph] 小节知识点:', sectionKnowledgePoints.map(kp => ({ id: kp.id, name: kp.name })));

    // 递归添加节点和边
    // 箭头方向：从依赖方指向前置方（A → a1 表示 A 依赖 a1）
    // 使用名称作为唯一标识，解决ID格式不一致的问题
    const addNodeWithPrereqs = (
      nodeId: string,
      nodeName: string,
      visited: Set<string> = new Set()
    ) => {
      // 防止循环（使用名称）
      if (visited.has(nodeName)) return;
      visited.add(nodeName);

      // 查找节点详情
      // 优先使用名称查找（因为ID格式不一致：教材体系是路径格式，通用知识树是数字格式）
      // ID查找作为fallback（保留兼容性）
      let nodeDetails: KnowledgeNode | null = null;
      
      // 1. 优先使用名称查找
      if (findNodeByName) {
        nodeDetails = findNodeByName(nodeName);
      }
      
      // 2. 如果名称查找失败，尝试ID查找
      if (!nodeDetails && nodeId) {
        nodeDetails = findNodeById(nodeId);
      }

      const prereqList = nodeDetails?.prerequisiteKnowledge || [];

      // 添加边：从当前节点指向前置节点（表示依赖关系）
      // 使用名称作为唯一标识
      prereqList.forEach((prereq) => {
        // 边的方向：from(依赖方) → to(前置方)
        const edgeKey = `${nodeName}->${prereq.name}`;
        if (!addedEdges.has(edgeKey)) {
          edges.push({ from: nodeName, to: prereq.name });
          addedEdges.add(edgeKey);
        }
        
        // 递归处理前置节点
        // 问题6修复：使用名称重新查找真实的节点ID，避免虚拟节点ID不一致
        let prereqId = prereq.id;
        if (findNodeByName) {
          const realNode = findNodeByName(prereq.name);
          if (realNode && realNode.id) {
            prereqId = realNode.id;
          }
        }
        addNodeWithPrereqs(prereqId, prereq.name, visited);
      });

      // 判断是否是小节内的知识点（通过规范化名称匹配，忽略空格、标点等差异）
      const isInSection = sectionNodeNames.has(normalizeName(nodeName));

      // 添加节点（使用名称作为唯一标识，确保每个节点只添加一次）
      if (!addedNodes.has(nodeName)) {
        addedNodes.add(nodeName);
        nodeMap.set(nodeName, {
          id: nodeId,
          name: nodeName,
          level: -1, // 稍后计算
          y: 0,
          isInSection,
          prerequisites: prereqList.map(p => p.name),
        });
      } else if (isInSection) {
        // 如果节点已存在，更新 isInSection 标记
        const existing = nodeMap.get(nodeName);
        if (existing) {
          existing.isInSection = true;
        }
      }
    };

    // 从每个小节知识点开始，递归构建图谱
    sectionKnowledgePoints.forEach((kp) => {
      addNodeWithPrereqs(kp.id, kp.name);
    });

    // 计算层级
    // 规则：本节知识点在最右边（level 最大），前置知识点在左边
    // 箭头方向：从右向左（从依赖方指向前置方）
    
    // 先计算每个节点的"依赖深度"：沿着前置链能走多远
    const getDepth = (nodeName: string, visited: Set<string> = new Set()): number => {
      if (visited.has(nodeName)) return 0;
      visited.add(nodeName);
      
      const node = nodeMap.get(nodeName);
      if (!node || node.prerequisites.length === 0) return 0;
      
      const depths = node.prerequisites.map(pname => getDepth(pname, visited));
      return 1 + Math.max(...depths);
    };

    // 反向依赖图：找出每个节点被哪些节点依赖
    const dependents = new Map<string, string[]>();
    nodeMap.forEach((node) => {
      dependents.set(node.name, []);
    });
    nodeMap.forEach((node) => {
      node.prerequisites.forEach((prereqName) => {
        const deps = dependents.get(prereqName);
        if (deps) {
          deps.push(node.name);
        }
      });
    });

    // 计算层级
    // 前置知识点 level = 依赖它的节点的 level - 1
    // 从没有依赖关系的节点开始，它们在最左边
    nodeMap.forEach((node) => {
      if (dependents.get(node.name)?.length === 0) {
        // 没有被任何节点依赖，放在最左边
        // level = 基于依赖深度
        node.level = getDepth(node.name);
      }
    });

    // 正向传播：前置节点的 level = 当前节点 level - 1
    // 使用 BFS 从已知 level 的节点开始
    const queue: string[] = [];
    nodeMap.forEach((node) => {
      if (node.level >= 0) {
        queue.push(node.name);
      }
    });

    while (queue.length > 0) {
      const nodeName = queue.shift()!;
      const node = nodeMap.get(nodeName)!;

      // 对于当前节点的所有前置节点
      node.prerequisites.forEach((prereqName) => {
        const prereqNode = nodeMap.get(prereqName);
        if (prereqNode && prereqNode.level < 0) {
          // 前置节点在左边，level 更小
          prereqNode.level = node.level - 1;
          if (!queue.includes(prereqName)) {
            queue.push(prereqName);
          }
        }
      });
    }

    // 调整 level，使最小值为 0
    let minLevel = Infinity;
    nodeMap.forEach((node) => {
      if (node.level < minLevel) minLevel = node.level;
    });
    if (minLevel < 0) {
      nodeMap.forEach((node) => {
        node.level -= minLevel;
      });
    }

    // ============================================================
    // 计算Y坐标 - 全新的布局算法（正确理解版）
    // 核心思想：先找直线连接，再处理分支
    // ============================================================
    const nodes = Array.from(nodeMap.values());
    const maxLevel = Math.max(...nodes.map(n => n.level), 0);

    // 布局参数
    const baseY = 200; // 基准Y坐标
    const branchAngleDistance = 80; // 分支节点的距离（用于计算Y偏移）

    // ============================================================
    // 第一步：找出所有"叶子节点"（最下游，没有其他节点依赖它）
    // 这些节点是最右边的节点，通常是本节知识点
    // ============================================================
    
    // 构建反向依赖图：每个节点被哪些节点依赖
    const dependentsMap = new Map<string, string[]>();
    nodeMap.forEach((node) => {
      dependentsMap.set(node.name, []);
    });
    nodeMap.forEach((node) => {
      node.prerequisites.forEach((prereqName) => {
        const dependents = dependentsMap.get(prereqName);
        if (dependents) {
          dependents.push(node.name);
        }
      });
    });

    // 叶子节点 = 没有任何节点依赖它（dependents.length === 0）
    const leafNodes = nodes.filter((node) => {
      const dependents = dependentsMap.get(node.name) || [];
      return dependents.length === 0;
    });

    console.log('[SectionKnowledgeGraph] 叶子节点:', leafNodes.map(n => n.name));

    // ============================================================
    // 第二步：从每个叶子节点出发，找出独立的主直线链
    // 核心：一条直线链是从叶子节点出发，沿着"主线前置"向左延伸的最长路径
    // 主线前置 = 第一个前置节点（或选择依赖深度最大的前置）
    // ============================================================
    
    // 记录节点是否已被分配到某条直线链
    const chainAssignedNodes = new Set<string>();
    
    // 记录每个节点在直线链中选择了哪个前置节点作为主线
    const mainPrereqInChain = new Map<string, string>();
    
    // 存储所有直线链（每条链是一个节点名称数组，从左到右排序）
    const chains: string[][] = [];
    
    // 从叶子节点出发，构建直线链
    // 选择依赖深度最大的前置作为主线（使用前面定义的 getDepth 函数）
    const buildChain = (leafNodeName: string): { chain: string[], mainPrereqs: Map<string, string> } => {
      const chain: string[] = [];
      const mainPrereqs = new Map<string, string>();
      let current = leafNodeName;
      
      while (current && !chainAssignedNodes.has(current)) {
        chain.push(current);
        
        const node = nodeMap.get(current);
        if (!node || node.prerequisites.length === 0) break;
        
        // 选择依赖深度最大的前置作为主线
        let bestPrereq: string | null = null;
        let maxDepth = -1;
        
        for (const prereqName of node.prerequisites) {
          if (chainAssignedNodes.has(prereqName)) continue; // 跳过已被分配的前置
          
          const depth = getDepth(prereqName);
          if (depth > maxDepth) {
            maxDepth = depth;
            bestPrereq = prereqName;
          }
        }
        
        if (bestPrereq) {
          mainPrereqs.set(current, bestPrereq);
          current = bestPrereq;
        } else {
          break;
        }
      }
      
      // 按level从小到大排序（左边到右边）
      chain.sort((a, b) => {
        const nodeA = nodeMap.get(a);
        const nodeB = nodeMap.get(b);
        return (nodeA?.level || 0) - (nodeB?.level || 0);
      });
      
      return { chain, mainPrereqs };
    };

    // 按叶子节点的level排序（从大到小，level大的在右边，优先处理）
    const sortedLeafNodes = [...leafNodes].sort((a, b) => b.level - a.level);

    // 从每个叶子节点构建直线链
    for (const leafNode of sortedLeafNodes) {
      if (chainAssignedNodes.has(leafNode.name)) continue;
      
      const result = buildChain(leafNode.name);
      const chain = result.chain;
      
      if (chain.length > 0) {
        // 标记这些节点为已分配到直线链
        chain.forEach(name => chainAssignedNodes.add(name));
        
        // 记录主线前置关系
        result.mainPrereqs.forEach((prereq, node) => {
          mainPrereqInChain.set(node, prereq);
        });
        
        chains.push(chain);
      }
    }

    console.log('[SectionKnowledgeGraph] 直线链:', chains.map((chain, i) => ({
      chainId: i,
      nodes: chain.map(name => nodeMap.get(name)?.name),
      levels: chain.map(name => nodeMap.get(name)?.level)
    })));
    
    console.log('[SectionKnowledgeGraph] 主线前置关系:', Array.from(mainPrereqInChain.entries()).map(([node, prereq]) => ({
      node: nodeMap.get(node)?.name,
      mainPrereq: nodeMap.get(prereq)?.name
    })));

    // ============================================================
    // 第三步：处理剩余未分配的节点（这些是分支节点）
    // ============================================================
    
    const unassignedNodes = nodes.filter(n => !chainAssignedNodes.has(n.name));
    console.log('[SectionKnowledgeGraph] 未分配节点（分支）:', unassignedNodes.map(n => n.name));

    // ============================================================
    // 第四步：逐链处理 - 为每条链分配Y坐标并处理分支
    // 核心：逐链顺序处理，后面的链根据跨链连接调整位置
    // 问题2：动态计算链间间距
    // ============================================================
    const baseChainGap = 80; // 基准链间距
    const branchDistance = 80; // 分支节点的距离
    
    // 问题2：计算链的分支复杂度（分支数量）
    const calculateChainComplexity = (chain: string[]): number => {
      let branchCount = 0;
      chain.forEach(nodeName => {
        const node = nodeMap.get(nodeName);
        if (node && node.prerequisites.length > 1) {
          // 每个节点的前置数量-1 = 分支数量
          branchCount += node.prerequisites.length - 1;
        }
      });
      return branchCount;
    };
    
    // 记录已处理的所有节点（包括直线链和分支）
    const processedNodes = new Set<string>();
    
    // 记录每条链的Y坐标基准
    const chainBaseYMap = new Map<number, number>();
    
    // ============================================================
    // 分支Y坐标计算函数
    // 核心改进：确保每个分支有不同的Y偏移，不会与主线或其他分支重叠
    // 参数：
    // - branchOrder: 当前分支在分支列表中的顺序（0到totalBranches-1）
    // - totalBranches: 分支总数
    // 策略：分支按顺序在主线的上方和下方交替分布，保持足够间距
    // ============================================================
    const calculateBranchOffset = (branchOrder: number, totalBranches: number): number => {
      if (totalBranches === 0) return 0;
      
      // 分支与主线之间的距离
      const mainBranchDistance = 100;
      // 分支与分支之间的最小间距（考虑节点高度约30px + 文字20px）
      const branchSpacing = 70;
      
      if (totalBranches === 1) {
        // 单个分支：放在下方
        return mainBranchDistance;
      }
      
      if (totalBranches === 2) {
        // 两个分支：一个上方，一个下方
        return branchOrder === 0 ? mainBranchDistance : -mainBranchDistance;
      }
      
      // 3个及以上分支：交替分布在主线上下两侧
      // 偶数索引：下方，奇数索引：上方
      const isAbove = branchOrder % 2 === 1;
      const positionInSide = Math.floor(branchOrder / 2);
      
      // 在同一侧的位置
      // 第一个在该侧的分支距离主线 mainBranchDistance
      // 后续分支依次增加 branchSpacing
      const baseOffset = mainBranchDistance + positionInSide * branchSpacing;
      
      return isAbove ? -baseOffset : baseOffset;
    };
    
    // ============================================================
    // 处理单个节点的分支
    // 关键改进：确保所有分支节点都被正确处理
    // 重要：只处理不在直线链上的前置节点
    // ============================================================
    const processNodeBranches = (nodeName: string, chainNodes: Set<string>) => {
      const node = nodeMap.get(nodeName);
      if (!node) return;

      // 主线前置（在直线链上的前置）
      const mainPrereq = mainPrereqInChain.get(nodeName);

      // 找出分支前置（不在直线链上的前置，且不在其他链上）
      const branchPrereqs = node.prerequisites.filter((prereqName) => {
        if (prereqName === mainPrereq) return false;
        // 如果这个前置节点已经在某条直线链上，不要当作分支处理
        if (chainAssignedNodes.has(prereqName)) return false;
        return true;
      });

      if (branchPrereqs.length === 0) return;

      const totalBranches = branchPrereqs.length;
      console.log(`[SectionKnowledgeGraph] 处理节点 ${node.name} 的分支: 共${totalBranches}个分支, 分支列表: ${branchPrereqs.join(', ')}`);

      branchPrereqs.forEach((prereqName, branchOrder) => {
        const prereqNode = nodeMap.get(prereqName);
        if (!prereqNode) return;
        
        // 计算Y偏移（每个分支都有不同的偏移）
        const yOffset = calculateBranchOffset(branchOrder, totalBranches);
        const newY = node.y + yOffset;
        
        // 设置分支Y坐标（无论是否已处理）
        const oldY = prereqNode.y;
        prereqNode.y = newY;
        processedNodes.add(prereqName);
        
        console.log(`[SectionKnowledgeGraph] 分支: ${prereqNode.name}, 父节点: ${node.name}, 分支顺序: ${branchOrder}/${totalBranches}, Y偏移: ${Math.round(yOffset)}, Y: ${Math.round(oldY)} → ${Math.round(newY)}`);
        
        // 处理分支节点的前置连接
        if (prereqNode.prerequisites.length > 0) {
          prereqNode.prerequisites.forEach((subPrereqName) => {
            const subPrereqNode = nodeMap.get(subPrereqName);
            if (subPrereqNode && !processedNodes.has(subPrereqName) && !chainAssignedNodes.has(subPrereqName)) {
              // 分支的前置在分支的正左边（同一Y坐标）
              subPrereqNode.y = prereqNode.y;
              processedNodes.add(subPrereqName);
              console.log(`[SectionKnowledgeGraph] 分支前置: ${subPrereqNode.name}, Y: ${Math.round(subPrereqNode.y)}`);
            }
          });
        }
      });
    };

    // ============================================================
    // 逐链处理
    // 关键改进：跟踪已处理节点的最大和最小Y坐标，确保新链不会重叠
    // ============================================================
    let currentBaseY = baseY;
    let maxYUsed = baseY; // 记录已使用的最大Y坐标（包括分支）
    let minYUsed = baseY; // 记录已使用的最小Y坐标（包括分支）
    
    chains.forEach((chain, chainIndex) => {
      // 确定这条链的基准Y坐标
      let chainY: number;
      
      if (chainIndex === 0) {
        // 第一条链使用基准Y
        chainY = baseY;
      } else {
        // 问题5修复：检测当前链是否有跨链连接
        const lastNodeName = chain[chain.length - 1];
        const lastNode = nodeMap.get(lastNodeName);
        let crossChainPrereq: { name: string; y: number } | null = null;
        
        if (lastNode && lastNode.prerequisites.length > 0) {
          for (const prereqName of lastNode.prerequisites) {
            if (processedNodes.has(prereqName)) {
              const prereqNode = nodeMap.get(prereqName);
              if (prereqNode) {
                crossChainPrereq = { name: prereqName, y: prereqNode.y };
                console.log(`[SectionKnowledgeGraph] 跨链连接: 链${chainIndex}的${lastNodeName} -> ${prereqName}, 前置Y=${Math.round(prereqNode.y)}`);
                break;
              }
            }
          }
        }
        
        // 计算动态间距
        const prevChainComplexity = calculateChainComplexity(chains[chainIndex - 1]);
        const currentChainComplexity = calculateChainComplexity(chain);
        const dynamicGap = baseChainGap + Math.max(prevChainComplexity, currentChainComplexity) * 20;
        
        if (crossChainPrereq) {
          // 跨链连接：确保新链不会与已处理的节点重叠
          // 使用maxYUsed作为基准，确保在所有已处理节点的下方
          chainY = maxYUsed + dynamicGap;
          console.log(`[SectionKnowledgeGraph] 链${chainIndex}跨链连接: 基于maxY=${Math.round(maxYUsed)}, 间距=${Math.round(dynamicGap)}`);
        } else {
          // 非跨链连接：同样基于maxYUsed计算
          chainY = maxYUsed + dynamicGap;
          console.log(`[SectionKnowledgeGraph] 链${chainIndex}间距: 前链分支${prevChainComplexity}, 当前分支${currentChainComplexity}, 动态间距=${Math.round(dynamicGap)}`);
        }
      }
      
      chainBaseYMap.set(chainIndex, chainY);
      currentBaseY = chainY;
      
      // 更新最大Y坐标
      if (chainY > maxYUsed) maxYUsed = chainY;
      if (chainY < minYUsed) minYUsed = chainY;
      
      // 为直线链上的节点分配Y坐标
      const chainNodeSet = new Set(chain);
      console.log(`[SectionKnowledgeGraph] 链${chainIndex} 包含 ${chain.length} 个节点`);
      chain.forEach((nodeName, idx) => {
        const node = nodeMap.get(nodeName);
        if (node) {
          const oldY = node.y;
          node.y = chainY;
          processedNodes.add(nodeName);
          console.log(`[SectionKnowledgeGraph] 直线链节点[${idx}]: ${node.name}, Y: ${Math.round(oldY)} → ${Math.round(node.y)}`);
        } else {
          console.log(`[SectionKnowledgeGraph] 警告: 节点 ${nodeName} 不在nodeMap中!`);
        }
      });
      
      console.log(`[SectionKnowledgeGraph] 链${chainIndex} Y坐标: ${Math.round(chainY)}, 节点: ${chain.map(n => nodeMap.get(n)?.name).join(', ')}`);
      
      // 处理这条链上每个节点的分支
      chain.forEach((nodeName) => {
        processNodeBranches(nodeName, chainNodeSet);
      });
      
      // 更新已使用的Y坐标范围（考虑分支节点）
      nodeMap.forEach((node) => {
        if (processedNodes.has(node.name)) {
          if (node.y > maxYUsed) maxYUsed = node.y;
          if (node.y < minYUsed) minYUsed = node.y;
        }
      });
      
      console.log(`[SectionKnowledgeGraph] 链${chainIndex}处理后 Y范围: [${Math.round(minYUsed)}, ${Math.round(maxYUsed)}]`);
    });

    // ============================================================
    // 处理可能遗漏的节点
    // 关键改进：不使用前置节点的Y坐标，而是找到最近的已处理Y并偏移
    // ============================================================
    nodeMap.forEach((node) => {
      if (node.y === 0) {
        // 如果Y坐标未被设置，需要找到合适的Y坐标
        const prereqNodes = node.prerequisites
          .map(pname => nodeMap.get(pname))
          .filter(n => n !== undefined && n.y !== 0);
        
        if (prereqNodes.length > 0) {
          // 取前置节点Y坐标的平均值，但加上偏移避免重叠
          const avgY = prereqNodes.reduce((sum, n) => sum + n!.y, 0) / prereqNodes.length;
          // 加上一个偏移量，避免与前一条链的节点重叠
          node.y = avgY + branchDistance;
          console.log(`[SectionKnowledgeGraph] 遗漏节点 ${node.name} Y坐标: ${Math.round(node.y)} (前置平均Y=${Math.round(avgY)})`);
        } else {
          // 如果没有前置节点，找到当前最大的Y坐标并加间距
          const maxY = Math.max(...Array.from(nodeMap.values()).map(n => n.y).filter(y => y > 0), 0);
          node.y = maxY === 0 ? baseY : maxY + baseChainGap;
          console.log(`[SectionKnowledgeGraph] 遗漏节点 ${node.name} Y坐标: ${Math.round(node.y)} (无前置，最大Y=${maxY})`);
        }
      }
    });

    console.log('[SectionKnowledgeGraph] 图谱节点:', Array.from(nodeMap.values()).map(n => ({
      id: n.id,
      name: n.name,
      level: n.level,
      y: Math.round(n.y),
      isInSection: n.isInSection
    })));

    console.log('[SectionKnowledgeGraph] 图谱边:', edges.map(e => ({
      from: nodeMap.get(e.from)?.name,
      to: nodeMap.get(e.to)?.name,
      方向: `${nodeMap.get(e.from)?.name} → ${nodeMap.get(e.to)?.name} (依赖)`
    })));

    return { nodes, edges, nodeMap, maxLevel };
  }, [sectionKnowledgePoints, findNodeById, findNodeByName]);

  // 计算 SVG 尺寸
  useEffect(() => {
    const { nodes, maxLevel } = graphData;
    const minX = startX;
    const maxX = startX + maxLevel * levelGap + nodeWidth;
    const width = Math.max(600, maxX + 80);

    const ys = nodes.map(n => n.y);
    const minY = Math.min(...ys, 100);
    const maxY = Math.max(...ys, 100);
    const height = Math.max(300, maxY - minY + 150);

    setSvgWidth(width);
    setSvgHeight(height);
  }, [graphData, levelGap, nodeWidth]);

  const { nodes, edges, nodeMap, maxLevel } = graphData;

  // 将名称分割成多行的函数
  // 每行最多显示 maxChars 个字符
  const splitNameToLines = (name: string, maxChars: number): string[] => {
    const lines: string[] = [];
    for (let i = 0; i < name.length; i += maxChars) {
      lines.push(name.slice(i, i + maxChars));
    }
    return lines;
  };

  // 渲染三角形节点（小节内的知识点）
  const renderTriangleNode = (node: typeof nodes[0], x: number, y: number) => {
    const size = 8; // 调整尺寸：16 → 8
    // 三角形：顶点朝上
    const points = `${x},${y - size} ${x - size},${y + size * 0.7} ${x + size},${y + size * 0.7}`;
    
    // 名称换行处理：每行最多6个字符
    const maxCharsPerLine = 6;
    const nameLines = splitNameToLines(node.name, maxCharsPerLine);
    const lineHeight = 14;

    return (
      <g key={node.id} className="cursor-pointer group">
        {/* 三角形背景 */}
        <polygon
          points={points}
          fill="#8B5CF6"
          stroke="#7C3AED"
          strokeWidth={1.5}
          className="drop-shadow-md"
        />
        {/* 节点名称（多行显示完整名称） */}
        {nameLines.map((line, index) => (
          <text
            key={index}
            x={x}
            y={y + size + 12 + index * lineHeight}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-semibold fill-purple-700 select-none"
          >
            {line}
          </text>
        ))}
        {/* 提示框 */}
        <title>{node.name}（本节知识点）</title>
      </g>
    );
  };

  // 渲染圆形节点（外部前置知识点）
  const renderCircleNode = (node: typeof nodes[0], x: number, y: number) => {
    const radius = 8; // 调整尺寸：14 → 8
    
    // 名称换行处理：每行最多6个字符
    const maxCharsPerLine = 6;
    const nameLines = splitNameToLines(node.name, maxCharsPerLine);
    const lineHeight = 14;

    return (
      <g key={node.id} className="cursor-pointer group">
        {/* 圆形背景 */}
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="#EFF6FF"
          stroke="#3B82F6"
          strokeWidth={1}
          className="drop-shadow-sm"
        />
        {/* 节点名称（多行显示完整名称） */}
        {nameLines.map((line, index) => (
          <text
            key={index}
            x={x}
            y={y + radius + 12 + index * lineHeight}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-blue-700 select-none"
          >
            {line}
          </text>
        ))}
        {/* 提示框 */}
        <title>{node.name}（非本节知识点）</title>
      </g>
    );
  };

  // 渲染连接线（带箭头）
  // 箭头方向：从前置方指向依赖方
  // 前置方（to）在左边，依赖方（from）在右边，箭头从左向右指
  const renderConnection = (edge: { from: string; to: string }, index: number) => {
    const fromNode = nodeMap.get(edge.from);  // 依赖方（当前知识点，在右边）
    const toNode = nodeMap.get(edge.to);      // 前置方（前置知识点，在左边）

    if (!fromNode || !toNode) return null;

    // X坐标：层级越大，X越大（在右边）
    const fromX = startX + fromNode.level * levelGap;  // 右边
    const toX = startX + toNode.level * levelGap;      // 左边
    const fromY = fromNode.y;
    const toY = toNode.y;

    // 节点尺寸（与渲染函数中的尺寸保持一致）
    const fromSize = fromNode.isInSection ? 8 : 8;
    const toSize = toNode.isInSection ? 8 : 8;

    // 起点和终点
    // 从前置知识点（to，在左边）的右边缘出发
    // 到当前知识点（from，在右边）的左边缘
    const startX_pos = toX + toSize;   // 从左边节点的右边出发
    const startY_pos = toY;
    const endX_pos = fromX - fromSize; // 到右边节点的左边
    const endY_pos = fromY;

    // 计算方向向量（从起点指向终点，即从左向右）
    const dx = endX_pos - startX_pos;
    const dy = endY_pos - startY_pos;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // 方向向量（归一化）
    const dirX = dist > 0 ? dx / dist : 1; // 默认向右
    const dirY = dist > 0 ? dy / dist : 0;

    // 箭头参数
    const arrowLength = 10;
    const arrowWidth = 6;
    
    // 箭头尖端在终点（当前知识点处）
    const tipX = endX_pos;
    const tipY = endY_pos;
    
    // 箭头底部（在箭头后面）
    const baseX = tipX - dirX * arrowLength;
    const baseY = tipY - dirY * arrowLength;
    
    // 箭头两翼的偏移（垂直于方向向量）
    const perpX = -dirY * arrowWidth;
    const perpY = dirX * arrowWidth;

    return (
      <g key={`conn-${index}`}>
        {/* 连接线（从起点到箭头底部） */}
        <line
          x1={startX_pos}
          y1={startY_pos}
          x2={baseX}
          y2={baseY}
          stroke="#94A3B8"
          strokeWidth={1.5}
        />
        {/* 箭头（三角形，尖端在终点） */}
        <polygon
          points={`${tipX},${tipY} ${baseX + perpX},${baseY + perpY} ${baseX - perpX},${baseY - perpY}`}
          fill="#64748B"
        />
      </g>
    );
  };

  // 如果没有知识点，显示空状态
  if (sectionKnowledgePoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        暂无知识点
      </div>
    );
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
        {/* 渲染连接线（先渲染，在节点下面） */}
        {edges.map((edge, index) => renderConnection(edge, index))}

        {/* 渲染节点 */}
        {nodes.map((node) => {
          const x = startX + node.level * levelGap;
          const y = node.y;

          if (node.isInSection) {
            return renderTriangleNode(node, x, y);
          } else {
            return renderCircleNode(node, x, y);
          }
        })}
      </svg>
    </div>
  );
}
