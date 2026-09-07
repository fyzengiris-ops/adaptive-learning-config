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
import type {
  KnowledgeCard,
  KnowledgeCardExamPoint,
  KnowledgeCardExamType,
  RelatedExamPoint,
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
    tagClass: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  advanced: {
    label: '综合进阶',
    tagClass: 'bg-violet-100 text-violet-800 border-violet-300',
  },
  sprint: {
    label: '高分冲刺',
    tagClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
};

function hasExample(ep?: KnowledgeCardExamPoint) {
  if (!ep?.example) return false;
  const ex = ep.example;
  return (
    !!(ex.stem && ex.stem.trim()) ||
    ex.steps.length > 0 ||
    ex.tips.length > 0 ||
    ex.source === 'leke' ||
    ex.source === 'third_party'
  );
}

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

const EXAM_CARD_THEMES: Array<{
  header: string;
  body: string;
  desc: string;
  watermark: string;
}> = [
  {
    header: 'from-emerald-50 to-teal-50/80',
    body: 'border-emerald-100',
    desc: 'bg-emerald-50/70 border-emerald-100',
    watermark: 'text-emerald-200/70',
  },
  {
    header: 'from-sky-50 to-blue-50/80',
    body: 'border-sky-100',
    desc: 'bg-sky-50/70 border-sky-100',
    watermark: 'text-sky-200/70',
  },
  {
    header: 'from-amber-50 to-orange-50/70',
    body: 'border-amber-100',
    desc: 'bg-amber-50/70 border-amber-100',
    watermark: 'text-amber-200/70',
  },
  {
    header: 'from-violet-50 to-purple-50/70',
    body: 'border-violet-100',
    desc: 'bg-violet-50/70 border-violet-100',
    watermark: 'text-violet-200/70',
  },
];

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
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] border whitespace-nowrap ${meta.tagClass}`}
    >
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
  const theme = EXAM_CARD_THEMES[index % EXAM_CARD_THEMES.length];
  const exampleReady = hasExample(ep);
  const steps = ep.example?.steps ?? [];
  const tips = ep.example?.tips ?? [];

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white shadow-sm ${theme.body}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full relative px-4 py-3 bg-gradient-to-r ${theme.header} flex items-center gap-2 text-left`}
      >
        <span
          className={`absolute left-3 top-1 text-[28px] font-black leading-none select-none pointer-events-none ${theme.watermark}`}
        >
          考点{index + 1}
        </span>
        <div className="relative z-[1] flex-1 min-w-0 flex items-center gap-2 pl-10">
          <span className="text-[14px] font-semibold text-gray-900 truncate">
            {ep.title || '未命名考点'}
          </span>
          <ExamTypePill type={ep.examType} />
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 space-y-2.5">
          {ep.description?.trim() ? (
            <div className={`rounded-xl border px-3 py-2.5 ${theme.desc}`}>
              <div className="text-[12px] text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-800">考点说明：</span>
                {ep.description}
              </div>
            </div>
          ) : null}

          {exampleReady && ep.example ? (
            <div className="rounded-xl border border-teal-100 bg-white overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between gap-2 bg-teal-50/60 border-b border-teal-100">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-700">
                  <Star className="w-3 h-3 fill-teal-600 text-teal-600" />
                  典型例题
                </span>
                {(steps.length > 0 || tips.length > 0 || ep.example.stem?.trim()) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAnalysis();
                    }}
                    className="inline-flex items-center gap-1 text-[12px] text-teal-700 hover:text-teal-800"
                  >
                    {analysisOpen ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    解析
                  </button>
                )}
              </div>

              {ep.example.stem?.trim() ? (
                <div className="px-3 py-2.5 text-[13px] text-gray-800 whitespace-pre-wrap leading-[1.7]">
                  {ep.example.stem}
                </div>
              ) : null}

              {analysisOpen && (
                <div className="px-3 pb-3 space-y-3">
                  {steps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-[13px] mb-2">
                        <span className="w-2 h-2 rotate-45 bg-orange-400" />
                        解题步骤
                      </div>
                      <ol className="space-y-2.5">
                        {steps.map((st, i) => (
                          <li key={st.id} className="border-l-[3px] border-amber-400 pl-3">
                            <div className="text-[13px] font-medium text-gray-900">
                              <span className="mr-1 text-amber-600">{i + 1}.</span>
                              {st.title || ''}
                            </div>
                            {st.detail?.trim() ? (
                              <div className="mt-1 text-[12px] text-gray-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                                {st.detail}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {tips.length > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-[13px] mb-2">
                        <span className="w-2 h-2 rotate-45 bg-orange-400" />
                        解题要点
                      </div>
                      <div className="space-y-2">
                        {tips.map((tip, i) => (
                          <div key={tip.id} className="flex gap-2 items-start">
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1 text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed bg-white/80 rounded-lg px-2.5 py-1.5 border border-amber-100/80">
                              {tip.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-amber-600"
                  >
                    加入好题本
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-[12px] text-gray-400">
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
  const [page, setPage] = useState<PreviewPage>('concept');
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
    setPage('concept');
    setExpandedExamIds(new Set());
    setAnalysisExamIds(new Set());
  }, [open]);

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
      <div className="absolute top-4 left-4 text-white/90 text-sm font-medium">平板预览</div>
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
                      <div className="rounded-xl bg-amber-50 border border-amber-100/80 p-3">
                        <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-[13px] mb-2">
                          <span className="w-2 h-2 rotate-45 bg-orange-400" />
                          知识点Tips
                        </div>
                        {knowledgeTips.length === 0 ? (
                          <p className="text-[13px] text-gray-800 leading-relaxed">暂无</p>
                        ) : (
                          <div className="space-y-2">
                            {knowledgeTips.map((tip, i) => (
                              <div key={tip.id} className="flex items-start gap-2">
                                {knowledgeTips.length > 1 && (
                                  <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                    {i + 1}
                                  </span>
                                )}
                                <p className="flex-1 text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                                  {tip.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
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
