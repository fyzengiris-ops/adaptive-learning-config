'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, History, Search, ChevronRight, Filter, Calendar } from 'lucide-react';
import PrdTooltip, { PrdTooltipData } from './PrdTooltip';

// 聚合历史项类型
export interface AggregateHistoryItem {
  id: string;              // 唯一标识
  moduleName: string;      // 模块名称（如"高中·数学"、"学情诊断"）
  modulePath?: string;     // 模块路径（用于点击跳转）
  moduleTags?: string[];   // 模块标签（如["人教版", "高一"]）
  version: string;         // 版本号
  description: string;     // 更新说明
  publishTime: string;     // 发布时间
  publisher: string;       // 发布人
  publisherAccount: string;// 发布人账号
  rawData?: any;           // 原始数据（用于扩展）
}

// 筛选配置类型
export interface FilterConfig {
  showTypeFilter?: boolean;       // 显示类型筛选
  showPhaseFilter?: boolean;     // 显示学段筛选
  showSubjectFilter?: boolean;   // 显示学科筛选
  showGradeFilter?: boolean;     // 显示年级筛选
  showPublisherFilter?: boolean; // 显示出版社筛选
  showModuleFilter?: boolean;    // 显示策略模块筛选
  showTimeRangeFilter?: boolean; // 显示时间范围筛选
  typeOptions?: { id: string; label: string }[];
  phaseOptions?: { id: string; label: string }[];
  subjectOptions?: { id: string; label: string }[];
  gradeOptions?: { id: string; label: string }[];
  publisherOptions?: { id: string; label: string }[];
  moduleOptions?: { id: string; label: string }[];
}

// 默认筛选值类型
export interface DefaultFilterValues {
  type?: string;
  phase?: string;
  subject?: string;
  grade?: string;
  publisher?: string;
  module?: string;
}

// 弹窗各区域的 PrdTooltip 数据配置
export interface HistoryModalTooltipConfig {
  modalHeader?: PrdTooltipData;
  typeFilter?: PrdTooltipData;
  phaseFilter?: PrdTooltipData;
  subjectFilter?: PrdTooltipData;
  strategyNameFilter?: PrdTooltipData;
  keywordSearch?: PrdTooltipData;
  historyList?: PrdTooltipData;
  recordItem?: PrdTooltipData;
  currentVersionTag?: PrdTooltipData;
  closeButton?: PrdTooltipData;
  emptyNoRecords?: PrdTooltipData;
  emptyNoMatch?: PrdTooltipData;
  loadFailure?: PrdTooltipData;
}

// 弹窗 Props
interface AggregateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;                  // 弹窗标题
  data: AggregateHistoryItem[];   // 聚合后的历史数据
  filterConfig?: FilterConfig;    // 筛选配置
  filterDisabled?: boolean;       // 筛选字段是否禁用（置灰不可选）
  defaultFilterValues?: DefaultFilterValues; // 默认筛选值
  onItemClick?: (item: AggregateHistoryItem) => void;  // 点击条目回调
  pageSize?: number;              // 每页显示数量，默认20
  tooltipConfig?: HistoryModalTooltipConfig; // 各区域tooltip数据
  strategyName?: string;          // 当前策略名称（个性化策略展示）
  currentVersion?: string;        // 当前已发布版本号（用于标记当前版本）
  hideFilters?: boolean;          // 隐藏筛选栏，仅保留搜索框
}

// 时间格式化工具函数
function formatPublishTime(time: string): string {
  // 如果已经是格式化的时间，直接返回
  if (time.includes('-') && time.includes(':')) {
    return time;
  }
  return time;
}

// 时间排序比较函数
function sortByPublishTime(a: AggregateHistoryItem, b: AggregateHistoryItem): number {
  const timeA = new Date(a.publishTime.replace(/-/g, '/')).getTime();
  const timeB = new Date(b.publishTime.replace(/-/g, '/')).getTime();
  return timeB - timeA; // 倒序，最新的在前
}

export default function AggregateHistoryModal({
  isOpen,
  onClose,
  title,
  data,
  filterConfig,
  filterDisabled = false,
  defaultFilterValues,
  onItemClick,
  pageSize = 20,
  tooltipConfig,
  strategyName,
  currentVersion,
  hideFilters = false,
}: AggregateHistoryModalProps) {
  // 筛选状态 - 使用默认值初始化
  const [selectedType, setSelectedType] = useState<string>(defaultFilterValues?.type || 'all');
  const [selectedPhase, setSelectedPhase] = useState<string>(defaultFilterValues?.phase || 'all');
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultFilterValues?.subject || 'all');
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultFilterValues?.grade || 'all');
  const [selectedPublisher, setSelectedPublisher] = useState<string>(defaultFilterValues?.publisher || 'all');
  const [selectedModule, setSelectedModule] = useState<string>(defaultFilterValues?.module || 'all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // 重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedPhase, selectedSubject, selectedGrade, selectedPublisher, selectedModule, searchKeyword]);

  // 筛选后的数据
  const filteredData = useMemo(() => {
    // 如果筛选被禁用，直接返回排序后的数据，不进行任何筛选
    if (filterDisabled) {
      return [...data].sort(sortByPublishTime);
    }
    
    let result = [...data];
    
    // 按类型筛选
    if (filterConfig?.showTypeFilter && selectedType !== 'all') {
      const typeLabel = filterConfig.typeOptions?.find(t => t.id === selectedType)?.label || '';
      result = result.filter(item =>
        item.moduleTags?.some(tag => tag.includes(typeLabel))
      );
    }
    
    // 按学段筛选
    if (filterConfig?.showPhaseFilter && selectedPhase !== 'all') {
      const phaseLabel = filterConfig.phaseOptions?.find(p => p.id === selectedPhase)?.label || '';
      result = result.filter(item => item.moduleName.includes(phaseLabel));
    }
    
    // 按学科筛选
    if (filterConfig?.showSubjectFilter && selectedSubject !== 'all') {
      const subjectLabel = filterConfig.subjectOptions?.find(s => s.id === selectedSubject)?.label || '';
      result = result.filter(item => item.moduleName.includes(subjectLabel));
    }
    
    // 按年级筛选
    if (filterConfig?.showGradeFilter && selectedGrade !== 'all') {
      const gradeLabel = filterConfig.gradeOptions?.find(g => g.id === selectedGrade)?.label || '';
      result = result.filter(item => 
        item.moduleTags?.some(tag => tag.includes(gradeLabel)) || item.moduleName.includes(gradeLabel)
      );
    }
    
    // 按出版社筛选
    if (filterConfig?.showPublisherFilter && selectedPublisher !== 'all') {
      const publisherLabel = filterConfig.publisherOptions?.find(p => p.id === selectedPublisher)?.label || '';
      result = result.filter(item => 
        item.moduleTags?.some(tag => tag.includes(publisherLabel)) || item.moduleName.includes(publisherLabel)
      );
    }
    
    // 按模块筛选
    if (filterConfig?.showModuleFilter && selectedModule !== 'all') {
      const moduleLabel = filterConfig.moduleOptions?.find(m => m.id === selectedModule)?.label || '';
      result = result.filter(item => item.moduleName.includes(moduleLabel));
    }
    
    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(item =>
        item.moduleName.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.publisher.toLowerCase().includes(keyword) ||
        item.version.toLowerCase().includes(keyword)
      );
    }
    
    // 按时间排序
    return result.sort(sortByPublishTime);
  }, [data, filterConfig, selectedType, selectedPhase, selectedSubject, selectedGrade, selectedPublisher, selectedModule, searchKeyword, filterDisabled]);

  // 分页后的数据
  const pagedData = useMemo(() => {
    return filteredData.slice(0, currentPage * pageSize);
  }, [filteredData, currentPage, pageSize]);

  // 是否还有更多
  const hasMore = pagedData.length < filteredData.length;

  // 加载更多
  const loadMore = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 处理滚动加载
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50 && hasMore) {
      loadMore();
    }
  };

  // 处理条目点击
  const handleItemClick = (item: AggregateHistoryItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <span className="text-sm text-gray-400 ml-2">共 {filteredData.length} 条记录</span>
            {tooltipConfig?.modalHeader && <PrdTooltip data={tooltipConfig.modalHeader} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors relative"
          >
            <X className="w-5 h-5 text-gray-500" />
            {tooltipConfig?.closeButton && <PrdTooltip data={tooltipConfig.closeButton} />}
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 类型筛选 */}
            {!hideFilters && filterConfig?.showTypeFilter && filterConfig.typeOptions && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={filterDisabled}
                  className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="all">全部场景</option>
                  {filterConfig.typeOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                {tooltipConfig?.typeFilter && <PrdTooltip data={tooltipConfig.typeFilter} />}
              </div>
            )}

            {/* 学段筛选 */}
            {!hideFilters && filterConfig?.showPhaseFilter && filterConfig.phaseOptions && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  disabled={filterDisabled}
                  className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="all">全部学段</option>
                  {filterConfig.phaseOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                {tooltipConfig?.phaseFilter && <PrdTooltip data={tooltipConfig.phaseFilter} />}
              </div>
            )}

            {/* 学科筛选 */}
            {!hideFilters && filterConfig?.showSubjectFilter && filterConfig.subjectOptions && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={filterDisabled}
                  className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="all">全部学科</option>
                  {filterConfig.subjectOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                {tooltipConfig?.subjectFilter && <PrdTooltip data={tooltipConfig.subjectFilter} />}
              </div>
            )}

            {/* 年级筛选 */}
            {!hideFilters && filterConfig?.showGradeFilter && filterConfig.gradeOptions && (
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                disabled={filterDisabled}
                className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              >
                <option value="all">全部年级</option>
                {filterConfig.gradeOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            )}

            {/* 出版社筛选 */}
            {!hideFilters && filterConfig?.showPublisherFilter && filterConfig.publisherOptions && (
              <select
                value={selectedPublisher}
                onChange={(e) => setSelectedPublisher(e.target.value)}
                disabled={filterDisabled}
                className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              >
                <option value="all">全部出版社</option>
                {filterConfig.publisherOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            )}

            {/* 模块筛选 */}
            {!hideFilters && filterConfig?.showModuleFilter && filterConfig.moduleOptions && (
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={filterDisabled}
                className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              >
                <option value="all">全部模块</option>
                {filterConfig.moduleOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            )}

            {/* 策略名称（个性化策略展示）- 仅在有策略名称且筛选项可见时展示 */}
            {strategyName && !hideFilters && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={strategyName}
                  readOnly
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                {tooltipConfig?.strategyNameFilter && <PrdTooltip data={tooltipConfig.strategyNameFilter} />}
              </div>
            )}

            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px] flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索版本号、描述、发布人..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  disabled={hideFilters ? false : filterDisabled}
                  className={`w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    !hideFilters && filterDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
              {tooltipConfig?.keywordSearch && <PrdTooltip data={tooltipConfig.keywordSearch} />}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div 
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5"
        >
          {pagedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <History className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">{data.length === 0 ? '暂无历史发布记录' : '暂无符合搜索条件的数据'}</p>
              {data.length === 0 && tooltipConfig?.emptyNoRecords && (
                <PrdTooltip data={tooltipConfig.emptyNoRecords} />
              )}
              {filteredData.length === 0 && data.length > 0 && tooltipConfig?.emptyNoMatch && (
                <PrdTooltip data={tooltipConfig.emptyNoMatch} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {pagedData.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => handleItemClick(item)}
                  className={`bg-white border border-gray-200 rounded-lg p-4 transition-all ${
                    onItemClick ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md' : ''
                  }`}
                >
                  {/* 版本号和时间 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm font-mono font-medium">
                        {item.version}
                      </span>
                      {currentVersion && item.version === currentVersion && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white rounded text-xs font-medium">
                          当前版本
                        </span>
                      )}
                      {currentVersion && item.version === currentVersion && tooltipConfig?.currentVersionTag && (
                        <PrdTooltip data={tooltipConfig.currentVersionTag} />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {item.moduleName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatPublishTime(item.publishTime)}
                    </span>
                  </div>

                  {/* 标签 */}
                  {item.moduleTags && item.moduleTags.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      {item.moduleTags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 描述 */}
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                  {/* 发布人 */}
                  <span className="text-xs text-gray-400">
                    发布人：{item.publisher}（账号：{item.publisherAccount || '-'}）
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 加载更多 */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                加载更多 ({filteredData.length - pagedData.length} 条)
              </button>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-gray-50">
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
