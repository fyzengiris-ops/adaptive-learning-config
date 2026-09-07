'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Save,
  History,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Edit2,
  Clock,
  Info,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/shared/PageLayout';
// 学段类型
type PhaseType = 'high' | 'middle' | 'primary';

// 学段配置
const phaseConfig: Record<PhaseType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  high: { label: '高中', icon: <GraduationCap className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-500' },
  middle: { label: '初中', icon: <GraduationCap className="w-5 h-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
  primary: { label: '小学', icon: <GraduationCap className="w-5 h-5" />, color: 'text-orange-600', bgColor: 'bg-orange-500' },
};

// 学段顺序
const phaseOrder: PhaseType[] = ['high', 'middle', 'primary'];

// 掌握度等级配置类型
interface MasteryLevel {
  id: string;
  name: string;
  color: string;
  colorBg: string;
  min: number;
  max: number;
}

// 变更记录类型
interface ChangeRecord {
  type: 'modify';
  target: string;
  detail: string;
  oldValue: { min: number; max: number };
  newValue: { min: number; max: number };
  phase?: PhaseType;
}

// 发布记录类型
interface PublishRecord {
  version: string;
  description: string;
  publishTime: string;
  publisher: string;
  publisherAccount?: string;
  changes: ChangeRecord[];
  config: Record<PhaseType, MasteryLevel[]>;
}

// 单个学段的页面状态
interface PhasePageState {
  status: 'published' | 'pending';
  currentVersion: string;
  lastPublishTime: string;
  lastPublisher: string;
  publishHistory: PublishRecord[];
  pendingChanges: ChangeRecord[];
  scheduledPublish?: {
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
    changes: ChangeRecord[];
  };
  canceledScheduledInfo?: {
    version: string;
    scheduledDate: string;
    scheduledTime: string;
    description: string;
  };
}

// 整体页面状态
interface MasteryPageStateAll {
  configs: Record<PhaseType, { masteryLevels: MasteryLevel[]; originalLevels: MasteryLevel[]; pageState: PhasePageState }>;
}

// 默认掌握度等级配置
const defaultMasteryLevels: MasteryLevel[] = [
  { id: 'excellent', name: '优秀', color: 'text-emerald-600', colorBg: 'bg-emerald-500', min: 76, max: 100 },
  { id: 'good', name: '良好', color: 'text-blue-600', colorBg: 'bg-blue-500', min: 51, max: 75 },
  { id: 'average', name: '一般', color: 'text-orange-600', colorBg: 'bg-orange-500', min: 26, max: 50 },
  { id: 'weak', name: '较弱', color: 'text-red-600', colorBg: 'bg-red-500', min: 0, max: 25 },
];

// 为每个学段创建独立的初始发布历史
const createPhasePublishHistory = (phase: PhaseType): PublishRecord[] => {
  const phaseLabel = phaseConfig[phase].label;
  const baseLevels = JSON.parse(JSON.stringify(defaultMasteryLevels));
  
  // 根据学段设置不同的历史记录
  const histories: Record<PhaseType, PublishRecord[]> = {
    high: [
      {
        version: 'v1.2',
        description: '优化高中掌握度划分标准，调整优秀和良好区间',
        publishTime: '2024-01-20 15:30',
        publisher: '王老师',
        publisherAccount: '234567',
        changes: [
          { type: 'modify', target: '优秀', detail: '调整优秀区间为76%-100%', oldValue: { min: 80, max: 100 }, newValue: { min: 76, max: 100 }, phase: 'high' },
        ],
        config: {
          high: [
            { id: 'excellent', name: '优秀', color: 'text-emerald-600', colorBg: 'bg-emerald-500', min: 76, max: 100 },
            { id: 'good', name: '良好', color: 'text-blue-600', colorBg: 'bg-blue-500', min: 51, max: 75 },
            { id: 'average', name: '一般', color: 'text-orange-600', colorBg: 'bg-orange-500', min: 26, max: 50 },
            { id: 'weak', name: '较弱', color: 'text-red-600', colorBg: 'bg-red-500', min: 0, max: 25 },
          ],
          middle: baseLevels,
          primary: baseLevels,
        },
      },
      {
        version: 'v1.0',
        description: '初始版本，定义高中掌握程度划分标准',
        publishTime: '2024-01-10 09:00',
        publisher: '管理员',
        publisherAccount: '000001',
        changes: [],
        config: { high: baseLevels, middle: baseLevels, primary: baseLevels },
      },
    ],
    middle: [
      {
        version: 'v1.1',
        description: '调整初中掌握度等级阈值，更适合初中生特点',
        publishTime: '2024-01-18 11:00',
        publisher: '李老师',
        publisherAccount: '345678',
        changes: [
          { type: 'modify', target: '良好', detail: '调整良好区间为51%-75%', oldValue: { min: 50, max: 75 }, newValue: { min: 51, max: 75 }, phase: 'middle' },
        ],
        config: {
          high: baseLevels,
          middle: [
            { id: 'excellent', name: '优秀', color: 'text-emerald-600', colorBg: 'bg-emerald-500', min: 76, max: 100 },
            { id: 'good', name: '良好', color: 'text-blue-600', colorBg: 'bg-blue-500', min: 51, max: 75 },
            { id: 'average', name: '一般', color: 'text-orange-600', colorBg: 'bg-orange-500', min: 26, max: 50 },
            { id: 'weak', name: '较弱', color: 'text-red-600', colorBg: 'bg-red-500', min: 0, max: 25 },
          ],
          primary: baseLevels,
        },
      },
      {
        version: 'v1.0',
        description: '初始版本，定义初中掌握程度划分标准',
        publishTime: '2024-01-10 09:00',
        publisher: '管理员',
        publisherAccount: '000001',
        changes: [],
        config: { high: baseLevels, middle: baseLevels, primary: baseLevels },
      },
    ],
    primary: [
      {
        version: 'v1.0',
        description: '初始版本，定义小学掌握程度划分标准',
        publishTime: '2024-01-10 09:00',
        publisher: '管理员',
        publisherAccount: '000001',
        changes: [],
        config: { high: baseLevels, middle: baseLevels, primary: baseLevels },
      },
    ],
  };
  
  return histories[phase];
};

// 初始化单个学段的状态
const createInitialPhaseState = (phase: PhaseType): PhasePageState => {
  const history = createPhasePublishHistory(phase);
  const latestRecord = history[0];
  
  return {
    status: 'published',
    currentVersion: latestRecord.version,
    lastPublishTime: latestRecord.publishTime,
    lastPublisher: latestRecord.publisher,
    publishHistory: history,
    pendingChanges: [],
  };
};

// 初始化整体页面状态
const initialPageStateAll: MasteryPageStateAll = {
  configs: {
    high: { masteryLevels: JSON.parse(JSON.stringify(defaultMasteryLevels)), originalLevels: JSON.parse(JSON.stringify(defaultMasteryLevels)), pageState: createInitialPhaseState('high') },
    middle: { masteryLevels: JSON.parse(JSON.stringify(defaultMasteryLevels)), originalLevels: JSON.parse(JSON.stringify(defaultMasteryLevels)), pageState: createInitialPhaseState('middle') },
    primary: { masteryLevels: JSON.parse(JSON.stringify(defaultMasteryLevels)), originalLevels: JSON.parse(JSON.stringify(defaultMasteryLevels)), pageState: createInitialPhaseState('primary') },
  },
};

// 获取当前用户名（模拟）
const getCurrentUserName = (): string => '管理员';

// 发布弹窗组件
function PublishModal({
  isOpen,
  onClose,
  onPublish,
  currentVersion,
  allPendingChanges,
  scheduledPublish,
  isScheduledState = false,
  selectedPhase,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (version: string, description: string, scheduledInfo?: { scheduledDate: string; scheduledTime: string }) => void;
  currentVersion: string;
  allPendingChanges: ChangeRecord[];
  scheduledPublish?: { version: string; scheduledDate: string; scheduledTime: string; description: string };
  isScheduledState?: boolean;
  selectedPhase: PhaseType | null;
}) {
  const [description, setDescription] = useState('');
  const [publishType, setPublishType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('02:00');

  useEffect(() => {
    if (isOpen && scheduledPublish) {
      setDescription(scheduledPublish.description);
      setScheduledDate(scheduledPublish.scheduledDate);
      setScheduledTime(scheduledPublish.scheduledTime);
      setPublishType(isScheduledState ? 'scheduled' : 'immediate');
    } else if (isOpen) {
      setDescription('');
      setPublishType('immediate');
      setScheduledDate('');
      setScheduledTime('02:00');
    }
  }, [isOpen, scheduledPublish, isScheduledState]);

  // 生成新版本号
  // 规则：每次更新次版本号+1，次版本号为9时再更新则次版本归零，主版本+1
  const generateNewVersion = (version: string): string => {
    const parts = version.replace('v', '').split('.');
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
    if (publishType === 'scheduled') {
      onPublish(newVersion, description.trim(), { scheduledDate, scheduledTime });
    } else {
      onPublish(newVersion, description.trim());
    }
    setDescription('');
    setPublishType('immediate');
    onClose();
  };

  if (!isOpen) return null;

  const changesByPhase: Record<PhaseType, ChangeRecord[]> = {
    high: allPendingChanges.filter(c => c.phase === 'high'),
    middle: allPendingChanges.filter(c => c.phase === 'middle'),
    primary: allPendingChanges.filter(c => c.phase === 'primary'),
  };

  // 如果选中了特定学段，只显示该学段的变更
  const displayPhases = selectedPhase ? [selectedPhase] : phaseOrder;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:w-[600px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">发布确认</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">版本号</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">当前版本：</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm font-mono">{currentVersion}</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm font-mono font-medium">{newVersion}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">更新说明 <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入本次发布的更新说明..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">发布时间</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="publishType" checked={publishType === 'immediate'} onChange={() => setPublishType('immediate')} className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-700">立即发布</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="publishType" checked={publishType === 'scheduled'} onChange={() => setPublishType('scheduled')} className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-700">定时发布</span>
              </label>
              {publishType === 'scheduled' && (
                <div className="ml-6 flex items-center gap-3">
                  <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">取消</button>
          <button onClick={handlePublish} disabled={!description.trim()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {publishType === 'immediate' ? '确认发布' : '确认定时发布'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 聚合历史记录项类型
interface AggregateHistoryItem {
  id: string;
  phase: PhaseType;
  version: string;
  description: string;
  publishTime: string;
  publisher: string;
  publisherAccount: string;
}

// 聚合历史发布记录弹窗组件
function AggregateHistoryModal({
  isOpen,
  onClose,
  pageStateAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  pageStateAll: MasteryPageStateAll;
}) {
  // 学段筛选状态
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  
  // 聚合所有学段的发布历史
  const allHistory: AggregateHistoryItem[] = useMemo(() => {
    const items: AggregateHistoryItem[] = [];
    phaseOrder.forEach(phase => {
      const history = pageStateAll.configs[phase].pageState.publishHistory;
      history.forEach(record => {
        items.push({
          id: `${phase}-${record.version}`,
          phase: phase,
          version: record.version,
          description: record.description,
          publishTime: record.publishTime,
          publisher: record.publisher,
          publisherAccount: record.publisherAccount || '-',
        });
      });
    });
    // 按发布时间倒序排列
    return items.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
  }, [pageStateAll]);
  
  // 根据学段筛选后的数据
  const filteredHistory = useMemo(() => {
    if (selectedPhase === 'all') return allHistory;
    return allHistory.filter(item => item.phase === selectedPhase);
  }, [allHistory, selectedPhase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:w-[700px] max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">历史发布记录</h3>
            <span className="text-sm text-gray-400">共{filteredHistory.length}条记录</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 筛选栏 */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">全部学段</option>
              {phaseOrder.map(phase => (
                <option key={phase} value={phase}>{phaseConfig[phase].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 列表内容 */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              暂无发布记录
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm font-mono font-medium">
                        {item.version}
                      </span>
                      <span className="text-sm text-gray-600">
                        {phaseConfig[item.phase].label}·掌握度划分
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{item.publishTime}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                  <p className="text-xs text-gray-400">
                    发布人: {item.publisher} (账号: {item.publisherAccount})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex justify-end px-5 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// 历史版本弹窗组件（二级页面使用）
function HistoryModal({
  isOpen,
  onClose,
  history,
  selectedPhase,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: PublishRecord[];
  selectedPhase: PhaseType | null;
}) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(version)) newSet.delete(version);
      else newSet.add(version);
      return newSet;
    });
  };

  if (!isOpen) return null;

  const displayPhases = selectedPhase ? [selectedPhase] : phaseOrder;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:w-[700px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">发布历史</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        
        {/* 筛选栏 - 禁用状态 */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <select
              value={selectedPhase || 'all'}
              disabled
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            >
              <option value="all">全部学段</option>
              {phaseOrder.map(phase => (
                <option key={phase} value={phase}>{phaseConfig[phase].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.version} className="border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => toggleVersion(record.version)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm font-mono font-medium">{record.version}</span>
                    <span className="text-xs text-gray-500">{record.publishTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">发布人：{record.publisher}（账号：{record.publisherAccount || '-'}）</span>
                    {expandedVersions.has(record.version) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {expandedVersions.has(record.version) && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="mb-3"><p className="text-sm text-gray-600">{record.description}</p></div>

                    <div className="space-y-3">
                      {displayPhases.map(phase => (
                        <div key={phase} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            {phaseConfig[phase].icon}
                            <span>{phaseConfig[phase].label}</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {record.config[phase].map((level) => (
                              <div key={level.id} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${level.colorBg}`}></div>
                                <span className="text-sm text-gray-700">{level.name}：</span>
                                <span className="text-sm text-gray-600 font-medium">{level.min}% - {level.max}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {record.changes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">变更记录：</p>
                        <div className="space-y-1">
                          {record.changes.filter(c => !selectedPhase || c.phase === selectedPhase).map((change, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {change.phase && <span className="text-xs text-gray-400">[{phaseConfig[change.phase].label}]</span>}
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">修改</span>
                              <span className="text-gray-600">{change.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">关闭</button>
        </div>
      </div>
    </div>
  );
}

export default function MasteryLevelPage() {
  const router = useRouter();
  const [selectedPhase, setSelectedPhase] = useState<PhaseType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pageStateAll, setPageStateAll] = useState<MasteryPageStateAll>(initialPageStateAll);
  const [editBackupAll, setEditBackupAll] = useState<Record<PhaseType, MasteryLevel[]>>({
    high: [],
    middle: [],
    primary: [],
  });
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAggregateHistoryModal, setShowAggregateHistoryModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 当前选中学段的状态
  const currentPageState = selectedPhase ? pageStateAll.configs[selectedPhase].pageState : pageStateAll.configs.high.pageState;

  const allPendingChanges = useMemo(() => {
    if (selectedPhase) {
      return pageStateAll.configs[selectedPhase].pageState.pendingChanges.map(c => ({ ...c, phase: selectedPhase }));
    }
    const changes: ChangeRecord[] = [];
    phaseOrder.forEach(phase => {
      changes.push(...pageStateAll.configs[phase].pageState.pendingChanges.map(c => ({ ...c, phase })));
    });
    return changes;
  }, [pageStateAll, selectedPhase]);

  const totalPendingCount = allPendingChanges.length;

  const hasScheduledPublish = selectedPhase
    ? !!pageStateAll.configs[selectedPhase].pageState.scheduledPublish && pageStateAll.configs[selectedPhase].pageState.pendingChanges.length === 0
    : phaseOrder.some(phase => pageStateAll.configs[phase].pageState.scheduledPublish && pageStateAll.configs[phase].pageState.pendingChanges.length === 0);

  const scheduledPublishInfo = useMemo(() => {
    if (selectedPhase) {
      const sp = pageStateAll.configs[selectedPhase].pageState.scheduledPublish;
      if (sp) return sp;
      const csi = pageStateAll.configs[selectedPhase].pageState.canceledScheduledInfo;
      if (csi) return csi;
      return undefined;
    }
    for (const phase of phaseOrder) {
      const sp = pageStateAll.configs[phase].pageState.scheduledPublish;
      if (sp) return sp;
    }
    for (const phase of phaseOrder) {
      const csi = pageStateAll.configs[phase].pageState.canceledScheduledInfo;
      if (csi) return csi;
    }
    return undefined;
  }, [pageStateAll, selectedPhase]);

  const handleCancelScheduled = () => {
    const phasesToCancel = selectedPhase ? [selectedPhase] : phaseOrder;
    setPageStateAll(prev => {
      const newConfigs = { ...prev.configs };
      phasesToCancel.forEach(phase => {
        const sp = prev.configs[phase].pageState.scheduledPublish;
        if (sp) {
          newConfigs[phase] = {
            ...newConfigs[phase],
            pageState: {
              ...newConfigs[phase].pageState,
              status: 'pending',
              pendingChanges: sp.changes,
              scheduledPublish: undefined,
              canceledScheduledInfo: {
                version: sp.version,
                scheduledDate: sp.scheduledDate,
                scheduledTime: sp.scheduledTime,
                description: sp.description,
              },
            },
          };
        }
      });
      return { ...prev, configs: newConfigs };
    });
  };

  const handleStartEdit = () => {
    const phasesToBackup = selectedPhase ? [selectedPhase] : phaseOrder;
    const newBackup: Record<PhaseType, MasteryLevel[]> = { high: [], middle: [], primary: [] };
    phasesToBackup.forEach(phase => {
      newBackup[phase] = JSON.parse(JSON.stringify(pageStateAll.configs[phase].masteryLevels));
    });
    setEditBackupAll(newBackup);
    setIsEditing(true);
    setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    const phasesToRestore = selectedPhase ? [selectedPhase] : phaseOrder;
    setPageStateAll(prev => {
      const newConfigs = { ...prev.configs };
      phasesToRestore.forEach(phase => {
        newConfigs[phase] = {
          ...newConfigs[phase],
          masteryLevels: JSON.parse(JSON.stringify(editBackupAll[phase])),
        };
      });
      return { ...prev, configs: newConfigs };
    });
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleRangeChange = (phase: PhaseType, id: string, field: 'min' | 'max', value: number) => {
    if (!isEditing) return;
    const clampedValue = Math.max(0, Math.min(100, value));

    setPageStateAll(prev => {
      const newLevels = prev.configs[phase].masteryLevels.map((level) => {
        if (level.id !== id) return level;
        const newMin = field === 'min' ? clampedValue : level.min;
        const newMax = field === 'max' ? clampedValue : level.max;
        return { ...level, min: newMin, max: newMax };
      });

      const index = newLevels.findIndex((l) => l.id === id);
      if (field === 'max' && index > 0) {
        const prevLevel = newLevels[index - 1];
        if (prevLevel) prevLevel.min = clampedValue + 1;
      }
      if (field === 'min' && index < newLevels.length - 1) {
        const nextLevel = newLevels[index + 1];
        if (nextLevel) nextLevel.max = clampedValue - 1;
      }

      return {
        ...prev,
        configs: {
          ...prev.configs,
          [phase]: { ...prev.configs[phase], masteryLevels: newLevels },
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const detectChanges = (newLevels: MasteryLevel[], oldLevels: MasteryLevel[], phase: PhaseType): ChangeRecord[] => {
    const changes: ChangeRecord[] = [];
    newLevels.forEach((newLevel) => {
      const oldLevel = oldLevels.find((l) => l.id === newLevel.id);
      if (oldLevel && (oldLevel.min !== newLevel.min || oldLevel.max !== newLevel.max)) {
        changes.push({
          type: 'modify',
          target: newLevel.name,
          detail: `${newLevel.name}：区间从 ${oldLevel.min}-${oldLevel.max} 修改为 ${newLevel.min}-${newLevel.max}`,
          oldValue: { min: oldLevel.min, max: oldLevel.max },
          newValue: { min: newLevel.min, max: newLevel.max },
          phase: phase,
        });
      }
    });
    return changes;
  };

  const handleSave = () => {
    const phasesToSave = selectedPhase ? [selectedPhase] : phaseOrder;
    let totalChanges = 0;
    const newConfigs = { ...pageStateAll.configs };

    phasesToSave.forEach(phase => {
      const changes = detectChanges(
        pageStateAll.configs[phase].masteryLevels,
        editBackupAll[phase],
        phase
      );
      totalChanges += changes.length;

      if (changes.length > 0) {
        newConfigs[phase] = {
          masteryLevels: pageStateAll.configs[phase].masteryLevels,
          originalLevels: JSON.parse(JSON.stringify(pageStateAll.configs[phase].masteryLevels)),
          pageState: {
            ...pageStateAll.configs[phase].pageState,
            status: 'pending',
            pendingChanges: [...pageStateAll.configs[phase].pageState.pendingChanges, ...changes],
          },
        };
      }
    });

    if (totalChanges === 0) {
      return;
    }

    setPageStateAll(prev => ({
      ...prev,
      configs: newConfigs,
    }));

    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const handlePublish = (version: string, description: string, scheduledInfo?: { scheduledDate: string; scheduledTime: string }) => {
    const phasesToPublish = selectedPhase ? [selectedPhase] : phaseOrder;
    
    if (scheduledInfo) {
      setPageStateAll(prev => {
        const newConfigs = { ...prev.configs };
        phasesToPublish.forEach(phase => {
          const currentPendingChanges = newConfigs[phase].pageState.pendingChanges;
          if (currentPendingChanges.length > 0) {
            newConfigs[phase] = {
              ...newConfigs[phase],
              pageState: {
                ...newConfigs[phase].pageState,
                status: 'pending',
                pendingChanges: [],
                scheduledPublish: { 
                  version, 
                  scheduledDate: scheduledInfo.scheduledDate, 
                  scheduledTime: scheduledInfo.scheduledTime, 
                  description,
                  changes: currentPendingChanges,
                },
              },
            };
          }
        });
        return { ...prev, configs: newConfigs };
      });
    } else {
      const currentTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-');
      const publisherAccount = String(Math.floor(100000 + Math.random() * 900000));

      const allConfigs: Record<PhaseType, MasteryLevel[]> = {
        high: JSON.parse(JSON.stringify(pageStateAll.configs.high.masteryLevels)),
        middle: JSON.parse(JSON.stringify(pageStateAll.configs.middle.masteryLevels)),
        primary: JSON.parse(JSON.stringify(pageStateAll.configs.primary.masteryLevels)),
      };

      const newRecord: PublishRecord = {
        version,
        description,
        publishTime: currentTime,
        publisher: getCurrentUserName(),
        publisherAccount,
        changes: allPendingChanges,
        config: allConfigs,
      };

      setPageStateAll(prev => {
        const newConfigs = { ...prev.configs };
        phasesToPublish.forEach(phase => {
          newConfigs[phase] = {
            ...newConfigs[phase],
            pageState: {
              ...newConfigs[phase].pageState,
              status: 'published',
              currentVersion: version,
              lastPublishTime: currentTime,
              lastPublisher: getCurrentUserName(),
              publishHistory: [newRecord, ...newConfigs[phase].pageState.publishHistory],
              pendingChanges: [],
              scheduledPublish: undefined,
            },
          };
        });
        return { ...prev, configs: newConfigs };
      });
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      if (!confirm('有未保存的更改，确定要返回吗？')) {
        return;
      }
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setSelectedPhase(null);
  };

  const handleBackToAdaptive = () => {
    router.push('/adaptive-strategy');
  };

  // 渲染单个学段的配置表格
  const renderPhaseBlock = (phase: PhaseType) => {
    const levels = pageStateAll.configs[phase].masteryLevels;
    const pendingCount = pageStateAll.configs[phase].pageState.pendingChanges.length;

    return (
      <div key={phase} className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-4 ${phaseConfig[phase].bgColor} rounded-full`}></div>
            {phaseConfig[phase].icon}
            <span className="font-medium text-gray-800">{phaseConfig[phase].label}</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
              {pendingCount} 项待发布
            </span>
          )}
        </div>

        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600 w-32">掌握度等级</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600 w-32">颜色标识</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">区间范围</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => (
                <tr key={level.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${level.colorBg}`}></div>
                      <span className={`font-medium ${level.color}`}>{level.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className={`w-8 h-8 rounded-lg ${level.colorBg} shadow-sm`}></div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={level.min}
                        onChange={(e) => handleRangeChange(phase, level.id, 'min', parseInt(e.target.value) || 0)}
                        min={0}
                        max={100}
                        disabled={!isEditing}
                        className={`w-16 px-3 py-2 border rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                        }`}
                      />
                      <span className="text-gray-500 text-sm">% -</span>
                      <input
                        type="number"
                        value={level.max}
                        onChange={(e) => handleRangeChange(phase, level.id, 'max', parseInt(e.target.value) || 0)}
                        min={0}
                        max={100}
                        disabled={!isEditing}
                        className={`w-16 px-3 py-2 border rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                        }`}
                      />
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 渲染一级页面（策略列表）
  const renderListPage = () => {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* 页面头部 */}
        <div className="bg-white px-6 py-4 flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToAdaptive} className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">掌握度划分策略配置</h2>
                <p className="text-sm text-gray-500">管理各学段的掌握程度划分策略</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAggregateHistoryModal(true)}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <History className="w-4 h-4" />
              查看历史发布记录
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* 白色背景的大模块容器 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 模块标题栏 - 灰色底色区域 */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-semibold text-gray-800">掌握度划分策略</h3>
                  <span className="text-sm text-gray-400">(3项)</span>
                </div>
                <p className="text-sm text-gray-500">定义各学段知识点掌握程度的等级划分标准</p>
              </div>
              
              {/* 卡片网格 - 横向排列 */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 高中卡片 */}
                  <div
                    onClick={() => setSelectedPhase('high')}
                    className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* 图标 */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                      {/* 标题 */}
                      <h4 className="font-semibold text-gray-900 text-base mb-1">高中掌握度划分策略</h4>
                      {/* 版本号 */}
                      <span className="text-sm text-gray-400 mb-2">{pageStateAll.configs.high.pageState.currentVersion}</span>
                      {/* 状态标签 */}
                      <div className="mb-3">
                        <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                          已发布
                        </span>
                      </div>
                      {/* 描述 */}
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">定义高中阶段知识点掌握程度的等级划分标准</p>
                      {/* 进入管理按钮 */}
                      <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                        进入管理
                      </button>
                    </div>
                  </div>

                  {/* 初中卡片 */}
                  <div
                    onClick={() => setSelectedPhase('middle')}
                    className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* 图标 */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                      {/* 标题 */}
                      <h4 className="font-semibold text-gray-900 text-base mb-1">初中掌握度划分策略</h4>
                      {/* 版本号 */}
                      <span className="text-sm text-gray-400 mb-2">{pageStateAll.configs.middle.pageState.currentVersion}</span>
                      {/* 状态标签 - 待发布 */}
                      <div className="mb-3">
                        <span className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                          待发布 · 3项变更
                        </span>
                      </div>
                      {/* 描述 */}
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">定义初中阶段知识点掌握程度的等级划分标准</p>
                      {/* 进入管理按钮 */}
                      <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                        进入管理
                      </button>
                    </div>
                  </div>

                  {/* 小学卡片 */}
                  <div
                    onClick={() => setSelectedPhase('primary')}
                    className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-orange-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* 图标 */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                      {/* 标题 */}
                      <h4 className="font-semibold text-gray-900 text-base mb-1">小学掌握度划分策略</h4>
                      {/* 版本号 */}
                      <span className="text-sm text-gray-400 mb-2">{pageStateAll.configs.primary.pageState.currentVersion}</span>
                      {/* 状态标签 */}
                      <div className="mb-3">
                        <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                          已发布
                        </span>
                      </div>
                      {/* 描述 */}
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">定义小学阶段知识点掌握程度的等级划分标准</p>
                      {/* 进入管理按钮 */}
                      <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                        进入管理
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染二级页面（策略详情）
  const renderDetailPage = () => {
    if (!selectedPhase) return null;
    
    const phaseInfo = phaseConfig[selectedPhase];
    const levels = pageStateAll.configs[selectedPhase].masteryLevels;
    const pendingCount = pageStateAll.configs[selectedPhase].pageState.pendingChanges.length;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* 页面头部 */}
        <div className="bg-white px-6 py-4 flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToList} className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <div className={`w-10 h-10 rounded-xl ${phaseInfo.bgColor} flex items-center justify-center`}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{phaseInfo.label}掌握度划分策略</h2>
                <p className="text-sm text-gray-500">定义{phaseInfo.label}阶段知识点掌握程度的等级划分标准</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">版本：</span>
                <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded border border-gray-200">
                  {currentPageState.currentVersion}
                </span>
                <button onClick={() => setShowHistoryModal(true)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="查看历史版本">
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {/* 发布提示条 */}
          {pendingCount > 0 && (
            <div className="mb-4">
              <div className="bg-amber-50 px-5 py-3 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      有 <span className="font-medium">{pendingCount}</span> 项变更待发布，发布后才能生效
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowHistoryModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors">
                      <History className="w-4 h-4" />
                      <span>查看历史版本</span>
                    </button>
                    <button onClick={() => setShowPublishModal(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
                      <span>发布</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500 mt-2">
                <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>信息发布将影响线上用户的实际使用，发布时，建议避开用户高频使用的时间段</span>
              </div>
            </div>
          )}

          {/* 定时发布状态 */}
          {hasScheduledPublish && pendingCount === 0 && (
            <div className="mb-4">
              <div className="bg-blue-50 px-5 py-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      {scheduledPublishInfo?.version} 版本将于您设定的时间（{scheduledPublishInfo?.scheduledDate} {scheduledPublishInfo?.scheduledTime}）自动发布
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCancelScheduled} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                      <span>取消定时</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 配置卡片 */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 卡片头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">掌握程度区间配置</h3>
                <p className="text-sm text-gray-500 mt-0.5">配置{phaseInfo.label}各掌握等级的区间范围与颜色标识</p>
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button onClick={handleCancelEdit} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">取消</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm">
                      <Save className="w-4 h-4" />
                      <span>保存</span>
                    </button>
                  </>
                ) : (
                  <button onClick={handleStartEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm">
                    <Edit2 className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                )}
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="p-5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600 w-32">掌握度等级</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600 w-32">颜色标识</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">区间范围</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level) => (
                    <tr key={level.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${level.colorBg}`}></div>
                          <span className={`font-medium ${level.color}`}>{level.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className={`w-8 h-8 rounded-lg ${level.colorBg} shadow-sm`}></div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={level.min}
                            onChange={(e) => handleRangeChange(selectedPhase, level.id, 'min', parseInt(e.target.value) || 0)}
                            min={0}
                            max={100}
                            disabled={!isEditing}
                            className={`w-16 px-3 py-2 border rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-gray-500 text-sm">% -</span>
                          <input
                            type="number"
                            value={level.max}
                            onChange={(e) => handleRangeChange(selectedPhase, level.id, 'max', parseInt(e.target.value) || 0)}
                            min={0}
                            max={100}
                            disabled={!isEditing}
                            className={`w-16 px-3 py-2 border rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 提示文字 */}
              <div className="p-3 bg-gray-50 rounded-lg mt-4">
                {isEditing ? (
                  <p className="text-xs text-gray-500">说明：修改区间范围时，系统会自动调整相邻区间的边界值，确保区间连续且覆盖 0%-100%。</p>
                ) : (
                  <p className="text-xs text-gray-500">提示：点击右上角"编辑"按钮可修改掌握度区间配置。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      activeMenuId="adaptive-strategy"
      breadcrumbs={[
        { label: '策略管理' },
        { label: '策略广场' },
        { label: '掌握程度划分', isLast: selectedPhase === null },
        ...(selectedPhase ? [{ label: `${phaseConfig[selectedPhase].label}掌握度划分策略`, isLast: true }] : []),
      ]}
    >
      {selectedPhase === null ? renderListPage() : renderDetailPage()}

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        currentVersion={currentPageState.currentVersion}
        allPendingChanges={allPendingChanges}
        scheduledPublish={scheduledPublishInfo}
        isScheduledState={hasScheduledPublish}
        selectedPhase={selectedPhase}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={currentPageState.publishHistory}
        selectedPhase={selectedPhase}
      />

      <AggregateHistoryModal
        isOpen={showAggregateHistoryModal}
        onClose={() => setShowAggregateHistoryModal(false)}
        pageStateAll={pageStateAll}
      />

    </PageLayout>
  );
}
