/**
 * 专题体系知识树 - 首页 + 详情页
 * 样式和组件结构完全复用教材体系知识树（TextbookTree.tsx）
 * 差异点：
 * 1. 筛选栏：学段/年级/学科/场景（教材体系为学段/学科/教材版本）
 * 2. 分类板块：寒暑假复习/中考/高考（教材体系为教材版本）
 * 3. 封面信息：年级|学科、专题|知识点（教材体系为学段|学科|教材版本、章节|知识点）
 * 4. 树目录术语：专题/子专题（教材体系为章/小节）
 * 5. 课程Tab：复习课（教材体系为同步课程）
 */

'use client';

import React, { useState, useEffect } from 'react';
import AggregateHistoryModal, { AggregateHistoryItem, FilterConfig } from '@/components/shared/AggregateHistoryModal';
import KnowledgeSelectorTree, { getBatchChildIds } from '@/components/shared/KnowledgeSelectorTree';
import PrdTooltip from '@/components/shared/PrdTooltip';
import {
  BookOpen, BookMarked, FileText, Plus, ArrowLeft, History,
  Search, X, Clock, ChevronRight, ChevronDown, Star, Circle,
  Video, Eye, Trash2, Upload, Download, Edit3, Edit2, Save, Play, User,
  ListTree, ClipboardList, AlertTriangle, Check, Info,
  Calendar, Timer, GitBranch, Hash, Layers, Tag, Users,
  Bell, Settings, HelpCircle, MoreVertical, Copy, RefreshCw,
  FolderOpen, Folder, File, ZoomIn, ZoomOut, Maximize2,
  Minimize2, ArrowRight, ArrowUpRight, ExternalLink, Link2,
  MessageSquare, Zap, Target, Award, Bookmark, BookCopy,
  GraduationCap, School, PenTool, Sparkles, GripVertical,
  Inbox, PlayCircle, Library
} from 'lucide-react';

// ==================== 类型定义 ====================

type PhaseType = 'senior' | 'junior' | 'primary';
type SceneType = 'winter-summer' | 'zhongkao' | 'gaokao';

interface TopicCard {
  id: string;
  name: string;
  phase: string;
  grade: string;
  subject: string;
  scene: SceneType;
  currentVersion: string;
  publishStatus: 'published' | 'pending';
  pendingChanges?: number;
  topicCount: number;
  knowledgePointCount: number;
  lastModified: string;
}

interface PublishRecord {
  id: string;
  topicName: string;
  version: string;
  phase: string;
  grade: string;
  subject: string;
  scene: string;
  publishTime: string;
  description: string;
  publisherName: string;
  publisherAccount: string;
}

interface TopicSection {
  id: string;
  name: string;
  children?: TopicSection[];
  knowledgePoints?: KnowledgePoint[];
  courses?: CourseItem[];
  exams?: ExamItem[];
  expanded?: boolean;
}

interface KnowledgePoint {
  id: string;
  name: string;
  extendedPoints?: string[];
}

interface CourseItem {
  id: string;
  name: string;
  teacher?: string;
  duration: string;
  videoUrl?: string;
  sourceType?: 'upload' | 'library';
  videoSize?: string;
}

interface ExamItem {
  id: string;
  name: string;
  questionCount: number;
  totalScore: number;
  source?: 'resource' | 'workbook';
  sourceType?: 'upload' | 'library' | 'workbook';
}

// ==================== 配置数据 ====================

const phaseConfig: Record<PhaseType, { label: string; color: string }> = {
  senior: { label: '高中', color: 'bg-purple-500' },
  junior: { label: '初中', color: 'bg-emerald-500' },
  primary: { label: '小学', color: 'bg-blue-500' },
};

const sceneConfig: Record<SceneType, { label: string; icon: React.ReactNode }> = {
  'winter-summer': { label: '寒暑假复习', icon: <span className="text-lg">☀️</span> },
  'zhongkao': { label: '中考', icon: <span className="text-lg">🎯</span> },
  'gaokao': { label: '高考', icon: <span className="text-lg">🏆</span> },
};

const gradeConfig: Record<string, { id: string; name: string }[]> = {
  senior: [
    { id: 'g1', name: '高一' },
    { id: 'g2', name: '高二' },
    { id: 'g3', name: '高三' },
  ],
  junior: [
    { id: 'c1', name: '初一' },
    { id: 'c2', name: '初二' },
    { id: 'c3', name: '初三' },
  ],
  primary: [
    { id: 'p1', name: '一年级' },
    { id: 'p2', name: '二年级' },
    { id: 'p3', name: '三年级' },
    { id: 'p4', name: '四年级' },
    { id: 'p5', name: '五年级' },
    { id: 'p6', name: '六年级' },
  ],
};

const subjectOptions = [
  { id: 'all', name: '全部学科' },
  { id: 'math', name: '数学' },
  { id: 'chinese', name: '语文' },
  { id: 'english', name: '英语' },
  { id: 'physics', name: '物理' },
  { id: 'chemistry', name: '化学' },
  { id: 'biology', name: '生物' },
  { id: 'politics', name: '政治' },
  { id: 'history', name: '历史' },
  { id: 'geography', name: '地理' },
];

// ==================== Mock 数据 ====================

const mockTopicCards: TopicCard[] = [
  {
    id: 'topic-1',
    name: '高一数学寒假函数专项突破',
    phase: '高中',
    grade: '高一',
    subject: '数学',
    scene: 'winter-summer',
    currentVersion: 'v1.0',
    publishStatus: 'published',
    topicCount: 3,
    knowledgePointCount: 15,
    lastModified: '2024-01-15',
  },
  {
    id: 'topic-2',
    name: '高二数学寒假几何强化训练',
    phase: '高中',
    grade: '高二',
    subject: '数学',
    scene: 'winter-summer',
    currentVersion: 'v1.1',
    publishStatus: 'pending',
    pendingChanges: 3,
    topicCount: 2,
    knowledgePointCount: 12,
    lastModified: '2024-01-18',
  },
  {
    id: 'topic-3',
    name: '初三数学寒假代数总复习',
    phase: '初中',
    grade: '初三',
    subject: '数学',
    scene: 'winter-summer',
    currentVersion: 'v2.0',
    publishStatus: 'published',
    topicCount: 5,
    knowledgePointCount: 20,
    lastModified: '2024-01-20',
  },
  {
    id: 'topic-4',
    name: '高一数学中考一轮复习',
    phase: '高中',
    grade: '高一',
    subject: '数学',
    scene: 'zhongkao',
    currentVersion: 'v1.0',
    publishStatus: 'published',
    topicCount: 4,
    knowledgePointCount: 18,
    lastModified: '2024-02-01',
  },
  {
    id: 'topic-5',
    name: '初三数学中考二轮复习',
    phase: '初中',
    grade: '初三',
    subject: '数学',
    scene: 'zhongkao',
    currentVersion: 'v1.2',
    publishStatus: 'pending',
    pendingChanges: 5,
    topicCount: 6,
    knowledgePointCount: 25,
    lastModified: '2024-02-10',
  },
  {
    id: 'topic-6',
    name: '初三英语中考专项突破',
    phase: '初中',
    grade: '初三',
    subject: '英语',
    scene: 'zhongkao',
    currentVersion: 'v1.0',
    publishStatus: 'published',
    topicCount: 4,
    knowledgePointCount: 16,
    lastModified: '2024-02-15',
  },
  {
    id: 'topic-7',
    name: '高三数学高考一轮复习',
    phase: '高中',
    grade: '高三',
    subject: '数学',
    scene: 'gaokao',
    currentVersion: 'v2.0',
    publishStatus: 'published',
    topicCount: 8,
    knowledgePointCount: 35,
    lastModified: '2024-03-01',
  },
  {
    id: 'topic-8',
    name: '高三数学高考二轮复习',
    phase: '高中',
    grade: '高三',
    subject: '数学',
    scene: 'gaokao',
    currentVersion: 'v1.0',
    publishStatus: 'pending',
    pendingChanges: 2,
    topicCount: 5,
    knowledgePointCount: 22,
    lastModified: '2024-03-10',
  },
  {
    id: 'topic-9',
    name: '高三物理高考专项训练',
    phase: '高中',
    grade: '高三',
    subject: '物理',
    scene: 'gaokao',
    currentVersion: 'v1.0',
    publishStatus: 'published',
    topicCount: 4,
    knowledgePointCount: 18,
    lastModified: '2024-03-15',
  },
];

const mockPublishHistory: PublishRecord[] = [
  {
    id: 'ph-1',
    topicName: '高一数学寒假函数专项突破',
    version: 'v1.0',
    phase: '高中',
    grade: '高一',
    subject: '数学',
    scene: '寒暑假复习',
    publishTime: '2024-01-15 10:30:00',
    description: '初始发布',
    publisherName: '张老师',
    publisherAccount: 'zhang_teacher',
  },
  {
    id: 'ph-2',
    topicName: '初三数学中考二轮复习',
    version: 'v1.1',
    phase: '初中',
    grade: '初三',
    subject: '数学',
    scene: '中考',
    publishTime: '2024-02-10 14:20:00',
    description: '新增3个知识点，更新2份试卷',
    publisherName: '李老师',
    publisherAccount: 'li_teacher',
  },
  {
    id: 'ph-3',
    topicName: '高三数学高考一轮复习',
    version: 'v2.0',
    phase: '高中',
    grade: '高三',
    subject: '数学',
    scene: '高考',
    publishTime: '2024-03-01 09:00:00',
    description: '大规模更新，新增一轮复习专题',
    publisherName: '王老师',
    publisherAccount: 'wang_teacher',
  },
];

// 详情页 mock 数据
const mockTopicSections: TopicSection[] = [
  {
    id: 'ts-1',
    name: '函数专题',
    expanded: true,
    knowledgePoints: [], // 非末级节点，知识点在子节点维护，此处为空
    courses: [],
    exams: [],
    children: [
      {
        id: 'ts-1-1',
        name: '二次函数',
        knowledgePoints: [
          { id: 'kp-3', name: '二次函数的图像', extendedPoints: ['开口方向', '对称轴', '顶点坐标'] },
          { id: 'kp-4', name: '二次函数的应用' },
        ],
        courses: [
          { id: 'c-2', name: '二次函数图像与性质', teacher: '李老师', duration: '40分钟', sourceType: 'library', videoSize: '256MB' },
        ],
        exams: [
          { id: 'e-2', name: '二次函数专项练习', questionCount: 12, totalScore: 80, source: 'workbook', sourceType: 'workbook' },
        ],
      },
      {
        id: 'ts-1-2',
        name: '指数函数与对数函数',
        knowledgePoints: [
          { id: 'kp-5', name: '指数函数' },
          { id: 'kp-6', name: '对数函数' },
        ],
        courses: [],
        exams: [],
      },
    ],
  },
  {
    id: 'ts-2',
    name: '几何专题',
    expanded: false,
    knowledgePoints: [], // 非末级节点，知识点在子节点维护，此处为空
    courses: [],
    exams: [],
    children: [
      {
        id: 'ts-2-1',
        name: '立体几何',
        knowledgePoints: [
          { id: 'kp-8', name: '点线面位置关系' },
        ],
        courses: [],
        exams: [],
      },
    ],
  },
];

// ==================== 发布弹窗组件 ====================

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
  } | null;
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

// ==================== 主组件 ====================

interface TopicSystemProps {
  onDetailViewChange?: (isDetail: boolean) => void;
}

// ==================== Mock 资源库数据 ====================
const mockResourceCourses: CourseItem[] = [
  { id: 'rc-1', name: '二次函数图像与性质精讲', duration: '45:00', teacher: '张老师', sourceType: 'library' },
  { id: 'rc-2', name: '二次函数应用专题', duration: '38:00', teacher: '李老师', sourceType: 'library' },
  { id: 'rc-3', name: '函数综合复习课', duration: '52:00', teacher: '王老师', sourceType: 'library' },
  { id: 'rc-4', name: '指数函数与对数函数', duration: '40:00', teacher: '赵老师', sourceType: 'library' },
  { id: 'rc-5', name: '函数思想方法总结', duration: '35:00', teacher: '陈老师', sourceType: 'library' },
];

const mockResourceExams: ExamItem[] = [
  { id: 're-1', name: '二次函数单元测试卷', questionCount: 18, totalScore: 100, source: 'resource' },
  { id: 're-2', name: '函数综合测试卷', questionCount: 22, totalScore: 120, source: 'resource' },
  { id: 're-3', name: '九年级数学期中试卷', questionCount: 25, totalScore: 150, source: 'resource' },
  { id: 're-4', name: '二次函数专项训练', questionCount: 15, totalScore: 80, source: 'resource' },
  { id: 're-5', name: '函数应用专项练习', questionCount: 20, totalScore: 100, source: 'resource' },
];

export default function TopicSystem({ onDetailViewChange }: TopicSystemProps) {
  // 首页状态
  const [selectedPhase, setSelectedPhase] = useState<PhaseType>('senior');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedScene, setSelectedScene] = useState<SceneType | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<TopicCard | null>(null);

  // 弹窗状态
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showAddTopicDialog, setShowAddTopicDialog] = useState(false);
  const [isAddFromTop, setIsAddFromTop] = useState(true);
  const [currentSceneForAdd, setCurrentSceneForAdd] = useState<SceneType | ''>('');

  // 新增专题表单
  const [newTopicPhase, setNewTopicPhase] = useState<PhaseType>('senior');
  const [newTopicGrade, setNewTopicGrade] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newTopicScene, setNewTopicScene] = useState<SceneType | ''>('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicNameError, setNewTopicNameError] = useState('');
  const [showDuplicateToast, setShowDuplicateToast] = useState(false);

  // 详情页状态
  const [sections, setSections] = useState<TopicSection[]>(mockTopicSections);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'knowledge' | 'course' | 'exam'>('knowledge');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false); // 编辑详情模式
  const [detailEditSnapshot, setDetailEditSnapshot] = useState<string>(''); // 详情编辑前的快照
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ts-1']));
  const [expandedChapterKps, setExpandedChapterKps] = useState<Set<string>>(new Set());
  const [selectedTopicLevelId, setSelectedTopicLevelId] = useState<string | null>(null);

  // 发布相关状态 — 复用教材体系的数据结构
  const [publishStatus, setPublishStatus] = useState<'published' | 'pending'>('pending');
  const [pendingChanges, setPendingChanges] = useState(3);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(true);
  const [pendingChangeCount, setPendingChangeCount] = useState(3);
  const [scheduledPublish, setScheduledPublish] = useState<{
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
  } | null>(null); // 定时发布信息，null表示无定时发布
  const [showPublishModal, setShowPublishModal] = useState(false); // 发布弹窗
  const [editChanges, setEditChanges] = useState<(string | ChangeItem)[]>([]); // 编辑变更记录
  const [currentVersion, setCurrentVersion] = useState('v1.0'); // 当前版本号

  // 编辑态弹窗相关状态 — 复用教材体系
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [tempSelectedCourses, setTempSelectedCourses] = useState<CourseItem[]>([]);
  const [courseSearchKeyword, setCourseSearchKeyword] = useState('');
  const [showUploadCourseDialog, setShowUploadCourseDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploadingCourse, setIsUploadingCourse] = useState(false);
  const [showExamSelector, setShowExamSelector] = useState(false);
  const [tempSelectedExams, setTempSelectedExams] = useState<ExamItem[]>([]);
  const [examSearchKeyword, setExamSearchKeyword] = useState('');
  const [showWorkbookImportModal, setShowWorkbookImportModal] = useState(false);
  const [tempSelectedWorkbooks, setTempSelectedWorkbooks] = useState<{id: string; name: string}[]>([]);
  const [workbookSearchKeyword, setWorkbookSearchKeyword] = useState('');
  const [showBatchDeleteExamDialog, setShowBatchDeleteExamDialog] = useState(false);
  const [batchDeleteExams, setBatchDeleteExams] = useState<Set<string>>(new Set());
  const [showKnowledgePointSelector, setShowKnowledgePointSelector] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [knowledgeSearchTerm, setKnowledgeSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [examSearchTerm, setExamSearchTerm] = useState('');

  // ===== 知识点选择弹窗相关状态 =====
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<{id: string; name: string; isModule?: boolean}[]>([]);
  const [expandedKnowledgePoints, setExpandedKnowledgePoints] = useState<Set<string>>(new Set());
  const [addingExtendedKpParentId, setAddingExtendedKpParentId] = useState<string | null>(null);

  // ===== 试卷相关状态 =====
  const [previewExam, setPreviewExam] = useState<ExamItem | null>(null);
  const [duplicateExamNames, setDuplicateExamNames] = useState<string[]>([]);
  const [showDuplicateExamDialog, setShowDuplicateExamDialog] = useState(false);

  // ===== 习题册导入相关状态 =====
  const [previewingWorkbook, setPreviewingWorkbook] = useState<typeof availableWorkbooks[0] | null>(null);
  const [expandedWorkbookChapters, setExpandedWorkbookChapters] = useState<Set<string>>(new Set());
  const [selectedWorkbookSection, setSelectedWorkbookSection] = useState<{id: string; name: string; exams: ExamItem[]} | null>(null);

  // ===== 知识树数据（用于从知识树引用知识点弹窗） =====
  const knowledgeTreeData = [
    {
      id: 'kt-root',
      name: '初中数学知识点',
      isModule: true,
      children: [
        {
          id: 'kt-1',
          name: '函数',
          isModule: true,
          children: [
            { id: 'kt-1-1', name: '函数的概念', isModule: false },
            { id: 'kt-1-2', name: '函数的表示方法', isModule: false },
            { id: 'kt-1-3', name: '函数的单调性', isModule: false },
            { id: 'kt-1-4', name: '函数的奇偶性', isModule: false },
            {
              id: 'kt-1-5',
              name: '二次函数',
              isModule: true,
              children: [
                { id: 'kt-1-5-1', name: '二次函数的图像', isModule: false },
                { id: 'kt-1-5-2', name: '二次函数的性质', isModule: false },
                { id: 'kt-1-5-3', name: '二次函数的综合应用', isModule: false },
              ],
            },
            { id: 'kt-1-6', name: '反比例函数', isModule: false },
            { id: 'kt-1-7', name: '指数函数', isModule: false },
            { id: 'kt-1-8', name: '对数函数', isModule: false },
          ],
        },
        {
          id: 'kt-2',
          name: '几何',
          isModule: true,
          children: [
            { id: 'kt-2-1', name: '立体几何初步', isModule: false },
            { id: 'kt-2-2', name: '平面几何', isModule: false },
            { id: 'kt-2-3', name: '相似与全等', isModule: false },
          ],
        },
      ],
    },
  ];

  // 知识点弹窗标题
  const kpDialogTitle = '从知识树引用知识点';

  // 判断习题册是否已全部添加
  const isWorkbookFullyAdded = (wb: typeof availableWorkbooks[0]) => {
    return tempSelectedWorkbooks.some(w => w.id === wb.id);
  };

  // 删除知识点
  const handleRemoveKnowledgePoint = (kpId: string) => {
    setSelectedKnowledgePoints(selectedKnowledgePoints.filter(kp => kp.id !== kpId));
  };

  // 记录编辑变更
  const addEditChange = (change: string) => {
    setEditChanges([...editChanges, change]);
    setHasUnpublishedChanges(true);
    setPendingChangeCount(prev => prev + 1);
  };

  // 执行试卷确认（从资源库选择）
  const executeExamConfirm = (skipDuplicates: boolean) => {
    if (!selectedTopicLevelId) return;
    const currentSection = findSectionById(sections, selectedTopicLevelId);
    if (!currentSection) return;

    const examsToAdd = skipDuplicates
      ? tempSelectedExams.filter(e => !duplicateExamNames.includes(e.name))
      : tempSelectedExams;

    const updatedExams = [...(currentSection.exams || []), ...examsToAdd];
    const updateSectionExams = (secs: TopicSection[]): TopicSection[] => {
      return secs.map(sec => {
        if (sec.id === selectedTopicLevelId) {
          return { ...sec, exams: updatedExams };
        }
        if (sec.children) {
          return { ...sec, children: updateSectionExams(sec.children) };
        }
        return sec;
      });
    };
    setSections(updateSectionExams(sections));
    setShowExamSelector(false);
    setTempSelectedExams([]);
    setExamSearchKeyword('');
    setShowDuplicateExamDialog(false);
    setDuplicateExamNames([]);
    examsToAdd.forEach(e => addEditChange(`添加试卷：${e.name}`));
  };

  // 执行习题册导入
  const executeWorkbookImport = (skipDuplicates: boolean) => {
    for (const wb of tempSelectedWorkbooks) {
      const fullWb = availableWorkbooks.find(w => w.id === wb.id);
      if (!fullWb) continue;
      for (const ch of fullWb.chapters) {
        if (ch.children) {
          for (const sec of ch.children) {
            const examsToAdd = skipDuplicates
              ? sec.exams.filter((e: ExamItem) => !duplicateExamNames.includes(e.name))
              : sec.exams;
            if (examsToAdd.length > 0) {
              addEditChange(`从习题册导入试卷：${examsToAdd.map((e: ExamItem) => e.name).join('、')}`);
            }
          }
        }
      }
    }
    setShowWorkbookImportModal(false);
    setTempSelectedWorkbooks([]);
    setWorkbookSearchKeyword('');
  };

  // 辅助函数：根据ID查找子专题
  const findSectionById = (secs: TopicSection[], id: string | null | undefined): TopicSection | null => {
    if (!id) return null;
    for (const sec of secs) {
      if (sec.id === id) return sec;
      if (sec.children) {
        const found = findSectionById(sec.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 可选资源mock数据 — 复用教材体系
  const availableCourses: CourseItem[] = [
    { id: 'ac-1', name: '二次函数的图像与性质', duration: '45:20', teacher: '张老师', sourceType: 'library', videoSize: '320MB' },
    { id: 'ac-2', name: '二次函数的综合应用', duration: '38:15', teacher: '李老师', sourceType: 'library', videoSize: '280MB' },
    { id: 'ac-3', name: '反比例函数详解', duration: '42:00', teacher: '王老师', sourceType: 'library', videoSize: '310MB' },
    { id: 'ac-4', name: '函数综合复习课', duration: '50:30', teacher: '赵老师', sourceType: 'library', videoSize: '400MB' },
  ];

  const availableExams: ExamItem[] = [
    { id: 'ae-1', name: '二次函数基础测试卷', questionCount: 18, totalScore: 100, sourceType: 'library', source: 'resource' },
    { id: 'ae-2', name: '二次函数提高测试卷', questionCount: 22, totalScore: 120, sourceType: 'library', source: 'resource' },
    { id: 'ae-3', name: '函数综合测试卷A', questionCount: 25, totalScore: 150, sourceType: 'library', source: 'resource' },
    { id: 'ae-4', name: '函数综合测试卷B', questionCount: 20, totalScore: 100, sourceType: 'library', source: 'resource' },
  ];

  const availableWorkbooks = [
    {
      id: 'wb-1', name: '数学九年级上册习题册',
      chapters: [
        { id: 'wb1-c1', name: '第一章 二次函数', children: [
          { id: 'wb1-s1', name: '1.1 二次函数的概念', exams: [{ id: 'wb1-e1', name: '二次函数概念练习', questionCount: 10, totalScore: 50, difficulty: '基础', sourceType: 'workbook' as const, source: 'workbook' as const }] },
          { id: 'wb1-s2', name: '1.2 二次函数的图像', exams: [{ id: 'wb1-e2', name: '二次函数图像练习', questionCount: 15, totalScore: 75, difficulty: '提高', sourceType: 'workbook' as const, source: 'workbook' as const }] },
        ]},
      ],
    },
    {
      id: 'wb-2', name: '数学九年级下册习题册',
      chapters: [
        { id: 'wb2-c1', name: '第一章 几何基础', children: [
          { id: 'wb2-s1', name: '1.1 立体几何初步', exams: [{ id: 'wb2-e1', name: '立体几何基础练习', questionCount: 12, totalScore: 60, difficulty: '基础', sourceType: 'workbook' as const, source: 'workbook' as const }] },
        ]},
      ],
    },
  ];

  // 发布处理 — 复用教材体系逻辑
  const handlePublish = (version: string, description: string, scheduledInfo?: { scheduledDate: string; scheduledTime: string }) => {
    if (scheduledInfo) {
      // 定时发布：保存定时发布信息，不立即发布
      setScheduledPublish({
        version,
        scheduledDate: scheduledInfo.scheduledDate,
        scheduledTime: scheduledInfo.scheduledTime,
        description,
      });
      // 重置待发布状态
      setHasUnpublishedChanges(false);
      setPendingChanges(0);
      setEditChanges([]);
    } else {
      // 立即发布
      const now = new Date();
      const publishTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 更新发布状态
      setPublishStatus('published');
      setCurrentVersion(version);
      setScheduledPublish(null);

      // 重置待发布状态
      setHasUnpublishedChanges(false);
      setPendingChanges(0);
      setEditChanges([]);
    }
  };

  // 取消定时发布 — 复用教材体系逻辑
  const handleCancelScheduled = () => {
    setScheduledPublish(null);
    setPublishStatus('pending');
    setHasUnpublishedChanges(true);
    setPendingChanges(1);
  };

  // 添加专题/子专题交互状态 — 复用教材体系的交互逻辑
  const [addingSectionParentId, setAddingSectionParentId] = useState<string | null>(null); // null表示未在添加，'root'表示添加顶级专题，其他为父节点ID
  const [sectionInputValue, setSectionInputValue] = useState(''); // 输入框值

  // ==================== 首页逻辑 ====================

  // 筛选后的专题列表
  const filteredTopics = mockTopicCards.filter((topic) => {
    const matchPhase = topic.phase === phaseConfig[selectedPhase].label;
    const matchGrade = selectedGrade === 'all' || topic.grade === gradeConfig[selectedPhase]?.find(g => g.id === selectedGrade)?.name;
    const matchSubject = selectedSubject === 'all' || topic.subject === subjectOptions.find(s => s.id === selectedSubject)?.name;
    const matchScene = selectedScene === 'all' || topic.scene === selectedScene;
    return matchPhase && matchGrade && matchSubject && matchScene;
  });

  // 按场景分组
  const groupedByScene = Object.entries(sceneConfig).reduce((acc, [key, config]) => {
    const topics = filteredTopics.filter(t => t.scene === key);
    if (topics.length > 0) {
      acc[key] = { label: config.label, icon: config.icon, topics };
    }
    return acc;
  }, {} as Record<string, { label: string; icon: React.ReactNode; topics: TopicCard[] }>);

  // 新增专题处理
  const handleAddTopic = () => {
    if (!newTopicName.trim()) {
      setNewTopicNameError('请填写专题名称');
      return;
    }
    // 检查重名
    const duplicate = mockTopicCards.some(t =>
      t.phase === phaseConfig[newTopicPhase].label &&
      t.grade === gradeConfig[newTopicPhase]?.find(g => g.id === newTopicGrade)?.name &&
      t.subject === subjectOptions.find(s => s.id === newTopicSubject)?.name &&
      t.name === newTopicName.trim()
    );
    if (duplicate) {
      setShowDuplicateToast(true);
      setTimeout(() => setShowDuplicateToast(false), 3000);
      return;
    }
    // 成功新增
    setShowAddTopicDialog(false);
    setNewTopicName('');
    setNewTopicNameError('');
  };

  // 进入详情页
  const enterDetail = (topic: TopicCard) => {
    setSelectedTopic(topic);
    setIsEditing(true);
    onDetailViewChange?.(true);
  };

  // 返回首页
  const goBackToList = () => {
    setSelectedTopic(null);
    setIsEditing(false);
    setIsEditingDetail(false);
    setDetailEditSnapshot('');
    setSelectedSectionId(null);
    setSelectedTopicLevelId(null);
    setHasUnpublishedChanges(false);
    setPendingChangeCount(0);
    onDetailViewChange?.(false);
  };

  // ==================== 详情页逻辑 ====================

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedSection = selectedSectionId
    ? findSection(sections, selectedSectionId)
    : null;

  function findSection(sections: TopicSection[], id: string): TopicSection | null {
    for (const s of sections) {
      if (s.id === id) return s;
      if (s.children) {
        const found = findSection(s.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // 添加专题/子专题 — 复用教材体系的 handleAddChapter 逻辑
  const handleAddSection = (parentId: string | null, name: string) => {
    const newId = `ts-${Date.now()}`;
    const newSection: TopicSection = {
      id: newId,
      name: name,
      knowledgePoints: [],
      courses: [],
      exams: [],
      expanded: false,
    };

    // 父节点保持展开，新节点选中
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (parentId && parentId !== 'root') {
        next.add(parentId); // 确保父节点展开，能立即看到新增的子节点
      }
      return next;
    });
    setSelectedSectionId(newId);
    setSelectedTopicLevelId(null);

    if (parentId === null || parentId === 'root') {
      // 底部"添加专题"按钮 → 追加到末尾
      setSections([...sections, newSection]);
    } else {
      // 添加子专题，追加到最后
      const addToParent = (sectionList: TopicSection[]): TopicSection[] => {
        return sectionList.map((section) => {
          if (section.id === parentId) {
            return {
              ...section,
              expanded: true,
              children: [...(section.children || []), newSection],
            };
          }
          if (section.children) {
            return { ...section, children: addToParent(section.children) };
          }
          return section;
        });
      };
      setSections(addToParent(sections));
    }
  };

  // 统计
  function countKnowledgePoints(section: TopicSection): number {
    let count = section.knowledgePoints?.length || 0;
    if (section.children) {
      section.children.forEach(c => { count += countKnowledgePoints(c); });
    }
    return count;
  }

  function countCourses(section: TopicSection): number {
    let count = section.courses?.length || 0;
    if (section.children) {
      section.children.forEach(c => { count += countCourses(c); });
    }
    return count;
  }

  function countExams(section: TopicSection): number {
    let count = section.exams?.length || 0;
    if (section.children) {
      section.children.forEach(c => { count += countExams(c); });
    }
    return count;
  }

  // ==================== 渲染：首页 ====================

  const TopicListPage = () => (
    <div className="space-y-6">
      {/* 顶部筛选栏 — 复用教材体系样式 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 学段 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">学段：</label>
              <select
                value={selectedPhase}
                onChange={(e) => { setSelectedPhase(e.target.value as PhaseType); setSelectedGrade('all'); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(phaseConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* 年级 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">年级：</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">全部年级</option>
                {gradeConfig[selectedPhase]?.map((grade) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>

            {/* 学科 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">学科：</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            {/* 场景 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">场景：</label>
              <select
                value={selectedScene}
                onChange={(e) => setSelectedScene(e.target.value as SceneType | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">全部场景</option>
                {Object.entries(sceneConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryDialog(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              查看历史发布记录
            </button>
            <button
              onClick={() => {
                setIsAddFromTop(true);
                setCurrentSceneForAdd('');
                setNewTopicPhase('senior');
                setNewTopicGrade('');
                setNewTopicSubject('');
                setNewTopicScene('');
                setNewTopicName('');
                setNewTopicNameError('');
                setShowAddTopicDialog(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              新增专题
            </button>
          </div>
        </div>
      </div>

      {/* 场景分类板块 — 复用教材体系的出版社分组样式 */}
      <div className="space-y-6">
        {Object.entries(groupedByScene).map(([sceneKey, group]) => (
          <div key={sceneKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* 场景标题栏 — 复用教材体系出版社标题栏样式 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900">{group.label}</span>
                <span className="text-sm text-gray-500">({group.topics.length}个专题)</span>
              </div>
              <button
                onClick={() => {
                  setIsAddFromTop(false);
                  setCurrentSceneForAdd(sceneKey as SceneType);
                  setNewTopicPhase('senior');
                  setNewTopicGrade('');
                  setNewTopicSubject('');
                  setNewTopicScene(sceneKey as SceneType);
                  setNewTopicName('');
                  setNewTopicNameError('');
                  setShowAddTopicDialog(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增
              </button>
            </div>

            {/* 专题卡片列表 — 复用教材卡片网格布局 */}
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {group.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-300 transition-all"
                  >
                    {/* 封面 — 复用教材封面渐变样式 */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center relative">
                      <div className="text-center px-4">
                        <BookOpen className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-emerald-600">{topic.name}</div>
                        <div className="text-xs text-emerald-500 mt-1 font-mono">{topic.currentVersion}</div>
                      </div>
                      {/* 状态标签 — 复用教材发布状态样式 */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          topic.publishStatus === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {topic.publishStatus === 'published'
                            ? '已发布'
                            : `待发布${topic.pendingChanges ? '·' + topic.pendingChanges + '变更' : ''}`}
                        </span>
                      </div>
                      {/* 年级|学科 — 对应教材体系学段|学科|教材版本位置 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                        <span className="text-xs text-white">{topic.grade} | {topic.subject}</span>
                      </div>
                    </div>

                    {/* 信息 — 复用教材卡片信息区 */}
                    <div className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">📂 专题</span>
                          <span className="font-medium text-gray-700">{topic.topicCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">📝 知识点</span>
                          <span className="font-medium text-gray-700">{topic.knowledgePointCount}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => enterDetail(topic)}
                        className="mt-3 w-full py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 font-medium"
                      >
                        进入管理
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 重名toast提示 */}
      {showDuplicateToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          当前所选字段下已存在同名专题，请调整专题名称
        </div>
      )}
    </div>
  );

  // ==================== 渲染：左侧专题树 ====================

  const renderSectionTree = (sectionList: TopicSection[], level: number = 0) => (
    <div className={level > 0 ? 'ml-4' : ''}>
      {sectionList.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const isSelected = selectedSectionId === section.id;
        const kpCount = countKnowledgePoints(section);
        const hasChildren = section.children && section.children.length > 0;

        return (
          <div key={section.id}>
            <div
              className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-sm group
                ${isSelected ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'}`}
              onClick={() => {
                setSelectedSectionId(section.id);
                setSelectedTopicLevelId(null);
              }}
            >
              {hasChildren && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              )}
              {!hasChildren && <span className="w-4.5" />}
              <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="flex-1 truncate">{section.name}</span>
              <span className="text-xs text-gray-400 ml-auto">{kpCount}个知识点</span>
            </div>

            {isExpanded && hasChildren && renderSectionTree(section.children!, level + 1)}

            {/* 添加子专题按钮/输入框 - 编辑模式下，选中节点且(展开或无子节点)时显示 */}
            {isEditing && (isExpanded || !hasChildren) && (
              addingSectionParentId === null ? (
                <button
                  onClick={() => {
                    setAddingSectionParentId(section.id);
                    setSectionInputValue('');
                  }}
                  className="w-full flex items-center gap-2 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                >
                  <Plus className="w-4 h-4" />
                  添加子专题
                </button>
              ) : addingSectionParentId === section.id ? (
                <div
                  className="flex items-center gap-2 py-2"
                  style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                >
                  <input
                    type="text"
                    value={sectionInputValue}
                    onChange={(e) => setSectionInputValue(e.target.value)}
                    placeholder="请输入子专题名称"
                    className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (sectionInputValue.trim()) {
                        handleAddSection(section.id, sectionInputValue.trim());
                        setAddingSectionParentId(null);
                        setSectionInputValue('');
                      }
                    }}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setAddingSectionParentId(null);
                      setSectionInputValue('');
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
      })}
    </div>
  );

  // ==================== 渲染：复习课卡片（复用教材体系renderCourseCard样式）====================

  const renderCourseCard = (course: CourseItem, showRemove: boolean = true) => (
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
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          title="预览"
        >
          <Play className="w-4 h-4" />
        </button>
        {showRemove && isEditingDetail && (
          <button
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="移除"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // ==================== 渲染：练习试卷卡片（复用教材体系renderExamCard样式）====================

  const renderExamCard = (exam: ExamItem, showRemove: boolean = true) => (
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
          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
          title="预览试卷"
        >
          <Eye className="w-4 h-4" />
        </button>
        {showRemove && isEditingDetail && (
          <button
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="移除"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // ==================== 渲染：右侧面板 — 知识点Tab（复用教材体系连接线样式）====================

  const renderKnowledgeContent = (section: TopicSection, isAggregated: boolean = false) => {
    if (!section.knowledgePoints || section.knowledgePoints.length === 0) {
      if (section.children && section.children.length > 0) {
        return (
          <div className="space-y-0">
            {section.children.map((child, childIndex) => {
              const hasKnowledgePoints = child.knowledgePoints && child.knowledgePoints.length > 0;
              const hasSubChildren = child.children && child.children.length > 0;
              const isLast = childIndex === (section.children?.length || 0) - 1;
              return (
                <div key={child.id} className="relative">
                  <div className="flex">
                    <div className="w-6 flex-shrink-0 flex flex-col items-center">
                      <div className={`w-px ${childIndex === 0 ? 'h-4' : 'h-0'} bg-emerald-300`}></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10"></div>
                      {!isLast && <div className="w-px flex-1 bg-emerald-300"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-300">
                        <ListTree className="w-4 h-4 text-emerald-600" />
                        <span className="text-base font-bold text-emerald-800">{child.name}</span>
                        {hasKnowledgePoints && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {child.knowledgePoints?.length}个知识点
                          </span>
                        )}
                        {hasSubChildren && (
                          <span className="text-xs text-gray-500">
                            （含{hasSubChildren}个子专题）
                          </span>
                        )}
                      </div>
                      {hasSubChildren ? (
                        <div className="ml-2 space-y-2">
                          {child.children?.map((subChild) => {
                            const subHasKp = subChild.knowledgePoints && subChild.knowledgePoints.length > 0;
                            return (
                              <div key={subChild.id} className="relative">
                                <div className="flex">
                                  <div className="w-4 flex-shrink-0 flex flex-col items-center pt-1">
                                    <div className="w-px h-4 bg-emerald-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm z-10"></div>
                                  </div>
                                  <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">{subChild.name}</span>
                                      {subHasKp && (
                                        <span className="text-xs text-emerald-600">{subChild.knowledgePoints?.length}个知识点</span>
                                      )}
                                      {!subHasKp && (
                                        <span className="text-xs text-gray-400">暂无内容</span>
                                      )}
                                    </div>
                                    {subHasKp && (
                                      <div className="ml-4 space-y-2">
                                        {subChild.knowledgePoints?.map((kp) => {
                                          const hasExtended = kp.extendedPoints && kp.extendedPoints.length > 0;
                                          const isExpanded = expandedChapterKps.has(kp.id);
                                          return (
                                            <div key={kp.id} className="space-y-0">
                                              <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="flex-1 text-sm text-gray-700">{kp.name}</span>
                                                {hasExtended && (
                                                  <button
                                                    onClick={() => {
                                                      const newSet = new Set(expandedChapterKps);
                                                      if (isExpanded) { newSet.delete(kp.id); } else { newSet.add(kp.id); }
                                                      setExpandedChapterKps(newSet);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                  >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                  </button>
                                                )}
                                              </div>
                                              {isExpanded && hasExtended && (
                                                <div className="ml-4 py-1 space-y-1">
                                                  {kp.extendedPoints?.map((ep, i) => (
                                                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-100 rounded">
                                                      <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
                                                      <span className="flex-1 text-sm text-gray-600">{ep}</span>
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
                        <div className="ml-2 space-y-2">
                          {child.knowledgePoints?.map((kp) => {
                            const hasExtended = kp.extendedPoints && kp.extendedPoints.length > 0;
                            const isExpanded = expandedChapterKps.has(kp.id);
                            return (
                              <div key={kp.id} className="space-y-0">
                                <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="flex-1 text-sm text-gray-700">{kp.name}</span>
                                  {hasExtended && (
                                    <button
                                      onClick={() => {
                                        const newSet = new Set(expandedChapterKps);
                                        if (isExpanded) { newSet.delete(kp.id); } else { newSet.add(kp.id); }
                                        setExpandedChapterKps(newSet);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>
                                  )}
                                </div>
                                {isExpanded && hasExtended && (
                                  <div className="ml-4 py-1 space-y-1">
                                    {kp.extendedPoints?.map((ep, i) => (
                                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-100 rounded">
                                        <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
                                        <span className="flex-1 text-sm text-gray-600">{ep}</span>
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
        );
      }
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无知识点</p>
        </div>
      );
    }

    // 末级节点直接展示知识点（复用教材体系 ChapterKnowledgePoint 样式）
    return (
      <div>
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ListTree className="w-4 h-4 text-emerald-600" />
            关联知识点
            {section.knowledgePoints && section.knowledgePoints.length > 0 && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                （{section.knowledgePoints.length}个知识点）
              </span>
            )}
            {isEditingDetail && section.knowledgePoints && section.knowledgePoints.length > 1 && (
              <span className="ml-2 text-xs text-gray-400 font-normal flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                可拖拽排序
              </span>
            )}
          </h4>
          {isEditingDetail && (
            <button
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
              onClick={() => setShowKnowledgePointSelector(true)}
            >
              <Plus className="w-4 h-4" />
              知识点
            </button>
          )}
        </div>

        {/* 知识点列表 */}
        {(section.knowledgePoints?.length || 0) > 0 ? (
          <div className="space-y-2">
            {section.knowledgePoints.map((kp, index) => {
              const hasExtended = kp.extendedPoints && kp.extendedPoints.length > 0;
              const isExpanded = expandedChapterKps.has(kp.id);
              return (
                <div key={kp.id} className="space-y-0">
                  {/* 主知识点行 */}
                  <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
                    {isEditingDetail && (
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="flex-1 text-sm text-gray-700">{kp.name}</span>
                    {/* 展开/收起按钮 */}
                    {hasExtended && (
                      <button
                        onClick={() => {
                          const newSet = new Set(expandedChapterKps);
                          if (isExpanded) {
                            newSet.delete(kp.id);
                          } else {
                            newSet.add(kp.id);
                          }
                          setExpandedChapterKps(newSet);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title={isExpanded ? '收起延伸知识点' : '展开延伸知识点'}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}
                    {isEditingDetail && (
                      <button className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* 延伸知识点区域 */}
                  {isExpanded && hasExtended && (
                    <div className="ml-4 py-1 space-y-1">
                      {kp.extendedPoints?.map((ep, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-100 rounded">
                          {isEditingDetail && (
                            <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                              <GripVertical className="w-3 h-3" />
                            </div>
                          )}
                          <Circle className="w-3 h-3 text-gray-400 fill-gray-200" />
                          <span className="flex-1 text-sm text-gray-600">{ep}</span>
                          {isEditingDetail && (
                            <button className="text-red-500 hover:text-red-700 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂未关联知识点</p>
            {isEditingDetail && (
              <p className="text-xs text-gray-400 mt-1">点击上方按钮从知识树引用知识点</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== 渲染：右侧面板 — 复习课Tab（复用教材体系连接线样式）====================

  const renderCourseContent = (section: TopicSection) => {
    if (!section.courses || section.courses.length === 0) {
      if (section.children && section.children.length > 0) {
        return (
          <div className="space-y-0">
            {section.children.map((child, childIndex) => {
              const hasCourses = child.courses && child.courses.length > 0;
              const hasSubChildren = child.children && child.children.length > 0;
              const isLast = childIndex === (section.children?.length || 0) - 1;
              return (
                <div key={child.id} className="relative">
                  <div className="flex">
                    <div className="w-6 flex-shrink-0 flex flex-col items-center">
                      <div className={`w-px ${childIndex === 0 ? 'h-4' : 'h-0'} bg-blue-300`}></div>
                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10"></div>
                      {!isLast && <div className="w-px flex-1 bg-blue-300"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-300">
                        <ListTree className="w-4 h-4 text-blue-600" />
                        <span className="text-base font-bold text-blue-800">{child.name}</span>
                        {hasCourses && (
                          <span className="text-xs text-blue-600">({child.courses?.length}个复习课)</span>
                        )}
                        {hasSubChildren && (
                          <span className="text-xs text-gray-500">（含{hasSubChildren}个子专题）</span>
                        )}
                      </div>
                      {hasSubChildren ? (
                        <div className="ml-2 space-y-2">
                          {child.children?.map((subChild) => {
                            const subHasCourses = subChild.courses && subChild.courses.length > 0;
                            return (
                              <div key={subChild.id} className="relative">
                                <div className="flex">
                                  <div className="w-4 flex-shrink-0 flex flex-col items-center">
                                    <div className="w-px h-4 bg-blue-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white shadow-sm z-10"></div>
                                  </div>
                                  <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                      <Video className="w-3.5 h-3.5 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">{subChild.name}</span>
                                      {subHasCourses && (
                                        <span className="text-xs text-blue-600">{subChild.courses?.length}个复习课</span>
                                      )}
                                      {!subHasCourses && (
                                        <span className="text-xs text-gray-400">暂无内容</span>
                                      )}
                                    </div>
                                    {subHasCourses && (
                                      <div className="ml-4 space-y-2">
                                        {subChild.courses?.map((course) => renderCourseCard(course, false))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : hasCourses ? (
                        <div className="ml-2 space-y-2">
                          {child.courses?.map((course) => renderCourseCard(course, false))}
                        </div>
                      ) : (
                        <div className="ml-2 px-3 py-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400">
                          暂无复习课
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无复习课</p>
        </div>
      );
    }

    // 末级节点直接展示课程
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            关联复习课
            {isEditingDetail && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                删除视频，仅代表在当前页面解除关联关系，不影响原视频在资源库中的存在。
              </span>
            )}
            {(section.courses?.length || 0) > 0 && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({section.courses?.length || 0}个)
              </span>
            )}
          </h4>
          {isEditingDetail && (
            <div className="flex items-center gap-2">
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
        {(section.courses?.length || 0) > 0 ? (
          <div className="space-y-2">
            {section.courses.map((course) => renderCourseCard(course, isEditingDetail))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂未关联复习课</p>
            {isEditingDetail && (
              <p className="text-xs text-gray-400 mt-1">点击上方按钮添加复习课</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== 渲染：右侧面板 — 练习试卷Tab（复用教材体系连接线样式）====================

  const renderExamContent = (section: TopicSection) => {
    if (!section.exams || section.exams.length === 0) {
      if (section.children && section.children.length > 0) {
        return (
          <div className="space-y-0">
            {section.children.map((child, childIndex) => {
              const hasExams = child.exams && child.exams.length > 0;
              const hasSubChildren = child.children && child.children.length > 0;
              const isLast = childIndex === (section.children?.length || 0) - 1;
              return (
                <div key={child.id} className="relative">
                  <div className="flex">
                    <div className="w-6 flex-shrink-0 flex flex-col items-center">
                      <div className={`w-px ${childIndex === 0 ? 'h-4' : 'h-0'} bg-amber-300`}></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10"></div>
                      {!isLast && <div className="w-px flex-1 bg-amber-300"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-300">
                        <ListTree className="w-4 h-4 text-amber-600" />
                        <span className="text-base font-bold text-amber-800">{child.name}</span>
                        {hasExams && (
                          <span className="text-xs text-amber-600">({child.exams?.length}套试卷)</span>
                        )}
                        {hasSubChildren && (
                          <span className="text-xs text-gray-500">（含{hasSubChildren}个子专题）</span>
                        )}
                      </div>
                      {hasSubChildren ? (
                        <div className="ml-2 space-y-2">
                          {child.children?.map((subChild) => {
                            const subHasExams = subChild.exams && subChild.exams.length > 0;
                            return (
                              <div key={subChild.id} className="relative">
                                <div className="flex">
                                  <div className="w-4 flex-shrink-0 flex flex-col items-center">
                                    <div className="w-px h-4 bg-amber-200"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm z-10"></div>
                                  </div>
                                  <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                                      <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">{subChild.name}</span>
                                      {subHasExams && (
                                        <span className="text-xs text-amber-600">{subChild.exams?.length}套试卷</span>
                                      )}
                                      {!subHasExams && (
                                        <span className="text-xs text-gray-400">暂无内容</span>
                                      )}
                                    </div>
                                    {subHasExams && (
                                      <div className="ml-4 space-y-2">
                                        {subChild.exams?.map((exam) => renderExamCard(exam, false))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : hasExams ? (
                        <div className="ml-2 space-y-2">
                          {child.exams?.map((exam) => renderExamCard(exam, false))}
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
        );
      }
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无试卷</p>
        </div>
      );
    }

    // 末级节点直接展示试卷
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
            关联练习试卷
            {(section.exams?.length || 0) > 0 && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({section.exams?.length || 0}套)
              </span>
            )}
          </h4>
          {isEditingDetail && (
            <div className="flex items-center gap-2">
              {(section.exams?.length || 0) > 0 && (
                <button
                  onClick={() => {
                    setBatchDeleteExams(new Set());
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
              <button
                onClick={() => {
                  setTempSelectedWorkbooks([]);
                  setWorkbookSearchKeyword('');
                  setShowWorkbookImportModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                从习题册导入
              </button>
            </div>
          )}
        </div>
        {(section.exams?.length || 0) > 0 ? (
          <div className="space-y-2">
            {section.exams.map((exam) => renderExamCard(exam, isEditingDetail))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂未关联练习试卷</p>
            {isEditingDetail && (
              <p className="text-xs text-gray-400 mt-1">点击上方按钮从资源库选择练习试卷</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== 渲染：详情页 ====================

  const TopicDetailPage = () => {
    const isTopicLevelView = selectedTopicLevelId !== null;
    const isSectionLevelView = selectedSectionId !== null && !isTopicLevelView;

    return (
      <div className="flex gap-4" style={{ height: 'calc(100vh - 280px)' }}>
        {/* 左侧 - 专题体系知识树目录 */}
        <div className="w-72 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* 顶部信息 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{selectedTopic?.name}</span>
            </div>
            <div className="text-xs text-gray-500">
              {selectedTopic?.grade} | {selectedTopic?.subject} | {sceneConfig[selectedTopic!.scene].label}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{selectedTopic?.currentVersion} · {selectedTopic?.lastModified}</span>
            </div>
          </div>

          {/* 专题结构标题 */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-600">专题结构</span>
          </div>

          {/* 专题名称（虚拟节点入口） — 复用教材体系的教材名称虚拟节点样式 */}
          <div className="px-2 py-1.5 border-b border-gray-100">
            <div
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-sm
                ${selectedTopicLevelId === 'topic-root' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'}`}
              onClick={() => {
                setSelectedTopicLevelId('topic-root');
                setSelectedSectionId(null);
              }}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="text-sm font-medium truncate">{selectedTopic?.name}</span>
            </div>
          </div>

          {/* 专题树 */}
          <div className="flex-1 overflow-y-auto p-2">
            {renderSectionTree(sections)}
            {/* 添加专题输入框/按钮 - 编辑模式下显示 */}
            {isEditing && (
              <div className="mt-2">
                {addingSectionParentId === null ? (
                  <button
                    onClick={() => {
                      setAddingSectionParentId('root');
                      setSectionInputValue('');
                    }}
                    className="w-full flex items-center gap-2 py-2 px-3 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加专题
                  </button>
                ) : addingSectionParentId === 'root' ? (
                  <div className="flex items-center gap-2 py-2 px-3">
                    <input
                      type="text"
                      value={sectionInputValue}
                      onChange={(e) => setSectionInputValue(e.target.value)}
                      placeholder="请输入专题名称"
                      className="flex-1 px-2 py-1 border border-emerald-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (sectionInputValue.trim()) {
                          handleAddSection(null, sectionInputValue.trim());
                          setAddingSectionParentId(null);
                          setSectionInputValue('');
                        }
                      }}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setAddingSectionParentId(null);
                        setSectionInputValue('');
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
        </div>

        {/* 右侧 - 内容面板（复用教材体系布局） */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* 专题级视图 */}
          {isTopicLevelView ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {/* 操作按钮行 — 复用教材体系布局：导出+编辑/保存按钮 */}
                <div className="flex items-center justify-between mb-4">
                  <div />
                  <div className="flex items-center gap-2">
                    {!isEditingDetail && (
                      <button
                        onClick={() => {
                          const snapshot = JSON.stringify(sections);
                          setDetailEditSnapshot(snapshot);
                          setIsEditingDetail(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑专题详情
                      </button>
                    )}
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
                            const currentSnapshot = JSON.stringify(sections);
                            const hasChanges = currentSnapshot !== detailEditSnapshot;
                            if (hasChanges) {
                              setHasUnpublishedChanges(true);
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
                      </>
                    )}
                  </div>
                </div>

                {/* 专题名称行 + Tab栏 — 复用教材体系布局 */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-200">
                  <div className="text-sm text-gray-700 font-medium">{selectedTopic?.name}</div>
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
                      复习课
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

                {/* 专题级聚合展示 — 复用教材体系连接线+圆点+总览标题样式 */}
                {activeTab === 'knowledge' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-emerald-600" />
                      知识点总览
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        （聚合展示该专题下所有子专题的知识点）
                      </span>
                    </h4>
                    {renderKnowledgeContent({ ...selectedTopic!, children: sections } as TopicSection)}
                  </div>
                )}
                {activeTab === 'course' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      复习课总览
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        （聚合展示该专题下所有子专题关联的课程）
                      </span>
                    </h4>
                    {renderCourseContent({ ...selectedTopic!, children: sections } as TopicSection)}
                  </div>
                )}
                {activeTab === 'exam' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      练习试卷总览
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        （聚合展示该专题下所有子专题关联的试卷）
                      </span>
                    </h4>
                    {renderExamContent({ ...selectedTopic!, children: sections } as TopicSection)}
                  </div>
                )}
              </div>
            </div>
          ) : isSectionLevelView && selectedSection ? (
            // 子专题级视图
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {/* 操作按钮行 */}
                <div className="flex items-center justify-between mb-4">
                  <div />
                  <div className="flex items-center gap-2">
                    {!isEditingDetail && (
                      <button
                        onClick={() => {
                          const snapshot = JSON.stringify(selectedSection);
                          setDetailEditSnapshot(snapshot);
                          setIsEditingDetail(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑专题详情
                      </button>
                    )}
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
                            const currentSnapshot = JSON.stringify(selectedSection);
                            const hasChanges = currentSnapshot !== detailEditSnapshot;
                            if (hasChanges) {
                              setHasUnpublishedChanges(true);
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
                      </>
                    )}
                  </div>
                </div>

                {/* 子专题名称行 + Tab栏 — 复用教材体系布局 */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-200">
                  <div className="text-sm text-gray-700 font-medium">{selectedSection.name}</div>
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
                      复习课
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

                {/* 子专题内容 — 复用教材体系连接线样式 */}
                {selectedSection.children && selectedSection.children.length > 0 ? (
                  <>
                    {activeTab === 'knowledge' && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <BookMarked className="w-4 h-4 text-emerald-600" />
                          知识点总览
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            （聚合展示该子专题下所有子节的知识点）
                          </span>
                        </h4>
                        {renderKnowledgeContent(selectedSection)}
                      </div>
                    )}
                    {activeTab === 'course' && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          复习课总览
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            （聚合展示该子专题下所有子节关联的课程）
                          </span>
                        </h4>
                        {renderCourseContent(selectedSection)}
                      </div>
                    )}
                    {activeTab === 'exam' && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          练习试卷总览
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            （聚合展示该子专题下所有子节关联的试卷）
                          </span>
                        </h4>
                        {renderExamContent(selectedSection)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {activeTab === 'knowledge' && renderKnowledgeContent(selectedSection)}
                    {activeTab === 'course' && renderCourseContent(selectedSection)}
                    {activeTab === 'exam' && renderExamContent(selectedSection)}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              请在左侧选择专题或子专题查看详情
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== 主渲染 ====================

  return (
    <div className="h-full">
      {selectedTopic ? (
        // 详情页 — 复用教材体系布局：发布提示条在最顶层
        <div className="h-full overflow-y-auto">
          <div className="space-y-4 p-4">
            {/* 编辑后待发布提醒条（已发布状态但有新修改，包括有定时信息的情况） */}
            {hasUnpublishedChanges && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        有 <span className="font-medium">{pendingChanges || 1}</span> 项变更待发布，发布后才能生效
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPublishModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        发布
                      </button>
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
            {scheduledPublish && !hasUnpublishedChanges && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      <span className="font-medium">{scheduledPublish.version}</span> 版本将于您设定的时间（
                      <span className="font-medium">{scheduledPublish.scheduledDate} {scheduledPublish.scheduledTime}</span>）自动发布，发布后更新的内容将正式生效
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHistoryDialog(true)}
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
            {publishStatus === 'pending' && !scheduledPublish && !hasUnpublishedChanges && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        有 <span className="font-medium">{pendingChanges}</span> 项变更待发布，发布后才能生效
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowHistoryDialog(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <History className="w-4 h-4" />
                        查看历史版本
                      </button>
                      <button
                        onClick={() => setShowPublishModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        发布
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500 pl-1">
                  <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>信息发布将影响线上用户的实际使用，发布时，建议避开用户高频使用的时间段</span>
                </div>
              </>
            )}

            {/* 顶部导航栏 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={goBackToList}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            </div>

            {/* 章节树和详情 */}
            <TopicDetailPage />
          </div>
        </div>
      ) : (
        // 首页
        <TopicListPage />
      )}

      {/* ==================== 弹窗区域 ==================== */}

      {/* 查看历史发布记录弹窗 — 复用教材体系共享组件 */}
      <AggregateHistoryModal
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        title="历史发布记录"
        data={mockPublishHistory.map(record => ({
          id: record.id,
          moduleName: record.topicName,
          version: record.version,
          description: record.description,
          publishTime: record.publishTime,
          publisher: record.publisherName,
          publisherAccount: record.publisherAccount,
          moduleTags: [record.phase, record.grade, record.subject, record.scene],
        }))}
        filterConfig={{
          showTypeFilter: true,
          showPhaseFilter: true,
          showSubjectFilter: true,
          showGradeFilter: true,
          typeOptions: [
            { id: 'all', label: '全部场景' },
            { id: '寒暑假复习', label: '寒暑假复习' },
            { id: '中考', label: '中考' },
            { id: '高考', label: '高考' },
          ],
          phaseOptions: [
            { id: 'all', label: '全部学段' },
            { id: 'senior', label: '高中' },
            { id: 'junior', label: '初中' },
            { id: 'primary', label: '小学' },
          ],
          subjectOptions: [
            { id: 'all', label: '全部学科' },
            { id: 'math', label: '数学' },
            { id: 'chinese', label: '语文' },
            { id: 'english', label: '英语' },
            { id: 'physics', label: '物理' },
            { id: 'chemistry', label: '化学' },
            { id: 'biology', label: '生物' },
            { id: 'politics', label: '政治' },
            { id: 'history', label: '历史' },
            { id: 'geography', label: '地理' },
          ],
          gradeOptions: [
            { id: 'all', label: '全部年级' },
            { id: 'g1', label: '高一' },
            { id: 'g2', label: '高二' },
            { id: 'g3', label: '高三' },
            { id: 'c1', label: '初一' },
            { id: 'c2', label: '初二' },
            { id: 'c3', label: '初三' },
            { id: 'p1', label: '一年级' },
            { id: 'p2', label: '二年级' },
            { id: 'p3', label: '三年级' },
            { id: 'p4', label: '四年级' },
            { id: 'p5', label: '五年级' },
            { id: 'p6', label: '六年级' },
          ],
        }}
        defaultFilterValues={{ type: 'all' }}
      />

      {/* 新增专题弹窗 — 复用教材体系新增弹窗样式 */}
      {showAddTopicDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">新增专题</h3>
              <button
                onClick={() => {
                  setShowAddTopicDialog(false);
                  setNewTopicName('');
                  setNewTopicNameError('');
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
                  value={newTopicPhase}
                  onChange={(e) => { setNewTopicPhase(e.target.value as PhaseType); setNewTopicGrade(''); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(phaseConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* 年级 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年级 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTopicGrade}
                  onChange={(e) => setNewTopicGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">请选择年级</option>
                  {gradeConfig[newTopicPhase]?.map((grade) => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>

              {/* 学科 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学科 <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTopicSubject}
                  onChange={(e) => setNewTopicSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">请选择学科</option>
                  {subjectOptions.filter(s => s.id !== 'all').map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              {/* 场景 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  场景 <span className="text-red-500">*</span>
                </label>
                {!isAddFromTop && currentSceneForAdd ? (
                  // 板块入口：场景锁定不可改
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                    {sceneConfig[currentSceneForAdd].label}
                  </div>
                ) : (
                  // 顶部入口：场景可选
                  <select
                    value={newTopicScene}
                    onChange={(e) => setNewTopicScene(e.target.value as SceneType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">请选择场景</option>
                    {Object.entries(sceneConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* 专题名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  专题名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => { setNewTopicName(e.target.value); setNewTopicNameError(''); }}
                  placeholder="请输入专题名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {newTopicNameError && (
                  <p className="mt-1 text-xs text-red-500">{newTopicNameError}</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddTopicDialog(false);
                  setNewTopicName('');
                  setNewTopicNameError('');
                }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddTopic}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发布弹窗 — 复用教材体系 PublishModal 组件 */}
      {selectedTopic && (
        <PublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          currentVersion={currentVersion}
          pendingChanges={
            hasUnpublishedChanges && editChanges.length > 0
              ? editChanges
              : ['专题内容已修改']
          }
          scheduledPublish={scheduledPublish}
        />
      )}

      {/* ========== 编辑态弹窗 — 完全复用教材体系样式 ========== */}

      {/* 从知识树引用知识点弹窗 */}
      {showKnowledgePointSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl w-[900px] h-[600px] overflow-hidden flex flex-col relative">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{kpDialogTitle}</h3>
              <button
                onClick={() => {
                  setShowKnowledgePointSelector(false);
                  setSelectedKnowledgePoints([]);
                  setKnowledgeSearchTerm('');
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
                  data={knowledgeTreeData as any}
                  selectedIds={selectedKnowledgePoints.map(kp => kp.id)}
                  selectedNames={selectedKnowledgePoints.map(kp => kp.name)}
                  selectorType="prerequisite"
                  disabledIds={(() => {
                    const selectedModuleIds = selectedKnowledgePoints
                      .filter(kp => kp.isModule)
                      .map(kp => kp.id);
                    const disabled = getBatchChildIds(knowledgeTreeData as any, selectedModuleIds);
                    return disabled;
                  })()}
                  onSelect={(item: {id: string; name: string; isModule?: boolean}) => {
                    if (item.isModule) {
                      const childIds = getBatchChildIds(knowledgeTreeData as any, [item.id]);
                      const filteredKnowledgePoints = selectedKnowledgePoints.filter(kp => !childIds.includes(kp.id));
                      const newKp = { id: item.id, name: item.name, isModule: item.isModule };
                      setSelectedKnowledgePoints([...filteredKnowledgePoints, newKp]);
                    } else {
                      const newKp = { id: item.id, name: item.name, isModule: item.isModule };
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
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left text-sm font-medium text-gray-700 px-4 py-3 border border-gray-200 w-[180px]">
                          当前子专题名称
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
                            {findSectionById(sections, selectedTopicLevelId)?.name || '当前子专题'}
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
                  setKnowledgeSearchTerm('');
                  setExpandedKnowledgePoints(new Set());
                  setAddingExtendedKpParentId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedTopicLevelId) {
                    const currentSection = findSectionById(sections, selectedTopicLevelId);
                    const oldKpIds = new Set((currentSection?.knowledgePoints || []).map(kp => kp.id));
                    const newKpIds = new Set(selectedKnowledgePoints.map(kp => kp.id));
                    
                    selectedKnowledgePoints.forEach(kp => {
                      if (!oldKpIds.has(kp.id)) addEditChange(`添加知识点：${kp.name}`);
                    });
                    (currentSection?.knowledgePoints || []).forEach(kp => {
                      if (!newKpIds.has(kp.id)) addEditChange(`移除知识点：${kp.name}`);
                    });
                    
                    const updateKnowledgePoints = (secs: TopicSection[]): TopicSection[] => {
                      return secs.map(sec => {
                        if (sec.id === selectedTopicLevelId) {
                          return { ...sec, knowledgePoints: selectedKnowledgePoints };
                        }
                        if (sec.children) {
                          return { ...sec, children: updateKnowledgePoints(sec.children) };
                        }
                        return sec;
                      });
                    };
                    setSections(updateKnowledgePoints(sections));
                    
                    const newExpandedSet = new Set<string>();
                    selectedKnowledgePoints.forEach(kp => newExpandedSet.add(kp.id));
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

      {/* 上传课程弹窗 */}
      {showUploadCourseDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[520px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">上传课程</h3>
              <button onClick={() => setShowUploadCourseDialog(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer mb-4">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">点击或拖拽文件到此区域上传</p>
                <p className="text-xs text-gray-400">支持 MP4、AVI、MOV 格式，单个文件不超过 500MB</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程名称 <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="请输入课程名称" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授课教师</label>
                  <input type="text" placeholder="请输入授课教师" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowUploadCourseDialog(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={() => setShowUploadCourseDialog(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">确认上传</button>
            </div>
          </div>
        </div>
      )}

      {/* 从资源库选择课程弹窗 */}
      {showCourseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] h-[70vh] overflow-visible flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">从资源库选择</h3>
              <button
                onClick={() => { setShowCourseSelector(false); setTempSelectedCourses([]); setCourseSearchTerm(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-1 min-h-0">
              {/* 左侧 - 可选课程 */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">可选视频</div>
                </div>
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索课程名称"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={courseSearchTerm}
                      onChange={(e) => setCourseSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {availableCourses
                    .filter(c => !courseSearchTerm || c.name.includes(courseSearchTerm))
                    .map(course => {
                      const isSelected = tempSelectedCourses.some(c => c.id === course.id);
                      const alreadyExists = findSectionById(sections, selectedTopicLevelId)?.courses?.some(c => c.id === course.id);
                      return (
                        <div key={course.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${alreadyExists ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (alreadyExists) return;
                                if (isSelected) {
                                  setTempSelectedCourses(tempSelectedCourses.filter(c => c.id !== course.id));
                                } else {
                                  setTempSelectedCourses([...tempSelectedCourses, course]);
                                }
                              }}
                              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-blue-400'} ${alreadyExists ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <Video className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{course.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                <span>{course.duration}</span>
                                <span>·</span>
                                <span>{course.teacher}</span>
                              </div>
                            </div>
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="预览">
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* 右侧 - 已选课程 */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">已选视频 ({tempSelectedCourses.length})</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {tempSelectedCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Inbox className="w-12 h-12 mb-2" />
                      <p className="text-sm">请从左侧选择课程</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {tempSelectedCourses.map(course => (
                        <div key={course.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <Video className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{course.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span>{course.duration}</span>
                              <span>·</span>
                              <span>{course.teacher}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setTempSelectedCourses(tempSelectedCourses.filter(c => c.id !== course.id))}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="移除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowCourseSelector(false); setTempSelectedCourses([]); setCourseSearchTerm(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedTopicLevelId && tempSelectedCourses.length > 0) {
                    const currentSection = findSectionById(sections, selectedTopicLevelId);
                    if (currentSection) {
                      const updatedCourses = [...(currentSection.courses || []), ...tempSelectedCourses];
                      const updateSectionCourses = (secs: TopicSection[]): TopicSection[] => {
                        return secs.map(sec => {
                          if (sec.id === selectedTopicLevelId) return { ...sec, courses: updatedCourses };
                          if (sec.children) return { ...sec, children: updateSectionCourses(sec.children) };
                          return sec;
                        });
                      };
                      setSections(updateSectionCourses(sections));
                      tempSelectedCourses.forEach(c => addEditChange(`添加课程：${c.name}`));
                    }
                  }
                  setShowCourseSelector(false);
                  setTempSelectedCourses([]);
                  setCourseSearchTerm('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={tempSelectedCourses.length === 0}
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 从资源库选择试卷弹窗 */}
      {showExamSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[800px] h-[70vh] overflow-visible flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">从资源库选择试卷</h3>
              <button
                onClick={() => { setShowExamSelector(false); setTempSelectedExams([]); setExamSearchKeyword(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-1 min-h-0">
              {/* 左侧 - 可选试卷 */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">可选试卷</div>
                </div>
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索试卷名称"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      value={examSearchKeyword}
                      onChange={(e) => setExamSearchKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {availableExams
                    .filter(e => !examSearchKeyword || e.name.includes(examSearchKeyword))
                    .map(exam => {
                      const isSelected = tempSelectedExams.some(e => e.id === exam.id);
                      const alreadyExists = findSectionById(sections, selectedTopicLevelId)?.exams?.some(e => e.id === exam.id);
                      return (
                        <div key={exam.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${isSelected ? 'bg-amber-50' : ''} ${alreadyExists ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                if (alreadyExists) return;
                                if (isSelected) {
                                  setTempSelectedExams(tempSelectedExams.filter(e => e.id !== exam.id));
                                } else {
                                  setTempSelectedExams([...tempSelectedExams, exam]);
                                }
                              }}
                              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-300 hover:border-amber-400'} ${alreadyExists ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                            <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
                              <ClipboardList className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                <span>{exam.questionCount}题</span>
                                <span>{exam.totalScore}分</span>
                              </div>
                            </div>
                            <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="预览">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* 右侧 - 已选试卷 */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">已选试卷 ({tempSelectedExams.length})</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {tempSelectedExams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Inbox className="w-12 h-12 mb-2" />
                      <p className="text-sm">请从左侧选择试卷</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {tempSelectedExams.map(exam => (
                        <div key={exam.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{exam.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span>{exam.questionCount}题</span>
                              <span>{exam.totalScore}分</span>
                            </div>
                          </div>
                          <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="预览">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTempSelectedExams(tempSelectedExams.filter(e => e.id !== exam.id))}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="移除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowExamSelector(false); setTempSelectedExams([]); setExamSearchKeyword(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (selectedTopicLevelId && tempSelectedExams.length > 0) {
                    // 检查是否有重复试卷名
                    const currentSection = findSectionById(sections, selectedTopicLevelId);
                    const existingNames = new Set((currentSection?.exams || []).map(e => e.name));
                    const dupNames = tempSelectedExams.filter(e => existingNames.has(e.name)).map(e => e.name);
                    if (dupNames.length > 0) {
                      setDuplicateExamNames(dupNames);
                      setShowDuplicateExamDialog(true);
                      return;
                    }
                    executeExamConfirm(false);
                  }
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                disabled={tempSelectedExams.length === 0}
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重复试卷提示弹窗 */}
      {showDuplicateExamDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-[420px]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">重复试卷提示</h3>
              <button onClick={() => setShowDuplicateExamDialog(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">以下试卷在当前子专题中已存在：</p>
                  <div className="mt-2 space-y-1">
                    {duplicateExamNames.map((name, i) => (
                      <p key={i} className="text-sm text-amber-700">· {name}</p>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">是否继续添加（重复试卷将跳过）？</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => { setShowDuplicateExamDialog(false); setShowExamSelector(false); setTempSelectedExams([]); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={() => executeExamConfirm(true)} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">继续添加（跳过重复）</button>
            </div>
          </div>
        </div>
      )}

      {/* 从习题册导入弹窗 */}
      {showWorkbookImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[900px] h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">从习题册导入试卷</h3>
              <button
                onClick={() => { setShowWorkbookImportModal(false); setTempSelectedWorkbooks([]); setWorkbookSearchKeyword(''); setPreviewingWorkbook(null); setSelectedWorkbookSection(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-1 min-h-0">
              {/* 左侧 - 习题册列表 */}
              <div className="w-[280px] border-r border-gray-200 flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">习题册</div>
                </div>
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索习题册名称"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={workbookSearchKeyword}
                      onChange={(e) => setWorkbookSearchKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {availableWorkbooks
                    .filter(wb => !workbookSearchKeyword || wb.name.includes(workbookSearchKeyword))
                    .map(wb => (
                      <div key={wb.id} className="px-3 py-2.5">
                        <div
                          className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm ${previewingWorkbook?.id === wb.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setPreviewingWorkbook(wb); setSelectedWorkbookSection(null); setExpandedWorkbookChapters(new Set()); }}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span className="truncate">{wb.name}</span>
                          </div>
                        </div>
                        {isWorkbookFullyAdded(wb) && (
                          <span className="text-xs text-emerald-600 ml-6">已添加</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              
              {/* 右侧 - 试卷预览 */}
              <div className="flex-1 flex flex-col">
                {previewingWorkbook ? (
                  <>
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <div className="text-sm font-medium text-gray-700">{previewingWorkbook.name}</div>
                    </div>
                    <div className="flex flex-1 min-h-0">
                      {/* 章节树 */}
                      <div className="w-[240px] border-r border-gray-200 overflow-y-auto p-3">
                        {previewingWorkbook.chapters.map(ch => (
                          <div key={ch.id}>
                            <div
                              className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-800"
                              onClick={() => {
                                const newExpanded = new Set(expandedWorkbookChapters);
                                if (newExpanded.has(ch.id)) newExpanded.delete(ch.id);
                                else newExpanded.add(ch.id);
                                setExpandedWorkbookChapters(newExpanded);
                              }}
                            >
                              {expandedWorkbookChapters.has(ch.id) ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                              <Folder className="w-4 h-4 text-amber-500" />
                              <span className="truncate">{ch.name}</span>
                              <span className="text-xs text-gray-400 ml-auto">{ch.children?.length || 0}小节</span>
                            </div>
                            {expandedWorkbookChapters.has(ch.id) && ch.children?.map(sec => (
                              <div
                                key={sec.id}
                                className={`flex items-center gap-1.5 pl-7 pr-2 py-1.5 rounded cursor-pointer text-sm ${selectedWorkbookSection?.id === sec.id ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setSelectedWorkbookSection(sec)}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="truncate">{sec.name}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      {/* 试卷列表 */}
                      <div className="flex-1 overflow-y-auto p-3">
                        {selectedWorkbookSection ? (
                          <>
                            <div className="text-sm font-medium text-gray-700 mb-3">{selectedWorkbookSection.name} - 试卷列表</div>
                            <div className="space-y-2">
                              {selectedWorkbookSection.exams.map(exam => (
                                <div key={exam.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                  <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
                                    <ClipboardList className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{exam.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                      <span>{exam.questionCount}题</span>
                                      <span>{exam.totalScore}分</span>
                                    </div>
                                  </div>
                                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="预览">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              {selectedWorkbookSection.exams.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">该小节暂无试卷</div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText className="w-12 h-12 mb-2" />
                            <p className="text-sm">请从左侧选择小节查看试卷</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <BookOpen className="w-12 h-12 mb-2" />
                    <p className="text-sm">请从左侧选择习题册</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                已选 {tempSelectedWorkbooks.length} 本习题册
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowWorkbookImportModal(false); setTempSelectedWorkbooks([]); setWorkbookSearchKeyword(''); setPreviewingWorkbook(null); setSelectedWorkbookSection(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                {previewingWorkbook && (
                  <button
                    onClick={() => {
                      if (isWorkbookFullyAdded(previewingWorkbook)) {
                        setTempSelectedWorkbooks(tempSelectedWorkbooks.filter(w => w.id !== previewingWorkbook.id));
                      } else {
                        setTempSelectedWorkbooks([...tempSelectedWorkbooks, { id: previewingWorkbook.id, name: previewingWorkbook.name }]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors ${isWorkbookFullyAdded(previewingWorkbook) ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    {isWorkbookFullyAdded(previewingWorkbook) ? '取消选择' : '选择此习题册'}
                  </button>
                )}
                <button
                  onClick={() => executeWorkbookImport(false)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  disabled={tempSelectedWorkbooks.length === 0}
                >
                  确认导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除试卷确认弹窗 */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[420px]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">确认批量删除</h3>
              <button onClick={() => setShowBatchDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">确定要删除选中的试卷吗？</p>
                  <p className="text-xs text-gray-500 mt-1">此操作不可撤销，删除后试卷将从当前子专题中移除</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowBatchDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
              <button
                onClick={() => {
                  if (selectedTopicLevelId) {
                    const updateSectionExams = (secs: TopicSection[]): TopicSection[] => {
                      return secs.map(sec => {
                        if (sec.id === selectedTopicLevelId) {
                          const remaining = (sec.exams || []).filter(e => !selectedExamIds.has(e.id));
                          return { ...sec, exams: remaining };
                        }
                        if (sec.children) return { ...sec, children: updateSectionExams(sec.children) };
                        return sec;
                      });
                    };
                    setSections(updateSectionExams(sections));
                    addEditChange(`批量删除试卷：${selectedExamIds.size}份`);
                  }
                  setShowBatchDeleteConfirm(false);
                  setSelectedExamIds(new Set());
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
