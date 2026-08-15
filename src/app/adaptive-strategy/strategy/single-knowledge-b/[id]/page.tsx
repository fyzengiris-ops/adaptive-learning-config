'use client';

import React, { useState, useMemo, Suspense } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  History,
  Loader2,
  AlertCircle,
  Edit3,
  Check,
  HelpCircle,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/shared/PageLayout';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';

// 学段选项
const phaseOptions = [
  { id: 'primary', label: '小学' },
  { id: 'junior', label: '初中' },
  { id: 'senior', label: '高中' },
];

// 学科选项
const subjectOptions = [
  { id: 'chinese', label: '语文' },
  { id: 'math', label: '数学' },
  { id: 'english', label: '英语' },
  { id: 'physics', label: '物理' },
  { id: 'chemistry', label: '化学' },
  { id: 'biology', label: '生物' },
];

// 年级选项（根据学段动态变化）
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

// 难度等级
const difficultyLevels = [
  { id: 'easy', label: '易' },
  { id: 'easier', label: '较易' },
  { id: 'medium', label: '中档' },
  { id: 'harder', label: '较难' },
  { id: 'hard', label: '难' },
];

// 题型分布选项
const questionTypeDistributionOptions = [
  { id: 'all-objective', label: '全部客观题' },
  { id: 'priority-objective', label: '优先客观题' },
  { id: 'priority-subjective', label: '优先主观题' },
  { id: 'all-subjective', label: '全主观题' },
  { id: 'unlimited', label: '不限题型' },
];

// 年份范围选项
const yearRangeOptions = [
  { id: 'recent-3', label: '近3年' },
  { id: 'recent-5', label: '近5年' },
  { id: 'unlimited', label: '不限' },
];

// 难度分布类型
interface DifficultyDistribution {
  easy: number;
  easier: number;
  medium: number;
  harder: number;
  hard: number;
}

// 题目配置项（方案B：掌握度区间在行级）
interface QuestionConfig {
  id: string;
  masteryStart: number;      // 掌握度开始区间
  masteryEnd: number;        // 掌握度结束区间
  questionCount: number;     // 题目数量
  difficulty: DifficultyDistribution;  // 题目难度分布
  questionTypeDistribution: string;    // 题型分布
  yearRange: string;         // 年份范围
}

// 表单数据（方案B：无全局掌握度区间）
interface FormData {
  phase: string;
  subject: string;
  grade: string;
  questionConfigs: QuestionConfig[];
}

// 模拟策略数据
const mockStrategyData: Record<string, {
  name: string;
  phase: string;
  subject: string;
  grade: string;
  version: string;
  questionConfigs: QuestionConfig[];
}> = {
  'general-1': {
    name: '高中数学通用策略',
    phase: 'senior',
    subject: 'math',
    grade: 'g1',
    version: 'v1.2',
    questionConfigs: [
      {
        id: 'qc-1',
        masteryStart: 0,
        masteryEnd: 40,
        questionCount: 10,
        difficulty: { easy: 2, easier: 3, medium: 3, harder: 1, hard: 1 },
        questionTypeDistribution: 'all-objective',
        yearRange: 'recent-3',
      },
      {
        id: 'qc-2',
        masteryStart: 40,
        masteryEnd: 70,
        questionCount: 8,
        difficulty: { easy: 1, easier: 2, medium: 3, harder: 1, hard: 1 },
        questionTypeDistribution: 'priority-objective',
        yearRange: 'recent-5',
      },
    ],
  },
  'general-2': {
    name: '高中数学通用策略',
    phase: 'senior',
    subject: 'math',
    grade: 'g1',
    version: 'v1.0',
    questionConfigs: [
      {
        id: 'qc-1',
        masteryStart: 70,
        masteryEnd: 100,
        questionCount: 5,
        difficulty: { easy: 0, easier: 1, medium: 2, harder: 1, hard: 1 },
        questionTypeDistribution: 'unlimited',
        yearRange: 'unlimited',
      },
    ],
  },
};

// 初始表单数据
const getInitialFormData = (strategyId: string): FormData => {
  const data = mockStrategyData[strategyId];
  if (data) {
    return {
      phase: data.phase,
      subject: data.subject,
      grade: data.grade,
      questionConfigs: data.questionConfigs,
    };
  }
  return {
    phase: 'senior',
    subject: 'math',
    grade: 'g1',
    questionConfigs: [
      {
        id: `qc-${Date.now()}`,
        masteryStart: 0,
        masteryEnd: 40,
        questionCount: 10,
        difficulty: { easy: 2, easier: 2, medium: 3, harder: 2, hard: 1 },
        questionTypeDistribution: 'all-objective',
        yearRange: 'recent-3',
      },
    ],
  };
};

// 表单区块组件
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}

// 表单项组件（左右布局）
function FormItem({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center py-1">
      <div className="w-[100px] flex-shrink-0 text-right pr-3">
        <label className="text-sm text-gray-600 inline-flex items-center justify-end gap-0.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      </div>
      <div className="flex-1">
        {children}
        {error && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
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

// 主内容组件 - 方案B
function SingleKnowledgeBDetailContent() {
  const router = useRouter();
  const params = useParams();
  const strategyId = params.id as string;

  // 获取策略数据
  const strategyInfo = mockStrategyData[strategyId];

  // 页面状态
  const [isViewMode, setIsViewMode] = useState(strategyId !== 'new'); // 新增时可编辑，查看时只读
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // 是否有待发布的变更
  const [savedStrategyId, setSavedStrategyId] = useState<string | null>(null); // 保存后的策略ID

  // 发布弹窗状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('02:00');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [currentVersion, setCurrentVersion] = useState('v1.0');
  const [scheduledPublish, setScheduledPublish] = useState<{
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
  } | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(strategyId));

  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取当前学段对应的年级选项
  const currentGradeOptions = gradeOptions[formData.phase] || [];

  // 更新字段
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除对应错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 添加新的题目配置
  const addQuestionConfig = () => {
    const newConfig: QuestionConfig = {
      id: `qc-${Date.now()}`,
      masteryStart: 0,
      masteryEnd: 40,
      questionCount: 5,
      difficulty: { easy: 1, easier: 1, medium: 1, harder: 1, hard: 1 },
      questionTypeDistribution: 'unlimited',
      yearRange: 'unlimited',
    };
    updateField('questionConfigs', [...formData.questionConfigs, newConfig]);
  };

  // 删除题目配置
  const removeQuestionConfig = (id: string) => {
    if (formData.questionConfigs.length <= 1) return;
    updateField(
      'questionConfigs',
      formData.questionConfigs.filter((config) => config.id !== id)
    );
  };

  // 更新题目配置
  const updateQuestionConfig = (id: string, field: keyof QuestionConfig, value: string | number) => {
    updateField(
      'questionConfigs',
      formData.questionConfigs.map((config) =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  // 更新难度分布
  const updateDifficulty = (configId: string, level: keyof DifficultyDistribution, value: number) => {
    updateField(
      'questionConfigs',
      formData.questionConfigs.map((config) =>
        config.id === configId
          ? { ...config, difficulty: { ...config.difficulty, [level]: value } }
          : config
      )
    );
  };

  // 计算难度分布总和
  const calculateDifficultySum = (config: QuestionConfig) => {
    return (
      config.difficulty.easy +
      config.difficulty.easier +
      config.difficulty.medium +
      config.difficulty.harder +
      config.difficulty.hard
    );
  };

  // 检查掌握度区间是否有重叠（不同行之间的区间不能重叠）
  const checkMasteryRangeDuplicate = () => {
    const configs = formData.questionConfigs;
    for (let i = 0; i < configs.length; i++) {
      for (let j = i + 1; j < configs.length; j++) {
        const range1 = configs[i];
        const range2 = configs[j];
        // 两个区间 [a1, b1] 和 [a2, b2] 重叠的条件是：a1 < b2 && a2 < b1
        if (range1.masteryStart < range2.masteryEnd && range2.masteryStart < range1.masteryEnd) {
          return true; // 存在重叠
        }
      }
    }
    return false;
  };

  // 表单校验
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phase) newErrors.phase = '请选择学段';
    if (!formData.subject) newErrors.subject = '请选择学科';
    if (!formData.grade) newErrors.grade = '请选择年级';

    // 校验掌握度区间唯一性（不同行之间的区间不能重叠）
    if (checkMasteryRangeDuplicate()) {
      newErrors.masteryRangeDuplicate = '掌握区间范围有重叠，请调整后再保存';
    }

    // 校验每个配置项
    formData.questionConfigs.forEach((config, index) => {
      // 校验掌握度区间范围
      if (config.masteryStart < 0 || config.masteryStart > 100) {
        newErrors[`config-${index}-masteryStart`] = '开始区间必须在0-100之间';
      }
      if (config.masteryEnd < 0 || config.masteryEnd > 100) {
        newErrors[`config-${index}-masteryEnd`] = '结束区间必须在0-100之间';
      }
      if (config.masteryEnd <= config.masteryStart) {
        newErrors[`config-${index}-masteryEnd`] = '结束区间必须大于开始区间';
      }

      // 校验题目数量
      if (!config.questionCount || config.questionCount <= 0) {
        newErrors[`config-${index}-questionCount`] = '题目数量必须大于0';
      }

      // 校验难度分布
      const difficultySum = calculateDifficultySum(config);
      if (difficultySum !== config.questionCount) {
        newErrors[`config-${index}-difficulty`] = '难度分布总和必须等于题目数量';
      }

      // 校验题型分布
      if (!config.questionTypeDistribution) {
        newErrors[`config-${index}-questionTypeDistribution`] = '请选择题型分布';
      }

      // 校验年份范围
      if (!config.yearRange) {
        newErrors[`config-${index}-yearRange`] = '请选择年份范围';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存
  const handleSave = () => {
    if (!validateForm()) return;
    // TODO: 保存逻辑
    console.log('保存数据:', formData);
    
    // 保存后切换到只读模式，并标记有待发布变更
    setSavedStrategyId(strategyId);
    setHasUnsavedChanges(true);
    setIsViewMode(true);
  };

  // 编辑
  const handleEdit = () => {
    setIsViewMode(false);
  };

  // 返回 - 返回到方案B的一级页面
  const handleBack = () => {
    router.push('/adaptive-strategy/strategy/single-knowledge-b');
  };

  // 查看历史发布记录
  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  // 发布
  const handlePublish = () => {
    if (!releaseNotes.trim()) {
      alert('请填写更新说明');
      return;
    }

    const newVersion = generateNewVersion();

    if (publishType === 'scheduled') {
      // 定时发布
      setScheduledPublish({
        version: newVersion,
        scheduledDate,
        scheduledTime,
        description: releaseNotes,
      });
      setHasUnsavedChanges(false);
      setCurrentVersion(newVersion);
    } else {
      // 立即发布
      setHasUnsavedChanges(false);
      setCurrentVersion(newVersion);
    }

    setShowPublishModal(false);
    setReleaseNotes('');
    setPublishType('immediate');
    setScheduledDate('');
    setScheduledTime('02:00');
  };

  // 生成新版本号
  const generateNewVersion = () => {
    const current = currentVersion || 'v1.0';
    const match = current.match(/v(\d+)\.(\d+)/);
    if (match) {
      const minor = parseInt(match[2]) + 1;
      return `v${match[1]}.${minor}`;
    }
    return 'v1.1';
  };

  // 打开发布弹窗
  const openPublishModal = () => {
    setPublishType('immediate');
    setReleaseNotes('');
    setScheduledDate('');
    setScheduledTime('02:00');
    setShowPublishModal(true);
  };

  // 获取策略历史记录
  const getStrategyHistory = () => {
    // 策略历史记录数据（模拟）
    const historyData: Record<string, { version: string; description: string; publishTime: string; publisher: string; publisherAccount: string }[]> = {
      'general-1': [
        { version: 'v1.2', description: '优化题目难度分布比例', publishTime: '2024-01-20 10:00', publisher: '王老师', publisherAccount: '234567' },
        { version: 'v1.1', description: '调整掌握度区间范围', publishTime: '2024-01-15 09:00', publisher: '李老师', publisherAccount: '345678' },
        { version: 'v1.0', description: '初始版本，定义高中数学通用策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'general-2': [
        { version: 'v1.0', description: '初始版本，定义高中数学通用策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
    };
    return historyData[strategyId] || [];
  };

  // 获取标签文本
  const getLabelById = (options: { id: string; label: string }[], id: string) => {
    return options.find(opt => opt.id === id)?.label || id;
  };

  return (
    <PageLayout activeMenuId="adaptive-strategy">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 面包屑 */}
        <div className="px-6 py-3 text-sm text-gray-500 bg-white border-b border-gray-200">
          策略管理 / 策略广场 / 单知识点出题（备选方案） / {strategyInfo?.name || '通用策略详情'}
        </div>

        {/* 页面头部 */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                {strategyInfo?.name || '通用策略详情'}（备选方案）
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">版本：{strategyInfo?.version || 'v1.0'}</span>
              <button
                onClick={handleViewHistory}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 待发布状态条 */}
        {hasUnsavedChanges && isViewMode && savedStrategyId && (
          <div className="bg-amber-50 mx-6 mt-4 rounded-lg px-4 py-3 flex-shrink-0 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  该策略有变更，需要发布后才能生效
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openPublishModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 定时发布状态条 */}
        {scheduledPublish && !hasUnsavedChanges && isViewMode && savedStrategyId && (
          <div className="bg-blue-50 mx-6 mt-4 rounded-lg px-4 py-3 flex-shrink-0 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <span className="font-medium">{scheduledPublish.version}</span> 版本将于您设定的时间（
                  <span className="font-medium">{scheduledPublish.scheduledDate} {scheduledPublish.scheduledTime}</span>）自动发布
                </span>
              </div>
              <button
                onClick={() => {
                  setScheduledPublish(null);
                  setHasUnsavedChanges(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                取消定时
              </button>
            </div>
          </div>
        )}

        {/* 表单内容 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {/* 基础信息 */}
            <FormSection title="基础信息">
              <FormItem label="学段" required error={!isViewMode ? errors.phase : undefined}>
                {isViewMode ? (
                  <span className="text-sm text-gray-900">{getLabelById(phaseOptions, formData.phase)}</span>
                ) : (
                  <select
                    value={formData.phase}
                    onChange={(e) => {
                      updateField('phase', e.target.value);
                      updateField('grade', ''); // 切换学段时重置年级
                    }}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {phaseOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </FormItem>

              <FormItem label="学科" required error={!isViewMode ? errors.subject : undefined}>
                {isViewMode ? (
                  <span className="text-sm text-gray-900">{getLabelById(subjectOptions, formData.subject)}</span>
                ) : (
                  <select
                    value={formData.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {subjectOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </FormItem>

              <FormItem label="年级" required error={!isViewMode ? errors.grade : undefined}>
                {isViewMode ? (
                  <span className="text-sm text-gray-900">{getLabelById(currentGradeOptions, formData.grade)}</span>
                ) : (
                  <select
                    value={formData.grade}
                    onChange={(e) => updateField('grade', e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="">请选择</option>
                    {currentGradeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </FormItem>
            </FormSection>

            {/* 题目组成配置 - 方案B新表格 */}
            <FormSection title="题目组成配置">
              {/* 区间重复提示 */}
              {errors.masteryRangeDuplicate && !isViewMode && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{errors.masteryRangeDuplicate}</span>
                </div>
              )}

              <table className="border-collapse w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {/* 第1列：掌握度区间 */}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-[8.5rem]">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">掌握度区间</span>
                        <div className="flex justify-center gap-1">
                          <span className="text-[10px] text-gray-500">开始</span>
                          <span className="text-[10px] text-gray-400">-</span>
                          <span className="text-[10px] text-gray-500">结束</span>
                        </div>
                      </div>
                    </th>
                    {/* 第2列：题目数量 */}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-20">
                      题目数量
                    </th>
                    {/* 第3列：题目难度分布 */}
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-[10rem]">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">题目难度分布</span>
                        <div className="flex justify-center gap-1">
                          {difficultyLevels.map((level) => (
                            <span key={level.id} className="w-10 text-center text-[10px] font-medium text-gray-500">
                              {level.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </th>
                    {/* 第4列：题型分布 */}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-[11rem]">
                      <div className="flex items-center justify-center gap-1">
                        <span>题型分布</span>
                        <div className="relative group">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                            <div className="space-y-1.5">
                              <div><span className="font-medium text-emerald-300">优先客观题：</span>系统在按配置规则找题时，将优先在客观题中找题，若题量不够，将从主观题里找题</div>
                              <div><span className="font-medium text-emerald-300">优先主观题：</span>系统在按配置规则找题时，将优先在主观题中找题，若题量不够，将从客观题里找题</div>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                    {/* 第5列：年份范围 */}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-24">
                      年份范围
                    </th>
                    {/* 操作列 */}
                    {!isViewMode && (
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-16">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formData.questionConfigs.map((config, index) => {
                    const difficultySum = calculateDifficultySum(config);

                    return (
                      <tr key={config.id} className="bg-white hover:bg-gray-50">
                        {/* 第1列：掌握度区间 */}
                        <td className="px-2 py-2 border border-gray-200">
                          {isViewMode ? (
                            <div className="text-center text-sm text-gray-900">
                              {config.masteryStart}% - {config.masteryEnd}%
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                value={config.masteryStart}
                                onChange={(e) => updateQuestionConfig(config.id, 'masteryStart', parseInt(e.target.value) || 0)}
                                min={0}
                                max={100}
                                className="w-12 px-1 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-gray-400">%</span>
                              <span className="text-xs text-gray-400 mx-0.5">-</span>
                              <input
                                type="number"
                                value={config.masteryEnd}
                                onChange={(e) => updateQuestionConfig(config.id, 'masteryEnd', parseInt(e.target.value) || 0)}
                                min={0}
                                max={100}
                                className="w-12 px-1 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                          )}
                        </td>

                        {/* 第2列：题目数量 */}
                        <td className="px-2 py-2 border border-gray-200 text-center">
                          {isViewMode ? (
                            <span className="text-sm text-gray-900">{config.questionCount}</span>
                          ) : (
                            <input
                              type="number"
                              value={config.questionCount}
                              onChange={(e) => updateQuestionConfig(config.id, 'questionCount', parseInt(e.target.value) || 0)}
                              min={1}
                              className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          )}
                        </td>

                        {/* 第3列：题目难度分布 */}
                        <td className="px-2 py-2 border border-gray-200">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-1">
                              {difficultyLevels.map((level) => (
                                isViewMode ? (
                                  <span key={level.id} className="w-10 text-center text-xs text-gray-900">
                                    {config.difficulty[level.id as keyof DifficultyDistribution]}
                                  </span>
                                ) : (
                                  <input
                                    key={level.id}
                                    type="number"
                                    value={config.difficulty[level.id as keyof DifficultyDistribution]}
                                    onChange={(e) =>
                                      updateDifficulty(config.id, level.id as keyof DifficultyDistribution, parseInt(e.target.value) || 0)
                                    }
                                    min={0}
                                    className="w-10 px-1 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                )
                              ))}
                            </div>
                            {/* 校验提示 */}
                            {!isViewMode && difficultySum !== config.questionCount && (
                              <span className="text-[10px] text-red-500">
                                难度分布题数之和（{difficultySum}）必须等于当前题型的题数（{config.questionCount}）
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 第4列：题型分布 */}
                        <td className="px-2 py-2 border border-gray-200 text-center">
                          {isViewMode ? (
                            <span className="text-sm text-gray-900">
                              {getLabelById(questionTypeDistributionOptions, config.questionTypeDistribution)}
                            </span>
                          ) : (
                            <select
                              value={config.questionTypeDistribution}
                              onChange={(e) => updateQuestionConfig(config.id, 'questionTypeDistribution', e.target.value)}
                              className="w-[9.5rem] px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {questionTypeDistributionOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* 第5列：年份范围 */}
                        <td className="px-2 py-2 border border-gray-200 text-center">
                          {isViewMode ? (
                            <span className="text-sm text-gray-900">
                              {getLabelById(yearRangeOptions, config.yearRange)}
                            </span>
                          ) : (
                            <select
                              value={config.yearRange}
                              onChange={(e) => updateQuestionConfig(config.id, 'yearRange', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {yearRangeOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* 操作列 */}
                        {!isViewMode && (
                          <td className="px-2 py-2 border border-gray-200 text-center">
                            {formData.questionConfigs.length > 1 && (
                              <button
                                onClick={() => removeQuestionConfig(config.id)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* 添加配置按钮 */}
              {!isViewMode && (
                <button
                  onClick={addQuestionConfig}
                  className="mt-3 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                  添加配置方案
                </button>
              )}
            </FormSection>

            {/* 操作按钮 */}
            <div className="flex justify-between gap-3 pt-2">
              <div>
                {!isViewMode && (
                  <button
                    onClick={() => console.log('删除')}
                    className="flex items-center gap-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                )}
              </div>
              {isViewMode ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-6 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-6 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 发布确认弹窗 */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">发布新版本</h3>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            {/* 发布提示 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-amber-800 font-medium">发布注意事项</p>
                  <p className="text-amber-700 mt-1">发布将影响线上用户的实际使用，建议避开用户高频使用的时间段。</p>
                  <p className="text-gray-500 mt-1 text-xs">建议发布时段：凌晨 00:00 - 04:00</p>
                </div>
              </div>
            </div>

            {/* 新版本号 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                {generateNewVersion()}
              </div>
            </div>

            {/* 更新说明 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                更新说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="请填写本次更新的主要内容..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* 发布时间 */}
            <div className="mb-4">
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

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                {publishType === 'immediate' ? '确认发布' : '确认定时发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 历史发布记录弹窗 */}
      <AggregateHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="历史发布记录"
        data={useMemo(() => {
          const history = getStrategyHistory();
          const phaseLabel = getLabelById(phaseOptions, formData.phase);
          const subjectLabel = getLabelById(subjectOptions, formData.subject);
          const gradeLabel = getLabelById(currentGradeOptions, formData.grade);
          return history.map((record, index) => ({
            id: `${strategyId}-${record.version}-${index}`,
            moduleName: `${phaseLabel} · ${subjectLabel} · ${gradeLabel}`,
            moduleTags: [],
            version: record.version,
            description: record.description,
            publishTime: record.publishTime,
            publisher: record.publisher,
            publisherAccount: record.publisherAccount || '-',
          })) as AggregateHistoryItem[];
        }, [strategyId, formData.phase, formData.subject, formData.grade])}
        filterDisabled={true}
      />
    </PageLayout>
  );
}

// 导出页面组件
export default function SingleKnowledgeBDetailPage() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <SingleKnowledgeBDetailContent />
    </React.Suspense>
  );
}
