'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
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
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
  BookOpen,
  School,
  FileText,
  Building2,
  GripVertical,
  X,
  Video,
  ClipboardList,
  Clock,
  User,
  Award,
  Download,
  Upload,
  Check,
  Play,
  Eye,
  History,
  AlertTriangle,
  Info,
  BookMarked,
  ListTree,
  FolderOpen,
  Star,
  Circle,
  Network,
  ChevronUp,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Library,
  Inbox,
  PlayCircle,
} from 'lucide-react';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';
import KnowledgeSelectorTree, { getBatchChildIds } from '@/components/shared/KnowledgeSelectorTree';
import KnowledgeNetworkGraph from '@/components/shared/KnowledgeNetworkGraph';
import SectionKnowledgeGraph from '@/components/shared/SectionKnowledgeGraph';
import DocPanel from '@/components/shared/DocPanel';
import TextbookImportValidationModal from '@/components/shared/TextbookImportValidationModal';
import PrdTooltip from '@/components/shared/PrdTooltip';
import * as prd200 from '@/data/prd-rules/textbook-tree-2.00';
import * as prd205 from '@/data/prd-rules/textbook-tree-2.05';
import * as prd206 from '@/data/prd-rules/textbook-tree-2.06';
import * as prd207 from '@/data/prd-rules/textbook-tree-2.07';
import * as prd209 from '@/data/prd-rules/textbook-tree-2.09';
import * as prd215 from '@/data/prd-rules/textbook-tree-2.15';
import * as prd216 from '@/data/prd-rules/textbook-tree-2.16';
import { Button } from '@/components/ui/button';
import knowledgeTreeData from '@/data/knowledge-tree.json';
import { knowledgeTreeData as knowledgeRelationsData, findKnowledgeRelationsByName, findKnowledgeNodeById, findKnowledgeNodeById as findKnowledgeNodeByIdFromRelations } from '@/data/knowledge-relations';

// 专题数据类型
interface Textbook {
  id: string;
  name: string;
  subject: string;
  phase: string;
  grade: string;
  publisher: string;
  version: string;
  year: string;
  region: string;
  scene?: string;
  coverImage?: string;
  chapterCount: number;
  knowledgePointCount: number;
  schoolCount: number;
  // 版本管理相关
  currentVersion?: string;           // 当前版本号（如 v1.0）
  lastPublishTime?: string;          // 最近发布时间
  lastPublisher?: string;            // 发布人
  publishHistory?: PublishRecord[];  // 发布历史
}

// 发布记录类型
interface PublishRecord {
  version: string;                   // 版本号
  description: string;               // 更新说明
  publishTime: string;               // 发布时间
  publisher: string;                 // 发布人姓名
  publisherAccount?: string;         // 发布人账号
  changes?: ChangeRecord[];          // 本次变更详情
}

// 变更记录类型
interface ChangeRecord {
  type: 'add' | 'modify' | 'delete'; // 变更类型
  target: string;                    // 变更对象
  detail?: string;                   // 变更详情
  dimension?: '章节信息' | '知识点关联' | '同步课程' | '练习试卷';  // 变更维度
}

// 专题发布状态类型
interface TextbookPublishState {
  status: 'published' | 'pending';   // 发布状态
  currentVersion: string;            // 当前已发布版本号
  lastPublishTime: string;           // 最近发布时间
  lastPublisher: string;             // 发布人
  pendingChanges: number;            // 待发布变更数量
  changedItems: string[];            // 有变更的项目列表
  publishHistory: PublishRecord[];   // 发布历史
  scheduledPublish?: {               // 定时发布信息
    version: string;                 // 待发布的版本号
    scheduledDate: string;           // 定时日期
    scheduledTime: string;           // 定时时间
    description: string;             // 更新说明
  };
}

// 章节数据类型
interface Chapter {
  id: string;
  textbookId: string;
  name: string;
  level: 'chapter' | 'section' | 'subsection'; // 三级结构：章、节、子节
  order: number;
  parentId?: string;
  knowledgePoints?: KnowledgeRelation[];
  courses?: Course[];       // 关联的同步课程
  exams?: Exam[];           // 关联的练习试卷
  children?: Chapter[];
  expanded?: boolean;
}

// 知识点关联类型
interface KnowledgeRelation {
  id: string;
  name: string;
  isModule?: boolean;
  stepId?: string;
  stepOrder?: number;
  extendedPoints?: ExtendedKnowledgePoint[];  // 延伸知识点列表
}

// 延伸知识点类型
interface ExtendedKnowledgePoint {
  id: string;
  name: string;
}

// 同步课程类型
interface Course {
  id: string;
  name: string;
  duration: string;  // 时长
  teacher?: string;  // 授课老师
  description?: string;
  // 上传相关字段
  sourceType?: 'upload' | 'library';  // 来源类型
  videoUrl?: string;                  // 视频URL
  videoSize?: string;                 // 文件大小
  uploadTime?: string;                // 上传时间
}

// 练习试卷类型
interface Exam {
  id: string;
  name: string;
  questionCount: number;  // 题目数量
  totalScore: number;     // 总分
  duration: number;       // 考试时长（分钟）
  difficulty?: 'easy' | 'medium' | 'hard';
  // 上传相关字段
  sourceType?: 'upload' | 'library' | 'workbook';  // 来源类型
  fileUrl?: string;                   // 文件URL
  fileSize?: string;                  // 文件大小
  uploadTime?: string;                // 上传时间
}

// 习题册小节类型
interface WorkbookSection {
  id: string;
  name: string;
  exams: Exam[];
}

// 习题册章节类型（支持章→小节二级结构）
interface WorkbookChapter {
  id: string;
  name: string;
  children?: WorkbookSection[];  // 小节列表
  exams?: Exam[];                // 章级试卷（如果有）
}

// 习题册类型
interface Workbook {
  id: string;
  name: string;
  chapters: WorkbookChapter[];
}

// 学段配置
const phaseConfig = {
  senior: { label: '高中', color: 'bg-purple-500' },
  junior: { label: '初中', color: 'bg-emerald-500' },
  primary: { label: '小学', color: 'bg-blue-500' },
};

// 场景配置
const scenes = [
  { id: 'summer_winter', name: '寒暑假复习' },
  { id: 'zhongkao', name: '中考' },
  { id: 'gaokao', name: '高考' },
];

// 学科配置
const subjects = [
  { id: 'math', name: '数学' },
  { id: 'chinese', name: '语文' },
  { id: 'english', name: '英语' },
  { id: 'physics', name: '物理' },
  { id: 'chemistry', name: '化学' },
  { id: 'biology', name: '生物' },
];

// 地区配置
const regions = [
  { id: 'national', name: '全国' },
  { id: 'beijing', name: '北京' },
  { id: 'shanghai', name: '上海' },
  { id: 'guangdong', name: '广东' },
  { id: 'jiangsu', name: '江苏' },
  { id: 'zhejiang', name: '浙江' },
];

// 模拟专题数据
const mockTextbooks: Textbook[] = [
  {
    id: 't1',
    name: '二次函数专题',
    subject: '数学',
    phase: '初中',
    grade: '九年级',
    publisher: '寒暑假复习',
    scene: '寒暑假复习',
    version: '2024版',
    year: '2024',
    region: '浙江',
    chapterCount: 7,
    knowledgePointCount: 33,
    schoolCount: 280,
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-20 14:30',
    lastPublisher: '张老师',
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-20 14:30', publisher: '张老师', publisherAccount: '123456' },
    ],
  },
  {
    id: 't2',
    name: '圆与相似专题',
    subject: '数学',
    phase: '初中',
    grade: '九年级',
    publisher: '寒暑假复习',
    scene: '寒暑假复习',
    version: '2024版',
    year: '2024',
    region: '全国',
    chapterCount: 10,
    knowledgePointCount: 38,
    schoolCount: 142,
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-10 10:00',
    lastPublisher: '李老师',
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-10 10:00', publisher: '李老师', publisherAccount: '234567' },
    ],
  },
  {
    id: 't3',
    name: '一次函数与整式专题',
    subject: '数学',
    phase: '初中',
    grade: '八年级',
    publisher: '寒暑假复习',
    scene: '寒暑假复习',
    version: '2024版',
    year: '2024',
    region: '全国',
    chapterCount: 8,
    knowledgePointCount: 30,
    schoolCount: 89,
    currentVersion: 'v1.1',
    lastPublishTime: '2024-01-18 16:00',
    lastPublisher: '王老师',
    publishHistory: [
      { version: 'v1.1', description: '新增圆锥曲线专题', publishTime: '2024-01-18 16:00', publisher: '王老师', publisherAccount: '345678' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-12 09:00', publisher: '王老师', publisherAccount: '345678' },
    ],
  },
  {
    id: 't4',
    name: '数与式专题',
    subject: '数学',
    phase: '初中',
    grade: '七年级',
    publisher: '中考',
    scene: '中考',
    version: '2024版',
    year: '2024',
    region: '北京',
    chapterCount: 11,
    knowledgePointCount: 42,
    schoolCount: 78,
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-08 11:00',
    lastPublisher: '赵老师',
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-08 11:00', publisher: '赵老师', publisherAccount: '456789' },
    ],
  },
  {
    id: 't5',
    name: '方程与不等式专题',
    subject: '数学',
    phase: '初中',
    grade: '七年级',
    publisher: '中考',
    scene: '中考',
    version: '2024版',
    year: '2024',
    region: '北京',
    chapterCount: 9,
    knowledgePointCount: 35,
    schoolCount: 65,
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-05 14:00',
    lastPublisher: '钱老师',
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-05 14:00', publisher: '钱老师', publisherAccount: '567890' },
    ],
  },
  {
    id: 't6',
    name: '函数与导数专题',
    subject: '数学',
    phase: '高中',
    grade: '高二',
    publisher: '高考',
    scene: '高考',
    version: '2024版',
    year: '2024',
    region: '江苏',
    chapterCount: 13,
    knowledgePointCount: 48,
    schoolCount: 52,
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-06 09:00',
    lastPublisher: '孙老师',
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-06 09:00', publisher: '孙老师', publisherAccount: '678901' },
    ],
  },
];

// 模拟专题发布状态数据（用于跟踪待发布状态）
const mockTextbookPublishState: Record<string, TextbookPublishState> = {
  't1': {
    status: 'published',
    currentVersion: 'v1.2',
    lastPublishTime: '2024-01-20 14:30',
    lastPublisher: '张老师',
    pendingChanges: 0,
    changedItems: [],
    publishHistory: [
      { version: 'v1.2', description: '新增函数专题练习试卷', publishTime: '2024-01-20 14:30', publisher: '张老师', publisherAccount: '123456' },
      { version: 'v1.1', description: '优化集合专题知识点关联', publishTime: '2024-01-15 10:00', publisher: '张老师', publisherAccount: '123456' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
    ],
  },
  't2': {
    status: 'published',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-10 10:00',
    lastPublisher: '李老师',
    pendingChanges: 0,
    changedItems: [],
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-10 10:00', publisher: '李老师', publisherAccount: '234567' },
    ],
  },
  't3': {
    status: 'pending',
    currentVersion: 'v1.1',
    lastPublishTime: '2024-01-18 16:00',
    lastPublisher: '王老师',
    pendingChanges: 3,
    changedItems: ['新增专题：空间向量', '修改知识点：圆锥曲线', '新增试卷：期末测试卷'],
    publishHistory: [
      { version: 'v1.1', description: '新增圆锥曲线专题', publishTime: '2024-01-18 16:00', publisher: '王老师', publisherAccount: '345678' },
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-12 09:00', publisher: '王老师', publisherAccount: '345678' },
    ],
  },
  't4': {
    status: 'published',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-08 11:00',
    lastPublisher: '赵老师',
    pendingChanges: 0,
    changedItems: [],
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-08 11:00', publisher: '赵老师', publisherAccount: '456789' },
    ],
  },
  't5': {
    status: 'pending',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-05 14:00',
    lastPublisher: '钱老师',
    pendingChanges: 2,
    changedItems: ['修改专题：三角函数', '新增知识点：解三角形'],
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-05 14:00', publisher: '钱老师', publisherAccount: '567890' },
    ],
  },
  't6': {
    status: 'published',
    currentVersion: 'v1.0',
    lastPublishTime: '2024-01-06 09:00',
    lastPublisher: '孙老师',
    pendingChanges: 0,
    changedItems: [],
    publishHistory: [
      { version: 'v1.0', description: '初始版本', publishTime: '2024-01-06 09:00', publisher: '孙老师', publisherAccount: '678901' },
    ],
  },
};

// 模拟章节数据 - 浙教版九年级上
const mockChapters: Chapter[] = [
  {
    id: 'c1',
    textbookId: 't1',
    name: '专题1 二次函数',
    level: 'chapter',
    order: 1,
    expanded: true,
    children: [
      {
        id: 'c1-1',
        textbookId: 't1',
        name: '1.1 二次函数',
        level: 'section',
        order: 1,
        parentId: 'c1',
        knowledgePoints: [],
      },
      {
        id: 'c1-2',
        textbookId: 't1',
        name: '1.2 二次函数的图象',
        level: 'section',
        order: 2,
        parentId: 'c1',
        knowledgePoints: [],
      },
      {
        id: 'c1-3',
        textbookId: 't1',
        name: '1.3 二次函数的性质',
        level: 'section',
        order: 3,
        parentId: 'c1',
        knowledgePoints: [],
      },
      {
        id: 'c1-4',
        textbookId: 't1',
        name: '1.4 二次函数的应用',
        level: 'section',
        order: 4,
        parentId: 'c1',
        knowledgePoints: [],
      },
    ],
  },
  {
    id: 'c2',
    textbookId: 't1',
    name: '专题2 简单事件的概率',
    level: 'chapter',
    order: 2,
    children: [
      {
        id: 'c2-1',
        textbookId: 't1',
        name: '2.1 事件的可能性',
        level: 'section',
        order: 1,
        parentId: 'c2',
        knowledgePoints: [],
      },
      {
        id: 'c2-2',
        textbookId: 't1',
        name: '2.2 简单事件的概率',
        level: 'section',
        order: 2,
        parentId: 'c2',
        knowledgePoints: [],
      },
      {
        id: 'c2-3',
        textbookId: 't1',
        name: '2.3 用频率估计概率',
        level: 'section',
        order: 3,
        parentId: 'c2',
        knowledgePoints: [],
      },
      {
        id: 'c2-4',
        textbookId: 't1',
        name: '2.4 概率的简单应用',
        level: 'section',
        order: 4,
        parentId: 'c2',
        knowledgePoints: [],
      },
    ],
  },
  {
    id: 'c3',
    textbookId: 't1',
    name: '专题3 圆的基本性质',
    level: 'chapter',
    order: 3,
    children: [
      {
        id: 'c3-1',
        textbookId: 't1',
        name: '3.1 圆',
        level: 'section',
        order: 1,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-2',
        textbookId: 't1',
        name: '3.2 图形的旋转',
        level: 'section',
        order: 2,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-3',
        textbookId: 't1',
        name: '3.3 垂径定理',
        level: 'section',
        order: 3,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-4',
        textbookId: 't1',
        name: '3.4 圆心角',
        level: 'section',
        order: 4,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-5',
        textbookId: 't1',
        name: '3.5 圆周角',
        level: 'section',
        order: 5,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-6',
        textbookId: 't1',
        name: '3.6 圆内接四边形',
        level: 'section',
        order: 6,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-7',
        textbookId: 't1',
        name: '3.7 正多边形',
        level: 'section',
        order: 7,
        parentId: 'c3',
        knowledgePoints: [],
      },
      {
        id: 'c3-8',
        textbookId: 't1',
        name: '3.8 弧长及扇形的面积',
        level: 'section',
        order: 8,
        parentId: 'c3',
        knowledgePoints: [],
      },
    ],
  },
  {
    id: 'c4',
    textbookId: 't1',
    name: '专题4 相似三角形',
    level: 'chapter',
    order: 4,
    children: [
      {
        id: 'c4-1',
        textbookId: 't1',
        name: '4.1 比例线段',
        level: 'section',
        order: 1,
        parentId: 'c4',
        knowledgePoints: [],
      },
      {
        id: 'c4-2',
        textbookId: 't1',
        name: '4.2 由平行线截得的比例线段',
        level: 'section',
        order: 2,
        parentId: 'c4',
        knowledgePoints: [],
      },
      {
        id: 'c4-3',
        textbookId: 't1',
        name: '4.3 相似三角形',
        level: 'section',
        order: 3,
        parentId: 'c4',
        knowledgePoints: [],
      },
      {
        id: 'c4-4',
        textbookId: 't1',
        name: '4.4 两个三角形相似的判定',
        level: 'section',
        order: 4,
        parentId: 'c4',
        knowledgePoints: [],
      },
      {
        id: 'c4-5',
        textbookId: 't1',
        name: '4.5 相似三角形的性质及其应用',
        level: 'section',
        order: 5,
        parentId: 'c4',
        knowledgePoints: [],
      },
      {
        id: 'c4-6',
        textbookId: 't1',
        name: '4.6 相似多边形',
        level: 'section',
        order: 6,
        parentId: 'c4',
        knowledgePoints: [],
      },
      {
        id: 'c4-7',
        textbookId: 't1',
        name: '4.7 图形的位似',
        level: 'section',
        order: 7,
        parentId: 'c4',
        knowledgePoints: [],
      },
    ],
  },
  {
    id: 'c5',
    textbookId: 't1',
    name: '专题1 解直角三角形',
    level: 'chapter',
    order: 5,
    children: [
      {
        id: 'c5-1',
        textbookId: 't1',
        name: '1.1 锐角三角函数',
        level: 'section',
        order: 1,
        parentId: 'c5',
        knowledgePoints: [],
      },
      {
        id: 'c5-2',
        textbookId: 't1',
        name: '1.2 锐角三角函数的计算',
        level: 'section',
        order: 2,
        parentId: 'c5',
        knowledgePoints: [],
      },
      {
        id: 'c5-3',
        textbookId: 't1',
        name: '1.3 解直角三角形',
        level: 'section',
        order: 3,
        parentId: 'c5',
        knowledgePoints: [],
      },
    ],
  },
  {
    id: 'c6',
    textbookId: 't1',
    name: '专题2 直线与圆的位置关系',
    level: 'chapter',
    order: 6,
    children: [
      {
        id: 'c6-1',
        textbookId: 't1',
        name: '2.1 直线与圆的位置关系',
        level: 'section',
        order: 1,
        parentId: 'c6',
        knowledgePoints: [],
      },
      {
        id: 'c6-2',
        textbookId: 't1',
        name: '2.2 切线长定理',
        level: 'section',
        order: 2,
        parentId: 'c6',
        knowledgePoints: [],
      },
      {
        id: 'c6-3',
        textbookId: 't1',
        name: '2.3 三角形的内切圆',
        level: 'section',
        order: 3,
        parentId: 'c6',
        knowledgePoints: [],
      },
    ],
  },
  {
    id: 'c7',
    textbookId: 't1',
    name: '专题3 三视图与表面展开图',
    level: 'chapter',
    order: 7,
    children: [
      {
        id: 'c7-1',
        textbookId: 't1',
        name: '3.1 投影',
        level: 'section',
        order: 1,
        parentId: 'c7',
        knowledgePoints: [],
      },
      {
        id: 'c7-2',
        textbookId: 't1',
        name: '3.2 简单几何体的三视图',
        level: 'section',
        order: 2,
        parentId: 'c7',
        knowledgePoints: [],
      },
      {
        id: 'c7-3',
        textbookId: 't1',
        name: '3.3 由三视图描述几何体',
        level: 'section',
        order: 3,
        parentId: 'c7',
        knowledgePoints: [],
      },
      {
        id: 'c7-4',
        textbookId: 't1',
        name: '3.4 简单几何体的表面展开图',
        level: 'section',
        order: 4,
        parentId: 'c7',
        knowledgePoints: [],
      },
    ],
  },
];

// 可选知识点列表
const availableKnowledgePoints = [
  { id: 'akp1', name: '函数的概念' },
  { id: 'akp2', name: '函数的定义域' },
  { id: 'akp3', name: '函数的值域' },
  { id: 'akp4', name: '函数的图像' },
  { id: 'akp5', name: '函数的单调性' },
  { id: 'akp6', name: '函数的奇偶性' },
  { id: 'akp7', name: '反函数' },
  { id: 'akp8', name: '幂函数' },
  { id: 'akp9', name: '指数函数' },
  { id: 'akp10', name: '对数函数' },
];

// 可选同步课程列表
const availableCourses: Course[] = [
  { id: 'c1', name: '集合的概念与表示', duration: '45分钟', teacher: '张老师', description: '讲解集合的基本概念、元素与集合的关系', sourceType: 'library' as const },
  { id: 'c2', name: '集合的运算', duration: '50分钟', teacher: '张老师', description: '讲解交集、并集、补集的运算方法', sourceType: 'library' as const },
  { id: 'c3', name: '函数的概念与性质', duration: '55分钟', teacher: '李老师', description: '讲解函数的定义、定义域、值域', sourceType: 'library' as const },
  { id: 'c4', name: '函数的单调性', duration: '40分钟', teacher: '李老师', description: '讲解函数单调性的判断与证明', sourceType: 'library' as const },
  { id: 'c5', name: '函数的奇偶性', duration: '35分钟', teacher: '王老师', description: '讲解函数奇偶性的定义与应用', sourceType: 'library' as const },
  { id: 'c6', name: '指数函数', duration: '45分钟', teacher: '王老师', description: '讲解指数函数的图像与性质', sourceType: 'library' as const },
  { id: 'c7', name: '对数函数', duration: '50分钟', teacher: '赵老师', description: '讲解对数函数的图像与性质', sourceType: 'library' as const },
  { id: 'c8', name: '幂函数', duration: '30分钟', teacher: '赵老师', description: '讲解幂函数的图像与性质', sourceType: 'library' as const },
];

// 可选练习试卷列表
const availableExams: Exam[] = [
  { id: 'e1', name: '集合基础练习', questionCount: 20, totalScore: 100, duration: 45, difficulty: 'easy', sourceType: 'library' as const },
  { id: 'e2', name: '集合提高练习', questionCount: 15, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'library' as const },
  { id: 'e3', name: '函数概念专项训练', questionCount: 25, totalScore: 100, duration: 50, difficulty: 'easy', sourceType: 'library' as const },
  { id: 'e4', name: '函数性质综合测试', questionCount: 18, totalScore: 100, duration: 90, difficulty: 'medium', sourceType: 'library' as const },
  { id: 'e5', name: '函数单元测试', questionCount: 30, totalScore: 150, duration: 120, difficulty: 'hard', sourceType: 'library' as const },
  { id: 'e6', name: '指数对数专项', questionCount: 22, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'library' as const },
  { id: 'e7', name: '期中模拟卷', questionCount: 35, totalScore: 150, duration: 120, difficulty: 'hard', sourceType: 'library' as const },
  { id: 'e8', name: '期末复习卷', questionCount: 40, totalScore: 150, duration: 150, difficulty: 'hard', sourceType: 'library' as const },
];

// 可选习题册模拟数据
const availableWorkbooks: Workbook[] = [
  {
    id: 'w1',
    name: '九年级数学同步练习册（上）',
    chapters: [
      {
        id: 'wc1-1', name: '专题1 二次函数',
        children: [
          {
            id: 'ws1-1-1', name: '1.1 二次函数',
            exams: [
              { id: 'we1-1', name: '二次函数基础练习', questionCount: 20, totalScore: 100, duration: 45, difficulty: 'easy', sourceType: 'workbook' as const },
              { id: 'we1-2', name: '二次函数提高练习', questionCount: 15, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws1-1-2', name: '1.2 二次函数的图象',
            exams: [
              { id: 'we1-3', name: '二次函数图象专项训练', questionCount: 25, totalScore: 100, duration: 50, difficulty: 'easy', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws1-1-3', name: '1.3 二次函数的性质',
            exams: [
              { id: 'we1-4', name: '二次函数性质综合测试', questionCount: 18, totalScore: 100, duration: 90, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws1-1-4', name: '1.4 二次函数的应用',
            exams: [
              { id: 'we1-5', name: '二次函数应用单元测试', questionCount: 22, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
        ],
      },
      {
        id: 'wc1-2', name: '专题2 简单事件的概率',
        children: [
          {
            id: 'ws1-2-1', name: '2.1 事件的可能性',
            exams: [
              { id: 'we1-6', name: '事件可能性基础练习', questionCount: 20, totalScore: 100, duration: 45, difficulty: 'easy', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws1-2-2', name: '2.2 简单事件的概率',
            exams: [
              { id: 'we1-7', name: '概率计算专项训练', questionCount: 22, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws1-2-3', name: '2.3 用频率估计概率',
            exams: [
              { id: 'we1-8', name: '频率估计概率练习', questionCount: 16, totalScore: 100, duration: 50, difficulty: 'easy', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws1-2-4', name: '2.4 概率的简单应用',
            exams: [
              { id: 'we1-9', name: '概率应用综合测试', questionCount: 18, totalScore: 100, duration: 50, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'w2',
    name: '九年级数学同步练习册（下）',
    chapters: [
      {
        id: 'wc2-1', name: '专题3 圆的基本性质',
        children: [
          {
            id: 'ws2-1-1', name: '3.1 圆',
            exams: [
              { id: 'we2-1', name: '圆基础练习', questionCount: 18, totalScore: 100, duration: 45, difficulty: 'easy', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws2-1-2', name: '3.2 圆的轴对称性',
            exams: [
              { id: 'we2-2', name: '圆的轴对称性专项训练', questionCount: 15, totalScore: 100, duration: 40, difficulty: 'easy', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws2-1-3', name: '3.3 圆的中心对称性',
            exams: [
              { id: 'we2-3', name: '圆的中心对称性综合测试', questionCount: 25, totalScore: 100, duration: 90, difficulty: 'hard', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws2-1-4', name: '3.4 圆周角',
            exams: [
              { id: 'we2-4', name: '圆周角专项训练', questionCount: 20, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
        ],
      },
      {
        id: 'wc2-2', name: '专题4 相似三角形',
        children: [
          {
            id: 'ws2-2-1', name: '4.1 比例线段',
            exams: [
              { id: 'we2-5', name: '比例线段基础练习', questionCount: 22, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws2-2-2', name: '4.2 相似三角形',
            exams: [
              { id: 'we2-6', name: '相似三角形专项训练', questionCount: 20, totalScore: 100, duration: 60, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'w3',
    name: '九年级数学培优练习册',
    chapters: [
      {
        id: 'wc3-1', name: '专题1 二次函数',
        children: [
          {
            id: 'ws3-1-1', name: '1.1 二次函数',
            exams: [
              { id: 'we3-1', name: '二次函数培优练习', questionCount: 15, totalScore: 100, duration: 40, difficulty: 'medium', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws3-1-2', name: '1.2 二次函数的图象',
            exams: [
              { id: 'we3-2', name: '二次函数图象培优训练', questionCount: 18, totalScore: 100, duration: 50, difficulty: 'hard', sourceType: 'workbook' as const },
            ],
          },
        ],
      },
      {
        id: 'wc3-2', name: '专题2 简单事件的概率',
        children: [
          {
            id: 'ws3-2-1', name: '2.1 事件的可能性',
            exams: [
              { id: 'we3-3', name: '事件可能性培优训练', questionCount: 20, totalScore: 100, duration: 60, difficulty: 'hard', sourceType: 'workbook' as const },
            ],
          },
          {
            id: 'ws3-2-2', name: '2.2 简单事件的概率',
            exams: [
              { id: 'we3-4', name: '概率培优综合练习', questionCount: 18, totalScore: 100, duration: 50, difficulty: 'hard', sourceType: 'workbook' as const },
            ],
          },
        ],
      },
    ],
  },
];

// 组件 Props 接口
interface TextbookTreeProps {
  onDetailViewChange?: (isDetailView: boolean) => void;
}

// 发布弹窗组件
// 变更项类型
interface ChangeItem {
  description: string;
  changedBy?: string;
  changedByRole?: 'supervisor' | 'teacher';
  changedByAccount?: string;
}

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
  pendingChanges: (string | ChangeItem)[];
  scheduledPublish?: {
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
  };
}) {
  const [description, setDescription] = useState('');
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('02:00');

  // 当弹窗打开时，如果有定时发布信息，预填充
  React.useEffect(() => {
    if (isOpen && scheduledPublish) {
      setDescription(scheduledPublish.description);
      setPublishType('scheduled');
      setScheduledDate(scheduledPublish.scheduledDate);
      setScheduledTime(scheduledPublish.scheduledTime);
    } else if (isOpen) {
      setDescription('');
      setPublishType('immediate');
      setScheduledDate('');
      setScheduledTime('02:00');
    }
  }, [isOpen, scheduledPublish]);

  // 生成新版本号
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

  // 如果有定时发布信息，使用其版本号；否则生成新版本号
  const newVersion = scheduledPublish?.version || generateNewVersion(currentVersion);

  const handlePublish = () => {
    if (!description.trim()) return;
    if (publishType === 'scheduled' && !scheduledDate) {
      alert('请选择定时发布的日期');
      return;
    }
    if (publishType === 'scheduled') {
      onPublish(newVersion, description, { scheduledDate, scheduledTime });
    } else {
      onPublish(newVersion, description);
    }
    setDescription('');
    setPublishType('immediate');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">发布确认</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
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

          {/* 版本号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">版本号</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-mono">{newVersion}</span>
              <span className="text-xs text-gray-400">系统生成</span>
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

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handlePublish}
            disabled={!description.trim() || (publishType === 'scheduled' && !scheduledDate)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishType === 'immediate' ? '确认发布' : '确认定时发布'}
          </button>
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
  // 新增：当前专题属性和筛选选项
  currentTextbook,
  filterConfig,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: PublishRecord[];
  currentVersion: string;
  currentTextbook?: {
    phase: string;
    subject: string;
    grade: string;
    publisher: string;
  };
  filterConfig?: {
    phaseOptions: { id: string; label: string }[];
    subjectOptions: { id: string; label: string }[];
    publisherOptions: { id: string; label: string }[];
  };
}) {
  if (!isOpen) return null;

  // 获取当前专题的筛选值标签
  const getLabelById = (options: { id: string; label: string }[], id: string) => {
    return options.find(opt => opt.id === id)?.label || id;
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
        {filterConfig && currentTextbook && (
          <div className="px-5 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 学段筛选 */}
              <select
                value={currentTextbook.phase}
                disabled
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value={currentTextbook.phase}>
                  {getLabelById(filterConfig.phaseOptions, currentTextbook.phase)}
                </option>
              </select>
              
              {/* 学科筛选 */}
              <select
                value={currentTextbook.subject}
                disabled
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value={currentTextbook.subject}>
                  {getLabelById(filterConfig.subjectOptions, currentTextbook.subject)}
                </option>
              </select>
              

              {/* 出版社筛选 */}
              <select
                value={currentTextbook.publisher}
                disabled
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value={currentTextbook.publisher}>
                  {getLabelById(filterConfig.publisherOptions, currentTextbook.publisher)}
                </option>
              </select>
            </div>
          </div>
        )}

        <div className="p-5 max-h-[400px] overflow-y-auto">
          <div className="space-y-3">
            {history.map((record) => (
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
                    <span className={`text-sm font-semibold font-mono ${record.version === currentVersion ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {record.version}
                    </span>
                    {record.version === currentVersion && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">当前版本</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{record.publishTime}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{record.description}</p>
                <p className="text-xs text-gray-400">发布人：{record.publisher}（账号：{record.publisherAccount || '-'}）</p>
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

export default function TextbookTree2({ onDetailViewChange }: TextbookTreeProps) {
  const { isTeacher } = useRole();
  
  // 一级页面状态
  const [selectedPhase, setSelectedPhase] = useState('senior');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedScene, setSelectedScene] = useState('all');
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);
  
  // 详情页提示条状态
  const [showDetailTipBar, setShowDetailTipBar] = useState(true);
  
  // 专题列表状态
  const [textbooks, setTextbooks] = useState<Textbook[]>(mockTextbooks);
  
  // 新增专题表单状态
  const [newTextbookName, setNewTextbookName] = useState('');
const [newTextbookPhase, setNewTextbookPhase] = useState('senior'); // 学段
  const [newTextbookSubject, setNewTextbookSubject] = useState('math'); // 学科
  const [newTextbookPublisher, setNewTextbookPublisher] = useState(''); // 专题版本（从顶部新增时可选择）
  const [isAddFromTop, setIsAddFromTop] = useState(false); // 区分弹窗来源：true=顶部入口，false=版本分组入口
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false); // 兼容旧代码，控制左侧树编辑
  const [isEditingTree, setIsEditingTree] = useState(false); // 编辑树结构模式
  const [isEditingDetail, setIsEditingDetail] = useState(false); // 编辑详情模式
  const [showEditTreeConfirm, setShowEditTreeConfirm] = useState(false); // 编辑树确认弹窗
  const [initialChaptersSnapshot, setInitialChaptersSnapshot] = useState<Chapter[]>([]); // 初始章节快照
  const [detailEditSnapshot, setDetailEditSnapshot] = useState<string>(''); // 详情编辑前的快照（JSON字符串）
  
  // 弹窗状态
  const [showAddTextbookDialog, setShowAddTextbookDialog] = useState(false);
  const [currentPublisher, setCurrentPublisher] = useState(''); // 当前选择的出版社（新增专题时使用）
  const [showKnowledgePointSelector, setShowKnowledgePointSelector] = useState(false);
  const [showDeleteTextbookDialog, setShowDeleteTextbookDialog] = useState(false); // 删除专题确认弹窗
  const [showDeleteTreeDialog, setShowDeleteTreeDialog] = useState(false); // 详情页删除章节树弹窗
  
  // 章节树状态
  const [chapters, setChapters] = useState<Chapter[]>(mockChapters);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // 通过 useMemo 从 chapters 中实时计算 selectedChapter（单一数据源）
  const selectedChapter = useMemo(() => {
    if (!selectedChapterId) return null;
    const findChapter = (chapters: Chapter[], id: string): Chapter | null => {
      for (const chapter of chapters) {
        if (chapter.id === id) return chapter;
        if (chapter.children) {
          const found = findChapter(chapter.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findChapter(chapters, selectedChapterId);
  }, [chapters, selectedChapterId]);
  
  // 章节编辑状态
  const [addingChapterParentId, setAddingChapterParentId] = useState<string | null>(null); // 正在添加的章节的父级ID，null表示顶级章
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null); // 正在编辑的章节ID
  const [chapterInputValue, setChapterInputValue] = useState(''); // 输入框值
  const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null); // 悬停的章节ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 删除确认弹窗
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null); // 要删除的章节ID
  
  // 章节目录滚动位置保存
  const chapterListScrollRef = useRef<HTMLDivElement>(null);
  const chapterListScrollPositionRef = useRef<number>(0);
  
  // 知识点选择状态
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<KnowledgeRelation[]>([]);
  const [kpSearchKeyword, setKpSearchKeyword] = useState('');
  const [kpDialogTitle, setKpDialogTitle] = useState(''); // 弹窗标题（当前小节所属节的名称）
  const [expandedKnowledgePoints, setExpandedKnowledgePoints] = useState<Set<string>>(new Set()); // 展开的主知识点ID（弹窗内）
  const [addingExtendedKpParentId, setAddingExtendedKpParentId] = useState<string | null>(null); // 正在添加延伸知识点的主知识点ID
  const [expandedChapterKps, setExpandedChapterKps] = useState<Set<string>>(new Set()); // 章节详情页面展开的主知识点ID

  // Tab切换状态
  const [activeTab, setActiveTab] = useState<'knowledge' | 'course' | 'exam'>('knowledge');

  // 同步课程选择弹窗状态
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [tempSelectedCourses, setTempSelectedCourses] = useState<Course[]>([]);
  const [courseSearchKeyword, setCourseSearchKeyword] = useState('');
  const [previewingCourse, setPreviewingCourse] = useState<Course | null>(null); // 预览的课程

  // 上传课程弹窗状态
  const [showUploadCourseDialog, setShowUploadCourseDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<Array<{
    file: File;
    id: string;
    name: string;
    size: string;
    status: 'uploading' | 'success' | 'failed';
    progress: number;
  }>>([]);
  const [isUploadingCourse, setIsUploadingCourse] = useState(false);

  // 删除视频资源弹窗状态

  // 上传课程弹窗处理函数
  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        if (minutes > 0) {
          resolve(`${minutes}分${seconds}秒`);
        } else {
          resolve(`${seconds}秒`);
        }
      };
      video.onerror = () => {
        resolve('未知');
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const handleFileSelect = (fileList: FileList) => {
    const allowedExts = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const maxCount = 10;
    const newFiles: Array<{
      file: File;
      id: string;
      name: string;
      size: string;
      status: 'uploading' | 'success' | 'failed';
      progress: number;
    }> = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (!allowedExts.includes(ext)) {
        alert(`不支持该文件格式: ${file.name}（仅支持 MP4、AVI、MOV、MKV、WMV、FLV 格式）`);
        continue;
      }
      if (file.size > maxSize) {
        alert(`仅支持上传2GB以内的文件: ${file.name}`);
        continue;
      }
      if (uploadFiles.length + newFiles.length >= maxCount) {
        alert('单次最多上传10个文件');
        break;
      }
      // 重名校验
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      if (selectedChapter?.courses?.find(c => c.name === fileName)) {
        alert(`已存在同名课程: ${fileName}`);
        continue;
      }

      newFiles.push({
        file,
        id: `upload-${Date.now()}-${i}`,
        name: file.name,
        size: formatFileSize(file.size),
        status: 'uploading',
        progress: 0,
      });
    }

    if (newFiles.length === 0) return;

    setUploadFiles(prev => [...prev, ...newFiles]);
    setIsUploadingCourse(true);

    // 为每个文件模拟上传进度
    newFiles.forEach((newFile) => {
      const fileId = newFile.id;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === fileId ? { ...f, status: 'success' as const, progress: 100 } : f
            )
          );
          // 检查是否所有文件都上传完成
          setUploadFiles(prev => {
            const allDone = prev.every(f => f.status === 'success' || f.status === 'failed');
            if (allDone) {
              setIsUploadingCourse(false);
            }
            return prev;
          });
        } else {
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === fileId ? { ...f, progress: Math.min(Math.round(progress), 99) } : f
            )
          );
        }
      }, 150);
    });
  };

  const handleRetryUpload = (fileId: string) => {
    setUploadFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, status: 'uploading' as const, progress: 0 } : f
      )
    );
    setIsUploadingCourse(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, status: 'success' as const, progress: 100 } : f
          )
        );
        setUploadFiles(prev => {
          const allDone = prev.every(f => f.status === 'success' || f.status === 'failed');
          if (allDone) {
            setIsUploadingCourse(false);
          }
          return prev;
        });
      } else {
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, progress: Math.min(Math.round(progress), 99) } : f
          )
        );
      }
    }, 150);
  };

  const handleConfirmUpload = () => {
    const successFiles = uploadFiles.filter(f => f.status === 'success');
    if (successFiles.length === 0) return;

    // 获取视频时长后写入课程
    Promise.all(successFiles.map(item => getVideoDuration(item.file))).then((durations) => {
      setChapters(prevChapters => {
        const findChapterById = (chapters: Chapter[], id: string): Chapter | null => {
          for (const chapter of chapters) {
            if (chapter.id === id) return chapter;
            if (chapter.children) {
              const found = findChapterById(chapter.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const currentChapter = selectedChapterId ? findChapterById(prevChapters, selectedChapterId) : null;
        if (!currentChapter) return prevChapters;

        const newCourses: Course[] = successFiles.map((item, i) => {
          const fileName = item.file.name.replace(/\.[^/.]+$/, '');
          return {
            id: `upload-${Date.now()}-${i}`,
            name: fileName,
            duration: durations[i],
            sourceType: 'upload' as const,
            videoUrl: URL.createObjectURL(item.file),
            videoSize: formatFileSize(item.file.size),
            uploadTime: new Date().toLocaleString('zh-CN'),
            teacher: '张老师', // 取上传该视频的账号的教师名称
          };
        });

        const updatedCourses = [...(currentChapter.courses || []), ...newCourses];

        const update = (chapters: Chapter[]): Chapter[] => {
          return chapters.map(chapter => {
            if (chapter.id === currentChapter.id) {
              return { ...chapter, courses: updatedCourses };
            }
            if (chapter.children) {
              return { ...chapter, children: update(chapter.children) };
            }
            return chapter;
          });
        };

        const newChapters = update(prevChapters);

        newCourses.forEach(course => {
          addEditChange(`添加课程：${course.name}`);
        });

        return newChapters;
      });

      setShowUploadCourseDialog(false);
      setUploadFiles([]);
    });
  };

  // 聚合历史版本弹窗状态
  const [showAggregateHistory, setShowAggregateHistory] = useState(false);

  // 末级节点添加小节确认弹窗状态
  const [showLeafNodeConfirm, setShowLeafNodeConfirm] = useState(false); // 是否显示末级节点确认弹窗
  const [pendingLeafNodeId, setPendingLeafNodeId] = useState<string | null>(null); // 待添加小节的末级节点ID
  const [pendingLeafNodeData, setPendingLeafNodeData] = useState<{ // 待删除的末级节点数据
    knowledgePoints?: KnowledgeRelation[];
    courses?: Course[];
    exams?: Exam[];
  } | null>(null);
  const [pendingSiblingSubsections, setPendingSiblingSubsections] = useState<string[]>([]); // 待提示的同级已有子小节的节

  // 判断节点是否为末级节点（没有子节点）
  const isLeafNode = (chapterId: string): boolean => {
    const findChapter = (chapters: Chapter[], targetId: string): Chapter | null => {
      for (const chapter of chapters) {
        if (chapter.id === targetId) return chapter;
        if (chapter.children) {
          const found = findChapter(chapter.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const chapter = findChapter(chapters, chapterId);
    return chapter ? !chapter.children || chapter.children.length === 0 : false;
  };

  // 判断末级节点是否维护了数据（知识点、同步课程、练习试卷）
  const hasLeafNodeContent = (chapterId: string): { hasContent: boolean; data: { knowledgePoints?: KnowledgeRelation[]; courses?: Course[]; exams?: Exam[] } } => {
    const findChapter = (chapters: Chapter[], targetId: string): Chapter | null => {
      for (const chapter of chapters) {
        if (chapter.id === targetId) return chapter;
        if (chapter.children) {
          const found = findChapter(chapter.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const chapter = findChapter(chapters, chapterId);
    if (!chapter) return { hasContent: false, data: {} };
    
    const hasKnowledgePoints = !!(chapter.knowledgePoints && chapter.knowledgePoints.length > 0);
    const hasCourses = !!(chapter.courses && chapter.courses.length > 0);
    const hasExams = !!(chapter.exams && chapter.exams.length > 0);
    
    return {
      hasContent: hasKnowledgePoints || hasCourses || hasExams,
      data: {
        knowledgePoints: chapter.knowledgePoints,
        courses: chapter.courses,
        exams: chapter.exams
      }
    };
  };

  // ==================== 课程/试卷卡片统一渲染函数 ====================

  // 同步课程卡片 - 统一渲染，聚合态与详情态样式一致
  const renderCourseCard = (course: Course, showRemove: boolean = true) => (
    <div
      key={course.id}
      className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg group"
    >
      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Video className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{course.name}</p>
          {course.sourceType && (
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              course.sourceType === 'upload'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {course.sourceType === 'upload' ? '本地上传' : '资源库'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
          {course.videoSize && (
            <span>{course.videoSize}</span>
          )}
          {course.teacher && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {course.teacher}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPreviewingCourse(course)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          title="预览"
        >
          <Play className="w-4 h-4" />
        </button>
        {showRemove && isEditingDetail && selectedChapter && (
          <button
            onClick={() => {
              if (selectedChapter) {
                const updatedCourses = selectedChapter.courses?.filter(c => c.id !== course.id) || [];
                const update = (chapters: Chapter[]): Chapter[] => {
                  return chapters.map(chapter => {
                    if (chapter.id === selectedChapter.id) {
                      return { ...chapter, courses: updatedCourses };
                    }
                    if (chapter.children) {
                      return { ...chapter, children: update(chapter.children) };
                    }
                    return chapter;
                  });
                };
                const newChapters = update(chapters);
                setChapters(newChapters);
                addEditChange(`移除课程：${course.name}`);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="移除"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // 练习试卷卡片 - 统一渲染，聚合态与详情态样式一致
  const renderExamCard = (exam: Exam, showRemove: boolean = true) => (
    <div
      key={exam.id}
      className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg group"
    >
      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <ClipboardList className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
          {exam.sourceType && (
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              exam.sourceType === 'upload'
                ? 'bg-blue-100 text-blue-700'
                : exam.sourceType === 'workbook'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {exam.sourceType === 'upload' ? '本地上传' : exam.sourceType === 'workbook' ? '习题册' : '资源库'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{exam.questionCount}题</span>
          <span>{exam.totalScore}分</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPreviewExam(exam)}
          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
          title="预览试卷"
        >
          <Eye className="w-4 h-4" />
        </button>
        {showRemove && isEditingDetail && selectedChapter && (
          <button
            onClick={() => {
              const updatedExams = selectedChapter.exams?.filter(e => e.id !== exam.id) || [];
              const update = (chapters: Chapter[]): Chapter[] => {
                return chapters.map(chapter => {
                  if (chapter.id === selectedChapter.id) {
                    return { ...chapter, exams: updatedExams };
                  }
                  if (chapter.children) {
                    return { ...chapter, children: update(chapter.children) };
                  }
                  return chapter;
                });
              };
              const newChapters = update(chapters);
              setChapters(newChapters);
              addEditChange(`移除试卷：${exam.name}`);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="移除"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // 判断同级小节中是否已有子小节（用于末级节点添加小节时的提示）
  const hasSiblingSubsections = (chapterId: string): { has: boolean; siblings: string[] } => {
    const findChapter = (chapters: Chapter[], targetId: string): Chapter | null => {
      for (const chapter of chapters) {
        if (chapter.id === targetId) return chapter;
        if (chapter.children) {
          const found = findChapter(chapter.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const findParent = (chapters: Chapter[], targetId: string): Chapter | null => {
      for (const chapter of chapters) {
        if (chapter.children?.some(child => child.id === targetId)) {
          return chapter;
        }
        for (const child of chapter.children || []) {
          const found = findParent([child], targetId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const chapter = findChapter(chapters, chapterId);
    if (!chapter) return { has: false, siblings: [] };
    
    const parent = findParent(chapters, chapterId);
    if (!parent || !parent.children) return { has: false, siblings: [] };
    
    // 查找同级的小节（level = 'section'）且有子节点的小节
    const siblingsWithSubsections = parent.children
      .filter(sibling => 
        sibling.id !== chapterId && 
        sibling.level === 'section' && 
        sibling.children && 
        sibling.children.length > 0
      )
      .map(sibling => sibling.name);
    
    return { 
      has: siblingsWithSubsections.length > 0, 
      siblings: siblingsWithSubsections 
    };
  };

  // 判断章节是否有子节点（用于右侧详情展示）
  const hasChildNodes = (chapterId: string): boolean => {
    const findChapter = (chapters: Chapter[], targetId: string): Chapter | null => {
      for (const chapter of chapters) {
        if (chapter.id === targetId) return chapter;
        if (chapter.children) {
          const found = findChapter(chapter.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const chapter = findChapter(chapters, chapterId);
    return chapter ? !!(chapter.children && chapter.children.length > 0) : false;
  };

  // 监听详情页状态变化，通知父组件
  useEffect(() => {
    if (onDetailViewChange) {
      onDetailViewChange(!!selectedTextbook);
    }
  }, [selectedTextbook, onDetailViewChange]);

  // 恢复章节目录滚动位置
  useEffect(() => {
    if (chapterListScrollRef.current && chapterListScrollPositionRef.current > 0) {
      // 使用 requestAnimationFrame 确保 DOM 更新完成后再恢复滚动位置
      requestAnimationFrame(() => {
        if (chapterListScrollRef.current) {
          chapterListScrollRef.current.scrollTop = chapterListScrollPositionRef.current;
        }
      });
    }
  }); // 不添加依赖数组，确保每次渲染后都尝试恢复滚动位置

  // 练习试卷选择弹窗状态
  const [showExamSelector, setShowExamSelector] = useState(false);
  const [tempSelectedExams, setTempSelectedExams] = useState<Exam[]>([]);
  const [examSearchKeyword, setExamSearchKeyword] = useState('');
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);
  // 试卷来源Tab和习题册相关状态

  const [tempSelectedWorkbooks, setTempSelectedWorkbooks] = useState<Workbook[]>([]);
  const [workbookSearchKeyword, setWorkbookSearchKeyword] = useState('');
  // 专题级视图 - 习题册导入弹窗和批量删除弹窗
  const [showWorkbookImportModal, setShowWorkbookImportModal] = useState(false);
  const [showTextbookBatchDeleteModal, setShowTextbookBatchDeleteModal] = useState(false);
  // 习题册预览相关状态
  const [previewingWorkbook, setPreviewingWorkbook] = useState<Workbook | null>(null);
  const [selectedWorkbookChapter, setSelectedWorkbookChapter] = useState<WorkbookChapter | null>(null);
  const [selectedWorkbookSection, setSelectedWorkbookSection] = useState<WorkbookSection | null>(null);
  const [expandedWorkbookChapters, setExpandedWorkbookChapters] = useState<Set<string>>(new Set());

  // 批量删除试卷弹窗状态
  const [showBatchDeleteExamDialog, setShowBatchDeleteExamDialog] = useState(false);

  // 重复试卷检测弹窗状态
  const [showDuplicateExamDialog, setShowDuplicateExamDialog] = useState(false);
  const [duplicateExamNames, setDuplicateExamNames] = useState<string[]>([]);
  const [duplicateExamMode, setDuplicateExamMode] = useState<'skip' | 'all'>('skip');

  // 知识图谱相关状态
  const [selectedKnowledgePointForGraph, setSelectedKnowledgePointForGraph] = useState<KnowledgeRelation | null>(null);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [showSectionKnowledgeGraph, setShowSectionKnowledgeGraph] = useState(true); // 小节级别知识图谱，默认展开

  // 发布相关状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [textbookPublishStates, setTextbookPublishStates] = useState<Record<string, TextbookPublishState>>(mockTextbookPublishState);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false); // 是否有待发布的变更
  const [pendingChangeCount, setPendingChangeCount] = useState(0); // 变更的小节数量
  const [editChanges, setEditChanges] = useState<ChangeItem[]>([]); // 编辑过程中的改动记录

  // 导入专题相关状态
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importValidationStatus, setImportValidationStatus] = useState<'idle' | 'validating' | 'file-error' | 'partial' | 'all-pass' | 'all-row-fail' | 'importing' | 'import-success' | 'import-fail'>('idle');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importValidationSummary, setImportValidationSummary] = useState<{
    fileName: string;
    uploadTime: string;
    totalRows: number;
    passRows: number;
    failRows: number;
  } | null>(null);
  const [importFileErrors, setImportFileErrors] = useState<Array<{
    type: 'file-format' | 'template-structure' | 'header-mismatch' | 'empty-content' | 'parse-failed';
    title: string;
    description: string;
    suggestion: string;
  }>>([]);
  const [importRowResults, setImportRowResults] = useState<Array<{
    rowIndex: number;
    excelRow: number;
    textbookPath: string;
    knowledgeInfo: string;
    result: 'pass' | 'fail';
    errorType?: 'path-invalid' | 'node-not-found' | 'path-modified' | 'path-level-broken' | 'duplicate-node' | 'knowledge-not-found' | 'knowledge-ambiguous' | 'knowledge-duplicate' | 'knowledge-not-leaf' | 'other';
    reason?: string;
  }>>([]);

  // 判断习题册是否已完整添加到专题树（所有章节小节的试卷都已存在）
  const isWorkbookFullyAdded = (wb: Workbook): boolean => {
    // 收集专题树中已有的"习题册来源"试卷，按"章名::小节名"分组
    const existingWorkbookExams = new Map<string, Set<string>>();
    const collectExisting = (chapters: Chapter[], parentChapterName?: string) => {
      for (const ch of chapters) {
        if (ch.children && ch.children.length > 0) {
          collectExisting(ch.children, ch.name);
        } else {
          // 末级节点
          if (ch.exams) {
            const matchKey = parentChapterName ? `${parentChapterName}::${ch.name}` : ch.name;
            const existing = existingWorkbookExams.get(matchKey) || new Set<string>();
            ch.exams.forEach(e => {
              if (e.sourceType === 'workbook') {
                existing.add(e.name);
              }
            });
            existingWorkbookExams.set(matchKey, existing);
          }
        }
      }
    };
    collectExisting(chapters);

    // 检查习题册的每个小节试卷是否都在专题树中存在
    for (const ch of wb.chapters) {
      if (ch.children) {
        for (const sec of ch.children) {
          const matchKey = `${ch.name}::${sec.name}`;
          const existingNames = existingWorkbookExams.get(matchKey);
          if (!existingNames) return false; // 该小节没有任何习题册试卷
          for (const exam of sec.exams) {
            if (!existingNames.has(exam.name)) return false; // 该试卷不存在
          }
        }
      }
      if (ch.exams && ch.exams.length > 0) {
        const existingNames = existingWorkbookExams.get(ch.name);
        if (!existingNames) return false;
        for (const exam of ch.exams) {
          if (!existingNames.has(exam.name)) return false;
        }
      }
    }
    return true;
  };

  // 试卷选择弹窗确认逻辑（供确认按钮和重复试卷弹窗共用）
  const executeExamConfirm = (skipDuplicates: boolean = true) => {
    if (selectedChapterId && tempSelectedExams.length > 0) {
      setChapters(prevChapters => {
        // 遍历专题树，将选中的试卷添加到当前小节
        const update = (chapters: Chapter[]): Chapter[] => {
          return chapters.map(chapter => {
            // 末级节点（小节）
            if (!chapter.children || chapter.children.length === 0) {
              if (chapter.id === selectedChapterId) {
                const existingExams = chapter.exams || [];
                const existingExamNames = new Set(existingExams.map(e => e.name));
                const newExams = skipDuplicates
                  ? tempSelectedExams.filter(e => !existingExamNames.has(e.name))
                  : tempSelectedExams;
                if (newExams.length > 0) {
                  return { ...chapter, exams: [...existingExams, ...newExams] };
                }
              }
              return chapter;
            }
            // 非末级节点（章），递归处理子节点
            if (chapter.children) {
              return { ...chapter, children: update(chapter.children) };
            }
            return chapter;
          });
        };

        return update(prevChapters);
      });
    }
    setShowExamSelector(false);
    setTempSelectedExams([]);
    setExamSearchKeyword('');
    setShowDuplicateExamDialog(false);
    setDuplicateExamNames([]);
    setDuplicateExamMode('skip');
  };

  // 专题级习题册导入（不限于当前小节，匹配所有章节）
  const executeWorkbookImport = (skipDuplicates: boolean = true) => {
    if (tempSelectedWorkbooks.length > 0) {
      setChapters(prevChapters => {
        // 1. 收集习题册中所有小节的试卷，按"章名::小节名"分组
        const workbookExamMap = new Map<string, Exam[]>();
        for (const wb of tempSelectedWorkbooks) {
          for (const ch of wb.chapters) {
            if (ch.children) {
              for (const sec of ch.children) {
                const key = `${ch.name}::${sec.name}`;
                const existing = workbookExamMap.get(key) || [];
                workbookExamMap.set(key, [...existing, ...sec.exams]);
              }
            }
            if (ch.exams && ch.exams.length > 0) {
              const key = ch.name;
              const existing = workbookExamMap.get(key) || [];
              workbookExamMap.set(key, [...existing, ...ch.exams]);
            }
          }
        }

        // 2. 遍历专题树，按"章名::小节名"完全匹配并添加试卷
        const update = (chapters: Chapter[], parentChapterName?: string): Chapter[] => {
          return chapters.map(chapter => {
            if (!chapter.children || chapter.children.length === 0) {
              const existingExams = chapter.exams || [];
              const existingExamNames = new Set(existingExams.map(e => e.name));
              const matchKey = parentChapterName ? `${parentChapterName}::${chapter.name}` : chapter.name;
              const rawWorkbookExams = workbookExamMap.get(matchKey) || [];
              const workbookExamsForThis = skipDuplicates
                ? rawWorkbookExams.filter(e => !existingExamNames.has(e.name))
                : rawWorkbookExams;
              if (workbookExamsForThis.length > 0) {
                return { ...chapter, exams: [...existingExams, ...workbookExamsForThis] };
              }
              return chapter;
            }
            if (chapter.children) {
              return { ...chapter, children: update(chapter.children, chapter.name) };
            }
            return chapter;
          });
        };

        return update(prevChapters);
      });
    }
    setShowWorkbookImportModal(false);
    setTempSelectedWorkbooks([]);
    setWorkbookSearchKeyword('');
    setShowDuplicateExamDialog(false);
    setDuplicateExamNames([]);
    setDuplicateExamMode('skip');
  };

  // 添加改动记录的辅助函数
  const addEditChange = (description: string, changedBy?: string, changedByRole?: 'supervisor' | 'teacher', changedByAccount?: string) => {
    // 检查是否已存在相同的描述
    const exists = editChanges.some(c => c.description === description);
    if (!exists) {
      const changeItem: ChangeItem = {
        description,
        changedBy: changedBy || '当前用户',
        changedByRole: changedByRole || (isTeacher ? 'teacher' : 'supervisor'),
        changedByAccount: changedByAccount || String(Math.floor(100000 + Math.random() * 900000)),
      };
      setEditChanges(prev => [...prev, changeItem]);
      // 设置待发布状态
      setHasUnpublishedChanges(true);
      setPendingChangeCount(prev => prev + 1);
    }
  };

  // 从通用知识树获取知识点的前置关系
  const getPrerequisiteKnowledge = (knowledgeId: string, knowledgeName?: string): KnowledgeRelation[] => {
    console.log('[getPrerequisiteKnowledge] 查找前置关系:', { knowledgeId, knowledgeName });
    
    // 首先尝试根据名称查找前置关系
    if (knowledgeName) {
      const relations = findKnowledgeRelationsByName(knowledgeName);
      console.log('[getPrerequisiteKnowledge] 名称查找结果:', relations);
      if (relations.prerequisiteKnowledge.length > 0) {
        return relations.prerequisiteKnowledge;
      }
    }
    
    // 如果名称查找失败，尝试根据ID查找
    const node = findKnowledgeNodeById(knowledgeId);
    console.log('[getPrerequisiteKnowledge] ID查找结果:', node);
    if (node && node.prerequisiteKnowledge) {
      return node.prerequisiteKnowledge;
    }
    
    return [];
  };

  // 从通用知识树获取知识点的延伸关系
  const getExtensionKnowledge = (knowledgeId: string, knowledgeName?: string): KnowledgeRelation[] => {
    // 首先尝试根据名称查找延伸关系
    if (knowledgeName) {
      const relations = findKnowledgeRelationsByName(knowledgeName);
      if (relations.extensionKnowledge.length > 0) {
        return relations.extensionKnowledge;
      }
    }
    
    // 如果名称查找失败，尝试根据ID查找
    const node = findKnowledgeNodeById(knowledgeId);
    if (node && node.extensionKnowledge) {
      return node.extensionKnowledge;
    }
    
    return [];
  };

  // 根据ID查找知识点详情（用于递归获取前置的前置）- 使用共享数据
  const findKnowledgeNodeForGraph = (nodeId: string): KnowledgeRelation & { prerequisiteKnowledge?: KnowledgeRelation[] } | null => {
    const node = findKnowledgeNodeById(nodeId);
    if (node) {
      return {
        id: node.id,
        name: node.name,
        isModule: node.children && node.children.length > 0,
        prerequisiteKnowledge: node.prerequisiteKnowledge || [],
      };
    }
    return null;
  };

  // 查找当前节所属的章
  const findParentChapter = (sectionId: string): Chapter | null => {
    for (const chapter of chapters) {
      if (chapter.children?.some(section => section.id === sectionId)) {
        return chapter;
      }
    }
    return null;
  };

  // 生成知识点弹窗标题（针对三级小节）
  // 格式：【专题X -X.X 节名称】
  // 例如：【专题1 -1.1 二次函数】
  const generateKpDialogTitle = (subsectionId: string): string => {
    // 遍历所有章
    for (const chapter of chapters) {
      if (!chapter.children) continue;
      
      // 遍历章下的二级小节
      for (const section of chapter.children) {
        if (!section.children) continue;
        
        // 检查三级小节是否属于这个二级小节
        const subsection = section.children.find(sub => sub.id === subsectionId);
        if (subsection) {
          // 找到了，组装标题
          // chapter.name 格式: "专题1 二次函数" -> 提取 "专题1"
          // section.name 格式: "1.1 二次函数" -> 保留完整
          
          // 提取章的序号（如 "专题1 二次函数" -> "专题1"）
          const chapterOrderMatch = chapter.name.match(/^专题\d+/);
          const chapterOrder = chapterOrderMatch ? chapterOrderMatch[0] : chapter.name;
          
          // 节的完整名称（如 "1.1 二次函数"）
          const sectionName = section.name;
          
          return `${chapterOrder} -${sectionName}`;
        }
      }
    }
    
    return '知识点';
  };

  // 计算知识点总数（包括子知识点）
  const getTotalKnowledgePoints = (knowledgePoints?: KnowledgeRelation[]): number => {
    if (!knowledgePoints) return 0;
    return knowledgePoints.reduce((sum, kp) => {
      // 主知识点(1) + 子知识点
      return sum + 1 + (kp.extendedPoints?.length || 0);
    }, 0);
  };

  // 发布处理函数
  const handlePublish = (version: string, description: string, scheduledInfo?: { scheduledDate: string; scheduledTime: string }) => {
    if (!selectedTextbook) return;

    if (scheduledInfo) {
      // 定时发布：保存定时发布信息，不立即发布
      setTextbookPublishStates(prev => ({
        ...prev,
        [selectedTextbook.id]: {
          ...prev[selectedTextbook.id],
          status: 'published',
          pendingChanges: 0, // 清空待发布变更数量
          scheduledPublish: {
            version,
            scheduledDate: scheduledInfo.scheduledDate,
            scheduledTime: scheduledInfo.scheduledTime,
            description,
          },
        },
      }));

      // 重置待发布状态
      setHasUnpublishedChanges(false);
      setPendingChangeCount(0);
      setEditChanges([]);
    } else {
      // 立即发布
      const now = new Date();
      const publishTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // 生成6位随机数字账号
      const publisherAccount = String(Math.floor(100000 + Math.random() * 900000));

      const newRecord: PublishRecord = {
        version,
        description,
        publishTime,
        publisher: '当前用户',
        publisherAccount,
      };

      // 更新发布状态
      setTextbookPublishStates(prev => ({
        ...prev,
        [selectedTextbook.id]: {
          status: 'published',
          currentVersion: version,
          lastPublishTime: publishTime,
          lastPublisher: '当前用户',
          pendingChanges: 0,
          changedItems: [],
          publishHistory: [newRecord, ...(prev[selectedTextbook.id]?.publishHistory || [])],
        },
      }));

      // 更新专题数据中的版本信息
      setTextbooks(prev => prev.map(t => 
        t.id === selectedTextbook.id 
          ? {
              ...t,
              currentVersion: version,
              lastPublishTime: publishTime,
              lastPublisher: '当前用户',
              publishHistory: [newRecord, ...(t.publishHistory || [])],
            }
          : t
      ));

      // 重置待发布状态
      setHasUnpublishedChanges(false);
      setPendingChangeCount(0);
      setEditChanges([]);
    }
  };

  // 取消定时发布
  const handleCancelScheduled = () => {
    if (!selectedTextbook) return;
    setTextbookPublishStates(prev => ({
      ...prev,
      [selectedTextbook.id]: {
        ...prev[selectedTextbook.id],
        scheduledPublish: undefined,
        status: 'pending',
        pendingChanges: prev[selectedTextbook.id]?.pendingChanges || 1,
      },
    }));
  };

  // 当完成编辑时，标记有待发布变更
  const handleFinishEditing = () => {
    setIsEditing(false);
    setHasUnpublishedChanges(true);
    // 如果没有记录到具体改动，添加默认提示
    if (editChanges.length === 0) {
      setEditChanges([{
        description: '专题内容已修改',
        changedBy: '当前用户',
        changedByRole: isTeacher ? 'teacher' : 'supervisor',
        changedByAccount: String(Math.floor(100000 + Math.random() * 900000)),
      }]);
    }
  };

  // 当选中的章节变化时，初始化展开状态（所有主知识点默认展开）
  React.useEffect(() => {
    if (selectedChapter?.knowledgePoints) {
      const newExpandedSet = new Set<string>();
      selectedChapter.knowledgePoints.forEach(kp => {
        // 所有主知识点都默认展开
        newExpandedSet.add(kp.id);
      });
      setExpandedChapterKps(newExpandedSet);
    }
  }, [selectedChapter?.id]); // 只在章节ID变化时触发

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 知识点拖拽排序处理
  const handleKpDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = selectedKnowledgePoints.findIndex(kp => kp.id === active.id);
    const newIndex = selectedKnowledgePoints.findIndex(kp => kp.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(selectedKnowledgePoints, oldIndex, newIndex);
      setSelectedKnowledgePoints(newItems);
    }
  };

  // 可拖拽的知识点项组件（弹窗内使用）
  const SortableKnowledgePoint: React.FC<{
    kp: KnowledgeRelation;
    index: number;
    onRemove: (id: string) => void;
  }> = ({ kp, index, onRemove }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: kp.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isExpanded = expandedKnowledgePoints.has(kp.id);
    const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;

    // 切换展开状态
    const toggleExpand = () => {
      const newSet = new Set(expandedKnowledgePoints);
      if (isExpanded) {
        newSet.delete(kp.id);
      } else {
        newSet.add(kp.id);
      }
      setExpandedKnowledgePoints(newSet);
    };

    // 延伸知识点拖拽排序处理
    const handleExtendedKpDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (!over || active.id === over.id) return;

      const oldIndex = kp.extendedPoints?.findIndex(ep => ep.id === active.id) ?? -1;
      const newIndex = kp.extendedPoints?.findIndex(ep => ep.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1 && kp.extendedPoints) {
        const newExtendedPoints = arrayMove(kp.extendedPoints, oldIndex, newIndex);
        // 更新主知识点的延伸知识点
        const updatedKnowledgePoints = selectedKnowledgePoints.map(item => 
          item.id === kp.id ? { ...item, extendedPoints: newExtendedPoints } : item
        );
        setSelectedKnowledgePoints(updatedKnowledgePoints);
      }
    };

    // 可拖拽的延伸知识点项组件
    const SortableExtendedPoint: React.FC<{
      ep: ExtendedKnowledgePoint;
      epIndex: number;
      onRemoveExtended: (epId: string) => void;
    }> = ({ ep, epIndex, onRemoveExtended }) => {
      const {
        attributes: epAttributes,
        listeners: epListeners,
        setNodeRef: epSetNodeRef,
        transform: epTransform,
        transition: epTransition,
        isDragging: epIsDragging,
      } = useSortable({ id: ep.id });

      const epStyle = {
        transform: CSS.Transform.toString(epTransform),
        transition: epTransition,
        opacity: epIsDragging ? 0.5 : 1,
      };

      return (
        <div
          ref={epSetNodeRef}
          style={epStyle}
          className={`flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded ${
            epIsDragging ? 'shadow-lg' : ''
          }`}
        >
          <div
            {...epAttributes}
            {...epListeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
          >
            <GripVertical className="w-3 h-3" />
          </div>
          <span className="text-xs text-gray-500 font-medium">{index + 1}.{epIndex + 1}</span>
          <span className="flex-1 text-sm text-gray-700">{ep.name}</span>
          <button
            onClick={() => onRemoveExtended(ep.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    };

    // 删除延伸知识点
    const handleRemoveExtendedPoint = (epId: string) => {
      const newExtendedPoints = kp.extendedPoints?.filter(ep => ep.id !== epId) || [];
      const updatedKnowledgePoints = selectedKnowledgePoints.map(item => 
        item.id === kp.id ? { ...item, extendedPoints: newExtendedPoints } : item
      );
      setSelectedKnowledgePoints(updatedKnowledgePoints);
    };

    return (
      <div className="space-y-1">
        {/* 主知识点行 */}
        <div
          ref={setNodeRef}
          style={style}
          className={`flex items-center gap-3 p-2 bg-white border border-emerald-200 rounded-lg ${
            isDragging ? 'shadow-lg' : ''
          }`}
        >
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
          <span className="flex-1 text-sm font-medium text-gray-900">{kp.name}</span>
          
          {/* 展开/收起按钮 */}
          <button
            onClick={toggleExpand}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title={isExpanded ? '收起延伸知识点' : '展开延伸知识点'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={() => onRemove(kp.id)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 延伸知识点区域 */}
        {isExpanded && (
          <div className="ml-10 space-y-1">
            {/* 已有延伸知识点 */}
            {hasExtendedPoints && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleExtendedKpDragEnd}
              >
                <SortableContext
                  items={kp.extendedPoints!.map(ep => ep.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {kp.extendedPoints!.map((ep, epIndex) => (
                    <SortableExtendedPoint
                      key={ep.id}
                      ep={ep}
                      epIndex={epIndex}
                      onRemoveExtended={handleRemoveExtendedPoint}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
            
            {/* 添加延伸知识点按钮 */}
            {addingExtendedKpParentId === kp.id ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-dashed border-gray-300 rounded">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedKp = availableKnowledgePoints.find(k => k.id === e.target.value);
                      if (selectedKp) {
                        // 检查是否已存在
                        const exists = kp.extendedPoints?.some(ep => ep.id === selectedKp.id);
                        if (!exists) {
                          const newExtendedPoint: ExtendedKnowledgePoint = {
                            id: selectedKp.id,
                            name: selectedKp.name,
                          };
                          const newExtendedPoints = [...(kp.extendedPoints || []), newExtendedPoint];
                          const updatedKnowledgePoints = selectedKnowledgePoints.map(item => 
                            item.id === kp.id ? { ...item, extendedPoints: newExtendedPoints } : item
                          );
                          setSelectedKnowledgePoints(updatedKnowledgePoints);
                        }
                      }
                      setAddingExtendedKpParentId(null);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                >
                  <option value="">选择知识点...</option>
                  {availableKnowledgePoints
                    .filter(k => 
                      !selectedKnowledgePoints.some(sk => sk.id === k.id) &&
                      !kp.extendedPoints?.some(ep => ep.id === k.id)
                    )
                    .map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                </select>
                <button
                  onClick={() => setAddingExtendedKpParentId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingExtendedKpParentId(kp.id)}
                className="flex items-center gap-1 w-full p-2 text-sm text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors border border-dashed border-gray-200"
              >
                <Plus className="w-3 h-3" />
                添加延伸知识点
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // 章节详情页面的知识点项组件（支持拖拽和删除）
  const ChapterKnowledgePoint: React.FC<{
    kp: KnowledgeRelation;
    index: number;
    chapterId: string;
  }> = ({ kp, index, chapterId }) => {
    const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;
    
    // 使用外部状态管理展开状态
    const isExpanded = expandedChapterKps.has(kp.id);
    
    // 切换展开状态
    const toggleExpand = () => {
      const newSet = new Set(expandedChapterKps);
      if (isExpanded) {
        newSet.delete(kp.id);
      } else {
        newSet.add(kp.id);
      }
      setExpandedChapterKps(newSet);
    };

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: kp.id, disabled: !isEditing });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // 延伸知识点拖拽排序处理
    const handleExtendedKpDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (!over || active.id === over.id) return;

      const oldIndex = kp.extendedPoints?.findIndex(ep => ep.id === active.id) ?? -1;
      const newIndex = kp.extendedPoints?.findIndex(ep => ep.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1 && kp.extendedPoints) {
        const newExtendedPoints = arrayMove(kp.extendedPoints, oldIndex, newIndex);
        // 更新章节的知识点
        updateChapterKnowledgePoints(chapterId, kp.id, newExtendedPoints);
      }
    };

    // 删除延伸知识点
    const handleRemoveExtendedPoint = (epId: string) => {
      const newExtendedPoints = kp.extendedPoints?.filter(ep => ep.id !== epId) || [];
      updateChapterKnowledgePoints(chapterId, kp.id, newExtendedPoints);
    };

    // 删除主知识点
    const handleRemoveMainKp = () => {
      const deleteKnowledgePoint = (chapters: Chapter[], chapterId: string, kpId: string): Chapter[] => {
        return chapters.map(chapter => {
          if (chapter.id === chapterId) {
            return {
              ...chapter,
              knowledgePoints: chapter.knowledgePoints?.filter(kp => kp.id !== kpId) || []
            };
          }
          if (chapter.children) {
            return { ...chapter, children: deleteKnowledgePoint(chapter.children, chapterId, kpId) };
          }
          return chapter;
        });
      };
      setChapters(deleteKnowledgePoint(chapters, chapterId, kp.id));
      // 同时从展开状态中移除
      const newSet = new Set(expandedChapterKps);
      newSet.delete(kp.id);
      setExpandedChapterKps(newSet);
    };

    return (
      <div className="space-y-0">
        {/* 主知识点行 */}
        <div
          ref={setNodeRef}
          style={style}
          className={`flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded ${
            isDragging ? 'shadow-lg' : ''
          }`}
        >
          {isEditingTree && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="flex-1 text-sm text-gray-700">{kp.name}</span>
          
          {/* 展开/收起按钮 - 有延伸知识点时显示 */}
          {hasExtendedPoints && (
            <button
              onClick={toggleExpand}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title={isExpanded ? '收起延伸知识点' : '展开延伸知识点'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          {isEditingTree && (
            <button
              onClick={handleRemoveMainKp}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 延伸知识点区域 */}
        {isExpanded && hasExtendedPoints && (
          <div className="ml-4 py-1 space-y-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleExtendedKpDragEnd}
            >
              <SortableContext
                items={kp.extendedPoints!.map(ep => ep.id)}
                strategy={verticalListSortingStrategy}
              >
                {kp.extendedPoints!.map((ep, epIndex) => (
                  <ChapterExtendedPoint
                    key={ep.id}
                    ep={ep}
                    epIndex={epIndex}
                    mainIndex={index}
                    onRemove={handleRemoveExtendedPoint}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    );
  };

  // 章节详情页面的延伸知识点项组件
  const ChapterExtendedPoint: React.FC<{
    ep: ExtendedKnowledgePoint;
    epIndex: number;
    mainIndex: number;
    onRemove: (epId: string) => void;
  }> = ({ ep, epIndex, mainIndex, onRemove }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: ep.id, disabled: !isEditing });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-100 rounded ${
          isDragging ? 'shadow-lg' : ''
        }`}
      >
        {isEditingTree && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
          >
            <GripVertical className="w-3 h-3" />
          </div>
        )}
        <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
        <span className="flex-1 text-sm text-gray-600">{ep.name}</span>
        {isEditingTree && (
          <button
            onClick={() => onRemove(ep.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  // 更新章节的知识点（延伸知识点）
  const updateChapterKnowledgePoints = (chapterId: string, kpId: string, newExtendedPoints: ExtendedKnowledgePoint[]) => {
    const update = (chapters: Chapter[]): Chapter[] => {
      return chapters.map(chapter => {
        if (chapter.id === chapterId) {
          return {
            ...chapter,
            knowledgePoints: chapter.knowledgePoints?.map(kp => 
              kp.id === kpId ? { ...kp, extendedPoints: newExtendedPoints } : kp
            ) || []
          };
        }
        if (chapter.children) {
          return { ...chapter, children: update(chapter.children) };
        }
        return chapter;
      });
    };
    const updatedChapters = update(chapters);
    setChapters(updatedChapters);
    // selectedChapter 会通过 useMemo 自动从更新后的 chapters 中计算，无需手动同步
  };

  // 章节详情页面主知识点拖拽排序处理
  const handleChapterKpDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    if (!selectedChapter) return;

    const knowledgePoints = selectedChapter.knowledgePoints || [];
    const oldIndex = knowledgePoints.findIndex(kp => kp.id === active.id);
    const newIndex = knowledgePoints.findIndex(kp => kp.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newKnowledgePoints = arrayMove(knowledgePoints, oldIndex, newIndex);
      
      // 更新章节的知识点
      const update = (chapters: Chapter[]): Chapter[] => {
        return chapters.map(chapter => {
          if (chapter.id === selectedChapter.id) {
            return { ...chapter, knowledgePoints: newKnowledgePoints };
          }
          if (chapter.children) {
            return { ...chapter, children: update(chapter.children) };
          }
          return chapter;
        });
      };
      setChapters(update(chapters));
    }
  };

  // 按场景分组专题
  const groupedTextbooks = scenes.reduce((acc, scene) => {
    const books = textbooks.filter(
      (book) => book.scene === scene.name && 
        (selectedScene === 'all' || book.scene === selectedScene)
    );
    if (books.length > 0) {
      acc[scene.name] = books;
    }
    return acc;
  }, {} as Record<string, Textbook[]>);

  // 切换章节展开状态
  const toggleChapter = (chapterId: string, chaptersList: Chapter[]): Chapter[] => {
    return chaptersList.map((chapter) => {
      if (chapter.id === chapterId) {
        return { ...chapter, expanded: !chapter.expanded };
      }
      if (chapter.children) {
        return {
          ...chapter,
          children: toggleChapter(chapterId, chapter.children),
        };
      }
      return chapter;
    });
  };

  // 生成章节编号
  const generateChapterNumber = (parentId: string | null, chaptersList: Chapter[]): string => {
    if (parentId === null || parentId === 'root') {
      // 顶级，生成"专题X"格式
      const chapterCount = chaptersList.filter(c => c.level === 'chapter').length;
      return `专题${chapterCount + 1}`;
    } else {
      // 找到父章节及其子章节数量
      const findParentAndCount = (chapters: Chapter[], targetId: string): { childCount: number; parentNumber: string } | null => {
        for (const chapter of chapters) {
          // 提取当前章节的编号
          // 支持 "专题X 名称" 和 "X.Y.Z 名称" 两种格式
          let currentNumber = '';
          
          // 匹配 "专题X" 格式
          const topicMatch = chapter.name.match(/^专题(\d+)\s/);
          if (topicMatch) {
            currentNumber = topicMatch[1];
          } else {
            // 匹配 "X.Y.Z" 格式
            const numberMatch = chapter.name.match(/^(\d+(?:\.\d+)*)\s/);
            if (numberMatch) {
              currentNumber = numberMatch[1];
            }
          }
          
          if (chapter.id === targetId) {
            return { 
              childCount: chapter.children?.length || 0, 
              parentNumber: currentNumber 
            };
          }
          if (chapter.children && chapter.children.length > 0) {
            const result = findParentAndCount(chapter.children, targetId);
            if (result) return result;
          }
        }
        return null;
      };
      
      const result = findParentAndCount(chaptersList, parentId);
      if (result) {
        const { childCount, parentNumber } = result;
        if (parentNumber) {
          return `${parentNumber}.${childCount + 1}`;
        }
      }
      return '1.1';
    }
  };

  // 数字转中文大写
  const numberToChinese = (num: number): string => {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (num <= 10) {
      return chineseNumbers[num];
    } else if (num < 20) {
      return '十' + (num % 10 === 0 ? '' : chineseNumbers[num % 10]);
    } else if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      return chineseNumbers[tens] + '十' + (ones === 0 ? '' : chineseNumbers[ones]);
    }
    return num.toString();
  };

  // 生成预填的章节标题（专题体系：输入框为空，不自动生成）
  const generateDefaultChapterTitle = (_parentId: string | null): string => {
    return '';
  };

  // 添加章节
  // parentId === null: 底部"添加章"按钮 → 追加到末尾
  // parentId 是具体章节ID: 点击章节的【+添加子节】按钮 → 追加到该章节子节点的最后一个位置
  const handleAddChapter = (parentId: string | null, name: string) => {
    // 确定新节点的层级
    let newLevel: 'chapter' | 'section' | 'subsection' = 'chapter';
    if (parentId && parentId !== 'root') {
      const findParent = (chapters: Chapter[], targetId: string): Chapter | null => {
        for (const chapter of chapters) {
          if (chapter.id === targetId) return chapter;
          if (chapter.children) {
            const found = findParent(chapter.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      const parent = findParent(chapters, parentId);
      if (parent) {
        // 根据父节点层级确定新节点层级
        if (parent.level === 'chapter') {
          newLevel = 'section';
        } else if (parent.level === 'section') {
          newLevel = 'subsection';
        }
      } else {
        newLevel = 'section';
      }
    }
    
    const newChapter: Chapter = {
      id: `c${Date.now()}`,
      textbookId: selectedTextbook?.id || '',
      name: name, // 直接使用用户输入的内容（已包含预填的序号）
      level: newLevel,
      order: 0,
      parentId: parentId === 'root' ? undefined : (parentId || undefined),
      knowledgePoints: [],
    };
    
    if (parentId === null || parentId === 'root') {
      // 底部"添加章"按钮 → 追加到末尾
      setChapters([...chapters, newChapter]);
      addEditChange(`新增章节：${newChapter.name}`);
    } else {
      // 添加子章节，追加到最后
      const addToParent = (chaptersList: Chapter[]): Chapter[] => {
        return chaptersList.map((chapter) => {
          if (chapter.id === parentId) {
            return {
              ...chapter,
              expanded: true,
              children: [...(chapter.children || []), newChapter],
            };
          }
          if (chapter.children) {
            return { ...chapter, children: addToParent(chapter.children) };
          }
          return chapter;
        });
      };
      
      setChapters(addToParent(chapters));
      addEditChange(`新增章节：${newChapter.name}`);
    }
  };

  // 更新章节名称
  const handleUpdateChapterName = (chapterId: string, newName: string) => {
    // 先获取旧名称
    const findChapterName = (chaptersList: Chapter[], targetId: string): string | null => {
      for (const chapter of chaptersList) {
        if (chapter.id === targetId) return chapter.name;
        if (chapter.children) {
          const found = findChapterName(chapter.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const oldName = findChapterName(chapters, chapterId);
    
    const updateName = (chaptersList: Chapter[]): Chapter[] => {
      return chaptersList.map((chapter) => {
        if (chapter.id === chapterId) {
          return { ...chapter, name: newName };
        }
        if (chapter.children) {
          return { ...chapter, children: updateName(chapter.children) };
        }
        return chapter;
      });
    };
    setChapters(updateName(chapters));
    
    // 记录变更
    if (oldName && oldName !== newName) {
      addEditChange(`修改章节名称：${oldName} → ${newName}`);
    }
  };

  // 删除章节
  const handleDeleteChapter = (chapterId: string) => {
    // 先找到要删除的章节名称
    const findChapterName = (chaptersList: Chapter[], targetId: string): string | null => {
      for (const chapter of chaptersList) {
        if (chapter.id === targetId) return chapter.name;
        if (chapter.children) {
          const found = findChapterName(chapter.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const deletedName = findChapterName(chapters, chapterId);
    
    const deleteFromList = (chaptersList: Chapter[]): Chapter[] => {
      return chaptersList
        .filter((chapter) => chapter.id !== chapterId)
        .map((chapter) => {
          if (chapter.children) {
            return { ...chapter, children: deleteFromList(chapter.children) };
          }
          return chapter;
        });
    };
    setChapters(deleteFromList(chapters));
    if (selectedChapter?.id === chapterId) {
      setSelectedChapterId(null);
    }
    if (deletedName) {
      addEditChange(`删除章节：${deletedName}`);
    }
  };

  // 可排序章节节点组件
  const SortableChapterNode: React.FC<{
    chapter: Chapter;
    depth: number;
  }> = ({ chapter, depth }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: chapter.id,
      disabled: !isEditingTree || isTeacher, // 只有编辑树模式且非教研员才能拖拽
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const hasChildren = chapter.children && chapter.children.length > 0;
    const isSelected = selectedChapter?.id === chapter.id;
    const isHovered = hoveredChapterId === chapter.id;
    const isEditingThis = editingChapterId === chapter.id;
    const paddingLeft = depth * 20;

    return (
      <div ref={setNodeRef} style={style}>
        <div
          onMouseEnter={() => setHoveredChapterId(chapter.id)}
          onMouseLeave={() => setHoveredChapterId(null)}
          onClick={() => !isEditingThis && setSelectedChapterId(chapter.id)}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all relative ${
            isDragging ? 'bg-emerald-100 shadow-lg' :
            isSelected
              ? 'bg-emerald-50 border border-emerald-200'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          {/* 拖拽手柄 - 仅编辑树模式且非教研员显示 */}
          {isEditingTree && !isTeacher && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 mr-1 text-gray-400 hover:text-gray-600"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChapters(toggleChapter(chapter.id, chapters));
              }}
              className="flex-shrink-0"
            >
              {chapter.expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          
          {isEditingThis ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={chapterInputValue}
                onChange={(e) => setChapterInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chapterInputValue.trim()) {
                    e.preventDefault();
                    const value = chapterInputValue.trim();
                    setTimeout(() => {
                      handleUpdateChapterName(chapter.id, value);
                      setEditingChapterId(null);
                      setChapterInputValue('');
                    }, 0);
                  } else if (e.key === 'Escape') {
                    setEditingChapterId(null);
                    setChapterInputValue('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-sm border border-emerald-500 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (chapterInputValue.trim()) {
                    handleUpdateChapterName(chapter.id, chapterInputValue.trim());
                    setEditingChapterId(null);
                    setChapterInputValue('');
                  }
                }}
                className="px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-300 hover:border-emerald-400 font-medium"
              >
                保存
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChapterId(null);
                  setChapterInputValue('');
                }}
                className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 rounded border border-gray-300 hover:border-gray-400 font-medium"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-900">{chapter.name}</span>
              
              {/* 知识点数量显示 */}
              {chapter.level === 'section' && chapter.knowledgePoints && (
                <span className="text-xs text-gray-400 ml-auto">
                  {getTotalKnowledgePoints(chapter.knowledgePoints)}个知识点
                </span>
              )}
              {chapter.level === 'chapter' && chapter.children && (
                <span className="text-xs text-gray-400 ml-auto">
                  {chapter.children.reduce((sum, section) => sum + getTotalKnowledgePoints(section.knowledgePoints), 0)}个知识点
                </span>
              )}
              
              {/* 编辑树模式下悬停显示操作按钮 - 教研员不显示 */}
              {isEditingTree && !isTeacher && isHovered && !isEditingThis && (
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChapterId(chapter.id);
                      setChapterInputValue(chapter.name);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingChapterId(chapter.id);
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
        
        {/* 子章节 */}
        {hasChildren && chapter.expanded && (
          <SortableContext
            items={chapter.children!.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapter.children!.map((child) => (
              <SortableChapterNode key={child.id} chapter={child} depth={depth + 1} />
            ))}
          </SortableContext>
        )}
        
        {/* 添加子节按钮 - 在章节/小节展开且编辑树模式下显示，子节（第三层）不能再添加，教研员不显示 */}
        {chapter.level !== 'subsection' && isEditingTree && !isTeacher && (chapter.expanded || !hasChildren) && (
          addingChapterParentId === null ? (
            <button
              onClick={() => {
                // 检查是否为末级节点且已维护数据
                const isLeaf = isLeafNode(chapter.id);
                if (isLeaf) {
                  const { hasContent, data } = hasLeafNodeContent(chapter.id);
                  if (hasContent) {
                    // 末级节点有数据，弹出确认弹窗
                    setPendingLeafNodeId(chapter.id);
                    setPendingLeafNodeData(data);
                    // 检查同级是否有子小节
                    const { has, siblings } = hasSiblingSubsections(chapter.id);
                    setPendingSiblingSubsections(siblings);
                    setShowLeafNodeConfirm(true);
                    return;
                  }
                  // 末级节点无数据，但检查同级是否有子小节
                  const { has, siblings } = hasSiblingSubsections(chapter.id);
                  if (has) {
                    setPendingLeafNodeId(chapter.id);
                    setPendingLeafNodeData(null);
                    setPendingSiblingSubsections(siblings);
                    setShowLeafNodeConfirm(true);
                    return;
                  }
                }
                // 非末级节点或末级节点无数据且无同级子小节，直接进入添加流程
                setAddingChapterParentId(chapter.id);
                setChapterInputValue(generateDefaultChapterTitle(chapter.id));
              }}
              className="w-full flex items-center gap-2 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              style={{ paddingLeft: `${(depth + 1) * 20 + 12 + (isEditing ? 36 : 0)}px` }}
            >
              <Plus className="w-4 h-4" />
              添加小节
            </button>
          ) : addingChapterParentId === chapter.id ? (
            <div
              className="flex items-center gap-2 py-2"
              style={{ paddingLeft: `${(depth + 1) * 20 + 12 + (isEditing ? 36 : 0)}px` }}
            >
              <input
                type="text"
                value={chapterInputValue}
                onChange={(e) => setChapterInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chapterInputValue.trim()) {
                    e.preventDefault();
                    const value = chapterInputValue.trim();
                    setTimeout(() => {
                      handleAddChapter(chapter.id, value);
                      setAddingChapterParentId(null);
                      setChapterInputValue('');
                    }, 0);
                  } else if (e.key === 'Escape') {
                    setAddingChapterParentId(null);
                    setChapterInputValue('');
                  }
                }}
                placeholder="请输入小节名称"
                className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <button
                onClick={() => {
                  if (chapterInputValue.trim()) {
                    handleAddChapter(chapter.id, chapterInputValue.trim());
                    setAddingChapterParentId(null);
                    setChapterInputValue('');
                  }
                }}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setAddingChapterParentId(null);
                  setChapterInputValue('');
                }}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null
        )}
      </div>
    );
  };

  // 扁平化章节列表（用于拖拽）
  const flattenChapters = (chaptersList: Chapter[], parentId?: string): Array<Chapter & { parentId?: string }> => {
    const result: Array<Chapter & { parentId?: string }> = [];
    for (const chapter of chaptersList) {
      result.push({ ...chapter, parentId });
      if (chapter.children && chapter.children.length > 0) {
        result.push(...flattenChapters(chapter.children, chapter.id));
      }
    }
    return result;
  };

  // 拖拽处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 找到拖拽的章节和目标章节
    const findChapter = (chapters: Chapter[], id: string): { chapter: Chapter; parent: Chapter | null; index: number } | null => {
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].id === id) {
          return { chapter: chapters[i], parent: null, index: i };
        }
        if (chapters[i].children) {
          const found = findChapter(chapters[i].children!, id);
          if (found) {
            if (!found.parent) {
              found.parent = chapters[i];
            }
            return found;
          }
        }
      }
      return null;
    };

    const activeResult = findChapter(chapters, activeId);
    const overResult = findChapter(chapters, overId);

    if (!activeResult || !overResult) return;

    const { chapter: activeChapter, parent: activeParent } = activeResult;
    const { chapter: overChapter, parent: overParent, index: overIndex } = overResult;

    // 不允许顶级章变成子章节
    if (activeChapter.level === 'chapter' && overParent) {
      return;
    }

    // 从原位置移除
    const removeChapter = (chapters: Chapter[], id: string): Chapter[] => {
      return chapters
        .filter(c => c.id !== id)
        .map(c => ({
          ...c,
          children: c.children ? removeChapter(c.children, id) : undefined
        }));
    };

    // 添加到新位置
    const insertChapter = (
      chapters: Chapter[],
      chapter: Chapter,
      targetId: string,
      position: 'before' | 'after' | 'inside'
    ): Chapter[] => {
      if (position === 'inside') {
        return chapters.map(c => {
          if (c.id === targetId) {
            return {
              ...c,
              expanded: true,
              children: [...(c.children || []), { ...chapter, parentId: c.id }]
            };
          }
          return {
            ...c,
            children: c.children ? insertChapter(c.children, chapter, targetId, position) : undefined
          };
        });
      }

      const insertAtIndex = (items: Chapter[], idx: number): Chapter[] => {
        const newItems = [...items];
        newItems.splice(position === 'before' ? idx : idx + 1, 0, chapter);
        return newItems;
      };

      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].id === targetId) {
          return insertAtIndex(chapters, i);
        }
        if (chapters[i].children) {
          const result = insertChapter(chapters[i].children!, chapter, targetId, position);
          if (result !== chapters[i].children) {
            const newChapters = [...chapters];
            newChapters[i] = { ...newChapters[i], children: result };
            return newChapters;
          }
        }
      }
      return chapters;
    };

    // 确定插入位置：同级之间移动
    let newChapters = removeChapter([...chapters], activeId);
    
    if (activeParent?.id === overParent?.id || (!activeParent && !overParent)) {
      // 同一父级下移动
      const targetIndex = overIndex;
      const actualIndex = targetIndex;
      
      const insertAtSameLevel = (
        chapters: Chapter[],
        chapter: Chapter,
        targetId: string,
        idx: number
      ): Chapter[] => {
        if (!activeParent) {
          // 顶级章节
          const newItems = chapters.filter(c => c.id !== chapter.id);
          newItems.splice(idx, 0, chapter);
          return newItems;
        }
        
        return chapters.map(c => {
          if (c.id === activeParent?.id) {
            const newChildren = (c.children || []).filter(child => child.id !== chapter.id);
            newChildren.splice(idx, 0, chapter);
            return { ...c, children: newChildren };
          }
          if (c.children) {
            return { ...c, children: insertAtSameLevel(c.children, chapter, targetId, idx) };
          }
          return c;
        });
      };
      
      newChapters = insertAtSameLevel(newChapters, activeChapter, overId, actualIndex);
    }

    // 重新编号所有章节
    const renumberAllChapters = (chaptersList: Chapter[], parentNumber: string = ''): Chapter[] => {
      return chaptersList.map((chapter, index) => {
        let newNumber: string;
        let newName: string;
        
        if (chapter.level === 'chapter') {
          newNumber = `${index + 1}`;
          newName = `专题${index + 1} ${chapter.name.replace(/^专题\d+\s*/, '')}`;
        } else {
          newNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`;
          const nameWithoutNumber = chapter.name.replace(/^\d+(?:\.\d+)*\s*/, '');
          newName = `${newNumber} ${nameWithoutNumber}`;
        }
        
        return {
          ...chapter,
          name: newName,
          children: chapter.children ? renumberAllChapters(chapter.children, newNumber) : undefined
        };
      });
    };

    setChapters(renumberAllChapters(newChapters));
    
    // 记录拖拽排序变更
    addEditChange(`章节排序变更：${activeChapter.name}`);
  };

  // 渲染章节树节点（已弃用，改用 SortableChapterNode）
  const renderChapterNode = (chapter: Chapter, depth: number = 0) => {
    return <SortableChapterNode key={chapter.id} chapter={chapter} depth={depth} />;
  };

  // 处理知识点选择
  const handleAddKnowledgePoint = (kp: KnowledgeRelation) => {
    if (!selectedKnowledgePoints.find((k) => k.id === kp.id)) {
      setSelectedKnowledgePoints([...selectedKnowledgePoints, kp]);
      // 新添加的知识点默认展开
      const newExpandedSet = new Set(expandedKnowledgePoints);
      newExpandedSet.add(kp.id);
      setExpandedKnowledgePoints(newExpandedSet);
    }
  };

  const handleRemoveKnowledgePoint = (kpId: string) => {
    setSelectedKnowledgePoints(selectedKnowledgePoints.filter((k) => k.id !== kpId));
  };

  // 一级页面：专题列表
  const TextbookListPage = () => (
    <div className="space-y-6">
      {/* 顶部筛选栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">学段：</label>
              <select
                value={selectedPhase}
                onChange={(e) => { setSelectedPhase(e.target.value); setSelectedGrade('all'); setSelectedSubject('all'); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="senior">高中</option>
                <option value="junior">初中</option>
                <option value="primary">小学</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">年级：</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">全部年级</option>
                {selectedPhase === 'senior' && (
                  <>
                    <option value="高一">高一</option>
                    <option value="高二">高二</option>
                    <option value="高三">高三</option>
                  </>
                )}
                {selectedPhase === 'junior' && (
                  <>
                    <option value="七年级">七年级</option>
                    <option value="八年级">八年级</option>
                    <option value="九年级">九年级</option>
                  </>
                )}
                {selectedPhase === 'primary' && (
                  <>
                    <option value="一年级">一年级</option>
                    <option value="二年级">二年级</option>
                    <option value="三年级">三年级</option>
                    <option value="四年级">四年级</option>
                    <option value="五年级">五年级</option>
                    <option value="六年级">六年级</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">学科：</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">全部学科</option>
                {selectedPhase === 'senior' && (
                  <>
                    <option value="math">数学</option>
                    <option value="chinese">语文</option>
                    <option value="english">英语</option>
                    <option value="physics">物理</option>
                    <option value="chemistry">化学</option>
                    <option value="biology">生物</option>
                  </>
                )}
                {selectedPhase === 'junior' && (
                  <>
                    <option value="math">数学</option>
                    <option value="chinese">语文</option>
                    <option value="english">英语</option>
                    <option value="physics">物理</option>
                    <option value="chemistry">化学</option>
                  </>
                )}
                {selectedPhase === 'primary' && (
                  <>
                    <option value="math">数学</option>
                    <option value="chinese">语文</option>
                    <option value="english">英语</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">场景：</label>
              <select
                value={selectedScene}
                onChange={(e) => setSelectedScene(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">全部场景</option>
                <option value="vacation">寒暑假复习</option>
                <option value="zhongkao">中考</option>
                <option value="gaokao">高考</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAggregateHistory(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              查看历史发布记录
            </button>
            {/* 教研员身份下隐藏新增按钮 */}
            {!isTeacher && (
              <button
                onClick={() => {
                  setIsAddFromTop(true);
                  setCurrentPublisher('');
                  setNewTextbookPublisher('');
                  setShowAddTextbookDialog(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                新增专题
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 专题列表 */}
      <div className="space-y-6">
        {Object.entries(groupedTextbooks).slice(0, 6).map(([publisher, textbooks]) => (
          <div key={publisher} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 出版社标题 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">{publisher}</span>
                <span className="text-sm text-gray-500">({textbooks.length}个专题)</span>
              </div>
              {/* 教研员身份下隐藏新增按钮 */}
              {!isTeacher && (
                <button
                  onClick={() => {
                    setIsAddFromTop(false);
                    setCurrentPublisher(publisher);
                    setShowAddTextbookDialog(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              )}
            </div>

            {/* 专题卡片列表 */}
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {textbooks.map((textbook) => {
                  const publishState = mockTextbookPublishState[textbook.id];
                  return (
                  <div
                    key={textbook.id}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-300 transition-all"
                  >
                    {/* 封面 */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center relative">
                      {textbook.coverImage ? (
                        <img
                          src={textbook.coverImage}
                          alt={textbook.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center px-4">
                          <BookOpen className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                          <div className="text-sm font-medium text-emerald-600">{textbook.name}</div>
                          {publishState?.currentVersion && (
                            <div className="text-xs text-emerald-500 mt-1 font-mono">{publishState.currentVersion}</div>
                          )}
                        </div>
                      )}
                      {/* 状态标签 */}
                      {publishState && (
                        <div className="absolute top-2 left-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            publishState.status === 'published' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {publishState.status === 'published' ? '已发布' : '待发布'}
                          </span>
                        </div>
                      )}
                      {/* 辅助字段：年级 | 学科 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                        <span className="text-xs text-white">{textbook.grade} | {textbook.subject}</span>
                      </div>
                    </div>
                    
                    {/* 信息 */}
                    <div className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">📚 专题</span>
                          <span className="font-medium text-gray-700">{textbook.chapterCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">📝 知识点</span>
                          <span className="font-medium text-gray-700">{textbook.knowledgePointCount}</span>
                        </div>
                      </div>
                      {/* 进入管理按钮 */}
                      <button
                        onClick={() => {
                          setSelectedTextbook(textbook);
                          // 进入详情页自动进入编辑态
                          setIsEditing(true);
                          setIsEditingTree(true);
                          setInitialChaptersSnapshot(JSON.parse(JSON.stringify(chapters)));
                        }}
                        className="mt-3 w-full py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 font-medium"
                      >
                        进入管理
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 更多场景提示 */}
        {Object.keys(groupedTextbooks).length > 6 && !isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                还有 <span className="font-semibold">{Object.keys(groupedTextbooks).length - 6}</span> 个场景类别未展示，如需新增专题请点击顶部「新增专题」按钮选择场景
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 二级页面：专题章节管理

  // ==================== 导出专题功能 ====================

  // 扁平化章节数据用于导出（基于现有的flattenChapters函数）
  const flattenChaptersForExport = (chapterList: Chapter[]): Array<{
    chapterName: string;
    sectionName: string;
    subsectionName: string;
    knowledgePoints: string;
  }> => {
    const result: Array<{
      chapterName: string;
      sectionName: string;
      subsectionName: string;
      knowledgePoints: string;
    }> = [];

    const traverse = (items: Chapter[], currentChapter: string = '', currentSection: string = '') => {
      items.forEach(item => {
        if (item.level === 'chapter') {
          // 章节
          traverse(item.children || [], item.name, '');
        } else if (item.level === 'section') {
          // 一级小节
          if (item.children && item.children.length > 0) {
            traverse(item.children, currentChapter, item.name);
          } else {
            // 没有二级小节，直接输出一级小节
            result.push({
              chapterName: currentChapter,
              sectionName: item.name,
              subsectionName: '',
              knowledgePoints: item.knowledgePoints?.map(kp => kp.name).join('、') || '',
            });
          }
        } else if (item.level === 'subsection') {
          // 二级小节
          result.push({
            chapterName: currentChapter,
            sectionName: currentSection,
            subsectionName: item.name,
            knowledgePoints: item.knowledgePoints?.map(kp => kp.name).join('、') || '',
          });
        }
      });
    };

    chapterList.forEach(chapter => {
      if (chapter.children && chapter.children.length > 0) {
        traverse(chapter.children, chapter.name, '');
      } else {
        // 章节没有子节点
        result.push({
          chapterName: chapter.name,
          sectionName: '',
          subsectionName: '',
          knowledgePoints: '',
        });
      }
    });

    return result;
  };

  // 导出专题为Excel文件
  const handleTextbookExport = () => {
    if (!selectedTextbook) return;
    
    // 扁平化章节数据
    const flatData = flattenChaptersForExport(chapters);
    
    // 构建Excel数据
    const header = ['章节名称', '一级小节名称', '二级小节名称', '知识点名称'];
    const rows = [header, ...flatData.map(row => [
      row.chapterName,
      row.sectionName,
      row.subsectionName,
      row.knowledgePoints,
    ])];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 }, // 章节名称
      { wch: 20 }, // 一级小节名称
      { wch: 20 }, // 二级小节名称
      { wch: 30 }, // 知识点名称
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '专题章节');
    
    // 生成文件名：【专题名称_学段场景_版本号_V1.0】
    const textbookName = selectedTextbook.name.replace(/[\/\\?%*:|"<>]/g, '_');
    const phaseVersionType = `${selectedTextbook.phase}${selectedTextbook.scene || selectedTextbook.publisher}`;
    const version = selectedTextbook.currentVersion || 'v1.0';
    const fileName = `${textbookName}_${phaseVersionType}_${version}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);
  };

  // ==================== 导入专题功能 ====================

  // 重置导入状态
  const resetImportState = () => {
    setShowImportDialog(false);
    setImportValidationStatus('idle');
    setImportFile(null);
    setImportValidationSummary(null);
    setImportFileErrors([]);
    setImportRowResults([]);
  };

  // 打开导入弹窗时重置状态
  const handleOpenImportDialog = () => {
    setImportValidationStatus('idle');
    setImportFile(null);
    setImportValidationSummary(null);
    setImportFileErrors([]);
    setImportRowResults([]);
    setShowImportDialog(true);
  };

  // 下载导入模板
  const handleDownloadTextbookTemplate = async () => {
    // 动态生成模板文件，使用 exceljs 支持完整样式
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('专题章节');

    // 设置列宽
    ws.columns = [
      { width: 20 }, // 章节名称
      { width: 20 }, // 一级小节名称
      { width: 20 }, // 二级小节名称
      { width: 30 }, // 知识点名称
    ];

    // 第一行：填写说明，合并单元格
    const instructionText = '填写说明：\n【章节字段】请按线上专题树的完整章节层级填写，章节名称仅用于匹配线上节点，不支持通过导入修改专题目录；\n【知识点】仅叶子节点可填写，需填写知识树模块中已存在的知识点名称，多个用顿号（、）分隔，留空不更新，【清空】表示清空当前章节已关联的知识点。';
    ws.getCell('A1').value = instructionText;
    ws.getCell('A1').alignment = { wrapText: true, vertical: 'middle' };
    ws.mergeCells('A1:D1');
    ws.getRow(1).height = 120;

    // 第二行：表头
    const header = ['章节名称', '一级小节名称', '二级小节名称', '知识点名称'];
    ws.addRow(header);

    // 导出文件
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '章节树管理模板.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // 构建线上专题树所有叶子节点的路径集合（用于匹配）
  const buildOnlineTextbookPathSet = (): Map<string, { path: string[]; chapter: Chapter }> => {
    const pathMap = new Map<string, { path: string[]; chapter: Chapter }>();
    const traverse = (nodes: Chapter[], currentPath: string[]) => {
      nodes.forEach((node) => {
        const newPath = [...currentPath, node.name];
        const pathKey = newPath.join(' / ');
        if (!node.children || node.children.length === 0) {
          // 叶子节点
          pathMap.set(pathKey, { path: newPath, chapter: node });
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children, newPath);
        }
      });
    };
    traverse(chapters, []);
    return pathMap;
  };

  // 构建线上专题树所有节点名称集合（用于"标题被修改"识别）
  const buildOnlineTextbookNameSet = (): Set<string> => {
    const nameSet = new Set<string>();
    const traverse = (nodes: Chapter[]) => {
      nodes.forEach((node) => {
        nameSet.add(node.name);
        if (node.children) traverse(node.children);
      });
    };
    traverse(chapters);
    return nameSet;
  };

  // 构建线上知识树所有知识点名称集合（用于知识点匹配）
  const buildOnlineKnowledgeNameMap = (): Map<string, number> => {
    const nameCountMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        const name = node.name;
        nameCountMap.set(name, (nameCountMap.get(name) || 0) + 1);
        if (node.children) traverse(node.children);
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    traverse(knowledgeTreeData as any);
    return nameCountMap;
  };

  // 从行数据中提取专题路径
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildTextbookPathFromRow = (row: any[]): string => {
    const parts: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (row[i] && String(row[i]).trim() !== '') {
        parts.push(String(row[i]).trim());
      }
    }
    return parts.join(' / ');
  };

  // 检查专题树层级是否连续
  const isTextbookLevelContinuous = (levels: string[]): boolean => {
    let foundEmpty = false;
    for (let i = 0; i < levels.length; i++) {
      if (!levels[i] || String(levels[i]).trim() === '') {
        foundEmpty = true;
      } else if (foundEmpty) {
        return false;
      }
    }
    return true;
  };

  // 执行导入校验
  const performTextbookValidation = (file: File) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // ====== 阶段一：文件级校验 ======

        if (!jsonData || jsonData.length < 3) {
          setImportFileErrors([{
            type: 'empty-content',
            title: '文件内容为空',
            description: '当前文件未识别到可校验的数据行',
            suggestion: '请确认文件中已按模板填写专题章节及知识点数据后重新上传',
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

        // 寻找表头行
        let headerRowIndex = -1;
        const expectedHeaders = ['章节名称', '知识点名称'];
        for (let i = 0; i < Math.min(5, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row.length >= 4) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          (row) => row && row.length > 0 && row.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== ''
          )
        );

        if (dataRows.length === 0) {
          setImportFileErrors([{
            type: 'empty-content',
            title: '模板内容为空',
            description: '当前文件未识别到可校验的数据行',
            suggestion: '请确认文件中已按模板填写专题章节及知识点数据后重新上传',
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

        const onlinePathMap = buildOnlineTextbookPathSet();
        const onlineNameSet = buildOnlineTextbookNameSet();
        const knowledgeNameMap = buildOnlineKnowledgeNameMap();

        const rowResults: Array<{
          rowIndex: number;
          excelRow: number;
          textbookPath: string;
          knowledgeInfo: string;
          result: 'pass' | 'fail';
          errorType?: 'path-invalid' | 'node-not-found' | 'path-modified' | 'path-level-broken' | 'duplicate-node' | 'knowledge-not-found' | 'knowledge-ambiguous' | 'knowledge-duplicate' | 'knowledge-not-leaf' | 'other';
          reason?: string;
        }> = [];

        // 用于检测重复路径
        const seenPaths = new Map<string, number[]>();

        dataRows.forEach((row, idx) => {
          const excelRow = headerRowIndex + 1 + idx + 1;
          const levels = [
            row[0] ? String(row[0]).trim() : '',
            row[1] ? String(row[1]).trim() : '',
            row[2] ? String(row[2]).trim() : '',
          ];
          const textbookPath = buildTextbookPathFromRow(row);
          const knowledgeValue = row[3] ? String(row[3]).trim() : '';

          // 检查专题树层级是否连续
          if (!isTextbookLevelContinuous(levels)) {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              textbookPath,
              knowledgeInfo: knowledgeValue,
              result: 'fail',
              errorType: 'path-level-broken',
              reason: '当前行专题树层级填写不完整，存在跳级填写',
            });
            return;
          }

          // 检查是否至少有一个专题标题
          const hasAnyTitle = levels.some(l => l !== '');
          if (!hasAnyTitle) {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              textbookPath: '（空行）',
              knowledgeInfo: knowledgeValue,
              result: 'fail',
              errorType: 'path-invalid',
              reason: '当前行未填写任何专题树标题信息',
            });
            return;
          }

          // 记录路径用于重复检测
          if (!seenPaths.has(textbookPath)) {
            seenPaths.set(textbookPath, [excelRow]);
          } else {
            seenPaths.get(textbookPath)!.push(excelRow);
          }

          // 匹配线上专题节点
          const matchedOnline = onlinePathMap.get(textbookPath);

          if (!matchedOnline) {
            // 尝试检查是否是标题被修改的情况
            const lastTitle = levels.filter(l => l !== '').pop() || '';
            const titleExistsOnline = onlineNameSet.has(lastTitle);

            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              textbookPath,
              knowledgeInfo: knowledgeValue,
              result: 'fail',
              errorType: titleExistsOnline ? 'path-modified' : 'node-not-found',
              reason: titleExistsOnline
                ? '导入仅支持使用专题树标题列定位节点，不支持通过导入修改专题树目录'
                : '系统未在当前专题树中找到与该路径完全一致的章节/小节节点',
            });
            return;
          }

          // 专题路径匹配成功，进入知识点校验
          const errors: Array<{
            errorType: 'knowledge-not-found' | 'knowledge-ambiguous' | 'knowledge-duplicate' | 'knowledge-not-leaf';
            reason: string;
          }> = [];

          // 判断当前章节是否为叶子节点
          const isLeaf = !matchedOnline.chapter.children || matchedOnline.chapter.children.length === 0;

          // 知识点为空时不报错，保留线上已有数据
          // 知识点有值时才进行校验
          if (knowledgeValue) {
            // 非叶子节点不允许填写知识点
            if (!isLeaf) {
              errors.push({
                errorType: 'knowledge-not-leaf',
                reason: '知识点仅允许关联到叶子章节节点（没有子章节的节点）',
              });
            } else {
              // "无" 表示清空线上知识点，不需要校验知识点名称
              const isClearMarker = knowledgeValue === '无';

              if (!isClearMarker) {
                // 解析知识点（用顿号分隔）
                const knowledgeNames = knowledgeValue.split('、').map(k => k.trim()).filter(k => k !== '');

                // 检查重复
                const uniqueNames = new Set(knowledgeNames);
                if (uniqueNames.size < knowledgeNames.length) {
                  errors.push({
                    errorType: 'knowledge-duplicate',
                    reason: '当前行知识点名称存在重复项',
                  });
                }

                // 检查每个知识点是否在知识树模块中存在
                const notFoundNames: string[] = [];
                const ambiguousNames: string[] = [];

                knowledgeNames.forEach(name => {
                  const count = knowledgeNameMap.get(name);
                  if (!count) {
                    notFoundNames.push(name);
                  } else if (count > 1) {
                    ambiguousNames.push(name);
                  }
                });

                if (notFoundNames.length > 0) {
                  errors.push({
                    errorType: 'knowledge-not-found',
                    reason: notFoundNames.length === 1
                      ? `知识点"${notFoundNames[0]}"未在知识树模块中找到对应知识点`
                      : `多个知识点中存在未匹配项：${notFoundNames.join('、')}未在知识树模块中匹配到`,
                  });
                }

                if (ambiguousNames.length > 0) {
                  errors.push({
                    errorType: 'knowledge-ambiguous',
                    reason: ambiguousNames.length === 1
                      ? `知识点"${ambiguousNames[0]}"在知识树模块中存在重名，系统无法唯一确认`
                      : `多个知识点存在重名：${ambiguousNames.join('、')}在知识树模块中无法唯一识别`,
                  });
                }
              }
            }
          }

          if (errors.length > 0) {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              textbookPath,
              knowledgeInfo: knowledgeValue,
              result: 'fail',
              errorType: errors[0].errorType,
              reason: errors.map(e => e.reason).join('；'),
            });
          } else {
            rowResults.push({
              rowIndex: idx + 1,
              excelRow,
              textbookPath,
              knowledgeInfo: knowledgeValue,
              result: 'pass',
            });
          }
        });

        // 处理重复行
        seenPaths.forEach((rows, path) => {
          if (rows.length > 1) {
            rowResults.forEach((result) => {
              if (result.textbookPath === path && result.result !== 'fail') {
                result.result = 'fail';
                result.errorType = 'duplicate-node';
                result.reason = '当前文件中存在多个相同专题路径的数据行';
              }
              if (result.textbookPath === path && result.result === 'fail' && result.errorType !== 'duplicate-node') {
                result.reason = `${result.reason}；当前文件中存在多个相同专题路径的数据行`;
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
  const handleDownloadTextbookErrorDetail = () => {
    if (!importRowResults || importRowResults.length === 0) return;

    const failedResults = importRowResults.filter(r => r.result === 'fail');
    const header = ['序号', 'Excel行号', '当前专题路径', '知识点信息', '校验结果', '失败原因'];
    const rows = failedResults.map(r => [
      r.rowIndex,
      `第${r.excelRow}行`,
      r.textbookPath,
      r.knowledgeInfo || '',
      '失败',
      r.reason || '',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 30 },
      { wch: 20 },
      { wch: 8 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, '校验结果');

    const textbookName = selectedTextbook?.name || '专题';
    XLSX.writeFile(wb, `${textbookName}_导入校验结果.xlsx`);
  };

  // 重新上传
  const handleTextbookReUpload = () => {
    setImportValidationStatus('idle');
    setImportFile(null);
    setImportValidationSummary(null);
    setImportFileErrors([]);
    setImportRowResults([]);
  };

  const TextbookDetailPage = () => {
    if (!selectedTextbook) return null;

    const publishState = textbookPublishStates[selectedTextbook.id];
    // 有未发布的变更（编辑后），显示橙色条
    const showPendingPublish = hasUnpublishedChanges;

    // 专题级视图 - 递归辅助函数
    const countKnowledgePoints = (node: Chapter): number => {
      let count = node.knowledgePoints?.length || 0;
      node.children?.forEach(child => { count += countKnowledgePoints(child); });
      return count;
    };
    const countCourses = (node: Chapter): number => {
      let count = node.courses?.length || 0;
      node.children?.forEach(child => { count += countCourses(child); });
      return count;
    };
    const countExams = (node: Chapter): number => {
      let count = node.exams?.length || 0;
      node.children?.forEach(child => { count += countExams(child); });
      return count;
    };
    const collectKnowledgePoints = (node: Chapter): KnowledgeRelation[] => {
      let kps = node.knowledgePoints || [];
      node.children?.forEach(child => { kps = kps.concat(collectKnowledgePoints(child)); });
      return kps;
    };
    const collectCourses = (node: Chapter): Course[] => {
      let courses = node.courses || [];
      node.children?.forEach(child => { courses = courses.concat(collectCourses(child)); });
      return courses;
    };
    const collectExams = (node: Chapter): Exam[] => {
      let exams = node.exams || [];
      node.children?.forEach(child => { exams = exams.concat(collectExams(child)); });
      return exams;
    };
    const hasAnyResources = (node: Chapter, type: 'knowledge' | 'course' | 'exam'): boolean => {
      if (type === 'knowledge') return countKnowledgePoints(node) > 0;
      if (type === 'course') return countCourses(node) > 0;
      return countExams(node) > 0;
    };
    // 递归渲染知识点小节列表（支持多层级）
    const renderKnowledgeSectionList = (sections: Chapter[], depth: number): React.ReactNode => {
      return sections.map((section) => {
        const kps = section.knowledgePoints || [];
        const hasChildren = section.children && section.children.length > 0;
        const hasKP = kps.length > 0;
        const childHasKP = hasChildren && section.children!.some(c => hasAnyResources(c, 'knowledge'));
        if (!hasKP && !childHasKP) return null;
        return (
          <div key={section.id} className="px-4 py-3" style={{ paddingLeft: `${(depth + 1) * 16 + 16}px` }}>
            <div className="text-sm font-medium text-gray-700 mb-2">{section.name}</div>
            {hasKP && (
              <div className="flex flex-wrap gap-2">
                {kps.map((kp, idx) => (
                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                    {kp.name}
                  </span>
                ))}
              </div>
            )}
            {hasChildren && renderKnowledgeSectionList(section.children!, depth + 1)}
          </div>
        );
      });
    };
    // 递归渲染同步课程小节列表（支持多层级）
    const renderCourseSectionList = (sections: Chapter[], depth: number): React.ReactNode => {
      return sections.map((section) => {
        const courses = section.courses || [];
        const hasChildren = section.children && section.children.length > 0;
        const hasC = courses.length > 0;
        const childHasC = hasChildren && section.children!.some(c => hasAnyResources(c, 'course'));
        if (!hasC && !childHasC) return null;
        return (
          <div key={section.id} className="px-4 py-3" style={{ paddingLeft: `${(depth + 1) * 16 + 16}px` }}>
            <div className="text-sm font-medium text-gray-700 mb-2">{section.name}</div>
            {hasC && (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <PlayCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{course.name}</span>
                  </div>
                ))}
              </div>
            )}
            {hasChildren && renderCourseSectionList(section.children!, depth + 1)}
          </div>
        );
      });
    };
    // 递归渲染试卷小节列表（支持多层级）
    const renderExamSectionList = (sections: Chapter[], depth: number): React.ReactNode => {
      return sections.map((section) => {
        const exams = section.exams || [];
        const hasChildren = section.children && section.children.length > 0;
        const hasE = exams.length > 0;
        const childHasE = hasChildren && section.children!.some(c => hasAnyResources(c, 'exam'));
        if (!hasE && !childHasE) return null;
        return (
          <div key={section.id} className="px-4 py-3" style={{ paddingLeft: `${(depth + 1) * 16 + 16}px` }}>
            <div className="text-sm font-medium text-gray-700 mb-2">{section.name} ({countExams(section)}套试卷)</div>
            {hasE && (
              <div className="space-y-2">
                {exams.map((exam) => (
                  <div key={exam.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <ClipboardList className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{exam.name}</span>
                    <span className="text-xs text-gray-400">{exam.questionCount}题 / {exam.totalScore}分</span>
                  </div>
                ))}
              </div>
            )}
            {hasChildren && renderExamSectionList(section.children!, depth + 1)}
          </div>
        );
      });
    };

    return (
      <div className="space-y-4">
        {/* 编辑后待发布提醒条（已发布状态但有新修改，包括有定时信息的情况） */}
        {showPendingPublish && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    有 <span className="font-medium">{pendingChangeCount || 1}</span> 项变更待发布，发布后才能生效
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isTeacher && (
                    <button
                      onClick={() => setShowPublishModal(true)}
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
          </>
        )}


        {/* 定时发布提醒条（有定时信息且无新变更时显示蓝色条） */}
        {publishState?.scheduledPublish && !showPendingPublish && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <span className="font-medium">{publishState.scheduledPublish.version}</span> 版本将于您设定的时间（
                  <span className="font-medium">{publishState.scheduledPublish.scheduledDate} {publishState.scheduledPublish.scheduledTime}</span>）自动发布，发布后更新的内容将正式生效
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                  查看历史版本
                </button>
                <button
                  onClick={handleCancelScheduled}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  取消定时
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 待发布提醒条（有新变更时显示，包括有定时信息的情况） */}
        {publishState?.status === 'pending' && !publishState?.scheduledPublish && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    有 <span className="font-medium">{publishState.pendingChanges}</span> 项变更待发布，发布后才能生效
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <History className="w-4 h-4" />
                    查看历史版本
                  </button>
                  {!isTeacher && (
                    <button
                      onClick={() => setShowPublishModal(true)}
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
          </>
        )}

        {/* 顶部导航 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedTextbook(null);
                  setSelectedChapterId(null);
                  setIsEditing(false);
                  setIsEditingTree(false);
                  setHasUnpublishedChanges(false);
                  setPendingChangeCount(0);
                  setEditChanges([]);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* 删除按钮 - 教研主管权限 */}
              {!isTeacher && (
                <button
                  onClick={() => setShowDeleteTreeDialog(true)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 章节树和详情 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 左侧：章节树 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* 专题信息 - 只读展示 */}
            <div className="mb-4 pb-3 border-b border-gray-100 px-2 py-1 -mx-2">
              {/* 标题行 */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-gray-900">
                  {selectedTextbook.name} | {selectedTextbook.grade} | {selectedTextbook.subject} | {selectedTextbook.scene || selectedTextbook.publisher}
                </div>
              </div>
              {/* 版本行 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">版本：</span>
                <span className="text-gray-900 font-mono">{publishState?.currentVersion || 'v1.0'}</span>
                {publishState?.publishHistory && publishState.publishHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="查看历史版本"
                  >
                    <History className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">章节结构</h3>
              {isEditingTree && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  拖拽可排序
                </span>
              )}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={chapters.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div 
                  ref={chapterListScrollRef}
                  className="space-y-1 max-h-[450px] overflow-y-auto"
                  onScroll={(e) => {
                    chapterListScrollPositionRef.current = (e.target as HTMLDivElement).scrollTop;
                  }}
                >
                  {/* 专题名称虚拟节点 - 选中后进入专题级视图 */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${!selectedChapterId ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => {
                      setSelectedChapterId(null);
                      // 收起所有章节
                      setChapters(prev => prev.map(ch => ({ ...ch, expanded: false })));
                    }}
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{selectedTextbook.name}</span>
                    <PrdTooltip data={prd215.textbookNameEntry} className="ml-0.5" />
                  </div>
                  {chapters.map((chapter) => (
                    <SortableChapterNode key={chapter.id} chapter={chapter} depth={0} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {/* 添加章输入框/按钮 - 编辑树模式下显示 */}
            {isEditingTree && (
              <div className="mt-2">
                {addingChapterParentId === null ? (
                  <button
                    onClick={() => {
                      setAddingChapterParentId('root');
                      setChapterInputValue(generateDefaultChapterTitle('root'));
                    }}
                    className="w-full flex items-center gap-2 py-2 px-3 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加专题
                  </button>
                ) : addingChapterParentId === 'root' ? (
                  <div className="flex items-center gap-2 py-2 px-3">
                    <input
                      type="text"
                      value={chapterInputValue}
                      onChange={(e) => setChapterInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && chapterInputValue.trim()) {
                          e.preventDefault();
                          const value = chapterInputValue.trim();
                          setTimeout(() => {
                            handleAddChapter(null, value);
                            setAddingChapterParentId(null);
                            setChapterInputValue('');
                          }, 0);
                        } else if (e.key === 'Escape') {
                          setAddingChapterParentId(null);
                          setChapterInputValue('');
                        }
                      }}
                      placeholder="请输入章节名称"
                      className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (chapterInputValue.trim()) {
                          handleAddChapter(null, chapterInputValue.trim());
                          setAddingChapterParentId(null);
                          setChapterInputValue('');
                        }
                      }}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setAddingChapterParentId(null);
                        setChapterInputValue('');
                      }}
                      className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* 右侧：章节详情 */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {selectedChapter ? (
              <div>
                {/* 标题行：固定标题 + 操作按钮 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">{selectedTextbook.name}</h3>
                  <div className="flex items-center gap-2">
                    {/* 非编辑态：显示编辑章节详情按钮 */}
                    {!isEditingDetail && (
                      <button
                        onClick={() => {
                          // 保存当前详情快照
                          const snapshot = JSON.stringify(selectedChapter);
                          setDetailEditSnapshot(snapshot);
                          setIsEditingDetail(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑章节详情
                      </button>
                    )}
                    
                    {/* 编辑态：显示取消、保存编辑按钮 */}
                    {isEditingDetail && (
                      <>
                        <button
                          onClick={() => {
                            // 取消编辑，不恢复数据（因为编辑是实时的）
                            setIsEditingDetail(false);
                            setDetailEditSnapshot('');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            // 检测是否有变更
                            const currentSnapshot = JSON.stringify(selectedChapter);
                            const hasChanges = currentSnapshot !== detailEditSnapshot;
                            
                            if (hasChanges) {
                              // 有变更，设置待发布状态
                              setHasUnpublishedChanges(true);
                              // 增加变更计数（当前小节有变更）
                              setPendingChangeCount(prev => prev + 1);
                            }
                            setIsEditingDetail(false);
                            setDetailEditSnapshot('');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        >
                          <Save className="w-4 h-4" />
                          保存编辑
                        </button>
                        <PrdTooltip data={prd206.saveEditWriteback} className="ml-1" />
                      </>
                    )}
                  </div>
                </div>

                {/* 章节名称行：左侧显示章节名称，右侧显示 Tab 切换 */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-200">
                  {/* 左侧：末级小节名称 */}
                  <div className="text-sm text-gray-700">
                    {selectedChapter.name}
                  </div>
                  
                  {/* 右侧：Tab 切换 */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('knowledge')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'knowledge'
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 inline-block mr-1" />
                      知识点
                      <PrdTooltip data={prd215.textbookLevelTabBar} className="ml-0.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('course')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'course'
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <Video className="w-4 h-4 inline-block mr-1" />
                      同步课程
                    </button>
                    <PrdTooltip data={prd200.textbookSyncCourseTab} />
                    <button
                      onClick={() => setActiveTab('exam')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'exam'
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 inline-block mr-1" />
                      练习试卷
                    </button>
                    <PrdTooltip data={prd200.textbookPracticePaperTab} />
                  </div>
                </div>

                {/* ==================== 章级别聚合展示 ==================== */}
                
                {/* 章级别 - 知识点聚合展示（方案D：连接线样式） */}
                {selectedChapter.level === 'chapter' && activeTab === 'knowledge' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-emerald-600" />
                      知识点总览
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        （聚合展示该章节下所有节的知识点）
                      </span>
                    </h4>
                    
                    {selectedChapter.children && selectedChapter.children.length > 0 ? (
                      <div className="space-y-0">
                        {selectedChapter.children.map((section, sectionIndex) => {
                          const hasKnowledgePoints = section.knowledgePoints && section.knowledgePoints.length > 0;
                          const hasSubsections = section.children && section.children.length > 0;
                          const isLast = sectionIndex === (selectedChapter.children?.length || 0) - 1;
                          
                          return (
                            <div key={section.id} className="relative">
                              {/* 连接线容器 */}
                              <div className="flex">
                                {/* 左侧连接线区域 */}
                                <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                  {/* 顶部连接线 */}
                                  <div className={`w-px ${sectionIndex === 0 ? 'h-4' : 'h-0'} bg-emerald-300`}></div>
                                  {/* 圆点 */}
                                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10"></div>
                                  {/* 底部连接线 */}
                                  {!isLast && <div className="w-px flex-1 bg-emerald-300"></div>}
                                </div>
                                
                                {/* 右侧内容区域 */}
                                <div className="flex-1 pb-4">
                                  {/* 节标题 - 突出显示 */}
                                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-300">
                                    <ListTree className="w-4 h-4 text-emerald-600" />
                                    <span className="text-base font-bold text-emerald-800">{section.name}</span>
                                    {hasKnowledgePoints && (
                                      <span className="text-xs text-emerald-600 font-medium">
                                        {getTotalKnowledgePoints(section.knowledgePoints)}个知识点
                                      </span>
                                    )}
                                    {hasSubsections && (
                                      <span className="text-xs text-gray-500">
                                        （含{hasSubsections}个小节）
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* 如果有三级小节，嵌套展示三级小节及其内容 */}
                                  {hasSubsections ? (
                                    <div className="ml-2 space-y-2">
                                      {section.children?.map((subsection) => {
                                        const subsectionHasKp = subsection.knowledgePoints && subsection.knowledgePoints.length > 0;
                                        const hasSubChildren = subsection.children && subsection.children.length > 0;
                                        
                                        return (
                                          <div key={subsection.id} className="relative">
                                            <div className="flex items-start">
                                              {/* 三级小节连接线 */}
                                              <div className="w-4 flex-shrink-0 flex flex-col items-center pt-1">
                                                <div className="w-px h-4 bg-emerald-200"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm z-10"></div>
                                              </div>
                                              
                                              {/* 三级小节内容 */}
                                              <div className="flex-1 pb-2">
                                                <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                  <span className="text-sm font-medium text-gray-700">{subsection.name}</span>
                                                  {subsectionHasKp && (
                                                    <span className="text-xs text-emerald-600">
                                                      {getTotalKnowledgePoints(subsection.knowledgePoints)}个知识点
                                                    </span>
                                                  )}
                                                  {!subsectionHasKp && !hasSubChildren && (
                                                    <span className="text-xs text-gray-400">暂无内容</span>
                                                  )}
                                                  {/* 三级小节的全景图谱按钮 */}
                                                  {subsectionHasKp && (
                                                    <button
                                                      onClick={() => {
                                                        // 临时切换到该三级小节查看全景图谱
                                                        setSelectedChapterId(subsection.id);
                                                        setTimeout(() => {
                                                          setShowSectionKnowledgeGraph(true);
                                                        }, 0);
                                                      }}
                                                      className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                                                      title="查看该小节知识点全景图谱"
                                                    >
                                                      <Network className="w-3 h-3" />
                                                      全景图谱
                                                    </button>
                                                  )}
                                                </div>
                                                
                                                {/* 三级小节下的知识点列表 */}
                                                {subsectionHasKp && (
                                                  <div className="ml-4 space-y-1">
                                                    {subsection.knowledgePoints?.map((kp) => {
                                                      const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;
                                                      return (
                                                        <div key={kp.id} className="space-y-0">
                                                          <div className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-100 rounded">
                                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                            <span className="text-sm text-gray-600">{kp.name}</span>
                                                          </div>
                                                          {hasExtendedPoints && (
                                                            <div className="ml-4 space-y-0.5">
                                                              {kp.extendedPoints?.map((ep) => (
                                                                <div
                                                                  key={ep.id}
                                                                  className="flex items-center gap-2 px-2 py-0.5 bg-gray-50 border border-gray-50 rounded text-xs"
                                                                >
                                                                  <Circle className="w-2.5 h-2.5 text-gray-400 fill-gray-200" />
                                                                  <span className="text-gray-500">{ep.name}</span>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                                
                                                {/* 三级小节知识点图谱展示 */}
                                                {subsectionHasKp && showSectionKnowledgeGraph && selectedChapter?.id === subsection.id && (
                                                  <div className="ml-4 mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                    <div className="flex items-center justify-end mb-2">
                                                      <button
                                                        onClick={() => setShowSectionKnowledgeGraph(false)}
                                                        className="text-xs text-purple-600 hover:text-purple-800"
                                                      >
                                                        收起
                                                      </button>
                                                    </div>
                                                    <SectionKnowledgeGraph
                                                      sectionKnowledgePoints={subsection.knowledgePoints || []}
                                                      findNodeById={(nodeId: string) => {
                                                        const node = findKnowledgeNodeById(nodeId);
                                                        if (node) {
                                                          return {
                                                            id: node.id,
                                                            name: node.name,
                                                            prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                                              id: p.id,
                                                              name: p.name,
                                                            })) || [],
                                                          };
                                                        }
                                                        return null;
                                                      }}
                                                      findNodeByName={(name: string) => {
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        const findNode = (nodes: { name: string; children?: any[]; prerequisiteKnowledge?: KnowledgeRelation[] }[]): { name: string; prerequisiteKnowledge?: KnowledgeRelation[] } | null => {
                                                          for (const node of nodes) {
                                                            if (node.name === name || name.includes(node.name) || node.name.includes(name)) {
                                                              return node;
                                                            }
                                                            if (node.children) {
                                                              const found = findNode(node.children);
                                                              if (found) return found;
                                                            }
                                                          }
                                                          return null;
                                                        };
                                                        const node = findNode(knowledgeRelationsData);
                                                        if (node) {
                                                          return {
                                                            id: node.name,
                                                            name: node.name,
                                                            prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                                              id: p.id,
                                                              name: p.name,
                                                            })) || [],
                                                          };
                                                        }
                                                        return null;
                                                      }}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : hasKnowledgePoints ? (
                                    /* 如果没有三级小节，展示二级小节自己的知识点，并显示全景图谱按钮 */
                                    <>
                                      <div className="ml-2 flex items-center gap-2 mb-2">
                                        {hasKnowledgePoints && (
                                          <button
                                            onClick={() => setShowSectionKnowledgeGraph(!showSectionKnowledgeGraph)}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all ${
                                              showSectionKnowledgeGraph
                                                ? 'bg-purple-500 text-white'
                                                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                                            }`}
                                            title="查看本节知识点全景图谱"
                                          >
                                            <Network className="w-3.5 h-3.5" />
                                            全景图谱
                                          </button>
                                        )}
                                      </div>
                                      <div className="ml-2 space-y-1.5">
                                        {section.knowledgePoints?.map((kp) => {
                                          const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;
                                          
                                          return (
                                            <div key={kp.id} className="space-y-0">
                                              {/* 主知识点 */}
                                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm text-gray-700">{kp.name}</span>
                                              </div>
                                              
                                              {/* 延伸知识点 */}
                                              {hasExtendedPoints && (
                                                <div className="ml-4 mt-1 space-y-1">
                                                  {kp.extendedPoints?.map((ep) => (
                                                    <div
                                                      key={ep.id}
                                                      className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-100 rounded"
                                                    >
                                                      <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
                                                      <span className="text-sm text-gray-600">{ep.name}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* 二级小节知识点图谱展示 */}
                                      {hasKnowledgePoints && showSectionKnowledgeGraph && (
                                        <div className="ml-2 mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                          <div className="flex items-center justify-end mb-2">
                                            <button
                                              onClick={() => setShowSectionKnowledgeGraph(false)}
                                              className="text-xs text-purple-600 hover:text-purple-800"
                                            >
                                              收起
                                            </button>
                                          </div>
                                          <SectionKnowledgeGraph
                                            sectionKnowledgePoints={section.knowledgePoints || []}
                                            findNodeById={(nodeId: string) => {
                                              const node = findKnowledgeNodeById(nodeId);
                                              if (node) {
                                                return {
                                                  id: node.id,
                                                  name: node.name,
                                                  prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                                    id: p.id,
                                                    name: p.name,
                                                  })) || [],
                                                };
                                              }
                                              return null;
                                            }}
                                            findNodeByName={(name: string) => {
                                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                              const findNode = (nodes: { name: string; children?: any[]; prerequisiteKnowledge?: KnowledgeRelation[] }[]): { name: string; prerequisiteKnowledge?: KnowledgeRelation[] } | null => {
                                                for (const node of nodes) {
                                                  if (node.name === name || name.includes(node.name) || node.name.includes(name)) {
                                                    return node;
                                                  }
                                                  if (node.children) {
                                                    const found = findNode(node.children);
                                                    if (found) return found;
                                                  }
                                                }
                                                return null;
                                              };
                                              const node = findNode(knowledgeRelationsData);
                                              if (node) {
                                                return {
                                                  id: node.name,
                                                  name: node.name,
                                                  prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                                    id: p.id,
                                                    name: p.name,
                                                  })) || [],
                                                };
                                              }
                                              return null;
                                            }}
                                          />
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                      暂无知识点
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">该章节下暂无节</p>
                        {isEditingTree && (
                          <p className="text-xs text-gray-400 mt-1">请先在左侧添加节</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 章级别 - 同步课程聚合展示 */}
                {selectedChapter.level === 'chapter' && activeTab === 'course' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      同步课程总览
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        （聚合展示该章节下所有节关联的课程）
                      </span>
                      <PrdTooltip data={isEditingDetail ? prd205.editSyncCourseAggregate : prd200.textbookSyncCourseAggregate} className="ml-1" />
                    </h4>
                    
                    {selectedChapter.children && selectedChapter.children.length > 0 ? (
                      <div className="space-y-0">
                        {selectedChapter.children.map((section, sectionIndex) => {
                          const hasCourses = section.courses && section.courses.length > 0;
                          const hasSubsections = section.children && section.children.length > 0;
                          const isLast = sectionIndex === (selectedChapter.children?.length || 0) - 1;
                          
                          return (
                            <div key={section.id} className="relative">
                              {/* 连接线容器 */}
                              <div className="flex">
                                {/* 左侧连接线区域 */}
                                <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                  <div className={`w-px ${sectionIndex === 0 ? 'h-4' : 'h-0'} bg-blue-300`}></div>
                                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10"></div>
                                  {!isLast && <div className="w-px flex-1 bg-blue-300"></div>}
                                </div>
                                
                                {/* 右侧内容区域 */}
                                <div className="flex-1 pb-4">
                                  {/* 节标题 */}
                                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-300">
                                    <ListTree className="w-4 h-4 text-blue-600" />
                                    <span className="text-base font-bold text-blue-800">{section.name}</span>
                                    {hasCourses && (
                                      <span className="text-xs text-blue-600">
                                        ({section.courses?.length}个课程)
                                      </span>
                                    )}
                                    {hasSubsections && (
                                      <span className="text-xs text-gray-500">
                                        （含{hasSubsections}个小节）
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* 如果有三级小节，嵌套展示三级小节及其内容 */}
                                  {hasSubsections ? (
                                    <div className="ml-2 space-y-2">
                                      {section.children?.map((subsection) => {
                                        const subsectionHasCourses = subsection.courses && subsection.courses.length > 0;
                                        
                                        return (
                                          <div key={subsection.id} className="relative">
                                            <div className="flex">
                                              {/* 三级小节连接线 */}
                                              <div className="w-4 flex-shrink-0 flex flex-col items-center">
                                                <div className="w-px h-4 bg-blue-200"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white shadow-sm z-10"></div>
                                              </div>
                                              
                                              {/* 三级小节内容 */}
                                              <div className="flex-1 pb-2">
                                                <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                  <Video className="w-3.5 h-3.5 text-gray-500" />
                                                  <span className="text-sm font-medium text-gray-700">{subsection.name}</span>
                                                  {subsectionHasCourses && (
                                                    <span className="text-xs text-blue-600">
                                                      {subsection.courses?.length}个课程
                                                    </span>
                                                  )}
                                                  {!subsectionHasCourses && (
                                                    <span className="text-xs text-gray-400">暂无内容</span>
                                                  )}
                                                </div>
                                                
                                                {/* 三级小节下的课程列表 */}
                                                {subsectionHasCourses && (
                                                  <div className="ml-4 space-y-2">
                                                    {subsection.courses?.map((course) => renderCourseCard(course, false))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : hasCourses ? (
                                    /* 如果没有三级小节，展示二级小节自己的课程 */
                                    <div className="ml-2 space-y-2">
                                      {section.courses?.map((course) => renderCourseCard(course, false))}
                                    </div>
                                  ) : (
                                    <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                      暂无课程
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">该章节下暂无节</p>
                        {isEditingTree && (
                          <p className="text-xs text-gray-400 mt-1">请先在左侧添加节</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 章级别 - 练习试卷聚合展示 */}
                {selectedChapter.level === 'chapter' && activeTab === 'exam' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      练习试卷总览
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        （聚合展示该章节下所有节关联的试卷）
                      </span>
                      <PrdTooltip data={prd200.textbookPracticePaperAggregate} className="ml-1" />
                    </h4>
                    
                    {selectedChapter.children && selectedChapter.children.length > 0 ? (
                      <div className="space-y-0">
                        {selectedChapter.children.map((section, sectionIndex) => {
                          const hasExams = section.exams && section.exams.length > 0;
                          const hasSubsections = section.children && section.children.length > 0;
                          const isLast = sectionIndex === (selectedChapter.children?.length || 0) - 1;
                          
                          return (
                            <div key={section.id} className="relative">
                              {/* 连接线容器 */}
                              <div className="flex">
                                {/* 左侧连接线区域 */}
                                <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                  <div className={`w-px ${sectionIndex === 0 ? 'h-4' : 'h-0'} bg-amber-300`}></div>
                                  <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10"></div>
                                  {!isLast && <div className="w-px flex-1 bg-amber-300"></div>}
                                </div>
                                
                                {/* 右侧内容区域 */}
                                <div className="flex-1 pb-4">
                                  {/* 节标题 */}
                                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-300">
                                    <ListTree className="w-4 h-4 text-amber-600" />
                                    <span className="text-base font-bold text-amber-800">{section.name}</span>
                                    {hasExams && (
                                      <span className="text-xs text-amber-600">
                                        ({section.exams?.length}套试卷)
                                      </span>
                                    )}
                                    {hasSubsections && (
                                      <span className="text-xs text-gray-500">
                                        （含{hasSubsections}个小节）
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* 如果有三级小节，嵌套展示三级小节及其内容 */}
                                  {hasSubsections ? (
                                    <div className="ml-2 space-y-2">
                                      {section.children?.map((subsection) => {
                                        const subsectionHasExams = subsection.exams && subsection.exams.length > 0;
                                        
                                        return (
                                          <div key={subsection.id} className="relative">
                                            <div className="flex">
                                              {/* 三级小节连接线 */}
                                              <div className="w-4 flex-shrink-0 flex flex-col items-center">
                                                <div className="w-px h-4 bg-amber-200"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm z-10"></div>
                                              </div>
                                              
                                              {/* 三级小节内容 */}
                                              <div className="flex-1 pb-2">
                                                <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                  <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                                                  <span className="text-sm font-medium text-gray-700">{subsection.name}</span>
                                                  {subsectionHasExams && (
                                                    <span className="text-xs text-amber-600">
                                                      {subsection.exams?.length}套试卷
                                                    </span>
                                                  )}
                                                  {!subsectionHasExams && (
                                                    <span className="text-xs text-gray-400">暂无内容</span>
                                                  )}
                                                </div>
                                                
                                                {/* 三级小节下的试卷列表 */}
                                                {subsectionHasExams && (
                                                  <div className="ml-4 space-y-2">
                                                    {subsection.exams?.map((exam) => renderExamCard(exam, false))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : hasExams ? (
                                    /* 如果没有三级小节，展示二级小节自己的试卷 */
                                    <div className="ml-2 space-y-2">
                                      {section.exams?.map((exam) => renderExamCard(exam, false))}
                                    </div>
                                  ) : (
                                    <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                      暂无试卷
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">该章节下暂无节</p>
                        {isEditingTree && (
                          <p className="text-xs text-gray-400 mt-1">请先在左侧添加节</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== 节级别聚合/直接展示 ==================== */}

                {/* 知识点 Tab 内容 - 节级别判断是否有子节点 */}
                {selectedChapter.level === 'section' && activeTab === 'knowledge' && (() => {
                  const sectionHasChildren = selectedChapter.children && selectedChapter.children.length > 0;
                  
                  // 如果有子节点，显示聚合内容（复用章级别样式）
                  if (sectionHasChildren) {
                    return (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <BookMarked className="w-4 h-4 text-emerald-600" />
                          知识点总览
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            （聚合展示该节下所有子节的知识点）
                          </span>
                        </h4>
                        
                        <div className="space-y-0">
                          {selectedChapter.children?.map((subsection, subsectionIndex) => {
                            const hasKnowledgePoints = subsection.knowledgePoints && subsection.knowledgePoints.length > 0;
                            const isLast = subsectionIndex === (selectedChapter.children?.length || 0) - 1;
                            
                            return (
                              <div key={subsection.id} className="relative">
                                {/* 连接线容器 */}
                                <div className="flex">
                                  {/* 左侧连接线区域 */}
                                  <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                    <div className={`w-px ${subsectionIndex === 0 ? 'h-4' : 'h-0'} bg-emerald-300`}></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10"></div>
                                    {!isLast && <div className="w-px flex-1 bg-emerald-300"></div>}
                                  </div>
                                  
                                  {/* 右侧内容区域 */}
                                  <div className="flex-1 pb-4">
                                    {/* 子节标题 */}
                                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-300">
                                      <ListTree className="w-4 h-4 text-emerald-600" />
                                      <span className="text-base font-bold text-emerald-800">{subsection.name}</span>
                                      {hasKnowledgePoints && (
                                        <span className="text-xs text-emerald-600 font-medium">
                                          {getTotalKnowledgePoints(subsection.knowledgePoints)}个知识点
                                        </span>
                                      )}
                                      {/* 三级小节的全景图谱按钮 */}
                                      {hasKnowledgePoints && (
                                        <button
                                          onClick={() => {
                                            // 临时切换到该三级小节查看全景图谱
                                            setSelectedChapterId(subsection.id);
                                            setTimeout(() => {
                                              setShowSectionKnowledgeGraph(true);
                                            }, 0);
                                          }}
                                          className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                                          title="查看该小节知识点全景图谱"
                                        >
                                          <Network className="w-3 h-3" />
                                          全景图谱
                                        </button>
                                      )}
                                    </div>
                                    
                                    {/* 知识点列表 */}
                                    {hasKnowledgePoints ? (
                                      <div className="ml-2 space-y-1.5">
                                        {subsection.knowledgePoints?.map((kp) => {
                                          const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;
                                          
                                          return (
                                            <div key={kp.id} className="space-y-0">
                                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm text-gray-700">{kp.name}</span>
                                              </div>
                                              {hasExtendedPoints && (
                                                <div className="ml-4 mt-1 space-y-1">
                                                  {kp.extendedPoints?.map((ep) => (
                                                    <div
                                                      key={ep.id}
                                                      className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-100 rounded"
                                                    >
                                                      <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
                                                      <span className="text-sm text-gray-600">{ep.name}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                        暂无知识点
                                      </div>
                                    )}
                                    
                                    {/* 三级小节知识点图谱展示 */}
                                    {hasKnowledgePoints && showSectionKnowledgeGraph && selectedChapter?.id === subsection.id && (
                                      <div className="ml-2 mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center justify-end mb-2">
                                          <button
                                            onClick={() => setShowSectionKnowledgeGraph(false)}
                                            className="text-xs text-purple-600 hover:text-purple-800"
                                          >
                                            收起
                                          </button>
                                        </div>
                                        <SectionKnowledgeGraph
                                          sectionKnowledgePoints={subsection.knowledgePoints || []}
                                          findNodeById={(nodeId: string) => {
                                            const node = findKnowledgeNodeById(nodeId);
                                            if (node) {
                                              return {
                                                id: node.id,
                                                name: node.name,
                                                prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                                  id: p.id,
                                                  name: p.name,
                                                })) || [],
                                              };
                                            }
                                            return null;
                                          }}
                                          findNodeByName={(name: string) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const findNode = (nodes: { name: string; children?: any[]; prerequisiteKnowledge?: KnowledgeRelation[] }[]): { name: string; prerequisiteKnowledge?: KnowledgeRelation[] } | null => {
                                              for (const node of nodes) {
                                                if (node.name === name || name.includes(node.name) || node.name.includes(name)) {
                                                  return node;
                                                }
                                                if (node.children) {
                                                  const found = findNode(node.children);
                                                  if (found) return found;
                                                }
                                              }
                                              return null;
                                            };
                                            const node = findNode(knowledgeRelationsData);
                                            if (node) {
                                              return {
                                                id: node.name,
                                                name: node.name,
                                                prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                                  id: p.id,
                                                  name: p.name,
                                                })) || [],
                                              };
                                            }
                                            return null;
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  // 如果没有子节点，显示原有的直接维护态
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <ListTree className="w-4 h-4 text-emerald-600" />
                          关联知识点
                          {selectedChapter.knowledgePoints && selectedChapter.knowledgePoints.length > 0 && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">
                              （{getTotalKnowledgePoints(selectedChapter.knowledgePoints)}个知识点）
                            </span>
                          )}
                          {isEditingDetail && selectedChapter.knowledgePoints && selectedChapter.knowledgePoints.length > 1 && (
                            <span className="ml-2 text-xs text-gray-400 font-normal flex items-center gap-1">
                              <GripVertical className="w-3 h-3" />
                              可拖拽排序
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2">
                          {(selectedChapter.knowledgePoints?.length || 0) > 0 && (
                            <button
                              onClick={() => setShowSectionKnowledgeGraph(!showSectionKnowledgeGraph)}
                              className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-all ${
                                showSectionKnowledgeGraph
                                  ? 'bg-purple-500 text-white'
                                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                              }`}
                              title="查看本节知识点全景图谱"
                            >
                              <Network className="w-4 h-4" />
                              全景图谱
                            </button>
                          )}
                          {isEditingDetail && (
                            <button
                              onClick={() => {
                                setSelectedKnowledgePoints(selectedChapter.knowledgePoints || []);
                                const initialExpandedSet = new Set<string>();
                                (selectedChapter.knowledgePoints || []).forEach(kp => {
                                  initialExpandedSet.add(kp.id);
                                });
                                setExpandedKnowledgePoints(initialExpandedSet);
                                // 根据节点层级生成不同的标题
                                if (selectedChapter.level === 'subsection') {
                                  // 三级小节：使用新格式【专题X-X.X xxxxx】
                                  setKpDialogTitle(generateKpDialogTitle(selectedChapter.id));
                                } else {
                                  // 二级小节：使用原有格式
                                  const parentChapter = findParentChapter(selectedChapter.id);
                                  setKpDialogTitle(parentChapter?.name || '知识点');
                                }
                                setShowKnowledgePointSelector(true);
                              }}
                              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              <Plus className="w-4 h-4" />
                              知识点
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {(selectedChapter.knowledgePoints?.length || 0) > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleChapterKpDragEnd}
                        >
                          <SortableContext
                            items={selectedChapter.knowledgePoints?.map(kp => kp.id) || []}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {selectedChapter.knowledgePoints?.map((kp, index) => (
                                <ChapterKnowledgePoint
                                  key={kp.id}
                                  kp={kp}
                                  index={index}
                                  chapterId={selectedChapter.id}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">暂未关联知识点</p>
                          {isEditingDetail && (
                            <p className="text-xs text-gray-400 mt-1">点击上方按钮从知识树引用知识点</p>
                          )}
                        </div>
                      )}
                      
                      {/* 二级小节知识点图谱展示 */}
                      {(selectedChapter.knowledgePoints?.length || 0) > 0 && showSectionKnowledgeGraph && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-end mb-3">
                            <button
                              onClick={() => setShowSectionKnowledgeGraph(false)}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              收起
                            </button>
                          </div>
                          <SectionKnowledgeGraph
                            sectionKnowledgePoints={selectedChapter.knowledgePoints || []}
                            findNodeById={(nodeId: string) => {
                              const node = findKnowledgeNodeById(nodeId);
                              if (node) {
                                return {
                                  id: node.id,
                                  name: node.name,
                                  prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                    id: p.id,
                                    name: p.name,
                                  })) || [],
                                };
                              }
                              return null;
                            }}
                            findNodeByName={(name: string) => {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const findNode = (nodes: { name: string; children?: any[]; prerequisiteKnowledge?: KnowledgeRelation[] }[]): { name: string; prerequisiteKnowledge?: KnowledgeRelation[] } | null => {
                                for (const node of nodes) {
                                  if (node.name === name || name.includes(node.name) || node.name.includes(name)) {
                                    return node;
                                  }
                                  if (node.children) {
                                    const found = findNode(node.children);
                                    if (found) return found;
                                  }
                                }
                                return null;
                              };
                              const node = findNode(knowledgeRelationsData);
                              if (node) {
                                return {
                                  id: node.name,
                                  name: node.name,
                                  prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                    id: p.id,
                                    name: p.name,
                                  })) || [],
                                };
                              }
                              return null;
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 同步课程 Tab 内容 - 节级别判断是否有子节点 */}
                {selectedChapter.level === 'section' && activeTab === 'course' && (() => {
                  const sectionHasChildren = selectedChapter.children && selectedChapter.children.length > 0;
                  
                  // 如果有子节点，显示聚合内容（复用章级别样式）
                  if (sectionHasChildren) {
                    return (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          同步课程总览
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                          <PrdTooltip data={isEditingDetail ? prd205.editSyncCourseAggregate : prd200.textbookSyncCourseAggregate} className="ml-1" />
                            （聚合展示该节下所有子节关联的课程）
                          </span>
                        </h4>
                        
                        <div className="space-y-0">
                          {selectedChapter.children?.map((subsection, subsectionIndex) => {
                            const hasCourses = subsection.courses && subsection.courses.length > 0;
                            const isLast = subsectionIndex === (selectedChapter.children?.length || 0) - 1;
                            
                            return (
                              <div key={subsection.id} className="relative">
                                <div className="flex">
                                  <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                    <div className={`w-px ${subsectionIndex === 0 ? 'h-4' : 'h-0'} bg-blue-300`}></div>
                                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10"></div>
                                    {!isLast && <div className="w-px flex-1 bg-blue-300"></div>}
                                  </div>
                                  
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-300">
                                      <ListTree className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-bold text-blue-800">{subsection.name}</span>
                                      {hasCourses && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          ({subsection.courses?.length}个课程)
                                        </span>
                                      )}
                                    </div>
                                    
                                    {hasCourses ? (
                                      <div className="ml-2 space-y-2">
                                        {subsection.courses?.map((course) => renderCourseCard(course, false))}
                                      </div>
                                    ) : (
                                      <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                        暂无课程
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  // 如果没有子节点，显示原有的直接维护态
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          关联同步课程
                          {isEditingDetail && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              删除视频，仅代表在当前页面解除关联关系，不影响原视频在资源库中的存在。
                            </span>
                          )}
                          <PrdTooltip data={isEditingDetail ? prd205.editSyncCourseLeafData : prd200.textbookSyncCourseDetail} className="ml-1" />
                          {(selectedChapter.courses?.length || 0) > 0 && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">
                              ({selectedChapter.courses?.length || 0}个)
                            </span>
                          )}
                        </h4>
                        {isEditingDetail && (
                          <div className="flex items-center gap-2">
                            <PrdTooltip data={prd205.editSyncCourseActions} className="mr-1" />
                            <button
                              onClick={() => {
                                setUploadFiles([]);
                                setIsUploadingCourse(false);
                                setShowUploadCourseDialog(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              上传课程
                            </button>
                            <button
                              onClick={() => {
                                setTempSelectedCourses([]);
                                setCourseSearchKeyword('');
                                setShowCourseSelector(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                              从资源库选择
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {(selectedChapter.courses?.length || 0) > 0 ? (
                        <div className="space-y-2">
                          {selectedChapter.courses?.map((course) => renderCourseCard(course, true))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
                          <PrdTooltip data={isEditingDetail ? prd205.editSyncCourseLeafEmpty : prd200.textbookSyncCourseEmpty} className="absolute top-2 right-2" />
                          <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">暂未关联同步课程</p>
                          {isEditingDetail && (
                            <p className="text-xs text-gray-400 mt-1">点击上方按钮添加同步课程</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 练习试卷 Tab 内容 - 节级别判断是否有子节点 */}
                {selectedChapter.level === 'section' && activeTab === 'exam' && (() => {
                  const sectionHasChildren = selectedChapter.children && selectedChapter.children.length > 0;
                  
                  // 如果有子节点，显示聚合内容（复用章级别样式）
                  if (sectionHasChildren) {
                    return (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          练习试卷总览
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            （聚合展示该节下所有子节关联的试卷）
                          </span>
                          <PrdTooltip data={prd200.textbookPracticePaperAggregate} className="ml-1" />
                        </h4>
                        
                        <div className="space-y-0">
                          {selectedChapter.children?.map((subsection, subsectionIndex) => {
                            const hasExams = subsection.exams && subsection.exams.length > 0;
                            const isLast = subsectionIndex === (selectedChapter.children?.length || 0) - 1;
                            
                            return (
                              <div key={subsection.id} className="relative">
                                <div className="flex">
                                  <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                    <div className={`w-px ${subsectionIndex === 0 ? 'h-4' : 'h-0'} bg-amber-300`}></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10"></div>
                                    {!isLast && <div className="w-px flex-1 bg-amber-300"></div>}
                                  </div>
                                  
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-300">
                                      <ListTree className="w-4 h-4 text-amber-600" />
                                      <span className="text-sm font-bold text-amber-800">{subsection.name}</span>
                                      {hasExams && (
                                        <span className="text-xs text-amber-600 font-medium">
                                          ({subsection.exams?.length}套)
                                        </span>
                                      )}
                                    </div>
                                    
                                    {hasExams ? (
                                      <div className="ml-2 space-y-2">
                                        {subsection.exams?.map((exam) => renderExamCard(exam, false))}
                                      </div>
                                    ) : (
                                      <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                        暂无试卷
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  // 如果没有子节点，显示原有的直接维护态
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          关联练习试卷
                          <PrdTooltip data={prd200.textbookPracticePaperDetail} className="ml-1" />
                          <PrdTooltip data={prd209.examSourceTag} className="ml-0.5" />
                          {(selectedChapter.exams?.length || 0) > 0 && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">
                              ({selectedChapter.exams?.length || 0}套)
                            </span>
                          )}
                        </h4>
                        {isEditingDetail && (
                          <div className="flex items-center gap-2">
                            {(selectedChapter.exams?.length || 0) > 0 && (
                              <button
                                onClick={() => {
                                  setShowBatchDeleteExamDialog(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                批量删除
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setTempSelectedExams([]);
                                setExamSearchKeyword('');
                                setShowExamSelector(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                              从资源库选择
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {(selectedChapter.exams?.length || 0) > 0 ? (
                        <div className="space-y-2">
                          {selectedChapter.exams?.map((exam) => renderExamCard(exam, true))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
                          <PrdTooltip data={prd200.textbookPracticePaperEmpty} className="absolute top-2 right-2" />
                          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">暂未关联练习试卷</p>
                          {isEditingDetail && (
                            <p className="text-xs text-gray-400 mt-1">点击上方按钮添加练习试卷</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ==================== 子节级别（直接维护态） ==================== */}
                
                {/* 子节级别 - 知识点直接维护 */}
                {selectedChapter.level === 'subsection' && activeTab === 'knowledge' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ListTree className="w-4 h-4 text-emerald-600" />
                        关联知识点
                        {selectedChapter.knowledgePoints && selectedChapter.knowledgePoints.length > 0 && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            （{getTotalKnowledgePoints(selectedChapter.knowledgePoints)}个知识点）
                          </span>
                        )}
                        {isEditingDetail && selectedChapter.knowledgePoints && selectedChapter.knowledgePoints.length > 1 && (
                          <span className="ml-2 text-xs text-gray-400 font-normal flex items-center gap-1">
                            <GripVertical className="w-3 h-3" />
                            可拖拽排序
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2">
                        {(selectedChapter.knowledgePoints?.length || 0) > 0 && (
                          <button
                            onClick={() => setShowSectionKnowledgeGraph(!showSectionKnowledgeGraph)}
                            className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-all ${
                              showSectionKnowledgeGraph
                                ? 'bg-purple-500 text-white'
                                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                            }`}
                            title="查看本节知识点全景图谱"
                          >
                            <Network className="w-4 h-4" />
                            全景图谱
                          </button>
                        )}
                        {isEditingDetail && (
                          <button
                            onClick={() => {
                              setSelectedKnowledgePoints(selectedChapter.knowledgePoints || []);
                              const initialExpandedSet = new Set<string>();
                              (selectedChapter.knowledgePoints || []).forEach(kp => {
                                initialExpandedSet.add(kp.id);
                              });
                              setExpandedKnowledgePoints(initialExpandedSet);
                              // 三级小节：使用新格式【第X章-第X节 xxxxx】
                              setKpDialogTitle(generateKpDialogTitle(selectedChapter.id));
                              setShowKnowledgePointSelector(true);
                            }}
                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            <Plus className="w-4 h-4" />
                            知识点
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {(selectedChapter.knowledgePoints?.length || 0) > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleChapterKpDragEnd}
                      >
                        <SortableContext
                          items={selectedChapter.knowledgePoints?.map(kp => kp.id) || []}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {selectedChapter.knowledgePoints?.map((kp, index) => (
                              <ChapterKnowledgePoint
                                key={kp.id}
                                kp={kp}
                                index={index}
                                chapterId={selectedChapter.id}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">暂未关联知识点</p>
                        {isEditingDetail && (
                          <p className="text-xs text-gray-400 mt-1">点击上方按钮从知识树引用知识点</p>
                        )}
                      </div>
                    )}
                    
                    {/* 二级小节知识点图谱展示 */}
                    {(selectedChapter.knowledgePoints?.length || 0) > 0 && showSectionKnowledgeGraph && (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-end mb-3">
                          <button
                            onClick={() => setShowSectionKnowledgeGraph(false)}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            收起
                          </button>
                        </div>
                        <SectionKnowledgeGraph
                          sectionKnowledgePoints={selectedChapter.knowledgePoints || []}
                          findNodeById={(nodeId: string) => {
                            const node = findKnowledgeNodeById(nodeId);
                            if (node) {
                              return {
                                id: node.id,
                                name: node.name,
                                prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                  id: p.id,
                                  name: p.name,
                                })) || [],
                              };
                            }
                            return null;
                          }}
                          findNodeByName={(name: string) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const findNode = (nodes: { name: string; children?: any[]; prerequisiteKnowledge?: KnowledgeRelation[] }[]): { name: string; prerequisiteKnowledge?: KnowledgeRelation[] } | null => {
                              for (const node of nodes) {
                                if (node.name === name || name.includes(node.name) || node.name.includes(name)) {
                                  return node;
                                }
                                if (node.children) {
                                  const found = findNode(node.children);
                                  if (found) return found;
                                }
                              }
                              return null;
                            };
                            const node = findNode(knowledgeRelationsData);
                            if (node) {
                              return {
                                id: node.name,
                                name: node.name,
                                prerequisiteKnowledge: node.prerequisiteKnowledge?.map((p: KnowledgeRelation) => ({
                                  id: p.id,
                                  name: p.name,
                                })) || [],
                              };
                            }
                            return null;
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 子节级别 - 同步课程直接维护 */}
                {selectedChapter.level === 'subsection' && activeTab === 'course' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        关联同步课程
                        {isEditingDetail && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            删除视频，仅代表在当前页面解除关联关系，不影响原视频在资源库中的存在。
                          </span>
                        )}
                        <PrdTooltip data={isEditingDetail ? prd205.editSyncCourseLeafData : prd200.textbookSyncCourseSectionDetail} className="ml-1" />
                        {(selectedChapter.courses?.length || 0) > 0 && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            ({selectedChapter.courses?.length || 0}个)
                          </span>
                        )}
                      </h4>
                      {isEditingDetail && (
                        <div className="flex items-center gap-2">
                          <PrdTooltip data={prd205.editSyncCourseActions} className="mr-1" />
                          <button
                            onClick={() => {
                              setUploadFiles([]);
                              setIsUploadingCourse(false);
                              setShowUploadCourseDialog(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            上传课程
                          </button>
                          <button
                            onClick={() => {
                              setTempSelectedCourses([]);
                              setCourseSearchKeyword('');
                              setShowCourseSelector(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            从资源库选择
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {(selectedChapter.courses?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        {selectedChapter.courses?.map((course) => renderCourseCard(course, true))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
                        <PrdTooltip data={isEditingDetail ? prd205.editSyncCourseLeafEmpty : prd200.textbookSyncCourseEmpty} className="absolute top-2 right-2" />
                        <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">暂未关联同步课程</p>
                        {isEditingDetail && (
                          <p className="text-xs text-gray-400 mt-1">点击上方按钮添加同步课程</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 子节级别 - 练习试卷直接维护 */}
                {selectedChapter.level === 'subsection' && activeTab === 'exam' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        关联练习试卷
                        <PrdTooltip data={prd200.textbookPracticePaperSectionDetail} className="ml-1" />
                        {(selectedChapter.exams?.length || 0) > 0 && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            ({selectedChapter.exams?.length || 0}套)
                          </span>
                        )}
                      </h4>
                      {isEditingDetail && (
                        <div className="flex items-center gap-2">
                          {(selectedChapter.exams?.length || 0) > 0 && (
                            <button
                              onClick={() => {
                                setShowBatchDeleteExamDialog(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              批量删除
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTempSelectedExams([]);
                              setExamSearchKeyword('');
                              setShowExamSelector(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            从资源库选择
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {(selectedChapter.exams?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        {selectedChapter.exams?.map((exam) => renderExamCard(exam, true))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
                        <PrdTooltip data={prd200.textbookPracticePaperEmpty} className="absolute top-2 right-2" />
                        <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">暂未关联练习试卷</p>
                        {isEditingDetail && (
                          <p className="text-xs text-gray-400 mt-1">点击上方按钮从资源库选择练习试卷</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div>
                {/* 专题级视图 */}
                {/* 标题行：固定标题 + 操作按钮 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">{selectedTextbook.name}<PrdTooltip data={prd215.textbookLevelTitle} className="ml-1" /></h3>
                  <div className="flex items-center gap-2">
                    {/* 非编辑态：显示编辑按钮 */}
                    {!isEditingDetail && (
                      <button
                        onClick={() => {
                          const snapshot = JSON.stringify(chapters);
                          setDetailEditSnapshot(snapshot);
                          setIsEditingDetail(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑专题详情
                      </button>
                    )}
                    
                    {/* 编辑态：显示取消、保存编辑按钮 */}
                    {isEditingDetail && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingDetail(false);
                            setDetailEditSnapshot('');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingDetail(false);
                            setDetailEditSnapshot('');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        >
                          <Save className="w-4 h-4" />
                          保存编辑
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 专题名称行：左侧显示专题名称，右侧显示 Tab 切换 */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-200">
                  {/* 左侧：专题名称 */}
                  <div className="text-sm text-gray-700">
                    {selectedTextbook.name}
                  </div>
                  
                  {/* 右侧：Tab 切换 */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('knowledge')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'knowledge'
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 inline-block mr-1" />
                      知识点
                    </button>
                    <button
                      onClick={() => setActiveTab('course')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'course'
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <Video className="w-4 h-4 inline-block mr-1" />
                      同步课程
                    </button>
                    <button
                      onClick={() => setActiveTab('exam')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'exam'
                          ? 'text-emerald-600 border-emerald-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 inline-block mr-1" />
                      练习试卷
                    </button>
                  </div>
                </div>

                {/* 知识点Tab - 专题级聚合展示（复用章节级样式） */}
                {activeTab === 'knowledge' && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-gray-700">
                      知识点总览
                      <span className="text-xs text-gray-400 font-normal ml-2">聚合展示该专题下所有章节关联的知识点</span>
                      <PrdTooltip data={prd215.textbookKnowledgeOverview} className="ml-1" />
                    </h4>
                    {chapters.map((chapter) => (
                      <div key={chapter.id}>
                        {/* 章节标题 - 高亮块 */}
                        <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                          <BookMarked className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-emerald-800">{chapter.name}</span>
                          <span className="text-xs text-emerald-600 font-medium">
                            ({countKnowledgePoints(chapter)}个知识点)
                          </span>
                        </div>
                        
                        {chapter.children && chapter.children.length > 0 ? (
                          <div className="space-y-0">
                            {chapter.children.map((section, sectionIndex) => {
                              const hasKnowledgePoints = section.knowledgePoints && section.knowledgePoints.length > 0;
                              const hasSubsections = section.children && section.children.length > 0;
                              const isLast = sectionIndex === (chapter.children?.length || 0) - 1;
                              
                              return (
                                <div key={section.id} className="relative">
                                  {/* 连接线容器 */}
                                  <div className="flex">
                                    {/* 左侧连接线区域 */}
                                    <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                      {/* 顶部连接线 */}
                                      <div className={`w-px ${sectionIndex === 0 ? 'h-4' : 'h-0'} bg-emerald-300`}></div>
                                      {/* 圆点 */}
                                      <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10"></div>
                                      {/* 底部连接线 */}
                                      {!isLast && <div className="w-px flex-1 bg-emerald-300"></div>}
                                    </div>
                                    
                                    {/* 右侧内容区域 */}
                                    <div className="flex-1 pb-4">
                                      {/* 节标题 - 突出显示 */}
                                      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-300">
                                        <ListTree className="w-4 h-4 text-emerald-600" />
                                        <span className="text-base font-bold text-emerald-800">{section.name}</span>
                                        {hasKnowledgePoints && (
                                          <span className="text-xs text-emerald-600 font-medium">
                                            {getTotalKnowledgePoints(section.knowledgePoints)}个知识点
                                          </span>
                                        )}
                                        {hasSubsections && (
                                          <span className="text-xs text-gray-500">
                                            （含{hasSubsections}个小节）
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* 如果有三级小节，嵌套展示三级小节及其内容 */}
                                      {hasSubsections ? (
                                        <div className="ml-2 space-y-2">
                                          {section.children?.map((subsection) => {
                                            const subsectionHasKp = subsection.knowledgePoints && subsection.knowledgePoints.length > 0;
                                            const hasSubChildren = subsection.children && subsection.children.length > 0;
                                            
                                            return (
                                              <div key={subsection.id} className="relative">
                                                <div className="flex items-start">
                                                  {/* 三级小节连接线 */}
                                                  <div className="w-4 flex-shrink-0 flex flex-col items-center pt-1">
                                                    <div className="w-px h-4 bg-emerald-200"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm z-10"></div>
                                                  </div>
                                                  
                                                  {/* 三级小节内容 */}
                                                  <div className="flex-1 pb-2">
                                                    <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                      <span className="text-sm font-medium text-gray-700">{subsection.name}</span>
                                                      {subsectionHasKp && (
                                                        <span className="text-xs text-emerald-600">
                                                          {getTotalKnowledgePoints(subsection.knowledgePoints)}个知识点
                                                        </span>
                                                      )}
                                                      {!subsectionHasKp && !hasSubChildren && (
                                                        <span className="text-xs text-gray-400">暂无内容</span>
                                                      )}
                                                    </div>
                                                    
                                                    {/* 三级小节下的知识点列表 */}
                                                    {subsectionHasKp && (
                                                      <div className="ml-4 space-y-1">
                                                        {subsection.knowledgePoints?.map((kp) => {
                                                          const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;
                                                          return (
                                                            <div key={kp.id} className="space-y-0">
                                                              <div className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-100 rounded">
                                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                                <span className="text-sm text-gray-600">{kp.name}</span>
                                                              </div>
                                                              {hasExtendedPoints && (
                                                                <div className="ml-4 space-y-0.5">
                                                                  {kp.extendedPoints?.map((ep) => (
                                                                    <div
                                                                      key={ep.id}
                                                                      className="flex items-center gap-2 px-2 py-0.5 bg-gray-50 border border-gray-50 rounded text-xs"
                                                                    >
                                                                      <Circle className="w-2.5 h-2.5 text-gray-400 fill-gray-200" />
                                                                      <span className="text-gray-500">{ep.name}</span>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : hasKnowledgePoints ? (
                                        /* 如果没有三级小节，展示二级小节自己的知识点 */
                                        <div className="ml-2 space-y-1.5">
                                          {section.knowledgePoints?.map((kp) => {
                                            const hasExtendedPoints = kp.extendedPoints && kp.extendedPoints.length > 0;
                                            
                                            return (
                                              <div key={kp.id} className="space-y-0">
                                                {/* 主知识点 */}
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded">
                                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                  <span className="text-sm text-gray-700">{kp.name}</span>
                                                </div>
                                                
                                                {/* 延伸知识点 */}
                                                {hasExtendedPoints && (
                                                  <div className="ml-4 mt-1 space-y-1">
                                                    {kp.extendedPoints?.map((ep) => (
                                                      <div
                                                        key={ep.id}
                                                        className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-100 rounded"
                                                      >
                                                        <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
                                                        <span className="text-sm text-gray-600">{ep.name}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                          暂无知识点
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">该章节下暂无节</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 同步课程Tab - 专题级聚合展示（复用章节级样式） */}
                {activeTab === 'course' && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-gray-700">
                      同步课程总览
                      <span className="text-xs text-gray-400 font-normal ml-2">聚合展示该专题下所有章节关联的课程</span>
                      <PrdTooltip data={prd215.textbookCourseOverview} className="ml-1" />
                    </h4>
                    {chapters.map((chapter) => (
                      <div key={chapter.id}>
                        {/* 章节标题 - 高亮块 */}
                        <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                          <Video className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-bold text-blue-800">{chapter.name}</span>
                          <span className="text-xs text-blue-600 font-medium">
                            ({countCourses(chapter)}个课程)
                          </span>
                        </div>
                        
                        {chapter.children && chapter.children.length > 0 ? (
                          <div className="space-y-0">
                            {chapter.children.map((section, sectionIndex) => {
                              const hasCourses = section.courses && section.courses.length > 0;
                              const hasSubsections = section.children && section.children.length > 0;
                              const isLast = sectionIndex === (chapter.children?.length || 0) - 1;
                              
                              return (
                                <div key={section.id} className="relative">
                                  {/* 连接线容器 */}
                                  <div className="flex">
                                    {/* 左侧连接线区域 */}
                                    <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                      <div className={`w-px ${sectionIndex === 0 ? 'h-4' : 'h-0'} bg-blue-300`}></div>
                                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10"></div>
                                      {!isLast && <div className="w-px flex-1 bg-blue-300"></div>}
                                    </div>
                                    
                                    {/* 右侧内容区域 */}
                                    <div className="flex-1 pb-4">
                                      {/* 节标题 */}
                                      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-300">
                                        <ListTree className="w-4 h-4 text-blue-600" />
                                        <span className="text-base font-bold text-blue-800">{section.name}</span>
                                        {hasCourses && (
                                          <span className="text-xs text-blue-600">
                                            ({section.courses?.length}个课程)
                                          </span>
                                        )}
                                        {hasSubsections && (
                                          <span className="text-xs text-gray-500">
                                            （含{hasSubsections}个小节）
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* 如果有三级小节，嵌套展示三级小节及其内容 */}
                                      {hasSubsections ? (
                                        <div className="ml-2 space-y-2">
                                          {section.children?.map((subsection) => {
                                            const subsectionHasCourses = subsection.courses && subsection.courses.length > 0;
                                            
                                            return (
                                              <div key={subsection.id} className="relative">
                                                <div className="flex">
                                                  {/* 三级小节连接线 */}
                                                  <div className="w-4 flex-shrink-0 flex flex-col items-center">
                                                    <div className="w-px h-4 bg-blue-200"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white shadow-sm z-10"></div>
                                                  </div>
                                                  
                                                  {/* 三级小节内容 */}
                                                  <div className="flex-1 pb-2">
                                                    <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                      <Video className="w-3.5 h-3.5 text-gray-500" />
                                                      <span className="text-sm font-medium text-gray-700">{subsection.name}</span>
                                                      {subsectionHasCourses && (
                                                        <span className="text-xs text-blue-600">
                                                          {subsection.courses?.length}个课程
                                                        </span>
                                                      )}
                                                      {!subsectionHasCourses && (
                                                        <span className="text-xs text-gray-400">暂无内容</span>
                                                      )}
                                                    </div>
                                                    
                                                    {/* 三级小节下的课程列表 */}
                                                    {subsectionHasCourses && (
                                                      <div className="ml-4 space-y-2">
                                                        {subsection.courses?.map((course) => renderCourseCard(course, false))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : hasCourses ? (
                                        /* 如果没有三级小节，展示二级小节自己的课程 */
                                        <div className="ml-2 space-y-2">
                                          {section.courses?.map((course) => renderCourseCard(course, false))}
                                        </div>
                                      ) : (
                                        <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                          暂无课程
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">该章节下暂无节</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 练习试卷Tab - 专题级聚合展示（复用章节级样式） */}
                {activeTab === 'exam' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        练习试卷总览
                        <span className="text-xs text-gray-400 font-normal ml-2">聚合展示该专题下所有章节关联的试卷</span>
                        <PrdTooltip data={prd215.textbookExamOverview} className="ml-1" />
                      </h4>
                      {isEditingDetail && (
                        <span className="flex items-center gap-2">
                          <button
                            onClick={() => setShowTextbookBatchDeleteModal(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 border border-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            批量删除<PrdTooltip data={prd215.textbookBatchDeleteButton} className="ml-0.5" />
                          </button>
                          <button
                            onClick={() => setShowWorkbookImportModal(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            从习题册导入<PrdTooltip data={prd215.workbookImportButton} className="ml-0.5" />
                          </button>
                        </span>
                      )}
                    </div>
                    {chapters.map((chapter) => (
                      <div key={chapter.id}>
                        {/* 章节标题 */}
                        <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
                          <ClipboardList className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-bold text-amber-800">{chapter.name}</span>
                          <span className="text-xs text-amber-600 font-medium">
                            ({countExams(chapter)}套试卷)
                          </span>
                        </div>
                        
                        {chapter.children && chapter.children.length > 0 ? (
                          <div className="space-y-0">
                            {chapter.children.map((section, sectionIndex) => {
                              const hasExams = section.exams && section.exams.length > 0;
                              const hasSubsections = section.children && section.children.length > 0;
                              const isLast = sectionIndex === (chapter.children?.length || 0) - 1;
                              
                              return (
                                <div key={section.id} className="relative">
                                  {/* 连接线容器 */}
                                  <div className="flex">
                                    {/* 左侧连接线区域 */}
                                    <div className="w-6 flex-shrink-0 flex flex-col items-center">
                                      <div className={`w-px ${sectionIndex === 0 ? 'h-4' : 'h-0'} bg-amber-300`}></div>
                                      <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10"></div>
                                      {!isLast && <div className="w-px flex-1 bg-amber-300"></div>}
                                    </div>
                                    
                                    {/* 右侧内容区域 */}
                                    <div className="flex-1 pb-4">
                                      {/* 节标题 */}
                                      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-300">
                                        <ListTree className="w-4 h-4 text-amber-600" />
                                        <span className="text-base font-bold text-amber-800">{section.name}</span>
                                        {hasExams && (
                                          <span className="text-xs text-amber-600">
                                            ({section.exams?.length}套试卷)
                                          </span>
                                        )}
                                        {hasSubsections && (
                                          <span className="text-xs text-gray-500">
                                            （含{hasSubsections}个小节）
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* 如果有三级小节，嵌套展示三级小节及其内容 */}
                                      {hasSubsections ? (
                                        <div className="ml-2 space-y-2">
                                          {section.children?.map((subsection) => {
                                            const subsectionHasExams = subsection.exams && subsection.exams.length > 0;
                                            
                                            return (
                                              <div key={subsection.id} className="relative">
                                                <div className="flex">
                                                  {/* 三级小节连接线 */}
                                                  <div className="w-4 flex-shrink-0 flex flex-col items-center">
                                                    <div className="w-px h-4 bg-amber-200"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm z-10"></div>
                                                  </div>
                                                  
                                                  {/* 三级小节内容 */}
                                                  <div className="flex-1 pb-2">
                                                    <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                                      <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                                                      <span className="text-sm font-medium text-gray-700">{subsection.name}</span>
                                                      {subsectionHasExams && (
                                                        <span className="text-xs text-amber-600">
                                                          {subsection.exams?.length}套试卷
                                                        </span>
                                                      )}
                                                      {!subsectionHasExams && (
                                                        <span className="text-xs text-gray-400">暂无内容</span>
                                                      )}
                                                    </div>
                                                    
                                                    {/* 三级小节下的试卷列表 */}
                                                    {subsectionHasExams && (
                                                      <div className="ml-4 space-y-2">
                                                        {subsection.exams?.map((exam) => renderExamCard(exam, false))}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : hasExams ? (
                                        /* 如果没有三级小节，展示二级小节自己的试卷 */
                                        <div className="ml-2 space-y-2">
                                          {section.exams?.map((exam) => renderExamCard(exam, false))}
                                        </div>
                                      ) : (
                                        <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                                          暂无试卷
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">该章节下暂无节</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 一级页面 */}
      {!selectedTextbook && <TextbookListPage />}

      {/* 二级页面 */}
      {selectedTextbook && <TextbookDetailPage />}

      {/* 新增专题弹窗 */}
      {showAddTextbookDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">新增专题</h3>
              <button
                onClick={() => {
                  setShowAddTextbookDialog(false);
                  // 清空表单
                  setNewTextbookName('');
                  setNewTextbookPhase('senior');
                  setNewTextbookSubject('math');
                  setNewTextbookPublisher('');
                  setIsAddFromTop(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* 学段 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学段 <span className="text-red-500">*</span>
                </label>
                <select 
                  value={newTextbookPhase}
                  onChange={(e) => setNewTextbookPhase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(phaseConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 学科 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学科 <span className="text-red-500">*</span>
                </label>
                <select 
                  value={newTextbookSubject}
                  onChange={(e) => setNewTextbookSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 场景 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  场景 {isAddFromTop && <span className="text-red-500">*</span>}
                </label>
                {isAddFromTop ? (
                  // 从顶部入口：可选择场景
                  <select 
                    value={newTextbookPublisher}
                    onChange={(e) => setNewTextbookPublisher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">请选择场景</option>
                    {scenes.map((scene) => (
                      <option key={scene.id} value={scene.name}>
                        {scene.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  // 从场景分组入口：不可编辑，回显当前场景
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                    {currentPublisher}
                  </div>
                )}
              </div>
              
              {/* 专题名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  专题名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTextbookName}
                  onChange={(e) => setNewTextbookName(e.target.value)}
                  placeholder="请输入专题名称，如：函数"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
</div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddTextbookDialog(false);
                  // 清空表单
                  setNewTextbookName('');
setNewTextbookPhase('senior');
                  setNewTextbookSubject('math');
                  setNewTextbookPublisher('');
                  setIsAddFromTop(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  // 验证必填字段
                  if (!newTextbookName.trim()) {
                    alert('请输入专题名称');
                    return;
                  }
                  if (!newTextbookPhase) {
                    alert('请选择学段');
                    return;
                  }
                  if (!newTextbookSubject) {
                    alert('请选择学科');
                    return;
                  }
                  
                  // 从顶部入口时，验证场景选择
                  if (isAddFromTop && !newTextbookPublisher) {
                    alert('请选择场景');
                    return;
                  }
                  
                  // 确定版本值
                  const publisherValue = isAddFromTop ? newTextbookPublisher : currentPublisher;
                  
                  // 创建新专题
                  const newTextbook: Textbook = {
                    id: `t-${Date.now()}`,
                    name: newTextbookName.trim(),
                    subject: newTextbookSubject,
                    phase: phaseConfig[newTextbookPhase as keyof typeof phaseConfig]?.label || '高中',
                    grade: '', // 年级字段已移除
                    publisher: publisherValue,
                    version: '2024版',
                    year: new Date().getFullYear().toString(),
                    region: '全国',
                    chapterCount: 0,
                    knowledgePointCount: 0,
                    schoolCount: 0,
                  };
                  
                  // 添加到专题列表
                  setTextbooks([...textbooks, newTextbook]);
                  
                  // 关闭弹窗并清空表单
                  setShowAddTextbookDialog(false);
                  setNewTextbookName('');
                  setNewTextbookPhase('senior');
                  setNewTextbookSubject('math');
                  setNewTextbookPublisher('');
                  setIsAddFromTop(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 知识点选择器弹窗 - 左右布局 */}
      {showKnowledgePointSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl w-[900px] h-[600px] overflow-hidden flex flex-col relative">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{kpDialogTitle}</h3>
              <button
                onClick={() => {
                  setShowKnowledgePointSelector(false);
                  setSelectedKnowledgePoints([]);
                  setKpSearchKeyword('');
                  setExpandedKnowledgePoints(new Set());
                  setAddingExtendedKpParentId(null);
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  data={knowledgeTreeData as any}
                  selectedIds={selectedKnowledgePoints.map(kp => kp.id)}
                  selectedNames={selectedKnowledgePoints.map(kp => kp.name)}
                  selectorType="prerequisite"
                  disabledIds={(() => {
                    // 获取已选中的非末级节点ID
                    const selectedModuleIds = selectedKnowledgePoints
                      .filter(kp => kp.isModule)
                      .map(kp => kp.id);
                    console.log('[专题树-父子互斥] 已选中的非末级节点ID:', selectedModuleIds);
                    // 计算需要禁用的子节点ID
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const disabled = getBatchChildIds(knowledgeTreeData as any, selectedModuleIds);
                    console.log('[专题树-父子互斥] 计算出的disabledIds:', disabled);
                    return disabled;
                  })()}
                  onSelect={(item) => {
                    console.log('[专题树-父子互斥] 选择节点:', item);
                    // 父子节点互斥逻辑：如果选择的是非末级节点（有子节点），需要移除其已选中的子节点
                    if (item.isModule) {
                      // 获取该非末级节点下的所有子节点ID
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const childIds = getBatchChildIds(knowledgeTreeData as any, [item.id]);
                      console.log('[专题树-父子互斥] 该非末级节点的所有子节点ID:', childIds);
                      
                      // 过滤掉已选中的子节点
                      const filteredKnowledgePoints = selectedKnowledgePoints.filter(kp => !childIds.includes(kp.id));
                      console.log('[专题树-父子互斥] 过滤后的知识点:', filteredKnowledgePoints);
                      
                      // 添加新选中的知识点
                      const newKp: KnowledgeRelation = {
                        id: item.id,
                        name: item.name,
                        isModule: item.isModule,
                      };
                      setSelectedKnowledgePoints([...filteredKnowledgePoints, newKp]);
                    } else {
                      // 末级节点，直接添加
                      const newKp: KnowledgeRelation = {
                        id: item.id,
                        name: item.name,
                        isModule: item.isModule,
                      };
                      setSelectedKnowledgePoints([...selectedKnowledgePoints, newKp]);
                    }
                  }}
                />
              </div>
              
              {/* 右侧：表格展示 */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-700">
                    已选知识点配置
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {/* 表格 */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border border-gray-200 w-[180px]">
                          当前小节名称
                        </th>
                        <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border border-gray-200">
                          知识点
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-4 border border-gray-200 align-top bg-emerald-50">
                          <span className="text-sm font-semibold text-emerald-700">
                            {selectedChapter?.name || '当前小节'}
                          </span>
                        </td>
                        <td className="px-4 py-4 border border-gray-200 align-top min-h-[120px]">
                          {selectedKnowledgePoints.length === 0 ? (
                            <span className="text-sm text-gray-400">
                              暂无知识点，请从左侧知识树中选择添加
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              {selectedKnowledgePoints.map((kp, index) => (
                                <span key={kp.id} className="inline-flex items-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                    {kp.name}
                                    <button
                                      onClick={() => handleRemoveKnowledgePoint(kp.id)}
                                      className="w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-white flex items-center justify-center text-xs transition-colors"
                                      title="删除"
                                    >
                                      ×
                                    </button>
                                  </span>
                                  {index < selectedKnowledgePoints.length - 1 && (
                                    <span className="text-gray-500 mx-0.5">、</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* 提示信息 */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">操作说明：</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>从左侧知识树中选择知识点，点击【+】按钮添加</li>
                          <li>知识点按添加顺序显示，用顿号间隔</li>
                          <li>点击知识点右侧的【×】可删除</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowKnowledgePointSelector(false);
                  setSelectedKnowledgePoints([]);
                  setKpSearchKeyword('');
                  setExpandedKnowledgePoints(new Set());
                  setAddingExtendedKpParentId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 保存知识点关联
                  if (selectedChapter) {
                    // 记录知识点变更
                    const oldKpIds = new Set((selectedChapter.knowledgePoints || []).map(kp => kp.id));
                    const newKpIds = new Set(selectedKnowledgePoints.map(kp => kp.id));
                    
                    // 新增的知识点
                    selectedKnowledgePoints.forEach(kp => {
                      if (!oldKpIds.has(kp.id)) {
                        addEditChange(`添加知识点：${kp.name}`);
                      }
                    });
                    
                    // 删除的知识点
                    (selectedChapter.knowledgePoints || []).forEach(kp => {
                      if (!newKpIds.has(kp.id)) {
                        addEditChange(`移除知识点：${kp.name}`);
                      }
                    });
                    
                    const updateKnowledgePoints = (chapters: Chapter[]): Chapter[] => {
                      return chapters.map(chapter => {
                        if (chapter.id === selectedChapter.id) {
                          return { ...chapter, knowledgePoints: selectedKnowledgePoints };
                        }
                        if (chapter.children) {
                          return { ...chapter, children: updateKnowledgePoints(chapter.children) };
                        }
                        return chapter;
                      });
                    };
                    const updatedChapters = updateKnowledgePoints(chapters);
                    setChapters(updatedChapters);
                    
                    // 初始化详情页面知识点展开状态
                    const newExpandedSet = new Set<string>();
                    selectedKnowledgePoints.forEach(kp => {
                      newExpandedSet.add(kp.id);
                    });
                    setExpandedChapterKps(newExpandedSet);
                  }
                  setShowKnowledgePointSelector(false);
                  setExpandedKnowledgePoints(new Set());
                  setAddingExtendedKpParentId(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 同步课程选择弹窗 */}
      {showCourseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] h-[70vh] overflow-visible flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">从资源库选择<PrdTooltip data={prd207.courseSelectorDialogTitle} className="ml-1" /></h3>
              <button
                onClick={() => {
                  setShowCourseSelector(false);
                  setTempSelectedCourses([]);
                  setCourseSearchKeyword('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* 左右布局 */}
            <div className="flex flex-1 min-h-0">
              {/* 左侧 - 可选课程 */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">可选视频<PrdTooltip data={prd207.courseSelectorAvailableList} className="ml-1" /></div>
                </div>
                {/* 搜索框 */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">

                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索视频名称..."
                      value={courseSearchKeyword}
                      onChange={(e) => setCourseSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <PrdTooltip data={prd207.courseSelectorSearch} className="flex-shrink-0" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="flex justify-end"><PrdTooltip data={prd207.courseSelectorAvailableCard} /></div>
                  {availableCourses
                    .filter(
                      (course) =>
                        !selectedChapter?.courses?.find((c) => c.id === course.id) &&
                        !tempSelectedCourses.find((c) => c.id === course.id) &&
                        course.name.toLowerCase().includes(courseSearchKeyword.toLowerCase())
                    )
                    .map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Video className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{course.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span>{course.duration}</span>
                              {course.teacher && <span>{course.teacher}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setPreviewingCourse(course)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="预览"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTempSelectedCourses([...tempSelectedCourses, course])}
                            className="px-2.5 py-1 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            + 添加
                          </button>
                        </div>
                      </div>
                    ))}
                  {availableCourses.filter(
                    (course) =>
                      !selectedChapter?.courses?.find((c) => c.id === course.id) &&
                      !tempSelectedCourses.find((c) => c.id === course.id) &&
                      course.name.toLowerCase().includes(courseSearchKeyword.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {courseSearchKeyword ? '未找到匹配的视频' : '所有视频已添加'}
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧 - 已选视频 */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-blue-50">
                  <div className="text-sm font-medium text-blue-700">
                    已选视频
                    <span className="ml-2 text-xs text-blue-500 font-normal">
                      ({tempSelectedCourses.length}个)
                    </span>
                    <PrdTooltip data={prd207.courseSelectorSelectedList} className="ml-1" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {tempSelectedCourses.length > 0 ? (
                    <div className="space-y-2">
                      {tempSelectedCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Video className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{course.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                <span>{course.duration}</span>
                                {course.teacher && (
                                  <span className="flex items-center gap-0.5">
                                    <User className="w-3 h-3" />
                                    {course.teacher}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setPreviewingCourse(course)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="预览"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTempSelectedCourses(tempSelectedCourses.filter(c => c.id !== course.id))}
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

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCourseSelector(false);
                  setTempSelectedCourses([]);
                  setCourseSearchKeyword('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedChapterId && tempSelectedCourses.length > 0) {
                    // 使用函数式更新确保获取最新状态
                    setChapters(prevChapters => {
                      const chapterId = selectedChapterId;
                      
                      const update = (chapters: Chapter[]): Chapter[] => {
                        return chapters.map(chapter => {
                          if (chapter.id === chapterId) {
                            const existingCourses = chapter.courses || [];
                            return { ...chapter, courses: [...existingCourses, ...tempSelectedCourses] };
                          }
                          if (chapter.children) {
                            return { ...chapter, children: update(chapter.children) };
                          }
                          return chapter;
                        });
                      };
                      
                      const newChapters = update(prevChapters);
                      
                      // 记录添加的课程
                      tempSelectedCourses.forEach(course => {
                        addEditChange(`添加课程：${course.name}`);
                      });
                      
                      // selectedChapter 会通过 useMemo 自动从更新后的 chapters 中计算
                      
                      return newChapters;
                    });
                  }
                  setShowCourseSelector(false);
                  setTempSelectedCourses([]);
                  setCourseSearchKeyword('');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                确定
              </button>
              <PrdTooltip data={prd207.courseSelectorActions} className="ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* 上传课程弹窗 */}
      {showUploadCourseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col">
            {/* 弹窗头部 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                上传课程
                <PrdTooltip data={prd206.uploadCourseDialogTitle} className="ml-1" />
              </h3>
              {!isUploadingCourse && (
                <button
                  onClick={() => {
                    setShowUploadCourseDialog(false);
                    setUploadFiles([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 上传区域 - 无文件时显示 */}
              {uploadFiles.length === 0 && (
                <div
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/mp4,video/avi,video/mov,video/mkv,video/wmv,video/flv';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        handleFileSelect(files);
                      }
                    };
                    input.click();
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 py-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">点击选择文件</span>
                  </p>
                  <p className="text-xs text-gray-400">支持 MP4、AVI、MOV、MKV、WMV、FLV 格式</p>
                  <p className="text-xs text-gray-400 mt-0.5">单个文件不超过 2GB</p>
                  <div className="flex items-center gap-2 mt-2">
                    <PrdTooltip data={prd206.uploadCourseDropZone} />
                    <PrdTooltip data={prd206.uploadCourseWriteback} />
                  </div>
                </div>
              )}

              {/* 已选文件列表 / 上传进度列表 */}
              {uploadFiles.length > 0 && (
                <div>
                  {/* 上传中时显示添加更多文件按钮 */}
                  {!isUploadingCourse && (
                    <div className="mb-3">
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/mp4,video/avi,video/mov,video/mkv,video/wmv,video/flv';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files && files.length > 0) {
                              handleFileSelect(files);
                            }
                          };
                          input.click();
                        }}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        继续添加文件
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {uploadFiles.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        {/* 文件图标 */}
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <Video className="w-4 h-4 text-blue-600" />
                        </div>

                        {/* 文件信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-700 truncate">{item.name}</p>
                            <span className="text-xs text-gray-400 flex-shrink-0">{item.size}</span>
                          </div>
                          {/* 上传完成后显示教师信息 */}
                          {item.status === 'success' && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                              <User className="w-3 h-3" />
                              <span>张老师</span>
                            </div>
                          )}
                          {/* 上传进度条 */}
                          {item.status === 'uploading' && (
                            <div className="mt-1.5">
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 状态指示 */}
                        {item.status === 'success' && (
                          <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">上传完成</span>
                          </div>
                        )}
                        {item.status === 'failed' && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-500">上传失败</span>
                            <button
                              onClick={() => handleRetryUpload(item.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 ml-1 flex items-center gap-0.5"
                            >
                              <RefreshCw className="w-3 h-3" />
                              重试
                            </button>
                          </div>
                        )}
                        {item.status === 'uploading' && (
                          <span className="text-xs text-blue-500 flex-shrink-0">{item.progress}%</span>
                        )}

                        {/* 删除按钮 - 仅非上传中时显示 */}
                        {!isUploadingCourse && item.status !== 'uploading' && (
                          <button
                            onClick={() => {
                              setUploadFiles(prev => prev.filter(f => f.id !== item.id));
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <PrdTooltip data={prd206.uploadCourseFileList} />
                    <PrdTooltip data={prd206.uploadCourseWriteback} />
                  </div>
                </div>
              )}
            </div>

            {/* 弹窗底部操作按钮 */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <PrdTooltip data={prd206.uploadCourseProgress} className="mr-auto" />
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => {
                    if (!isUploadingCourse) {
                      setShowUploadCourseDialog(false);
                      setUploadFiles([]);
                    }
                  }}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    isUploadingCourse
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (!isUploadingCourse && uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'success')) {
                      handleConfirmUpload();
                    }
                  }}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    isUploadingCourse || uploadFiles.length === 0 || !uploadFiles.every(f => f.status === 'success')
                      ? 'bg-blue-300 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUploadingCourse ? '上传中...' : '确认上传'}
                </button>
              </div>
              <PrdTooltip data={prd206.uploadCourseActions} className="ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* 课程预览弹窗 */}
      {previewingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{previewingCourse.name}<PrdTooltip data={prd207.courseSelectorPreview} className="ml-1" /></h3>
              <button
                onClick={() => setPreviewingCourse(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{previewingCourse.name}</p>
                <p className="text-sm text-gray-400 mt-2">时长：{previewingCourse.duration}</p>
                <p className="text-xs text-gray-500 mt-4">视频预览区域</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <Clock className="w-4 h-4 inline-block mr-1" />
                {previewingCourse.duration}
              </div>
              <button
                onClick={() => setPreviewingCourse(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 练习试卷选择弹窗 */}
      {showExamSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] h-[70vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">从资源库选择<PrdTooltip data={prd209.examSelectorDialogTitle} className="ml-1" /></h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">确认规则</span>
                <PrdTooltip data={prd209.examSelectorConfirm} />
                <button
                onClick={() => {
                  setShowExamSelector(false);
                  setTempSelectedExams([]);
                  setExamSearchKeyword('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
              </div>
            </div>

            {/* 左右布局 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧 - 可选列表 */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                {/* 搜索框 */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索试卷名称..."
                      value={examSearchKeyword}
                      onChange={(e) => setExamSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    <PrdTooltip data={prd209.examSelectorExamSearch} className="absolute right-2 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                {/* 试卷列表 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="flex justify-end"><PrdTooltip data={prd209.examSelectorLibraryList} /></div>
                  {availableExams
                    .filter(
                      (exam) =>
                        !selectedChapter?.exams?.find((e) => e.id === exam.id) &&
                        !tempSelectedExams.find((e) => e.id === exam.id) &&
                        exam.name.toLowerCase().includes(examSearchKeyword.toLowerCase())
                    )
                    .map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span>{exam.questionCount}题</span>
                              <span>{exam.totalScore}分</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setPreviewExam(exam)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="预览试卷"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTempSelectedExams([...tempSelectedExams, exam])}
                            className="px-2.5 py-1 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            + 添加
                          </button>
                        </div>
                      </div>
                    ))}
                  {availableExams.filter(
                    (exam) =>
                      !selectedChapter?.exams?.find((e) => e.id === exam.id) &&
                      !tempSelectedExams.find((e) => e.id === exam.id) &&
                      exam.name.toLowerCase().includes(examSearchKeyword.toLowerCase())
                  ).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-400">{examSearchKeyword ? '暂无匹配数据' : '暂无数据'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧 - 已选试卷（习题册+试卷混合） */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-amber-50">
                  <div className="text-sm font-medium text-amber-700">
                    已选试卷
                    <span className="ml-2 text-xs text-amber-500 font-normal">
                      ({tempSelectedExams.length}项)
                    </span>
                    <PrdTooltip data={prd209.examSelectorSelectedList} className="ml-1" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  {tempSelectedExams.length > 0 ? (
                    <div className="space-y-2">
                      {/* 已选试卷（乐课网资源库） */}
                      {tempSelectedExams.map((exam) => (
                        <div
                          key={exam.id}
                          className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ClipboardList className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">资源库</span>
                                <span className="text-xs text-gray-500">{exam.questionCount}题</span>
                                <span className="text-xs text-gray-500">{exam.totalScore}分</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setPreviewExam(exam)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="预览试卷"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTempSelectedExams(tempSelectedExams.filter(e => e.id !== exam.id))}
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
                      <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm">暂未选择试卷</p>
                      <p className="text-xs mt-1">请从左侧列表中选择试卷</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 items-center">
              <button
                onClick={() => {
                  setShowExamSelector(false);
                  setTempSelectedExams([]);
                  setExamSearchKeyword('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedChapterId && tempSelectedExams.length > 0) {
                    // 检测重复试卷
                    const existingExamNames = new Set<string>();
                    const collectExistingExams = (chapters: Chapter[]) => {
                      for (const ch of chapters) {
                        if (ch.exams) {
                          ch.exams.forEach(e => existingExamNames.add(e.name));
                        }
                        if (ch.children) {
                          collectExistingExams(ch.children);
                        }
                      }
                    };
                    collectExistingExams(chapters);

                    // 收集所有待添加的试卷名称
                    const pendingExamNames = new Set<string>();
                    tempSelectedExams.forEach(e => pendingExamNames.add(e.name));

                    // 找出重复的试卷名称
                    const duplicates: string[] = [];
                    pendingExamNames.forEach(name => {
                      if (existingExamNames.has(name)) {
                        duplicates.push(name);
                      }
                    });

                    if (duplicates.length > 0) {
                      setDuplicateExamNames(duplicates);
                      setShowDuplicateExamDialog(true);
                    } else {
                      // 无重复，直接执行添加逻辑（默认跳过重复）
                      executeExamConfirm(true);
                    }
                  }
                }}
                disabled={tempSelectedExams.length === 0}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  tempSelectedExams.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 专题级 - 从习题册导入弹窗 */}
      {showWorkbookImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] h-[70vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">从习题册导入<PrdTooltip data={prd216.workbookImportDialogTitle} className="ml-1" /></h3>
              <button
                onClick={() => {
                  setShowWorkbookImportModal(false);
                  setTempSelectedWorkbooks([]);
                  setWorkbookSearchKeyword('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 左右布局 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧 - 习题册列表 */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                {/* 提示信息 */}
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-relaxed flex-1">
                    选择习题册，系统将自动匹配章节，把习题册章节下的试卷，添加到本专题章节的练习试卷中。<PrdTooltip data={prd216.workbookImportList} className="ml-0.5" />
                  </p>
                </div>
                {/* 搜索框 */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索习题册名称..."
                      value={workbookSearchKeyword}
                      onChange={(e) => setWorkbookSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <PrdTooltip data={prd216.workbookImportSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                {/* 习题册列表 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {availableWorkbooks
                    .filter(
                      (wb) =>
                        !tempSelectedWorkbooks.find((w) => w.name === wb.name) &&
                        !isWorkbookFullyAdded(wb) &&
                        wb.name.toLowerCase().includes(workbookSearchKeyword.toLowerCase())
                    )
                    .map((wb) => (
                      <div
                        key={wb.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{wb.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setPreviewingWorkbook(wb);
                              setExpandedWorkbookChapters(new Set([wb.chapters[0]?.id]));
                              const firstSection = wb.chapters[0]?.children?.[0] || null;
                              setSelectedWorkbookSection(firstSection);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="预览习题册"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTempSelectedWorkbooks([...tempSelectedWorkbooks, wb])}
                            className="px-2.5 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            + 添加<PrdTooltip data={prd216.workbookImportCard} className="ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {availableWorkbooks.filter(
                    (wb) =>
                      !tempSelectedWorkbooks.find((w) => w.name === wb.name) &&
                      !isWorkbookFullyAdded(wb) &&
                      wb.name.toLowerCase().includes(workbookSearchKeyword.toLowerCase())
                  ).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-400">{workbookSearchKeyword ? '暂无匹配数据' : '所有习题册已添加'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧 - 已选习题册 */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">已选习题册<PrdTooltip data={prd216.workbookImportSelectedList} className="ml-0.5" /></span>
                    <span className="text-xs text-gray-400">{tempSelectedWorkbooks.length}本</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {tempSelectedWorkbooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <BookOpen className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="text-sm text-gray-400">请从左侧选择习题册</p>
                    </div>
                  ) : (
                    tempSelectedWorkbooks.map((wb, index) => (
                      <div key={wb.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{wb.name}</p>
                            <p className="text-xs text-gray-500">{wb.chapters.length}章</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewingWorkbook(wb)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="预览习题册"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTempSelectedWorkbooks(tempSelectedWorkbooks.filter((_, i) => i !== index))}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="移除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 items-center">
              <button
                onClick={() => {
                  setShowWorkbookImportModal(false);
                  setTempSelectedWorkbooks([]);
                  setWorkbookSearchKeyword('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (tempSelectedWorkbooks.length > 0) {
                    // 检测重复试卷
                    const existingExamNames = new Set<string>();
                    const collectExistingExams = (chapters: Chapter[]) => {
                      for (const ch of chapters) {
                        if (ch.exams) {
                          ch.exams.forEach((e: Exam) => existingExamNames.add(e.name));
                        }
                        if (ch.children) {
                          collectExistingExams(ch.children);
                        }
                      }
                    };
                    collectExistingExams(chapters);

                    const pendingExamNames = new Set<string>();
                    for (const wb of tempSelectedWorkbooks) {
                      for (const ch of wb.chapters) {
                        if (ch.children) {
                          for (const sec of ch.children) {
                            sec.exams.forEach((e: Exam) => pendingExamNames.add(e.name));
                          }
                        }
                        if (ch.exams) {
                          ch.exams.forEach((e: Exam) => pendingExamNames.add(e.name));
                        }
                      }
                    }

                    const duplicates: string[] = [];
                    pendingExamNames.forEach(name => {
                      if (existingExamNames.has(name)) {
                        duplicates.push(name);
                      }
                    });

                    if (duplicates.length > 0) {
                      setDuplicateExamNames(duplicates);
                      setShowDuplicateExamDialog(true);
                    } else {
                      executeWorkbookImport(true);
                    }
                  }
                }}
                disabled={tempSelectedWorkbooks.length === 0}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  tempSelectedWorkbooks.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
确定<PrdTooltip data={prd216.workbookImportConfirm} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 专题级 - 批量删除确认弹窗 */}
      {showTextbookBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[420px] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">确认批量删除<PrdTooltip data={prd215.textbookBatchDeleteButton} className="ml-1" /></h3>
                  <p className="text-sm text-gray-500 mt-1">将删除当前专题下所有章节小节绑定的试卷信息</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                此操作将清空整本专题下所有章节的练习试卷，删除后不可恢复，确认删除吗？
              </p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowTextbookBatchDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 清空所有章节下的试卷
                  const clearAllExams = (chapterList: Chapter[]): Chapter[] => {
                    return chapterList.map(ch => ({
                      ...ch,
                      exams: [],
                      children: ch.children ? clearAllExams(ch.children) : undefined,
                    }));
                  };
                  setChapters(clearAllExams(chapters));
                  setShowTextbookBatchDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 试卷预览弹窗 */}
      {previewExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{previewExam.name}<PrdTooltip data={prd209.examPreviewDialog} className="ml-1" /></h3>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span>{previewExam.questionCount}题</span>
                    <span>{previewExam.totalScore}分</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewExam(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* 试卷预览内容 */}
              <div className="space-y-6">
                {/* 单选题 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">单选题</span>
                    <span className="text-xs text-gray-500">共 {Math.floor(previewExam.questionCount * 0.4)} 题</span>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-gray-700 flex-shrink-0">{i}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 mb-2">题目内容示例，这是一道关于数学基础知识的单选题，请选择正确答案。</p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center text-xs">A</span>
                                <span>选项 A</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center text-xs">B</span>
                                <span>选项 B</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center text-xs">C</span>
                                <span>选项 C</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center text-xs">D</span>
                                <span>选项 D</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 填空题 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">填空题</span>
                    <span className="text-xs text-gray-500">共 {Math.floor(previewExam.questionCount * 0.3)} 题</span>
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-gray-700 flex-shrink-0">{i}.</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">
                              填空题示例，请在横线处填写正确答案：__________。
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 解答题 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">解答题</span>
                    <span className="text-xs text-gray-500">共 {Math.ceil(previewExam.questionCount * 0.3)} 题</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700 flex-shrink-0">1.</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            解答题示例：请根据题目要求，写出详细的解题过程和答案。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewExam(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 习题册预览弹窗 */}
      {previewingWorkbook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-[750px] max-h-[80vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">预览 - {previewingWorkbook.name}<PrdTooltip data={prd216.workbookImportPreviewDialog} className="ml-1" /></h3>
                  <p className="text-xs text-gray-500 mt-0.5">共 {previewingWorkbook.chapters.length} 章</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewingWorkbook(null);
                  setSelectedWorkbookSection(null);
                  setExpandedWorkbookChapters(new Set());
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 左右双栏：章节树 + 试卷列表 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧 - 章节树 */}
              <div className="w-2/5 border-r border-gray-200 flex flex-col">
                <div className="flex-1 overflow-y-auto p-2 pt-3">
                  {previewingWorkbook.chapters.map((ch) => {
                    const isExpanded = expandedWorkbookChapters.has(ch.id);
                    const sectionCount = ch.children?.length || 0;
                    return (
                      <div key={ch.id} className="mb-0.5">
                        {/* 章级 - 可折叠 */}
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedWorkbookChapters);
                            if (isExpanded) {
                              newExpanded.delete(ch.id);
                            } else {
                              newExpanded.add(ch.id);
                            }
                            setExpandedWorkbookChapters(newExpanded);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                            isExpanded ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                          )}
                          <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                          <span className="font-medium truncate">{ch.name}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">有{sectionCount}小节</span>
                        </button>
                        {/* 小节列表 */}
                        {isExpanded && ch.children?.map((sec) => (
                          <button
                            key={sec.id}
                            onClick={() => setSelectedWorkbookSection(sec)}
                            className={`w-full text-left pl-9 pr-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                              selectedWorkbookSection?.id === sec.id
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <FileText className="w-3 h-3 flex-shrink-0 opacity-50" />
                            <span className="truncate">{sec.name}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 右侧 - 试卷列表 */}
              <div className="w-3/5 flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 pt-3 space-y-2">
                  {selectedWorkbookSection && selectedWorkbookSection.exams.length > 0 ? (
                    selectedWorkbookSection.exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span>{exam.questionCount}题</span>
                              <span>{exam.totalScore}分</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(`/exam-preview/${exam.id}`, '_blank')}
                          className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          预览
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      {selectedWorkbookSection ? '该小节暂无试卷' : '请从左侧选择小节查看试卷'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部关闭按钮 */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setPreviewingWorkbook(null);
                  setSelectedWorkbookSection(null);
                  setExpandedWorkbookChapters(new Set());
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除试卷弹窗 */}
      {showBatchDeleteExamDialog && selectedChapterId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            {/* 弹窗头部 */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">批量删除练习试卷<PrdTooltip data={prd209.batchDeleteExamDialog} className="ml-1" /></h3>
            </div>

            {/* 提示信息 */}
            <div className="p-5">
              <p className="text-sm text-gray-600">确认删除当前小节下的所有练习试卷？此操作不可撤销。</p>
            </div>

            {/* 操作按钮 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBatchDeleteExamDialog(false);
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 仅删除当前小节的试卷
                  setChapters(prevChapters => {
                    const update = (chapters: Chapter[]): Chapter[] => {
                      return chapters.map(chapter => {
                        if (chapter.id === selectedChapterId) {
                          return { ...chapter, exams: [] };
                        }
                        if (chapter.children) {
                          return { ...chapter, children: update(chapter.children) };
                        }
                        return chapter;
                      });
                    };
                    return update(prevChapters);
                  });
                  setShowBatchDeleteExamDialog(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重复试卷检测确认弹窗 */}
      {showDuplicateExamDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-visible">
            {/* 弹窗头部 */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">重复试卷提示<PrdTooltip data={prd216.workbookImportDuplicateDialog} className="ml-1" /></h3>
            </div>

            {/* 内容区域 */}
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-3">已选练习册中的部分试卷已经在对应章节的练习试卷模块处，请选择添加方式</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 mb-4">
                {duplicateExamNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded px-3 py-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
              {/* 选项 */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="duplicateMode"
                    checked={duplicateExamMode === 'skip'}
                    onChange={() => setDuplicateExamMode('skip')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">重复试卷不添加</span>
                    <p className="text-xs text-gray-500 mt-0.5">仅添加不重复的试卷，跳过已存在的试卷</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="duplicateMode"
                    checked={duplicateExamMode === 'all'}
                    onChange={() => setDuplicateExamMode('all')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-red-600">全部添加</span>
                    <p className="text-xs text-gray-500 mt-0.5">包含重复试卷一并添加</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDuplicateExamDialog(false);
                  setDuplicateExamNames([]);
                  setDuplicateExamMode('skip');
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (duplicateExamMode === 'skip') {
                    executeExamConfirm(true); // skipDuplicates=true
                  } else {
                    executeExamConfirm(false); // skipDuplicates=false
                  }
                }}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  duplicateExamMode === 'all'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 末级节点添加小节确认弹窗 */}
      {showLeafNodeConfirm && pendingLeafNodeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[480px] overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">确认添加子章节</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">
                当前小节 <span className="font-medium text-gray-900">{chapters.find(c => c.children?.some(child => child.id === pendingLeafNodeId))?.children?.find(child => child.id === pendingLeafNodeId)?.name || '该小节'}</span> 是末级小节。
              </p>
              <p className="text-sm text-gray-600">
                若继续添加新的子章节，当前小节将变为非末级小节。
              </p>
              {pendingSiblingSubsections.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-amber-800 font-medium">注意：同级已有子小节</p>
                      <p className="text-amber-700 mt-1">
                        同级的 {pendingSiblingSubsections.join('、')} 已维护子小节，建议优先在同级其他小节添加子小节以保持结构一致性。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {pendingLeafNodeData && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    警告：以下数据将被删除
                  </p>
                  <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                    {pendingLeafNodeData.knowledgePoints && pendingLeafNodeData.knowledgePoints.length > 0 && (
                      <li>已维护的 {pendingLeafNodeData.knowledgePoints.length} 个知识点</li>
                    )}
                    {pendingLeafNodeData.courses && pendingLeafNodeData.courses.length > 0 && (
                      <li>已维护的 {pendingLeafNodeData.courses.length} 个同步课程</li>
                    )}
                    {pendingLeafNodeData.exams && pendingLeafNodeData.exams.length > 0 && (
                      <li>已维护的 {pendingLeafNodeData.exams.length} 个练习试卷</li>
                    )}
                    {!pendingLeafNodeData.knowledgePoints?.length && !pendingLeafNodeData.courses?.length && !pendingLeafNodeData.exams?.length && (
                      <li>无直接维护数据（可安全添加）</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLeafNodeConfirm(false);
                  setPendingLeafNodeId(null);
                  setPendingLeafNodeData(null);
                  setPendingSiblingSubsections([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (pendingLeafNodeId) {
                    // 先记录删除变更
                    if (pendingLeafNodeData) {
                      if (pendingLeafNodeData.knowledgePoints) {
                        pendingLeafNodeData.knowledgePoints.forEach(kp => {
                          addEditChange(`删除知识点：${kp.name}`);
                        });
                      }
                      if (pendingLeafNodeData.courses) {
                        pendingLeafNodeData.courses.forEach(course => {
                          addEditChange(`删除同步课程：${course.name}`);
                        });
                      }
                      if (pendingLeafNodeData.exams) {
                        pendingLeafNodeData.exams.forEach(exam => {
                          addEditChange(`删除练习试卷：${exam.name}`);
                        });
                      }
                    }
                    // 清除末级节点的数据
                    const clearLeafNodeData = (chaptersList: Chapter[]): Chapter[] => {
                      return chaptersList.map(chapter => {
                        if (chapter.id === pendingLeafNodeId) {
                          return {
                            ...chapter,
                            knowledgePoints: [],
                            courses: [],
                            exams: []
                          };
                        }
                        if (chapter.children) {
                          return { ...chapter, children: clearLeafNodeData(chapter.children) };
                        }
                        return chapter;
                      });
                    };
                    const clearedChapters = clearLeafNodeData(chapters);
                    setChapters(clearedChapters);
                    // 进入添加流程
                    setAddingChapterParentId(pendingLeafNodeId);
                    setChapterInputValue('');
                  }
                  setShowLeafNodeConfirm(false);
                  setPendingLeafNodeId(null);
                  setPendingLeafNodeData(null);
                  setPendingSiblingSubsections([]);
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                确认删除并添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">确认删除</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                确定要删除该章节吗？{deletingChapterId && chapters.find(c => c.children?.some(child => child.id === deletingChapterId)) && (
                  <span className="text-red-500">删除后其子章节也会一并删除。</span>
                )}
              </p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingChapterId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (deletingChapterId) {
                    handleDeleteChapter(deletingChapterId);
                  }
                  setShowDeleteConfirm(false);
                  setDeletingChapterId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入专题弹窗 - 上传态 */}
      {showImportDialog && (importValidationStatus === 'idle') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">导入专题</h3>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium mb-1">导入说明</p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>请先下载模板文件，按照模板格式填写专题章节数据</li>
                      <li>章节名称为必填项，一级小节、二级小节根据实际情况填写</li>
                      <li>知识点名称如有多个，用顿号（、）间隔</li>
                      <li>知识点名称需在知识树模块中已维护</li>
                    </ul>
                  </div>
                  <button
                    onClick={handleDownloadTextbookTemplate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    下载模板
                  </button>
                </div>
              </div>

              {/* 上传区域 */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer border-gray-300 hover:border-emerald-500"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      performTextbookValidation(file);
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

      {/* 导入专题弹窗 - 校验结果态 */}
      {showImportDialog && (importValidationStatus !== 'idle') && (
        <TextbookImportValidationModal
          isOpen={true}
          onClose={resetImportState}
          status={importValidationStatus}
          summary={importValidationSummary || undefined}
          fileErrors={importFileErrors}
          rowResults={importRowResults}
          importSuccessCount={importValidationStatus === 'import-success' ? (importValidationSummary?.passRows ?? importValidationSummary?.totalRows ?? 0) : 0}
          onReUpload={handleTextbookReUpload}
          onDownloadTemplate={handleDownloadTextbookTemplate}
          onDownloadErrorDetail={handleDownloadTextbookErrorDetail}
          onImportPassedRows={() => {
            // 执行仅导入通过项
            setImportValidationStatus('importing');
            // 模拟导入执行
            setTimeout(() => {
              setImportValidationStatus('import-success');
              setHasUnpublishedChanges(true);
              addEditChange('导入专题知识点信息');
            }, 1500);
          }}
          onStartImport={() => {
            // 执行全量导入
            setImportValidationStatus('importing');
            // 模拟导入执行
            setTimeout(() => {
              setImportValidationStatus('import-success');
              setHasUnpublishedChanges(true);
              addEditChange('导入专题知识点信息');
            }, 1500);
          }}
        />
      )}

      {/* 编辑树结构确认弹窗 */}
      {showEditTreeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl w-[480px] overflow-hidden">
            <div className="p-6">
              {/* 标题 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑知识树结构</h3>
              
              {/* 说明文案 */}
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p>编辑知识树结构（新增、删除、改名、移动节点），不同的下游业务生效时机不同：</p>
                
                {/* 实时生效 */}
                <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                  <span className="text-green-600 font-medium shrink-0">✅ 实时生效：</span>
                  <span>全乐课网平台仅涉及知识树展示、不涉及版本号的下游业务</span>
                </div>
                
                {/* 发布后生效 */}
                <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                  <span className="text-amber-600 font-medium shrink-0">⏳ 发布后生效：</span>
                  <span>涉及版本号的下游业务（自适应学习系统）</span>
                </div>
              </div>
              
              {/* 按钮区域 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditTreeConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 进入编辑态前，保存初始快照
                    const snapshot = JSON.parse(JSON.stringify(chapters));
                    setInitialChaptersSnapshot(snapshot);
                    setIsEditing(true);
                    setIsEditingTree(true);
                    setIsEditingDetail(false); // 确保右侧不是编辑态
                    setShowEditTreeConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  确认编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除专题确认弹窗 */}
      {showDeleteTextbookDialog && selectedTextbook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">确认删除</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                确定要删除专题 <span className="font-medium text-gray-900">「{selectedTextbook.name}」</span> 吗？
              </p>
              <p className="text-xs text-red-500 mt-2">删除后不可恢复，相关章节和数据将被清空。</p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteTextbookDialog(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 执行删除操作
                  const index = textbooks.findIndex(t => t.id === selectedTextbook.id);
                  if (index !== -1) {
                    const newTextbooks = [...textbooks];
                    newTextbooks.splice(index, 1);
                    setTextbooks(newTextbooks);
                  }
                  setShowDeleteTextbookDialog(false);
                  setSelectedTextbook(null);
                  setSelectedChapterId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteTreeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">无法删除</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                当前章节树下存在树节点，请先删除所有树节点后再删除整颗章节树。
              </p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDeleteTreeDialog(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发布弹窗 */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        currentVersion={textbookPublishStates[selectedTextbook?.id || '']?.currentVersion || 'v1.0'}
        pendingChanges={
          hasUnpublishedChanges && editChanges.length > 0 
            ? editChanges 
            : (textbookPublishStates[selectedTextbook?.id || '']?.changedItems || ['内容已修改'])
        }
        scheduledPublish={textbookPublishStates[selectedTextbook?.id || '']?.scheduledPublish}
      />

      {/* 历史版本弹窗 */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={textbookPublishStates[selectedTextbook?.id || '']?.publishHistory || []}
        currentVersion={textbookPublishStates[selectedTextbook?.id || '']?.currentVersion || 'v1.0'}
        currentTextbook={selectedTextbook ? {
          phase: selectedTextbook.phase,
          subject: selectedTextbook.subject,
          grade: selectedTextbook.grade,
          publisher: selectedTextbook.publisher,
        } : undefined}
        filterConfig={{
          phaseOptions: [
            { id: 'senior', label: '高中' },
            { id: 'junior', label: '初中' },
            { id: 'primary', label: '小学' },
          ],
          subjectOptions: subjects.map(s => ({ id: s.id, label: s.name })),
          publisherOptions: scenes.map(p => ({ id: p.id, label: p.name })),
        }}
      />

      {/* 聚合历史版本弹窗 */}
      <AggregateHistoryModal
        isOpen={showAggregateHistory}
        onClose={() => setShowAggregateHistory(false)}
        title="历史发布记录"
        data={useMemo(() => {
          const items: AggregateHistoryItem[] = [];
          
          Object.entries(mockTextbookPublishState).forEach(([textbookId, state]) => {
            const textbook = textbooks.find(t => t.id === textbookId);
            if (!textbook) return;
            
            state.publishHistory.forEach((record, index) => {
              items.push({
                id: `${textbookId}-${record.version}-${index}`,
                moduleName: textbook.name,
                moduleTags: [textbook.phase, textbook.subject, textbook.grade, textbook.scene || textbook.publisher],
                modulePath: `/system-settings/textbook-tree?id=${textbookId}`,
                version: record.version,
                description: record.description,
                publishTime: record.publishTime,
                publisher: record.publisher,
                publisherAccount: record.publisherAccount || '-',
              });
            });
          });
          
          return items;
        }, [textbooks])}
        filterConfig={{
          showPhaseFilter: true,
          showGradeFilter: true,
          showSubjectFilter: true,
          showPublisherFilter: true,
          phaseOptions: [
            { id: 'senior', label: '高中' },
            { id: 'junior', label: '初中' },
            { id: 'primary', label: '小学' },
          ],
          gradeOptions: [
            { id: '高一', label: '高一' },
            { id: '高二', label: '高二' },
            { id: '高三', label: '高三' },
            { id: '七年级', label: '七年级' },
            { id: '八年级', label: '八年级' },
            { id: '九年级', label: '九年级' },
            { id: '一年级', label: '一年级' },
            { id: '二年级', label: '二年级' },
            { id: '三年级', label: '三年级' },
            { id: '四年级', label: '四年级' },
            { id: '五年级', label: '五年级' },
            { id: '六年级', label: '六年级' },
          ],
          subjectOptions: subjects.map(s => ({ id: s.id, label: s.name })),
          publisherOptions: scenes.map(p => ({ id: p.id, label: p.name })),
        }}
      />

      {/* 文档标注组件 */}
      <DocPanel currentPath="/system-settings/textbook-tree" />

    </div>
  );
}
