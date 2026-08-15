'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  BookOpen,
  Sparkles,
  ArrowLeft,
  History,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/shared/PageLayout';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';

// 策略类型
type StrategyType = 'general' | 'personalized';

// 学段配置
const phaseOptions = [
  { id: 'senior', label: '高中' },
  { id: 'junior', label: '初中' },
  { id: 'primary', label: '小学' },
];

// 学科配置
const subjectOptions = [
  { id: 'math', label: '数学' },
  { id: 'chinese', label: '语文' },
  { id: 'english', label: '英语' },
  { id: 'physics', label: '物理' },
  { id: 'chemistry', label: '化学' },
  { id: 'biology', label: '生物' },
];

// 年级配置
const gradeOptions: Record<string, { id: string; label: string }[]> = {
  senior: [
    { id: 'g1', label: '高一' },
    { id: 'g2', label: '高二' },
    { id: 'g3', label: '高三' },
  ],
  junior: [
    { id: 'g1', label: '初一' },
    { id: 'g2', label: '初二' },
    { id: 'g3', label: '初三' },
  ],
  primary: [
    { id: 'g1', label: '一年级' },
    { id: 'g2', label: '二年级' },
    { id: 'g3', label: '三年级' },
    { id: 'g4', label: '四年级' },
    { id: 'g5', label: '五年级' },
    { id: 'g6', label: '六年级' },
  ],
};

// 掌握度区间类型
interface MasteryRange {
  start: number;
  end: number;
}

// 策略数据类型
interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  phase: string;
  subject: string;
  grade: string;
  masteryRanges: MasteryRange[];  // 支持多个掌握度区间
  publishStatus: 'published' | 'pending' | 'draft';
  currentVersion: string;
}

// 策略类型样式
const strategyStyles: Record<StrategyType, { bgColor: string; icon: React.ReactNode }> = {
  general: {
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    icon: <BookOpen className="w-6 h-6 text-white" />,
  },
  personalized: {
    bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    icon: <Sparkles className="w-6 h-6 text-white" />,
  },
};

// 策略类型名称
const strategyTypeNames: Record<StrategyType, string> = {
  general: '通用策略',
  personalized: '个性化策略',
};

// 模拟策略数据
const mockStrategies: Strategy[] = [
  // 通用策略
  {
    id: 'general-1',
    name: '高中数学通用出题策略',
    type: 'general',
    phase: '高中',
    subject: '数学',
    grade: '高一',
    masteryRanges: [
      { start: 0, end: 40 },
      { start: 40, end: 70 },
    ],
    publishStatus: 'published',
    currentVersion: 'v1.2',
  },
  {
    id: 'general-2',
    name: '高中数学通用出题策略',
    type: 'general',
    phase: '高中',
    subject: '数学',
    grade: '高二',
    masteryRanges: [
      { start: 70, end: 100 },
    ],
    publishStatus: 'pending',
    currentVersion: 'v1.0',
  },
  {
    id: 'general-3',
    name: '高中数学通用出题策略',
    type: 'general',
    phase: '高中',
    subject: '数学',
    grade: '高三',
    masteryRanges: [
      { start: 0, end: 30 },
      { start: 30, end: 60 },
      { start: 60, end: 100 },
    ],
    publishStatus: 'published',
    currentVersion: 'v1.1',
  },
  // 个性化策略
  {
    id: 'personalized-1',
    name: '高中数学强化训练策略',
    type: 'personalized',
    phase: '高中',
    subject: '数学',
    grade: '高一',
    masteryRanges: [
      { start: 0, end: 40 },
    ],
    publishStatus: 'published',
    currentVersion: 'v2.0',
  },
  {
    id: 'personalized-2',
    name: '高中数学能力提升策略',
    type: 'personalized',
    phase: '高中',
    subject: '数学',
    grade: '高二',
    masteryRanges: [
      { start: 40, end: 70 },
      { start: 70, end: 100 },
    ],
    publishStatus: 'pending',
    currentVersion: 'v1.0',
  },
  {
    id: 'personalized-3',
    name: '高中数学快速突破策略',
    type: 'personalized',
    phase: '高中',
    subject: '数学',
    grade: '高三',
    masteryRanges: [
      { start: 70, end: 100 },
    ],
    publishStatus: 'draft',
    currentVersion: 'v0.1',
  },
];

// 策略卡片组件
function StrategyCard({ strategy }: { strategy: Strategy }) {
  const router = useRouter();
  const style = strategyStyles[strategy.type];

  const handleClick = () => {
    router.push(`/adaptive-strategy/strategy/single-knowledge-b/${strategy.id}`);
  };

  // 状态标签样式
  const getStatusStyle = () => {
    switch (strategy.publishStatus) {
      case 'published':
        return 'text-emerald-600 bg-emerald-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'draft':
        return 'text-gray-500 bg-gray-50';
    }
  };

  // 状态标签文字
  const getStatusText = () => {
    switch (strategy.publishStatus) {
      case 'published':
        return '已发布';
      case 'pending':
        return '待发布';
      case 'draft':
        return '草稿';
    }
  };

  // 格式化掌握度区间显示
  const formatMasteryRanges = () => {
    return strategy.masteryRanges
      .map((r) => `${r.start}%-${r.end}%`)
      .join('、');
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-300 relative overflow-hidden"
      style={{ width: '280px' }}
    >
      {/* 卡片内容 */}
      <div className="p-5 pb-3">
        {/* 顶部：状态标签 */}
        <div className="flex items-center justify-end mb-4">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* 主要信息：学段/学科/年级（突出显示） */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-md border border-emerald-200">
            {strategy.phase}
          </span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md border border-blue-200">
            {strategy.subject}
          </span>
          <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-sm font-semibold rounded-md border border-cyan-200">
            {strategy.grade}
          </span>
        </div>

        {/* 版本号 */}
        <div className="text-center mb-4">
          <span className="text-gray-400 text-xs">{strategy.currentVersion}</span>
        </div>

        {/* 辅助信息：覆盖区间（卡片样式） */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="text-xs text-gray-400 mb-1.5">覆盖区间</div>
          <div className="text-sm text-gray-700 font-medium">
            {formatMasteryRanges()}
          </div>
        </div>
      </div>

      {/* 底部：进入管理按钮 */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
        >
          进入管理
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 策略分组组件
function StrategyGroup({
  strategyType,
  strategies,
  onAddNew,
}: {
  strategyType: StrategyType;
  strategies: Strategy[];
  onAddNew: () => void;
}) {
  const style = strategyStyles[strategyType];
  const groupName = strategyTypeNames[strategyType];

  // 空状态文案
  const emptyText = strategyType === 'general'
    ? '暂无通用策略'
    : '暂无个性化策略';
  const emptyDesc = strategyType === 'general'
    ? '请先创建通用策略，用于配置常规知识点的默认出题规则'
    : '可按需创建个性化策略，用于特殊知识点的出题规则配置';
  const emptyBtnText = strategyType === 'general'
    ? '新建通用策略'
    : '新建个性化策略';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 分组标题栏 */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bgColor}`}>
            {style.icon}
          </div>
          <div>
            <span className="font-semibold text-gray-900">{groupName}</span>
            <span className="text-sm text-gray-400 ml-2">({strategies.length}个策略)</span>
          </div>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* 策略卡片列表 */}
      <div className="p-5">
        {strategies.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {strategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${style.bgColor} opacity-50`}>
              {style.icon}
            </div>
            <p className="text-gray-600 font-medium mb-1">{emptyText}</p>
            <p className="text-sm text-gray-400 mb-4">{emptyDesc}</p>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {emptyBtnText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 加载中组件
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <span className="ml-3 text-gray-500">加载中...</span>
    </div>
  );
}

// 主内容组件
function SingleKnowledgeBContent() {
  const router = useRouter();

  // 筛选状态
  const [selectedPhase, setSelectedPhase] = useState('senior');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 获取当前学段对应的年级选项
  const currentGradeOptions = gradeOptions[selectedPhase] || [];

  // 根据筛选条件过滤策略
  const filteredStrategies = useMemo(() => {
    return mockStrategies.filter((strategy) => {
      const phaseLabel = phaseOptions.find((p) => p.id === selectedPhase)?.label;
      const subjectLabel = subjectOptions.find((s) => s.id === selectedSubject)?.label;
      const gradeLabel = selectedGrade === 'all' 
        ? null 
        : currentGradeOptions.find((g) => g.id === selectedGrade)?.label;

      const matchPhase = strategy.phase === phaseLabel;
      const matchSubject = strategy.subject === subjectLabel;
      const matchGrade = !gradeLabel || strategy.grade === gradeLabel;

      return matchPhase && matchSubject && matchGrade;
    });
  }, [selectedPhase, selectedSubject, selectedGrade, currentGradeOptions]);

  // 按类型分组
  const generalStrategies = useMemo(() => {
    return filteredStrategies.filter((s) => s.type === 'general');
  }, [filteredStrategies]);

  const personalizedStrategies = useMemo(() => {
    return filteredStrategies.filter((s) => s.type === 'personalized');
  }, [filteredStrategies]);

  // 新增通用策略
  const handleAddGeneral = () => {
    router.push('/adaptive-strategy/strategy/single-knowledge-b/new?type=general');
  };

  // 新增个性化策略
  const handleAddPersonalized = () => {
    router.push('/adaptive-strategy/strategy/single-knowledge-b/new?type=personalized');
  };

  // 查看历史发布记录
  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  // 获取历史发布记录数据
  const getHistoryData = (): AggregateHistoryItem[] => {
    return [
      {
        id: '1',
        moduleName: '高中 · 数学 · 高一',
        moduleTags: ['通用策略'],
        version: 'v1.2',
        description: '优化题目难度分布比例，增加中档题比例',
        publishTime: '2024-01-20 10:00',
        publisher: '王老师',
        publisherAccount: '234567',
      },
      {
        id: '2',
        moduleName: '高中 · 数学 · 高二',
        moduleTags: ['通用策略'],
        version: 'v1.0',
        description: '初始版本，定义高中数学通用策略',
        publishTime: '2024-01-15 09:00',
        publisher: '李老师',
        publisherAccount: '345678',
      },
      {
        id: '3',
        moduleName: '高中 · 数学 · 高三',
        moduleTags: ['通用策略'],
        version: 'v1.0',
        description: '初始版本，定义高中数学通用策略',
        publishTime: '2024-01-10 09:00',
        publisher: '管理员',
        publisherAccount: '000001',
      },
      {
        id: '4',
        moduleName: '高中 · 数学 · 高一',
        moduleTags: ['个性化策略'],
        version: 'v2.0',
        description: '优化个性化出题策略，提升针对性训练效果',
        publishTime: '2024-01-08 14:00',
        publisher: '张老师',
        publisherAccount: '456789',
      },
    ];
  };

  // 历史记录筛选配置
  const historyFilterConfig = {
    showPhaseFilter: true,
    showSubjectFilter: true,
    showGradeFilter: true,
    phaseOptions: [
      { id: 'primary', label: '小学' },
      { id: 'junior', label: '初中' },
      { id: 'senior', label: '高中' },
    ],
    subjectOptions: [
      { id: 'math', label: '数学' },
      { id: 'chinese', label: '语文' },
      { id: 'english', label: '英语' },
      { id: 'physics', label: '物理' },
      { id: 'chemistry', label: '化学' },
    ],
    gradeOptions: [
      { id: 'grade1', label: '一年级' },
      { id: 'grade2', label: '二年级' },
      { id: 'grade3', label: '三年级' },
      { id: 'grade7', label: '七年级' },
      { id: 'grade8', label: '八年级' },
      { id: 'grade9', label: '九年级' },
      { id: 'grade10', label: '高一' },
      { id: 'grade11', label: '高二' },
      { id: 'grade12', label: '高三' },
    ],
  };

  // 返回上一页
  const handleBack = () => {
    router.push('/adaptive-strategy');
  };

  return (
    <PageLayout activeMenuId="adaptive-strategy">
      <div className="min-h-screen bg-gray-50">
        {/* 面包屑 */}
        <div className="px-6 py-3 text-sm text-gray-500">
          策略管理 / 策略广场 / 单知识点出题（备选方案）
        </div>

        {/* 页面头部 */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">单知识点出题（备选方案）</h1>
                  <p className="text-sm text-gray-500">维护单知识点出题策略，支持通用策略与个性化策略的统一管理</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleViewHistory}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              <History className="w-4 h-4" />
              查看历史发布记录
            </button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-6">
              {/* 学段选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">学段：</span>
                <select
                  value={selectedPhase}
                  onChange={(e) => {
                    setSelectedPhase(e.target.value);
                    setSelectedGrade('all'); // 切换学段时重置年级
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {phaseOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 学科选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">学科：</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {subjectOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 年级选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">年级：</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">全部</option>
                  {currentGradeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 策略分组区域 */}
        <div className="px-6 pb-6 space-y-4">
          {/* 通用策略分组 */}
          <StrategyGroup
            strategyType="general"
            strategies={generalStrategies}
            onAddNew={handleAddGeneral}
          />

          {/* 个性化策略分组 */}
          <StrategyGroup
            strategyType="personalized"
            strategies={personalizedStrategies}
            onAddNew={handleAddPersonalized}
          />
        </div>
      </div>

      {/* 历史发布记录弹窗 */}
      <AggregateHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="历史发布记录"
        data={getHistoryData()}
        filterConfig={historyFilterConfig}
      />
    </PageLayout>
  );
}

// 导出页面组件
export default function SingleKnowledgeBPage() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <SingleKnowledgeBContent />
    </React.Suspense>
  );
}
