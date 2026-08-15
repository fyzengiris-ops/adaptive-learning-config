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
import PrdTooltip from '@/components/shared/PrdTooltip';
import * as prd10 from '@/data/prd-rules/single-knowledge-1.0';
import * as prd11 from '@/data/prd-rules/single-knowledge-1.1';
import { phaseOptions, getSubjectFilterOptions, getSubjectsByPhase, getPhaseLabel } from '@/data/phase-subject-config';

// 策略类型
type StrategyType = 'general' | 'personalized';

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
  strategyName?: string;
  masteryRanges: MasteryRange[];
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
    masteryRanges: [
      { start: 0, end: 40 },
      { start: 40, end: 70 },
      { start: 70, end: 100 },
    ],
    publishStatus: 'published',
    currentVersion: 'v1.2',
  },
  {
    id: 'general-3',
    name: '初中数学通用出题策略',
    type: 'general',
    phase: '初中',
    subject: '数学',
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
    strategyName: '强化训练策略',
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
    strategyName: '能力提升策略',
    masteryRanges: [
      { start: 40, end: 70 },
      { start: 70, end: 100 },
    ],
    publishStatus: 'pending',
    currentVersion: 'v1.0',
  },
  {
    id: 'personalized-3',
    name: '初中数学快速突破策略',
    type: 'personalized',
    phase: '初中',
    subject: '数学',
    strategyName: '快速突破策略',
    masteryRanges: [
      { start: 70, end: 100 },
    ],
    publishStatus: 'draft',
    currentVersion: 'v0.1',
  },
];

// 策略卡片组件（方案B样式，去年级）
function StrategyCard({ strategy }: { strategy: Strategy }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/adaptive-strategy/strategy/single-knowledge/${strategy.id}`);
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
        <div className="flex items-center justify-end mb-4 gap-1">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle()}`}>
            {getStatusText()}
          </span>
          <PrdTooltip data={prd10.statusTag} />
        </div>

        {/* 主要信息：学段/学科（突出显示，无年级） */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-md border border-emerald-200">
            {strategy.phase}
          </span>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md border border-blue-200">
            {strategy.subject}
          </span>
        </div>

        {/* 策略名称（仅个性化策略显示） */}
        {strategy.type === 'personalized' && strategy.strategyName && (
          <div className="text-center mb-2">
            <span className="text-sm font-medium text-gray-800 truncate block max-w-[220px] mx-auto" title={strategy.strategyName}>
              {strategy.strategyName}
            </span>
          </div>
        )}

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
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <PrdTooltip data={prd10.strategyCard} />
        <PrdTooltip data={prd10.enterManageButton} />
        <button
          onClick={handleClick}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
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

  // 分组tooltip数据
  const groupTooltip = strategyType === 'general' ? prd10.generalGroup : prd10.personalizedGroup;
  const emptyTooltip = strategyType === 'general' ? prd10.generalEmptyState : prd10.personalizedEmptyState;

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
            <PrdTooltip data={groupTooltip} className="ml-1" />
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
            <PrdTooltip data={emptyTooltip} className="ml-1" />
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
function SingleKnowledgeContent() {
  const router = useRouter();

  // 筛选状态
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPhase, setSelectedPhase] = useState('senior');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 类型选项
  const typeOptions = [
    { id: 'all', label: '全部类型' },
    { id: 'general', label: '通用策略' },
    { id: 'personalized', label: '个性化策略' },
  ];

  // 当前学段下的学科筛选选项（含"全部学科"）
  const currentSubjectOptions = useMemo(() => {
    return getSubjectFilterOptions(selectedPhase);
  }, [selectedPhase]);

  // 当前学段下的学科列表（不含"全部学科"）
  const currentSubjects = useMemo(() => {
    return getSubjectsByPhase(selectedPhase);
  }, [selectedPhase]);

  // 根据筛选条件过滤策略
  const filteredStrategies = useMemo(() => {
    return mockStrategies.filter((strategy) => {
      const matchType = selectedType === 'all' || strategy.type === selectedType;
      const matchPhase = strategy.phase === getPhaseLabel(selectedPhase);
      const matchSubject = selectedSubject === 'all' || strategy.subject === currentSubjects.find((s) => s.id === selectedSubject)?.label;

      return matchType && matchPhase && matchSubject;
    });
  }, [selectedType, selectedPhase, selectedSubject, currentSubjects]);

  // 按类型分组
  const generalStrategies = useMemo(() => {
    return filteredStrategies.filter((s) => s.type === 'general');
  }, [filteredStrategies]);

  const personalizedStrategies = useMemo(() => {
    return filteredStrategies.filter((s) => s.type === 'personalized');
  }, [filteredStrategies]);

  // 新增通用策略
  const handleAddGeneral = () => {
    router.push('/adaptive-strategy/strategy/single-knowledge/new?type=general');
  };

  // 新增个性化策略
  const handleAddPersonalized = () => {
    router.push('/adaptive-strategy/strategy/single-knowledge/new?type=personalized');
  };

  // 查看历史发布记录
  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  // 获取历史发布记录数据（方案B格式，去年级）
  const getHistoryData = (): AggregateHistoryItem[] => {
    return [
      {
        id: '1',
        moduleName: '高中 · 数学',
        moduleTags: ['通用策略'],
        version: 'v1.2',
        description: '优化题目难度分布比例，增加中档题比例',
        publishTime: '2024-01-20 10:00',
        publisher: '王老师',
        publisherAccount: '234567',
      },
      {
        id: '2',
        moduleName: '高中 · 数学',
        moduleTags: ['通用策略'],
        version: 'v1.0',
        description: '初始版本，定义高中数学通用策略',
        publishTime: '2024-01-15 09:00',
        publisher: '李老师',
        publisherAccount: '345678',
      },
      {
        id: '3',
        moduleName: '初中 · 数学',
        moduleTags: ['通用策略'],
        version: 'v1.1',
        description: '新增覆盖区间配置，优化出题策略',
        publishTime: '2024-01-10 09:00',
        publisher: '管理员',
        publisherAccount: '000001',
      },
      {
        id: '4',
        moduleName: '高中 · 数学 · 强化训练策略',
        moduleTags: ['个性化策略'],
        version: 'v2.0',
        description: '优化个性化出题策略，提升针对性训练效果',
        publishTime: '2024-01-08 14:00',
        publisher: '张老师',
        publisherAccount: '456789',
      },
    ];
  };

  // 历史记录筛选配置（去年级筛选，新增类型筛选）
  const historyFilterConfig = {
    showTypeFilter: true,
    showPhaseFilter: true,
    showSubjectFilter: true,
    showGradeFilter: false,
    typeOptions: [
      { id: 'general', label: '通用策略' },
      { id: 'personalized', label: '个性化策略' },
    ],
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
          策略管理 / 策略广场 / 单知识点出题
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
                  <h1 className="text-xl font-bold text-gray-900">单知识点出题<PrdTooltip data={prd10.pageHeader} className="ml-1" /></h1>
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
            <PrdTooltip data={prd10.historyEntry} />
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-6">
              {/* 类型选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">类型：</span>
                <PrdTooltip data={prd10.typeFilter} />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {typeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 学段选择 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">学段：</span>
                <PrdTooltip data={prd10.phaseFilter} />
                <select
                  value={selectedPhase}
                  onChange={(e) => {
                    setSelectedPhase(e.target.value);
                    setSelectedSubject('all'); // 学段切换时重置学科为"全部学科"
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
                <PrdTooltip data={prd10.subjectFilter} />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {currentSubjectOptions.map((option) => (
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
          {/* 通用策略分组 - 选择个性化策略时隐藏整个模块 */}
          {(selectedType === 'all' || selectedType === 'general') && (
            <StrategyGroup
              strategyType="general"
              strategies={generalStrategies}
              onAddNew={handleAddGeneral}
            />
          )}

          {/* 个性化策略分组 - 选择通用策略时隐藏整个模块 */}
          {(selectedType === 'all' || selectedType === 'personalized') && (
            <StrategyGroup
              strategyType="personalized"
              strategies={personalizedStrategies}
              onAddNew={handleAddPersonalized}
            />
          )}
        </div>
      </div>

      {/* 历史发布记录弹窗 */}
      <AggregateHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="历史发布记录"
        data={getHistoryData()}
        filterConfig={historyFilterConfig}
        tooltipConfig={{
          modalHeader: prd11.modalHeader,
          typeFilter: prd11.typeFilter,
          phaseFilter: prd11.phaseFilter,
          subjectFilter: prd11.subjectFilter,
          keywordSearch: prd11.keywordSearch,
          historyList: prd11.historyList,
          recordItem: prd11.recordItem,
          closeButton: prd11.closeButton,
          emptyNoRecords: prd11.emptyNoRecords,
          emptyNoMatch: prd11.emptyNoMatch,
        }}
      />
    </PageLayout>
  );
}

// 导出页面组件
export default function SingleKnowledgePage() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <SingleKnowledgeContent />
    </React.Suspense>
  );
}
