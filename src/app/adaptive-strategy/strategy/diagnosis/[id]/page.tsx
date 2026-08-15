'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Edit3,
  ChevronRight,
  History,
  X,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/shared/PageLayout';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';

// 场景类型
type SceneType = 'sync' | 'exam' | 'vacation' | 'zhongkao' | 'gaokao';

// 场景名称映射
const sceneNames: Record<SceneType, string> = {
  sync: '同步学',
  exam: '期中期末考',
  vacation: '寒暑假',
  zhongkao: '中考',
  gaokao: '高考',
};

// 模拟策略数据（用于编辑时回显）
const mockStrategyData: Record<string, {
  name: string;
  scene: SceneType;
  phase: string;
  subject: string;
  questionCount: number;
}> = {
  'sync-1': {
    name: '高中数学同步诊断',
    scene: 'sync',
    phase: 'senior',
    subject: 'math',
    questionCount: 15,
  },
  'sync-2': {
    name: '高中数学同步诊断',
    scene: 'sync',
    phase: 'senior',
    subject: 'math',
    questionCount: 18,
  },
  'sync-3': {
    name: '初中数学同步诊断',
    scene: 'sync',
    phase: 'junior',
    subject: 'math',
    questionCount: 12,
  },
  'exam-1': {
    name: '高中数学期中诊断',
    scene: 'exam',
    phase: 'senior',
    subject: 'math',
    questionCount: 25,
  },
  'exam-2': {
    name: '高中物理期末诊断',
    scene: 'exam',
    phase: 'senior',
    subject: 'physics',
    questionCount: 20,
  },
  'vacation-1': {
    name: '寒假数学专项诊断',
    scene: 'vacation',
    phase: 'senior',
    subject: 'math',
    questionCount: 30,
  },
  'vacation-2': {
    name: '暑假英语综合诊断',
    scene: 'vacation',
    phase: 'junior',
    subject: 'english',
    questionCount: 35,
  },
  'zhongkao-1': {
    name: '中考数学模拟诊断',
    scene: 'zhongkao',
    phase: 'junior',
    subject: 'math',
    questionCount: 28,
  },
  'zhongkao-2': {
    name: '中考物理模拟诊断',
    scene: 'zhongkao',
    phase: 'junior',
    subject: 'physics',
    questionCount: 22,
  },
  'gaokao-1': {
    name: '高考数学模拟诊断',
    scene: 'gaokao',
    phase: 'senior',
    subject: 'math',
    questionCount: 22,
  },
  'gaokao-2': {
    name: '高考物理模拟诊断',
    scene: 'gaokao',
    phase: 'senior',
    subject: 'physics',
    questionCount: 18,
  },
};

// 模拟策略列表数据（用于校验同步学场景下的策略冲突）
const mockStrategies: { id: string; scene: SceneType; phase: string; subject: string }[] = [
  { id: 'sync-1', scene: 'sync', phase: '高中', subject: '数学' },
  { id: 'sync-2', scene: 'sync', phase: '高中', subject: '数学' },
  { id: 'sync-3', scene: 'sync', phase: '初中', subject: '数学' },
  { id: 'exam-1', scene: 'exam', phase: '高中', subject: '数学' },
  { id: 'exam-2', scene: 'exam', phase: '高中', subject: '物理' },
  { id: 'vacation-1', scene: 'vacation', phase: '高中', subject: '数学' },
  { id: 'vacation-2', scene: 'vacation', phase: '初中', subject: '英语' },
  { id: 'zhongkao-1', scene: 'zhongkao', phase: '初中', subject: '数学' },
  { id: 'zhongkao-2', scene: 'zhongkao', phase: '初中', subject: '物理' },
  { id: 'gaokao-1', scene: 'gaokao', phase: '高中', subject: '数学' },
  { id: 'gaokao-2', scene: 'gaokao', phase: '高中', subject: '物理' },
];

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

// 题目来源选项
const sourceOptions = [
  { id: 'zhenti', label: '中考真题' },
  { id: 'moni', label: '模拟题' },
  { id: 'jingsai', label: '竞赛题' },
  { id: 'chuangxin', label: '创新题' },
];

// 难度档位
const difficultyLevels = [
  { id: 'easy', label: '易' },
  { id: 'easier', label: '较易' },
  { id: 'medium', label: '中档' },
  { id: 'harder', label: '较难' },
  { id: 'hard', label: '难' },
];

// 年份范围选项
const yearRangeOptions = [
  { id: 'all', label: '不限' },
  { id: 'recent3', label: '近3年' },
  { id: 'recent5', label: '近5年' },
];

// 难度分布类型（题目数量，非百分比）
interface DifficultyDistribution {
  easy: number;
  easier: number;
  medium: number;
  harder: number;
  hard: number;
}

// 题型约束类型
type QuestionTypeConstraint = 'all-objective' | 'prefer-objective' | 'unlimited';

// 题型约束选项
const questionTypeOptions: { id: QuestionTypeConstraint; label: string }[] = [
  { id: 'all-objective', label: '全客观题' },
  { id: 'prefer-objective', label: '优先客观题' },
  { id: 'unlimited', label: '不限题型' },
];

// 题目组成配置项
interface QuestionConfig {
  id: string;
  knowledgePointCount: number;  // 知识点总数
  questionsPerPoint: number;    // 单知识点出题数
  adjustmentFactor: number;     // 调节系数
  difficultyDistribution: DifficultyDistribution;  // 难度分布
  questionTypeConstraint: QuestionTypeConstraint;  // 选题约束
}

// 表单数据类型
interface FormData {
  name: string;
  phase: string;
  subject: string;
  sources: string[];
  yearRange: string;
  // 题目组成配置
  questionConfigs: QuestionConfig[];
}

// 初始表单数据
const initialFormData: FormData = {
  name: '',
  phase: 'senior',
  subject: 'math',
  sources: [],
  yearRange: '',
  // 题目组成配置（默认添加两条示例配置）
  questionConfigs: [
    {
      id: 'qc-1',
      knowledgePointCount: 2,
      questionsPerPoint: 2,
      adjustmentFactor: 1,
      difficultyDistribution: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 },
      questionTypeConstraint: 'prefer-objective',
    },
    {
      id: 'qc-2',
      knowledgePointCount: 3,
      questionsPerPoint: 2,
      adjustmentFactor: 1,
      difficultyDistribution: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 },
      questionTypeConstraint: 'prefer-objective',
    },
  ],
};

// 表单项组件 - 左右布局
function FormItem({
  label,
  required = false,
  error,
  labelExtra,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start py-1">
      <div className="w-[100px] flex-shrink-0 pt-2 text-right pr-3">
        <label className="text-sm text-gray-600 inline-flex items-center justify-end gap-0.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {labelExtra}
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

// 分组卡片组件
function FormSection({
  title,
  children,
}: {
  title: React.ReactNode;
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

// 加载中组件
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <span className="ml-3 text-gray-500">加载中...</span>
    </div>
  );
}

// 使用 useSearchParams 的内部组件（需要 Suspense 包裹）
function DiagnosisStrategyDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const strategyId = params?.id as string;
  const isNew = strategyId === 'new' || !strategyId;
  
  // 从 URL 参数获取场景类型
  const sceneParam = searchParams.get('scene') as SceneType | null;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 查看模式状态：新建默认为编辑模式(false)，编辑已有策略默认为查看模式(true)
  const [isViewMode, setIsViewMode] = useState(isNew ? false : true);
  // 保存后的场景类型（用于返回时定位分组）
  const [savedScene, setSavedScene] = useState<SceneType | null>(null);
  // 当前策略的场景类型（用于历史弹窗默认筛选）
  const [currentScene, setCurrentScene] = useState<SceneType | null>(null);
  // 新保存的策略 ID
  const [savedStrategyId, setSavedStrategyId] = useState<string | null>(null);
  // 原始策略名称（用于编辑模式下显示）
  const [originalStrategyName, setOriginalStrategyName] = useState<string>('');
  // 删除确认弹窗状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 保存前的表单数据（用于取消编辑时恢复）
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);
  // 策略冲突提示弹窗状态
  const [showConflictModal, setShowConflictModal] = useState(false);
  
  // 版本和发布状态
  const [currentVersion, setCurrentVersion] = useState('v1.0');
  const [publishStatus, setPublishStatus] = useState<'published' | 'pending'>('published');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // 新增策略是否已发布（用于控制橙色发布条的显示）
  const [isNewPublished, setIsNewPublished] = useState(false);
  
  // 发布相关状态
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('02:00');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [scheduledPublish, setScheduledPublish] = useState<{
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
  } | null>(null);

  // 加载已有策略数据（编辑模式）
  useEffect(() => {
    if (!isNew && strategyId && mockStrategyData[strategyId]) {
      const data = mockStrategyData[strategyId];
      const loadedData: FormData = {
        ...initialFormData,
        name: data.name,
        phase: data.phase,
        subject: data.subject,
      };
      setFormData(loadedData);
      setOriginalStrategyName(data.name);
      setSavedFormData(loadedData);  // 保存初始数据用于取消编辑时恢复
      setCurrentScene(data.scene);  // 设置当前策略的场景类型
      
      // 根据策略ID设置版本号和状态（模拟数据）
      const versionMap: Record<string, { version: string; status: 'published' | 'pending' }> = {
        'sync-1': { version: 'v1.2', status: 'published' },
        'sync-2': { version: 'v1.1', status: 'pending' },
        'sync-3': { version: 'v1.1', status: 'published' },
        'exam-1': { version: 'v2.0', status: 'published' },
        'exam-2': { version: 'v1.0', status: 'pending' },
        'vacation-1': { version: 'v1.3', status: 'published' },
        'vacation-2': { version: 'v1.0', status: 'published' },
        'zhongkao-1': { version: 'v2.1', status: 'published' },
        'zhongkao-2': { version: 'v1.0', status: 'pending' },
        'gaokao-1': { version: 'v3.0', status: 'published' },
        'gaokao-2': { version: 'v2.0', status: 'published' },
      };
      const versionInfo = versionMap[strategyId] || { version: 'v1.0', status: 'published' };
      setCurrentVersion(versionInfo.version);
      setPublishStatus(versionInfo.status);
    }
  }, [isNew, strategyId]);

  // 计算单个配置的基础出题数（知识点总数 * 单知识点出题数）
  const calculateBaseQuestionCount = (config: QuestionConfig): number => {
    return config.knowledgePointCount * config.questionsPerPoint;
  };

  // 计算单个配置的最终出题数（基础题数 + 调整题数）
  const calculateFinalQuestionCount = (config: QuestionConfig): number => {
    const baseCount = calculateBaseQuestionCount(config);
    const adjustment = Math.round(config.adjustmentFactor); // 调整题数为整数
    return Math.max(1, baseCount + adjustment); // 确保至少有1题
  };

  // 计算单个配置的难度分布合计
  const calculateDifficultySum = (config: QuestionConfig): number => {
    const { easy, easier, medium, harder, hard } = config.difficultyDistribution;
    return easy + easier + medium + harder + hard;
  };

  // 所有配置的总出题数
  const totalQuestionCount = useMemo(() => {
    return formData.questionConfigs.reduce((sum, config) => sum + calculateFinalQuestionCount(config), 0);
  }, [formData.questionConfigs]);

  // 更新表单字段
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ========== 题目组成配置相关函数 ==========

  // 添加新的题目组成配置
  const addQuestionConfig = () => {
    const newConfig: QuestionConfig = {
      id: `qc-${Date.now()}`,
      knowledgePointCount: 1,
      questionsPerPoint: 1,
      adjustmentFactor: 1,
      difficultyDistribution: { easy: 1, easier: 1, medium: 0, harder: 0, hard: 0 },
      questionTypeConstraint: 'prefer-objective',
    };
    updateField('questionConfigs', [...formData.questionConfigs, newConfig]);
  };

  // 删除题目组成配置
  const removeQuestionConfig = (id: string) => {
    if (formData.questionConfigs.length <= 1) return;
    updateField(
      'questionConfigs',
      formData.questionConfigs.filter((config) => config.id !== id)
    );
  };

  // 更新题目组成配置
  const updateQuestionConfig = (id: string, field: keyof QuestionConfig, value: any) => {
    updateField(
      'questionConfigs',
      formData.questionConfigs.map((config) =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  // 更新难度分布
  const updateDifficultyDistribution = (configId: string, key: keyof DifficultyDistribution, value: number) => {
    updateField(
      'questionConfigs',
      formData.questionConfigs.map((config) =>
        config.id === configId
          ? {
              ...config,
              difficultyDistribution: {
                ...config.difficultyDistribution,
                [key]: value,
              },
            }
          : config
      )
    );
  };

  // 表单校验
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入策略名称';
    }

    // 验证题目组成配置
    if (formData.questionConfigs.length === 0) {
      newErrors.questionConfigs = '请至少添加一个题目组成配置';
    } else {
      // 收集所有知识点总数，用于校验是否有重复
      const knowledgePointCounts: number[] = [];
      
      formData.questionConfigs.forEach((config, index) => {
        const difficultySum = calculateDifficultySum(config);
        
        // 验证难度分布的题目数量之和是否等于单知识点出题数
        if (difficultySum !== config.questionsPerPoint) {
          newErrors[`config-${index}-difficulty`] = `配置${index + 1}题目难度分布的总题数(${difficultySum})需等于单知识点出题数(${config.questionsPerPoint})`;
        }
        
        // 验证知识点总数不能大于8
        if (config.knowledgePointCount > 8) {
          newErrors[`config-${index}-knowledge`] = `配置${index + 1}知识点总数不能大于8`;
        } else if (config.knowledgePointCount < 1) {
          newErrors[`config-${index}-knowledge`] = `配置${index + 1}知识点总数必须大于0`;
        }
        
        // 收集知识点总数用于后续相等性校验
        knowledgePointCounts.push(config.knowledgePointCount);
        
        if (config.questionsPerPoint < 1) {
          newErrors[`config-${index}-questions`] = `配置${index + 1}单知识点出题数必须大于0`;
        }
      });
      
      // 验证知识点总数不能相等（同一策略内各配置行的知识点总数不能相同）
      const duplicates = knowledgePointCounts.filter((count, index) => 
        knowledgePointCounts.indexOf(count) !== index
      );
      if (duplicates.length > 0) {
        newErrors.knowledgeDuplication = `知识点总数不可重复，同一数值仅允许配置 1 组题目组成方案`;
      }
    }

    if (!formData.yearRange) {
      newErrors.yearRange = '请选择年份范围';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 检查同步学场景下是否存在策略冲突（同一学段学科只能有一个策略）
  const checkSyncStrategyConflict = (phase: string, subject: string): boolean => {
    const phaseLabel = phaseOptions.find(p => p.id === phase)?.label || '';
    const subjectLabel = subjectOptions.find(s => s.id === subject)?.label || '';
    
    // 检查 mockStrategies（同步学场景）
    const existingInMock = mockStrategies.some((strategy) => 
      strategy.scene === 'sync' && 
      strategy.phase === phaseLabel && 
      strategy.subject === subjectLabel &&
      // 排除当前编辑的策略
      !( !isNew && strategyId === strategy.id)
    );
    if (existingInMock) return true;
    
    // 检查 localStorage 中的新增策略
    const savedStrategies = JSON.parse(localStorage.getItem('newDiagnosisStrategies') || '[]');
    const existingInSaved = savedStrategies.some((s: any) => 
      s.scene === 'sync' && 
      s.phase === phaseLabel && 
      s.subject === subjectLabel &&
      // 排除当前编辑的策略
      !( !isNew && savedStrategyId === s.id)
    );
    if (existingInSaved) return true;
    
    // 检查 localStorage 中的已发布新策略
    const publishedNewStrategies = JSON.parse(localStorage.getItem('publishedNewDiagnosisStrategies') || '[]');
    const existingInPublished = publishedNewStrategies.some((s: any) => 
      s.scene === 'sync' && 
      s.phase === phaseLabel && 
      s.subject === subjectLabel &&
      // 排除当前编辑的策略
      !( !isNew && strategyId === s.id)
    );
    if (existingInPublished) return true;
    
    return false;
  };

  // 保存
  const handleSave = () => {
    if (!validateForm()) return;
    
    // 确定场景类型（优先使用 URL 参数，否则默认为 sync）
    const scene = sceneParam || 'sync';
    
    // 同步学场景下，检查是否存在策略冲突
    if (scene === 'sync') {
      const hasConflict = checkSyncStrategyConflict(formData.phase, formData.subject);
      if (hasConflict) {
        setShowConflictModal(true);
        return;
      }
    }
    
    // 构建策略对象
    const strategyData = {
      id: isNew ? `strategy-${Date.now()}` : strategyId,  // 新建用新ID，编辑保留原ID
      name: formData.name,
      scene: scene,
      phase: phaseOptions.find(p => p.id === formData.phase)?.label || '高中',
      subject: subjectOptions.find(s => s.id === formData.subject)?.label || '数学',
      questionConfigs: formData.questionConfigs,
      totalQuestionCount: totalQuestionCount,
      sources: formData.sources.map(s => sourceOptions.find(src => src.id === s)?.label || s),
      yearRange: yearRangeOptions.find(y => y.id === formData.yearRange)?.label || '',
      publishStatus: 'pending' as const,
      currentVersion: isNew ? undefined : currentVersion,  // 新增策略版本号为空，编辑已有策略保持原版本号
      pendingChanges: 0,
      createdAt: new Date().toISOString(),
    };
    
    if (isNew) {
      // 新建策略：保存到 newDiagnosisStrategies
      const existingStrategies = JSON.parse(localStorage.getItem('newDiagnosisStrategies') || '[]');
      localStorage.setItem('newDiagnosisStrategies', JSON.stringify([...existingStrategies, strategyData]));
    } else {
      // 编辑已有策略：保存到 updatedDiagnosisStrategies
      const existingUpdates = JSON.parse(localStorage.getItem('updatedDiagnosisStrategies') || '[]');
      // 检查是否已经存在该策略的更新记录
      const existingIndex = existingUpdates.findIndex((s: any) => s.id === strategyId);
      if (existingIndex >= 0) {
        existingUpdates[existingIndex] = strategyData;
      } else {
        existingUpdates.push(strategyData);
      }
      localStorage.setItem('updatedDiagnosisStrategies', JSON.stringify(existingUpdates));
      
      // 编辑已有策略时，设置 hasUnsavedChanges 为 true
      setHasUnsavedChanges(true);
    }
    
    // 触发自定义事件通知一级页面
    window.dispatchEvent(new CustomEvent('newStrategySaved'));
    
    // 设置保存状态，进入查看模式
    setSavedStrategyId(strategyData.id);
    setSavedScene(scene);
    setIsViewMode(true);
  };

  // 编辑（从查看模式切换到编辑模式）
  const handleEdit = () => {
    // 保存当前表单数据，用于取消时恢复
    setSavedFormData({ ...formData });
    setIsViewMode(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    // 恢复保存前的表单数据
    if (savedFormData) {
      setFormData(savedFormData);
    }
    setErrors({});
    setIsViewMode(true);
  };

  // 删除策略
  const handleDelete = () => {
    // 保存删除的策略ID到 localStorage
    const deletedIds = JSON.parse(localStorage.getItem('deletedDiagnosisStrategies') || '[]');
    localStorage.setItem('deletedDiagnosisStrategies', JSON.stringify([...deletedIds, strategyId]));
    
    // 触发自定义事件通知一级页面
    window.dispatchEvent(new CustomEvent('newStrategySaved'));
    
    // 返回一级页面
    router.push('/adaptive-strategy/strategy/diagnosis?refresh=1');
  };

  // 生成新版本号
  // 规则：每次更新次版本号+1，次版本号为9时再更新则次版本归零，主版本+1
  const generateNewVersion = () => {
    const parts = currentVersion.replace('v', '').split('.').map(Number);
    const major = parts[0] || 1;
    const minor = parts[1] || 0;
    
    if (minor >= 9) {
      return `v${major + 1}.0`;
    }
    return `v${major}.${minor + 1}`;
  };

  // 获取当前策略的历史发布记录
  const getStrategyHistory = () => {
    // 策略历史记录数据（模拟）
    const historyData: Record<string, { version: string; description: string; publishTime: string; publisher: string; publisherAccount: string }[]> = {
      'sync-1': [
        { version: 'v1.2', description: '优化题目难度分布比例', publishTime: '2024-01-20 10:00', publisher: '王老师', publisherAccount: '234567' },
        { version: 'v1.0', description: '初始版本，定义高中数学同步诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'sync-2': [
        { version: 'v1.1', description: '调整高二数学题目类型比例', publishTime: '2024-01-18 14:30', publisher: '李老师', publisherAccount: '345678' },
        { version: 'v1.0', description: '初始版本，定义高中数学同步诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'sync-3': [
        { version: 'v1.1', description: '优化初中数学诊断策略', publishTime: '2024-01-15 11:00', publisher: '张老师', publisherAccount: '456789' },
        { version: 'v1.0', description: '初始版本，定义初中数学同步诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'exam-1': [
        { version: 'v2.0', description: '新增期中诊断策略配置', publishTime: '2024-01-22 09:00', publisher: '王老师', publisherAccount: '234567' },
        { version: 'v1.0', description: '初始版本，定义高中数学期中诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'exam-2': [
        { version: 'v1.0', description: '初始版本，定义高中物理期末诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'vacation-1': [
        { version: 'v1.3', description: '优化寒假专项诊断策略', publishTime: '2024-01-25 15:00', publisher: '李老师', publisherAccount: '345678' },
        { version: 'v1.0', description: '初始版本，定义寒假数学专项诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'vacation-2': [
        { version: 'v1.0', description: '初始版本，定义暑假英语综合诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'zhongkao-1': [
        { version: 'v2.1', description: '优化中考数学模拟诊断策略', publishTime: '2024-01-28 10:00', publisher: '张老师', publisherAccount: '456789' },
        { version: 'v1.0', description: '初始版本，定义中考数学模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'zhongkao-2': [
        { version: 'v1.0', description: '初始版本，定义中考物理模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'gaokao-1': [
        { version: 'v3.0', description: '全面优化高考数学模拟诊断策略', publishTime: '2024-01-30 09:00', publisher: '王老师', publisherAccount: '234567' },
        { version: 'v2.0', description: '调整高考数学难度分布', publishTime: '2024-01-20 11:00', publisher: '李老师', publisherAccount: '345678' },
        { version: 'v1.0', description: '初始版本，定义高考数学模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
      'gaokao-2': [
        { version: 'v2.0', description: '优化高考物理模拟诊断策略', publishTime: '2024-01-25 14:00', publisher: '张老师', publisherAccount: '456789' },
        { version: 'v1.0', description: '初始版本，定义高考物理模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
      ],
    };
    
    return historyData[strategyId] || [{ version: 'v1.0', description: '初始版本', publishTime: '-', publisher: '-', publisherAccount: '-' }];
  };

  // 处理发布
  const handlePublish = () => {
    if (!releaseNotes.trim()) {
      alert('请填写更新说明');
      return;
    }
    
    // 新增策略首次发布，版本号为 v1.0
    // 编辑已有策略，基于当前版本号生成新版本
    const newVersion = (isNew && savedStrategyId) ? 'v1.0' : generateNewVersion();
    
    if (publishType === 'scheduled') {
      // 定时发布：保存定时信息
      setScheduledPublish({
        version: newVersion,
        scheduledDate,
        scheduledTime,
        description: releaseNotes
      });
      // 清空待发布的变更
      setHasUnsavedChanges(false);
      setCurrentVersion(newVersion);
      setPublishStatus('pending');
      
      // 如果是新增策略定时发布成功，标记为已发布（隐藏橙色发布条）
      if (isNew && savedStrategyId) {
        setIsNewPublished(true);
      }
    } else {
      // 立即发布
      // 如果是新增策略，需要将策略数据保存到一级页面可读取的位置
      if (isNew && savedStrategyId) {
        // 构建一级页面可用的完整策略数据
        const publishedStrategy = {
          id: savedStrategyId,
          name: formData.name,
          scene: savedScene || 'sync',
          phase: phaseOptions.find(p => p.id === formData.phase)?.label || '高中',
          subject: subjectOptions.find(s => s.id === formData.subject)?.label || '数学',
          questionCount: totalQuestionCount,
          difficultyRatio: '易20% 较易20% 中档30% 较难20% 难10%',
          typeRatio: '选择40% 填空30% 解答30%',
          publishStatus: 'published' as const,
          currentVersion: newVersion,
          hasUpdate: false,
          isNew: false,  // 发布后不再是新增状态
        };
        
        // 保存到 localStorage，供一级页面读取
        const publishedNewStrategies = JSON.parse(localStorage.getItem('publishedNewDiagnosisStrategies') || '[]');
        publishedNewStrategies.push(publishedStrategy);
        localStorage.setItem('publishedNewDiagnosisStrategies', JSON.stringify(publishedNewStrategies));
        
        // 从 newDiagnosisStrategies 中移除该策略（已发布，不再是待发布状态）
        const existingStrategies = JSON.parse(localStorage.getItem('newDiagnosisStrategies') || '[]');
        const filteredStrategies = existingStrategies.filter((s: any) => s.id !== savedStrategyId);
        localStorage.setItem('newDiagnosisStrategies', JSON.stringify(filteredStrategies));
        
        // 触发自定义事件通知一级页面刷新
        window.dispatchEvent(new CustomEvent('newStrategySaved'));
      }
      
      setCurrentVersion(newVersion);
      setPublishStatus('published');
      setHasUnsavedChanges(false);
      setScheduledPublish(null);
      
      // 如果是新增策略发布成功，标记为已发布
      if (isNew && savedStrategyId) {
        setIsNewPublished(true);
      }
    }
    
    setReleaseNotes('');
    setPublishType('immediate');
    setShowPublishModal(false);
  };

  // 返回
  const handleBack = () => {
    // 返回到学情诊断策略一级页面
    if (isViewMode && savedStrategyId) {
      // 如果是保存后的查看模式，使用 push 并带参数
      // 同时传递 scene 参数，让一级页面自动选中对应的场景分组
      const sceneParam = savedScene ? `&scene=${savedScene}` : '';
      router.push(`/adaptive-strategy/strategy/diagnosis?refresh=1${sceneParam}`);
    } else {
      router.back();
    }
  };

  return (
    <PageLayout
      activeMenuId="adaptive-strategy"
      breadcrumbs={[
        { label: '策略管理' },
        { label: '策略广场' },
        { label: isViewMode ? formData.name : (isNew ? '新建策略' : (originalStrategyName || '编辑策略')), isLast: true },
      ]}
    >
      <div className="flex flex-col h-full">
        {/* 标题栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isViewMode ? formData.name : (isNew ? '新建策略' : (originalStrategyName || '编辑策略'))}
              </h2>
              {!isViewMode && <p className="text-sm text-gray-500">学情诊断策略配置</p>}
              {isViewMode && savedStrategyId && isNew && !isNewPublished && (
                <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                  新增
                </span>
              )}
              {isViewMode && savedStrategyId && !isNew && hasUnsavedChanges && (
                <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                  有更新
                </span>
              )}
            </div>
            
            {/* 右侧：版本号和状态 */}
            {isNew && savedStrategyId && !isNewPublished ? (
              // 新增策略未发布时显示 -- 
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">版本号：</span>
                  <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded border border-gray-200">
                    --
                  </span>
                </div>
              </div>
            ) : (isNew && savedStrategyId && isNewPublished) || !isNew ? (
              // 新增策略已发布 或 非新建策略 显示版本号
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">版本号：</span>
                  <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded border border-gray-200">
                    {currentVersion}
                  </span>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="查看历史发布记录"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* 待发布状态条（新增策略保存后或编辑已有策略有变更时显示） */}
        {((isNew && savedStrategyId && !isNewPublished) || (!isNew && hasUnsavedChanges && savedStrategyId)) && isViewMode && (
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
                  onClick={() => setShowPublishModal(true)}
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
                  // 取消定时发布
                  setScheduledPublish(null);
                  setHasUnsavedChanges(true);
                  // 如果是新增策略，取消定时后需要重新显示橙色发布条
                  if (isNew && savedStrategyId) {
                    setIsNewPublished(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                取消定时
              </button>
            </div>
          </div>
        )}

        {/* 表单区域 */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="space-y-4 max-w-4xl">
        {/* 基本信息 */}
        <FormSection title="基本信息">
          <FormItem label="策略名称" required error={errors.name}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="请输入策略名称"
              maxLength={50}
              disabled={isViewMode}
              className={`w-full max-w-md px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } ${isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
            />
          </FormItem>

          <FormItem label="学段" required>
            <select
              value={formData.phase}
              onChange={(e) => updateField('phase', e.target.value)}
              disabled={isViewMode}
              className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
              }`}
            >
              {phaseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormItem>

          <FormItem label="学科" required>
            <select
              value={formData.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              disabled={isViewMode}
              className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
              }`}
            >
              {subjectOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormItem>
        </FormSection>

        {/* 题目筛选条件 */}
        <FormSection title="题目筛选条件">
          <FormItem label="年份范围" required error={errors.yearRange}>
            <select
              value={formData.yearRange}
              onChange={(e) => updateField('yearRange', e.target.value)}
              disabled={isViewMode}
              className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                errors.yearRange ? 'border-red-300' : isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
              }`}
            >
              <option value="">请选择</option>
              {yearRangeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormItem>
        </FormSection>

        {/* 题目组成配置 */}
        <FormSection title={
          <div className="flex items-center gap-2">
            <span>题目组成配置</span>
            {!isViewMode && formData.questionConfigs.length > 1 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                知识点总数不可重复，同一数值仅允许配置 1 组题目组成方案
              </span>
            )}
          </div>
        }>
          {/* 知识点总数不能相等的错误提示 */}
          {!isViewMode && errors.knowledgeDuplication && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">知识点总数不可重复，同一数值仅允许配置 1 组题目组成方案</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border border-gray-200">
                    <div className="flex flex-col gap-1">
                      <span>知识点总数</span>
                      <span className="font-normal text-gray-400 text-[10px]">（不能大于8）</span>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border border-gray-200">单知识点出题数</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">单知识点题目难度分布</span>
                      <div className="flex justify-center gap-1">
                        {difficultyLevels.map((level) => (
                          <span key={level.id} className="w-9 text-center text-[10px] font-medium text-gray-500">
                            {level.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border border-gray-200">
                    <div className="flex items-center gap-1">
                      <span>单知识点选题约束</span>
                      <div className="relative group">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                        <div className="absolute left-0 top-full mt-1 w-72 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          选择优先客观题选项，系统在选题时，会优先选择客观题，客观题题量不足时，用主观题补齐。
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 border border-gray-200">
                    <div className="flex items-center gap-1">
                      <span>调整题数</span>
                      <div className="relative group">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                        <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="space-y-1">
                            <p><span className="font-medium">题数 + X：</span>优先从高频知识点增题，无高频则选中频，均无则在低频中随机增题。</p>
                            <p><span className="font-medium">题数 - Y：</span>优先从低频知识点减题，无低频则选中频，均无则在高频中随机减题。</p>
                            <p className="text-gray-300 text-[10px]">（选题满足单知识点难度分布要求）</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200">总出题数</th>
                  {!isViewMode && (
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 border border-gray-200 w-16">操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {formData.questionConfigs.map((config, index) => {
                  const difficultySum = calculateDifficultySum(config);
                  const finalCount = calculateFinalQuestionCount(config);
                  
                  return (
                    <tr key={config.id} className="bg-white hover:bg-gray-50">
                      {/* 知识点总数 */}
                      <td className="px-3 py-2 border border-gray-200">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            value={config.knowledgePointCount}
                            onChange={(e) => updateQuestionConfig(config.id, 'knowledgePointCount', parseInt(e.target.value) || 0)}
                            min={1}
                            max={8}
                            disabled={isViewMode}
                            className={`w-16 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                            } ${!isViewMode && (config.knowledgePointCount > 8 || errors[`config-${index}-knowledge`]) ? 'border-red-400' : ''}`}
                          />
                          {/* 知识点总数校验提示 */}
                          {!isViewMode && config.knowledgePointCount > 8 && (
                            <span className="text-[10px] text-red-500">不能大于8</span>
                          )}
                        </div>
                      </td>
                      {/* 单知识点出题数 */}
                      <td className="px-3 py-2 border border-gray-200">
                        <input
                          type="number"
                          value={config.questionsPerPoint}
                          onChange={(e) => updateQuestionConfig(config.id, 'questionsPerPoint', parseInt(e.target.value) || 0)}
                          min={1}
                          disabled={isViewMode}
                          className={`w-16 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      {/* 单知识点题目难度分布 */}
                      <td className="px-2 py-2 border border-gray-200">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1">
                            {difficultyLevels.map((level) => (
                              <input
                                key={level.id}
                                type="number"
                                value={config.difficultyDistribution[level.id as keyof DifficultyDistribution]}
                                onChange={(e) =>
                                  updateDifficultyDistribution(config.id, level.id as keyof DifficultyDistribution, parseInt(e.target.value) || 0)
                                }
                                min={0}
                                max={100}
                                disabled={isViewMode}
                                className={`w-9 px-1 py-1 border rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                  isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          {/* 校验提示 - 与单知识点出题数进行校验 */}
                          {!isViewMode && difficultySum !== config.questionsPerPoint && (
                            <span className={`text-[10px] ${
                              difficultySum > config.questionsPerPoint ? 'text-red-500' : 'text-blue-500'
                            }`}>
                              题目难度分布的总题数不能{difficultySum > config.questionsPerPoint ? '大于' : '小于'}单知识点出题数
                            </span>
                          )}
                        </div>
                      </td>
                      {/* 单知识点选题约束 */}
                      <td className="px-3 py-2 border border-gray-200">
                        <select
                          value={config.questionTypeConstraint}
                          onChange={(e) => updateQuestionConfig(config.id, 'questionTypeConstraint', e.target.value as QuestionTypeConstraint)}
                          disabled={isViewMode}
                          className={`w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                          }`}
                        >
                          {questionTypeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* 调整题数 */}
                      <td className="px-3 py-2 border border-gray-200">
                        <div className="flex items-center justify-start gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newValue = Math.round(config.adjustmentFactor) - 1;
                              updateQuestionConfig(config.id, 'adjustmentFactor', newValue);
                            }}
                            disabled={isViewMode}
                            className={`w-6 h-6 flex items-center justify-center rounded border text-sm font-medium ${
                              isViewMode 
                                ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-emerald-500 hover:text-emerald-600'
                            }`}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={config.adjustmentFactor}
                            onChange={(e) => updateQuestionConfig(config.id, 'adjustmentFactor', parseInt(e.target.value) || 0)}
                            step={1}
                            disabled={isViewMode}
                            className={`w-12 px-1 py-1 border rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isViewMode ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newValue = Math.round(config.adjustmentFactor) + 1;
                              updateQuestionConfig(config.id, 'adjustmentFactor', newValue);
                            }}
                            disabled={isViewMode}
                            className={`w-6 h-6 flex items-center justify-center rounded border text-sm font-medium ${
                              isViewMode 
                                ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-emerald-500 hover:text-emerald-600'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      {/* 总出题数 */}
                      <td className="px-3 py-2 border border-gray-200 text-center">
                        <span className="text-sm font-medium text-emerald-600">{finalCount}</span>
                      </td>
                      {/* 操作 */}
                      {!isViewMode && (
                        <td className="px-3 py-2 border border-gray-200 text-center">
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
          </div>

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
          {/* 左侧：删除按钮（仅查看模式且非新建时显示） */}
          <div>
            {isViewMode && !isNew && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
          </div>
          
          {/* 右侧：编辑/取消/保存按钮 */}
          <div className="flex gap-3">
            {isViewMode ? (
              // 查看模式：显示编辑按钮
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
            ) : (
              // 编辑模式：显示取消和保存按钮
              <>
                <button
                  onClick={isNew ? handleBack : handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </>
            )}
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              确定要删除策略「<span className="font-medium text-gray-900">{formData.name}</span>」吗？删除后将无法恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 策略冲突提示弹窗 */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">策略配置冲突</h3>
              </div>
            </div>
            <div className="text-gray-600 mb-6">
              <p className="mb-2">同一学段-学科，只能配置一份诊断策略。</p>
              <p>
                该学段-学科已存在诊断策略：
                <span className="font-medium text-gray-900">
                  {phaseOptions.find(p => p.id === formData.phase)?.label}
                  {subjectOptions.find(s => s.id === formData.subject)?.label}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发布弹窗 */}
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
                {(isNew && savedStrategyId) ? 'v1.0' : generateNewVersion()}
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

      {/* 历史发布记录弹窗 - 使用聚合组件 */}
      <AggregateHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="历史发布记录"
        data={useMemo(() => {
          const history = getStrategyHistory();
          return history.map((record, index) => ({
            id: `${strategyId}-${record.version}-${index}`,
            moduleName: formData.name || '学情诊断策略',
            moduleTags: [sceneNames[currentScene || 'sync'], formData.phase === 'senior' ? '高中' : formData.phase === 'junior' ? '初中' : '小学'],
            version: record.version,
            description: record.description,
            publishTime: record.publishTime,
            publisher: record.publisher,
            publisherAccount: record.publisherAccount || '-',
          })) as AggregateHistoryItem[];
        }, [strategyId, formData.name, currentScene, formData.phase])}
        filterConfig={{
          showModuleFilter: true,
          moduleOptions: [
            { id: 'sync', label: '同步学' },
            { id: 'exam', label: '期中期末考' },
            { id: 'vacation', label: '寒暑假' },
            { id: 'zhongkao', label: '中考' },
            { id: 'gaokao', label: '高考' },
          ],
        }}
        filterDisabled={true}
        defaultFilterValues={{ module: currentScene || 'sync' }}
      />
    </PageLayout>
  );
}

// 包装组件，使用 Suspense 包裹 useSearchParams
export default function DiagnosisStrategyDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosisStrategyDetailContent />
    </Suspense>
  );
}
