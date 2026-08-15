'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRole } from '@/contexts/RoleContext';
import * as XLSX from 'xlsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Upload,
  Download,
  GripVertical,
  Eye,
  Link2,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Clock,
  ArrowRight,
  ArrowLeft,
  Home,
  Info,
  Calculator,
  Atom,
  FlaskConical,
  Microscope,
  Globe,
  Ruler,
  Target,
  X,
  Check,
  Pencil,
  Video,
  FileText,
  Play,
  AlertTriangle,
  History,
  FolderTree,
  Folder,
  MoreVertical,
  Merge,
  Split,
  ArrowUp,
  ArrowDown,
  Layers,
  ListTree,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';
import PrdTooltip from '@/components/shared/PrdTooltip';
import * as prd201 from '@/data/prd-rules/knowledge-tree-2.01';
import * as prd204 from '@/data/prd-rules/knowledge-tree-2.04';
import KnowledgeNetworkGraph from '@/components/shared/KnowledgeNetworkGraph';
import KnowledgeSelectorTree, { getBatchChildIds } from '@/components/shared/KnowledgeSelectorTree';
import DocPanel from '@/components/shared/DocPanel';
import ImportValidationModal from '@/components/shared/ImportValidationModal';
import KnowledgeCardPanel, { type KnowledgeCard, sampleKnowledgeCard, emptyKnowledgeCard } from '@/components/shared/KnowledgeCardPanel';
import RequirementMarkerHost from '@/components/prd/RequirementMarkerHost';
import knowledgeTreeData from '@/data/knowledge-tree.json';

// 学科数据类型
interface Subject {
  id: string;
  name: string;
  knowledgeCount: number;
  lastUpdateTime: string;
  color: string;
  icon: React.ReactNode;
}

// 学科配置（全局可选学科）
const subjectConfig = [
  { id: 'math', name: '数学', color: 'bg-blue-500', icon: <Calculator className="w-6 h-6" /> },
  { id: 'english', name: '英语', color: 'bg-emerald-500', icon: <Globe className="w-6 h-6" /> },
  { id: 'physics', name: '物理', color: 'bg-purple-500', icon: <Atom className="w-6 h-6" /> },
  { id: 'chemistry', name: '化学', color: 'bg-orange-500', icon: <FlaskConical className="w-6 h-6" /> },
  { id: 'biology', name: '生物', color: 'bg-green-500', icon: <Microscope className="w-6 h-6" /> },
  { id: 'science', name: '科学', color: 'bg-teal-500', icon: <Ruler className="w-6 h-6" /> },
];

// 知识点关联关系类型
interface KnowledgeRelation {
  id: string;
  name: string;
  isModule?: boolean;    // 是否为大模块（用于样式区分）
  stepId?: string;       // 所属步骤ID（用于标识同级知识点，同一stepId的知识点横向并排）
  stepOrder?: number;    // 步骤顺序（用于排序）
}

// 学习步骤（一行可能包含多个同级知识点）
interface LearningStep {
  id: string;                           // 步骤ID
  items: KnowledgeRelation[];           // 该步骤的知识点（多个则横向并排）
}

// 视频内容类型（支持多视频）
interface VideoContent {
  id: string;                         // 本地唯一ID（用于列表渲染key）
  sourceType: 'upload' | 'library';   // 来源类型：上传 or 资源库
  resourceId?: string;                // 资源ID（资源库视频）
  url: string;                        // 视频 URL
  name: string;                       // 视频名称
  duration?: string;                  // 时长
  coverUrl?: string;                  // 封面图
  size?: string;                      // 文件大小
  uploadTime?: string;                // 上传时间
}

// 文字内容类型
interface TextContent {
  content: string;              // 富文本内容（HTML格式）
  wordCount?: number;           // 字数
  lastEditTime?: string;        // 最后编辑时间
  images?: TextImage[];         // 包含的图片列表
}

// 文字内容中的图片
interface TextImage {
  id: string;                   // 图片ID
  url: string;                  // 图片URL
  alt?: string;                 // 替代文本
  width?: number;               // 宽度
  height?: number;              // 高度
}

// 学业要求：了解 / 理解 / 掌握 / 运用；未设置则为 undefined
type AcademicRequirement = 'know' | 'understand' | 'master' | 'apply';

// 知识点数据类型
interface KnowledgeNode {
  id: string;
  name: string;
  examFrequency?: 'low' | 'medium' | 'high'; // 考频：低频、中频、高频；未设置则为 undefined
  academicRequirement?: AcademicRequirement; // 学业要求；未设置则为 undefined
  children?: KnowledgeNode[];
  expanded?: boolean;
  // 策略相关字段（仅叶子节点有效）
  strategyType?: 'general' | 'personalized'; // 通用策略 vs 个性化策略
  personalizedStrategies?: string[]; // 个性化策略ID列表
  personalizedStrategy?: PersonalizedStrategy; // 个性化策略详情
  // 关联知识点
  prerequisiteKnowledge?: KnowledgeRelation[]; // 前置知识点
  extensionKnowledge?: KnowledgeRelation[]; // 延伸知识点
  convergenceKnowledge?: KnowledgeRelation; // 汇聚节点（多条延伸分支最终汇聚到的知识点）
  // 学习资源
  videoContents?: VideoContent[]; // 视频讲解（支持多个视频）
  textContent?: TextContent;      // 文字讲解（已由知识卡片承接，保留兼容）
  knowledgeCard?: KnowledgeCard;   // 知识卡片（核心概念 + 考点）
}

// 个性化策略详情
interface PersonalizedStrategy {
  name?: string;
  type?: string;
  threshold?: number;
  questionCount?: number;
  sources?: string[];
  difficulty?: string;
}

// 发布记录类型
interface PublishRecord {
  version: string;                           // 版本号
  description: string;                       // 更新说明
  publishTime: string;                       // 发布时间
  publisher: string;                         // 发布人姓名
  publisherAccount?: string;                 // 发布人账号
  changes?: ChangeRecord[];                  // 本次变更详情
}

// 变更记录类型
interface ChangeRecord {
  type: 'add' | 'modify' | 'delete';         // 变更类型
  target: string;                            // 变更对象（知识点名称）
  detail?: string;                           // 变更详情
  dimension?: '知识点信息' | '知识点结构' | '学习资源';  // 变更维度
  changedBy?: string;                        // 修改人
  changedByRole?: 'supervisor' | 'teacher';  // 修改人角色
  changedByAccount?: string;                 // 修改人账号
}

// 知识树页面状态类型
interface KnowledgeTreePageState {
  status: 'published' | 'pending';           // 发布状态
  currentVersion: string;                    // 当前版本号
  lastPublishTime: string;                   // 最近发布时间
  lastPublisher: string;                     // 发布人姓名
  pendingChanges: number;                    // 待发布变更数量
  changedNodes: string[];                    // 有变更的节点 id 列表
  publishHistory: PublishRecord[];           // 发布历史记录
  scheduledPublish?: {                       // 定时发布信息
    version: string;                         // 待发布的版本号
    scheduledDate: string;                   // 定时日期
    scheduledTime: string;                   // 定时时间
    description: string;                     // 更新说明
    publisherAccount?: string;               // 发布人账号
  };
}

// 详情页 Tab 类型
type DetailTabType = 'info' | 'structure' | 'resource';

// 出题策略数据类型
interface Strategy {
  id: string;
  name: string;
  color: string;
  useCount: number;
}

// 策略详情 - 题目配置
interface StrategyQuestionConfig {
  questionType: string;
  questionCount: number;
  difficulty: {
    easy: number;
    easier: number;
    medium: number;
    harder: number;
    hard: number;
  };
  questionSources: string[];
  knowledgeComplexity: string;
}

// 策略详情 - 掌握度区间配置
interface StrategyMasteryRange {
  id: string;
  masteryStart: number;
  masteryEnd: number;
  questionConfigs: StrategyQuestionConfig[];
}

// 知识树分类类型
type KnowledgeTreeCategory = 'basic' | 'preschool' | 'vocational' | 'training' | 'industry' | 'general';

// 学科名称类型（每个分类下对应的学科名称）
type SubjectName = string;

// 知识树分类配置
const knowledgeTreeCategoryConfig: Record<KnowledgeTreeCategory, { label: string }> = {
  basic: { label: '基础教育' },
  preschool: { label: '学前教育' },
  vocational: { label: '职业教育' },
  training: { label: '培训考试' },
  industry: { label: '行业/协会' },
  general: { label: '通用' },
};

// 每个知识树分类下的学科名称配置（按显示顺序）
const subjectNameConfig: Record<KnowledgeTreeCategory, SubjectName[]> = {
  basic: ['高中', '初中', '小学'],
  preschool: ['幼儿'],
  vocational: ['中专', '大专'],
  training: ['语言培训', '职业培训'],
  industry: ['出境入境行业协会', '心理健康学会'],
  general: ['通用'],
};

// 学段类型（保留用于数据兼容）
type PhaseType = 'primary' | 'junior' | 'senior';

// 模拟学科数据
const mockSubjects: Record<PhaseType, Subject[]> = {
  primary: [
    { id: 'math', name: '数学', knowledgeCount: 180, lastUpdateTime: '2024-02-20', color: 'bg-blue-500', icon: <Calculator className="w-6 h-6" /> },
  ], // 小学数学
  junior: [
    { id: 'math', name: '数学', knowledgeCount: 312, lastUpdateTime: '2024-02-22', color: 'bg-blue-500', icon: <Calculator className="w-6 h-6" /> },
    { id: 'english', name: '英语', knowledgeCount: 267, lastUpdateTime: '2024-02-20', color: 'bg-emerald-500', icon: <Globe className="w-6 h-6" /> },
    { id: 'physics', name: '物理', knowledgeCount: 189, lastUpdateTime: '2024-02-19', color: 'bg-purple-500', icon: <Atom className="w-6 h-6" /> },
    { id: 'chemistry', name: '化学', knowledgeCount: 156, lastUpdateTime: '2024-02-18', color: 'bg-orange-500', icon: <FlaskConical className="w-6 h-6" /> },
  ],
  senior: [
    { id: 'math', name: '数学', knowledgeCount: 367, lastUpdateTime: '2024-02-23', color: 'bg-blue-500', icon: <Calculator className="w-6 h-6" /> },
    { id: 'english', name: '英语', knowledgeCount: 298, lastUpdateTime: '2024-02-21', color: 'bg-emerald-500', icon: <Globe className="w-6 h-6" /> },
    { id: 'physics', name: '物理', knowledgeCount: 234, lastUpdateTime: '2024-02-20', color: 'bg-purple-500', icon: <Atom className="w-6 h-6" /> },
    { id: 'chemistry', name: '化学', knowledgeCount: 201, lastUpdateTime: '2024-02-19', color: 'bg-orange-500', icon: <FlaskConical className="w-6 h-6" /> },
    { id: 'biology', name: '生物', knowledgeCount: 178, lastUpdateTime: '2024-02-18', color: 'bg-green-500', icon: <Microscope className="w-6 h-6" /> },
  ],
};

// 策略数据
const strategies: Strategy[] = [
  { id: 'general', name: '通用出题策略', color: 'bg-emerald-500', useCount: 999 },
  { id: 'basic', name: '基础概念理解策略', color: 'bg-blue-500', useCount: 12 },
  { id: 'comprehensive', name: '综合应用策略', color: 'bg-purple-500', useCount: 8 },
  { id: 'advanced', name: '高阶思维策略', color: 'bg-orange-500', useCount: 5 },
  { id: 'exam', name: '考试冲刺策略', color: 'bg-red-500', useCount: 15 },
];

// 通用策略详情数据（按掌握度区间）
const mockStrategyDetails: StrategyMasteryRange[] = [
  {
    id: 'mr-1',
    masteryStart: 0,
    masteryEnd: 25,
    questionConfigs: [
      { questionType: '选择题', questionCount: 5, difficulty: { easy: 3, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['中考真题'], knowledgeComplexity: '单一知识点' },
      { questionType: '填空题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['中考真题'], knowledgeComplexity: '单一知识点' },
    ],
  },
  {
    id: 'mr-2',
    masteryStart: 26,
    masteryEnd: 50,
    questionConfigs: [
      { questionType: '选择题', questionCount: 6, difficulty: { easy: 2, easier: 2, medium: 2, harder: 0, hard: 0 }, questionSources: ['中考真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
      { questionType: '填空题', questionCount: 3, difficulty: { easy: 1, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '当前及关联知识点' },
      { questionType: '解答题', questionCount: 3, difficulty: { easy: 1, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['中考真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
    ],
  },
  {
    id: 'mr-3',
    masteryStart: 51,
    masteryEnd: 75,
    questionConfigs: [
      { questionType: '选择题', questionCount: 4, difficulty: { easy: 0, easier: 1, medium: 2, harder: 1, hard: 0 }, questionSources: ['模拟题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
      { questionType: '填空题', questionCount: 4, difficulty: { easy: 0, easier: 1, medium: 2, harder: 1, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '多知识点复合' },
      { questionType: '解答题', questionCount: 7, difficulty: { easy: 0, easier: 0, medium: 3, harder: 3, hard: 1 }, questionSources: ['模拟题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
    ],
  },
  {
    id: 'mr-4',
    masteryStart: 76,
    masteryEnd: 100,
    questionConfigs: [
      { questionType: '选择题', questionCount: 2, difficulty: { easy: 0, easier: 0, medium: 1, harder: 1, hard: 0 }, questionSources: ['竞赛题', '压轴题'], knowledgeComplexity: '多知识点深度复合' },
      { questionType: '解答题', questionCount: 8, difficulty: { easy: 0, easier: 0, medium: 2, harder: 3, hard: 3 }, questionSources: ['竞赛题', '压轴题'], knowledgeComplexity: '多知识点深度复合' },
    ],
  },
];

// 个性化策略详情数据（按错误率区间）
// 个性化策略列表（用于模糊搜索）
const personalizedStrategies = [
  {
    id: 'basic',
    name: '同步学个性化策略（强化基础）',
    description: '适合基础薄弱的学生',
    strategyDescription: '针对基础薄弱的学生，重点强化基础知识。通过反复练习基础题目，帮助学生建立扎实的知识基础。',
    applicableScenarios: [
      '学生基础测试得分低于60分',
      '知识点掌握度评估为"未掌握"',
      '需要夯实基础后再提升'
    ],
    masteryRanges: [
      {
        id: 'p1-mr1',
        masteryStart: 0,
        masteryEnd: 25,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 3, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['中考真题'], knowledgeComplexity: '单一知识点' },
          { questionType: '填空题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['中考真题'], knowledgeComplexity: '单一知识点' },
        ],
      },
      {
        id: 'p1-mr2',
        masteryStart: 26,
        masteryEnd: 50,
        questionConfigs: [
          { questionType: '选择题', questionCount: 6, difficulty: { easy: 2, easier: 2, medium: 2, harder: 0, hard: 0 }, questionSources: ['中考真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '填空题', questionCount: 3, difficulty: { easy: 1, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '解答题', questionCount: 3, difficulty: { easy: 1, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['中考真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
        ],
      },
      {
        id: 'p1-mr3',
        masteryStart: 51,
        masteryEnd: 75,
        questionConfigs: [
          { questionType: '选择题', questionCount: 4, difficulty: { easy: 0, easier: 1, medium: 2, harder: 1, hard: 0 }, questionSources: ['模拟题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 1, medium: 2, harder: 2, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 6, difficulty: { easy: 0, easier: 0, medium: 3, harder: 2, hard: 1 }, questionSources: ['模拟题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p1-mr4',
        masteryStart: 76,
        masteryEnd: 100,
        questionConfigs: [
          { questionType: '选择题', questionCount: 3, difficulty: { easy: 0, easier: 0, medium: 1, harder: 1, hard: 1 }, questionSources: ['竞赛题', '创新题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '解答题', questionCount: 15, difficulty: { easy: 0, easier: 0, medium: 4, harder: 6, hard: 5 }, questionSources: ['竞赛题', '创新题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
    ]
  },
  {
    id: 'advanced',
    name: '同步学个性化策略（提升能力）',
    description: '适合基础较好的学生',
    strategyDescription: '针对基础较好的学生，注重能力提升和知识点综合应用。通过拓展题目，培养学生的解题能力和思维能力。',
    applicableScenarios: [
      '学生基础测试得分60-80分',
      '知识点掌握度评估为"基本掌握"',
      '需要提升综合应用能力'
    ],
    masteryRanges: [
      {
        id: 'p2-mr1',
        masteryStart: 0,
        masteryEnd: 25,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 3, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['中考真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '填空题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '解答题', questionCount: 2, difficulty: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['中考真题'], knowledgeComplexity: '当前及关联知识点' },
        ],
      },
      {
        id: 'p2-mr2',
        masteryStart: 26,
        masteryEnd: 50,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 2, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['模拟题', '拓展题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 5, difficulty: { easy: 1, easier: 2, medium: 2, harder: 0, hard: 0 }, questionSources: ['模拟题', '拓展题'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p2-mr3',
        masteryStart: 51,
        masteryEnd: 75,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 0, easier: 1, medium: 3, harder: 1, hard: 0 }, questionSources: ['拓展题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 1, medium: 3, harder: 1, hard: 0 }, questionSources: ['拓展题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 8, difficulty: { easy: 0, easier: 0, medium: 4, harder: 3, hard: 1 }, questionSources: ['拓展题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p2-mr4',
        masteryStart: 76,
        masteryEnd: 100,
        questionConfigs: [
          { questionType: '选择题', questionCount: 4, difficulty: { easy: 0, easier: 0, medium: 2, harder: 1, hard: 1 }, questionSources: ['竞赛题', '创新题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 2, harder: 2, hard: 1 }, questionSources: ['竞赛题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '解答题', questionCount: 13, difficulty: { easy: 0, easier: 0, medium: 3, harder: 5, hard: 5 }, questionSources: ['竞赛题', '创新题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
    ]
  },
  {
    id: 'exam',
    name: '同步学个性化策略（应试强化）',
    description: '适合考前冲刺',
    strategyDescription: '针对考前冲刺，强化应试技巧和答题速度。通过历年真题和模拟题训练，帮助学生熟悉考试题型和节奏。',
    applicableScenarios: [
      '临近考试需要强化训练',
      '知识点掌握度评估为"掌握"',
      '需要提升应试技巧'
    ],
    masteryRanges: [
      {
        id: 'p3-mr1',
        masteryStart: 0,
        masteryEnd: 25,
        questionConfigs: [
          { questionType: '选择题', questionCount: 7, difficulty: { easy: 4, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['历年真题'], knowledgeComplexity: '单一知识点' },
          { questionType: '填空题', questionCount: 2, difficulty: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['历年真题'], knowledgeComplexity: '单一知识点' },
          { questionType: '解答题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['历年真题'], knowledgeComplexity: '单一知识点' },
        ],
      },
      {
        id: 'p3-mr2',
        masteryStart: 26,
        masteryEnd: 50,
        questionConfigs: [
          { questionType: '选择题', questionCount: 8, difficulty: { easy: 3, easier: 2, medium: 3, harder: 0, hard: 0 }, questionSources: ['历年真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '填空题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '解答题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['历年真题', '模拟题'], knowledgeComplexity: '当前及关联知识点' },
        ],
      },
      {
        id: 'p3-mr3',
        masteryStart: 51,
        masteryEnd: 75,
        questionConfigs: [
          { questionType: '选择题', questionCount: 8, difficulty: { easy: 0, easier: 2, medium: 4, harder: 2, hard: 0 }, questionSources: ['模拟题', '押题卷'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 1, medium: 3, harder: 1, hard: 0 }, questionSources: ['模拟题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 7, difficulty: { easy: 0, easier: 0, medium: 4, harder: 2, hard: 1 }, questionSources: ['模拟题', '押题卷'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p3-mr4',
        masteryStart: 76,
        masteryEnd: 100,
        questionConfigs: [
          { questionType: '选择题', questionCount: 7, difficulty: { easy: 0, easier: 0, medium: 3, harder: 3, hard: 1 }, questionSources: ['押题卷', '竞赛题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 2, harder: 2, hard: 1 }, questionSources: ['押题卷'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '解答题', questionCount: 13, difficulty: { easy: 0, easier: 0, medium: 3, harder: 5, hard: 5 }, questionSources: ['押题卷', '竞赛题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
    ]
  },
  {
    id: 'comprehensive',
    name: '同步学个性化策略（综合提升）',
    description: '全面提升各项能力',
    strategyDescription: '全面提升学生的各项能力，兼顾基础和拓展。通过多种类型的题目训练，培养学生全面的知识应用能力。',
    applicableScenarios: [
      '需要全面提升各项能力',
      '知识点掌握度评估为"基本掌握"',
      '希望系统化学习'
    ],
    masteryRanges: [
      {
        id: 'p4-mr1',
        masteryStart: 0,
        masteryEnd: 25,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 3, easier: 1, medium: 1, harder: 0, hard: 0 }, questionSources: ['教材例题', '课后练习'], knowledgeComplexity: '单一知识点' },
          { questionType: '填空题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['课后练习'], knowledgeComplexity: '单一知识点' },
          { questionType: '解答题', questionCount: 2, difficulty: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['教材例题'], knowledgeComplexity: '单一知识点' },
        ],
      },
      {
        id: 'p4-mr2',
        masteryStart: 26,
        masteryEnd: 50,
        questionConfigs: [
          { questionType: '选择题', questionCount: 6, difficulty: { easy: 2, easier: 2, medium: 2, harder: 0, hard: 0 }, questionSources: ['课后练习', '拓展题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '填空题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['课后练习'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '解答题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['拓展题'], knowledgeComplexity: '当前及关联知识点' },
        ],
      },
      {
        id: 'p4-mr3',
        masteryStart: 51,
        masteryEnd: 75,
        questionConfigs: [
          { questionType: '选择题', questionCount: 6, difficulty: { easy: 0, easier: 2, medium: 3, harder: 1, hard: 0 }, questionSources: ['拓展题', '竞赛基础题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 1, medium: 3, harder: 1, hard: 0 }, questionSources: ['拓展题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 7, difficulty: { easy: 0, easier: 0, medium: 4, harder: 2, hard: 1 }, questionSources: ['拓展题', '竞赛基础题'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p4-mr4',
        masteryStart: 76,
        masteryEnd: 100,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 2, harder: 2, hard: 1 }, questionSources: ['竞赛基础题', '竞赛题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 2, harder: 2, hard: 1 }, questionSources: ['竞赛题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '解答题', questionCount: 12, difficulty: { easy: 0, easier: 0, medium: 3, harder: 5, hard: 4 }, questionSources: ['竞赛基础题', '竞赛题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
    ]
  },
  {
    id: 'quick',
    name: '同步学个性化策略（快速突破）',
    description: '短时间内快速提升',
    strategyDescription: '针对短期提升需求，聚焦高频考点和典型题型。通过高频考点和易错题训练，帮助学生快速突破薄弱环节。',
    applicableScenarios: [
      '需要短时间内快速提升',
      '时间有限，重点突破',
      '聚焦高频考点'
    ],
    masteryRanges: [
      {
        id: 'p5-mr1',
        masteryStart: 0,
        masteryEnd: 25,
        questionConfigs: [
          { questionType: '选择题', questionCount: 7, difficulty: { easy: 4, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['高频考点题', '典型例题'], knowledgeComplexity: '单一知识点' },
          { questionType: '填空题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['典型例题'], knowledgeComplexity: '单一知识点' },
          { questionType: '解答题', questionCount: 2, difficulty: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['高频考点题'], knowledgeComplexity: '单一知识点' },
        ],
      },
      {
        id: 'p5-mr2',
        masteryStart: 26,
        masteryEnd: 50,
        questionConfigs: [
          { questionType: '选择题', questionCount: 7, difficulty: { easy: 3, easier: 2, medium: 2, harder: 0, hard: 0 }, questionSources: ['典型例题', '易错题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '填空题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['易错题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '解答题', questionCount: 4, difficulty: { easy: 1, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['典型例题', '易错题'], knowledgeComplexity: '当前及关联知识点' },
        ],
      },
      {
        id: 'p5-mr3',
        masteryStart: 51,
        masteryEnd: 75,
        questionConfigs: [
          { questionType: '选择题', questionCount: 7, difficulty: { easy: 0, easier: 2, medium: 3, harder: 2, hard: 0 }, questionSources: ['易错题', '高频考点题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 1, medium: 3, harder: 1, hard: 0 }, questionSources: ['易错题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 6, difficulty: { easy: 0, easier: 0, medium: 4, harder: 2, hard: 0 }, questionSources: ['易错题', '高频考点题'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p5-mr4',
        masteryStart: 76,
        masteryEnd: 100,
        questionConfigs: [
          { questionType: '选择题', questionCount: 6, difficulty: { easy: 0, easier: 0, medium: 3, harder: 2, hard: 1 }, questionSources: ['高频考点题', '拓展题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '填空题', questionCount: 6, difficulty: { easy: 0, easier: 0, medium: 2, harder: 3, hard: 1 }, questionSources: ['拓展题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '解答题', questionCount: 8, difficulty: { easy: 0, easier: 0, medium: 2, harder: 4, hard: 2 }, questionSources: ['高频考点题', '拓展题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
    ]
  },
  {
    id: 'deep',
    name: '同步学个性化策略（深度学习）',
    description: '深入理解知识点',
    strategyDescription: '针对深度学习需求，注重知识点的深入理解和综合应用。通过拓展题和竞赛题训练，培养学生的高阶思维能力。',
    applicableScenarios: [
      '需要深入理解知识点',
      '知识点掌握度评估为"掌握"',
      '希望挑战高难度题目'
    ],
    masteryRanges: [
      {
        id: 'p6-mr1',
        masteryStart: 0,
        masteryEnd: 25,
        questionConfigs: [
          { questionType: '选择题', questionCount: 6, difficulty: { easy: 3, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['拓展题', '综合应用题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '填空题', questionCount: 3, difficulty: { easy: 2, easier: 1, medium: 0, harder: 0, hard: 0 }, questionSources: ['综合应用题'], knowledgeComplexity: '当前及关联知识点' },
          { questionType: '解答题', questionCount: 5, difficulty: { easy: 2, easier: 2, medium: 1, harder: 0, hard: 0 }, questionSources: ['拓展题'], knowledgeComplexity: '当前及关联知识点' },
        ],
      },
      {
        id: 'p6-mr2',
        masteryStart: 26,
        masteryEnd: 50,
        questionConfigs: [
          { questionType: '选择题', questionCount: 6, difficulty: { easy: 0, easier: 2, medium: 3, harder: 1, hard: 0 }, questionSources: ['综合应用题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 4, difficulty: { easy: 0, easier: 1, medium: 2, harder: 1, hard: 0 }, questionSources: ['竞赛题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 8, difficulty: { easy: 0, easier: 0, medium: 4, harder: 3, hard: 1 }, questionSources: ['综合应用题', '竞赛题'], knowledgeComplexity: '多知识点复合' },
        ],
      },
      {
        id: 'p6-mr3',
        masteryStart: 51,
        masteryEnd: 75,
        questionConfigs: [
          { questionType: '选择题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 3, harder: 2, hard: 0 }, questionSources: ['竞赛题', '创新题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 3, harder: 2, hard: 0 }, questionSources: ['创新题'], knowledgeComplexity: '多知识点复合' },
          { questionType: '解答题', questionCount: 12, difficulty: { easy: 0, easier: 0, medium: 4, harder: 5, hard: 3 }, questionSources: ['竞赛题', '创新题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
      {
        id: 'p6-mr4',
        masteryStart: 76,
        masteryEnd: 100,
        questionConfigs: [
          { questionType: '选择题', questionCount: 3, difficulty: { easy: 0, easier: 0, medium: 1, harder: 1, hard: 1 }, questionSources: ['创新题', '高难度竞赛题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '填空题', questionCount: 5, difficulty: { easy: 0, easier: 0, medium: 1, harder: 2, hard: 2 }, questionSources: ['高难度竞赛题'], knowledgeComplexity: '多知识点深度复合' },
          { questionType: '解答题', questionCount: 17, difficulty: { easy: 0, easier: 0, medium: 2, harder: 7, hard: 8 }, questionSources: ['创新题', '高难度竞赛题'], knowledgeComplexity: '多知识点深度复合' },
        ],
      },
    ]
  },
];

// 各学科知识树发布状态 Mock 数据
const mockKnowledgeTreePublishState: Record<string, KnowledgeTreePageState> = {
  // 高中
  'senior-math': {
    status: 'published',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-15 14:30',
    lastPublisher: '张三',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.0', description: '初始版本，完成高中数学知识树基础结构构建', publishTime: '2024-01-15 14:30', publisher: '张三', publisherAccount: '582134' },
    ],
  },
  'senior-english': {
    status: 'published',
    currentVersion: 'v1.5',
    lastPublishTime: '2024-01-22 09:00',
    lastPublisher: '李老师',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.5', description: '优化阅读理解知识点结构', publishTime: '2024-01-22 09:00', publisher: '李老师', publisherAccount: '671528' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-10 10:00', publisher: '李老师', publisherAccount: '671528' },
    ],
  },
  'senior-physics': {
    status: 'pending',
    currentVersion: 'v2.0',
    lastPublishTime: '2024-01-20 10:00',
    lastPublisher: '李四',
    pendingChanges: 3,
    changedNodes: [],
    publishHistory: [
      { version: 'v2.0', description: '优化了力学模块的知识点关联关系', publishTime: '2024-01-20 10:00', publisher: '李四', publisherAccount: '234891' },
      { version: 'v1.9', description: '新增电磁学章节知识点', publishTime: '2024-01-18 09:00', publisher: '李四', publisherAccount: '234891' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-10 14:00', publisher: '王五', publisherAccount: '456723' },
    ],
  },
  'senior-chemistry': {
    status: 'published',
    currentVersion: 'v1.1',
    lastPublishTime: '2024-01-12 16:00',
    lastPublisher: '张三',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.1', description: '新增有机化学基础知识', publishTime: '2024-01-12 16:00', publisher: '张三', publisherAccount: '582134' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-05 10:00', publisher: '张三', publisherAccount: '582134' },
    ],
  },
  'senior-biology': {
    status: 'published',
    currentVersion: 'v1.2',
    lastPublishTime: '2024-01-19 14:00',
    lastPublisher: '王老师',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.2', description: '完善遗传学知识点体系', publishTime: '2024-01-19 14:00', publisher: '王老师', publisherAccount: '892345' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-08 09:00', publisher: '王老师', publisherAccount: '892345' },
    ],
  },
  // 初中
  'junior-math': {
    status: 'published',
    currentVersion: 'v1.2',
    lastPublishTime: '2024-01-18 11:00',
    lastPublisher: '王五',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.2', description: '优化了代数模块结构', publishTime: '2024-01-18 11:00', publisher: '王五', publisherAccount: '456723' },
      { version: 'v1.1', description: '新增几何证明章节', publishTime: '2024-01-10 09:00', publisher: '王五', publisherAccount: '456723' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-03 14:00', publisher: '李四', publisherAccount: '234891' },
    ],
  },
  'junior-english': {
    status: 'pending',
    currentVersion: 'v1.3',
    lastPublishTime: '2024-01-21 10:00',
    lastPublisher: '赵老师',
    pendingChanges: 3,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.3', description: '优化语法知识点分类', publishTime: '2024-01-21 10:00', publisher: '赵老师', publisherAccount: '345678' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-06 11:00', publisher: '赵老师', publisherAccount: '345678' },
    ],
  },
  'junior-physics': {
    status: 'published',
    currentVersion: 'v1.1',
    lastPublishTime: '2024-01-17 15:00',
    lastPublisher: '孙老师',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.1', description: '新增电学实验知识点', publishTime: '2024-01-17 15:00', publisher: '孙老师', publisherAccount: '789012' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-04 09:00', publisher: '孙老师', publisherAccount: '789012' },
    ],
  },
  'junior-chemistry': {
    status: 'published',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-10 11:00',
    lastPublisher: '周老师',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.0', description: '初始版本，完成初中化学知识树构建', publishTime: '2024-01-10 11:00', publisher: '周老师', publisherAccount: '567890' },
    ],
  },
  // 小学
  'primary-math': {
    status: 'published',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-08 09:00',
    lastPublisher: '赵六',
    pendingChanges: 0,
    changedNodes: [],
    publishHistory: [
      { version: 'v1.0', description: '初始版本，完成小学数学知识树构建', publishTime: '2024-01-08 09:00', publisher: '赵六', publisherAccount: '123456' },
    ],
  },
};

// 模拟知识点树数据
const mockKnowledgeTree: KnowledgeNode[] = [
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
        knowledgeCard: sampleKnowledgeCard(),
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
            // 前置知识：形成链式结构
            // 反比例函数 -> 二次函数的定义 -> 二次函数的图像
            // 同时还有一条链：一次函数 -> 二次函数 -> 二次函数的图像（通过 1-2 的前置关系）
            prerequisiteKnowledge: [
              { id: '1-0-1', name: '二次函数的定义', isModule: false, stepId: 'branch-1', stepOrder: 0 },
            ],
            // 延伸知识：两个分支汇聚到一个节点
            // 上下平移 ↘
            //              → 二次函数的最值
            // 左右平移 ↗
            extensionKnowledge: [
              { id: 'ext-9', name: '上下平移', stepId: 'ext-branch-1', stepOrder: 0 },
              { id: 'ext-10', name: '左右平移', stepId: 'ext-branch-2', stepOrder: 0 },
            ],
            // 汇聚节点
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
    ],
  },
];

// 可选知识点列表（用于知识点选择器）
const availableKnowledgePoints: KnowledgeRelation[] = [
  // 大模块（有子知识点的知识点）
  { id: 'm1', name: '代数式与整式运算', isModule: true },
  { id: 'm2', name: '函数', isModule: true },
  { id: 'm3', name: '几何', isModule: true },
  { id: 'm4', name: '三角函数', isModule: true },
  // 具体知识点
  { id: 'kp1', name: '函数的概念', isModule: false },
  { id: 'kp2', name: '函数的表达', isModule: false },
  { id: 'kp3', name: '函数的定义域', isModule: false },
  { id: 'kp4', name: '函数的值域', isModule: false },
  { id: 'kp5', name: '函数的图像', isModule: false },
  { id: 'kp6', name: '函数的单调性', isModule: false },
  { id: 'kp7', name: '函数的奇偶性', isModule: false },
  { id: 'kp8', name: '一次函数', isModule: false },
  { id: 'kp9', name: '二次函数', isModule: false },
  { id: 'kp10', name: '反函数', isModule: false },
  { id: 'kp11', name: '幂函数', isModule: false },
  { id: 'kp12', name: '对数函数', isModule: false },
  { id: 'kp13', name: '三角函数的概念', isModule: false },
  { id: 'kp14', name: '正弦函数', isModule: false },
  { id: 'kp15', name: '余弦函数', isModule: false },
  // 图形与几何 - 多边形相关知识点
  { id: '3-1-3-1', name: '多边形的相关定义', isModule: false },
  { id: '3-1-3-2', name: '多边形内角和定理', isModule: false },
  { id: '3-1-3-3', name: '多边形外角和定理', isModule: false },
  { id: '3-1-3-4', name: '正多边形的定义', isModule: false },
  { id: '3-1-3-5', name: '正多边形的性质', isModule: false },
  { id: '3-1-3-6', name: '正多边形与圆的关系', isModule: false },
  { id: '3-1-3-7', name: '中心角的计算', isModule: false },
  { id: '3-1-3-8', name: '边心距的定义', isModule: false },
  { id: '3-1-3-9', name: '正多边形的镶嵌应用', isModule: false },
  // 图形与几何 - 圆相关知识点
  { id: '3-2-1-1', name: '圆的定义', isModule: false },
  { id: '3-2-2-1', name: '圆内接正多边形', isModule: false },
];

// 可排序的知识点项组件
interface SortableItemProps {
  id: string;
  name: string;
  index: number;
  type: 'prerequisite' | 'extension';
  onRemove?: () => void;
  showDragHandle?: boolean;
}

function SortableItem({ id, name, index, type, onRemove, showDragHandle = true }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = type === 'prerequisite' ? 'bg-blue-50' : 'bg-orange-50';
  const borderColor = type === 'prerequisite' ? 'border-blue-200' : 'border-orange-200';
  const numberBgColor = type === 'prerequisite' ? 'bg-blue-500' : 'bg-orange-500';
  const tagBgColor = type === 'prerequisite' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600';
  const tagText = type === 'prerequisite' ? '前置' : '延伸';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 ${bgColor} border ${borderColor} rounded-lg p-3 ${isDragging ? 'shadow-lg' : 'hover:shadow-sm'} transition-all`}
    >
      {showDragHandle && (
        <div {...attributes} {...listeners} className="cursor-move touch-none">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div className={`w-6 h-6 ${numberBgColor} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {index + 1}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-900">{name}</span>
      <span className={`text-xs ${tagBgColor} px-2 py-0.5 rounded`}>{tagText}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// 拖拽位置类型
type DropPosition = 'top' | 'center' | 'bottom';

// 小知识点组件（带操作菜单）
interface KnowledgeItemProps {
  item: KnowledgeRelation;
  stepIndex: number;
  itemIndex: number;
  totalItems: number;
  totalSteps: number;
  selectorType: 'prerequisite' | 'extension';
  onRemove: () => void;
  onMergeUp: () => void;
  onMergeDown: () => void;
  onSplitUp: () => void;
  onSplitDown: () => void;
  onSplitNew: () => void;
}

function KnowledgeItem({ 
  item, 
  stepIndex, 
  itemIndex, 
  totalItems,
  totalSteps,
  selectorType, 
  onRemove,
  onMergeUp,
  onMergeDown,
  onSplitUp,
  onSplitDown,
  onSplitNew
}: KnowledgeItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  // 判断是否可以合并/拆分
  const canMergeUp = stepIndex > 0;
  const canMergeDown = stepIndex < totalSteps - 1;
  const canSplit = totalItems > 1; // 只有同层有多个知识点时才能拆分
  
  return (
    <div className="inline-flex items-center gap-1 group relative">
      {/* 知识点标签 */}
      <span className={`text-sm px-2 py-0.5 rounded ${
        item.isModule 
          ? 'font-semibold text-gray-900 bg-gray-100' 
          : 'text-gray-700 bg-white border border-gray-200'
      }`}>
        {item.name}
      </span>
      
      {/* 删除按钮 */}
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-500 transition-colors"
        title="移除知识点"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      {/* 更多操作按钮 */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-300 hover:text-gray-600 transition-colors"
          title="更多操作"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        
        {/* 操作菜单 */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {/* 合并操作 */}
              <div className="px-2 py-1 text-xs text-gray-400 border-b border-gray-100">
                <Merge className="w-3 h-3 inline mr-1" />
                合并操作
              </div>
              <button
                onClick={() => {
                  onMergeUp();
                  setShowMenu(false);
                }}
                disabled={!canMergeUp}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                  canMergeUp ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-3 h-3" />
                合并到上一层
              </button>
              <button
                onClick={() => {
                  onMergeDown();
                  setShowMenu(false);
                }}
                disabled={!canMergeDown}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                  canMergeDown ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ArrowDown className="w-3 h-3" />
                合并到下一层
              </button>
              
              {/* 拆分操作（仅同层有多个知识点时显示） */}
              {canSplit && (
                <>
                  <div className="px-2 py-1 text-xs text-gray-400 border-t border-b border-gray-100 mt-1">
                    <Split className="w-3 h-3 inline mr-1" />
                    拆分操作
                  </div>
                  <button
                    onClick={() => {
                      onSplitUp();
                      setShowMenu(false);
                    }}
                    disabled={!canMergeUp}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                      canMergeUp ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3" />
                    拆分为上一层
                  </button>
                  <button
                    onClick={() => {
                      onSplitDown();
                      setShowMenu(false);
                    }}
                    disabled={!canMergeDown}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                      canMergeDown ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3" />
                    拆分为下一层
                  </button>
                  <button
                    onClick={() => {
                      onSplitNew();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                  >
                    <Layers className="w-3 h-3" />
                    拆分为独立新层
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* 分隔符 */}
      {itemIndex < totalItems - 1 && (
        <span className="text-gray-300 mx-1">|</span>
      )}
    </div>
  );
}

// 详情页学习层组件（可拖拽排序）
interface DetailLayerProps {
  stepId: string;
  stepIndex: number;
  items: KnowledgeRelation[];
  totalSteps: number;
  type: 'prerequisite' | 'extension';
  isEditMode: boolean;
  onRemoveStep: () => void;
  onRemoveItem: (itemId: string) => void;
  onMergeItemUp: (itemId: string) => void;
  onMergeItemDown: (itemId: string) => void;
  onSplitItemUp: (itemId: string) => void;
  onSplitItemDown: (itemId: string) => void;
  onSplitItemNew: (itemId: string) => void;
  showConnector?: boolean;
}

function DetailLayer({
  stepId,
  stepIndex,
  items,
  totalSteps,
  type,
  isEditMode,
  onRemoveStep,
  onRemoveItem,
  onMergeItemUp,
  onMergeItemDown,
  onSplitItemUp,
  onSplitItemDown,
  onSplitItemNew,
  showConnector = true
}: DetailLayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stepId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const bgColor = type === 'prerequisite' ? 'bg-blue-500' : 'bg-orange-500';

  return (
    <div className="flex flex-col items-center w-full">
      {/* 层组容器 */}
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm w-full min-w-[400px] max-w-[600px] ${
          isDragging ? 'shadow-lg border-blue-300' : 'hover:border-gray-300'
        } transition-all`}
      >
        {/* 拖拽手柄 */}
        {isEditMode && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-move touch-none p-0.5 text-gray-300 hover:text-gray-500 flex-shrink-0"
            title="拖拽排序"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        
        {/* 序号 */}
        <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
          {stepIndex + 1}
        </div>
        
        {/* 知识点区域 */}
        <div className="flex-1 flex items-center gap-1.5 flex-wrap">
          {items.map((item) => (
            <KnowledgeItemWithMenu
              key={item.id}
              item={item}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              totalItems={items.length}
              type={type}
              isEditMode={isEditMode}
              onRemove={() => onRemoveItem(item.id)}
              onMergeUp={() => onMergeItemUp(item.id)}
              onMergeDown={() => onMergeItemDown(item.id)}
              onSplitUp={() => onSplitItemUp(item.id)}
              onSplitDown={() => onSplitItemDown(item.id)}
              onSplitNew={() => onSplitItemNew(item.id)}
            />
          ))}
        </div>
        
        {/* 删除整层按钮 */}
        {isEditMode && (
          <button
            onClick={onRemoveStep}
            className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
            title="删除此层"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* 连接线 */}
      {showConnector && (
        <div className="flex flex-col items-center">
          <div className={`w-0.5 h-3 ${type === 'prerequisite' ? 'bg-blue-200' : 'bg-orange-200'}`}></div>
          <div className={`w-2.5 h-2.5 ${type === 'prerequisite' ? 'text-blue-400' : 'text-orange-400'}`}>
            <ArrowDown className="w-2.5 h-2.5" />
          </div>
          <div className={`w-0.5 h-3 ${type === 'prerequisite' ? 'bg-blue-200' : 'bg-orange-200'}`}></div>
        </div>
      )}
    </div>
  );
}

// 详情页知识点组件（带操作菜单）
interface KnowledgeItemWithMenuProps {
  item: KnowledgeRelation;
  stepIndex: number;
  totalSteps: number;
  totalItems: number;
  type: 'prerequisite' | 'extension';
  isEditMode: boolean;
  onRemove: () => void;
  onMergeUp: () => void;
  onMergeDown: () => void;
  onSplitUp: () => void;
  onSplitDown: () => void;
  onSplitNew: () => void;
}

function KnowledgeItemWithMenu({
  item,
  stepIndex,
  totalSteps,
  totalItems,
  type,
  isEditMode,
  onRemove,
  onMergeUp,
  onMergeDown,
  onSplitUp,
  onSplitDown,
  onSplitNew
}: KnowledgeItemWithMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const canMergeUp = stepIndex > 0;
  const canMergeDown = stepIndex < totalSteps - 1;
  const canSplit = totalItems > 1;
  
  const itemBgClass = type === 'prerequisite' 
    ? 'bg-blue-50 border-blue-200' 
    : 'bg-orange-50 border-orange-200';
  const moduleBgClass = type === 'prerequisite'
    ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300'
    : 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300';

  return (
    <div className="inline-flex items-center group relative">
      {/* 知识点标签 */}
      <span className={`text-sm px-2 py-1 rounded ${
        item.isModule 
          ? `font-semibold text-gray-900 ${moduleBgClass}` 
          : `text-gray-700 border ${itemBgClass}`
      }`}>
        {item.name}
      </span>
      
      {/* 删除按钮 */}
      {isEditMode && (
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-500 transition-colors ml-0.5"
          title="移除知识点"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      
      {/* 更多操作按钮 */}
      {isEditMode && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-300 hover:text-gray-600 transition-colors ml-0.5"
            title="更多操作"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          
          {/* 操作菜单 */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* 合并操作 */}
                <div className="px-2 py-0.5 text-xs text-gray-400 border-b border-gray-100">
                  <Merge className="w-3 h-3 inline mr-1" />
                  合并操作
                </div>
                <button
                  onClick={() => { onMergeUp(); setShowMenu(false); }}
                  disabled={!canMergeUp}
                  className={`w-full text-left px-2 py-1 text-xs flex items-center gap-1.5 ${
                    canMergeUp ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-3 h-3" />
                  合并到上一层
                </button>
                <button
                  onClick={() => { onMergeDown(); setShowMenu(false); }}
                  disabled={!canMergeDown}
                  className={`w-full text-left px-2 py-1 text-xs flex items-center gap-1.5 ${
                    canMergeDown ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ArrowDown className="w-3 h-3" />
                  合并到下一层
                </button>
                
                {/* 拆分操作 */}
                {canSplit && (
                  <>
                    <div className="px-2 py-0.5 text-xs text-gray-400 border-t border-gray-100 mt-0.5">
                      <Split className="w-3 h-3 inline mr-1" />
                      拆分操作
                    </div>
                    <button
                      onClick={() => { onSplitUp(); setShowMenu(false); }}
                      disabled={!canMergeUp}
                      className={`w-full text-left px-2 py-1 text-xs flex items-center gap-1.5 ${
                        canMergeUp ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3" />
                      拆分为上一层
                    </button>
                    <button
                      onClick={() => { onSplitDown(); setShowMenu(false); }}
                      disabled={!canMergeDown}
                      className={`w-full text-left px-2 py-1 text-xs flex items-center gap-1.5 ${
                        canMergeDown ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <ArrowDown className="w-3 h-3" />
                      拆分为下一层
                    </button>
                    <button
                      onClick={() => { onSplitNew(); setShowMenu(false); }}
                      className="w-full text-left px-2 py-1 text-xs flex items-center gap-1.5 hover:bg-gray-50 text-gray-700"
                    >
                      <Layers className="w-3 h-3" />
                      拆分为独立新层
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 学习层组件（可拖拽排序）
interface DraggableStepItemProps {
  step: LearningStep;
  stepIndex: number;
  totalSteps: number;
  selectorType: 'prerequisite' | 'extension';
  onRemove: () => void;
  onRemoveItem: (itemId: string) => void;
  onMergeItemUp: (itemId: string) => void;
  onMergeItemDown: (itemId: string) => void;
  onSplitItemUp: (itemId: string) => void;
  onSplitItemDown: (itemId: string) => void;
  onSplitItemNew: (itemId: string) => void;
}

function DraggableStepItem({ 
  step, 
  stepIndex, 
  totalSteps,
  selectorType, 
  onRemove, 
  onRemoveItem,
  onMergeItemUp,
  onMergeItemDown,
  onSplitItemUp,
  onSplitItemDown,
  onSplitItemNew
}: DraggableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white ${
        isDragging ? 'shadow-lg' : 'hover:border-gray-300'
      } transition-all`}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move touch-none p-1 text-gray-400 hover:text-gray-600"
        title="拖拽排序"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* 序号 */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
        selectorType === 'prerequisite' ? 'bg-blue-500' : 'bg-orange-500'
      }`}>
        {stepIndex + 1}
      </div>
      
      {/* 知识点卡片区域 */}
      <div
        className={`flex-1 flex items-center gap-1 flex-wrap rounded-lg px-3 py-2 ${
          step.items.some(i => i.isModule)
            ? selectorType === 'prerequisite'
              ? 'bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-200'
              : 'bg-gradient-to-r from-orange-50 to-orange-25 border border-orange-200'
            : selectorType === 'prerequisite'
              ? 'bg-blue-25 border border-blue-100'
              : 'bg-orange-25 border border-orange-100'
        }`}
      >
        {/* 大模块图标 */}
        {step.items.some(i => i.isModule) && (
          <FolderTree className={`w-4 h-4 flex-shrink-0 ${
            selectorType === 'prerequisite' ? 'text-blue-600' : 'text-orange-600'
          }`} />
        )}
        
        {/* 每个知识点独立展示 */}
        {step.items.map((item, idx) => (
          <KnowledgeItem
            key={item.id}
            item={item}
            stepIndex={stepIndex}
            itemIndex={idx}
            totalItems={step.items.length}
            totalSteps={totalSteps}
            selectorType={selectorType}
            onRemove={() => onRemoveItem(item.id)}
            onMergeUp={() => onMergeItemUp(item.id)}
            onMergeDown={() => onMergeItemDown(item.id)}
            onSplitUp={() => onSplitItemUp(item.id)}
            onSplitDown={() => onSplitItemDown(item.id)}
            onSplitNew={() => onSplitItemNew(item.id)}
          />
        ))}
      </div>
      
      {/* 整层删除按钮 */}
      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-red-500 transition-colors p-1"
        title="删除此层"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// 可拖拽的树节点包装组件
interface SortableTreeNodeProps {
  id: string;
  children: React.ReactNode;
  isEditingTree: boolean;
}

function SortableTreeNode({ id, children, isEditingTree }: SortableTreeNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'shadow-lg rounded-lg' : ''}`}>
      {isEditingTree && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 cursor-move touch-none p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
        >
          <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </div>
      )}
      {children}
    </div>
  );
}

// 状态条组件 - 已发布/待发布状态
function StatusBar({
  pageState,
  onPublish,
  onShowHistory,
  onCancelScheduled,
  isTeacher = false,
}: {
  pageState: KnowledgeTreePageState;
  onPublish: () => void;
  onShowHistory: () => void;
  onCancelScheduled?: () => void;
  isTeacher?: boolean;
}) {
  // 已发布状态且无定时发布：不在顶部显示状态条
  if (pageState.status === 'published' && !pageState.scheduledPublish) {
    return null;
  }

  // 定时发布状态（无新变更）：显示蓝色提醒条
  if (pageState.scheduledPublish && pageState.pendingChanges === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              <span className="font-medium">{pageState.scheduledPublish.version}</span> 版本将于您设定的时间（
              <span className="font-medium">{pageState.scheduledPublish.scheduledDate} {pageState.scheduledPublish.scheduledTime}</span>）自动发布，发布后更新的内容将正式生效
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 教研员身份下隐藏取消定时按钮 */}
            {!isTeacher && onCancelScheduled && (
              <button
                onClick={onCancelScheduled}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                取消定时
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 待发布状态（包括有定时信息但有新变更的情况）：显示橙色提醒条
  return (
    <div className="space-y-1">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              有 <span className="font-medium">{pageState.pendingChanges}</span> 项变更待发布，发布后才能生效
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 教研员身份下隐藏发布按钮 */}
            {!isTeacher && (
              <button
                onClick={onPublish}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                发布
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 text-xs text-gray-500 pl-1">
        <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        <span>信息发布将影响线上用户的实际使用，发布时，建议避开用户高频使用的时间段</span>
      </div>
    </div>
  );
}

// 视频资源类型
interface VideoResource {
  id: string;
  name: string;
  duration: string;
  size: string;
  uploadTime: string;
  thumbnail?: string;
}

// 模拟视频资源数据
const mockVideoResources: VideoResource[] = [
  { id: 'v1', name: '函数基础精讲.mp4', duration: '12:35', size: '256MB', uploadTime: '2024-01-15' },
  { id: 'v2', name: '一元二次方程求解.mp4', duration: '18:20', size: '320MB', uploadTime: '2024-01-14' },
  { id: 'v3', name: '几何证明入门.mp4', duration: '15:45', size: '285MB', uploadTime: '2024-01-13' },
  { id: 'v4', name: '三角函数应用.mp4', duration: '20:10', size: '410MB', uploadTime: '2024-01-12' },
  { id: 'v5', name: '概率统计基础.mp4', duration: '14:30', size: '268MB', uploadTime: '2024-01-11' },
  { id: 'v6', name: '数列与递推.mp4', duration: '16:55', size: '295MB', uploadTime: '2024-01-10' },
  { id: 'v7', name: '立体几何讲解.mp4', duration: '22:40', size: '380MB', uploadTime: '2024-01-09' },
  { id: 'v8', name: '解析几何基础.mp4', duration: '19:15', size: '345MB', uploadTime: '2024-01-08' },
];

// 视频资源选择弹窗组件（支持多选）
function VideoSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedVideoIds = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videos: VideoResource[]) => void;
  selectedVideoIds?: string[];
}) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempSelectedVideos, setTempSelectedVideos] = useState<VideoResource[]>([]);
  const [previewVideo, setPreviewVideo] = useState<VideoResource | null>(null);

  // 过滤视频列表（排除已选中的）
  const filteredVideos = mockVideoResources.filter(video =>
    video.name.toLowerCase().includes(searchKeyword.toLowerCase()) &&
    !tempSelectedVideos.find(v => v.id === video.id)
  );
  
  // 添加视频到已选列表
  const addVideo = (video: VideoResource) => {
    setTempSelectedVideos(prev => [...prev, video]);
  };
  
  // 从已选列表移除视频
  const removeVideo = (videoId: string) => {
    setTempSelectedVideos(prev => prev.filter(v => v.id !== videoId));
  };
  
  // 确认选择
  const handleConfirm = () => {
    onSelect(tempSelectedVideos);
    setTempSelectedVideos([]);
    setSearchKeyword('');
    onClose();
  };
  
  // 取消
  const handleCancel = () => {
    setTempSelectedVideos([]);
    setSearchKeyword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] h-[70vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-900">从资源库选择</h3>
            <PrdTooltip data={prd204.resourceLibModal} className="ml-1" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        {/* 左右布局 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：可选视频 */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 flex items-center">可选视频<PrdTooltip data={prd204.resourceLibAvailable} className="ml-1" /></div>
            </div>
            {/* 搜索框 */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索视频名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
            {/* 视频列表 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{video.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>{video.duration}</span>
                          <span>{video.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPreviewVideo(video)}
                        className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="预览"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addVideo(video)}
                        className="px-2.5 py-1 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        + 添加
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {searchKeyword ? '未找到匹配的视频' : '所有视频已添加'}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：已选视频 */}
          <div className="w-1/2 flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-purple-50">
              <div className="text-sm font-medium text-purple-700 flex items-center">
                已选视频
                <PrdTooltip data={prd204.resourceLibSelected} className="ml-1" />
                <span className="ml-2 text-xs text-purple-500 font-normal">
                  ({tempSelectedVideos.length}个)
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {tempSelectedVideos.length > 0 ? (
                <div className="space-y-2">
                  {tempSelectedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{video.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{video.duration}</span>
                            <span>{video.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewVideo(video)}
                          className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="预览"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeVideo(video.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="移除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Video className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm">暂未选择视频</p>
                  <p className="text-xs mt-1">请从左侧列表中选择视频</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={tempSelectedVideos.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确定
          </button>
        </div>
      </div>

      {/* 视频预览弹窗 */}
      {previewVideo && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setPreviewVideo(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">{previewVideo.name}</h3>
                <PrdTooltip data={prd204.resourceLibPreview} className="ml-1" />
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* 视频播放器 */}
            <div className="bg-black aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{previewVideo.name}</p>
                <p className="text-sm text-gray-400 mt-2">时长：{previewVideo.duration}</p>
              </div>
            </div>
            
            {/* 视频信息 */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>时长：{previewVideo.duration}</span>
                  <span>大小：{previewVideo.size}</span>
                  <span>上传时间：{previewVideo.uploadTime}</span>
                </div>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 发布状态类型
type PublishStatus = 'idle' | 'publishing' | 'mapping' | 'success' | 'failed';

// 发布弹窗组件
function PublishModal({
  isOpen,
  onClose,
  onPublish,
  currentVersion,
  pendingChanges,
  scheduledPublish,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (version: string, description: string, scheduledInfo?: { scheduledDate: string; scheduledTime: string }) => void;
  currentVersion: string;
  pendingChanges: ChangeRecord[];
  scheduledPublish?: {
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
    publisherAccount?: string;
  };
}) {
  const [description, setDescription] = useState('');
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('02:00');
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishError, setPublishError] = useState<string>('');

  // 当弹窗打开且有定时发布信息时，回显数据
  useEffect(() => {
    if (isOpen && scheduledPublish) {
      setDescription(scheduledPublish.description);
      setScheduledDate(scheduledPublish.scheduledDate);
      setScheduledTime(scheduledPublish.scheduledTime);
      setPublishType('scheduled');
    }
  }, [isOpen, scheduledPublish]);

  // 弹窗关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setPublishStatus('idle');
      setPublishError('');
    }
  }, [isOpen]);

  // 调试功能：连续点击版本号3次触发失败效果
  const [versionClickCount, setVersionClickCount] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [debugFailCount, setDebugFailCount] = useState(0); // 调试失败计数器

  // 生成新版本号：如果有定时发布信息，使用其版本号
  // 规则：每次更新次版本号+1，次版本号为9时再更新则次版本归零，主版本+1
  const generateNewVersion = (current: string) => {
    const parts = current.replace('v', '').split('.');
    const major = parseInt(parts[0]) || 1;
    const minor = parseInt(parts[1]) || 0;
    
    if (minor >= 9) {
      return `v${major + 1}.0`;
    }
    return `v${major}.${minor + 1}`;
  };

  const newVersion = scheduledPublish?.version || generateNewVersion(currentVersion);

  // 模拟发布流程
  const simulatePublish = async () => {
    if (!description.trim()) return;
    
    setPublishStatus('publishing');
    setPublishError('');

    try {
      // 模拟发布接口调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 调试模式：第1次重试时触发发布失败
      if (debugMode && debugFailCount === 0) {
        setDebugFailCount(1); // 下次失败时进入映射阶段
        throw new Error('发布接口调用失败，服务暂不可用');
      }

      // 发布成功，开始映射
      setPublishStatus('mapping');
      
      // 模拟映射接口调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 调试模式：第2次重试时触发映射失败
      if (debugMode && debugFailCount === 1) {
        setDebugFailCount(2); // 下次将成功
        throw new Error('菁优网知识点映射失败，请稍后重试');
      }
      
      // 映射成功
      setPublishStatus('success');
      
      // 重置调试计数器
      setDebugFailCount(0);
      
      // 3秒后自动关闭弹窗
      setTimeout(() => {
        onPublish(newVersion, description, publishType === 'scheduled' ? { scheduledDate, scheduledTime } : undefined);
        setDescription('');
        setPublishType('immediate');
        setScheduledDate('');
        setScheduledTime('02:00');
        setPublishStatus('idle');
        onClose();
      }, 2000);

    } catch (error) {
      setPublishStatus('failed');
      setPublishError(error instanceof Error ? error.message : '发布失败，请稍后重试');
    }
  };

  const handlePublish = () => {
    if (!description.trim()) {
      setPublishError('请填写更新说明');
      return;
    }
    if (publishType === 'scheduled' && !scheduledDate) {
      setPublishError('请选择定时发布的日期');
      return;
    }
    // 检查定时发布时间是否早于当前时间
    if (publishType === 'scheduled' && scheduledDate) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        setPublishError('定时发布时间必须晚于当前时间');
        return;
      }
    }
    simulatePublish();
  };

  // 关闭弹窗
  const handleClose = () => {
    if (publishStatus === 'publishing' || publishStatus === 'mapping') {
      return; // 发布中不允许关闭
    }
    setDescription('');
    setPublishType('immediate');
    setScheduledDate('');
    setScheduledTime('02:00');
    setPublishStatus('idle');
    setPublishError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">发布确认</h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* 发布提示 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium">发布注意事项</p>
                <p className="text-amber-700 mt-1">发布将影响线上用户的实际使用，建议避开用户高频使用的时间段。</p>
                <p className="text-gray-500 mt-1 text-xs">建议发布时段：凌晨 00:00 - 04:00</p>
              </div>
            </div>
          </div>

          {/* 发布状态显示区域 */}
          {publishStatus !== 'idle' && (
            <div className="space-y-3">
              {/* 发布中状态 */}
              {publishStatus === 'publishing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-800 font-medium">发布中...</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">系统正在执行发布，请稍候</p>
                </div>
              )}

              {/* 映射中状态 */}
              {publishStatus === 'mapping' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-purple-800 font-medium">映射中...</span>
                  </div>
                  <p className="text-purple-700 text-sm mt-1">发布成功，正在执行菁优网知识点映射</p>
                </div>
              )}

              {/* 发布成功状态 */}
              {publishStatus === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">发布成功</span>
                  </div>
                  <p className="text-emerald-700 text-sm mt-1">发布和菁优网知识点映射均已完成</p>
                </div>
              )}

              {/* 发布失败状态 */}
              {publishStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">发布失败</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{publishError}</p>
                  <p className="text-red-600 text-xs mt-1">请检查网络后重试，或联系管理员</p>
                </div>
              )}
            </div>
          )}

          {/* 错误提示（发布前） */}
          {publishError && publishStatus === 'idle' && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 font-medium">提示</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{publishError}</p>
            </div>
          )}

          {/* 版本号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              版本号
              {debugMode && <span className="ml-2 text-xs text-red-500">(调试模式已开启)</span>}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (publishStatus !== 'idle') return;
                  const newCount = versionClickCount + 1;
                  setVersionClickCount(newCount);
                  if (newCount >= 3) {
                    setDebugMode(true);
                    setVersionClickCount(0);
                  } else {
                    // 3秒后重置计数
                    setTimeout(() => setVersionClickCount(0), 3000);
                  }
                }}
                className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                  debugMode 
                    ? 'bg-red-50 border-red-300 text-red-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                {newVersion}
                {!debugMode && (
                  <span className="ml-1 text-xs text-gray-400">（连续点击3次开启调试）</span>
                )}
              </button>
              <span className="text-xs text-gray-400">系统生成</span>
              {debugMode && (
                <button
                  onClick={() => {
                    setDebugMode(false);
                    setVersionClickCount(0);
                    setDebugFailCount(0);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  关闭调试
                </button>
              )}
            </div>
          </div>

          {/* 更新说明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              更新说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入本次更新的说明..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
            />
          </div>

          {/* 发布时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">发布时间</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishType"
                  checked={publishType === 'immediate'}
                  onChange={() => setPublishType('immediate')}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-sm text-gray-700">立即发布</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishType"
                  checked={publishType === 'scheduled'}
                  onChange={() => setPublishType('scheduled')}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-sm text-gray-700">定时发布</span>
              </label>
              {publishType === 'scheduled' && (
                <div className="ml-6 flex items-center gap-3">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {/* 成功状态下显示关闭按钮 */}
          {publishStatus === 'success' ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              关闭
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={publishStatus === 'publishing' || publishStatus === 'mapping'}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                // 失败状态可以重试，所以不检查 publishStatus
                disabled={!description.trim() || (publishType === 'scheduled' && !scheduledDate) || publishStatus === 'publishing' || publishStatus === 'mapping'}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {publishStatus === 'publishing' && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {publishStatus === 'mapping' && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {publishStatus === 'failed' ? '重试' : 
                  publishStatus === 'publishing' ? '发布中...' : 
                  publishStatus === 'mapping' ? '映射中...' : 
                  (publishType === 'immediate' ? '确认发布' : '确认定时发布')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 历史版本弹窗组件
function HistoryModal({
  isOpen,
  onClose,
  history,
  currentVersion,
  // 新增：当前知识树属性和筛选选项
  currentPhase,
  currentSubject,
  filterConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: PublishRecord[];
  currentVersion: string;
  // 新增参数
  currentPhase?: PhaseType;
  currentSubject?: Subject | null;
  filterConfig?: {
    phaseOptions: { id: string; label: string }[];
    subjectOptions: { id: string; label: string }[];
  };
}) {
  if (!isOpen) return null;

  // 获取当前筛选值标签
  const getLabelById = (options: { id: string; label: string }[], id: string) => {
    return options.find(opt => opt.id === id)?.label || id;
  };

  // 获取当前学段标签
  const getCurrentPhaseLabel = () => {
    if (!currentPhase || !filterConfig) return '';
    return getLabelById(filterConfig.phaseOptions, currentPhase);
  };

  // 获取当前学科标签
  const getCurrentSubjectLabel = () => {
    if (!currentSubject || !filterConfig) return '';
    return getLabelById(filterConfig.subjectOptions, currentSubject.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">发布历史</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 筛选栏 - 禁用状态 */}
        {filterConfig && currentPhase && (
          <div className="px-5 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {/* 学段筛选 */}
              <select
                value={currentPhase}
                disabled
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value={currentPhase}>{getCurrentPhaseLabel()}</option>
              </select>
              
              {/* 学科筛选 */}
              {currentSubject && (
                <select
                  value={currentSubject.id}
                  disabled
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                >
                  <option value={currentSubject.id}>{getCurrentSubjectLabel()}</option>
                </select>
              )}
            </div>
          </div>
        )}

        <div className="p-5 max-h-[400px] overflow-y-auto">
          <div className="space-y-3">
            {history.map((record, index) => (
              <div
                key={record.version}
                className={`p-4 rounded-lg border ${
                  record.version === currentVersion
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${record.version === currentVersion ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {record.version}
                    </span>
                    {record.version === currentVersion && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">当前版本</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{record.publishTime}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{record.description}</p>
                <p className="text-xs text-gray-400">发布人：{record.publisher}（账号：{record.publisherAccount || '未知'}）</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// 无法删除提示弹窗组件（知识树下存在知识点时显示）
function CannotDeleteModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
        {/* 内容 */}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 flex items-start gap-1">
              <p className="text-sm text-gray-700">
                当前知识树下存在知识点，请先删除所有知识点后再删除知识树。
              </p>
              <PrdTooltip data={prd201.cannotDeleteDialog} className="shrink-0 mt-0.5" />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}

// 删除确认弹窗组件（知识树无知识点时显示）
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
        {/* 内容 */}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 flex items-start gap-1">
              <p className="text-sm text-gray-700">
                确定要删除当前知识树吗？删除后不可恢复。
              </p>
              <PrdTooltip data={prd201.deleteConfirmDialog} className="shrink-0 mt-0.5" />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

// 组件 Props 接口
interface KnowledgeTreeProps {
  onDetailViewChange?: (
    isDetailView: boolean,
    extra?: { treeTitle?: string }
  ) => void;
}

export default function KnowledgeTree({ onDetailViewChange }: KnowledgeTreeProps) {
  const { isTeacher } = useRole();
  
  // 学科名称状态（默认选中初中）
  const [selectedSubjectName, setSelectedSubjectName] = useState<SubjectName>('初中');
  
  // 原有状态
  const [selectedPhase, setSelectedPhase] = useState<PhaseType>('junior');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [tempEditNode, setTempEditNode] = useState<KnowledgeNode | null>(null); // 临时编辑的节点（用于编辑其他知识点的前置知识点）
  const [externalKnowledgeNodes, setExternalKnowledgeNodes] = useState<Map<string, KnowledgeNode>>(new Map()); // 不在知识树中的关联知识点
  const [editData, setEditData] = useState<Partial<KnowledgeNode>>({});
  const knowledgeCardDraftRef = useRef<KnowledgeCard | undefined>(undefined);
  const handleKnowledgeCardChange = useCallback((knowledgeCard: KnowledgeCard) => {
    // 只写入 ref，避免知识卡片每次输入/点击都重渲染整页导致滚动乱跳
    knowledgeCardDraftRef.current = knowledgeCard;
  }, []);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const [showStrategyPreview, setShowStrategyPreview] = useState(false);
  const [previewStrategy, setPreviewStrategy] = useState<string | null>(null);
  const [showStrategySearch, setShowStrategySearch] = useState(false);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const [selectorType, setSelectorType] = useState<'prerequisite' | 'extension'>('prerequisite');
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgeNode[]>(mockKnowledgeTree);
  const [graphUpdateKey, setGraphUpdateKey] = useState(0); // 用于强制刷新网状图
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [addSubjectSelected, setAddSubjectSelected] = useState<string | null>(null);
  const [addSubjectPopoverOpen, setAddSubjectPopoverOpen] = useState(false);
  // 批量导入状态
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importValidationStatus, setImportValidationStatus] = useState<'idle' | 'validating' | 'file-error' | 'partial' | 'all-pass' | 'all-row-fail'>('idle');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importValidationSummary, setImportValidationSummary] = useState<{
    fileName: string;
    uploadTime: string;
    totalRows: number;
    passRows: number;
    failRows: number;
  } | null>(null);
  const [importFileErrors, setImportFileErrors] = useState<Array<{
    type: 'file-format' | 'template-structure' | 'header-mismatch' | 'template-type' | 'empty-content' | 'parse-failed';
    title: string;
    description: string;
    suggestion: string;
  }>>([]);
  const [importRowResults, setImportRowResults] = useState<Array<{
    rowIndex: number;
    excelRow: number;
    knowledgePath: string;
    result: 'pass' | 'fail';
    errorType?: 'path-invalid' | 'node-not-found' | 'path-modified' | 'path-level-broken' | 'duplicate-node' | 'exam-freq-invalid' | 'exam-freq-not-leaf' | 'academic-req-invalid' | 'academic-req-not-leaf' | 'prerequisite-not-found' | 'prerequisite-self' | 'prerequisite-duplicate' | 'strategy-not-found' | 'strategy-format' | 'other';
    reason?: string;
    suggestion?: string;
  }>>([]);
  const [showStrategyDetail, setShowStrategyDetail] = useState(false);
  
  // 知识树编辑模式状态
  const [isEditingTree, setIsEditingTree] = useState(false);
  const [showEditTip, setShowEditTip] = useState(true); // 编辑知识树提示条（默认显示）
  const [initialKnowledgeTreeSnapshot, setInitialKnowledgeTreeSnapshot] = useState<KnowledgeNode[]>([]); // 初始快照
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // 是否有未保存的修改
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false); // 取消编辑确认弹窗
  
  // 知识点详情编辑模式状态
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  
  // 监听取消编辑确认弹窗状态变化
  useEffect(() => {
    console.log('[弹窗状态变化] showCancelEditConfirm:', showCancelEditConfirm);
  }, [showCancelEditConfirm]);
  
  // 内联编辑状态
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeValue, setEditingNodeValue] = useState('');
  
  // 添加子知识点状态
  const [addingChildParentId, setAddingChildParentId] = useState<string | null>(null);
  const [addingChildValue, setAddingChildValue] = useState('');
  
  // 聚合历史版本弹窗状态
  const [showAggregateHistory, setShowAggregateHistory] = useState(false);
  
  // 监听详情页状态变化，通知父组件
  useEffect(() => {
    if (onDetailViewChange) {
      onDetailViewChange(
        !!selectedSubject,
        selectedSubject
          ? { treeTitle: `管理${selectedSubject.name}知识树` }
          : undefined
      );
    }
  }, [selectedSubject, onDetailViewChange]);
  
  // 进入详情页时自动进入编辑态
  useEffect(() => {
    if (selectedSubject && knowledgeTree.length > 0) {
      // 自动进入编辑态
      setIsEditingTree(true);
      // 保存初始快照
      const snapshot = deepCloneKnowledgeTree(knowledgeTree);
      setInitialKnowledgeTreeSnapshot(snapshot);
      setHasUnsavedChanges(false);
      console.log('[进入详情页] 自动进入编辑态，保存初始快照');
    }
  }, [selectedSubject]); // 只在 selectedSubject 变化时触发
  
  // 同步学段名称和学段状态
  useEffect(() => {
    // 根据学段名称同步更新 selectedPhase
    const phaseMap: Record<string, PhaseType> = {
      '高中': 'senior',
      '初中': 'junior',
      '小学': 'primary',
    };
    const newPhase = phaseMap[selectedSubjectName];
    if (newPhase && newPhase !== selectedPhase) {
      setSelectedPhase(newPhase);
    }
  }, [selectedSubjectName]);
  
  // 详情页 Tab 切换状态
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>('info');
  
  // 视频上传状态
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  
  // 视频预览状态（非编辑态下多视频切换）
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // 视频播放弹窗状态
  const [playingVideo, setPlayingVideo] = useState<VideoContent | null>(null);

  // 编辑视频名称状态
  const [editingVideoNameId, setEditingVideoNameId] = useState<string | null>(null);
  const [editingVideoNameValue, setEditingVideoNameValue] = useState('');
  const [editingVideoNameOriginal, setEditingVideoNameOriginal] = useState('');
  const [videoNameEmptyError, setVideoNameEmptyError] = useState(false);


  
  // 文字编辑器光标位置 - 使用 ref 避免重渲染
  const textareaCursorPosRef = React.useRef<number>(0);
  
  // 文字编辑器 ref
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // 富文本编辑器内容（包含文本和图片）
  const [editorContent, setEditorContent] = useState<Array<{type: 'text' | 'image', content: string, imageUrl?: string, alt?: string}>>([]);
  
  // 删除知识树弹窗状态（非编辑态下删除整个知识树）
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false); // 无法删除提示弹窗
  
  // 删除知识点弹窗状态（编辑态下删除单个知识点）
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  
  // 添加子节点确认弹窗状态
  const [showAddChildConfirm, setShowAddChildConfirm] = useState(false);
  const [pendingAddChildNodeId, setPendingAddChildNodeId] = useState<string | null>(null);
  
  // 拖拽状态
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  
  // 知识点选择器相关状态
  const [selectedSteps, setSelectedSteps] = useState<LearningStep[]>([]);
  const [knowledgeSearchKeyword, setKnowledgeSearchKeyword] = useState('');
  const [dragOverPosition, setDragOverPosition] = useState<{ stepId: string; position: DropPosition } | null>(null);
  
  // 鼠标位置跟踪（用于拖拽位置检测）
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  // 使用 ref 保存拖拽位置，避免状态更新时机问题
  const dragOverPositionRef = useRef<{ stepId: string; position: DropPosition } | null>(null);
  
  // 监听鼠标移动
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // 发布相关状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showVideoSelectModal, setShowVideoSelectModal] = useState(false);
  const [pageState, setPageState] = useState<KnowledgeTreePageState | null>(null);
  const [pendingChanges, setPendingChanges] = useState<ChangeRecord[]>([]);

  // 深度拷贝知识树
  const deepCloneKnowledgeTree = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
    return JSON.parse(JSON.stringify(nodes));
  };

  // 检测知识树是否有修改
  const checkKnowledgeTreeChanges = (
    currentTree: KnowledgeNode[],
    initialTree: KnowledgeNode[]
  ): boolean => {
    const currentStr = JSON.stringify(currentTree);
    const initialStr = JSON.stringify(initialTree);
    console.log('[检测修改] 当前树:', currentStr.substring(0, 100));
    console.log('[检测修改] 初始树:', initialStr.substring(0, 100));
    console.log('[检测修改] 是否有修改:', currentStr !== initialStr);
    return currentStr !== initialStr;
  };

  // 监听知识树变化，更新修改状态
  useEffect(() => {
    if (isEditingTree && initialKnowledgeTreeSnapshot.length > 0) {
      const hasChanges = checkKnowledgeTreeChanges(knowledgeTree, initialKnowledgeTreeSnapshot);
      console.log('[监听变化] hasUnsavedChanges更新为:', hasChanges);
      setHasUnsavedChanges(hasChanges);
    }
  }, [knowledgeTree, isEditingTree, initialKnowledgeTreeSnapshot]);

  // 加载学科发布状态
  useEffect(() => {
    if (selectedSubject) {
      const stateKey = `${selectedPhase}-${selectedSubject.id}`;
      const state = mockKnowledgeTreePublishState[stateKey];
      if (state) {
        setPageState(state);
        // 如果有待发布变更，生成变更记录
        if (state.pendingChanges > 0) {
          const changes: ChangeRecord[] = [
            { type: 'modify', target: '函数基础', detail: '修改出题策略配置', dimension: '知识点信息' },
            { type: 'add', target: '一元二次方程', detail: '新增知识点', dimension: '知识点结构' },
            { type: 'modify', target: '几何证明', detail: '修改关联知识点', dimension: '知识点结构' },
          ];
          setPendingChanges(changes.slice(0, state.pendingChanges));
        } else {
          setPendingChanges([]);
        }
      } else {
        // 默认状态
        setPageState({
          status: 'published',
          currentVersion: 'v1.0',
          lastPublishTime: '2024-01-01 10:00',
          lastPublisher: '管理员',
          pendingChanges: 0,
          changedNodes: [],
          publishHistory: [
            { version: 'v1.0', description: '初始版本', publishTime: '2024-01-01 10:00', publisher: '管理员', publisherAccount: '000001' },
          ],
        });
        setPendingChanges([]);
      }
    }
  }, [selectedSubject, selectedPhase]);

  // 处理发布
  const handlePublish = (version: string, description: string, scheduledInfo?: { scheduledDate: string; scheduledTime: string }) => {
    if (!pageState) return;

    // 生成发布人账号（6位随机数字）
    const publisherAccount = Math.floor(100000 + Math.random() * 900000).toString();

    if (scheduledInfo) {
      // 定时发布：保存定时发布信息，不立即发布
      setPageState({
        ...pageState,
        status: 'published', // 保持已发布状态
        pendingChanges: 0, // 清空待发布变更数量
        scheduledPublish: {
          version,
          scheduledDate: scheduledInfo.scheduledDate,
          scheduledTime: scheduledInfo.scheduledTime,
          description,
          publisherAccount,
        },
      });
      // 清空待发布变更
      setPendingChanges([]);
    } else {
      // 立即发布
      // 添加新的发布记录
      const newRecord: PublishRecord = {
        version,
        description,
        publishTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\//g, '-'),
        publisher: '当前用户',
        publisherAccount,
        changes: pendingChanges,
      };

      // 更新页面状态
      setPageState({
        status: 'published',
        currentVersion: version,
        lastPublishTime: newRecord.publishTime,
        lastPublisher: newRecord.publisher,
        pendingChanges: 0,
        changedNodes: [],
        publishHistory: [newRecord, ...pageState.publishHistory],
      });

      // 清空待发布变更
      setPendingChanges([]);
    }
  };

  // 取消定时发布
  const handleCancelScheduled = () => {
    if (!pageState) return;
    setPageState({
      ...pageState,
      scheduledPublish: undefined,
      // 恢复到待发布状态
      status: 'pending',
      pendingChanges: pageState.pendingChanges || 1,
    });
  };

  // ==================== 导出知识树功能 ====================
  
  // 考频映射
  const examFrequencyMap: Record<string, string> = {
    'high': '高频',
    'medium': '中频',
    'low': '低频',
  };

  // 学业要求映射
  const academicRequirementMap: Record<AcademicRequirement, string> = {
    know: '了解',
    understand: '理解',
    master: '掌握',
    apply: '运用',
  };
  const academicRequirementLabelToValue: Record<string, AcademicRequirement> = {
    '了解': 'know',
    '理解': 'understand',
    '掌握': 'master',
    '运用': 'apply',
  };

  // 扁平化知识树数据（用于导出，支持7级标题）
  const flattenKnowledgeTree = (nodes: KnowledgeNode[], path: string[] = []): Array<{
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
    level6: string;
    level7: string;
    academicRequirement: string;
    examFrequency: string;
    prerequisiteKnowledge: string;
    strategy: string;
  }> => {
    const result: Array<{
      level1: string;
      level2: string;
      level3: string;
      level4: string;
      level5: string;
      level6: string;
      level7: string;
      academicRequirement: string;
      examFrequency: string;
      prerequisiteKnowledge: string;
      strategy: string;
    }> = [];

    const traverse = (nodeList: KnowledgeNode[], currentPath: string[]) => {
      nodeList.forEach(node => {
        const newPath = [...currentPath, node.name];
        
        // 判断是否为叶子节点
        if (!node.children || node.children.length === 0) {
          // 构建行数据（支持7级标题，未使用的层级留空）
          const rowData = {
            level1: newPath[0] || '',
            level2: newPath[1] || '',
            level3: newPath[2] || '',
            level4: newPath[3] || '',
            level5: newPath[4] || '',
            level6: newPath[5] || '',
            level7: newPath[6] || '',
            academicRequirement: node.academicRequirement
              ? (academicRequirementMap[node.academicRequirement] || '')
              : '',
            examFrequency: examFrequencyMap[node.examFrequency || ''] || '',
            prerequisiteKnowledge: node.prerequisiteKnowledge?.map(p => p.name).join('、') || '',
            strategy: node.strategyType === 'personalized'
              ? (personalizedStrategies.find(s => node.personalizedStrategies?.includes(s.id))?.name || '')
              : '通用策略',
          };
          result.push(rowData);
        }
        
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          traverse(node.children, newPath);
        }
      });
    };

    traverse(nodes, []);
    return result;
  };

  // 导出知识树为Excel文件
  const handleExportKnowledgeTree = () => {
    if (!selectedSubject) return;
    
    // 扁平化知识树数据
    const flatData = flattenKnowledgeTree(knowledgeTree);
    
    // 构建Excel数据
    // 第1行：字段说明（合并单元格）
    const instructionRow = [
      '【标题字段说明】：一级标题至七级标题表示当前末级知识点从上到下的完整层级路径，未使用到的层级会留空；【学业要求字段说明】仅末级知识点会导出学业要求；【考频字段说明】：仅末级知识点会导出考频；【前置知识点字段说明】：仅导出当前末级知识点的直接前置知识点；【出题策略字段说明】：若当前知识点使用默认通用策略，则该字段出题策略会显示为【通用策略】；若绑定的是个性化策略，会导出具体的个性化策略名称；',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    
    // 第2行：空行（分隔说明区和数据区）
    const emptyRow = ['', '', '', '', '', '', '', '', '', '', ''];
    
    // 第3行：表头（学业要求在考频左侧）
    const header = ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题', '七级标题', '学业要求', '考频', '前置知识点', '出题策略'];
    
    // 数据行
    const dataRows = flatData.map(row => [
      row.level1,
      row.level2,
      row.level3,
      row.level4,
      row.level5,
      row.level6,
      row.level7,
      row.academicRequirement,
      row.examFrequency,
      row.prerequisiteKnowledge,
      row.strategy,
    ]);
    
    // 构建所有行
    const allRows = [
      instructionRow,
      emptyRow,
      header,
      ...dataRows,
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // 一级标题
      { wch: 15 }, // 二级标题
      { wch: 15 }, // 三级标题
      { wch: 15 }, // 四级标题
      { wch: 18 }, // 五级标题
      { wch: 15 }, // 六级标题
      { wch: 15 }, // 七级标题
      { wch: 12 }, // 学业要求
      { wch: 10 }, // 考频
      { wch: 25 }, // 前置知识点
      { wch: 30 }, // 出题策略
    ];
    
    // 合并说明单元格（A1:K1）
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '知识树');
    
    // 生成文件名（不包含版本号，始终导出最新内容）
    const phaseLabel = phaseConfig[selectedPhase].label;
    const subjectLabel = selectedSubject.name;
    const fileName = `${phaseLabel}_${subjectLabel}_知识树.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);
  };

  // ==================== 批量导入功能 ====================

  // 下载导入模板
  const handleDownloadTemplate = async () => {
    // 动态生成模板文件，使用 exceljs 支持完整样式
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('知识点');

    // 设置列宽
    ws.columns = [
      { width: 15 }, // 一级标题
      { width: 15 }, // 二级标题
      { width: 15 }, // 三级标题
      { width: 15 }, // 四级标题
      { width: 15 }, // 五级标题
      { width: 15 }, // 六级标题
      { width: 15 }, // 七级标题
      { width: 12 }, // 学业要求
      { width: 10 }, // 考频
      { width: 25 }, // 前置知识点
      { width: 20 }, // 出题策略
    ];

    // 第一行：填写说明，合并单元格
    const instructionText = '填写说明：\n【标题字段】一级标题至七级标题用于匹配线上知识树节点，请按完整层级路径填写，不支持通过导入修改树目录；\n【学业要求字段】仅末级知识点可填写"了解/理解/掌握/运用"，留空不更新，【清空】表示清空线上内容；\n【考频字段】仅末级知识点可填写"高频/中频/低频"，留空不更新，【清空】表示清空线上内容；\n【前置知识点】仅末级知识点可填写，多个用顿号（、）分隔，留空不更新，【清空】表示清空线上内容；\n【出题策略】仅末级知识点可填写系统已存在的个性化策略名称，留空不更新，【清空】表示清空后回退为默认的通用策略。';
    ws.getCell('A1').value = instructionText;
    ws.getCell('A1').alignment = { wrapText: true, vertical: 'middle' };
    ws.mergeCells('A1:K1');
    ws.getRow(1).height = 140;

    // 第二行：表头
    const header = ['一级标题', '二级标题', '三级标题', '四级标题', '五级标题', '六级标题', '七级标题', '学业要求', '考频', '前置知识点', '出题策略'];
    ws.addRow(header);

    // 导出文件
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '知识树管理模板.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // 构建线上知识树所有叶子节点的路径集合（用于匹配）
  const buildOnlinePathSet = (): Map<string, { path: string[]; node: KnowledgeNode }> => {
    const pathMap = new Map<string, { path: string[]; node: KnowledgeNode }>();
    const traverse = (nodes: KnowledgeNode[], currentPath: string[]) => {
      nodes.forEach((node) => {
        const newPath = [...currentPath, node.name];
        const pathKey = newPath.join(' / ');
        if (!node.children || node.children.length === 0) {
          // 叶子节点
          pathMap.set(pathKey, { path: newPath, node });
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children, newPath);
        }
      });
    };
    traverse(knowledgeTree, []);
    return pathMap;
  };

  // 构建线上所有知识点名称集合（用于前置知识点校验）
  const buildOnlineKnowledgeNameSet = (): Set<string> => {
    const nameSet = new Set<string>();
    const traverse = (nodes: KnowledgeNode[]) => {
      nodes.forEach((node) => {
        nameSet.add(node.name);
        if (node.children) traverse(node.children);
      });
    };
    traverse(knowledgeTree);
    return nameSet;
  };

  // 检查标题层级是否连续（不能跳级）
  const isPathLevelContinuous = (levels: string[]): boolean => {
    let foundEmpty = false;
    for (let i = 0; i < levels.length; i++) {
      if (!levels[i] || String(levels[i]).trim() === '') {
        foundEmpty = true;
      } else if (foundEmpty) {
        // 已经遇到空值后又有非空值，说明层级断裂
        return false;
      }
    }
    return true;
  };

  // 从行数据中提取非空标题拼接为知识点路径
  const buildKnowledgePathFromRow = (row: any[]): string => {
    const levels: string[] = [];
    for (let i = 0; i < 7; i++) {
      if (row[i] && String(row[i]).trim() !== '') {
        levels.push(String(row[i]).trim());
      }
    }
    return levels.join(' / ');
  };

  // 从行数据中提取标题列数组
  const extractLevelTitles = (row: any[]): string[] => {
    return Array.from({ length: 7 }, (_, i) =>
      row[i] ? String(row[i]).trim() : ''
    );
  };

  // 执行导入校验
  const performValidation = (file: File) => {
    setImportValidationStatus('validating');
    setImportFile(file);
    setImportValidationSummary(null);
    setImportFileErrors([]);
    setImportRowResults([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // ====== 阶段一：文件级校验 ======

        // 检查文件是否为空
        if (!jsonData || jsonData.length < 4) {
          setImportFileErrors([{
            type: 'empty-content',
            title: '文件内容为空',
            description: '当前文件未识别到可校验的数据行',
            suggestion: '请确认文件中已按模板填写知识点数据后重新上传',
          }]);
          setImportValidationSummary({
            fileName: file.name,
            uploadTime: new Date().toLocaleString('zh-CN'),
            totalRows: 0,
            passRows: 0,
            failRows: 0,
          });
          setImportValidationStatus('file-error');
          return;
        }

        // 寻找表头行（支持不同模板格式：可能在第1行、第2行或第3行）
        let headerRowIndex = -1;
        const expectedHeaders = ['一级标题', '二级标题', '学业要求', '考频', '前置知识点', '出题策略'];
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row.length >= 7) {
            const rowStr = row.map((c: any) => String(c || '')).join('');
            if (expectedHeaders.every(h => rowStr.includes(h))) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          setImportFileErrors([{
            type: 'header-mismatch',
            title: '模板表头不匹配',
            description: '系统未识别到标准模板表头，请使用系统下载的模板填写后导入',
            suggestion: '请点击【下载模板】重新获取标准模板',
          }]);
          setImportValidationSummary({
            fileName: file.name,
            uploadTime: new Date().toLocaleString('zh-CN'),
            totalRows: 0,
            passRows: 0,
            failRows: 0,
          });
          setImportValidationStatus('file-error');
          return;
        }

        // 提取数据行
        const dataRows = jsonData.slice(headerRowIndex + 1).filter(
          (row) => row && row.length > 0 && row.some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '')
        );

        if (dataRows.length === 0) {
          setImportFileErrors([{
            type: 'empty-content',
            title: '模板内容为空',
            description: '当前文件未识别到可校验的数据行',
            suggestion: '请确认文件中已按模板填写知识点数据后重新上传',
          }]);
          setImportValidationSummary({
            fileName: file.name,
            uploadTime: new Date().toLocaleString('zh-CN'),
            totalRows: 0,
            passRows: 0,
            failRows: 0,
          });
          setImportValidationStatus('file-error');
          return;
        }

        // ====== 阶段二 & 三：逐行校验 ======

        const onlinePathMap = buildOnlinePathSet();
        const onlineNameSet = buildOnlineKnowledgeNameSet();
        const rowResults: Array<{
          rowIndex: number;
          excelRow: number;
          knowledgePath: string;
          result: 'pass' | 'fail';
          errorType?: 'path-invalid' | 'node-not-found' | 'path-modified' | 'path-level-broken' | 'duplicate-node' | 'exam-freq-invalid' | 'exam-freq-not-leaf' | 'academic-req-invalid' | 'academic-req-not-leaf' | 'prerequisite-not-found' | 'prerequisite-self' | 'prerequisite-duplicate' | 'strategy-not-found' | 'strategy-format' | 'other';
          reason?: string;
          suggestion?: string;
        }> = [];

        // 用于检测重复路径
        const seenPaths = new Map<string, number[]>();

        dataRows.forEach((row, idx) => {
          const excelRow = headerRowIndex + 1 + idx + 1; // Excel行号（从1开始，跳过表头）
          const levels = extractLevelTitles(row);
          const knowledgePath = buildKnowledgePathFromRow(row);

          // 检查标题层级是否连续
          if (!isPathLevelContinuous(levels)) {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              knowledgePath,
              result: 'fail',
              errorType: 'path-level-broken',
              reason: '当前行标题层级填写不完整，存在跳级填写',
              suggestion: '若填写五级标题，则一级至四级标题需连续填写',
            });
            return;
          }

          // 检查是否至少有一个标题
          const hasAnyTitle = levels.some(l => l !== '');
          if (!hasAnyTitle) {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              knowledgePath: '（空行）',
              result: 'fail',
              errorType: 'path-invalid',
              reason: '当前行未填写任何标题信息',
              suggestion: '请至少填写一级标题',
            });
            return;
          }

          // 记录路径用于重复检测
          if (!seenPaths.has(knowledgePath)) {
            seenPaths.set(knowledgePath, [excelRow]);
          } else {
            seenPaths.get(knowledgePath)!.push(excelRow);
          }

          // 匹配线上节点
          const matchedOnline = onlinePathMap.get(knowledgePath);

          // 学业要求列（第8列，索引7）；考频列（第9列，索引8）
          const academicReqValue = row[7] ? String(row[7]).trim() : '';
          const examFreqValue = row[8] ? String(row[8]).trim() : '';
          // 前置知识点列（第10列，索引9）
          const prerequisiteValue = row[9] ? String(row[9]).trim() : '';
          // 出题策略列（第11列，索引10）
          const strategyValue = row[10] ? String(row[10]).trim() : '';

          if (!matchedOnline) {
            // 尝试检查是否是标题被修改的情况
            // 提取非空标题的最后一层，看线上是否存在同名节点
            const lastTitle = levels.filter(l => l !== '').pop() || '';
            const titleExistsOnline = onlineNameSet.has(lastTitle);

            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              knowledgePath,
              result: 'fail',
              errorType: titleExistsOnline ? 'path-modified' : 'node-not-found',
              reason: titleExistsOnline
                ? '导入仅支持使用标题列定位节点，不支持通过导入修改树目录'
                : '系统未在当前知识树中找到与该标题路径完全一致的节点',
              suggestion: titleExistsOnline
                ? '请在线上页面修改树节点名称后重新导出模板'
                : '请确认标题列内容是否与线上树目录一致，或重新导出最新模板后填写',
            });
            return;
          }

          // 节点匹配成功，进入详情校验
          const isLeaf = !matchedOnline.node.children || matchedOnline.node.children.length === 0;
          const errors: Array<{
            errorType: 'exam-freq-invalid' | 'exam-freq-not-leaf' | 'academic-req-invalid' | 'academic-req-not-leaf' | 'prerequisite-not-found' | 'prerequisite-self' | 'prerequisite-duplicate' | 'strategy-not-found' | 'strategy-format';
            reason: string;
            suggestion: string;
          }> = [];

          // 校验学业要求
          if (academicReqValue && academicReqValue !== '【清空】' && academicReqValue !== '清空') {
            if (!['了解', '理解', '掌握', '运用'].includes(academicReqValue)) {
              errors.push({
                errorType: 'academic-req-invalid',
                reason: `学业要求值"${academicReqValue}"无效，学业要求仅支持填写"了解 / 理解 / 掌握 / 运用"`,
                suggestion: '请按模板要求填写标准枚举值，或留空不更新，或填写【清空】清空线上内容',
              });
            }
            if (!isLeaf) {
              errors.push({
                errorType: 'academic-req-not-leaf',
                reason: '学业要求仅允许填写在末级知识点行',
                suggestion: '请清空当前行学业要求，或确认该行是否为末级知识点',
              });
            }
          }

          // 校验考频
          if (examFreqValue && examFreqValue !== '【清空】' && examFreqValue !== '清空') {
            if (!['高频', '中频', '低频'].includes(examFreqValue)) {
              errors.push({
                errorType: 'exam-freq-invalid',
                reason: `考频值"${examFreqValue}"无效，考频仅支持填写"高频 / 中频 / 低频"`,
                suggestion: '请按模板要求填写标准枚举值',
              });
            }
            if (!isLeaf) {
              errors.push({
                errorType: 'exam-freq-not-leaf',
                reason: '考频仅允许填写在末级知识点行',
                suggestion: '请清空当前行考频，或确认该行是否为末级知识点',
              });
            }
          }

          // 校验前置知识点
          if (prerequisiteValue) {
            const prerequisites = prerequisiteValue.split('、').map(p => p.trim()).filter(p => p !== '');

            // 检查是否包含自身
            const currentNodeName = matchedOnline.node.name;
            if (prerequisites.includes(currentNodeName)) {
              errors.push({
                errorType: 'prerequisite-self',
                reason: '前置知识点不能包含当前知识点自身',
                suggestion: '请删除与当前知识点相同的前置知识点名称',
              });
            }

            // 检查是否存在
            const notFoundPrerequisites = prerequisites.filter(p => p !== currentNodeName && !onlineNameSet.has(p));
            if (notFoundPrerequisites.length > 0) {
              errors.push({
                errorType: 'prerequisite-not-found',
                reason: `前置知识点"${notFoundPrerequisites.join('、')}"在线上知识树中不存在`,
                suggestion: '请确认名称是否正确，多个前置知识点请使用顿号"、"分隔',
              });
            }

            // 检查重复
            const uniquePrerequisites = new Set(prerequisites);
            if (uniquePrerequisites.size < prerequisites.length) {
              errors.push({
                errorType: 'prerequisite-duplicate',
                reason: '前置知识点存在重复项',
                suggestion: '请去重后重新上传',
              });
            }
          }

          // 校验出题策略
          if (strategyValue) {
            const matchedStrategy = strategies.find(s => s.name === strategyValue);
            if (!matchedStrategy) {
              errors.push({
                errorType: 'strategy-not-found',
                reason: `出题策略"${strategyValue}"未在系统中找到对应个性化策略`,
                suggestion: '请填写系统中已存在的个性化策略名称，或留空使用默认通用策略',
              });
            }
          }

          if (errors.length > 0) {
            // 取第一个错误作为主要原因
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              knowledgePath,
              result: 'fail',
              errorType: errors[0].errorType,
              reason: errors.map(e => e.reason).join('；'),
              suggestion: errors.map(e => e.suggestion).join('；'),
            });
          } else {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              knowledgePath,
              result: 'pass',
            });
          }
        });

        // 处理重复行
        seenPaths.forEach((rows, path) => {
          if (rows.length > 1) {
            // 标记所有重复行为失败
            rowResults.forEach((result) => {
              if (result.knowledgePath === path && result.result !== 'fail') {
                result.result = 'fail';
                result.errorType = 'duplicate-node';
                result.reason = '当前文件中存在多个相同标题路径的数据行';
                result.suggestion = '请保留其中一行，删除重复数据后重新上传';
              }
              // 即使已经标记为失败的，如果也是重复行，追加原因
              if (result.knowledgePath === path && result.result === 'fail' && result.errorType !== 'duplicate-node') {
                result.reason = `${result.reason}；当前文件中存在多个相同标题路径的数据行`;
                result.suggestion = `${result.suggestion}；请保留其中一行，删除重复数据后重新上传`;
              }
            });
          }
        });

        // 汇总结果
        const passRows = rowResults.filter(r => r.result === 'pass').length;
        const failRows = rowResults.filter(r => r.result === 'fail').length;
        const totalRows = rowResults.length;

        setImportValidationSummary({
          fileName: file.name,
          uploadTime: new Date().toLocaleString('zh-CN'),
          totalRows,
          passRows,
          failRows,
        });
        setImportRowResults(rowResults);

        if (passRows === totalRows) {
          setImportValidationStatus('all-pass');
        } else if (passRows === 0) {
          setImportValidationStatus('all-row-fail');
        } else {
          setImportValidationStatus('partial');
        }

      } catch (parseError) {
        setImportFileErrors([{
          type: 'parse-failed',
          title: '文件解析失败',
          description: '请确保上传的是有效的Excel文件（.xlsx / .xls）',
          suggestion: '请重新上传正确格式的文件',
        }]);
        setImportValidationSummary({
          fileName: file.name,
          uploadTime: new Date().toLocaleString('zh-CN'),
          totalRows: 0,
          passRows: 0,
          failRows: 0,
        });
        setImportValidationStatus('file-error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 下载错误明细
  const handleDownloadErrorDetail = () => {
    if (!importRowResults || importRowResults.length === 0) return;

    const failedResults = importRowResults.filter(r => r.result === 'fail');
    const header = ['序号', 'Excel行号', '知识点路径', '校验结果', '失败原因'];
    const rows = failedResults.map(r => [
      r.rowIndex,
      `第${r.excelRow}行`,
      r.knowledgePath,
      '失败',
      r.reason || '',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 30 },
      { wch: 8 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, '校验结果');

    const phaseLabel = phaseConfig[selectedPhase].label;
    const subjectLabel = selectedSubject?.name || '知识树';
    XLSX.writeFile(wb, `${phaseLabel}_${subjectLabel}_导入校验结果.xlsx`);
  };

  // 重置导入状态
  const resetImportState = () => {
    setShowImportDialog(false);
    setImportValidationStatus('idle');
    setImportFile(null);
    setImportValidationSummary(null);
    setImportFileErrors([]);
    setImportRowResults([]);
  };

  // 重新上传
  const handleReUpload = () => {
    setImportValidationStatus('idle');
    setImportFile(null);
    setImportValidationSummary(null);
    setImportFileErrors([]);
    setImportRowResults([]);
  };

  // 处理保存编辑（触发待发布状态）
  const handleSaveWithPending = () => {
    if (!selectedNode || !pageState) return;

    const updatedNode: KnowledgeNode = {
      ...selectedNode,
      ...editData,
      knowledgeCard:
        knowledgeCardDraftRef.current ??
        editData.knowledgeCard ??
        selectedNode.knowledgeCard,
    };
    if (!editData.academicRequirement) {
      delete updatedNode.academicRequirement;
    }
    if (!editData.examFrequency) {
      delete updatedNode.examFrequency;
    }

    const syncTree = (nodes: KnowledgeNode[]): KnowledgeNode[] =>
      nodes.map((n) => {
        if (n.id === selectedNode.id) return updatedNode;
        if (n.children) return { ...n, children: syncTree(n.children) };
        return n;
      });

    setKnowledgeTree(syncTree(knowledgeTree));
    setSelectedNode(updatedNode);
    setIsEditingDetail(false);
    knowledgeCardDraftRef.current = undefined;
    setEditData({});
    
    // 添加变更记录
    const dimensionMap: Record<DetailTabType, '知识点信息' | '知识点结构' | '学习资源'> = {
      info: '知识点信息',
      structure: '知识点结构',
      resource: '学习资源'
    };
    const newChange: ChangeRecord = { 
      type: 'modify', 
      target: selectedNode.name, 
      detail: '修改知识点配置',
      dimension: dimensionMap[activeDetailTab],
      changedByRole: isTeacher ? 'teacher' : 'supervisor',
      changedByAccount: String(Math.floor(100000 + Math.random() * 900000)),
    };
    setPendingChanges(prev => [...prev, newChange]);
    
    // 更新页面状态为待发布（使用函数式更新确保获取最新值）
    setPageState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'pending',
        pendingChanges: prev.pendingChanges + 1,
      };
    });
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 学段配置（倒序：高中、初中、小学）
  const phaseConfig = {
    senior: { label: '高中', color: 'bg-purple-500' },
    junior: { label: '初中', color: 'bg-emerald-500' },
    primary: { label: '小学', color: 'bg-blue-500' },
  };

  // 判断是否为叶子节点
  const isLeafNode = (node: KnowledgeNode): boolean => {
    return !node.children || node.children.length === 0;
  };

  // 判断节点是否有详细内容（知识点信息、知识点结构、学习资源）
  const hasDetailContent = (node: KnowledgeNode): boolean => {
    // 检查是否有前置知识点或延伸知识点
    const hasStructure = (node.prerequisiteKnowledge && node.prerequisiteKnowledge.length > 0) ||
                         (node.extensionKnowledge && node.extensionKnowledge.length > 0);
    // 检查是否有学习资源
    const hasCard = Boolean(
                          node.knowledgeCard &&
                          (node.knowledgeCard.keyPoints.length > 0 ||
                            node.knowledgeCard.formulas.length > 0 ||
                            node.knowledgeCard.examPoints.length > 0)
                        );
    const hasResources = Boolean((node.videoContents && node.videoContents.length > 0) ||
                         (node.textContent && node.textContent.content && node.textContent.content.length > 0) ||
                         hasCard);
    return Boolean(hasStructure || hasResources);
  };

  // 判断是否为根知识点（顶级节点）
  const isRootNode = (node: KnowledgeNode): boolean => {
    return knowledgeTree.some(rootNode => rootNode.id === node.id);
  };

  // 切换节点展开/收起
  const toggleNode = (nodeId: string) => {
    const toggleNodeRecursive = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: toggleNodeRecursive(node.children) };
        }
        return node;
      });
    };
    setKnowledgeTree(toggleNodeRecursive(knowledgeTree));
  };

  // 选择节点
  const selectNode = (node: KnowledgeNode) => {
    setSelectedNode(node);
  };

  // 根据 ID 查找知识点节点
  const findNodeById = useCallback((nodeId: string): KnowledgeNode | null => {
    // 首先在 externalKnowledgeNodes 中查找
    const externalNode = externalKnowledgeNodes.get(nodeId);
    if (externalNode) return externalNode;
    
    // 然后在 knowledgeTree 中查找
    const findRecursive = (nodes: KnowledgeNode[]): KnowledgeNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findRecursive(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findRecursive(knowledgeTree);
  }, [knowledgeTree, externalKnowledgeNodes]);

  // 生成节点编号（自动生成）
  const generateNodeNumber = (nodeId: string): string => {
    const numbers: string[] = [];
    
    const findPath = (nodes: KnowledgeNode[], targetId: string, path: number[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const currentPath = [...path, i + 1];
        if (nodes[i].id === targetId) {
          numbers.push(...currentPath.map(n => n.toString()));
          return true;
        }
        if (nodes[i].children && findPath(nodes[i].children!, targetId, currentPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(knowledgeTree, nodeId, []);
    return numbers.join('.');
  };

  // 生成知识树变更记录并更新页面状态
  const recordKnowledgeTreeChange = (changeType: 'add' | 'delete' | 'rename', targetName: string) => {
    const changeTypeMap = {
      add: '新增知识点',
      delete: '删除知识点',
      rename: '重命名知识点',
    };
    
    const newChange: ChangeRecord = {
      type: 'modify',
      target: targetName,
      detail: changeTypeMap[changeType],
      dimension: '知识点结构',
      changedByRole: isTeacher ? 'teacher' : 'supervisor',
      changedByAccount: String(Math.floor(100000 + Math.random() * 900000)),
    };
    setPendingChanges(prev => [...prev, newChange]);
    
    // 更新页面状态为待发布
    setPageState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'pending',
        pendingChanges: prev.pendingChanges + 1,
      };
    });
    
    console.log('[知识树变更]', changeTypeMap[changeType], targetName);
  };

  // 添加知识点
  const handleAddNode = (parentId: string | null, name: string) => {
    const newNode: KnowledgeNode = {
      id: `node-${Date.now()}`,
      name,
      // 新建默认未设置：不写 examFrequency / academicRequirement
      children: [],
    };

    if (parentId === null) {
      // 添加根节点
      setKnowledgeTree([...knowledgeTree, newNode]);
    } else {
      // 添加子节点，同时展开父节点
      const addToParent = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              expanded: true, // 自动展开父节点
              children: [...(node.children || []), newNode],
            };
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) };
          }
          return node;
        });
      };
      setKnowledgeTree(addToParent(knowledgeTree));
    }
    
    // 清空输入状态
    setAddingChildParentId(null);
    setAddingChildValue('');
    
    // 生成变更记录
    recordKnowledgeTreeChange('add', name);
  };

  // 编辑知识点名称
  const handleEditNodeName = (nodeId: string, newName: string) => {
    console.log('[编辑节点名称] nodeId:', nodeId, 'newName:', newName);
    
    // 找到旧名称
    let oldName = '';
    const findNodeName = (nodes: KnowledgeNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          oldName = node.name;
          return true;
        }
        if (node.children && findNodeName(node.children)) {
          return true;
        }
      }
      return false;
    };
    findNodeName(knowledgeTree);
    
    const updateNode = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          console.log('[编辑节点名称] 找到节点，更新名称:', node.name, '->', newName);
          return { ...node, name: newName };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    const newTree = updateNode(knowledgeTree);
    console.log('[编辑节点名称] 新知识树已生成');
    setKnowledgeTree(newTree);
    
    // 如果当前选中的是被编辑的节点，更新选中节点
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, name: newName });
    }
    
    // 清空编辑状态
    setEditingNodeId(null);
    setEditingNodeValue('');
    
    // 生成变更记录
    recordKnowledgeTreeChange('rename', `${oldName} → ${newName}`);
  };

  // 删除知识点
  const handleDeleteNode = (nodeId: string) => {
    // 找到要删除的节点名称
    let deletedName = '';
    const findNodeName = (nodes: KnowledgeNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          deletedName = node.name;
          return true;
        }
        if (node.children && findNodeName(node.children)) {
          return true;
        }
      }
      return false;
    };
    findNodeName(knowledgeTree);
    
    const deleteFromTree = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
      return nodes.filter(node => {
        if (node.id === nodeId) {
          return false;
        }
        if (node.children) {
          node.children = deleteFromTree(node.children);
        }
        return true;
      });
    };
    setKnowledgeTree(deleteFromTree(knowledgeTree));
    
    // 如果删除的是当前选中的节点，清空选中状态
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    
    // 关闭确认弹窗
    setShowDeleteConfirm(false);
    setDeletingNodeId(null);
    
    // 生成变更记录
    recordKnowledgeTreeChange('delete', deletedName);
  };

  // 获取所有节点的扁平化ID列表（用于拖拽上下文）
  const getAllNodeIds = (nodes: KnowledgeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (nodeList: KnowledgeNode[]) => {
      nodeList.forEach(node => {
        ids.push(node.id);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return ids;
  };

  // 处理树节点拖拽排序
  const handleTreeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // 查找源节点和目标节点的信息
    const findNodeAndParent = (
      nodes: KnowledgeNode[], 
      targetId: string, 
      parent: KnowledgeNode | null = null
    ): { node: KnowledgeNode; parent: KnowledgeNode | null; index: number } | null => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
          return { node: nodes[i], parent, index: i };
        }
        if (nodes[i].children) {
          const found = findNodeAndParent(nodes[i].children!, targetId, nodes[i]);
          if (found) return found;
        }
      }
      return null;
    };

    const sourceInfo = findNodeAndParent(knowledgeTree, active.id as string);
    const targetInfo = findNodeAndParent(knowledgeTree, over.id as string);

    if (!sourceInfo || !targetInfo) return;

    // 只允许同级拖拽排序（同一个父节点下）
    const sourceParentId = sourceInfo.parent?.id || null;
    const targetParentId = targetInfo.parent?.id || null;

    if (sourceParentId !== targetParentId) {
      // 不同父节点，暂不支持跨级拖拽
      return;
    }

    // 执行同级排序
    const moveNodeInSameLevel = (
      nodes: KnowledgeNode[], 
      sourceId: string, 
      targetId: string
    ): KnowledgeNode[] => {
      const sourceIndex = nodes.findIndex(n => n.id === sourceId);
      const targetIndex = nodes.findIndex(n => n.id === targetId);
      
      if (sourceIndex === -1 || targetIndex === -1) return nodes;
      
      const newNodes = [...nodes];
      const [movedNode] = newNodes.splice(sourceIndex, 1);
      newNodes.splice(targetIndex, 0, movedNode);
      return newNodes;
    };

    const updateTree = (nodes: KnowledgeNode[], parentId: string | null): KnowledgeNode[] => {
      if (parentId === null) {
        // 根级别排序
        return moveNodeInSameLevel(nodes, active.id as string, over.id as string);
      }
      
      return nodes.map(node => {
        if (node.id === parentId && node.children) {
          return {
            ...node,
            children: moveNodeInSameLevel(node.children, active.id as string, over.id as string)
          };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children, parentId) };
        }
        return node;
      });
    };

    setKnowledgeTree(updateTree(knowledgeTree, sourceParentId));
    
    // 生成变更记录（拖拽移动节点）
    recordKnowledgeTreeChange('rename', `移动节点「${sourceInfo.node.name}」位置`);
  };

  // 开始编辑
  const handleEdit = () => {
    if (!selectedNode) return;
    setIsEditingDetail(true);
    const knowledgeCard = selectedNode.knowledgeCard
      ? structuredClone(selectedNode.knowledgeCard)
      : emptyKnowledgeCard();
    knowledgeCardDraftRef.current = knowledgeCard;
    setEditData({
      academicRequirement: selectedNode.academicRequirement,
      examFrequency: selectedNode.examFrequency,
      strategyType: selectedNode.strategyType,
      personalizedStrategies: selectedNode.personalizedStrategies || [],
      prerequisiteKnowledge: selectedNode.prerequisiteKnowledge || [],
      extensionKnowledge: selectedNode.extensionKnowledge || [],
      videoContents: selectedNode.videoContents || [],
      textContent: selectedNode.textContent,
      knowledgeCard,
    });
  };

  // 取消编辑
  const handleCancel = () => {
    setIsEditingDetail(false);
    knowledgeCardDraftRef.current = undefined;
    setEditData({});
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent, type: 'prerequisite' | 'extension') => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const field = type === 'prerequisite' ? 'prerequisiteKnowledge' : 'extensionKnowledge';
      const currentList = editData[field] || selectedNode?.[field] || [];
      const oldIndex = currentList.findIndex(item => item.id === active.id);
      const newIndex = currentList.findIndex(item => item.id === over.id);

      const newList = arrayMove(currentList, oldIndex, newIndex);
      setEditData({ ...editData, [field]: newList });
    }
  };

  // 处理知识点选择器中的拖拽结束（简化版：只支持整层排序）
  const handleSelectorDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // 清除拖拽状态
    setDragOverPosition(null);
    dragOverPositionRef.current = null;
    isDraggingRef.current = false;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // 只处理整层拖拽排序
    const activeStepIndex = selectedSteps.findIndex(step => step.id === activeId);
    const overStepIndex = selectedSteps.findIndex(step => step.id === overId);
    
    if (activeStepIndex === -1 || overStepIndex === -1) return;
    if (activeStepIndex === overStepIndex) return;
    
    // 简单的数组位置交换
    const newSteps = arrayMove(selectedSteps, activeStepIndex, overStepIndex);
    setSelectedSteps(newSteps);
  };

  // 合并知识点到上一层
  const handleMergeItemUp = (stepIndex: number, itemId: string) => {
    if (stepIndex <= 0) return;
    
    const newSteps = [...selectedSteps];
    const currentItem = newSteps[stepIndex].items.find(i => i.id === itemId);
    if (!currentItem) return;
    
    // 从当前层移除
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      items: newSteps[stepIndex].items.filter(i => i.id !== itemId)
    };
    
    // 添加到上一层
    newSteps[stepIndex - 1] = {
      ...newSteps[stepIndex - 1],
      items: [...newSteps[stepIndex - 1].items, currentItem]
    };
    
    // 清理空行
    const finalSteps = newSteps.filter(s => s.items.length > 0);
    setSelectedSteps(finalSteps);
  };

  // 合并知识点到下一层
  const handleMergeItemDown = (stepIndex: number, itemId: string) => {
    if (stepIndex >= selectedSteps.length - 1) return;
    
    const newSteps = [...selectedSteps];
    const currentItem = newSteps[stepIndex].items.find(i => i.id === itemId);
    if (!currentItem) return;
    
    // 从当前层移除
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      items: newSteps[stepIndex].items.filter(i => i.id !== itemId)
    };
    
    // 添加到下一层
    newSteps[stepIndex + 1] = {
      ...newSteps[stepIndex + 1],
      items: [currentItem, ...newSteps[stepIndex + 1].items]
    };
    
    // 清理空行
    const finalSteps = newSteps.filter(s => s.items.length > 0);
    setSelectedSteps(finalSteps);
  };

  // 拆分知识点为上一层
  const handleSplitItemUp = (stepIndex: number, itemId: string) => {
    if (stepIndex <= 0) return;
    
    const newSteps = [...selectedSteps];
    const currentItem = newSteps[stepIndex].items.find(i => i.id === itemId);
    if (!currentItem) return;
    
    // 从当前层移除
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      items: newSteps[stepIndex].items.filter(i => i.id !== itemId)
    };
    
    // 创建新层插入到上一层位置
    const newStepId = `step-${Date.now()}`;
    newSteps.splice(stepIndex, 0, { id: newStepId, items: [currentItem] });
    
    // 清理空行
    const finalSteps = newSteps.filter(s => s.items.length > 0);
    setSelectedSteps(finalSteps);
  };

  // 拆分知识点为下一层
  const handleSplitItemDown = (stepIndex: number, itemId: string) => {
    if (stepIndex >= selectedSteps.length - 1) return;
    
    const newSteps = [...selectedSteps];
    const currentItem = newSteps[stepIndex].items.find(i => i.id === itemId);
    if (!currentItem) return;
    
    // 从当前层移除
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      items: newSteps[stepIndex].items.filter(i => i.id !== itemId)
    };
    
    // 创建新层插入到下一层位置
    const newStepId = `step-${Date.now()}`;
    newSteps.splice(stepIndex + 1, 0, { id: newStepId, items: [currentItem] });
    
    // 清理空行
    const finalSteps = newSteps.filter(s => s.items.length > 0);
    setSelectedSteps(finalSteps);
  };

  // 拆分知识点为独立新层
  const handleSplitItemNew = (stepIndex: number, itemId: string) => {
    const newSteps = [...selectedSteps];
    const currentItem = newSteps[stepIndex].items.find(i => i.id === itemId);
    if (!currentItem) return;
    
    // 从当前层移除
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      items: newSteps[stepIndex].items.filter(i => i.id !== itemId)
    };
    
    // 创建新层追加到末尾
    const newStepId = `step-${Date.now()}`;
    newSteps.push({ id: newStepId, items: [currentItem] });
    
    // 清理空行
    const finalSteps = newSteps.filter(s => s.items.length > 0);
    setSelectedSteps(finalSteps);
  };

  // 添加知识点到已选择列表
  const handleAddKnowledgePoint = (point: KnowledgeRelation) => {
    // 检查是否已存在
    const exists = selectedSteps.some(step => step.items.some(item => item.id === point.id));
    if (!exists) {
      // 默认添加为新的独立步骤
      const newStep: LearningStep = {
        id: `step-${Date.now()}`,
        items: [point]
      };
      setSelectedSteps([...selectedSteps, newStep]);
    }
  };

  // 从已选择列表移除知识点
  const handleRemoveKnowledgePoint = (stepId: string, itemId: string) => {
    const newSteps = selectedSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          items: step.items.filter(item => item.id !== itemId)
        };
      }
      return step;
    }).filter(step => step.items.length > 0);
    setSelectedSteps(newSteps);
  };

  // 保存知识点选择
  const handleSaveKnowledgeSelector = () => {
    const field = selectorType === 'prerequisite' ? 'prerequisiteKnowledge' : 'extensionKnowledge';
    // 将 LearningStep[] 转换为扁平的 KnowledgeRelation[]，保留 stepId 和 stepOrder 信息
    const flatList: KnowledgeRelation[] = [];
    selectedSteps.forEach((step, stepIndex) => {
      step.items.forEach(item => {
        flatList.push({
          ...item,
          stepId: step.id,
          stepOrder: stepIndex
        });
      });
    });
    
    // 如果是临时编辑其他知识点
    if (tempEditNode) {
      // 先尝试更新 knowledgeTree 中对应节点的数据
      let foundInTree = false;
      const updateNodeInTree = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
        return nodes.map(node => {
          if (node.id === tempEditNode.id) {
            foundInTree = true;
            return { ...node, [field]: flatList };
          }
          if (node.children) {
            return { ...node, children: updateNodeInTree(node.children) };
          }
          return node;
        });
      };
      
      const newTree = updateNodeInTree(knowledgeTree);
      if (foundInTree) {
        setKnowledgeTree(newTree);
      } else {
        // 如果节点不在 knowledgeTree 中，更新 externalKnowledgeNodes
        setExternalKnowledgeNodes(prev => {
          const newMap = new Map(prev);
          newMap.set(tempEditNode.id, {
            ...tempEditNode,
            [field]: flatList
          });
          return newMap;
        });
      }
      
      // 如果当前选中的节点就是被编辑的节点，同步更新 editData
      if (selectedNode?.id === tempEditNode.id) {
        setEditData({ ...editData, [field]: flatList });
      }
    } else {
      // 正常编辑当前选中知识点
      setEditData({ ...editData, [field]: flatList });
    }
    
    setShowKnowledgeSelector(false);
    setSelectedSteps([]);
    setKnowledgeSearchKeyword('');
  };

  // 处理个性化策略字段变更
  const handlePersonalizedStrategyChange = (field: string, value: any) => {
    setEditData({
      ...editData,
      personalizedStrategy: {
        ...editData.personalizedStrategy,
        [field]: value
      }
    });
  };

  // 打开知识点选择器
  const openKnowledgeSelector = (type: 'prerequisite' | 'extension') => {
    setSelectorType(type);
    const currentList = type === 'prerequisite' 
      ? (editData.prerequisiteKnowledge || selectedNode?.prerequisiteKnowledge || [])
      : (editData.extensionKnowledge || selectedNode?.extensionKnowledge || []);
    
    // 将扁平列表转换为 LearningStep[] 格式
    // 如果有 stepId 信息，则按 stepId 分组；否则每个知识点独立成步骤
    const stepMap = new Map<string, KnowledgeRelation[]>();
    currentList.forEach((item, index) => {
      const stepId = item.stepId || `step-${index}`;
      if (!stepMap.has(stepId)) {
        stepMap.set(stepId, []);
      }
      stepMap.get(stepId)!.push(item);
    });
    
    const steps: LearningStep[] = Array.from(stepMap.entries()).map(([stepId, items]) => ({
      id: stepId,
      items: items
    }));
    
    // 按 stepOrder 排序
    steps.sort((a, b) => {
      const orderA = a.items[0]?.stepOrder ?? 0;
      const orderB = b.items[0]?.stepOrder ?? 0;
      return orderA - orderB;
    });
    
    setSelectedSteps(steps);
    setShowKnowledgeSelector(true);
    setKnowledgeSearchKeyword('');
  };

  // 保存编辑
  const handleSave = () => {
    if (!selectedNode) return;
    // TODO: 实际保存到后端
    setSelectedNode({
      ...selectedNode,
      ...editData,
      knowledgeCard:
        knowledgeCardDraftRef.current ??
        editData.knowledgeCard ??
        selectedNode.knowledgeCard,
    });
    setIsEditingDetail(false);
    knowledgeCardDraftRef.current = undefined;
    setEditData({});
  };

  // 检查节点是否有变更（包括子节点）
  const hasNodeChanges = (node: KnowledgeNode): boolean => {
    if (!pageState?.changedNodes) return false;
    // 检查当前节点
    if (pageState.changedNodes.includes(node.id)) return true;
    // 递归检查子节点
    if (node.children) {
      for (const child of node.children) {
        if (hasNodeChanges(child)) return true;
      }
    }
    return false;
  };

  // 检查节点本身是否有变更（不包括子节点）
  const isNodeChanged = (nodeId: string): boolean => {
    return pageState?.changedNodes?.includes(nodeId) ?? false;
  };

  // 渲染树节点
  const renderTreeNode = (node: KnowledgeNode, level: number = 0): React.ReactNode => {
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = isEditingTree ? level * 24 + 28 : level * 24 + 12; // 编辑模式下留出拖拽手柄空间
    const nodeNumber = generateNodeNumber(node.id);
    const isEditingThis = editingNodeId === node.id;
    const isAddingChild = addingChildParentId === node.id;
    const nodeHasChanges = hasNodeChanges(node); // 节点或其子节点有变更
    const nodeSelfChanged = isNodeChanged(node.id); // 节点本身有变更

    return (
      <SortableTreeNode key={node.id} id={node.id} isEditingTree={isEditingTree}>
        <div className="select-none">
          <div
            className={`group flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors ${
              isSelected ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => !isEditingThis && selectNode(node)}
          >
            {/* 编辑模式下显示拖拽手柄 - 教研员身份下不显示 */}
            {isEditingTree && !isTeacher && (
              <div className="cursor-move touch-none flex-shrink-0">
                <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </div>
            )}
            
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {node.expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5" />
            )}

            {/* 编辑模式下显示自动编号 */}
            {isEditingTree && (
              <span className="text-xs text-gray-400 font-mono min-w-[20px]">{nodeNumber}</span>
            )}

            {/* 编辑模式下的内联编辑 */}
          {isEditingThis ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editingNodeValue}
                onChange={(e) => setEditingNodeValue(e.target.value)}
                className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editingNodeValue.trim()) {
                    handleEditNodeName(node.id, editingNodeValue.trim());
                  }
                  if (e.key === 'Escape') {
                    setEditingNodeId(null);
                    setEditingNodeValue('');
                  }
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingNodeValue.trim()) {
                    handleEditNodeName(node.id, editingNodeValue.trim());
                  }
                }}
                className="px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-300 hover:border-emerald-400 font-medium"
              >
                保存
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNodeId(null);
                  setEditingNodeValue('');
                }}
                className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 rounded border border-gray-300 hover:border-gray-400 font-medium"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <span className="flex-1 font-medium truncate">{node.name}</span>

              {/* 有更新标签 - 仅在非编辑模式且节点有变更时显示 */}
              {!isEditingTree && nodeHasChanges && pageState?.status === 'pending' && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium whitespace-nowrap">
                  有更新
                </span>
              )}

              {/* 考频标签 - 仅末级知识点显示 */}
              {isLeafNode(node) && node.examFrequency && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  node.examFrequency === 'high' ? 'bg-red-100 text-red-600' :
                  node.examFrequency === 'medium' ? 'bg-orange-100 text-orange-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {node.examFrequency === 'high' ? '高频' :
                   node.examFrequency === 'medium' ? '中频' : '低频'}
                </span>
              )}

              {/* 编辑模式下悬停显示操作按钮 - 教研员身份下不显示 */}
              {isEditingTree && !isTeacher && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* 根节点不显示添加按钮，子节点显示 */}
                  {level > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 如果是末级知识点且有详细内容，显示确认弹窗
                        if (isLeafNode(node) && hasDetailContent(node)) {
                          setPendingAddChildNodeId(node.id);
                          setShowAddChildConfirm(true);
                        } else {
                          setAddingChildParentId(node.id);
                          setAddingChildValue('');
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="添加子知识点"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNodeId(node.id);
                      setEditingNodeValue(node.name);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingNodeId(node.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 子节点 */}
        {hasChildren && node.expanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
            {/* 编辑模式下显示添加子知识点 - 教研员身份下不显示 */}
            {isEditingTree && isAddingChild && !isTeacher && (
              <div className="flex items-center gap-2 py-2 px-2" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
                <span className="w-5 h-5" />
                <input
                  type="text"
                  value={addingChildValue}
                  onChange={(e) => setAddingChildValue(e.target.value)}
                  placeholder="请输入知识点名称"
                  className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && addingChildValue.trim()) {
                      handleAddNode(node.id, addingChildValue.trim());
                    }
                    if (e.key === 'Escape') {
                      setAddingChildParentId(null);
                      setAddingChildValue('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (addingChildValue.trim()) {
                      handleAddNode(node.id, addingChildValue.trim());
                    }
                  }}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setAddingChildParentId(null);
                    setAddingChildValue('');
                  }}
                  className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* 添加子知识点按钮 - 教研员身份下不显示 */}
            {isEditingTree && !isAddingChild && !isTeacher && (
              <button
                onClick={() => {
                  setAddingChildParentId(node.id);
                  setAddingChildValue('');
                }}
                className="w-full flex items-center gap-2 py-1.5 px-2 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
                style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}
              >
                <Plus className="w-3.5 h-3.5" />
                添加子知识点
              </button>
            )}
          </div>
        )}
        
        {/* 没有子节点但处于编辑模式时，也显示添加按钮 - 教研员身份下不显示 */}
        {!hasChildren && isEditingTree && isAddingChild && addingChildParentId === node.id && !isTeacher && (
          <div className="flex items-center gap-2 py-2 px-2" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
            <input
              type="text"
              value={addingChildValue}
              onChange={(e) => setAddingChildValue(e.target.value)}
              placeholder="请输入知识点名称"
              className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addingChildValue.trim()) {
                  handleAddNode(node.id, addingChildValue.trim());
                }
                if (e.key === 'Escape') {
                  setAddingChildParentId(null);
                  setAddingChildValue('');
                }
              }}
            />
            <button
              onClick={() => {
                if (addingChildValue.trim()) {
                  handleAddNode(node.id, addingChildValue.trim());
                }
              }}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setAddingChildParentId(null);
                setAddingChildValue('');
              }}
              className="p-1 text-gray-400 hover:bg-gray-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </SortableTreeNode>
    );
  };

  // 学科管理区
  const SubjectManagementArea = () => (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen className="w-4 h-4" />
          <span>共 {mockSubjects[selectedPhase].length} 个学科</span>
        </div>
        {/* 教研员身份下隐藏新增学科按钮 */}
        {!isTeacher && (
          <button
            onClick={() => setShowAddSubjectDialog(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新增学科
          </button>
        )}
      </div>

      {/* 学科卡片列表 */}
      {mockSubjects[selectedPhase].length === 0 ? (
        // 空状态
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            暂无学科
          </h3>
          <p className="text-gray-500 mb-6">
            {phaseConfig[selectedPhase].label}学段尚未添加任何学科
          </p>
          {/* 教研员身份下隐藏添加按钮 */}
          {!isTeacher && (
            <button
              onClick={() => setShowAddSubjectDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              添加第一个学科
            </button>
          )}
        </div>
      ) : (
        // 学科卡片网格
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSubjects[selectedPhase].map((subject) => (
            <div
              key={subject.id}
              className="relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <>
                <div className="p-6">
                  {/* 发布状态标记 */}
                  {(() => {
                    const stateKey = `${selectedPhase}-${subject.id}`;
                    const state = mockKnowledgeTreePublishState[stateKey];
                    if (state?.status === 'pending') {
                      return (
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full shadow-sm">
                            待发布 · {state.pendingChanges}项变更
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* 学科图标和名称 */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 ${subject.color.replace('bg-', 'bg-opacity-10 ')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`p-3 ${subject.color} rounded-lg text-white`}>
                        {subject.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400 font-medium">
                          {phaseConfig[selectedPhase].label}
                        </p>
                        {(() => {
                          const stateKey = `${selectedPhase}-${subject.id}`;
                          const state = mockKnowledgeTreePublishState[stateKey];
                          return state?.currentVersion && (
                            <span className="text-xs text-gray-500">
                              · {state.currentVersion}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 数据统计 */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        知识点总数
                      </span>
                      <span className="font-bold text-lg text-gray-900">
                        {subject.knowledgeCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        最近更新
                      </span>
                      <span className="text-gray-600 font-medium">
                        {subject.lastUpdateTime}
                      </span>
                    </div>
                  </div>

                  {/* 进入管理按钮 */}
                  <button
                    onClick={() => setSelectedSubject(subject)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                  >
                    进入管理
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 装饰背景 */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${subject.color} opacity-5 rounded-full -translate-y-16 translate-x-16`}></div>
              </>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const showStatusBar = !!(
    pageState &&
    !(pageState.status === 'published' && !pageState.scheduledPublish)
  );

  const KnowledgeTreeManagement = () => (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between flex-shrink-0 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setSelectedSubject(null);
              setIsEditingTree(false);
            }}
            className="text-gray-500 hover:text-emerald-600 transition-colors"
          >
            通用知识树
          </button>
          <PrdTooltip data={prd201.backButton} />
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="font-medium text-gray-900">
            管理{selectedSubject?.name}知识树
          </span>
        </div>
        {!isTeacher && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const hasChildren = knowledgeTree && knowledgeTree.length > 0;
                if (hasChildren) {
                  setShowCannotDeleteModal(true);
                } else {
                  setShowDeleteModal(true);
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
            <PrdTooltip data={prd201.deleteButton} />
          </div>
        )}
      </div>

      {(showStatusBar || showEditTip) && (
        <div className="flex flex-col gap-3 flex-shrink-0 pt-3">
          {showStatusBar && pageState && (
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <StatusBar
                  pageState={pageState}
                  onPublish={() => setShowPublishModal(true)}
                  onShowHistory={() => setShowHistoryModal(true)}
                  onCancelScheduled={handleCancelScheduled}
                  isTeacher={isTeacher}
                />
              </div>
              <PrdTooltip data={prd201.statusBar} className="mt-3 shrink-0" />
            </div>
          )}

          {showEditTip && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 relative">
              <button
                type="button"
                onClick={() => setShowEditTip(false)}
                className="absolute right-3 top-3 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-sm text-blue-800 pr-6 flex items-start gap-2">
                <PrdTooltip data={prd201.editTipBar} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                <p className="mb-2">编辑知识树结构（新增、删除、改名、移动节点），不同的下游业务生效时机不同：</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600 font-medium shrink-0">✅ 实时生效：</span>
                  <span>全乐课网平台仅涉及知识树展示、不涉及版本号的下游业务</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-medium shrink-0">⏳ 发布后生效：</span>
                  <span>涉及版本号的下游业务（自适应学习系统）</span>
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 mt-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex">
        <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <span className="font-bold text-gray-900">
                {phaseConfig[selectedPhase].label}{selectedSubject?.name}·知识树
              </span>
              <PrdTooltip data={prd201.subjectInfoCard} className="ml-1" />
            </div>
            {pageState && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span className="font-mono">{pageState.currentVersion.replace(/^v\s*/i, 'v ')}</span>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors ml-1"
                  title="查看历史版本"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          
          {/* 搜索知识点 */}
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="relative flex items-center gap-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索知识点..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <PrdTooltip data={prd201.searchBox} className="shrink-0" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between mb-1 px-1">
              <PrdTooltip data={prd201.knowledgeTreeList} />
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={({ active }) => setDragActiveId(active.id as string)}
              onDragEnd={handleTreeDragEnd}
              onDragCancel={() => setDragActiveId(null)}
            >
              <SortableContext
                items={getAllNodeIds(knowledgeTree)}
                strategy={verticalListSortingStrategy}
              >
                {knowledgeTree.length > 0 ? (
                  <>
                    {knowledgeTree.map(node => renderTreeNode(node))}
                    {/* 编辑模式下显示添加根知识点 - 教研员身份下不显示 */}
                    {isEditingTree && !isTeacher && (
                      <div className="mt-2">
                        {addingChildParentId === 'root' ? (
                          <div className="flex items-center gap-2 py-2 px-3">
                            <input
                              type="text"
                              value={addingChildValue}
                              onChange={(e) => setAddingChildValue(e.target.value)}
                              placeholder="请输入知识点名称"
                              className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && addingChildValue.trim()) {
                                  handleAddNode(null, addingChildValue.trim());
                                }
                                if (e.key === 'Escape') {
                                  setAddingChildParentId(null);
                                  setAddingChildValue('');
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (addingChildValue.trim()) {
                                  handleAddNode(null, addingChildValue.trim());
                                }
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setAddingChildParentId(null);
                                setAddingChildValue('');
                              }}
                              className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingChildParentId('root')}
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            添加根知识点
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p className="text-sm">暂无知识点</p>
                    {/* 教研员身份下不显示立即添加按钮 */}
                    {isEditingTree && !isTeacher && (
                      <button
                        onClick={() => setAddingChildParentId('root')}
                        className="mt-2 text-emerald-600 text-sm hover:underline"
                      >
                        立即添加
                      </button>
                    )}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* 右侧：详情编辑区 */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0">
          {selectedNode ? (
            <>
              {/* 标题区域 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {selectedNode.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      isLeafNode(selectedNode)
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {isLeafNode(selectedNode) ? '末级' : '非末级'}
                    </span>
                    <PrdTooltip data={isEditingDetail ? prd204.editDetailTitle : prd201.detailTitle} className="shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditingDetail ? (
                      <>
                        <span className="req-anchor-inline" data-req-anchor="knowledge-tree.info.export">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportKnowledgeTree}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            导出知识树
                          </Button>
                        </span>
                        <PrdTooltip data={prd201.exportButton} />
                        <span className="req-anchor-inline" data-req-anchor="knowledge-tree.info.edit-entry">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            编辑知识点详情
                          </Button>
                        </span>
                        <PrdTooltip data={prd201.editDetailButton} />
                      </>
                    ) : (
                      <>
                        <span className="req-anchor-inline" data-req-anchor="knowledge-tree.info.export">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportKnowledgeTree}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            导出知识树
                          </Button>
                        </span>
                        <PrdTooltip data={prd201.exportButton} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImportDialog(true)}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          批量导入
                        </Button>
                        <PrdTooltip data={prd204.editBatchImport} />
                        <span className="req-anchor-inline" data-req-anchor="knowledge-tree.info.cancel-edit">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                          >
                            取消
                          </Button>
                        </span>
                        <span className="req-anchor-inline" data-req-anchor="knowledge-tree.info.save-edit">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveWithPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            保存编辑
                          </Button>
                        </span>
                        <PrdTooltip data={prd204.editSaveAction} />
                        <PrdTooltip data={prd204.editGlobalRules} />
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 根知识点引导界面 - 非编辑模式下显示 */}
              {isRootNode(selectedNode) && !isEditingDetail ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    {/* 图标 */}
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <FolderTree className="w-12 h-12 text-emerald-600" />
                    </div>
                    
                    {/* 标题 */}
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      根知识点
                      <PrdTooltip data={prd201.rootNodeGuide} className="ml-1" />
                    </h4>
                    
                    {/* 说明文案 */}
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                      根节点用于组织和分类下属知识点。可展开左侧树结构，选择具体的知识点查看详细信息。
                    </p>
                    
                    {/* 分隔线 */}
                    <div className="border-t border-gray-200 pt-6 mb-6">
                      {/* 统计信息 */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 text-sm">当前节点</span>
                          <span className="font-semibold text-gray-900">{selectedNode.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm">包含子知识点</span>
                          <span className="font-semibold text-emerald-600">{selectedNode.children?.length || 0} 个</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 提示 */}
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                      <Info className="w-4 h-4" />
                      <span>点击左侧展开按钮查看下属知识点</span>
                    </div>
                  </div>
                </div>
              ) : !isLeafNode(selectedNode) ? (
                /* 非末级节点空状态引导界面 */
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    {/* 图标 */}
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <FolderTree className="w-12 h-12 text-blue-600" />
                    </div>
                    
                    {/* 标题 */}
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      非末级知识点
                      <PrdTooltip data={prd201.nonLeafNodeGuide} className="ml-1" />
                    </h4>
                    
                    {/* 说明文案 */}
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                      该知识点包含子节点，知识点信息、知识点结构和学习资源仅在末级知识点维护。请选择具体的末级知识点查看详情。
                    </p>
                    
                    {/* 分隔线 */}
                    <div className="border-t border-gray-200 pt-6 mb-6">
                      {/* 统计信息 */}
                      <div className="bg-gray-50 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-500 text-sm">当前节点</span>
                          <span className="font-semibold text-gray-900">{selectedNode.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-sm">包含子知识点</span>
                          <span className="font-semibold text-blue-600">{selectedNode.children?.length || 0} 个</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 提示 */}
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                      <Info className="w-4 h-4" />
                      <span>展开左侧节点查看子知识点</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tab 切换栏 */}
                  <div className="border-b border-gray-200 px-4">
                    <div className="flex gap-4 items-center">
                        <button
                          onClick={() => setActiveDetailTab('info')}
                          className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeDetailTab === 'info'
                              ? 'text-emerald-600 border-emerald-600'
                              : 'text-gray-500 border-transparent hover:text-gray-700'
                          }`}
                        >
                          知识点信息
                        </button>
                        <button
                          onClick={() => setActiveDetailTab('structure')}
                          className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeDetailTab === 'structure'
                              ? 'text-emerald-600 border-emerald-600'
                              : 'text-gray-500 border-transparent hover:text-gray-700'
                          }`}
                        >
                          知识点结构
                        </button>
                        <button
                          onClick={() => setActiveDetailTab('resource')}
                          className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeDetailTab === 'resource'
                              ? 'text-emerald-600 border-emerald-600'
                              : 'text-gray-500 border-transparent hover:text-gray-700'
                          }`}
                        >
                          学习资源
                        </button>
                        <PrdTooltip data={isEditingDetail ? prd204.editTabSwitch : prd201.leafNodeTabs} />
                    </div>
                  </div>

                  <div
                    ref={detailScrollRef}
                    className="flex-1 min-h-0 overflow-y-auto p-6 [overflow-anchor:none]"
                    data-detail-scroll
                  >
                {/* Tab: 知识点信息 */}
                {activeDetailTab === 'info' && (
                  <div className="space-y-6">
                    {/* 基本信息卡片 */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* 学业要求 - 仅叶子节点显示，位于考频左侧 */}
                      {isLeafNode(selectedNode) && (
                        <div className={`bg-gradient-to-br rounded-xl p-4 border relative overflow-hidden hover:shadow-md transition-shadow ${
                          (isEditingDetail) ? 'from-blue-50 to-white border-blue-300' : 'from-teal-50 to-white border-teal-200'
                        }`} data-req-anchor="knowledge-tree.info.academic-requirement">
                          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-40 ${
                            (isEditingDetail) ? 'bg-blue-100' : 'bg-teal-100'
                          }`}></div>
                          <div className="relative">
                            <div className={`flex items-center gap-2 mb-2 ${
                              (isEditingDetail) ? 'text-blue-600' : 'text-teal-600'
                            }`}>
                              <BookOpen className="w-4 h-4" />
                              <span className={`text-xs font-semibold uppercase tracking-wide ${
                                (isEditingDetail) ? 'text-blue-600' : 'text-teal-600'
                              }`}>学业要求</span>
                              <PrdTooltip data={isEditingDetail ? prd204.editAcademicRequirementCard : prd201.academicRequirementCard} />
                            </div>
                            {(isEditingDetail) ? (
                              <select
                                value={editData.academicRequirement ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value as AcademicRequirement | '';
                                  setEditData({
                                    ...editData,
                                    academicRequirement: v || undefined,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="">未设置</option>
                                <option value="know">了解</option>
                                <option value="understand">理解</option>
                                <option value="master">掌握</option>
                                <option value="apply">运用</option>
                              </select>
                            ) : (
                              <div className={`text-2xl font-bold leading-none ${
                                selectedNode.academicRequirement ? 'text-teal-700' : 'text-gray-400'
                              }`}>
                                {selectedNode.academicRequirement
                                  ? academicRequirementMap[selectedNode.academicRequirement]
                                  : '【未设置】'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 考频 - 仅叶子节点显示 */}
                      {isLeafNode(selectedNode) && (
                        <div className={`bg-gradient-to-br rounded-xl p-4 border relative overflow-hidden hover:shadow-md transition-shadow ${
                          (isEditingDetail) ? 'from-blue-50 to-white border-blue-300' : 'from-orange-50 to-white border-orange-200'
                        }`} data-req-anchor="knowledge-tree.info.exam-frequency">
                          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-40 ${
                            (isEditingDetail) ? 'bg-blue-100' : 'bg-orange-100'
                          }`}></div>
                          <div className="relative">
                            <div className={`flex items-center gap-2 mb-2 ${
                              (isEditingDetail) ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              <Clock className="w-4 h-4" />
                              <span className={`text-xs font-semibold uppercase tracking-wide ${
                                (isEditingDetail) ? 'text-blue-600' : 'text-orange-600'
                              }`}>考频</span>
                              <PrdTooltip data={isEditingDetail ? prd204.editExamFrequencyCard : prd201.examFrequencyCard} />
                            </div>
                            {(isEditingDetail) ? (
                              <select
                                value={editData.examFrequency ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value as 'low' | 'medium' | 'high' | '';
                                  setEditData({
                                    ...editData,
                                    examFrequency: v || undefined,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="">未设置</option>
                                <option value="low">低频</option>
                                <option value="medium">中频</option>
                                <option value="high">高频</option>
                              </select>
                            ) : (
                              <div className={`text-2xl font-bold leading-none ${
                                selectedNode.examFrequency === 'high' ? 'text-red-600' :
                                selectedNode.examFrequency === 'medium' ? 'text-orange-600' :
                                selectedNode.examFrequency === 'low' ? 'text-green-600' :
                                'text-gray-400'
                              }`}>
                                {selectedNode.examFrequency === 'high' ? '高频' :
                                 selectedNode.examFrequency === 'medium' ? '中频' :
                                 selectedNode.examFrequency === 'low' ? '低频' :
                                 '【未设置】'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 关联出题策略 - 仅叶子节点显示 */}
                      {isLeafNode(selectedNode) && (
                        <div className={`col-span-2 bg-gradient-to-br rounded-xl p-4 border relative overflow-hidden hover:shadow-md transition-shadow ${
                          (editData.strategyType ?? selectedNode.strategyType) === 'general'
                            ? 'from-emerald-50 to-white border-emerald-200'
                          : 'from-purple-50 to-white border-purple-200'
                      }`}>
                        <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-40 ${
                          (editData.strategyType ?? selectedNode.strategyType) === 'general' ? 'bg-emerald-100' : 'bg-purple-100'
                        }`}></div>
                        <div className="relative">
                          <div className={`flex items-center gap-2 mb-2 ${
                            (editData.strategyType ?? selectedNode.strategyType) === 'general' ? 'text-emerald-600' : 'text-purple-600'
                          }`}>
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">选题策略</span>
                            <PrdTooltip data={isEditingDetail ? prd204.editStrategyCard : prd201.strategyCard} />
                          </div>
                          {(isEditingDetail) ? (
                            <>
                              <select
                                value={editData.strategyType ?? selectedNode.strategyType}
                                onChange={(e) => setEditData({ ...editData, strategyType: e.target.value as 'general' | 'personalized' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                              >
                                <option value="general">通用策略</option>
                                <option value="personalized">个性化策略</option>
                              </select>
                              
                              {/* 个性化策略选择器 */}
                              {(editData.strategyType ?? selectedNode.strategyType) === 'personalized' && (
                                <div className="mt-3 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">选择策略</span>
                                    <PrdTooltip data={prd204.editPersonalizedStrategySelector} />
                                  </div>
                                  {/* 模糊搜索选择器 */}
                                  <Popover open={showStrategySearch} onOpenChange={setShowStrategySearch}>
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white flex items-center justify-between ${
                                          !editData.personalizedStrategies?.[0] && !selectedNode.personalizedStrategies?.[0] ? 'text-gray-400' : 'text-gray-900'
                                        }`}
                                      >
                                        <span className="truncate">
                                          {editData.personalizedStrategies?.[0] || selectedNode.personalizedStrategies?.[0]
                                            ? personalizedStrategies.find(s => s.id === (editData.personalizedStrategies?.[0] || selectedNode.personalizedStrategies?.[0]))?.name
                                            : '请选择策略（支持模糊搜索）'}
                                        </span>
                                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="搜索策略名称..." className="border-0" />
                                        <CommandList>
                                          <CommandEmpty>未找到匹配的策略</CommandEmpty>
                                          <CommandGroup>
                                            {personalizedStrategies.map((strategy) => (
                                              <CommandItem
                                                key={strategy.id}
                                                value={strategy.name}
                                                onSelect={() => {
                                                  setEditData({ ...editData, personalizedStrategies: [strategy.id] });
                                                  setShowStrategySearch(false);
                                                }}
                                                className="cursor-pointer"
                                              >
                                                <Check
                                                  className={`mr-2 h-4 w-4 flex-shrink-0 ${
                                                    (editData.personalizedStrategies?.[0] || selectedNode.personalizedStrategies?.[0]) === strategy.id
                                                      ? 'opacity-100'
                                                      : 'opacity-0'
                                                  }`}
                                                />
                                                <span className="text-sm font-medium flex-1">{strategy.name}</span>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                selectedNode?.strategyType === 'general' ? 'bg-emerald-600' : 'bg-purple-600'
                              }`}></div>
                              {selectedNode?.strategyType === 'general' ? '通用策略' : '同步学个性化策略（强化基础）'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 策略详情面板 - 始终为查看态 */}
                  {(editData.strategyType ?? selectedNode?.strategyType) === 'general' && (
                    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-center">
                        <h4 className="text-sm font-semibold text-gray-700 text-center">策略详情</h4>
                        <PrdTooltip data={isEditingDetail ? prd204.editStrategyDetail : prd201.strategyDetail} className="shrink-0 ml-1" />
                      </div>
                      <div className="p-3 space-y-3">
                      {mockStrategyDetails.map((range) => {
                        const totalCount = range.questionConfigs.reduce((sum, q) => sum + q.questionCount, 0);
                        return (
                          <div key={range.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            {/* 区间头 */}
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 flex items-center gap-2">
                              <div className="w-1 h-5 bg-white/80 rounded-full" />
                              <span className="text-sm font-semibold text-white">
                                掌握度区间 {range.masteryStart}% — {range.masteryEnd}%
                              </span>
                              <span className="text-xs font-medium text-white/90 bg-white/20 px-2 py-0.5 rounded-full ml-1">
                                共{totalCount}题
                              </span>
                            </div>
                            {/* 题型子表 */}
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 w-24">题型</th>
                                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-16">题量</th>
                                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-600">难度分布</th>
                                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-[180px]">题目来源</th>
                                  <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-[140px]">知识点复合度</th>
                                </tr>
                              </thead>
                              <tbody>
                                {range.questionConfigs.map((q, qIdx) => (
                                  <tr key={qIdx} className={qIdx < range.questionConfigs.length - 1 ? 'border-b border-gray-100' : ''}>
                                    <td className="px-4 py-2.5 text-gray-800">{q.questionType}</td>
                                    <td className="px-4 py-2.5 text-center text-gray-800">{q.questionCount}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      <div className="flex items-center justify-center gap-2 flex-wrap">
                                        {q.difficulty.easy > 0 && <span className="text-xs"><span className="text-green-600 font-medium">易</span>{q.difficulty.easy}</span>}
                                        {q.difficulty.easier > 0 && <span className="text-xs"><span className="text-green-500 font-medium">较易</span>{q.difficulty.easier}</span>}
                                        {q.difficulty.medium > 0 && <span className="text-xs"><span className="text-yellow-600 font-medium">中档</span>{q.difficulty.medium}</span>}
                                        {q.difficulty.harder > 0 && <span className="text-xs"><span className="text-orange-500 font-medium">较难</span>{q.difficulty.harder}</span>}
                                        {q.difficulty.hard > 0 && <span className="text-xs"><span className="text-red-500 font-medium">难</span>{q.difficulty.hard}</span>}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs">
                                      {q.questionSources.join('、')}
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-gray-700 text-xs">
                                      {q.knowledgeComplexity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}

                  {/* 个性化策略详情面板 - 始终为查看态 */}
                  {(editData.strategyType ?? selectedNode?.strategyType) === 'personalized' && (editData.personalizedStrategies?.[0] || selectedNode?.personalizedStrategies?.[0]) && (() => {
                    const currentStrategy = editData.personalizedStrategies?.[0] || selectedNode?.personalizedStrategies?.[0];
                    const strategyData = personalizedStrategies.find(s => s.id === currentStrategy);
                    if (!strategyData) return null;
                    return (
                      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-center">
                          <h4 className="text-sm font-semibold text-gray-700 text-center">策略详情</h4>
                          <PrdTooltip data={isEditingDetail ? prd204.editStrategyDetail : prd201.strategyDetail} className="shrink-0 ml-1" />
                        </div>
                        <div className="p-3 space-y-3">
                        {strategyData.masteryRanges.map((range) => {
                          const totalCount = range.questionConfigs.reduce((sum, q) => sum + q.questionCount, 0);
                          return (
                            <div key={range.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              {/* 区间头 */}
                              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 flex items-center gap-2">
                                <div className="w-1 h-5 bg-white/80 rounded-full" />
                                <span className="text-sm font-semibold text-white">
                                  掌握度区间 {range.masteryStart}% — {range.masteryEnd}%
                                </span>
                                <span className="text-xs font-medium text-white/90 bg-white/20 px-2 py-0.5 rounded-full ml-1">
                                  共{totalCount}题
                                </span>
                              </div>
                              {/* 题型子表 */}
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 w-24">题型</th>
                                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-16">题量</th>
                                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-600">难度分布</th>
                                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-[180px]">题目来源</th>
                                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-[140px]">知识点复合度</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {range.questionConfigs.map((q, qIdx) => (
                                    <tr key={qIdx} className={qIdx < range.questionConfigs.length - 1 ? 'border-b border-gray-100' : ''}>
                                      <td className="px-4 py-2.5 text-gray-800">{q.questionType}</td>
                                      <td className="px-4 py-2.5 text-center text-gray-800">{q.questionCount}</td>
                                      <td className="px-4 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                          {q.difficulty.easy > 0 && <span className="text-xs"><span className="text-green-600 font-medium">易</span>{q.difficulty.easy}</span>}
                                          {q.difficulty.easier > 0 && <span className="text-xs"><span className="text-green-500 font-medium">较易</span>{q.difficulty.easier}</span>}
                                          {q.difficulty.medium > 0 && <span className="text-xs"><span className="text-yellow-600 font-medium">中档</span>{q.difficulty.medium}</span>}
                                          {q.difficulty.harder > 0 && <span className="text-xs"><span className="text-orange-500 font-medium">较难</span>{q.difficulty.harder}</span>}
                                          {q.difficulty.hard > 0 && <span className="text-xs"><span className="text-red-500 font-medium">难</span>{q.difficulty.hard}</span>}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2.5 text-center text-gray-700 text-xs">
                                        {q.questionSources.join('、')}
                                      </td>
                                      <td className="px-4 py-2.5 text-center text-gray-700 text-xs">
                                        {q.knowledgeComplexity}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                        {/* 策略说明和适用场景 */}
                        <div className="border border-gray-200 rounded-lg bg-gray-50/50 p-4 space-y-3">
                          <div>
                            <label className="text-sm font-semibold text-gray-700">策略说明</label>
                            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                              {strategyData.strategyDescription}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-700">适用场景</label>
                            <ul className="mt-1 text-sm text-gray-600 space-y-1">
                              {strategyData.applicableScenarios.map((scenario, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5">•</span>
                                  <span>{scenario}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                )}

                {/* Tab: 知识点结构 */}
                {activeDetailTab === 'structure' && (
                  <div className="space-y-4">
                    {/* 知识点关联关系 - 左右布局 */}
                    <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      {/* 标题 */}
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-orange-500"></div>
                        <label className="block text-sm font-semibold text-gray-700">
                          知识点关联关系
                        </label>
                        <PrdTooltip data={prd201.knowledgeStructureTab} />
                      </div>

                      {/* 提示说明 */}
                      <p className="text-xs text-gray-400 text-center mb-4">
                        右上角按钮可编辑当前知识点的前置知识；单击图中知识点，可直接在本页编辑对应知识点的前置知识
                      </p>

                      {/* 图例说明 - 顶部横向排列 */}
                      <div className="flex items-center justify-center gap-6 mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-400"></div>
                          <span className="text-xs text-gray-600">前置</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-purple-600"></div>
                          <span className="text-xs text-gray-600">当前</span>
                        </div>
                        {(isEditingDetail) && (
                          <div className="flex gap-2 ml-4 pl-4 border-l border-gray-300">
                            <button
                              onClick={() => openKnowledgeSelector('prerequisite')}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                              编辑前置知识点
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 网状图组件 */}
                      <KnowledgeNetworkGraph
                        key={`graph-${graphUpdateKey}`}
                        currentKnowledge={{
                          id: selectedNode?.id || '',
                          name: selectedNode?.name || ''
                        }}
                        directPrerequisiteKnowledge={(() => {
                          const isDetailEditing = isEditingDetail;
                          const data = isDetailEditing ? editData.prerequisiteKnowledge : selectedNode?.prerequisiteKnowledge;
                          console.log('[directPrerequisiteKnowledge]', { 
                            isDetailEditing, 
                            editDataPrereq: editData.prerequisiteKnowledge,
                            selectedNodePrereq: selectedNode?.prerequisiteKnowledge,
                            result: data
                          });
                          return data;
                        })()}
                        directExtensionKnowledge={(isEditingDetail) ? editData.extensionKnowledge : selectedNode?.extensionKnowledge}
                        convergenceNode={(() => {
                          const node = selectedNode?.convergenceKnowledge;
                          if (!node) return undefined;
                          return {
                            id: node.id,
                            name: node.name
                          };
                        })()}
                        findNodeById={findNodeById}
                        isEditMode={isEditingDetail}
                        onRemovePrerequisite={(nodeId: string, branchId: string) => {
                          const list = editData.prerequisiteKnowledge || [];
                          console.log('[onRemovePrerequisite 回调]', { 
                            nodeId, 
                            branchId,
                            currentList: list,
                            listLength: list.length,
                            listIds: list.map(p => p.id)
                          });
                          const newList = list.filter(p => p.id !== nodeId);
                          console.log('[过滤后的列表]', newList);
                          setEditData({
                            ...editData,
                            prerequisiteKnowledge: newList
                          });
                        }}
                        onRemoveExtension={(nodeId: string, branchId: string) => {
                          const list = editData.extensionKnowledge || [];
                          setEditData({
                            ...editData,
                            extensionKnowledge: list.filter(p => p.id !== nodeId)
                          });
                        }}
                        onEditPrerequisite={(node) => {
                          // 点击其他知识点的"编辑前置知识点"气泡
                          // 设置临时编辑节点，打开编辑前置知识点弹窗
                          const targetNode = findNodeById(node.id);
                          if (targetNode) {
                            // 找到了 knowledgeTree 中的节点
                            setTempEditNode(targetNode);
                          } else {
                            // 没找到，使用传入的节点信息创建临时节点
                            // 这种情况是关联知识点不在当前知识树中
                            setTempEditNode({
                              id: node.id,
                              name: node.name,
                              examFrequency: 'medium',
                              prerequisiteKnowledge: [],
                              extensionKnowledge: [],
                            });
                          }
                          setSelectorType('prerequisite');
                          // 尝试加载该节点的前置知识点
                          const currentList = targetNode?.prerequisiteKnowledge || [];
                          const stepMap = new Map<string, KnowledgeRelation[]>();
                          currentList.forEach((item, index) => {
                            const stepId = item.stepId || `step-${index}`;
                            if (!stepMap.has(stepId)) {
                              stepMap.set(stepId, []);
                            }
                            stepMap.get(stepId)!.push(item);
                          });
                          const steps: LearningStep[] = Array.from(stepMap.entries()).map(([stepId, items]) => ({
                            id: stepId,
                            items: items
                          }));
                          steps.sort((a, b) => {
                            const orderA = a.items[0]?.stepOrder ?? 0;
                            const orderB = b.items[0]?.stepOrder ?? 0;
                            return orderA - orderB;
                          });
                          setSelectedSteps(steps);
                          setShowKnowledgeSelector(true);
                          setKnowledgeSearchKeyword('');
                        }}
                        onRemovePrerequisiteFromNode={(targetNodeId, prereqId) => {
                          console.log('[onRemovePrerequisiteFromNode 回调开始]', { targetNodeId, prereqId, isEditingDetail: isEditingDetail });
                          
                          // 场景：当前在 B 知识点详情页面，点击 A 节点的删除按钮
                          // A 是 C 的前置知识点，C 是 B 的前置知识点
                          // targetNodeId = C 的 ID，prereqId = A 的 ID
                          // 需要从 C 的 prerequisiteKnowledge 中删除 A
                          
                          let foundAndRemoved = false;
                          
                          // 获取要删除的前置知识点的名称（用于名称匹配）
                          // prereqId 可能是路径格式（如 "图形与几何 > 三角形"）或简单格式（如 "1-0-1"）
                          const prereqName = prereqId.includes('>') 
                            ? prereqId.split(' > ').pop() 
                            : null;
                          
                          console.log('[前置知识点ID格式分析]', { 
                            prereqId, 
                            isPathFormat: prereqId.includes('>'),
                            prereqName 
                          });
                          
                          // 2. 遍历整个 knowledgeTree，找到 prerequisiteKnowledge 中包含 prereqId 或 prereqName 的节点
                          const removeFromPrereqList = (nodes: KnowledgeNode[]): KnowledgeNode[] => {
                            if (foundAndRemoved) return nodes;
                            
                            return nodes.map(node => {
                              if (foundAndRemoved) return node;
                              
                              const prereqList = node.prerequisiteKnowledge || [];
                              // 同时检查 ID 匹配和名称匹配
                              const hasPrereq = prereqList.some(p => 
                                p.id === prereqId || p.name === prereqName
                              );
                              
                              if (hasPrereq) {
                                foundAndRemoved = true;
                                console.log('[找到包含该前置知识点的节点]', { 
                                  nodeId: node.id, 
                                  nodeName: node.name,
                                  prereqList: prereqList.map(p => ({ id: p.id, name: p.name }))
                                });
                                
                                // 同时通过 ID 和名称过滤
                                const updatedPrereq = prereqList.filter(p => 
                                  p.id !== prereqId && p.name !== prereqName
                                );
                                console.log('[删除前置知识点]', { 
                                  removedId: prereqId,
                                  removedName: prereqName,
                                  beforeCount: prereqList.length, 
                                  afterCount: updatedPrereq.length 
                                });
                                
                                return { ...node, prerequisiteKnowledge: updatedPrereq };
                              }
                              
                              if (node.children) {
                                return { ...node, children: removeFromPrereqList(node.children) };
                              }
                              
                              return node;
                            });
                          };
                          
                          const newTree = removeFromPrereqList(knowledgeTree);
                          
                          if (foundAndRemoved) {
                            console.log('[设置新的知识树]');
                            setKnowledgeTree(newTree);
                            
                            // 更新 selectedNode
                            if (selectedNode) {
                              const findInTree = (nodes: KnowledgeNode[], id: string): KnowledgeNode | null => {
                                for (const n of nodes) {
                                  if (n.id === id) return n;
                                  if (n.children) {
                                    const found = findInTree(n.children, id);
                                    if (found) return found;
                                  }
                                }
                                return null;
                              };
                              const updatedSelectedNode = findInTree(newTree, selectedNode.id);
                              if (updatedSelectedNode) {
                                setSelectedNode({ ...updatedSelectedNode });
                              }
                            }
                            
                            setGraphUpdateKey(prev => prev + 1);
                            console.log('[删除操作完成]');
                          } else {
                            // 3. 如果在 knowledgeTree 中找不到，检查 externalKnowledgeNodes
                            console.log('[在 knowledgeTree 中未找到，检查 externalKnowledgeNodes]');
                            const externalNode = externalKnowledgeNodes.get(targetNodeId);
                            if (externalNode && externalNode.prerequisiteKnowledge) {
                              const hasPrereq = externalNode.prerequisiteKnowledge.some(p => 
                                p.id === prereqId || p.name === prereqName
                              );
                              if (hasPrereq) {
                                console.log('[在 externalKnowledgeNodes 中找到]', { targetNodeId, prereqId });
                                const updatedPrereq = externalNode.prerequisiteKnowledge.filter(p => 
                                  p.id !== prereqId && p.name !== prereqName
                                );
                                externalKnowledgeNodes.set(targetNodeId, { 
                                  ...externalNode, 
                                  prerequisiteKnowledge: updatedPrereq 
                                });
                                setExternalKnowledgeNodes(new Map(externalKnowledgeNodes));
                                setGraphUpdateKey(prev => prev + 1);
                                console.log('[从 externalKnowledgeNodes 删除完成]');
                              }
                            } else {
                              console.log('[未找到包含该前置知识点的节点]', { prereqId, prereqName });
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tab: 学习资源 */}
                {activeDetailTab === 'resource' && (
                  <div className="space-y-6">
                    {isEditingDetail && <PrdTooltip data={prd204.editLearningResourceContent} />}
                    <KnowledgeCardPanel
                      key={selectedNode.id}
                      nodeId={selectedNode.id}
                      isEditing={isEditingDetail}
                      value={
                        isEditingDetail
                          ? editData.knowledgeCard
                          : selectedNode.knowledgeCard
                      }
                      onChange={handleKnowledgeCardChange}
                    />
                    {/* 视频讲解 */}
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">视频讲解</h4>
                          <PrdTooltip data={isEditingDetail ? prd204.editLearningResourceVideo : prd201.learningResourceTab} />
                          {isEditingDetail && (
                            <span className="text-xs text-muted-foreground ml-1">删除视频，仅代表在当前页面解除关联关系，不影响原视频在资源库中的存在。</span>
                          )}
                        </div>
                        {(isEditingDetail) && (editData.videoContents?.length || 0) > 0 && (
                          <span className="text-sm text-gray-500">已添加 {(editData.videoContents?.length || 0)} 个</span>
                        )}
                        {!(isEditingDetail) && (selectedNode.videoContents?.length || 0) > 0 && (
                          <span className="text-sm text-gray-500">共 {(selectedNode.videoContents?.length || 0)} 个视频</span>
                        )}
                      </div>
                      
                      {(isEditingDetail) ? (
                        // 编辑模式
                        <>
                          {(editData.videoContents?.length || 0) > 0 ? (
                            // 已有视频列表 - 横条模式
                            <div className="space-y-2">
                              {editData.videoContents?.map((video, index) => (
                                <div 
                                  key={video.id} 
                                  className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all px-4 py-3"
                                >
                                  <div className="flex items-center gap-3">
                                    {/* 播放按钮 */}
                                    <button
                                      onClick={() => setPlayingVideo(video)}
                                      className="w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                                      title="点击播放"
                                    >
                                      <Play className="w-5 h-5 text-purple-600 ml-0.5" />
                                    </button>
                                    
                                    {/* 视频信息 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {editingVideoNameId === video.id ? (
                                          <div className="flex items-center gap-1 flex-1 min-w-0">
                                            <input
                                              type="text"
                                              value={editingVideoNameValue}
                                              onChange={(e) => {
                                                setEditingVideoNameValue(e.target.value);
                                                setVideoNameEmptyError(false);
                                              }}
                                              className="text-sm font-medium text-gray-900 border border-purple-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-purple-400 flex-1 min-w-0"
                                              autoFocus
                                            />
                                            <button
                                              onClick={() => {
                                                const trimmed = editingVideoNameValue.trim();
                                                if (!trimmed) {
                                                  setVideoNameEmptyError(true);
                                                  return;
                                                }
                                                setEditData(prev => ({
                                                  ...prev,
                                                  videoContents: (prev.videoContents || []).map(v =>
                                                    v.id === video.id ? { ...v, name: trimmed } : v
                                                  )
                                                }));
                                                setEditingVideoNameId(null);
                                                setVideoNameEmptyError(false);
                                              }}
                                              className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors flex-shrink-0"
                                              title="保存"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                // 恢复进入编辑态之前的名称
                                                setEditData(prev => ({
                                                  ...prev,
                                                  videoContents: (prev.videoContents || []).map(v =>
                                                    v.id === video.id ? { ...v, name: editingVideoNameOriginal } : v
                                                  )
                                                }));
                                                setEditingVideoNameId(null);
                                                setVideoNameEmptyError(false);
                                              }}
                                              className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                              title="取消"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                            {videoNameEmptyError && (
                                              <span className="text-xs text-red-500 flex-shrink-0">视频名称不能为空</span>
                                            )}
                                          </div>
                                        ) : (
                                          <>
                                            <p className="text-sm font-medium text-gray-900 truncate" title={video.name}>
                                              {video.name}
                                            </p>
                                            <button
                                              onClick={() => {
                                                setEditingVideoNameId(video.id);
                                                setEditingVideoNameValue(video.name);
                                                setEditingVideoNameOriginal(video.name);
                                                setVideoNameEmptyError(false);
                                              }}
                                              className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors flex-shrink-0"
                                              title="编辑名称"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                        <span className={`px-1.5 py-0.5 text-xs rounded flex-shrink-0 ${
                                          video.sourceType === 'upload' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {video.sourceType === 'upload' ? '上传' : '资源库'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        {video.duration && <span>{video.duration}</span>}
                                        {video.size && <span>•</span>}
                                        {video.size && <span>{video.size}</span>}
                                      </div>
                                    </div>
                                    
                                    {/* 操作按钮 */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => {
                                          const videos = [...(editData.videoContents || [])];
                                          if (index > 0) {
                                            [videos[index - 1], videos[index]] = [videos[index], videos[index - 1]];
                                            setEditData({ ...editData, videoContents: videos });
                                          }
                                        }}
                                        disabled={index === 0}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="上移"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const videos = [...(editData.videoContents || [])];
                                          if (index < videos.length - 1) {
                                            [videos[index], videos[index + 1]] = [videos[index + 1], videos[index]];
                                            setEditData({ ...editData, videoContents: videos });
                                          }
                                        }}
                                        disabled={index === (editData.videoContents?.length || 0) - 1}
                                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="下移"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditData(prev => ({
                                            ...prev,
                                            videoContents: (prev.videoContents || []).filter(v => v !== video)
                                          }));
                                        }}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="删除"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* 添加更多视频 */}
                              <div className="border-2 border-dashed border-purple-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 text-center mb-3">添加更多视频</p>
                                <div className="flex justify-center gap-3">
                                  <button
                                    onClick={() => {
                                      // 触发上传视频
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'video/*';
                                      input.multiple = true;
                                      input.onchange = (e) => {
                                        const files = (e.target as HTMLInputElement).files;
                                        if (files && files.length > 0) {
                                          setIsUploadingVideo(true);
                                          setVideoUploadProgress(0);
                                          
                                          const interval = setInterval(() => {
                                            setVideoUploadProgress(prev => {
                                              if (prev >= 100) {
                                                clearInterval(interval);
                                                setIsUploadingVideo(false);
                                                
                                                // Mock 上传视频
                                                const newVideos: VideoContent[] = Array.from(files).map((file, i) => ({
                                                  id: `upload-${Date.now()}-${i}`,
                                                  sourceType: 'upload' as const,
                                                  url: URL.createObjectURL(file),
                                                  name: file.name,
                                                  size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                                                  duration: '00:00',
                                                }));
                                                
                                                setEditData({
                                                  ...editData,
                                                  videoContents: [...(editData.videoContents || []), ...newVideos]
                                                });
                                                return 100;
                                              }
                                              return prev + 10;
                                            });
                                          }, 150);
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-1.5"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    上传视频
                                  </button>
                                  <button
                                    onClick={() => setShowVideoSelectModal(true)}
                                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium flex items-center gap-1.5"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    从资源库选择
                                  </button>
                                </div>
                              </div>
                              
                              {/* 上传进度 */}
                              {isUploadingVideo && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-gray-500">视频上传中... {videoUploadProgress}%</p>
                                    <div className="flex items-center gap-2">
                                      <PrdTooltip data={prd204.uploadVideoProcess} />
                                      <button
                                        onClick={() => {
                                          setIsUploadingVideo(false);
                                          setVideoUploadProgress(0);
                                        }}
                                        className="text-xs text-red-500 hover:text-red-600"
                                      >
                                        取消上传
                                      </button>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-purple-600 transition-all duration-200"
                                      style={{ width: `${videoUploadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            // 未添加视频
                            <div className="border-2 border-dashed border-purple-200 rounded-lg p-8 text-center">
                              <div className="flex justify-center gap-8 mb-6">
                                {/* 上传视频入口 */}
                                <div 
                                  className="cursor-pointer group"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'video/*';
                                    input.multiple = true;
                                    input.onchange = (e) => {
                                      const files = (e.target as HTMLInputElement).files;
                                      if (files && files.length > 0) {
                                        setIsUploadingVideo(true);
                                        setVideoUploadProgress(0);
                                        
                                        const interval = setInterval(() => {
                                          setVideoUploadProgress(prev => {
                                            if (prev >= 100) {
                                              clearInterval(interval);
                                              setIsUploadingVideo(false);
                                              
                                              const newVideos: VideoContent[] = Array.from(files).map((file, i) => ({
                                                id: `upload-${Date.now()}-${i}`,
                                                sourceType: 'upload' as const,
                                                url: URL.createObjectURL(file),
                                                name: file.name,
                                                size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                                                duration: '00:00',
                                              }));
                                              
                                              setEditData({
                                                ...editData,
                                                videoContents: newVideos
                                              });
                                              return 100;
                                            }
                                            return prev + 10;
                                          });
                                        }, 150);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <div className="w-20 h-20 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors mx-auto">
                                    <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-medium text-gray-700 group-hover:text-purple-600">上传视频</p>
                                </div>
                                
                                {/* 资源库选择入口 */}
                                <div 
                                  className="cursor-pointer group"
                                  onClick={() => setShowVideoSelectModal(true)}
                                >
                                  <div className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors mx-auto">
                                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-medium text-gray-700 group-hover:text-green-600">资源库选择</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500">支持上传视频或从资源库选择，可添加多个视频<PrdTooltip data={prd204.uploadVideoProcess} className="ml-1" /></p>
                              <p className="text-xs text-gray-400 mt-2">支持 mp4、avi、mov 等常见视频格式</p>
                              
                              {/* 上传进度 */}
                              {isUploadingVideo && (
                                <div className="mt-4 max-w-xs mx-auto">
                                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-purple-600 transition-all duration-200"
                                      style={{ width: `${videoUploadProgress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">视频上传中... {videoUploadProgress}%</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        // 只读模式 - 视频横条列表
                        (() => {
                          const videos = selectedNode.videoContents || [];
                          
                          if (videos.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-400">
                                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">暂无视频讲解</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-2">
                              {videos.map((video, index) => (
                                <div 
                                  key={video.id}
                                  className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all px-4 py-3 cursor-pointer"
                                  onClick={() => setPlayingVideo(video)}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* 播放按钮 */}
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Play className="w-5 h-5 text-purple-600 ml-0.5" />
                                    </div>
                                    
                                    {/* 视频信息 */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate" title={video.name}>
                                        {video.name}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        {video.duration && <span>{video.duration}</span>}
                                        {video.size && <span>•</span>}
                                        {video.size && <span>{video.size}</span>}
                                      </div>
                                    </div>
                                    
                                    {/* 播放提示 */}
                                    <div className="text-xs text-gray-400 flex-shrink-0">
                                      点击播放
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">请选择一个知识点</p>
            <p className="text-gray-400 text-sm mt-1">在左侧树形结构中选择知识点查看详情</p>
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={selectedSubject ? 'flex flex-col h-full min-h-0' : 'space-y-4'}>
      {/* 顶部学段筛选 - 仅在未选择学科时显示 */}
      {!selectedSubject && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1">
              {subjectNameConfig['basic'].map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedSubjectName(name);
                    setSelectedSubject(null);
                    setSelectedNode(null);
                  }}
                  className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedSubjectName === name
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAggregateHistory(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              查看历史发布记录
            </button>
          </div>
        </div>
      )}

      {/* 策略预览弹窗 */}
      {showStrategyPreview && (() => {
        // 判断是通用策略还是个性化策略
        const isGeneralStrategy = previewStrategy === 'general';
        const strategy = isGeneralStrategy ? null : personalizedStrategies.find(s => s.id === previewStrategy);
        
        // 如果是个性化策略但未找到，返回null
        if (!isGeneralStrategy && !strategy) return null;

        // 获取策略数据
        const masteryRanges: StrategyMasteryRange[] = isGeneralStrategy ? mockStrategyDetails : strategy!.masteryRanges;
        const strategyName = isGeneralStrategy ? '通用出题策略' : strategy!.name;
        const strategyDescription = isGeneralStrategy 
          ? '通用策略适用于大多数学习场景，根据学生掌握度区间自动调整题目数量、难度和类型。掌握度越低，题目越基础；掌握度越高，题目越综合。'
          : strategy!.strategyDescription;
        const applicableScenarios = isGeneralStrategy
          ? [
              '适用于大多数学生的常规学习场景',
              '掌握度评估后自动匹配对应区间',
              '无需手动选择，系统自动应用'
            ]
          : strategy!.applicableScenarios;
        const headerGradient = isGeneralStrategy
          ? 'from-emerald-500 to-emerald-600'
          : 'from-purple-500 to-purple-600';

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">策略预览：{strategyName}</h3>
                <button
                  onClick={() => {
                    setShowStrategyPreview(false);
                    setPreviewStrategy(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* 策略参数 - 按掌握度区间分组 */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700">策略参数</div>
                {masteryRanges.map((range) => {
                  const totalCount = range.questionConfigs.reduce((sum, q) => sum + q.questionCount, 0);
                  return (
                    <div key={range.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      {/* 区间头 */}
                      <div className={`bg-gradient-to-r ${headerGradient} px-4 py-2.5 flex items-center gap-2`}>
                        <div className="w-1 h-5 bg-white/80 rounded-full" />
                        <span className="text-sm font-semibold text-white">
                          掌握度区间 {range.masteryStart}% — {range.masteryEnd}%
                        </span>
                        <span className="ml-auto text-xs font-medium text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                          共{totalCount}题
                        </span>
                      </div>
                      {/* 题型子表 */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 w-24">题型</th>
                            <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-16">题量</th>
                            <th className="px-4 py-2 text-center text-xs font-bold text-gray-600">难度分布</th>
                            <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-[180px]">题目来源</th>
                            <th className="px-4 py-2 text-center text-xs font-bold text-gray-600 w-[140px]">知识点复合度</th>
                          </tr>
                        </thead>
                        <tbody>
                          {range.questionConfigs.map((q, qIdx) => (
                            <tr key={qIdx} className={qIdx < range.questionConfigs.length - 1 ? 'border-b border-gray-100' : ''}>
                              <td className="px-4 py-2.5 text-gray-800">{q.questionType}</td>
                              <td className="px-4 py-2.5 text-center text-gray-800">{q.questionCount}</td>
                              <td className="px-4 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  {q.difficulty.easy > 0 && <span className="text-xs"><span className="text-green-600 font-medium">易</span>{q.difficulty.easy}</span>}
                                  {q.difficulty.easier > 0 && <span className="text-xs"><span className="text-green-500 font-medium">较易</span>{q.difficulty.easier}</span>}
                                  {q.difficulty.medium > 0 && <span className="text-xs"><span className="text-yellow-600 font-medium">中档</span>{q.difficulty.medium}</span>}
                                  {q.difficulty.harder > 0 && <span className="text-xs"><span className="text-orange-500 font-medium">较难</span>{q.difficulty.harder}</span>}
                                  {q.difficulty.hard > 0 && <span className="text-xs"><span className="text-red-500 font-medium">难</span>{q.difficulty.hard}</span>}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center text-gray-700 text-xs">
                                {q.questionSources.join('、')}
                              </td>
                              <td className="px-4 py-2.5 text-center text-gray-700 text-xs">
                                {q.knowledgeComplexity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* 策略说明 */}
              <div className={`border rounded-lg p-4 ${isGeneralStrategy ? 'bg-emerald-50 border-emerald-200' : 'bg-purple-50 border-purple-200'}`}>
                <h4 className={`text-sm font-semibold mb-2 ${isGeneralStrategy ? 'text-emerald-900' : 'text-purple-900'}`}>策略说明</h4>
                <p className="text-sm text-gray-700">{strategyDescription}</p>
              </div>

              {/* 适用场景 */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">适用场景</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {applicableScenarios.map((scenario, index) => (
                    <li key={index}>• {scenario}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowStrategyPreview(false);
                  setPreviewStrategy(null);
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${isGeneralStrategy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* 知识点选择器弹窗 - 左右布局 */}
      {showKnowledgeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl w-[900px] h-[600px] overflow-hidden flex flex-col relative">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {selectorType === 'prerequisite' ? `编辑前置知识点 - ${(tempEditNode || selectedNode)?.name}` : `编辑后续知识点 - ${(tempEditNode || selectedNode)?.name}`}
              </h3>
              <button
                onClick={() => {
                  setShowKnowledgeSelector(false);
                  setSelectedSteps([]);
                  setKnowledgeSearchKeyword('');
                  setDragOverPosition(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* 左右布局主体 */}
            <div className="flex-1 overflow-hidden flex">
              {/* 左侧：可选知识点 - 树状结构 */}
              <div className="w-[320px] border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-700">可选知识点</div>
                </div>
                <KnowledgeSelectorTree
                  data={knowledgeTreeData as any}
                  selectedIds={selectedSteps.flatMap(step => step.items.map(item => item.id))}
                  selectedNames={selectedSteps.flatMap(step => step.items.map(item => item.name))}
                  currentKnowledgeId={(tempEditNode || selectedNode)?.id}
                  currentKnowledgeName={(tempEditNode || selectedNode)?.name}
                  selectorType={selectorType}
                  disabledIds={(() => {
                    const selectedModuleIds = selectedSteps.flatMap(step => 
                      step.items.filter(item => item.isModule).map(item => item.id)
                    );
                    console.log('[父子互斥] 已选中的非末级节点ID:', selectedModuleIds);
                    const disabled = getBatchChildIds(knowledgeTreeData as any, selectedModuleIds);
                    console.log('[父子互斥] 计算出的disabledIds:', disabled);
                    return disabled;
                  })()}
                  onSelect={(item) => {
                    console.log('[父子互斥] 选择节点:', item);
                    // 父子节点互斥逻辑：如果选择的是非末级节点（有子节点），需要移除其已选中的子节点
                    if (item.isModule) {
                      // 获取该非末级节点下的所有子节点ID
                      const childIds = getBatchChildIds(knowledgeTreeData as any, [item.id]);
                      console.log('[父子互斥] 该非末级节点的所有子节点ID:', childIds);
                      
                      // 过滤掉已选中的子节点
                      const filteredSteps = selectedSteps.map(step => ({
                        ...step,
                        items: step.items.filter(i => !childIds.includes(i.id))
                      })).filter(step => step.items.length > 0);
                      
                      console.log('[父子互斥] 过滤后的steps:', filteredSteps);
                      
                      // 将选中的知识点添加到学习层
                      const newStep: LearningStep = {
                        id: `step-${Date.now()}`,
                        items: [{
                          id: item.id,
                          name: item.name,
                          isModule: item.isModule,
                        }]
                      };
                      setSelectedSteps([...filteredSteps, newStep]);
                    } else {
                      // 末级节点，直接添加
                      const newStep: LearningStep = {
                        id: `step-${Date.now()}`,
                        items: [{
                          id: item.id,
                          name: item.name,
                          isModule: item.isModule,
                        }]
                      };
                      setSelectedSteps([...selectedSteps, newStep]);
                    }
                  }}
                />
              </div>
              
              {/* 右侧：表格展示 */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-700">
                    {selectorType === 'prerequisite' ? '前置知识点配置' : '后续知识点配置'}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {/* 表格 */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border border-gray-200 w-[180px]">
                          当前知识点
                        </th>
                        <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border border-gray-200">
                          {selectorType === 'prerequisite' ? '前置知识点' : '后续知识点'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-4 border border-gray-200 align-top bg-purple-50">
                          <span className="text-sm font-semibold text-purple-700">
                            {(tempEditNode || selectedNode)?.name}
                          </span>
                        </td>
                        <td className="px-4 py-4 border border-gray-200 align-top min-h-[120px]">
                          {selectedSteps.length === 0 ? (
                            <span className="text-sm text-gray-400">
                              暂无{selectorType === 'prerequisite' ? '前置' : '后续'}知识点，请从左侧选择添加
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {selectedSteps.flatMap((step) => 
                                step.items.map((item) => {
                                  // 非末级知识点（大模块）样式
                                  if (item.isModule) {
                                    return (
                                      <span
                                        key={item.id}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                                          selectorType === 'prerequisite'
                                            ? 'bg-blue-50 text-blue-800'
                                            : 'bg-orange-50 text-orange-800'
                                        }`}
                                        style={{
                                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                        }}
                                      >
                                        <Folder 
                                          className={`w-3.5 h-3.5 ${
                                            selectorType === 'prerequisite' ? 'text-blue-600' : 'text-orange-600'
                                          }`}
                                          fill={selectorType === 'prerequisite' ? '#2563EB' : '#EA580C'}
                                        />
                                        {item.name}
                                        <button
                                          onClick={() => {
                                            setSelectedSteps(selectedSteps.map(s => {
                                              if (s.id === step.id) {
                                                return { ...s, items: s.items.filter(i => i.id !== item.id) };
                                              }
                                              return s;
                                            }).filter(s => s.items.length > 0));
                                          }}
                                          className="ml-1 w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-white flex items-center justify-center text-xs transition-colors"
                                          title="删除"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  }
                                  
                                  // 末级知识点样式
                                  return (
                                    <span
                                      key={item.id}
                                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                                        selectorType === 'prerequisite'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-orange-100 text-orange-700'
                                      }`}
                                    >
                                      {item.name}
                                      <button
                                        onClick={() => {
                                          setSelectedSteps(selectedSteps.map(s => {
                                            if (s.id === step.id) {
                                              return { ...s, items: s.items.filter(i => i.id !== item.id) };
                                            }
                                            return s;
                                          }).filter(s => s.items.length > 0));
                                        }}
                                        className="ml-1 w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-white flex items-center justify-center text-xs transition-colors"
                                        title="删除"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowKnowledgeSelector(false);
                  setSelectedSteps([]);
                  setKnowledgeSearchKeyword('');
                  setDragOverPosition(null);
                  setTempEditNode(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleSaveKnowledgeSelector();
                  setTempEditNode(null);
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  selectorType === 'prerequisite' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      {selectedSubject ? (
        <div className="flex-1 min-h-0">
          <KnowledgeTreeManagement />
        </div>
      ) : (
        <SubjectManagementArea />
      )}

      {/* 新增学科弹窗 */}
      {showAddSubjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                新增学科 - {phaseConfig[selectedPhase].label}
              </h3>
              <button
                onClick={() => {
                  setShowAddSubjectDialog(false);
                  setAddSubjectSelected(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学科名称 <span className="text-red-500">*</span>
                </label>
                <Popover open={addSubjectPopoverOpen} onOpenChange={setAddSubjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer flex items-center justify-between bg-white">
                      <span className={addSubjectSelected ? 'text-gray-900' : 'text-gray-400'}>
                        {addSubjectSelected 
                          ? subjectConfig.find(s => s.id === addSubjectSelected)?.name 
                          : '请选择学科'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[452px] p-0" align="start">
                    <div className="max-h-60 overflow-y-auto">
                      {subjectConfig.map((subject) => {
                        const isExisting = mockSubjects[selectedPhase]?.some(s => s.id === subject.id);
                        return (
                          <div
                            key={subject.id}
                            className={`px-3 py-2 flex items-center gap-2 ${
                              isExisting 
                                ? 'bg-gray-100 cursor-not-allowed' 
                                : 'hover:bg-gray-50 cursor-pointer'
                            }`}
                            onClick={() => {
                              if (!isExisting) {
                                setAddSubjectSelected(subject.id);
                                setAddSubjectPopoverOpen(false);
                              }
                            }}
                            title={isExisting ? '该学科已存在' : ''}
                          >
                            <span className={`flex-1 ${isExisting ? 'text-gray-400' : 'text-gray-900'}`}>
                              {subject.name}
                            </span>
                            {isExisting && (
                              <span className="text-xs text-gray-400">已存在</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-400 mt-1">从预定义的学科列表中选择</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddSubjectDialog(false);
                  setAddSubjectSelected(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px]">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">确认删除</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-600">确定要删除这个知识点吗？删除后将无法恢复。</p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingNodeId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deletingNodeId && handleDeleteNode(deletingNodeId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加子节点确认弹窗 - 当末级知识点有详细内容时 */}
      {showAddChildConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[450px]">
            <div className="p-4">
              <p className="text-gray-600 mb-4">确定为该知识点添加子节点吗？</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 font-medium mb-1">该知识点已有详细内容</p>
                    <p className="text-gray-600 text-sm">
                      添加子知识点后，该知识点将变为非末级节点，其知识点信息、知识点结构和学习资源将无法继续维护。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddChildConfirm(false);
                  setPendingAddChildNodeId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (pendingAddChildNodeId) {
                    setAddingChildParentId(pendingAddChildNodeId);
                    setAddingChildValue('');
                  }
                  setShowAddChildConfirm(false);
                  setPendingAddChildNodeId(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 - 上传态 */}
      {showImportDialog && (importValidationStatus === 'idle') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">批量导入知识点</h3>
              <PrdTooltip data={prd204.editBatchImport} className="ml-1" />
              <button
                onClick={resetImportState}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 内容 */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* 下载模板区域 */}
              <div
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                data-req-anchor="knowledge-tree.info.import-dialog-guide"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium mb-1">导入说明</p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>请先下载模板文件，按照模板格式填写知识点数据</li>
                      <li>二级标题为必填项，三、四、五级标题根据实际情况填写</li>
                      <li>前置知识点如有多个，用顿号（、）间隔</li>
                      <li>学业要求可选值：了解、理解、掌握、运用</li>
                      <li>考频可选值：高频、中频、低频</li>
                    </ul>
                  </div>
                  <span className="req-anchor-inline" data-req-anchor="knowledge-tree.info.import-template">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      下载模板
                    </button>
                  </span>
                </div>
              </div>

              {/* 上传区域 */}
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer border-gray-300 hover:border-emerald-500"
                data-req-anchor="knowledge-tree.info.import-validation"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      performValidation(file);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-2">拖拽文件到此处或点击上传</p>
                <p className="text-gray-400 text-sm">支持 Excel (.xlsx, .xls) 格式</p>
              </div>
            </div>

            {/* 底部 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 bg-gray-50/50">
              <Button variant="outline" onClick={resetImportState}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 - 校验结果态 */}
      {showImportDialog && (importValidationStatus !== 'idle') && (
        <ImportValidationModal
          isOpen={true}
          onClose={resetImportState}
          status={importValidationStatus}
          summary={importValidationSummary || undefined}
          fileErrors={importFileErrors}
          rowResults={importRowResults}
          onReUpload={handleReUpload}
          onDownloadTemplate={handleDownloadTemplate}
          onDownloadErrorDetail={handleDownloadErrorDetail}
          onImportPassedRows={() => {
            // TODO: 执行仅导入通过项的逻辑
            alert(`成功导入 ${importValidationSummary?.passRows || 0} 行数据`);
            resetImportState();
          }}
          onStartImport={() => {
            // TODO: 执行全量导入的逻辑
            alert(`成功导入 ${importValidationSummary?.totalRows || 0} 行数据`);
            resetImportState();
          }}
        />
      )}

      {/* 发布弹窗 */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        currentVersion={pageState?.currentVersion || 'v1.0'}
        pendingChanges={pendingChanges}
        scheduledPublish={pageState?.scheduledPublish}
      />

      {/* 历史版本弹窗 */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={pageState?.publishHistory || []}
        currentVersion={pageState?.currentVersion || 'v1.0'}
        currentPhase={selectedPhase}
        currentSubject={selectedSubject}
        filterConfig={{
          phaseOptions: [
            { id: 'senior', label: '高中' },
            { id: 'junior', label: '初中' },
            { id: 'primary', label: '小学' },
          ],
          subjectOptions: subjectConfig.map(s => ({ id: s.id, label: s.name })),
        }}
      />

      {/* 无法删除提示弹窗 */}
      <CannotDeleteModal
        isOpen={showCannotDeleteModal}
        onClose={() => setShowCannotDeleteModal(false)}
      />

      {/* 取消编辑确认弹窗 */}
      {showCancelEditConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="p-6 flex flex-col items-center">
              {/* 警告图标 */}
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              {/* 提示文案 */}
              <p className="text-gray-700 text-center mb-6">
                当前有未保存的修改，确定要放弃吗？
              </p>
              <PrdTooltip data={prd204.cancelEditConfirmDialog} className="mb-4" />
              {/* 按钮区域 */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    console.log('[弹窗] 点击继续编辑');
                    setShowCancelEditConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  继续编辑
                </button>
                <button
                  onClick={() => {
                    console.log('[弹窗] 点击放弃编辑');
                    // 放弃编辑，恢复初始状态
                    setKnowledgeTree(initialKnowledgeTreeSnapshot);
                    setIsEditingTree(false);
                    setInitialKnowledgeTreeSnapshot([]);
                    setHasUnsavedChanges(false);
                    setShowCancelEditConfirm(false);
                    // 重置编辑数据
                    setIsEditingDetail(false);
                    setEditData({});
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  放弃编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          // 执行删除操作
          setSelectedSubject(null);
          alert('知识树已删除');
        }}
      />

      {/* 视频资源选择弹窗 */}
      <VideoSelectModal
        isOpen={showVideoSelectModal}
        onClose={() => setShowVideoSelectModal(false)}
        selectedVideoIds={(editData.videoContents || []).filter(v => v.sourceType === 'library').map(v => v.resourceId || '')}
        onSelect={(videos) => {
          // 将资源库选择的视频转换为VideoContent格式
          const newVideos: VideoContent[] = videos.map(v => ({
            id: `library-${v.id}-${Date.now()}`,
            sourceType: 'library' as const,
            resourceId: v.id,
            url: `https://example.com/videos/${v.id}.mp4`,
            name: v.name,
            duration: v.duration,
            size: v.size,
            uploadTime: v.uploadTime,
          }));
          
          // 追加到现有视频列表
          setEditData({
            ...editData,
            videoContents: [...(editData.videoContents || []), ...newVideos]
          });
        }}
      />

      {/* 视频播放弹窗 */}
      {playingVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPlayingVideo(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">{playingVideo.name}</h3>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* 视频播放器 */}
            <div className="bg-black aspect-video">
              <video 
                src={playingVideo.url}
                className="w-full h-full"
                controls
                autoPlay
              />
            </div>
            
            {/* 视频信息 */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {playingVideo.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    时长: {playingVideo.duration}
                  </span>
                )}
                {playingVideo.size && (
                  <span>大小: {playingVideo.size}</span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded ${
                  playingVideo.sourceType === 'upload' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {playingVideo.sourceType === 'upload' ? '本地上传' : '资源库'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 聚合历史版本弹窗 */}
      <AggregateHistoryModal
        isOpen={showAggregateHistory}
        onClose={() => setShowAggregateHistory(false)}
        title="历史发布记录"
        data={useMemo(() => {
          const items: AggregateHistoryItem[] = [];
          const phaseLabels: Record<string, string> = {
            'senior': '高中',
            'junior': '初中',
            'primary': '小学',
          };
          const subjectLabels: Record<string, string> = {
            'math': '数学',
            'english': '英语',
            'physics': '物理',
            'chemistry': '化学',
            'biology': '生物',
            'science': '科学',
          };
          
          Object.entries(mockKnowledgeTreePublishState).forEach(([key, state]) => {
            const [phase, subject] = key.split('-');
            const phaseLabel = phaseLabels[phase] || phase;
            const subjectLabel = subjectLabels[subject] || subject;
            
            state.publishHistory.forEach((record, index) => {
              items.push({
                id: `${key}-${record.version}-${index}`,
                moduleName: `${phaseLabel}·${subjectLabel}`,
                modulePath: `/system-settings/knowledge-tree?phase=${phase}&subject=${subject}`,
                version: record.version,
                description: record.description,
                publishTime: record.publishTime,
                publisher: record.publisher,
                publisherAccount: record.publisherAccount || '-',
              });
            });
          });
          
          return items;
        }, [])}
        filterConfig={{
          showPhaseFilter: true,
          showSubjectFilter: true,
          phaseOptions: [
            { id: 'senior', label: '高中' },
            { id: 'junior', label: '初中' },
            { id: 'primary', label: '小学' },
          ],
          subjectOptions: [
            { id: 'math', label: '数学' },
            { id: 'english', label: '英语' },
            { id: 'physics', label: '物理' },
            { id: 'chemistry', label: '化学' },
            { id: 'biology', label: '生物' },
            { id: 'science', label: '科学' },
          ],
        }}
      />
      
      {/* 业务逻辑文档面板 */}
      <DocPanel currentPath="/system-settings/knowledge-tree" />

      {/* Skill3：学业要求增量需求角标（读 Skill2 注册表 logicSections） */}
      <RequirementMarkerHost
        registryId="knowledge-tree-info-academic-requirement"
        refreshKey={`${isEditingDetail}-${showImportDialog}-${selectedNode?.id ?? ''}-${activeDetailTab}`}
      />
    </div>
  );
}
