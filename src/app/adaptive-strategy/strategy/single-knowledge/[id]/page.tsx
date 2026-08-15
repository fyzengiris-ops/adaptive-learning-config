'use client';

import React, { useState, useMemo, Suspense, useRef, useEffect } from 'react';
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
  ChevronDown,
  X,
} from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/shared/PageLayout';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';
import PrdTooltip, { PrdTooltipData } from '@/components/shared/PrdTooltip';
import * as prd2 from '@/data/prd-rules/single-knowledge-2.0';
import * as prd21 from '@/data/prd-rules/single-knowledge-2.1';
import * as prd22 from '@/data/prd-rules/single-knowledge-2.2';
import * as prd23 from '@/data/prd-rules/single-knowledge-2.3';
import * as prd24 from '@/data/prd-rules/single-knowledge-2.4';
import * as prd25 from '@/data/prd-rules/single-knowledge-2.5';
import * as prd26 from '@/data/prd-rules/single-knowledge-2.6';
import * as prd27 from '@/data/prd-rules/single-knowledge-2.7';
import * as prd28 from '@/data/prd-rules/single-knowledge-2.8';
import { phaseOptions, getSubjectsByPhase, getPhaseLabel, getSubjectLabel } from '@/data/phase-subject-config';

// 题型选项
const questionTypeOptions = [
  { id: 'choice', label: '选择题' },
  { id: 'fill', label: '填空题' },
  { id: 'answer', label: '解答题' },
  { id: 'judge', label: '判断题' },
  { id: 'short', label: '简答题' },
];

// 难度等级
const difficultyLevels = [
  { id: 'easy', label: '易' },
  { id: 'easier', label: '较易' },
  { id: 'medium', label: '中档' },
  { id: 'harder', label: '较难' },
  { id: 'hard', label: '难' },
];

// 题目来源选项
const questionSourceOptions = [
  { id: 'gaokao-zhenti', label: '高考真题' },
  { id: 'xueye-kaoshi', label: '学业考试' },
  { id: 'zizhu-zhaosheng', label: '自主招生' },
  { id: 'gaokao-moni', label: '高考模拟' },
  { id: 'tongbu-lianxi', label: '同步练习' },
  { id: 'jingsai-shiti', label: '竞赛试题' },
  { id: 'jiaqi-zuoye', label: '假期作业' },
  { id: 'mokuai-shiti', label: '模块试题' },
  { id: 'gaokao-fuxi', label: '高考复习' },
  { id: 'qimo-shiti', label: '期末试题' },
  { id: 'qizhong-shiti', label: '期中试题' },
  { id: 'yuekao-shiti', label: '月考试题' },
  { id: 'kaixue-shiti', label: '开学试题' },
  { id: 'danyuan-ceyan', label: '单元测验' },
];

// 知识点复合度选项
const knowledgeComplexityOptions = [
  { id: 'current-only', label: '单一知识点' },
  { id: 'current-and-related', label: '非单一知识点' },
];

// 难度分布类型
interface DifficultyDistribution {
  easy: number;
  easier: number;
  medium: number;
  harder: number;
  hard: number;
}

// 题目配置项
interface QuestionConfig {
  id: string;
  questionType: string;
  questionCount: number;
  difficulty: DifficultyDistribution;
  questionSources: string[];        // 题目来源（多选）
  knowledgeComplexity: string;      // 知识点复合度（单选）
}

// 掌握度区间配置
interface MasteryRangeConfig {
  id: string;
  masteryStart: number;
  masteryEnd: number;
  questionConfigs: QuestionConfig[];
}

// 策略类型
type StrategyType = 'general' | 'personalized';

// 表单数据
interface FormData {
  phase: string;
  subject: string;
  strategyName: string;
  masteryRangeConfigs: MasteryRangeConfig[];
}

// 模拟策略数据
const mockStrategyData: Record<string, {
  name: string;
  type: StrategyType;
  phase: string;
  subject: string;
  strategyName: string;
  version: string;
  masteryRangeConfigs: MasteryRangeConfig[];
}> = {
  'general-1': {
    name: '高中数学通用策略',
    type: 'general',
    phase: 'senior',
    subject: 'math',
    strategyName: '',
    version: 'v1.2',
    masteryRangeConfigs: [
      {
        id: 'mr-1',
        masteryStart: 0,
        masteryEnd: 40,
        questionConfigs: [
          {
            id: 'qc-1',
            questionType: 'choice',
            questionCount: 10,
            difficulty: { easy: 2, easier: 3, medium: 3, harder: 1, hard: 1 },
            questionSources: ['gaokao-zhenti', 'gaokao-moni'],
            knowledgeComplexity: 'current-only',
          },
          {
            id: 'qc-2',
            questionType: 'fill',
            questionCount: 5,
            difficulty: { easy: 1, easier: 1, medium: 2, harder: 1, hard: 0 },
            questionSources: ['tongbu-lianxi'],
            knowledgeComplexity: 'current-and-related',
          },
        ],
      },
      {
        id: 'mr-2',
        masteryStart: 40,
        masteryEnd: 70,
        questionConfigs: [
          {
            id: 'qc-3',
            questionType: 'answer',
            questionCount: 3,
            difficulty: { easy: 0, easier: 1, medium: 1, harder: 1, hard: 0 },
            questionSources: ['gaokao-zhenti'],
            knowledgeComplexity: 'current-and-related',
          },
        ],
      },
      {
        id: 'mr-3',
        masteryStart: 70,
        masteryEnd: 100,
        questionConfigs: [
          {
            id: 'qc-4',
            questionType: 'choice',
            questionCount: 8,
            difficulty: { easy: 0, easier: 1, medium: 2, harder: 3, hard: 2 },
            questionSources: ['gaokao-zhenti', 'jingsai-shiti'],
            knowledgeComplexity: 'current-and-related',
          },
        ],
      },
    ],
  },
  'personalized-1': {
    name: '高中数学强化训练策略',
    type: 'personalized',
    phase: 'senior',
    subject: 'math',
    strategyName: '强化训练策略',
    version: 'v2.0',
    masteryRangeConfigs: [
      {
        id: 'mr-4',
        masteryStart: 0,
        masteryEnd: 40,
        questionConfigs: [
          {
            id: 'qc-5',
            questionType: 'choice',
            questionCount: 8,
            difficulty: { easy: 2, easier: 2, medium: 2, harder: 1, hard: 1 },
            questionSources: ['gaokao-zhenti', 'gaokao-moni'],
            knowledgeComplexity: 'current-only',
          },
        ],
      },
    ],
  },
  'personalized-2': {
    name: '高中数学能力提升策略',
    type: 'personalized',
    phase: 'senior',
    subject: 'math',
    strategyName: '能力提升策略',
    version: 'v1.0',
    masteryRangeConfigs: [
      {
        id: 'mr-5',
        masteryStart: 40,
        masteryEnd: 70,
        questionConfigs: [
          {
            id: 'qc-6',
            questionType: 'fill',
            questionCount: 5,
            difficulty: { easy: 1, easier: 1, medium: 2, harder: 1, hard: 0 },
            questionSources: ['tongbu-lianxi'],
            knowledgeComplexity: 'current-and-related',
          },
        ],
      },
      {
        id: 'mr-6',
        masteryStart: 70,
        masteryEnd: 100,
        questionConfigs: [
          {
            id: 'qc-7',
            questionType: 'answer',
            questionCount: 3,
            difficulty: { easy: 0, easier: 0, medium: 1, harder: 1, hard: 1 },
            questionSources: ['gaokao-zhenti', 'jingsai-shiti'],
            knowledgeComplexity: 'current-and-related',
          },
        ],
      },
    ],
  },
  'personalized-3': {
    name: '初中数学快速突破策略',
    type: 'personalized',
    phase: 'junior',
    subject: 'math',
    strategyName: '快速突破策略',
    version: 'v0.1',
    masteryRangeConfigs: [
      {
        id: 'mr-7',
        masteryStart: 70,
        masteryEnd: 100,
        questionConfigs: [
          {
            id: 'qc-8',
            questionType: 'choice',
            questionCount: 6,
            difficulty: { easy: 0, easier: 1, medium: 2, harder: 2, hard: 1 },
            questionSources: ['gaokao-zhenti'],
            knowledgeComplexity: 'current-and-related',
          },
        ],
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
      strategyName: data.strategyName,
      masteryRangeConfigs: data.masteryRangeConfigs,
    };
  }
  return {
    phase: 'senior',
    subject: 'math',
    strategyName: '',
    masteryRangeConfigs: [
      {
        id: `mr-${Date.now()}`,
        masteryStart: 0,
        masteryEnd: 100,
        questionConfigs: [
          {
            id: `qc-${Date.now()}`,
            questionType: 'choice',
            questionCount: 10,
            difficulty: { easy: 2, easier: 2, medium: 3, harder: 2, hard: 1 },
            questionSources: [],
            knowledgeComplexity: 'current-only',
          },
        ],
      },
    ],
  };
};

// 学科下拉组件（支持置灰已占用学科）
function SubjectDropdown({
  value,
  onChange,
  options,
  disabledIds,
  placeholder = '请选择',
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  disabledIds: Set<string>;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const selectedLabel = options.find((opt) => opt.id === value)?.label || '';

  const updatePanelPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 160),
      zIndex: 9999,
    });
  };

  useEffect(() => {
    if (isOpen) updatePanelPosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => updatePanelPosition();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (id: string) => {
    if (disabledIds.has(id)) return;
    onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-40 px-3 py-2 border rounded-lg text-sm cursor-pointer flex items-center justify-between ${
          isOpen
            ? 'border-emerald-500 ring-1 ring-emerald-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {options.map((option) => {
            const isDisabled = disabledIds.has(option.id);
            return (
              <div
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`px-3 py-2 text-sm ${
                  isDisabled
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : option.id === value
                    ? 'bg-emerald-50 text-emerald-700 font-medium cursor-pointer'
                    : 'text-gray-700 cursor-pointer hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {isDisabled && <span className="text-xs text-gray-300">已有策略</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// 表单区块组件
function FormSection({
  title,
  children,
  tooltipData,
}: {
  title: string;
  children: React.ReactNode;
  tooltipData?: PrdTooltipData;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {tooltipData && <PrdTooltip data={tooltipData} />}
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
  tooltipData,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  tooltipData?: PrdTooltipData;
}) {
  return (
    <div className="flex items-center py-1">
      <div className="w-[100px] flex-shrink-0 text-right pr-3">
        <label className="text-sm text-gray-600 inline-flex items-center justify-end gap-0.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {tooltipData && <PrdTooltip data={tooltipData} />}
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

// 多选下拉组件（题目来源）
function MultiSelectDropdown({
  selectedValues,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
}: {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // 计算面板位置
  const updatePanelPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 9999,
    });
  };

  // 打开/关闭时计算位置
  useEffect(() => {
    if (isOpen) {
      updatePanelPosition();
    }
  }, [isOpen]);

  // 滚动时更新位置
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => updatePanelPosition();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== id));
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.id))
    .map((opt) => opt.label);

  return (
    <>
      {/* 触发区域 */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[32px] px-2 py-1 border rounded text-xs flex flex-wrap items-center gap-1 cursor-pointer ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : isOpen
            ? 'border-emerald-500 ring-1 ring-emerald-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {selectedLabels.length > 0 ? (
          selectedLabels.map((label, idx) => (
            <span
              key={selectedValues[idx]}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] whitespace-nowrap"
            >
              {label}
              {!disabled && (
                <button
                  onClick={(e) => handleRemove(selectedValues[idx], e)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* 下拉面板 - fixed定位，不受父容器overflow限制 */}
      {isOpen && !disabled && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
        >
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.id)}
                onChange={() => handleToggle(option.id)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </>
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
function SingleKnowledgeDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const strategyId = params.id as string;

  // 获取策略数据
  const strategyInfo = mockStrategyData[strategyId];

  // 策略类型：已有策略从数据获取，新增策略从URL参数获取
  const strategyType: StrategyType = strategyInfo?.type || (searchParams.get('type') as StrategyType) || 'general';

  // 判断当前是否为通用策略
  const isGeneralStrategy = strategyType === 'general';

  // 页面状态
  const [isViewMode, setIsViewMode] = useState(strategyId !== 'new');
  const isNewMode = strategyId === 'new';
  // 编辑态使用prd21（2.1编辑通用策略规则）
  // 新增通用策略使用prd2（2.0规则），新增个性化策略使用prd25（2.5规则）
  const prdNew = isGeneralStrategy ? prd2 : prd25;
  // 编辑态：通用策略用prd21，个性化策略暂用prd25（2.6规则文件待创建后替换）
  const prdEditBase = isGeneralStrategy ? prd21 : prd26;
  const prdEdit = isNewMode ? prdNew : prdEditBase;
  const prdView = isGeneralStrategy ? prd22 : prd27;
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [savedStrategyId, setSavedStrategyId] = useState<string | null>(null);

  // 发布弹窗状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [leaveConfirmSource, setLeaveConfirmSource] = useState<'back-new' | 'back-edit' | 'cancel-edit' | null>(null);
  const [deleteRangeId, setDeleteRangeId] = useState<string | null>(null);
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
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);

  // 计算当前学段下已有通用策略的学科（通用策略详情页使用）
  const occupiedSubjects = useMemo(() => {
    // 仅通用策略需要限制学科选择
    if (!isGeneralStrategy) return new Set<string>();
    const subjects = new Set<string>();
    Object.entries(mockStrategyData).forEach(([id, data]) => {
      // 只看通用策略、且学段匹配的记录
      if (data.type === 'general' && data.phase === formData.phase) {
        // 排除当前正在编辑的策略自身
        if (id !== strategyId) {
          subjects.add(data.subject);
        }
      }
    });
    return subjects;
  }, [formData.phase, isGeneralStrategy, strategyId]);

  // 当前学段下的学科选项（根据乐课网当前学段下已有的学科数据动态获取）
  const currentSubjectOptions = useMemo(() => {
    return getSubjectsByPhase(formData.phase);
  }, [formData.phase]);

  // 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 更新字段
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ========== 掌握度区间操作 ==========

  // 添加新区间
  const addMasteryRange = () => {
    const newRange: MasteryRangeConfig = {
      id: `mr-${Date.now()}`,
      masteryStart: 0,
      masteryEnd: 100,
      questionConfigs: [
        {
          id: `qc-${Date.now()}`,
          questionType: 'choice',
          questionCount: 0,
          difficulty: { easy: 0, easier: 0, medium: 0, harder: 0, hard: 0 },
          questionSources: [],
          knowledgeComplexity: 'current-only',
        },
      ],
    };
    updateField('masteryRangeConfigs', [...formData.masteryRangeConfigs, newRange]);
  };

  // 删除区间
  const removeMasteryRange = (rangeId: string) => {
    updateField(
      'masteryRangeConfigs',
      formData.masteryRangeConfigs.filter((r) => r.id !== rangeId)
    );
  };

  // 更新区间字段
  const updateMasteryRange = (rangeId: string, field: keyof MasteryRangeConfig, value: number | string) => {
    updateField(
      'masteryRangeConfigs',
      formData.masteryRangeConfigs.map((r) =>
        r.id === rangeId ? { ...r, [field]: value } : r
      )
    );
  };

  // ========== 区间内题型操作 ==========

  // 添加题型到指定区间
  const addQuestionConfig = (rangeId: string) => {
    updateField(
      'masteryRangeConfigs',
      formData.masteryRangeConfigs.map((r) => {
        if (r.id !== rangeId) return r;
        return {
          ...r,
          questionConfigs: [
            ...r.questionConfigs,
            {
              id: `qc-${Date.now()}`,
              questionType: 'choice',
              questionCount: 0,
              difficulty: { easy: 0, easier: 0, medium: 0, harder: 0, hard: 0 },
              questionSources: [],
              knowledgeComplexity: 'current-only',
            },
          ],
        };
      })
    );
  };

  // 删除题型
  const removeQuestionConfig = (rangeId: string, configId: string) => {
    updateField(
      'masteryRangeConfigs',
      formData.masteryRangeConfigs.map((r) => {
        if (r.id !== rangeId) return r;
        if (r.questionConfigs.length <= 1) return r;
        return {
          ...r,
          questionConfigs: r.questionConfigs.filter((c) => c.id !== configId),
        };
      })
    );
  };

  // 更新题型配置
  const updateQuestionConfig = (rangeId: string, configId: string, field: keyof QuestionConfig, value: string | number | string[]) => {
    updateField(
      'masteryRangeConfigs',
      formData.masteryRangeConfigs.map((r) => {
        if (r.id !== rangeId) return r;
        return {
          ...r,
          questionConfigs: r.questionConfigs.map((c) =>
            c.id === configId ? { ...c, [field]: value } : c
          ),
        };
      })
    );
  };

  // 更新难度分布
  const updateDifficulty = (rangeId: string, configId: string, level: keyof DifficultyDistribution, value: number) => {
    updateField(
      'masteryRangeConfigs',
      formData.masteryRangeConfigs.map((r) => {
        if (r.id !== rangeId) return r;
        return {
          ...r,
          questionConfigs: r.questionConfigs.map((c) =>
            c.id === configId
              ? { ...c, difficulty: { ...c.difficulty, [level]: value } }
              : c
          ),
        };
      })
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

  // 计算区间出题总数
  const calculateRangeTotal = (range: MasteryRangeConfig) => {
    return range.questionConfigs.reduce((sum, c) => sum + c.questionCount, 0);
  };

  // ========== 校验 ==========

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phase) newErrors.phase = '请选择学段';
    if (!formData.subject) newErrors.subject = '请选择学科';
    if (strategyType === 'personalized') {
      if (!formData.strategyName.trim()) newErrors.strategyName = '请输入策略名称';
      else if (formData.strategyName.length > 50) newErrors.strategyName = '策略名称不能超过50个字符';
    }

    // 校验掌握度区间
    const ranges = formData.masteryRangeConfigs;
    ranges.forEach((range, ri) => {
      if (range.masteryStart < 0 || range.masteryStart > 100) {
        newErrors[`range-${ri}-start`] = '区间值必须在0-100之间';
      }
      if (range.masteryEnd < 0 || range.masteryEnd > 100) {
        newErrors[`range-${ri}-end`] = '区间值必须在0-100之间';
      }
      if (range.masteryEnd <= range.masteryStart) {
        newErrors[`range-${ri}-end`] = '结束区间必须大于开始区间';
      }

      // 校验题型配置
      range.questionConfigs.forEach((config, ci) => {
        const difficultySum = calculateDifficultySum(config);
        if (difficultySum !== config.questionCount) {
          newErrors[`range-${ri}-config-${ci}-difficulty`] = '难度分布总和必须等于题量';
        }
        if (!config.questionSources || config.questionSources.length === 0) {
          newErrors[`range-${ri}-config-${ci}-sources`] = '请选择至少一个题目来源';
        }
        if (!config.knowledgeComplexity) {
          newErrors[`range-${ri}-config-${ci}-complexity`] = '请选择知识点复合度';
        }
      });

      // 校验区间内题型是否重复
      const types = range.questionConfigs.map((c) => c.questionType);
      const duplicates = types.filter((t, i) => types.indexOf(t) !== i);
      if (duplicates.length > 0) {
        newErrors[`range-${ri}-duplicate`] = '当前区间内存在重复题型';
      }
    });

    // 校验区间重叠
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i];
        const b = ranges[j];
        if (a.masteryStart < b.masteryEnd && b.masteryStart < a.masteryEnd) {
          newErrors['masteryRangeDuplicate'] = '掌握度区间存在重叠，请调整';
          break;
        }
      }
      if (newErrors['masteryRangeDuplicate']) break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== 操作 ==========

  const handleSave = () => {
    if (!validateForm()) return;
    console.log('保存数据:', formData);
    setSavedStrategyId(strategyId);
    setHasUnsavedChanges(false);
    setHasUnpublishedChanges(true);
    setIsViewMode(true);
  };

  const handleEdit = () => {
    setSavedFormData({ ...formData });
    setIsViewMode(false);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setLeaveConfirmSource('cancel-edit');
      setShowLeaveConfirmModal(true);
    } else {
      // 无未保存内容，直接退回查看态
      if (savedFormData) {
        setFormData({ ...savedFormData });
        setSavedFormData(null);
      }
      setErrors({});
      setIsViewMode(true);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setLeaveConfirmSource(isNewMode ? 'back-new' : 'back-edit');
      setShowLeaveConfirmModal(true);
    } else {
      router.push('/adaptive-strategy/strategy/single-knowledge');
    }
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  const handlePublish = () => {
    if (!releaseNotes.trim()) {
      alert('请填写更新说明');
      return;
    }
    const newVersion = generateNewVersion();
    if (publishType === 'scheduled') {
      setScheduledPublish({
        version: newVersion,
        scheduledDate,
        scheduledTime,
        description: releaseNotes,
      });
      setHasUnsavedChanges(false);
      setHasUnpublishedChanges(false);
      setCurrentVersion(newVersion);
    } else {
      setHasUnsavedChanges(false);
      setHasUnpublishedChanges(false);
      setCurrentVersion(newVersion);
    }
    setShowPublishModal(false);
    setReleaseNotes('');
    setPublishType('immediate');
    setScheduledDate('');
    setScheduledTime('02:00');
  };

  const generateNewVersion = () => {
    const current = currentVersion || 'v1.0';
    const match = current.match(/v(\d+)\.(\d+)/);
    if (match) {
      const minor = parseInt(match[2]) + 1;
      return `v${match[1]}.${minor}`;
    }
    return 'v1.1';
  };

  const openPublishModal = () => {
    setPublishType('immediate');
    setReleaseNotes('');
    setScheduledDate('');
    setScheduledTime('02:00');
    setShowPublishModal(true);
  };

  const getStrategyHistory = () => {
    const historyData: Record<string, { version: string; description: string; publishTime: string; publisher: string; publisherAccount: string }[]> = {
      'general-1': [
        { version: 'v1.2', description: '优化题目难度分布比例', publishTime: '2024-01-20 10:00', publisher: '王老师', publisherAccount: '234567' },
        { version: 'v1.1', description: '调整掌握度区间范围', publishTime: '2024-01-15 09:00', publisher: '李老师', publisherAccount: '345678' },
        { version: 'v1.0', description: '初始版本，定义高中数学通用策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'personalized-1': [
        { version: 'v2.3', description: '增加解答题配置，调整难度分布', publishTime: '2024-03-18 14:30', publisher: '张老师', publisherAccount: '123456' },
        { version: 'v2.2', description: '修改掌握度区间边界值', publishTime: '2024-03-10 09:15', publisher: '张老师', publisherAccount: '123456' },
        { version: 'v2.1', description: '调整选择题数量和难度分布', publishTime: '2024-02-28 11:00', publisher: '赵老师', publisherAccount: '456789' },
        { version: 'v2.0', description: '更新题目来源，增加校本题库', publishTime: '2024-02-15 16:20', publisher: '张老师', publisherAccount: '123456' },
        { version: 'v1.0', description: '初始版本，定义培优班数学策略', publishTime: '2024-01-22 10:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'personalized-2': [
        { version: 'v1.3', description: '降低填空题难度占比', publishTime: '2024-03-22 10:45', publisher: '刘老师', publisherAccount: '567890' },
        { version: 'v1.2', description: '新增判断题配置', publishTime: '2024-03-05 14:00', publisher: '刘老师', publisherAccount: '567890' },
        { version: 'v1.1', description: '调整各区间出题数量', publishTime: '2024-02-20 09:30', publisher: '陈老师', publisherAccount: '678901' },
        { version: 'v1.0', description: '初始版本，定义基础班数学策略', publishTime: '2024-01-25 10:00', publisher: '管理员', publisherAccount: '000001' },
      ],
    };
    return historyData[strategyId] || [];
  };

  const getLabelById = (options: { id: string; label: string }[], id: string) => {
    return options.find((opt) => opt.id === id)?.label || id;
  };

  return (
    <PageLayout activeMenuId="adaptive-strategy">
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
              <h1 className="text-xl font-bold text-gray-900 inline-flex items-center gap-1.5">
                {strategyId === 'new'
                    ? (strategyType === 'personalized' ? '新增个性化策略' : '新增通用策略')
                    : (strategyType === 'personalized' ? '个性化策略详情' : '通用策略详情')}
	                <PrdTooltip data={isViewMode ? prdView.pageHeader : prdEdit.pageHeader} />
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
        {hasUnpublishedChanges && isViewMode && savedStrategyId && (
          <div className="bg-amber-50 mx-6 mt-4 rounded-lg px-4 py-3 flex-shrink-0 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  {'新增策略，需要发布后才能生效'}
                  <PrdTooltip data={prdView.pendingPublishBar} />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openPublishModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                  发布<PrdTooltip data={prd24.openModal} />
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
                  <PrdTooltip data={prdView.scheduledPublishBar} />
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
            <FormSection title="基础信息" tooltipData={isViewMode ? prdView.basicInfoSection : prdEdit.basicInfoSection}>
              {isViewMode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500 w-20 text-right">学段：</span>
                    <span className="text-sm text-gray-900">{getPhaseLabel(formData.phase)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500 w-20 text-right">学科：</span>
                    <span className="text-sm text-gray-900">{getSubjectLabel(formData.phase, formData.subject)}</span>
                  </div>
                  {strategyType === 'personalized' && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500 w-20 text-right">策略名称：<PrdTooltip data={prdView.strategyNameField} /></span>
                    <span className="text-sm text-gray-900">{formData.strategyName || '-'}</span>
                  </div>
                  )}
                </div>
              ) : (
                <>
                  <FormItem label="学段" required={isNewMode && isGeneralStrategy} error={isNewMode && isGeneralStrategy ? errors.phase : undefined} tooltipData={prdEdit.phaseField}>
                    {strategyId === 'new' ? (
                      <select
                      value={formData.phase}
                      onChange={(e) => {
	                        const newPhase = e.target.value;
	                        if (isGeneralStrategy) {
	                          const newOccupied = new Set<string>();
	                          Object.entries(mockStrategyData).forEach(([id, data]) => {
	                            if (data.type === 'general' && data.phase === newPhase && id !== strategyId) {
	                              newOccupied.add(data.subject);
	                            }
	                          });
	                          setFormData((prev) => ({
	                            ...prev,
	                            phase: newPhase,
	                            subject: newOccupied.has(prev.subject) ? '' : prev.subject,
	                          }));
								  setHasUnsavedChanges(true);
	                        } else {
	                          updateField('phase', newPhase);
	                        }
	                      }}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      {phaseOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    ) : (
                      <span className="text-sm text-gray-900">{getPhaseLabel(formData.phase)}</span>
                    )}
                  </FormItem>

                  <FormItem label="学科" required={isNewMode && isGeneralStrategy} error={isNewMode && isGeneralStrategy ? errors.subject : undefined} tooltipData={prdEdit.subjectField}>
                    {strategyId === 'new' && isGeneralStrategy ? (
                      <SubjectDropdown
                        value={formData.subject}
                        onChange={(val) => updateField('subject', val)}
                        options={currentSubjectOptions}
                        disabledIds={occupiedSubjects}
                        placeholder="请选择学科"
                      />
                    ) : strategyId === 'new' ? (
                      <select
                        value={formData.subject}
                        onChange={(e) => updateField('subject', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      >
                        {currentSubjectOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900">{getSubjectLabel(formData.phase, formData.subject)}</span>
                    )}
                  </FormItem>

                  {strategyType === 'personalized' && (
                  <FormItem label="策略名称" required error={errors.strategyName} tooltipData={isViewMode ? prdView.strategyNameField : prdEdit.strategyNameField}>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.strategyName}
                        onChange={(e) => {
                          if (e.target.value.length <= 50) {
                            updateField('strategyName', e.target.value);
                          }
                        }}
                        placeholder="请输入策略名称"
                        maxLength={50}
                        className="w-80 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {formData.strategyName.length}/50
                      </span>
                    </div>
                  </FormItem>
                  )}
                </>
              )}
            </FormSection>

            {/* 题目组成配置 */}
            <FormSection title="题目组成配置" tooltipData={isViewMode ? prdView.configSection : prdEdit.configSection}>
              {/* 区间重叠提示 */}
              {errors.masteryRangeDuplicate && !isViewMode && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{errors.masteryRangeDuplicate}</span>
                </div>
              )}

              <div className="space-y-4">
                {formData.masteryRangeConfigs.map((range, rangeIndex) => {
                  const rangeTotal = calculateRangeTotal(range);

                  return (
                    <div
                      key={range.id}
                      className="rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                    >
                      {/* 区间头 */}
                      <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-700">掌握度区间</span>
                            <PrdTooltip data={isViewMode ? prdView.masteryRange : prdEdit.masteryRange} />
                            {isViewMode ? (
                              <span className="text-sm text-emerald-700 font-semibold">
                                {range.masteryStart}% ── {range.masteryEnd}%
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={range.masteryStart}
                                  onChange={(e) => updateMasteryRange(range.id, 'masteryStart', parseInt(e.target.value) || 0)}
                                  min={0}
                                  max={100}
                                  className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-400">%</span>
                                <span className="text-sm text-gray-400 mx-1">──</span>
                                <input
                                  type="number"
                                  value={range.masteryEnd}
                                  onChange={(e) => updateMasteryRange(range.id, 'masteryEnd', parseInt(e.target.value) || 0)}
                                  min={0}
                                  max={100}
                                  className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-400">%</span>
                              </div>
                            )}
                            {/* 区间校验错误 */}
                            {!isViewMode && errors[`range-${rangeIndex}-start`] && (
                              <span className="text-xs text-red-500">{errors[`range-${rangeIndex}-start`]}</span>
                            )}
                            {!isViewMode && errors[`range-${rangeIndex}-end`] && (
                              <span className="text-xs text-red-500">{errors[`range-${rangeIndex}-end`]}</span>
                            )}
                            {/* 出题总数 */}
                            <div className="flex items-center gap-1 ml-2 px-2.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-200">
                              <span className="text-xs text-gray-600">共</span>
                              <span className="text-sm font-bold text-emerald-600">{rangeTotal}</span>
                              <span className="text-xs text-gray-600">题</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {!isViewMode && formData.masteryRangeConfigs.length > 1 && (
                              <button
                                onClick={() => {
                                  setDeleteRangeId(range.id);
                                }}
                                className="flex items-center gap-1 text-gray-400 hover:text-red-500 text-xs transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                删除区间
                                <PrdTooltip data={prdEdit.deleteRange} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 pl-4">区间取值说明：除最后一段为左闭右闭外，其余均为左闭右开</p>
                      </div>

                      {/* 题型表格 */}
                      <table className="border-collapse w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-200 w-28">
                              题型<PrdTooltip data={isViewMode ? prdView.questionTypeField : prdEdit.questionTypeField} />
                            </th>
                            <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-200 w-16">
                              题量<PrdTooltip data={isViewMode ? prdView.questionCountField : prdEdit.questionCountField} />
                            </th>
                            <th className="px-2 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-200 w-[270px]">
                              <div className="flex flex-col gap-1">
                                <span>题目难度分布</span><PrdTooltip data={isViewMode ? prdView.difficultyField : prdEdit.difficultyField} />
                                <div className="flex justify-center gap-1">
                                  {difficultyLevels.map((level) => (
                                    <span key={level.id} className="w-14 text-center text-[10px] font-medium text-gray-500">
                                      {level.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </th>
                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-200 w-[203px]">
                              题目来源<PrdTooltip data={isViewMode ? prdView.questionSourceField : prdEdit.questionSourceField} />
                            </th>
                            <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-200 w-44">
                              知识点复合度<PrdTooltip data={isViewMode ? prdView.complexityField : prdEdit.complexityField} />
                            </th>
                            {!isViewMode && (
                              <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-200 w-14">
                                操作
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {range.questionConfigs.map((config) => {
                            const difficultySum = calculateDifficultySum(config);

                            return (
                              <tr key={config.id} className="bg-white hover:bg-gray-50">
                                {/* 题型 */}
                                <td className="px-3 py-2 border border-gray-200">
                                  {isViewMode ? (
                                    <span className="text-sm text-gray-900">{getLabelById(questionTypeOptions, config.questionType)}</span>
                                  ) : (
                                    <select
                                      value={config.questionType}
                                      onChange={(e) => updateQuestionConfig(range.id, config.id, 'questionType', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                      {questionTypeOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>

                                {/* 题量 */}
                                <td className="px-3 py-2 border border-gray-200">
                                  {isViewMode ? (
                                    <span className="text-sm text-gray-900">{config.questionCount}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      value={config.questionCount}
                                      onChange={(e) => updateQuestionConfig(range.id, config.id, 'questionCount', parseInt(e.target.value) || 0)}
                                      min={1}
                                      className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  )}
                                </td>

                                {/* 题目难度分布 */}
                                <td className="px-2 py-2 border border-gray-200">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center justify-center gap-1">
                                      {difficultyLevels.map((level) => (
                                        isViewMode ? (
                                          <span key={level.id} className="w-14 text-center text-xs text-gray-900">
                                            {config.difficulty[level.id as keyof DifficultyDistribution]}
                                          </span>
                                        ) : (
                                          <input
                                            key={level.id}
                                            type="number"
                                            value={config.difficulty[level.id as keyof DifficultyDistribution]}
                                            onChange={(e) =>
                                              updateDifficulty(range.id, config.id, level.id as keyof DifficultyDistribution, parseInt(e.target.value) || 0)
                                            }
                                            min={0}
                                            className="w-14 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                          />
                                        )
                                      ))}
                                    </div>
                                    {!isViewMode && difficultySum !== config.questionCount && (
                                      <span className="text-[10px] text-red-500">
                                        难度分布题数之和（{difficultySum}）必须等于当前题型的题数（{config.questionCount}）
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 题目来源 */}
                                <td className="px-2 py-2 border border-gray-200">
                                  {isViewMode ? (
                                    <div className="flex flex-wrap gap-1">
                                      {config.questionSources.map((sourceId) => (
                                        <span
                                          key={sourceId}
                                          className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px]"
                                        >
                                          {getLabelById(questionSourceOptions, sourceId)}
                                        </span>
                                      ))}
                                      {config.questionSources.length === 0 && (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <MultiSelectDropdown
                                        selectedValues={config.questionSources}
                                        onChange={(values) => updateQuestionConfig(range.id, config.id, 'questionSources', values)}
                                        options={questionSourceOptions}
                                        placeholder="请选择题目来源"
                                      />
                                      {errors[`range-${rangeIndex}-config-${range.questionConfigs.indexOf(config)}-sources`] && (
                                        <span className="text-[10px] text-red-500 mt-0.5 block">
                                          {errors[`range-${rangeIndex}-config-${range.questionConfigs.indexOf(config)}-sources`]}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* 知识点复合度 */}
                                <td className="px-2 py-2 border border-gray-200 text-center">
                                  {isViewMode ? (
                                    <span className="text-sm text-gray-900">
                                      {getLabelById(knowledgeComplexityOptions, config.knowledgeComplexity)}
                                    </span>
                                  ) : (
                                    <select
                                      value={config.knowledgeComplexity}
                                      onChange={(e) => updateQuestionConfig(range.id, config.id, 'knowledgeComplexity', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                      <option value="">请选择</option>
                                      {knowledgeComplexityOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>

                                {/* 操作 */}
                                {!isViewMode && (
                                  <td className="px-2 py-2 border border-gray-200 text-center">
                                    {range.questionConfigs.length > 1 && (
                                      <button
                                        onClick={() => removeQuestionConfig(range.id, config.id)}
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

                      {/* 区间底部：添加题型 */}
                      <div className="flex items-center px-5 py-2.5 border-t border-gray-200 bg-gray-50/80">
                        {!isViewMode && (
                          <button
                            onClick={() => addQuestionConfig(range.id)}
                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            <Plus className="w-4 h-4" />
                            添加题型
                            <PrdTooltip data={prdEdit.addQuestionType} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 添加区间按钮 - 底部 */}
              {!isViewMode && (
                <button
                  onClick={addMasteryRange}
                  className="mt-4 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                  添加区间
                  <PrdTooltip data={prdEdit.addRange} />
                </button>
              )}
            </FormSection>

            {/* 操作按钮 */}
            <div className="flex justify-between gap-3 pt-2">
              <div>
                {isViewMode && strategyId !== 'new' && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                    <PrdTooltip data={prdView.deleteStrategy} />
                  </button>
                )}
              </div>
              {isViewMode && strategyId !== 'new' ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-6 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                  <PrdTooltip data={prdView.editAction} />
                </button>
              ) : strategyId === 'new' ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                    <PrdTooltip data={prdEdit.cancelAction} />
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-6 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    保存
                    <PrdTooltip data={prdEdit.saveAction} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消编辑
                    <PrdTooltip data={prd21.cancelAction} />
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-6 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    完成编辑
                    <PrdTooltip data={prd21.saveAction} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 删除区间确认弹窗 */}
      {deleteRangeId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-1.5">删除确认<PrdTooltip data={prdEdit.deleteRangeModal} /></h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                确认删除该区间的出题策略吗？
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteRangeId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={() => {
                  removeMasteryRange(deleteRangeId);
                  setDeleteRangeId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[440px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">删除确认</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                确认删除【{getPhaseLabel(formData.phase)}{getSubjectLabel(formData.phase, formData.subject)}{strategyType === 'personalized' && formData.strategyName ? `-${formData.strategyName}` : ''}】的单知识点出题策略吗？
              </p>
              <p className="text-sm text-amber-600 mt-2 leading-relaxed">
                删除后，下游业务（自适应学习系统）将无法获取到出题策略，请做好其他相应的处理措施
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  router.push('/adaptive-strategy/strategy/single-knowledge');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 离开确认弹窗 */}
      {showLeaveConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[440px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">离开确认</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                {leaveConfirmSource === 'back-new'
                  ? '新增内容还未保存，确认取消吗？'
                  : leaveConfirmSource === 'cancel-edit'
                  ? '编辑内容还未保存，确认取消编辑吗？'
                  : '当前内容未保存，是否确认离开？'}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLeaveConfirmModal(false);
                  setLeaveConfirmSource(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {leaveConfirmSource === 'back-new' ? '取消' : leaveConfirmSource === 'cancel-edit' ? '取消' : '继续编辑'}
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirmModal(false);
                  setLeaveConfirmSource(null);
                  setHasUnsavedChanges(false);
                  if (leaveConfirmSource === 'back-new') {
                    router.push('/adaptive-strategy/strategy/single-knowledge');
                  } else if (leaveConfirmSource === 'cancel-edit') {
                    // 取消编辑：不保存用户编辑的内容，退回查看态
                    if (savedFormData) {
                      setFormData({ ...savedFormData });
                      setSavedFormData(null);
                    }
                    setErrors({});
                    setIsViewMode(true);
                  } else {
                    // 编辑态点返回：恢复原始数据并切回查看态
                    const originalData = getInitialFormData(strategyId);
                    setFormData(originalData);
                    setIsViewMode(true);
                    setHasUnsavedChanges(false);
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                {leaveConfirmSource === 'back-new' ? '确认' : leaveConfirmSource === 'cancel-edit' ? '确认' : '确认离开'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发布确认弹窗 */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-1.5">发布新版本<PrdTooltip data={prd24.modalHeader} /></h3>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm flex-1">
                  <span className="text-amber-800 font-medium inline-flex items-center gap-1">发布注意事项<PrdTooltip data={prd24.publishWarning} /></span>
                  <p className="text-amber-700 mt-1">发布将影响线上用户的实际使用，建议避开用户高频使用的时间段。</p>
                  <p className="text-gray-500 mt-1 text-xs">建议发布时段：凌晨 00:00 - 04:00</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center gap-1">版本号<PrdTooltip data={prd24.versionField} /></div>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                {generateNewVersion()}
              </div>
            </div>

            <div className="mb-4">
              <div className="block text-sm font-medium text-gray-700 mb-1 inline-flex items-center gap-1">
                更新说明 <span className="text-red-500">*</span><PrdTooltip data={prd24.releaseNotesField} />
              </div>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="请填写本次更新的主要内容..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="mb-4">
              <div className="block text-sm font-medium text-gray-700 mb-2 inline-flex items-center gap-1">发布时间<PrdTooltip data={prd24.publishTimeField} /></div>
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

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm inline-flex items-center gap-1"
              >
                取消<PrdTooltip data={prd24.cancelButton} />
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm inline-flex items-center gap-1"
              >
                {publishType === 'immediate' ? '确认发布' : '确认定时发布'}<PrdTooltip data={prd24.publishButton} />
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
          return history.map((record, index) => ({
            id: `${strategyId}-${record.version}-${index}`,
            moduleName: `${getPhaseLabel(formData.phase)} · ${getSubjectLabel(formData.phase, formData.subject)}${strategyType === 'personalized' && formData.strategyName ? ` · ${formData.strategyName}` : ''}`,
            moduleTags: [strategyType === 'personalized' ? '个性化策略' : '通用策略'],
            version: record.version,
            description: record.description,
            publishTime: record.publishTime,
            publisher: record.publisher,
            publisherAccount: record.publisherAccount || '-',
          })) as AggregateHistoryItem[];
        }, [strategyId, formData.phase, formData.subject, formData.strategyName, strategyType])}
        filterDisabled={true}
        hideFilters={strategyType === 'personalized'}
        strategyName={strategyType === 'personalized' ? formData.strategyName : undefined}
        currentVersion={strategyInfo?.version}
        tooltipConfig={strategyType === 'personalized' ? {
          modalHeader: prd28.modalHeader,
          typeFilter: prd28.typeFilter,
          phaseFilter: prd28.phaseFilter,
          subjectFilter: prd28.subjectFilter,
          strategyNameFilter: prd28.strategyNameFilter,
          keywordSearch: prd28.keywordSearch,
          historyList: prd28.historyList,
          recordItem: prd28.recordItem,
          currentVersionTag: prd28.currentVersionTag,
          closeButton: prd28.closeButton,
          emptyNoRecords: prd28.emptyNoRecords,
          emptyNoMatch: prd28.emptyNoMatch,
        } : {
          modalHeader: prd23.modalHeader,
          typeFilter: prd23.typeFilter,
          phaseFilter: prd23.phaseFilter,
          subjectFilter: prd23.subjectFilter,
          keywordSearch: prd23.keywordSearch,
          historyList: prd23.historyList,
          recordItem: prd23.recordItem,
          currentVersionTag: prd23.currentVersionTag,
          closeButton: prd23.closeButton,
          emptyNoRecords: prd23.emptyNoRecords,
          emptyNoMatch: prd23.emptyNoMatch,
        }}
      />
    </PageLayout>
  );
}

// 导出页面组件
export default function SingleKnowledgeDetailPage() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <SingleKnowledgeDetailContent />
    </React.Suspense>
  );
}
