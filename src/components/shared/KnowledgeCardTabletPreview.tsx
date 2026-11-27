'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Star,
  X,
} from 'lucide-react';
import {
  examPointHasExample,
  TypicalExampleReadout,
  type KnowledgeCard,
  type KnowledgeCardExamPoint,
  type KnowledgeCardExamType,
  type RelatedExamPoint,
} from '@/components/shared/KnowledgeCardPanel';

export interface KnowledgeCardTabletPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  academicRequirementLabel?: string;
  examFrequencyLabel?: string;
  card: KnowledgeCard;
  relatedExamPoints?: RelatedExamPoint[];
  /** 已按关联考点合并后的展示列表；优先使用，避免循环依赖工具函数 */
  examPoints?: KnowledgeCardExamPoint[];
}

type PreviewPage = 'concept' | 'exam';

const TYPE_META: Record<
  KnowledgeCardExamType,
  { label: string; tagClass: string }
> = {
  basic: {
    label: '基础达标',
    tagClass: 'bg-sky-50 text-sky-600',
  },
  advanced: {
    label: '综合进阶',
    tagClass: 'bg-orange-50 text-orange-600',
  },
  sprint: {
    label: '高分冲刺',
    tagClass: 'bg-pink-50 text-pink-600',
  },
};

function mergeExams(
  related: RelatedExamPoint[] | undefined,
  cardExams: KnowledgeCardExamPoint[] | undefined
): KnowledgeCardExamPoint[] {
  const relatedList = related || [];
  const cardList = cardExams || [];
  return relatedList.map((r) => {
    const existing = cardList.find((e) => e.id === r.id);
    return {
      id: r.id,
      title: r.name,
      examType: r.examType,
      description: existing?.description,
      example: existing?.example,
    };
  });
}

function Stamp({
  label,
  tone,
}: {
  label: string;
  tone: 'blue' | 'red' | 'gray';
}) {
  const toneClass =
    tone === 'blue'
      ? 'border-sky-400 text-sky-600'
      : tone === 'red'
        ? 'border-rose-400 text-rose-500'
        : 'border-gray-300 text-gray-500';
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold border-[1.5px] border-dashed rounded-sm -rotate-6 ${toneClass}`}
    >
      {label}
    </span>
  );
}

function SectionPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center justify-center my-2">
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-teal-200" />
      <div className="relative z-[1] inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white border border-teal-200 text-[12px] text-teal-700 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
        {children}
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  hasExamPage,
  onChange,
  hint,
}: {
  page: PreviewPage;
  hasExamPage: boolean;
  onChange: (next: PreviewPage) => void;
  hint: string;
}) {
  const canPrev = page === 'exam';
  const canNext = hasExamPage && page === 'concept';

  return (
    <div className="shrink-0 pt-2 pb-1 flex flex-col items-center gap-1.5">
      <div className="w-full flex items-center justify-end px-1">
        <span className="text-[11px] text-gray-400">{hint}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onChange('concept')}
          className="w-8 h-8 rounded-full border border-teal-200 text-teal-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-default bg-white/80"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange('concept')}
            className={`h-2 rounded-full transition-all ${
              page === 'concept' ? 'w-5 bg-teal-500' : 'w-2 bg-gray-300'
            }`}
            aria-label="核心概念"
          />
          {hasExamPage && (
            <button
              type="button"
              onClick={() => onChange('exam')}
              className={`h-2 rounded-full transition-all ${
                page === 'exam' ? 'w-5 bg-teal-500' : 'w-2 bg-gray-300'
              }`}
              aria-label="考点清单"
            />
          )}
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onChange('exam')}
          className="w-8 h-8 rounded-full border border-teal-200 text-teal-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-default bg-white/80"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ExamTypePill({ type }: { type?: KnowledgeCardExamType }) {
  if (!type || !TYPE_META[type]) return null;
  const meta = TYPE_META[type];
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded text-[10px] whitespace-nowrap ${meta.tagClass}`}>
      {meta.label}
    </span>
  );
}

function ExamAccordionItem({
  ep,
  index,
  expanded,
  analysisOpen,
  onToggle,
  onToggleAnalysis,
}: {
  ep: KnowledgeCardExamPoint;
  index: number;
  expanded: boolean;
  analysisOpen: boolean;
  onToggle: () => void;
  onToggleAnalysis: () => void;
}) {
  const exampleReady = examPointHasExample(ep);

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500 text-[10px] font-bold text-white">
          {index + 1}
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-emerald-600">考点{index + 1}</span>
        <span className="min-w-0 truncate text-[14px] font-semibold text-gray-900">
          {ep.title || '未命名考点'}
        </span>
        <ExamTypePill type={ep.examType} />
        <span className="flex-1" />
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2.5 px-3 pb-3">
          <p className="text-[12px] leading-relaxed text-gray-600">
            <span className="text-gray-800">考试说明：</span>
            {ep.description?.trim() || '暂无'}
          </p>

          {exampleReady && ep.example ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#b7ebc8] to-[#f3fbf6] px-2.5 py-1 text-[13px] font-bold text-black">
                  典型例题
                  <Star className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAnalysis();
                  }}
                  className="inline-flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700"
                >
                  {analysisOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {analysisOpen ? '隐藏解析' : '查看解析'}
                </button>
              </div>
              <TypicalExampleReadout example={ep.example} revealAnswer={analysisOpen} variant="preview" />
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-amber-600"
              >
                <Star className="h-3.5 w-3.5" />
                加入好题本
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-[12px] text-gray-400">
              暂无典型例题
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeCardTabletPreview({
  open,
  onClose,
  title,
  academicRequirementLabel,
  examFrequencyLabel,
  card,
  relatedExamPoints,
  examPoints: examPointsProp,
}: KnowledgeCardTabletPreviewProps) {
  const [page, setPage] = useState<PreviewPage>('exam');
  const [expandedExamIds, setExpandedExamIds] = useState<Set<string>>(new Set());
  const [analysisExamIds, setAnalysisExamIds] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState(1);

  const examPoints = useMemo(
    () => examPointsProp ?? mergeExams(relatedExamPoints, card.examPoints),
    [examPointsProp, relatedExamPoints, card.examPoints]
  );
  const hasExamPage = examPoints.length > 0;

  const keyPoints = (card.keyPoints || []).filter((kp) => kp.content?.trim() || kp.images?.length);
  const customModules = (card.customModules || []).filter((m) =>
    (m.items || []).some((item) => item.content?.trim() || item.images?.length)
  );
  const knowledgeTips = (card.knowledgeTips || []).filter((item) => item.content?.trim());

  useEffect(() => {
    if (!open) return;
    setPage(hasExamPage ? 'exam' : 'concept');
    setExpandedExamIds(new Set());
    setAnalysisExamIds(new Set());
  }, [open, hasExamPage]);

  useEffect(() => {
    if (!open) return;
    const updateScale = () => {
      const maxW = window.innerWidth - 64;
      const maxH = window.innerHeight - 64;
      const next = Math.min(1, maxW / 1024, maxH / 768);
      setScale(next);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hint =
    page === 'concept'
      ? hasExamPage
        ? '点击下方圆点或箭头查看考点'
        : '当前暂无关联考点'
      : '点击考点查看例题 · 左滑查看概念';

  const toggleExam = (id: string) => {
    setExpandedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAnalysis = (id: string) => {
    setAnalysisExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" data-req-surface="preview">
      <div className="absolute top-4 left-4 flex items-center gap-3 text-white/90 text-sm font-medium">
        <span>平板预览</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-4 p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        aria-label="关闭预览"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="absolute top-4 right-14 text-white/60 text-xs tabular-nums">1024 × 768</div>

      <div className="relative" style={{ width: 1024 * scale, height: 768 * scale }}>
        <div
          className="origin-top-left rounded-[28px] overflow-hidden shadow-2xl border-[10px] border-[#2b2f36] bg-[#2b2f36]"
          style={{
            width: 1024,
            height: 768,
            transform: `scale(${scale})`,
          }}
        >
          <div
            className="w-full h-full flex flex-col bg-[#eef6f3]"
            data-req-anchor="knowledge-tree.knowledge-card.tablet-body"
          >
            <div className="h-12 shrink-0 bg-[#2f343c] flex items-center px-4">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-white/90 hover:bg-white/10 rounded-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center justify-center gap-6">
                <button type="button" className="relative text-white text-sm font-semibold pb-0.5">
                  知识点精讲
                  <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-white rounded-full" />
                </button>
                <span className="w-px h-4 bg-white/25" />
                <button type="button" className="text-white/45 text-sm cursor-default">
                  知识点视频
                </button>
              </div>
              <div className="w-8" />
            </div>

            <div className="flex-1 min-h-0 px-5 pt-4 pb-3 flex flex-col">
              <div className="flex-1 min-h-0 rounded-[22px] bg-white border-2 border-dashed border-teal-300/80 shadow-sm p-4 flex flex-col">
                <div className="flex items-start gap-3 shrink-0 mb-1">
                  <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
                    {title || '未命名知识点'}
                  </h2>
                  <div className="flex items-center gap-2 pt-1">
                    {academicRequirementLabel ? (
                      <Stamp label={academicRequirementLabel} tone="blue" />
                    ) : null}
                    {examFrequencyLabel ? (
                      <Stamp label={examFrequencyLabel} tone="red" />
                    ) : null}
                  </div>
                </div>

                {page === 'concept' ? (
                  <>
                    <SectionPill>核心概念</SectionPill>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                      {keyPoints.length === 0 && customModules.length === 0 ? (
                        <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-gray-400">
                          暂无核心概念内容
                        </div>
                      ) : (
                        <>
                          {keyPoints.length > 0 && (
                            <div className="space-y-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-700">
                                要点
                              </span>
                              {keyPoints.map((kp, i) => (
                                <div key={kp.id} className="space-y-2">
                                  {kp.content?.trim() ? (
                                    <div className="flex gap-2 items-start text-[14px] text-gray-800 leading-[1.7]">
                                      <span className="mt-0.5 w-5 h-5 rounded-full bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                      </span>
                                      <p className="flex-1 whitespace-pre-wrap">{kp.content}</p>
                                    </div>
                                  ) : null}
                                  {(kp.images || []).map((img) => (
                                    <div
                                      key={img.id}
                                      className="rounded-xl bg-slate-50 border border-slate-100 p-2 overflow-hidden"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={img.url}
                                        alt={img.alt || '配图'}
                                        className="max-h-56 mx-auto object-contain rounded-lg"
                                      />
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          {customModules.map((mod) => {
                            const items = (mod.items || []).filter(
                              (item) => item.content?.trim() || item.images?.length
                            );
                            if (items.length === 0) return null;
                            return (
                              <div
                                key={mod.id}
                                className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 space-y-2"
                              >
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                                  {mod.name || '自定义模块'}
                                  <span className="ml-1 text-amber-600/80">· {items.length}条</span>
                                </div>
                                <div className="space-y-2">
                                  {items.map((item, i) => (
                                    <div
                                      key={item.id}
                                      className="rounded-xl bg-white border border-amber-100/80 px-3 py-2.5"
                                    >
                                      <div className="flex gap-2 items-start">
                                        <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                          {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0 space-y-2">
                                          {item.content?.trim() ? (
                                            <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                                              {item.content}
                                            </p>
                                          ) : null}
                                          {(item.images || []).map((img) => (
                                            <div
                                              key={img.id}
                                              className="rounded-lg bg-slate-50 border border-slate-100 p-1.5"
                                            >
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={img.url}
                                                alt={img.alt || '配图'}
                                                className="max-h-40 mx-auto object-contain rounded-md"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <SectionPill>考点清单</SectionPill>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
                      {examPoints.map((ep, index) => (
                        <ExamAccordionItem
                          key={ep.id}
                          ep={ep}
                          index={index}
                          expanded={expandedExamIds.has(ep.id)}
                          analysisOpen={analysisExamIds.has(ep.id)}
                          onToggle={() => toggleExam(ep.id)}
                          onToggleAnalysis={() => toggleAnalysis(ep.id)}
                        />
                      ))}
                      <div className="overflow-hidden rounded-xl border border-orange-100">
                        <div className="flex items-center justify-between bg-gradient-to-r from-orange-400 to-amber-300 px-3 py-2 text-white">
                          <span className="text-[13px] font-semibold">知识点Tips</span>
                          <span className="text-[11px] text-white/90">记牢这几条，做题更快更稳</span>
                        </div>
                        <div className="bg-orange-50/50 p-3">
                        {knowledgeTips.length === 0 ? (
                          <p className="text-[13px] leading-relaxed text-gray-800">暂无</p>
                        ) : (
                          <div className="space-y-2">
                            {knowledgeTips.map((tip, i) => (
                              <div key={tip.id} className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-400 text-[10px] font-bold text-white">
                                  {i + 1}
                                </span>
                                <p className="flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800">
                                  {tip.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <PaginationBar
                  page={page}
                  hasExamPage={hasExamPage}
                  onChange={setPage}
                  hint={hint}
                />
              </div>
            </div>

            <div className="h-14 shrink-0 bg-white border-t border-gray-100 px-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-9 px-4 rounded-full border border-teal-500 text-teal-600 text-sm font-medium bg-white"
              >
                查看笔记(1)
              </button>
              <button
                type="button"
                className="h-9 px-5 rounded-full bg-teal-600 text-white text-sm font-medium"
              >
                去测试
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
