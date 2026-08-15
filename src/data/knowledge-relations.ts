// 知识点关联关系类型
export interface KnowledgeRelation {
  id: string;
  name: string;
  isModule?: boolean;
  stepId?: string;
  stepOrder?: number;
}

// 知识点节点类型
export interface KnowledgeNode {
  id: string;
  name: string;
  examFrequency?: 'high' | 'medium' | 'low';
  strategyType?: 'general' | 'personalized';
  personalizedStrategies?: string[];
  expanded?: boolean;
  prerequisiteKnowledge?: KnowledgeRelation[];
  extensionKnowledge?: KnowledgeRelation[];
  convergenceKnowledge?: KnowledgeRelation;
  children?: KnowledgeNode[];
}

// 通用知识树数据（包含前置关系）
export const knowledgeTreeData: KnowledgeNode[] = [
  {
    id: '1',
    name: '函数',
    examFrequency: 'medium',
    expanded: true,
    children: [
      {
        id: '1-0',
        name: '反比例函数',
        examFrequency: 'medium',
        strategyType: 'general',
        prerequisiteKnowledge: [],
        extensionKnowledge: [],
      },
      {
        id: '1-0-1',
        name: '二次函数的定义',
        examFrequency: 'high',
        strategyType: 'general',
        prerequisiteKnowledge: [
          { id: '1-0', name: '反比例函数', isModule: true, stepId: 'chain-1', stepOrder: 0 },
        ],
        extensionKnowledge: [],
      },
      {
        id: '1-1',
        name: '一次函数',
        examFrequency: 'high',
        strategyType: 'general',
        prerequisiteKnowledge: [
          { id: 'ext-1', name: '代数式与整式运算', isModule: true, stepId: 'step-1', stepOrder: 0 },
          { id: 'ext-2', name: '函数的概念', stepId: 'step-2', stepOrder: 1 },
          { id: 'ext-3', name: '函数的表达', stepId: 'step-2', stepOrder: 1 },
        ],
        extensionKnowledge: [
          { id: 'ext-4', name: '函数与方程', stepId: 'ext-1', stepOrder: 0 },
          { id: 'ext-5', name: '函数建模', stepId: 'ext-1', stepOrder: 0 },
        ],
      },
      {
        id: '1-2',
        name: '二次函数',
        examFrequency: 'high',
        strategyType: 'personalized',
        personalizedStrategies: ['basic', 'comprehensive'],
        prerequisiteKnowledge: [
          { id: '1-1', name: '一次函数' },
          { id: 'ext-6', name: '一元二次方程' },
        ],
        extensionKnowledge: [
          { id: 'ext-7', name: '二次函数的应用' },
          { id: 'ext-8', name: '二次函数与不等式' },
        ],
        children: [
          {
            id: '1-2-1',
            name: '二次函数的图像',
            examFrequency: 'high',
            strategyType: 'personalized',
            personalizedStrategies: ['basic', 'comprehensive'],
            prerequisiteKnowledge: [
              { id: '1-0-1', name: '二次函数的定义', isModule: false, stepId: 'branch-1', stepOrder: 0 },
            ],
            extensionKnowledge: [
              { id: 'ext-9', name: '上下平移', stepId: 'ext-branch-1', stepOrder: 0 },
              { id: 'ext-10', name: '左右平移', stepId: 'ext-branch-2', stepOrder: 0 },
            ],
            convergenceKnowledge: { id: 'c1', name: '二次函数的最值' },
          },
        ],
      },
      {
        id: '1-3',
        name: '指数函数',
        examFrequency: 'medium',
        strategyType: 'general',
        prerequisiteKnowledge: [
          { id: 'p1', name: '幂运算' },
          { id: 'p2', name: '函数概念' },
        ],
        extensionKnowledge: [
          { id: 'e1', name: '对数函数' },
          { id: 'e2', name: '指数方程' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '几何',
    examFrequency: 'medium',
    children: [
      {
        id: '2-1',
        name: '平面几何',
        examFrequency: 'high',
        strategyType: 'personalized',
        personalizedStrategies: ['basic', 'advanced'],
        prerequisiteKnowledge: [
          { id: 'p1', name: '线与角' },
          { id: 'p2', name: '三角形' },
        ],
        extensionKnowledge: [
          { id: 'e1', name: '圆' },
          { id: 'e2', name: '四边形' },
        ],
      },
      {
        id: '2-2',
        name: '立体几何',
        examFrequency: 'high',
        strategyType: 'general',
        prerequisiteKnowledge: [
          { id: 'p1', name: '平面几何' },
          { id: 'p2', name: '空间想象' },
        ],
        extensionKnowledge: [
          { id: 'e1', name: '空间向量' },
          { id: 'e2', name: '立体几何证明' },
        ],
      },
    ],
  },
  {
    id: '3',
    name: '图形与几何',
    examFrequency: 'high',
    expanded: true,
    children: [
      {
        id: '3-1',
        name: '四边形',
        examFrequency: 'high',
        children: [
          {
            id: '3-1-1',
            name: '四边形的定义',
            examFrequency: 'medium',
            prerequisiteKnowledge: [],
            extensionKnowledge: [],
          },
          {
            id: '3-1-2',
            name: '特殊四边形',
            examFrequency: 'high',
            children: [
              {
                id: '3-1-2-1',
                name: '平行四边形的定义',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-1-1', name: '四边形的定义' },
                ],
                extensionKnowledge: [],
              },
            ],
          },
          {
            id: '3-1-3',
            name: '多边形',
            examFrequency: 'high',
            children: [
              {
                id: '3-1-3-1',
                name: '多边形的相关定义',
                examFrequency: 'medium',
                prerequisiteKnowledge: [],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-2',
                name: '多边形内角和定理',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-1', name: '多边形的相关定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-3',
                name: '多边形外角和定理',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-2', name: '多边形内角和定理' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-4',
                name: '正多边形的定义',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-1', name: '多边形的相关定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-5',
                name: '正多边形的性质',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-4', name: '正多边形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-6',
                name: '正多边形与圆的关系',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-2-2-1', name: '圆内接正多边形' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-7',
                name: '中心角的计算',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-6', name: '正多边形与圆的关系' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-8',
                name: '边心距的定义',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-6', name: '正多边形与圆的关系' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-1-3-9',
                name: '正多边形的镶嵌应用',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-1-3-3', name: '多边形外角和定理' },
                  { id: '3-1-3-2', name: '多边形内角和定理' },
                  { id: '3-1-3-5', name: '正多边形的性质' },
                ],
                extensionKnowledge: [],
              },
            ],
          },
        ],
      },
      {
        id: '3-2',
        name: '圆',
        examFrequency: 'high',
        children: [
          {
            id: '3-2-1',
            name: '圆的相关概念',
            examFrequency: 'high',
            children: [
              {
                id: '3-2-1-1',
                name: '圆的定义',
                examFrequency: 'high',
                prerequisiteKnowledge: [],
                extensionKnowledge: [],
              },
            ],
          },
          {
            id: '3-2-2',
            name: '圆与多边形',
            examFrequency: 'high',
            children: [
              {
                id: '3-2-2-1',
                name: '圆内接正多边形',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-2-1-1', name: '圆的定义' },
                  { id: '3-1-3-4', name: '正多边形的定义' },
                ],
                extensionKnowledge: [],
              },
            ],
          },
        ],
      },
      {
        id: '3-3',
        name: '三角形',
        examFrequency: 'high',
        children: [
          {
            id: '3-3-1',
            name: '三角形初步认识',
            examFrequency: 'medium',
            children: [
              {
                id: '3-3-1-1',
                name: '三角形的定义',
                examFrequency: 'medium',
                prerequisiteKnowledge: [],
                extensionKnowledge: [],
              },
              {
                id: '3-3-1-2',
                name: '三角形内角和定理',
                examFrequency: 'medium',
                prerequisiteKnowledge: [
                  { id: '3-3-1-1', name: '三角形的定义' },
                ],
                extensionKnowledge: [],
              },
            ],
          },
          {
            id: '3-3-2',
            name: '全等三角形',
            examFrequency: 'high',
            children: [
              {
                id: '3-3-2-1',
                name: '全等三角形的定义',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-1-1', name: '三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-2-2',
                name: '全等三角形的判定（SAS）',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-2-1', name: '全等三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-2-3',
                name: '全等三角形的判定（ASA）',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-2-1', name: '全等三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-2-4',
                name: '全等三角形的判定（AAS）',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-2-1', name: '全等三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-2-5',
                name: '全等三角形的判定（SSS）',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-2-1', name: '全等三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-2-6',
                name: '全等三角形的应用',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-2-2', name: '全等三角形的判定（SAS）' },
                  { id: '3-3-2-3', name: '全等三角形的判定（ASA）' },
                  { id: '3-3-2-4', name: '全等三角形的判定（AAS）' },
                  { id: '3-3-2-5', name: '全等三角形的判定（SSS）' },
                ],
                extensionKnowledge: [],
              },
            ],
          },
          {
            id: '3-3-3',
            name: '相似三角形',
            examFrequency: 'high',
            children: [
              {
                id: '3-3-3-1',
                name: '相似三角形的定义',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-1-1', name: '三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-3-2',
                name: '相似三角形的判定',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-3-1', name: '相似三角形的定义' },
                ],
                extensionKnowledge: [],
              },
              {
                id: '3-3-3-3',
                name: '相似三角形的应用',
                examFrequency: 'high',
                prerequisiteKnowledge: [
                  { id: '3-3-3-2', name: '相似三角形的判定' },
                ],
                extensionKnowledge: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

// 根据知识点名称查找知识点的前置和延伸关系
export function findKnowledgeRelationsByName(name: string): {
  prerequisiteKnowledge: KnowledgeRelation[];
  extensionKnowledge: KnowledgeRelation[];
} {
  console.log('[findKnowledgeRelationsByName] 查找名称:', name);
  
  const result = {
    prerequisiteKnowledge: [] as KnowledgeRelation[],
    extensionKnowledge: [] as KnowledgeRelation[],
  };

  // 第一遍：尝试精确匹配
  const findNodeExact = (nodes: KnowledgeNode[], targetName: string): KnowledgeNode | null => {
    for (const node of nodes) {
      if (node.name === targetName) {
        console.log('[findKnowledgeRelationsByName] 精确匹配找到:', node.name);
        return node;
      }
      if (node.children) {
        const found = findNodeExact(node.children, targetName);
        if (found) return found;
      }
    }
    return null;
  };

  // 第二遍：尝试包含匹配（targetName 包含 node.name 或 node.name 包含 targetName）
  const findNodePartial = (nodes: KnowledgeNode[], targetName: string): KnowledgeNode | null => {
    for (const node of nodes) {
      if (targetName.includes(node.name) || node.name.includes(targetName)) {
        console.log('[findKnowledgeRelationsByName] 部分匹配找到:', node.name);
        return node;
      }
      if (node.children) {
        const found = findNodePartial(node.children, targetName);
        if (found) return found;
      }
    }
    return null;
  };

  // 先尝试精确匹配
  let node = findNodeExact(knowledgeTreeData, name);
  
  // 如果精确匹配失败，再尝试部分匹配
  if (!node) {
    node = findNodePartial(knowledgeTreeData, name);
  }
  
  console.log('[findKnowledgeRelationsByName] 最终结果:', node ? { name: node.name, prereq: node.prerequisiteKnowledge } : null);
  
  if (node) {
    result.prerequisiteKnowledge = node.prerequisiteKnowledge || [];
    result.extensionKnowledge = node.extensionKnowledge || [];
  }

  return result;
}

// 根据知识点ID查找知识点详情（用于递归获取前置的前置）
export function findKnowledgeNodeById(nodeId: string): KnowledgeNode | null {
  const findNode = (nodes: KnowledgeNode[], targetId: string): KnowledgeNode | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children) {
        const found = findNode(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  return findNode(knowledgeTreeData, nodeId);
}
