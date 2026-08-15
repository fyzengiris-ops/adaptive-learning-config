'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Search, Folder } from 'lucide-react';

// 知识点树节点类型
export interface KnowledgeTreeNode {
  name: string;
  freq?: string; // 考频：高频、中频、低频
  children?: KnowledgeTreeNode[];
}

// 已选知识点类型
export interface SelectedKnowledgeItem {
  id: string;
  name: string;
  isModule?: boolean;
}

// 组件 Props
interface KnowledgeSelectorTreeProps {
  data: KnowledgeTreeNode[];
  selectedIds: string[]; // 已选中的知识点ID列表
  selectedNames?: string[]; // 已选中的知识点名称列表（用于匹配）
  currentKnowledgeId?: string; // 当前正在编辑的知识点ID（不可选择）
  currentKnowledgeName?: string; // 当前正在编辑的知识点名称（不可选择）
  selectorType: 'prerequisite' | 'extension'; // 选择器类型
  onSelect: (item: SelectedKnowledgeItem) => void; // 选择回调
  disabledIds?: string[]; // 因父节点被选中而禁用的节点ID列表
}

// 生成唯一ID（使用路径作为ID）
const generateId = (path: string[]): string => {
  return path.join(' > ');
};

// 考频标签颜色
const getFreqColor = (freq?: string) => {
  if (!freq) return '';
  switch (freq) {
    case '高频':
      return 'bg-red-100 text-red-600';
    case '中频':
      return 'bg-orange-100 text-orange-600';
    case '低频':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

// 树节点组件
interface TreeNodeProps {
  node: KnowledgeTreeNode;
  level: number;
  path: string[];
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  selectedIds: string[];
  selectedNames: string[];
  currentKnowledgeId?: string;
  currentKnowledgeName?: string;
  selectorType: 'prerequisite' | 'extension';
  onSelect: (item: SelectedKnowledgeItem) => void;
  searchKeyword: string;
  disabledIds?: string[]; // 因父节点被选中而禁用的节点
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  path,
  expandedIds,
  toggleExpand,
  selectedIds,
  selectedNames,
  currentKnowledgeId,
  currentKnowledgeName,
  selectorType,
  onSelect,
  searchKeyword,
  disabledIds = [],
}) => {
  const currentPath = [...path, node.name];
  const nodeId = generateId(currentPath);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(nodeId);
  // 通过 id 或 name 匹配判断是否已选中
  const isSelected = selectedIds.includes(nodeId) || selectedNames.includes(node.name);
  // 通过 id 或 name 匹配判断是否为当前知识点
  const isCurrentKnowledge = nodeId === currentKnowledgeId || node.name === currentKnowledgeName;
  const isLeafNode = !hasChildren;
  // 检查是否因父节点被选中而禁用
  const isDisabledByParent = disabledIds.includes(nodeId);

  // 搜索匹配高亮
  const isSearchMatch = searchKeyword && 
    node.name.toLowerCase().includes(searchKeyword.toLowerCase());

  // 是否禁用（已选中、当前知识点、或因父节点被选中而禁用）
  const isDisabled = isSelected || isCurrentKnowledge || isDisabledByParent;

  const handleClick = () => {
    if (hasChildren) {
      // 有子节点：点击名称切换展开状态
      toggleExpand(nodeId);
    }
    // 叶子节点：点击名称不做任何操作，必须点击【+】按钮才能添加
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    onSelect({
      id: nodeId,
      name: node.name,
      isModule: hasChildren,
    });
  };

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50' 
            : isSearchMatch 
              ? 'bg-yellow-50 hover:bg-yellow-100'
              : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* 展开/折叠图标 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(nodeId);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5 h-5 flex-shrink-0" />
        )}

        {/* 文件夹图标（有子节点时显示）- 实心 */}
        {hasChildren && (
          <Folder 
            className={`w-4 h-4 flex-shrink-0 ${
              selectorType === 'prerequisite' ? 'text-blue-500' : 'text-orange-500'
            }`}
            fill={selectorType === 'prerequisite' ? '#3B82F6' : '#F97316'}
          />
        )}

        {/* 节点名称 */}
        <span 
          className={`flex-1 text-sm truncate ${
            hasChildren ? 'font-semibold text-gray-800' : 'text-gray-700'
          } ${isSearchMatch ? 'text-yellow-700' : ''}`}
        >
          {node.name}
        </span>

        {/* 考频标签（仅叶子节点显示） */}
        {isLeafNode && node.freq && (
          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${getFreqColor(node.freq)}`}>
            {node.freq}
          </span>
        )}

        {/* 添加按钮 - 始终显示 */}
        {!isDisabled && (
          <button
            onClick={handleAddClick}
            className={`p-1 rounded transition-all flex-shrink-0 ${
              selectorType === 'prerequisite' 
                ? 'text-blue-500 hover:bg-blue-100' 
                : 'text-orange-500 hover:bg-orange-100'
            }`}
            title="点击添加"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* 已选中标记 */}
        {isSelected && (
          <span className="text-xs text-gray-400 flex-shrink-0">已选</span>
        )}

        {/* 因父节点被选中而禁用的标记 */}
        {isDisabledByParent && !isSelected && (
          <span className="text-xs text-gray-400 flex-shrink-0">父节点已选</span>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${nodeId}-${index}`}
              node={child}
              level={level + 1}
              path={currentPath}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              selectedIds={selectedIds}
              selectedNames={selectedNames}
              currentKnowledgeId={currentKnowledgeId}
              currentKnowledgeName={currentKnowledgeName}
              selectorType={selectorType}
              onSelect={onSelect}
              searchKeyword={searchKeyword}
              disabledIds={disabledIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 主组件
export default function KnowledgeSelectorTree({
  data,
  selectedIds,
  selectedNames = [],
  currentKnowledgeId,
  currentKnowledgeName,
  selectorType,
  onSelect,
  disabledIds = [],
}: KnowledgeSelectorTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchKeyword, setSearchKeyword] = useState('');

  // 切换展开状态
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // 搜索时自动展开匹配节点的父节点
  const expandMatchingParents = useMemo(() => {
    if (!searchKeyword) return new Set<string>();
    
    const matchingParentIds = new Set<string>();
    
    const findMatches = (nodes: KnowledgeTreeNode[], currentPath: string[]) => {
      nodes.forEach((node) => {
        const nodePath = [...currentPath, node.name];
        const nodeId = generateId(nodePath);
        
        if (node.name.toLowerCase().includes(searchKeyword.toLowerCase())) {
          // 将所有父节点路径加入展开列表
          currentPath.forEach((_, index) => {
            matchingParentIds.add(generateId(currentPath.slice(0, index + 1)));
          });
        }
        
        if (node.children) {
          findMatches(node.children, nodePath);
        }
      });
    };
    
    data.forEach((node) => {
      findMatches([node], []);
    });
    
    return matchingParentIds;
  }, [searchKeyword, data]);

  // 合并展开状态
  const effectiveExpandedIds = useMemo(() => {
    if (!searchKeyword) return expandedIds;
    return new Set([...expandedIds, ...expandMatchingParents]);
  }, [expandedIds, expandMatchingParents, searchKeyword]);

  return (
    <div className="flex flex-col h-full">
      {/* 搜索框 */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索知识点..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 树状列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {data.map((node, index) => (
          <TreeNode
            key={`root-${index}`}
            node={node}
            level={0}
            path={[]}
            expandedIds={effectiveExpandedIds}
            toggleExpand={toggleExpand}
            selectedIds={selectedIds}
            selectedNames={selectedNames}
            currentKnowledgeId={currentKnowledgeId}
            currentKnowledgeName={currentKnowledgeName}
            selectorType={selectorType}
            onSelect={onSelect}
            searchKeyword={searchKeyword}
            disabledIds={disabledIds}
          />
        ))}
      </div>
    </div>
  );
}

// 辅助函数：获取所有子节点的ID
export function getAllChildIds(node: KnowledgeTreeNode, parentPath: string[] = []): string[] {
  const childIds: string[] = [];
  
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      // 当前子节点的完整路径
      const childPath = [...parentPath, node.name];
      const childId = generateId([...childPath, child.name]);
      childIds.push(childId);
      
      // 递归获取子节点的子节点
      if (child.children && child.children.length > 0) {
        childIds.push(...getAllChildIds(child, childPath));
      }
    });
  }
  
  return childIds;
}

// 辅助函数：批量获取多个节点的所有子节点ID
export function getBatchChildIds(data: KnowledgeTreeNode[], selectedIds: string[]): string[] {
  const allChildIds: string[] = [];
  
  const findNodeById = (nodes: KnowledgeTreeNode[], targetId: string, currentPath: string[] = []): KnowledgeTreeNode | null => {
    for (const node of nodes) {
      const nodePath = [...currentPath, node.name];
      const nodeId = generateId(nodePath);
      
      if (nodeId === targetId) {
        return node;
      }
      
      if (node.children) {
        const found = findNodeById(node.children, targetId, nodePath);
        if (found) return found;
      }
    }
    return null;
  };
  
  selectedIds.forEach(id => {
    const node = findNodeById(data, id);
    if (node && node.children && node.children.length > 0) {
      // 父节点路径：去掉最后一个元素（节点名称）
      const parentPath = id.split(' > ').slice(0, -1);
      // 获取所有子节点ID
      const childIds = getAllChildIds(node, parentPath);
      console.log(`[父子互斥] 节点 "${node.name}" 的所有子节点ID:`, childIds);
      allChildIds.push(...childIds);
    }
  });
  
  console.log('[父子互斥] 所有需要禁用的子节点ID:', allChildIds);
  return allChildIds;
}
