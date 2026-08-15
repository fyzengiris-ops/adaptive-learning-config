'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  FileSpreadsheet,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ==================== 类型定义 ====================

/** 导入校验状态 */
export type ImportValidationStatus =
  | 'idle'          // 上传态（初始状态）
  | 'validating'    // 校验中加载态
  | 'file-error'    // 文件级失败态
  | 'partial'       // 部分通过态
  | 'all-pass'      // 全通过态
  | 'all-row-fail'; // 行级全失败态

/** 文件级错误类型 */
export type FileErrorType =
  | 'file-format'       // 文件格式错误
  | 'template-structure' // 模板结构错误
  | 'header-mismatch'   // 表头缺失或不匹配
  | 'template-type'     // 模板类型不匹配
  | 'empty-content'     // 文件内容为空
  | 'parse-failed';     // 文件解析失败

/** 行级错误类型 */
export type RowErrorType =
  | 'path-invalid'           // 标题路径不合法
  | 'node-not-found'         // 线上未匹配到对应节点
  | 'path-modified'          // 标题列被修改导致无法匹配
  | 'path-level-broken'      // 标题层级断裂
  | 'duplicate-node'         // 同一节点重复导入
  | 'exam-freq-invalid'      // 考频填写不合法
  | 'exam-freq-not-leaf'     // 非末级节点填写考频
  | 'academic-req-invalid'   // 学业要求填写不合法
  | 'academic-req-not-leaf'  // 非末级节点填写学业要求
  | 'prerequisite-not-found' // 前置知识点不存在
  | 'prerequisite-self'      // 前置知识点包含自身
  | 'prerequisite-duplicate' // 前置知识点重复填写
  | 'strategy-not-found'     // 出题策略不存在
  | 'strategy-format'        // 出题策略填写格式不合法
  | 'other';                 // 其他业务校验失败

/** 文件级错误详情 */
export interface FileError {
  type: FileErrorType;
  title: string;
  description: string;
  suggestion: string;
}

/** 行级校验结果 */
export interface RowValidationResult {
  rowIndex: number;          // 序号
  excelRow: number;          // Excel行号
  knowledgePath: string;     // 知识点路径
  result: 'pass' | 'fail';  // 校验结果
  errorType?: RowErrorType;  // 失败类型
  reason?: string;           // 失败原因
  suggestion?: string;       // 修正建议
}

/** 校验结果汇总 */
export interface ValidationSummary {
  fileName: string;
  uploadTime: string;
  totalRows: number;
  passRows: number;
  failRows: number;
  unchangedRows?: number;    // 未变更行数（预留）
}

/** 错误分类统计 */
export interface ErrorCategory {
  type: RowErrorType;
  label: string;
  count: number;
  description: string;
}

/** 组件 Props */
export interface ImportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ImportValidationStatus;
  summary?: ValidationSummary;
  fileErrors?: FileError[];
  rowResults?: RowValidationResult[];
  onReUpload: () => void;
  onDownloadTemplate?: () => void;
  onDownloadErrorDetail?: () => void;
  onImportPassedRows?: () => void;
  onStartImport?: () => void;
}

// ==================== 常量配置 ====================

/** 文件级错误类型配置 */
const FILE_ERROR_CONFIG: Record<FileErrorType, { label: string }> = {
  'file-format': { label: '文件格式错误' },
  'template-structure': { label: '模板结构错误' },
  'header-mismatch': { label: '表头缺失或不匹配' },
  'template-type': { label: '模板类型不匹配' },
  'empty-content': { label: '文件内容为空' },
  'parse-failed': { label: '文件解析失败' },
};

/** 行级错误类型配置 */
const ROW_ERROR_CONFIG: Record<RowErrorType, { label: string; description: string }> = {
  'path-invalid': { label: '标题路径不合法', description: '标题路径格式错误或层级不完整' },
  'node-not-found': { label: '未匹配到线上节点', description: '系统未在当前知识树中找到与该标题路径完全一致的节点' },
  'path-modified': { label: '标题列被修改', description: '导入仅支持使用标题列定位节点，不支持通过导入修改树目录' },
  'path-level-broken': { label: '标题层级断裂', description: '当前行标题层级填写不完整，存在跳级填写' },
  'duplicate-node': { label: '同一节点重复导入', description: '当前文件中存在多个相同标题路径的数据行' },
  'exam-freq-invalid': { label: '考频填写不合法', description: '考频仅支持填写"高频 / 中频 / 低频"' },
  'exam-freq-not-leaf': { label: '非末级节点填写考频', description: '考频仅允许填写在末级知识点行' },
  'academic-req-invalid': { label: '学业要求填写不合法', description: '学业要求仅支持填写"了解 / 理解 / 掌握 / 运用"' },
  'academic-req-not-leaf': { label: '非末级节点填写学业要求', description: '学业要求仅允许填写在末级知识点行' },
  'prerequisite-not-found': { label: '前置知识点不存在', description: '填写的前置知识点在线上知识树中不存在' },
  'prerequisite-self': { label: '前置知识点包含自身', description: '前置知识点不能包含当前知识点自身' },
  'prerequisite-duplicate': { label: '前置知识点重复填写', description: '前置知识点存在重复项' },
  'strategy-not-found': { label: '出题策略不存在', description: '填写的出题策略名称未在系统中找到对应个性化策略' },
  'strategy-format': { label: '出题策略格式不合法', description: '当前字段仅支持填写单个已存在的个性化策略名称' },
  'other': { label: '其他校验失败', description: '其他业务校验未通过' },
};

// ==================== 子组件 ====================

/** 校验结果概览区 */
function ValidationOverview({ status, summary }: { status: ImportValidationStatus; summary?: ValidationSummary }) {
  if (!summary) return null;

  // 文件级失败
  if (status === 'file-error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex flex-col items-center text-center">
          <XCircle className="w-12 h-12 text-red-500 mb-3" />
          <h4 className="text-lg font-semibold text-red-800 mb-1">校验失败，当前文件无法导入</h4>
          <p className="text-sm text-red-600 mb-4">请根据下方失败原因修正文件后重新上传</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FileSpreadsheet className="w-4 h-4" />
              <span>文件名称：{summary.fileName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>上传时间：{summary.uploadTime}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 text-center">📋</span>
              <span>校验结果：<span className="text-red-600 font-medium">失败</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="inline-block w-4 text-center">📊</span>
              <span>可导入行数：<span className="text-red-600 font-medium">0 行</span></span>
            </div>
          </div>
          <div className="mt-3 px-3 py-1 bg-red-100 rounded-full">
            <span className="text-xs font-medium text-red-700">文件级失败</span>
          </div>
        </div>
      </div>
    );
  }

  // 部分通过
  if (status === 'partial') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
          <h4 className="text-lg font-semibold text-amber-800 mb-1">校验完成，部分数据可导入</h4>
          <p className="text-sm text-amber-600 mb-4">通过校验的数据可继续导入，失败数据请下载明细后修正</p>
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{summary.fileName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{summary.uploadTime}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>总行数：<span className="font-medium text-gray-900">{summary.totalRows}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">通过：<span className="font-medium text-emerald-700">{summary.passRows} 行</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">失败：<span className="font-medium text-red-700">{summary.failRows} 行</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 全通过
  if (status === 'all-pass') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
          <h4 className="text-lg font-semibold text-emerald-800 mb-1">校验通过，可直接导入</h4>
          <p className="text-sm text-emerald-600 mb-4">本次文件未发现异常数据，可继续导入</p>
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{summary.fileName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{summary.uploadTime}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>总行数：<span className="font-medium text-emerald-700">{summary.totalRows} 行</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 行级全失败
  if (status === 'all-row-fail') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex flex-col items-center text-center">
          <XCircle className="w-12 h-12 text-red-500 mb-3" />
          <h4 className="text-lg font-semibold text-red-800 mb-1">校验失败，所有数据行均未通过</h4>
          <p className="text-sm text-red-600 mb-4">请根据下方错误明细修正数据后重新上传</p>
          <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{summary.fileName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{summary.uploadTime}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>总行数：<span className="font-medium text-red-700">{summary.totalRows}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">通过：<span className="font-medium text-gray-400">0 行</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">失败：<span className="font-medium text-red-700">{summary.failRows} 行</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/** 文件级失败原因说明区 */
function FileErrorList({ errors }: { errors: FileError[] }) {
  return (
    <div className="space-y-3 mt-4">
      <h5 className="text-sm font-medium text-gray-700">失败原因</h5>
      {errors.map((error, index) => (
        <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-red-600">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 mb-1">{error.title}</p>
              <p className="text-sm text-red-600 mb-1">{error.description}</p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">修正建议：</span>{error.suggestion}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 错误分类统计卡片 */
function ErrorCategoryCards({
  categories,
  activeFilter,
  onFilterChange,
}: {
  categories: ErrorCategory[];
  activeFilter: RowErrorType | null;
  onFilterChange: (type: RowErrorType | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="mt-4">
      <h5 className="text-sm font-medium text-gray-700 mb-3">问题分类</h5>
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => (
          <button
            key={cat.type}
            onClick={() => onFilterChange(activeFilter === cat.type ? null : cat.type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-left ${
              activeFilter === cat.type
                ? 'bg-red-50 border-red-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-red-200 hover:bg-red-50/50'
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${activeFilter === cat.type ? 'text-red-800' : 'text-gray-800'}`}>
                {cat.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{cat.description}</span>
            </div>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
              activeFilter === cat.type
                ? 'bg-red-200 text-red-800'
                : 'bg-red-100 text-red-700'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 错误明细表格 */
function ErrorDetailTable({
  results,
  activeFilter,
}: {
  results: RowValidationResult[];
  activeFilter: RowErrorType | null;
}) {
  const [showAll, setShowAll] = useState(false);

  const filteredResults = useMemo(() => {
    let filtered = results.filter((r) => r.result === 'fail');
    if (activeFilter) {
      filtered = filtered.filter((r) => r.errorType === activeFilter);
    }
    return filtered;
  }, [results, activeFilter]);

  const displayResults = showAll ? filteredResults : filteredResults.slice(0, 10);
  const hasMore = filteredResults.length > 10;

  if (filteredResults.length === 0) return null;

  return (
    <div className="mt-4">
      <h5 className="text-sm font-medium text-gray-700 mb-3">
        失败明细
        <span className="ml-2 text-xs text-gray-400 font-normal">共 {filteredResults.length} 条</span>
      </h5>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-[3.5rem]">序号</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-[5rem]">Excel行号</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-[14rem]">知识点路径</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-[5rem]">校验结果</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-[12rem]">失败原因</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 text-gray-500">{row.rowIndex}</td>
                  <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">第{row.excelRow}行</td>
                  <td className="px-3 py-2.5 text-gray-700 max-w-[20rem] truncate" title={row.knowledgePath}>
                    {row.knowledgePath}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                      失败
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-red-600 text-xs leading-relaxed">
                    {row.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2.5 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showAll ? (
                <>
                  收起 <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  展开查看全部 {filteredResults.length} 条 <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** 校验中加载态 */
function ValidatingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-base font-medium text-gray-700 mb-1">正在校验文件，请稍候...</p>
      <p className="text-sm text-gray-400">系统正在校验模板结构、标题路径及详情字段</p>
    </div>
  );
}

// ==================== 主组件 ====================

export default function ImportValidationModal({
  isOpen,
  onClose,
  status,
  summary,
  fileErrors = [],
  rowResults = [],
  onReUpload,
  onDownloadTemplate,
  onDownloadErrorDetail,
  onImportPassedRows,
  onStartImport,
}: ImportValidationModalProps) {
  const [activeFilter, setActiveFilter] = useState<RowErrorType | null>(null);

  // 计算错误分类统计
  const errorCategories = useMemo<ErrorCategory[]>(() => {
    const failedRows = rowResults.filter((r) => r.result === 'fail');
    const typeCountMap = new Map<RowErrorType, number>();

    failedRows.forEach((row) => {
      if (row.errorType) {
        typeCountMap.set(row.errorType, (typeCountMap.get(row.errorType) || 0) + 1);
      }
    });

    return Array.from(typeCountMap.entries()).map(([type, count]) => ({
      type,
      label: ROW_ERROR_CONFIG[type].label,
      count,
      description: ROW_ERROR_CONFIG[type].description,
    }));
  }, [rowResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[860px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* ===== A. 弹窗头部 ===== */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">校验结果</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== 内容区 ===== */}
        <div className="flex-1 overflow-y-auto">
          {/* 校验中加载态 */}
          {status === 'validating' && <ValidatingState />}

          {/* 文件级失败态 */}
          {status === 'file-error' && (
            <div className="p-6">
              {/* B. 校验结果概览区 */}
              <ValidationOverview status={status} summary={summary} />
              {/* C. 问题分类汇总区 - 文件级 */}
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">问题分类</h5>
                <div className="flex flex-wrap gap-3">
                  {fileErrors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200"
                    >
                      <span className="text-sm font-medium text-red-800">{FILE_ERROR_CONFIG[error.type].label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* D. 失败原因说明区 */}
              <FileErrorList errors={fileErrors} />
            </div>
          )}

          {/* 部分通过态 / 行级全失败态 */}
          {(status === 'partial' || status === 'all-row-fail') && (
            <div className="p-6">
              {/* B. 校验结果概览区 */}
              <ValidationOverview status={status} summary={summary} />
              {/* C. 问题分类汇总区 - 行级 */}
              <ErrorCategoryCards
                categories={errorCategories}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
              {/* E. 错误明细表格区 */}
              <ErrorDetailTable results={rowResults} activeFilter={activeFilter} />
            </div>
          )}

          {/* 全通过态 */}
          {status === 'all-pass' && (
            <div className="p-6">
              <ValidationOverview status={status} summary={summary} />
            </div>
          )}
        </div>

        {/* ===== F. 底部操作区 ===== */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 bg-gray-50/50">
          {/* 取消 - 所有状态都有 */}
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>

          {/* 文件级失败态 */}
          {status === 'file-error' && (
            <>
              <Button variant="outline" onClick={onDownloadTemplate}>
                <Download className="w-4 h-4 mr-1.5" />
                下载模板
              </Button>
              <Button onClick={onReUpload}>
                <Upload className="w-4 h-4 mr-1.5" />
                重新上传
              </Button>
            </>
          )}

          {/* 部分通过态 */}
          {status === 'partial' && (
            <>
              <Button variant="outline" onClick={onDownloadErrorDetail}>
                <Download className="w-4 h-4 mr-1.5" />
                下载错误明细
              </Button>
              <Button variant="outline" onClick={onReUpload}>
                <Upload className="w-4 h-4 mr-1.5" />
                重新上传
              </Button>
              <Button onClick={onImportPassedRows}>
                仅导入通过项
              </Button>
            </>
          )}

          {/* 行级全失败态 */}
          {status === 'all-row-fail' && (
            <>
              <Button variant="outline" onClick={onDownloadErrorDetail}>
                <Download className="w-4 h-4 mr-1.5" />
                下载错误明细
              </Button>
              <Button onClick={onReUpload}>
                <Upload className="w-4 h-4 mr-1.5" />
                重新上传
              </Button>
            </>
          )}

          {/* 全通过态 */}
          {status === 'all-pass' && (
            <Button onClick={onStartImport}>
              开始导入
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
