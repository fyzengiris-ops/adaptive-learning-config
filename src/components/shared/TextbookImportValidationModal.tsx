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
export type TextbookImportValidationStatus =
  | 'idle'          // 上传态（初始状态）
  | 'validating'    // 校验中加载态
  | 'file-error'    // 文件级失败态
  | 'partial'       // 部分通过态
  | 'all-pass'      // 全通过态
  | 'all-row-fail'  // 行级全失败态
  | 'importing'     // 导入中加载态
  | 'import-success' // 导入成功态
  | 'import-fail';  // 导入失败态

/** 文件级错误类型 */
export type TextbookFileErrorType =
  | 'file-format'        // 文件格式错误
  | 'template-structure' // 模板结构错误
  | 'header-mismatch'    // 表头缺失或不匹配
  | 'empty-content'      // 文件内容为空
  | 'parse-failed';      // 文件解析失败

/** 行级错误类型 */
export type TextbookRowErrorType =
  | 'path-invalid'           // 教材树路径不合法
  | 'node-not-found'         // 教材树路径未匹配到线上节点
  | 'path-modified'          // 教材树标题列被修改导致无法匹配
  | 'path-level-broken'      // 教材树层级断裂
  | 'duplicate-node'         // 同一教材节点重复导入
  | 'knowledge-not-found'    // 知识点名称未在知识树模块中匹配到
  | 'knowledge-ambiguous'    // 知识点无法唯一识别
  | 'knowledge-duplicate'    // 同一行知识点重复填写
  | 'knowledge-not-leaf'     // 非叶子章节节点填写知识点
  | 'other';                 // 其他业务校验失败

/** 文件级错误详情 */
export interface TextbookFileError {
  type: TextbookFileErrorType;
  title: string;
  description: string;
  suggestion: string;
}

/** 行级校验结果 */
export interface TextbookRowValidationResult {
  rowIndex: number;          // 序号
  excelRow: number;          // Excel行号
  textbookPath: string;      // 教材路径
  knowledgeInfo: string;     // 本行知识点信息
  result: 'pass' | 'fail';  // 校验结果
  errorType?: TextbookRowErrorType;  // 失败类型
  reason?: string;           // 失败原因
}

/** 校验结果汇总 */
export interface TextbookValidationSummary {
  fileName: string;
  uploadTime: string;
  totalRows: number;
  passRows: number;
  failRows: number;
}

/** 错误分类统计 */
export interface TextbookErrorCategory {
  type: TextbookRowErrorType;
  label: string;
  count: number;
  description: string;
}

/** 组件 Props */
export interface TextbookImportValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TextbookImportValidationStatus;
  summary?: TextbookValidationSummary;
  fileErrors?: TextbookFileError[];
  rowResults?: TextbookRowValidationResult[];
  importSuccessCount?: number;
  onReUpload: () => void;
  onDownloadTemplate?: () => void;
  onDownloadErrorDetail?: () => void;
  onImportPassedRows?: () => void;
  onStartImport?: () => void;
}

// ==================== 常量配置 ====================

/** 文件级错误类型配置 */
const FILE_ERROR_CONFIG: Record<TextbookFileErrorType, { label: string }> = {
  'file-format': { label: '文件格式错误' },
  'template-structure': { label: '模板结构错误' },
  'header-mismatch': { label: '表头缺失或不匹配' },
  'empty-content': { label: '文件内容为空' },
  'parse-failed': { label: '文件解析失败' },
};

/** 行级错误类型配置 */
const ROW_ERROR_CONFIG: Record<TextbookRowErrorType, { label: string; description: string }> = {
  'path-invalid': { label: '教材树路径不合法', description: '教材树路径格式错误或层级不完整' },
  'node-not-found': { label: '未匹配到线上教材节点', description: '系统未在当前教材树中找到与该路径完全一致的章节/小节节点' },
  'path-modified': { label: '教材树标题列被修改', description: '导入仅支持使用教材树标题列定位节点，不支持通过导入修改教材树目录' },
  'path-level-broken': { label: '教材树层级断裂', description: '当前行教材树层级填写不完整，存在跳级填写' },
  'duplicate-node': { label: '同一教材节点重复导入', description: '当前文件中存在多个相同教材路径的数据行' },
  'knowledge-not-found': { label: '知识点未在知识树模块中匹配到', description: '当前行填写的知识点名称未在知识树模块中找到对应知识点' },
  'knowledge-ambiguous': { label: '知识点无法唯一识别', description: '当前填写的知识点名称在知识树模块中存在重名，系统无法唯一确认' },
  'knowledge-duplicate': { label: '同一行知识点重复填写', description: '当前行知识点名称存在重复项' },
  'knowledge-not-leaf': { label: '非叶子章节节点填写知识点', description: '知识点仅允许关联到叶子章节节点（没有子章节的节点）' },
  'other': { label: '其他校验失败', description: '其他业务校验未通过' },
};

// ==================== 子组件 ====================

/** 校验结果概览区 */
function ValidationOverview({ status, summary }: { status: TextbookImportValidationStatus; summary?: TextbookValidationSummary }) {
  if (!summary) return null;

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
function FileErrorList({ errors }: { errors: TextbookFileError[] }) {
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
  categories: TextbookErrorCategory[];
  activeFilter: TextbookRowErrorType | null;
  onFilterChange: (type: TextbookRowErrorType | null) => void;
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
  results: TextbookRowValidationResult[];
  activeFilter: TextbookRowErrorType | null;
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
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-[14rem]">当前教材路径</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-[10rem]">知识点信息</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 w-[5rem]">校验结果</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 min-w-[14rem]">失败原因</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-3 py-2.5 text-gray-500">{row.rowIndex}</td>
                  <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">第{row.excelRow}行</td>
                  <td className="px-3 py-2.5 text-gray-700 max-w-[20rem] truncate" title={row.textbookPath}>
                    {row.textbookPath}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 max-w-[12rem] truncate" title={row.knowledgeInfo}>
                    {row.knowledgeInfo || '-'}
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
      <p className="text-sm text-gray-400">系统正在校验模板结构、教材树路径及知识点匹配关系</p>
    </div>
  );
}

/** 导入中加载态 */
function ImportingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-base font-medium text-gray-700 mb-1">正在导入数据，请稍候...</p>
      <p className="text-sm text-gray-400">系统正在将校验通过的数据写入教材树</p>
    </div>
  );
}

/** 导入成功态 */
function ImportSuccessState({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
      <p className="text-base font-semibold text-emerald-800 mb-1">导入成功</p>
      <p className="text-sm text-emerald-600">成功导入 {count} 行数据</p>
    </div>
  );
}

/** 导入失败态 */
function ImportFailState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <XCircle className="w-12 h-12 text-red-500 mb-3" />
      <p className="text-base font-semibold text-red-800 mb-1">导入失败</p>
      <p className="text-sm text-red-600">请稍后重试</p>
    </div>
  );
}

// ==================== 主组件 ====================

export default function TextbookImportValidationModal({
  isOpen,
  onClose,
  status,
  summary,
  fileErrors = [],
  rowResults = [],
  importSuccessCount = 0,
  onReUpload,
  onDownloadTemplate,
  onDownloadErrorDetail,
  onImportPassedRows,
  onStartImport,
}: TextbookImportValidationModalProps) {
  const [activeFilter, setActiveFilter] = useState<TextbookRowErrorType | null>(null);

  // 计算错误分类统计
  const errorCategories = useMemo<TextbookErrorCategory[]>(() => {
    const failedRows = rowResults.filter((r) => r.result === 'fail');
    const typeCountMap = new Map<TextbookRowErrorType, number>();

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
              <ValidationOverview status={status} summary={summary} />
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
              <FileErrorList errors={fileErrors} />
            </div>
          )}

          {/* 部分通过态 / 行级全失败态 */}
          {(status === 'partial' || status === 'all-row-fail') && (
            <div className="p-6">
              <ValidationOverview status={status} summary={summary} />
              <ErrorCategoryCards
                categories={errorCategories}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
              <ErrorDetailTable results={rowResults} activeFilter={activeFilter} />
            </div>
          )}

          {/* 全通过态 */}
          {status === 'all-pass' && (
            <div className="p-6">
              <ValidationOverview status={status} summary={summary} />
            </div>
          )}

          {/* 导入中加载态 */}
          {status === 'importing' && <ImportingState />}

          {/* 导入成功态 */}
          {status === 'import-success' && <ImportSuccessState count={importSuccessCount} />}

          {/* 导入失败态 */}
          {status === 'import-fail' && <ImportFailState />}
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

          {/* 导入中加载态 - 无按钮 */}
          {status === 'importing' && null}

          {/* 导入成功态 */}
          {status === 'import-success' && (
            <Button onClick={onClose}>
              关闭
            </Button>
          )}

          {/* 导入失败态 */}
          {status === 'import-fail' && (
            <Button onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
