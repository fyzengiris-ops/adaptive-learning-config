'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import {
  Plus,
  Stethoscope,
  FileText,
  Calculator,
  BookOpen,
  Target,
  ArrowLeft,
  History,
  X,
  AlertTriangle,
  Check,
  Clock,
  Info,
  Loader2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayout from '@/components/shared/PageLayout';
import AggregateHistoryModal, { AggregateHistoryItem } from '@/components/shared/AggregateHistoryModal';

// 场景类型（不包含 all）
type SceneType = 'sync' | 'exam' | 'vacation' | 'zhongkao' | 'gaokao';

// 场景选择类型（包含 all）
type SceneFilterType = 'all' | SceneType;

// 版本历史类型
interface VersionHistory {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  publisher?: string;
  publisherAccount?: string;
  changes: {
    type: 'add' | 'update' | 'delete';
    strategyName: string;
    scene: string;
  }[];
}

// 场景配置
const sceneOptions: { id: SceneFilterType; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'sync', label: '同步学' },
  { id: 'exam', label: '期中期末考' },
  { id: 'vacation', label: '寒暑假' },
  { id: 'zhongkao', label: '中考' },
  { id: 'gaokao', label: '高考' },
];

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

// 策略数据类型
interface Strategy {
  id: string;
  name: string;
  scene: SceneType;
  phase: string;
  subject: string;
  questionCount: number;
  difficultyRatio: string;
  typeRatio: string;
  publishStatus: 'published' | 'pending';
  currentVersion: string;
  pendingChanges?: number;
  hasUpdate?: boolean;  // 有更新
  isNew?: boolean;      // 新增
}

// 场景分组顺序
const sceneOrder: SceneType[] = ['sync', 'exam', 'vacation', 'zhongkao', 'gaokao'];

// 场景分组名称
const sceneGroupNames: Record<SceneType, string> = {
  sync: '同步学',
  exam: '期中期末考',
  vacation: '寒暑假',
  zhongkao: '中考',
  gaokao: '高考',
};

// 场景图标和颜色
const sceneStyles: Record<SceneType, { bgColor: string; icon: React.ReactNode }> = {
  sync: { 
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600', 
    icon: <BookOpen className="w-6 h-6 text-white" /> 
  },
  exam: { 
    bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600', 
    icon: <FileText className="w-6 h-6 text-white" /> 
  },
  vacation: { 
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600', 
    icon: <Target className="w-6 h-6 text-white" /> 
  },
  zhongkao: { 
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600', 
    icon: <Calculator className="w-6 h-6 text-white" /> 
  },
  gaokao: { 
    bgColor: 'bg-gradient-to-br from-red-400 to-red-600', 
    icon: <Target className="w-6 h-6 text-white" /> 
  },
};

// 模拟策略数据
const mockStrategies: Strategy[] = [
  // 同步学
  {
    id: 'sync-1',
    name: '高中数学同步诊断',
    scene: 'sync',
    phase: '高中',
    subject: '数学',
    questionCount: 15,
    difficultyRatio: '易20% 较易20% 中档30% 较难20% 难10%',
    typeRatio: '选择40% 填空30% 解答30%',
    publishStatus: 'published',
    currentVersion: 'v1.2',
  },
  {
    id: 'sync-2',
    name: '高中数学同步诊断',
    scene: 'sync',
    phase: '高中',
    subject: '数学',
    questionCount: 18,
    difficultyRatio: '易15% 较易25% 中档30% 较难20% 难10%',
    typeRatio: '选择35% 填空35% 解答30%',
    publishStatus: 'pending',
    currentVersion: 'v1.0',
    pendingChanges: 2,
  },
  {
    id: 'sync-3',
    name: '初中数学同步诊断',
    scene: 'sync',
    phase: '初中',
    subject: '数学',
    questionCount: 12,
    difficultyRatio: '易25% 较易25% 中档30% 较难15% 难5%',
    typeRatio: '选择50% 填空30% 解答20%',
    publishStatus: 'published',
    currentVersion: 'v1.1',
  },
  // 期中期末考
  {
    id: 'exam-1',
    name: '高中数学期中诊断',
    scene: 'exam',
    phase: '高中',
    subject: '数学',
    questionCount: 25,
    difficultyRatio: '易15% 较易20% 中档35% 较难20% 难10%',
    typeRatio: '选择40% 填空20% 解答40%',
    publishStatus: 'published',
    currentVersion: 'v2.0',
  },
  {
    id: 'exam-2',
    name: '高中物理期末诊断',
    scene: 'exam',
    phase: '高中',
    subject: '物理',
    questionCount: 20,
    difficultyRatio: '易10% 较易20% 中档35% 较难25% 难10%',
    typeRatio: '选择40% 填空20% 解答40%',
    publishStatus: 'pending',
    currentVersion: 'v1.0',
    pendingChanges: 1,
  },
  // 寒暑假
  {
    id: 'vacation-1',
    name: '寒假数学专项诊断',
    scene: 'vacation',
    phase: '高中',
    subject: '数学',
    questionCount: 30,
    difficultyRatio: '易20% 较易30% 中档30% 较难15% 难5%',
    typeRatio: '选择30% 填空30% 解答40%',
    publishStatus: 'published',
    currentVersion: 'v1.3',
  },
  {
    id: 'vacation-2',
    name: '暑假英语综合诊断',
    scene: 'vacation',
    phase: '初中',
    subject: '英语',
    questionCount: 35,
    difficultyRatio: '易25% 较易25% 中档30% 较难15% 难5%',
    typeRatio: '选择50% 填空25% 写作25%',
    publishStatus: 'published',
    currentVersion: 'v1.0',
  },
  // 中考
  {
    id: 'zhongkao-1',
    name: '中考数学模拟诊断',
    scene: 'zhongkao',
    phase: '初中',
    subject: '数学',
    questionCount: 28,
    difficultyRatio: '易10% 较易20% 中档35% 较难25% 难10%',
    typeRatio: '选择40% 填空20% 解答40%',
    publishStatus: 'published',
    currentVersion: 'v2.1',
  },
  {
    id: 'zhongkao-2',
    name: '中考物理模拟诊断',
    scene: 'zhongkao',
    phase: '初中',
    subject: '物理',
    questionCount: 22,
    difficultyRatio: '易10% 较易20% 中档40% 较难20% 难10%',
    typeRatio: '选择45% 填空25% 解答30%',
    publishStatus: 'pending',
    currentVersion: 'v1.0',
    pendingChanges: 3,
  },
  // 高考
  {
    id: 'gaokao-1',
    name: '高考数学模拟诊断',
    scene: 'gaokao',
    phase: '高中',
    subject: '数学',
    questionCount: 22,
    difficultyRatio: '易5% 较易15% 中档35% 较难30% 难15%',
    typeRatio: '选择45% 填空15% 解答40%',
    publishStatus: 'published',
    currentVersion: 'v3.0',
  },
  {
    id: 'gaokao-2',
    name: '高考物理模拟诊断',
    scene: 'gaokao',
    phase: '高中',
    subject: '物理',
    questionCount: 18,
    difficultyRatio: '易5% 较易15% 中档35% 较难30% 难15%',
    typeRatio: '选择40% 填空20% 解答40%',
    publishStatus: 'published',
    currentVersion: 'v2.0',
  },
];

// 每个策略的发布历史数据
interface StrategyPublishRecord {
  strategyId: string;
  version: string;
  description: string;
  publishTime: string;
  publisher: string;
  publisherAccount: string;
}

const strategyPublishHistory: StrategyPublishRecord[] = [
  // 同步学
  { strategyId: 'sync-1', version: 'v1.2', description: '优化题目难度分布比例', publishTime: '2024-01-20 10:00', publisher: '王老师', publisherAccount: '234567' },
  { strategyId: 'sync-1', version: 'v1.0', description: '初始版本，定义高中数学同步诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  { strategyId: 'sync-2', version: 'v1.1', description: '调整高二数学题目类型比例', publishTime: '2024-01-18 14:30', publisher: '李老师', publisherAccount: '345678' },
  { strategyId: 'sync-2', version: 'v1.0', description: '初始版本，定义高中数学同步诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  { strategyId: 'sync-3', version: 'v1.1', description: '优化初中数学诊断策略', publishTime: '2024-01-15 11:00', publisher: '张老师', publisherAccount: '456789' },
  { strategyId: 'sync-3', version: 'v1.0', description: '初始版本，定义初中数学同步诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  // 期中期末考
  { strategyId: 'exam-1', version: 'v2.0', description: '新增期中诊断策略配置', publishTime: '2024-01-22 09:00', publisher: '王老师', publisherAccount: '234567' },
  { strategyId: 'exam-1', version: 'v1.0', description: '初始版本，定义高中数学期中诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  { strategyId: 'exam-2', version: 'v1.0', description: '初始版本，定义高中物理期末诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  // 寒暑假
  { strategyId: 'vacation-1', version: 'v1.3', description: '优化寒假专项诊断策略', publishTime: '2024-01-25 15:00', publisher: '李老师', publisherAccount: '345678' },
  { strategyId: 'vacation-1', version: 'v1.0', description: '初始版本，定义寒假数学专项诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  { strategyId: 'vacation-2', version: 'v1.0', description: '初始版本，定义暑假英语综合诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  // 中考
  { strategyId: 'zhongkao-1', version: 'v2.1', description: '优化中考数学模拟诊断策略', publishTime: '2024-01-28 10:00', publisher: '张老师', publisherAccount: '456789' },
  { strategyId: 'zhongkao-1', version: 'v1.0', description: '初始版本，定义中考数学模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  { strategyId: 'zhongkao-2', version: 'v1.0', description: '初始版本，定义中考物理模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  // 高考
  { strategyId: 'gaokao-1', version: 'v3.0', description: '全面优化高考数学模拟诊断策略', publishTime: '2024-01-30 09:00', publisher: '王老师', publisherAccount: '234567' },
  { strategyId: 'gaokao-1', version: 'v2.0', description: '调整高考数学难度分布', publishTime: '2024-01-20 11:00', publisher: '李老师', publisherAccount: '345678' },
  { strategyId: 'gaokao-1', version: 'v1.0', description: '初始版本，定义高考数学模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
  
  { strategyId: 'gaokao-2', version: 'v2.0', description: '优化高考物理模拟诊断策略', publishTime: '2024-01-25 14:00', publisher: '张老师', publisherAccount: '456789' },
  { strategyId: 'gaokao-2', version: 'v1.0', description: '初始版本，定义高考物理模拟诊断策略', publishTime: '2024-01-10 09:00', publisher: '管理员', publisherAccount: '000001' },
];

// 策略卡片组件
function StrategyCard({ strategy }: { strategy: Strategy }) {
  const router = useRouter();
  const style = sceneStyles[strategy.scene];

  const handleClick = () => {
    router.push(`/adaptive-strategy/strategy/diagnosis/${strategy.id}`);
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
      style={{ width: '280px' }}
    >
      {/* 上半部分：图标和名称 */}
      <div className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-gray-50 to-white">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${style.bgColor}`}>
          {style.icon}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{strategy.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{strategy.phase} | {strategy.subject}</p>
        
        {/* 版本号 */}
        {strategy.currentVersion ? (
          <span className="text-xs text-gray-400 mb-2">版本号：{strategy.currentVersion}</span>
        ) : (
          <span className="text-xs text-gray-400 mb-2">版本号：--</span>
        )}
        
        {/* 状态标签 */}
        <div className="mt-1">
          {strategy.isNew || strategy.publishStatus === 'pending' ? (
            <span className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-50 rounded-full border border-orange-200">
              待发布{strategy.pendingChanges && strategy.pendingChanges > 0 ? ` · ${strategy.pendingChanges}项变更` : ''}
            </span>
          ) : strategy.hasUpdate || strategy.pendingChanges ? (
            <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200">
              待发布{strategy.pendingChanges && strategy.pendingChanges > 0 ? ` · ${strategy.pendingChanges}项变更` : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              已发布
            </span>
          )}
        </div>
      </div>

      {/* 下半部分：进入管理按钮 */}
      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
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

// 场景分组组件
function SceneGroup({ 
  sceneType, 
  strategies,
  onAddNew,
}: { 
  sceneType: SceneType;
  strategies: Strategy[];
  onAddNew: () => void;
}) {
  const style = sceneStyles[sceneType];
  const groupName = sceneGroupNames[sceneType];

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
          <div className="text-center py-8 text-gray-400">
            暂无策略，点击"新增"添加
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

// 使用 useSearchParams 的内部组件（需要 Suspense 包裹）
function DiagnosisStrategyListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 检测是否需要刷新（从新建页面返回时带 ?refresh=1 参数）
  const needRefresh = searchParams.get('refresh') === '1';
  // 获取返回时的场景参数，用于自动选中对应的场景分组
  const returnScene = searchParams.get('scene') as SceneFilterType | null;
  
  // 筛选状态
  const [selectedPhase, setSelectedPhase] = useState('senior');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [selectedScene, setSelectedScene] = useState<SceneFilterType>('all');
  
  // 新增的策略（从 localStorage 读取）
  const [newStrategies, setNewStrategies] = useState<Strategy[]>([]);
  // 已发布的新策略（发布后从 newStrategies 转移到这里）
  const [publishedNewStrategies, setPublishedNewStrategies] = useState<Strategy[]>([]);
  // 更新的策略数据（用于覆盖已有策略）
  const [updatedStrategies, setUpdatedStrategies] = useState<Map<string, Partial<Strategy>>>(new Map());
  // 删除的策略ID列表
  const [deletedStrategyIds, setDeletedStrategyIds] = useState<Set<string>>(new Set());
  
  // 版本管理状态
  const [currentVersion, setCurrentVersion] = useState('v1.0');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isPublished, setIsPublished] = useState(true);  // 是否已发布状态
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('02:00');
  
  // 定时发布信息
  const [scheduledPublish, setScheduledPublish] = useState<{
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
  } | null>(null);
  
  // 模拟版本历史数据
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([
    {
      version: 'v1.0',
      releaseDate: '2024-01-15',
      releaseNotes: '初始版本发布，包含同步学、期中期末考、寒暑假、中考、高考五大场景的学情诊断策略配置功能。',
      publisher: '系统管理员',
      publisherAccount: '000001',
      changes: [],
    },
  ]);
  
  // 检测是否有待发布的变更
  const hasPendingChanges = useMemo(() => {
    return newStrategies.length > 0 || updatedStrategies.size > 0 || deletedStrategyIds.size > 0;
  }, [newStrategies, updatedStrategies, deletedStrategyIds]);

  // 读取 localStorage 中的新策略和更新策略
  const loadNewStrategies = React.useCallback(() => {
    // 读取新增的策略
    const savedStrategies = localStorage.getItem('newDiagnosisStrategies');
    if (savedStrategies) {
      try {
        const parsed = JSON.parse(savedStrategies);
        // 转换为 Strategy 格式
        const convertedStrategies: Strategy[] = parsed.map((s: any) => ({
          id: s.id,
          name: s.name,
          scene: s.scene,
          phase: s.phase,
          subject: s.subject,
          questionCount: s.questionCount,
          difficultyRatio: s.difficultyRatio ? 
            `易${s.difficultyRatio.easy}% 较易${s.difficultyRatio.easier}% 中档${s.difficultyRatio.medium}% 较难${s.difficultyRatio.harder}% 难${s.difficultyRatio.hard}%` : '',
          typeRatio: s.typeRatios ? 
            s.typeRatios.map((t: any) => {
              const typeMap: Record<string, string> = {
                choice: '选择',
                fill: '填空',
                answer: '解答',
                judge: '判断',
                short: '简答',
              };
              const typeLabel = typeMap[t.typeId] || t.typeId;
              return `${typeLabel}${t.ratio}%`;
            }).join(' ') : '',
          publishStatus: s.publishStatus,
          currentVersion: s.currentVersion,
          pendingChanges: s.pendingChanges,
          isNew: true,  // 标记为新增
        }));
        setNewStrategies(prev => [...prev, ...convertedStrategies]);
        // 清除 localStorage（已读取）
        localStorage.removeItem('newDiagnosisStrategies');
      } catch (e) {
        console.error('Failed to parse saved strategies:', e);
      }
    }
    
    // 读取更新的策略数据
    const savedUpdates = localStorage.getItem('updatedDiagnosisStrategies');
    if (savedUpdates) {
      try {
        const parsed: any[] = JSON.parse(savedUpdates);
        // 转换为 Map<id, Strategy> 格式
        const updatesMap = new Map<string, Partial<Strategy>>();
        parsed.forEach((s: any) => {
          updatesMap.set(s.id, {
            id: s.id,
            name: s.name,
            scene: s.scene,
            phase: s.phase,
            subject: s.subject,
            questionCount: s.questionCount,
            difficultyRatio: s.difficultyRatio ? 
              `易${s.difficultyRatio.easy}% 较易${s.difficultyRatio.easier}% 中档${s.difficultyRatio.medium}% 较难${s.difficultyRatio.harder}% 难${s.difficultyRatio.hard}%` : '',
            typeRatio: s.typeRatios ? 
              s.typeRatios.map((t: any) => {
                const typeMap: Record<string, string> = {
                  choice: '选择',
                  fill: '填空',
                  answer: '解答',
                  judge: '判断',
                  short: '简答',
                };
                const typeLabel = typeMap[t.typeId] || t.typeId;
                return `${typeLabel}${t.ratio}%`;
              }).join(' ') : '',
            hasUpdate: true,  // 标记为有更新
          });
        });
        setUpdatedStrategies(prev => new Map([...prev, ...updatesMap]));
        // 清除 localStorage（已读取）
        localStorage.removeItem('updatedDiagnosisStrategies');
      } catch (e) {
        console.error('Failed to parse updated strategies:', e);
      }
    }
    
    // 读取删除的策略ID
    const savedDeletes = localStorage.getItem('deletedDiagnosisStrategies');
    if (savedDeletes) {
      try {
        const parsed: string[] = JSON.parse(savedDeletes);
        setDeletedStrategyIds(prev => new Set([...prev, ...parsed]));
        // 清除 localStorage（已读取）
        localStorage.removeItem('deletedDiagnosisStrategies');
      } catch (e) {
        console.error('Failed to parse deleted strategies:', e);
      }
    }
    
    // 读取已发布的新策略（从详情页发布成功后保存到这里）
    const savedPublishedNew = localStorage.getItem('publishedNewDiagnosisStrategies');
    if (savedPublishedNew) {
      try {
        const parsed: Strategy[] = JSON.parse(savedPublishedNew);
        setPublishedNewStrategies(prev => [...prev, ...parsed]);
        // 清除 localStorage（已读取）
        localStorage.removeItem('publishedNewDiagnosisStrategies');
      } catch (e) {
        console.error('Failed to parse published new strategies:', e);
      }
    }
  }, []);

  // 组件挂载时读取，或者在 URL 参数 refresh=1 时读取
  useEffect(() => {
    loadNewStrategies();
    
    // 如果返回时带有 scene 参数，自动选中对应的场景分组
    if (returnScene && returnScene !== 'all') {
      setSelectedScene(returnScene);
    }
    
    // 如果有 refresh 参数，清除 URL 参数
    if (needRefresh) {
      // 替换 URL，移除 refresh 和 scene 参数
      window.history.replaceState({}, '', '/adaptive-strategy/strategy/diagnosis');
    }
  }, [loadNewStrategies, needRefresh, returnScene]);

  // 页面可见性变化时读取（处理从新建页面返回的情况）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNewStrategies();
      }
    };
    
    const handleFocus = () => {
      loadNewStrategies();
    };
    
    // 监听自定义事件（新建页面保存后触发）
    const handleNewStrategy = () => {
      loadNewStrategies();
    };
    
    // 监听 pageshow 事件（处理浏览器前进/后退导航）
    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted 为 true 表示页面从 bfcache 恢复
      if (event.persisted) {
        loadNewStrategies();
      }
    };
    
    // 只在页面可见时定期检查 localStorage（作为后备方案）
    let intervalId: NodeJS.Timeout | null = null;
    const startInterval = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          loadNewStrategies();
        }, 500);
      }
    };
    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
    
    // 处理可见性变化（用于定时器控制）
    const handleVisibilityForInterval = () => {
      if (document.visibilityState === 'visible') {
        startInterval();
      } else {
        stopInterval();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityForInterval);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('newStrategySaved', handleNewStrategy);
    window.addEventListener('pageshow', handlePageShow);
    
    // 页面可见时启动定时器
    if (document.visibilityState === 'visible') {
      startInterval();
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityForInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('newStrategySaved', handleNewStrategy);
      window.removeEventListener('pageshow', handlePageShow);
      stopInterval();
    };
  }, [loadNewStrategies]);

  // 合并模拟数据和新策略
  const allStrategies = useMemo(() => {
    // 处理 mockStrategies，用更新的数据覆盖原有策略，并过滤掉删除的策略
    const processedMockStrategies = mockStrategies
      .filter(s => !deletedStrategyIds.has(s.id))  // 过滤删除的策略
      .map(s => {
        const update = updatedStrategies.get(s.id);
        if (update) {
          // 如果有更新数据，合并更新
          return { ...s, ...update, hasUpdate: true };
        }
        return s;
      });
    
    // 新增的策略也要过滤掉已删除的
    const filteredNewStrategies = newStrategies.filter(s => !deletedStrategyIds.has(s.id));
    
    // 已发布的新策略也需要过滤删除的
    const filteredPublishedNew = publishedNewStrategies.filter(s => !deletedStrategyIds.has(s.id));
    
    return [...processedMockStrategies, ...filteredNewStrategies, ...filteredPublishedNew];
  }, [newStrategies, publishedNewStrategies, updatedStrategies, deletedStrategyIds]);

  // 根据筛选条件过滤策略
  const filteredStrategies = useMemo(() => {
    return allStrategies.filter((s) => {
      // 场景筛选
      if (selectedScene !== 'all' && s.scene !== selectedScene) return false;
      
      // 学段筛选
      const phaseLabel = phaseOptions.find(p => p.id === selectedPhase)?.label;
      if (s.phase !== phaseLabel) return false;
      
      // 学科筛选
      const subjectLabel = subjectOptions.find(sub => sub.id === selectedSubject)?.label;
      if (s.subject !== subjectLabel) return false;
      
      return true;
    });
  }, [selectedPhase, selectedSubject, selectedScene]);

  // 按场景分组
  const groupedStrategies = useMemo(() => {
    const groups: Record<SceneType, Strategy[]> = {
      sync: [],
      exam: [],
      vacation: [],
      zhongkao: [],
      gaokao: [],
    };

    filteredStrategies.forEach((s) => {
      groups[s.scene].push(s);
    });

    return groups;
  }, [filteredStrategies]);

  // 确定要显示的分组
  const displayScenes = selectedScene === 'all' 
    ? sceneOrder 
    : [selectedScene];

  // 新增策略
  const handleAddNew = (sceneType: SceneType) => {
    router.push(`/adaptive-strategy/strategy/diagnosis/new?scene=${sceneType}`);
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

  // 获取变更摘要
  const getChangesSummary = () => {
    const changes: { type: 'add' | 'update' | 'delete'; strategyName: string; scene: string }[] = [];
    
    // 新增的策略
    newStrategies.forEach(s => {
      changes.push({
        type: 'add',
        strategyName: s.name,
        scene: sceneGroupNames[s.scene],
      });
    });
    
    // 更新的策略
    updatedStrategies.forEach((update, id) => {
      const original = mockStrategies.find(s => s.id === id);
      if (original) {
        changes.push({
          type: 'update',
          strategyName: update.name || original.name,
          scene: sceneGroupNames[update.scene || original.scene],
        });
      }
    });
    
    // 删除的策略
    deletedStrategyIds.forEach(id => {
      const original = mockStrategies.find(s => s.id === id);
      if (original) {
        changes.push({
          type: 'delete',
          strategyName: original.name,
          scene: sceneGroupNames[original.scene],
        });
      }
    });
    
    return changes;
  };

  // 处理发布
  const handlePublish = () => {
    if (!releaseNotes.trim()) {
      alert('请填写更新说明');
      return;
    }
    
    // 二次发布时沿用之前定时发布的版本号
    const newVersion = scheduledPublish?.version || generateNewVersion();
    const changes = getChangesSummary();
    
    if (publishType === 'scheduled') {
      // 定时发布：保存定时信息
      setScheduledPublish({
        version: newVersion,
        scheduledDate,
        scheduledTime,
        description: releaseNotes
      });
      // 清空待发布的变更
      setNewStrategies([]);
      setUpdatedStrategies(new Map());
      setDeletedStrategyIds(new Set());
    } else {
      // 立即发布
      // 生成6位随机数字账号
      const publisherAccount = String(Math.floor(100000 + Math.random() * 900000));
      
      // 创建新版本记录
      const newVersionHistory: VersionHistory = {
        version: newVersion,
        releaseDate: new Date().toISOString().split('T')[0],
        releaseNotes: releaseNotes,
        publisher: '当前用户',
        publisherAccount,
        changes: changes,
      };
      
      setVersionHistory(prev => [newVersionHistory, ...prev]);
      setCurrentVersion(newVersion);
      setIsPublished(true);
      
      // 清空待发布的变更和定时信息
      setNewStrategies([]);
      setUpdatedStrategies(new Map());
      setDeletedStrategyIds(new Set());
      setScheduledPublish(null);
    }
    
    setReleaseNotes('');
    setPublishType('immediate');
    setShowPublishModal(false);
  };

  return (
    <PageLayout
      activeMenuId="adaptive-strategy"
      breadcrumbs={[
        { label: '策略管理' },
        { label: '策略广场' },
        { label: '学情诊断', isLast: true },
      ]}
    >
      <div className="flex flex-col h-full">
        {/* 第一行：模块头部 */}
        <div className="bg-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* 左侧：返回、图标、标题、模块简介 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/adaptive-strategy')}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">学情诊断策略</h2>
                <p className="text-sm text-gray-500">针对不同学段、学科、学习场景，配置初次诊断出题策略</p>
              </div>
            </div>
            
            {/* 右侧：查看历史发布记录按钮 */}
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <History className="w-4 h-4" />
              查看历史发布记录
            </button>
          </div>
        </div>

        {/* 内容区域 - 按场景分组展示 */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* 筛选栏 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* 学段 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">学段：</label>
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {phaseOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
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
                  {subjectOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 场景 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">场景：</label>
                <select
                  value={selectedScene}
                  onChange={(e) => setSelectedScene(e.target.value as SceneFilterType)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {sceneOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {displayScenes.map((sceneType) => (
              <SceneGroup
                key={sceneType}
                sceneType={sceneType}
                strategies={groupedStrategies[sceneType]}
                onAddNew={() => handleAddNew(sceneType)}
              />
            ))}

            {/* 无数据提示 */}
            {filteredStrategies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无符合条件的策略</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 发布提示 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
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
                {scheduledPublish?.version || generateNewVersion()}
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
            
            {/* 本次更新内容 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">本次更新内容</label>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2 max-h-48 overflow-y-auto">
                {newStrategies.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-emerald-600 mb-1">新增策略</div>
                    {newStrategies.map(s => (
                      <div key={s.id} className="text-sm text-gray-600 pl-2 py-0.5">
                        · {s.name}（{sceneGroupNames[s.scene]}）
                      </div>
                    ))}
                  </div>
                )}
                {updatedStrategies.size > 0 && (
                  <div>
                    <div className="text-xs font-medium text-amber-600 mb-1">更新策略</div>
                    {Array.from(updatedStrategies.entries()).map(([id, update]) => {
                      const original = mockStrategies.find(s => s.id === id);
                      return (
                        <div key={id} className="text-sm text-gray-600 pl-2 py-0.5">
                          · {update.name || original?.name}（{sceneGroupNames[update.scene || original?.scene || 'sync']}）
                        </div>
                      );
                    })}
                  </div>
                )}
                {deletedStrategyIds.size > 0 && (
                  <div>
                    <div className="text-xs font-medium text-red-600 mb-1">删除策略</div>
                    {Array.from(deletedStrategyIds).map(id => {
                      const original = mockStrategies.find(s => s.id === id);
                      return (
                        <div key={id} className="text-sm text-gray-600 pl-2 py-0.5">
                          · {original?.name}（{original ? sceneGroupNames[original.scene] : ''}）
                        </div>
                      );
                    })}
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
                disabled={!releaseNotes.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishType === 'immediate' ? '确认发布' : '确认定时发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 聚合历史发布记录弹窗 */}
      <AggregateHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="历史发布记录"
        data={useMemo(() => {
          // 将策略发布历史转换为聚合历史项
          return strategyPublishHistory.map(record => {
            const strategy = mockStrategies.find(s => s.id === record.strategyId);
            return {
              id: `${record.strategyId}-${record.version}`,
              moduleName: strategy ? `${strategy.name}` : record.strategyId,
              moduleTags: strategy ? [strategy.phase, strategy.subject] : [],
              version: record.version,
              description: record.description,
              publishTime: record.publishTime,
              publisher: record.publisher,
              publisherAccount: record.publisherAccount,
            } as AggregateHistoryItem;
          });
        }, [])}
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
        onItemClick={(item) => {
          // 点击历史记录可以跳转到对应的策略详情页
          const strategyId = item.id.split('-').slice(0, -1).join('-');
          router.push(`/adaptive-strategy/strategy/diagnosis/${strategyId}`);
        }}
      />

    </PageLayout>
  );
}

// 包装组件，使用 Suspense 包裹 useSearchParams
export default function DiagnosisStrategyListPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosisStrategyListContent />
    </Suspense>
  );
}
