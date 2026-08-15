'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  X,
  Link2,
  ClipboardPaste,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LekeQuestionPicker, { type BankQuestion } from '@/components/shared/LekeQuestionPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface KnowledgeCardImage {
  id: string;
  url: string;
  alt?: string;
}

export interface KnowledgeCardKeyPoint {
  id: string;
  content: string;
  images: KnowledgeCardImage[];
}

export interface KnowledgeCardFormula {
  id: string;
  name?: string;
  content: string;
}

export interface KnowledgeCardExamStep {
  id: string;
  title?: string;
  detail: string;
}

export interface KnowledgeCardExamTip {
  id: string;
  content: string;
}

export interface KnowledgeCardExample {
  stem: string;
  source: 'manual' | 'leke' | 'third_party';
  lekeQuestionId?: string;
  steps: KnowledgeCardExamStep[];
  tips: KnowledgeCardExamTip[];
}

export interface KnowledgeCardExamPoint {
  id: string;
  title: string;
  description?: string;
  example?: KnowledgeCardExample;
}

export interface KnowledgeCard {
  keyPoints: KnowledgeCardKeyPoint[];
  formulas: KnowledgeCardFormula[];
  examPoints: KnowledgeCardExamPoint[];
}

export function emptyKnowledgeCard(): KnowledgeCard {
  return { keyPoints: [], formulas: [], examPoints: [] };
}

export function sampleKnowledgeCard(): KnowledgeCard {
  return {
    keyPoints: [
      {
        id: 'kp-1',
        content:
          '形如 y = x^α（α 为常数，x 是自变量）的函数称为幂函数，系数必须为 1。',
        images: [],
      },
      {
        id: 'kp-2',
        content: '当 α > 0 时，幂函数在 (0, +∞) 上单调递增。',
        images: [],
      },
      {
        id: 'kp-3',
        content: '当 α < 0 时，幂函数在 (0, +∞) 上单调递减。',
        images: [],
      },
    ],
    formulas: [
      {
        id: 'fm-1',
        name: '定义式',
        content: 'y = x^α（α 为常数，系数必须为 1）',
      },
      {
        id: 'fm-2',
        name: '递增条件',
        content: 'α > 0 时，在 (0, +∞) 上单调递增',
      },
      {
        id: 'fm-3',
        name: '递减条件',
        content: 'α < 0 时，在 (0, +∞) 上单调递减',
      },
    ],
    examPoints: [
      {
        id: 'ep-1',
        title: '判断一般幂函数的单调性',
        description: '直接给出解析式，根据指数正负判断单调性。',
        example: {
          stem: '判断函数 y = x^(2/3) 的定义域与单调性。',
          source: 'manual',
          steps: [
            {
              id: 'st-1',
              title: '明确定义域与指数符号',
              detail: '先求定义域，再看 α 的正负。',
            },
            {
              id: 'st-2',
              title: '套用单调性结论',
              detail: 'α = 2/3 > 0，故在 (0, +∞) 上单调递增。',
            },
          ],
          tips: [
            { id: 'tip-1', content: '先看定义域，再看指数正负。' },
            { id: 'tip-2', content: '系数必须为 1，否则不是幂函数。' },
          ],
        },
      },
      {
        id: 'ep-2',
        title: '判断与幂函数相关的复合函数的单调性',
        description: '关注内外函数复合后的单调性传递。',
      },
      {
        id: 'ep-3',
        title: '由幂函数的单调性求参数',
      },
    ],
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const tmp = copy[index];
  copy[index] = copy[next];
  copy[next] = tmp;
  return copy;
}

function isBlank(s?: string) {
  return !s || !s.trim();
}

function keyPointHasContent(kp: KnowledgeCardKeyPoint) {
  return !isBlank(kp.content) || kp.images.length > 0;
}

function formulaHasContent(fm: KnowledgeCardFormula) {
  return !isBlank(fm.name) || !isBlank(fm.content);
}

function examPointHasContent(ep: KnowledgeCardExamPoint) {
  return !isBlank(ep.title) || !isBlank(ep.description) || !!ep.example;
}

function exampleHasContent(ex: KnowledgeCardExample) {
  return (
    !isBlank(ex.stem) ||
    ex.steps.length > 0 ||
    ex.tips.length > 0 ||
    ex.source === 'leke' ||
    ex.source === 'third_party'
  );
}

function stepHasContent(st: KnowledgeCardExamStep) {
  return !isBlank(st.title) || !isBlank(st.detail);
}

function tipHasContent(tip: KnowledgeCardExamTip) {
  return !isBlank(tip.content);
}

function normalizePasteText(raw: string) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\ufeff]/g, '')
    .trim();
}

function splitPastedBlocks(raw: string): string[] {
  const text = normalizePasteText(raw);
  if (!text) return [];

  const numbered = text
    .split(/(?:^|\n)\s*(?:(?:\d+|[一二三四五六七八九十]+)[.、．\)]|（\d+）|\(\d+\)|[①-⑳])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (numbered.length >= 2) return numbered;

  const bullets = text
    .split(/(?:^|\n)\s*[-*•·]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bullets.length >= 2) return bullets;

  const paras = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paras.length >= 2) return paras;

  return [text];
}

function parseExamPasteBlock(block: string): { title: string; description?: string } {
  const labeledTitle = block.match(/考点名称[：:]\s*([^\n]+)/);
  const labeledDesc = block.match(/考点说明[：:]\s*([\s\S]+)/);
  if (labeledTitle) {
    const description = labeledDesc?.[1]?.trim();
    return { title: labeledTitle[1].trim(), description: description || undefined };
  }
  const lines = block.split('\n').map((s) => s.trim()).filter(Boolean);
  const title = (lines[0] || '').replace(/^(考点名称|名称)[：:]\s*/, '');
  const description = lines.slice(1).join('\n').replace(/^(考点说明|说明)[：:]\s*/, '');
  return { title, description: description || undefined };
}

function parseFormulaPasteBlock(block: string): { name?: string; content: string } {
  const lines = block.split('\n').map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return { content: '' };
  const first = lines[0].replace(/^(公式|定理|公式定理)[：:]\s*/, '');
  const labeled = first.match(/^(.{1,20}?)[：:]\s*(.+)$/);
  if (labeled) {
    return {
      name: labeled[1].trim(),
      content: [labeled[2], ...lines.slice(1)].join('\n').trim(),
    };
  }
  if (lines.length >= 2 && first.length <= 16) {
    return { name: first, content: lines.slice(1).join('\n') };
  }
  return { content: first };
}

function PasteSplitZone({
  hint,
  example,
  onPasteText,
  tone = 'emerald',
}: {
  hint: string;
  example: string;
  onPasteText: (text: string) => number;
  tone?: 'teal' | 'amber' | 'emerald';
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const tones = {
    teal: 'border-teal-200 bg-teal-50/50 text-teal-800 focus:ring-teal-400',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-800 focus:ring-amber-400',
    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-800 focus:ring-emerald-400',
  };

  return (
    <div
      tabIndex={0}
      onPaste={(e) => {
        const text = e.clipboardData.getData('text/plain');
        if (!text.trim()) return;
        e.preventDefault();
        const n = onPasteText(text);
        setMsg(n > 0 ? `已拆分并填入 ${n} 条，可继续微调` : '未能识别可拆分内容，请按序号或空行分段后再试');
        window.setTimeout(() => setMsg(null), 2800);
      }}
      className={`rounded-lg border border-dashed px-3 py-2 text-xs cursor-text outline-none focus:ring-2 ${tones[tone]}`}
    >
      <div className="flex items-center gap-2 min-h-[18px]">
        <ClipboardPaste className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="flex-1 min-w-0 leading-relaxed">{msg || hint}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="shrink-0 text-[11px] font-medium underline-offset-2 hover:underline"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              示例
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            className="w-[360px] p-3 z-[70]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <p className="text-xs font-medium text-gray-800 mb-1.5">按此格式维护，即可粘贴拆分</p>
            <pre className="text-[11px] leading-relaxed text-gray-700 bg-gray-50 border border-gray-100 rounded-md px-2.5 py-2 whitespace-pre-wrap font-sans">
              {example}
            </pre>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function FieldReqTag({ required }: { required: boolean }) {
  return required ? (
    <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-semibold bg-rose-500 text-white leading-none">
      必填
    </span>
  ) : (
    <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 leading-none">
      选填
    </span>
  );
}

/** 空内容直接删；有内容弹窗确认 */
function DeleteIconButton({
  hasContent,
  label,
  onConfirm,
  className = 'p-1 rounded hover:bg-red-50 text-red-400',
  iconClassName = 'w-3.5 h-3.5',
}: {
  hasContent: boolean;
  label: string;
  onConfirm: () => void;
  className?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        title={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!hasContent) {
            onConfirm();
            return;
          }
          const scroller = document.querySelector('[data-detail-scroll]') as HTMLElement | null;
          const top = scroller?.scrollTop ?? 0;
          setOpen(true);
          requestAnimationFrame(() => {
            if (scroller) scroller.scrollTop = top;
          });
        }}
      >
        <Trash2 className={iconClassName} />
      </button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          const scroller = document.querySelector('[data-detail-scroll]') as HTMLElement | null;
          const top = scroller?.scrollTop ?? 0;
          setOpen(next);
          requestAnimationFrame(() => {
            if (scroller) scroller.scrollTop = top;
          });
        }}
      >
        <AlertDialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              {label}内已有内容，删除后不可恢复。确定要删除吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const ADD_BTN_TONES = {
  teal: 'text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-400',
  amber: 'text-amber-800 border-amber-200 bg-amber-50/60 hover:bg-amber-50 hover:border-amber-400',
  emerald: 'text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400',
  orange: 'text-orange-700 border-orange-200 bg-orange-50/70 hover:bg-orange-50 hover:border-orange-300',
};

function AddActionButton({
  onClick,
  children,
  tone = 'emerald',
  compact = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: keyof typeof ADD_BTN_TONES;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full ${compact ? 'h-8 text-xs' : 'h-9 text-sm'} font-medium rounded-lg border border-dashed inline-flex items-center justify-center gap-1.5 transition-colors ${ADD_BTN_TONES[tone]}`}
    >
      <Plus className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {children}
    </button>
  );
}

type CardSubTab = 'concept' | 'exam';

interface KnowledgeCardPanelProps {
  value?: KnowledgeCard;
  isEditing: boolean;
  onChange: (card: KnowledgeCard) => void;
  /** 当前知识点 id，用于切换节点时重置，并在重挂载时恢复子 Tab */
  nodeId?: string;
}

/** 按知识点记住核心概念 / 考点子 Tab，避免结构变更重挂载后跳回核心概念 */
const subTabMemory = new Map<string, CardSubTab>();
/** 按知识点记住展开中的考点 id */
const expandedExamMemory = new Map<string, Set<string>>();

const KnowledgeCardPanel = React.memo(function KnowledgeCardPanel({
  value,
  isEditing,
  onChange,
  nodeId,
}: KnowledgeCardPanelProps) {
  const [subTab, setSubTabState] = useState<CardSubTab>(() =>
    nodeId ? (subTabMemory.get(nodeId) ?? 'concept') : 'concept'
  );
  const setSubTab = useCallback(
    (next: CardSubTab) => {
      if (nodeId) subTabMemory.set(nodeId, next);
      setSubTabState(next);
    },
    [nodeId]
  );

  const [expandedExamIds, setExpandedExamIds] = useState<Set<string>>(
    () => (nodeId ? new Set(expandedExamMemory.get(nodeId) ?? []) : new Set())
  );
  const [lekePickForExamId, setLekePickForExamId] = useState<string | null>(null);
  const [draft, setDraft] = useState<KnowledgeCard>(() => value ?? emptyKnowledgeCard());

  const wasEditingRef = useRef(isEditing);
  const composingRef = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const prevNodeIdRef = useRef(nodeId);

  // 切换知识点时重置本地态，并恢复该节点上次停留的子 Tab / 展开态
  useEffect(() => {
    if (prevNodeIdRef.current === nodeId) return;
    prevNodeIdRef.current = nodeId;
    setSubTabState(nodeId ? (subTabMemory.get(nodeId) ?? 'concept') : 'concept');
    setExpandedExamIds(nodeId ? new Set(expandedExamMemory.get(nodeId) ?? []) : new Set());
    setLekePickForExamId(null);
    setDraft(value ?? emptyKnowledgeCard());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when node switches
  }, [nodeId]);

  // Enter edit: sync draft from parent value once (false → true)
  useEffect(() => {
    const wasEditing = wasEditingRef.current;
    if (isEditing && !wasEditing) {
      const next = value ?? emptyKnowledgeCard();
      draftRef.current = next;
      setDraft(next);
    }
    wasEditingRef.current = isEditing;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync on edit toggle, not value churn while editing
  }, [isEditing]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /** 全部在面板内更新；onChange 只写入父级 ref，不触发整页 setState */
  const commit = useCallback((next: KnowledgeCard) => {
    draftRef.current = next;
    setDraft(next);
    onChangeRef.current(next);
  }, []);

  const updateLocal = commit;
  const updateAndSync = commit;
  const requestFocus = useCallback((_id: string) => {
    /* 不自动聚焦，避免浏览器把滚动容器拽到输入框 */
  }, []);

  const card = isEditing ? draft : (value ?? emptyKnowledgeCard());
  const summary = `${card.keyPoints.length} 要点 · ${card.formulas.length} 公式 · ${card.examPoints.length} 考点`;

  const imeHandlers = {
    onCompositionStart: () => {
      composingRef.current = true;
    },
    onCompositionEnd: () => {
      composingRef.current = false;
    },
  };

  const fieldBlurHandlers = {
    onBlur: () => {},
  };

  const toggleExam = (id: string) => {
    setExpandedExamIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      if (nodeId) expandedExamMemory.set(nodeId, new Set(n));
      return n;
    });
  };

  /** 仅展开（幂等），用于新增考点后默认展开 */
  const expandExam = useCallback(
    (id: string) => {
      setExpandedExamIds((prev) => {
        if (prev.has(id)) return prev;
        const n = new Set(prev);
        n.add(id);
        if (nodeId) expandedExamMemory.set(nodeId, new Set(n));
        return n;
      });
    },
    [nodeId]
  );

  const applyBankQuestion = (examId: string, q: BankQuestion) => {
    updateAndSync({
      ...draftRef.current,
      examPoints: draftRef.current.examPoints.map((ep) =>
        ep.id !== examId
          ? ep
          : {
              ...ep,
              example: {
                stem: q.stem,
                source: q.source,
                lekeQuestionId: q.id,
                steps: q.steps.map((s) => ({
                  id: uid('st'),
                  title: s.title,
                  detail: s.detail,
                })),
                tips: q.tips.map((t) => ({ id: uid('tip'), content: t })),
              },
            }
      ),
    });
    setLekePickForExamId(null);
    expandExam(examId);
  };

  const pickingExam = lekePickForExamId
    ? draftRef.current.examPoints.find((ep) => ep.id === lekePickForExamId)
    : undefined;
  const pickingHasContent = !!(pickingExam?.example && exampleHasContent(pickingExam.example));

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-5 [overflow-anchor:none]">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
          <h4 className="font-semibold text-gray-900">知识卡片</h4>
          <span className="text-xs text-gray-500 bg-white/80 border border-emerald-100 rounded-full px-2 py-0.5 truncate">
            {summary}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-white/70 border border-emerald-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('concept')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                subTab === 'concept'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-emerald-50'
              }`}
            >
              核心概念
            </button>
            <button
              type="button"
              onClick={() => setSubTab('exam')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                subTab === 'exam'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-emerald-50'
              }`}
            >
              考点
            </button>
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => updateAndSync(sampleKnowledgeCard())}
            >
              填充示例数据
            </Button>
          )}
        </div>
      </div>

      {subTab === 'concept' ? (
        <ConceptPanel
          card={card}
          isEditing={isEditing}
          onLocalChange={updateLocal}
          onStructChange={updateAndSync}
          fieldBlurHandlers={fieldBlurHandlers}
          onRequestFocus={requestFocus}
          imeHandlers={imeHandlers}
        />
      ) : (
        <ExamPanel
          card={card}
          isEditing={isEditing}
          expandedExamIds={expandedExamIds}
          onToggleExam={toggleExam}
          onExpandExam={expandExam}
          onLocalChange={updateLocal}
          onStructChange={updateAndSync}
          fieldBlurHandlers={fieldBlurHandlers}
          onOpenLekePick={setLekePickForExamId}
          onRequestFocus={requestFocus}
          onStayOnExamTab={() => setSubTab('exam')}
          imeHandlers={imeHandlers}
        />
      )}

      <LekeQuestionPicker
        open={!!lekePickForExamId}
        hasExistingContent={pickingHasContent}
        onClose={() => setLekePickForExamId(null)}
        onSelect={(q) => {
          if (lekePickForExamId) applyBankQuestion(lekePickForExamId, q);
        }}
      />
    </div>
  );
}, (prev, next) => {
  if (prev.isEditing !== next.isEditing) return false;
  if (next.isEditing) return true;
  return prev.value === next.value;
});

export default KnowledgeCardPanel;

type FieldBlurHandlers = { onBlur: () => void };
type ImeHandlers = {
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
};

function ConceptPanel({
  card,
  isEditing,
  onLocalChange,
  onStructChange,
  fieldBlurHandlers,
  onRequestFocus,
  imeHandlers,
}: {
  card: KnowledgeCard;
  isEditing: boolean;
  onLocalChange: (c: KnowledgeCard) => void;
  onStructChange: (c: KnowledgeCard) => void;
  fieldBlurHandlers: FieldBlurHandlers;
  onRequestFocus: (id: string) => void;
  imeHandlers: ImeHandlers;
}) {
  const empty = card.keyPoints.length === 0 && card.formulas.length === 0;

  if (!isEditing && empty) {
    return (
      <div className="text-center py-10 text-gray-400">
        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无核心概念</p>
      </div>
    );
  }

  const addKeyPoint = () => {
    const id = uid('kp');
    onRequestFocus(id);
    onStructChange({
      ...card,
      keyPoints: [...card.keyPoints, { id, content: '', images: [] }],
    });
  };

  const addFormula = () => {
    const id = uid('fm');
    onRequestFocus(id);
    onStructChange({
      ...card,
      formulas: [...card.formulas, { id, name: '', content: '' }],
    });
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
            要点
          </span>
        </div>
        {isEditing && (
          <PasteSplitZone
            tone="teal"
            hint="点击后按Ctrl+V进行粘贴，系统将按序号自动拆分要点"
            example={`1. 形如 y = x^α（α 为常数）的函数称为幂函数，系数必须为 1。
2. 当 α > 0 时，幂函数在 (0, +∞) 上单调递增。
3. 当 α < 0 时，幂函数在 (0, +∞) 上单调递减。`}
            onPasteText={(text) => {
              const blocks = splitPastedBlocks(text);
              const items = blocks
                .map((b) => b.replace(/^(要点|正文)[：:]\s*/, '').trim())
                .filter(Boolean)
                .map((content) => ({ id: uid('kp'), content, images: [] as KnowledgeCardImage[] }));
              if (items.length === 0) return 0;
              const keep =
                card.keyPoints.length > 0 && card.keyPoints.some(keyPointHasContent)
                  ? card.keyPoints
                  : [];
              onStructChange({ ...card, keyPoints: [...keep, ...items] });
              return items.length;
            }}
          />
        )}

        {card.keyPoints.length === 0 ? (
          !isEditing ? (
            <div className="text-xs text-gray-400 py-3 px-3 bg-white/60 rounded-lg border border-dashed border-gray-200">
              未配置要点（学生端不展示要点模块）
            </div>
          ) : null
        ) : (
          <div className="space-y-2">
            {card.keyPoints.map((kp, index) => (
              <div
                key={kp.id}
                className="bg-white rounded-lg border border-gray-200 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <textarea
                        data-card-field={kp.id}
                        value={kp.content}
                        {...imeHandlers}
                        {...fieldBlurHandlers}
                        onChange={(e) => {
                          const keyPoints = card.keyPoints.map((item) =>
                            item.id === kp.id ? { ...item, content: e.target.value } : item
                          );
                          onLocalChange({ ...card, keyPoints });
                        }}
                        rows={3}
                        placeholder="输入要点正文（支持公式文案）"
                        className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {kp.content || '（空）'}
                      </p>
                    )}
                    {kp.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {kp.images.map((img) => (
                          <div
                            key={img.id}
                            className="relative w-20 h-20 rounded-md border border-gray-200 bg-gray-50 overflow-hidden"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.alt || ''}
                              className="w-full h-full object-cover"
                            />
                            {isEditing && (
                              <button
                                type="button"
                                title="删除配图"
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                                onClick={() => {
                                  const keyPoints = card.keyPoints.map((item) =>
                                    item.id === kp.id
                                      ? { ...item, images: item.images.filter((i) => i.id !== img.id) }
                                      : item
                                  );
                                  onStructChange({ ...card, keyPoints });
                                }}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-dashed border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-400 transition-colors"
                        onClick={() => {
                          const keyPoints = card.keyPoints.map((item) =>
                            item.id === kp.id
                              ? {
                                  ...item,
                                  images: [
                                    ...item.images,
                                    {
                                      id: uid('img'),
                                      url: `https://placehold.co/320x180/e2e8f0/64748b?text=要点图${item.images.length + 1}`,
                                      alt: '要点配图',
                                    },
                                  ],
                                }
                              : item
                          );
                          onStructChange({ ...card, keyPoints });
                        }}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        添加配图（原型占位）
                      </button>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() =>
                          onStructChange({
                            ...card,
                            keyPoints: moveItem(card.keyPoints, index, -1),
                          })
                        }
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        disabled={index === card.keyPoints.length - 1}
                        onClick={() =>
                          onStructChange({
                            ...card,
                            keyPoints: moveItem(card.keyPoints, index, 1),
                          })
                        }
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <DeleteIconButton
                        hasContent={keyPointHasContent(kp)}
                        label="该要点"
                        onConfirm={() =>
                          onStructChange({
                            ...card,
                            keyPoints: card.keyPoints.filter((item) => item.id !== kp.id),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isEditing && (
          <AddActionButton tone="teal" onClick={addKeyPoint}>
            添加要点
          </AddActionButton>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            公式定理
            {card.formulas.length > 0 ? ` · ${card.formulas.length}条` : ''}
          </span>
        </div>
        {isEditing && (
          <PasteSplitZone
            tone="amber"
            hint="点击后按Ctrl+V进行粘贴，系统将按序号自动拆分公式定理的名称和内容"
            example={`1. 定义式：y = x^α（α 为常数，系数必须为 1）
2. 递增条件：α > 0 时，在 (0, +∞) 上单调递增
3. 递减条件：α < 0 时，在 (0, +∞) 上单调递减`}
            onPasteText={(text) => {
              const blocks = splitPastedBlocks(text);
              const items = blocks
                .map(parseFormulaPasteBlock)
                .filter((item) => !isBlank(item.content) || !isBlank(item.name))
                .map((item) => ({ id: uid('fm'), name: item.name || '', content: item.content }));
              if (items.length === 0) return 0;
              const keep =
                card.formulas.length > 0 && card.formulas.some(formulaHasContent)
                  ? card.formulas
                  : [];
              onStructChange({ ...card, formulas: [...keep, ...items] });
              return items.length;
            }}
          />
        )}

        {card.formulas.length === 0 ? (
          !isEditing ? (
            <div className="text-xs text-gray-400 py-3 px-3 bg-white/60 rounded-lg border border-dashed border-gray-200">
              未配置公式定理（学生端不展示该模块）
            </div>
          ) : null
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2 space-y-2">
            {card.formulas.map((fm, index) => (
              <div
                key={fm.id}
                className="bg-white rounded-md border border-amber-100 p-3 flex items-start gap-2"
              >
                <span className="mt-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-2 min-w-0">
                  {isEditing ? (
                    <>
                      <input
                        data-card-field={fm.id}
                        value={fm.name || ''}
                        {...imeHandlers}
                        {...fieldBlurHandlers}
                        onChange={(e) => {
                          const formulas = card.formulas.map((item) =>
                            item.id === fm.id ? { ...item, name: e.target.value } : item
                          );
                          onLocalChange({ ...card, formulas });
                        }}
                        placeholder="名称（可选，如：定义式）"
                        className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <input
                        value={fm.content}
                        {...imeHandlers}
                        {...fieldBlurHandlers}
                        onChange={(e) => {
                          const formulas = card.formulas.map((item) =>
                            item.id === fm.id ? { ...item, content: e.target.value } : item
                          );
                          onLocalChange({ ...card, formulas });
                        }}
                        placeholder="公式 / 定理内容"
                        className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-800">
                      {fm.name ? (
                        <>
                          <span className="font-semibold text-amber-900">{fm.name}：</span>
                          {fm.content}
                        </>
                      ) : (
                        fm.content || '（空）'
                      )}
                    </p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-amber-100 text-gray-400 disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() =>
                        onStructChange({
                          ...card,
                          formulas: moveItem(card.formulas, index, -1),
                        })
                      }
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-amber-100 text-gray-400 disabled:opacity-30"
                      disabled={index === card.formulas.length - 1}
                      onClick={() =>
                        onStructChange({
                          ...card,
                          formulas: moveItem(card.formulas, index, 1),
                        })
                      }
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <DeleteIconButton
                      hasContent={formulaHasContent(fm)}
                      label="该公式定理"
                      onConfirm={() =>
                        onStructChange({
                          ...card,
                          formulas: card.formulas.filter((item) => item.id !== fm.id),
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditing && (
          <AddActionButton tone="amber" onClick={addFormula}>
            添加公式定理
          </AddActionButton>
        )}
      </section>
    </div>
  );
}

const EXAM_PREVIEW_THEMES = [
  {
    card: 'border-emerald-200',
    header: 'bg-emerald-100/80',
    headerBorder: 'border-b border-emerald-200/80',
    desc: 'bg-emerald-50',
    descBorder: 'border-b border-emerald-100',
    title: 'text-emerald-900',
    label: 'text-emerald-700',
    icon: 'text-emerald-600',
  },
  {
    card: 'border-sky-200',
    header: 'bg-sky-100/80',
    headerBorder: 'border-b border-sky-200/80',
    desc: 'bg-sky-50',
    descBorder: 'border-b border-sky-100',
    title: 'text-sky-900',
    label: 'text-sky-700',
    icon: 'text-sky-600',
  },
  {
    card: 'border-amber-200',
    header: 'bg-amber-100/80',
    headerBorder: 'border-b border-amber-200/80',
    desc: 'bg-amber-50',
    descBorder: 'border-b border-amber-100',
    title: 'text-amber-900',
    label: 'text-amber-700',
    icon: 'text-amber-600',
  },
];

function OrangeDiamond() {
  return <span className="inline-block w-2 h-2 rotate-45 bg-orange-400 flex-shrink-0" />;
}

function ExamPointPreview({
  ep,
  index,
  expanded,
  onToggle,
}: {
  ep: KnowledgeCardExamPoint;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const theme = EXAM_PREVIEW_THEMES[index % EXAM_PREVIEW_THEMES.length];
  const hasStem = !isBlank(ep.example?.stem);
  const steps = ep.example?.steps ?? [];
  const tips = ep.example?.tips ?? [];
  const hasBody = !!ep.description || hasStem;

  return (
    <div className={`rounded-2xl border ${theme.card} overflow-hidden bg-white`}>
      <button
        type="button"
        className={`${theme.header} ${theme.headerBorder} w-full px-4 py-2.5 flex items-center gap-2 text-left`}
        onClick={onToggle}
      >
        <BookOpen className={`w-4 h-4 ${theme.icon} flex-shrink-0`} />
        <span className={`text-sm font-semibold ${theme.title} min-w-0 truncate`}>
          考点{index + 1}
          {ep.title ? `：${ep.title}` : ''}
        </span>
        {hasBody ? (
          expanded ? (
            <ChevronUp className={`w-4 h-4 ml-auto flex-shrink-0 ${theme.icon}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 ${theme.icon}`} />
          )
        ) : null}
      </button>

      {expanded && (
        <>
          {ep.description ? (
            <div className={`${theme.desc} ${theme.descBorder} px-4 py-2.5 text-xs leading-relaxed`}>
              <span className={`font-semibold ${theme.label}`}>考点说明：</span>
              <span className="text-gray-600 whitespace-pre-wrap">{ep.description}</span>
            </div>
          ) : null}

          {hasStem && ep.example && (
            <div className="m-3 rounded-xl border border-teal-100 bg-white p-3 space-y-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                典型例题
              </span>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ep.example.stem}
              </p>

              {steps.length > 0 && (
                <div className="pt-2 border-t border-dashed border-gray-200">
                  <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-sm mb-2">
                    <OrangeDiamond />
                    解题步骤
                  </div>
                  <ol className="space-y-3">
                    {steps.map((st, i) => (
                      <li
                        key={st.id}
                        className="border-l-[4px] border-amber-400 pl-3 text-sm leading-relaxed"
                      >
                        <div className="font-bold text-gray-900">
                          <span className="mr-1">{i + 1}.</span>
                          {st.title || ''}
                        </div>
                        {st.detail ? (
                          <p className="mt-1 font-normal text-gray-700 whitespace-pre-wrap">
                            {st.detail}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {tips.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-100/80 p-3">
                  <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-sm mb-2">
                    <OrangeDiamond />
                    解题要点
                  </div>
                  <div className="space-y-2">
                    {tips.map((tip, i) => (
                      <div key={tip.id} className="flex gap-2 items-start">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-orange-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-800 leading-relaxed">{tip.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExamPanel({
  card,
  isEditing,
  expandedExamIds,
  onToggleExam,
  onExpandExam,
  onLocalChange,
  onStructChange,
  fieldBlurHandlers,
  onOpenLekePick,
  onRequestFocus,
  onStayOnExamTab,
  imeHandlers,
}: {
  card: KnowledgeCard;
  isEditing: boolean;
  expandedExamIds: Set<string>;
  onToggleExam: (id: string) => void;
  onExpandExam: (id: string) => void;
  onLocalChange: (c: KnowledgeCard) => void;
  onStructChange: (c: KnowledgeCard) => void;
  fieldBlurHandlers: FieldBlurHandlers;
  onOpenLekePick: (examId: string) => void;
  onRequestFocus: (id: string) => void;
  onStayOnExamTab: () => void;
  imeHandlers: ImeHandlers;
}) {
  if (!isEditing && card.examPoints.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无考点</p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="space-y-3">
        {card.examPoints.map((ep, index) => (
          <ExamPointPreview
            key={ep.id}
            ep={ep}
            index={index}
            expanded={expandedExamIds.has(ep.id)}
            onToggle={() => onToggleExam(ep.id)}
          />
        ))}
      </div>
    );
  }

  const examColors = [
    'border-emerald-200 bg-emerald-50/50',
    'border-sky-200 bg-sky-50/50',
    'border-amber-200 bg-amber-50/50',
    'border-violet-200 bg-violet-50/50',
  ];

  const addExam = () => {
    onStayOnExamTab();
    const id = uid('ep');
    onRequestFocus(id);
    onExpandExam(id);
    onStructChange({
      ...card,
      examPoints: [...card.examPoints, { id, title: '', description: '' }],
    });
  };

  return (
    <div className="space-y-3">
      <PasteSplitZone
        tone="emerald"
        hint="点击后按Ctrl+V进行粘贴，系统将按序号自动拆分考点名称和说明"
        example={`1. 判断一般幂函数的单调性
直接给出解析式，根据指数正负判断单调性。

2. 判断与幂函数相关的复合函数的单调性
关注内外函数复合后的单调性传递。`}
        onPasteText={(text) => {
          const blocks = splitPastedBlocks(text);
          const parsed = blocks
            .map(parseExamPasteBlock)
            .filter((item) => !isBlank(item.title) || !isBlank(item.description));
          if (parsed.length === 0) return 0;
          const keep =
            card.examPoints.length > 0 && card.examPoints.some(examPointHasContent)
              ? card.examPoints
              : [];
          const added = parsed.map((item) => ({
            id: uid('ep'),
            title: item.title,
            description: item.description || '',
          }));
          onStayOnExamTab();
          added.forEach((item) => onExpandExam(item.id));
          onStructChange({ ...card, examPoints: [...keep, ...added] });
          return added.length;
        }}
      />
      {card.examPoints.map((ep, index) => {
          const expanded = expandedExamIds.has(ep.id);
          const color = examColors[index % examColors.length];
          return (
            <div key={ep.id} className={`rounded-xl border ${color} overflow-hidden`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                  onClick={() => onToggleExam(ep.id)}
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                  <span className="text-xs font-bold text-gray-500 flex-shrink-0">
                    考点{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {ep.title || (!isEditing ? '未命名考点' : '')}
                  </span>
                  {ep.example && !isBlank(ep.example.stem) ? (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      有例题
                    </span>
                  ) : (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-400 border border-gray-200 flex-shrink-0">
                      无例题
                    </span>
                  )}
                </button>
                {isEditing && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-white/80 text-gray-400 disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() =>
                        onStructChange({
                          ...card,
                          examPoints: moveItem(card.examPoints, index, -1),
                        })
                      }
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-white/80 text-gray-400 disabled:opacity-30"
                      disabled={index === card.examPoints.length - 1}
                      onClick={() =>
                        onStructChange({
                          ...card,
                          examPoints: moveItem(card.examPoints, index, 1),
                        })
                      }
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <DeleteIconButton
                      hasContent={examPointHasContent(ep)}
                      label="该考点"
                      onConfirm={() =>
                        onStructChange({
                          ...card,
                          examPoints: card.examPoints.filter((item) => item.id !== ep.id),
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {expanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-white/60 bg-white/70">
                  <div className="pt-3 space-y-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      考点名称
                      {isEditing && <FieldReqTag required />}
                    </label>
                    {isEditing ? (
                      <input
                        data-card-field={ep.id}
                        value={ep.title}
                        {...imeHandlers}
                        {...fieldBlurHandlers}
                        onChange={(e) => {
                          const examPoints = card.examPoints.map((item) =>
                            item.id === ep.id ? { ...item, title: e.target.value } : item
                          );
                          onLocalChange({ ...card, examPoints });
                        }}
                        placeholder="如：判断一般幂函数的单调性"
                        className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{ep.title || '—'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      考点说明
                      {isEditing && <FieldReqTag required={false} />}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={ep.description || ''}
                        {...imeHandlers}
                        {...fieldBlurHandlers}
                        onChange={(e) => {
                          const examPoints = card.examPoints.map((item) =>
                            item.id === ep.id
                              ? { ...item, description: e.target.value }
                              : item
                          );
                          onLocalChange({ ...card, examPoints });
                        }}
                        rows={2}
                        placeholder="不填则学生端不展示考点说明"
                        className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                      />
                    ) : ep.description ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {ep.description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">未配置考点说明</p>
                    )}
                  </div>

                  {(isEditing || !isBlank(ep.example?.stem)) && (
                    <ExampleEditor
                      example={
                        ep.example ?? {
                          stem: '',
                          source: 'manual' as const,
                          steps: [],
                          tips: [],
                        }
                      }
                      isEditing={isEditing}
                      onLocalChange={(example) => {
                        const examPoints = card.examPoints.map((item) =>
                          item.id === ep.id ? { ...item, example } : item
                        );
                        onLocalChange({ ...card, examPoints });
                      }}
                      onStructChange={(example) => {
                        const examPoints = card.examPoints.map((item) =>
                          item.id === ep.id ? { ...item, example } : item
                        );
                        onStructChange({ ...card, examPoints });
                      }}
                      onClear={
                        ep.example
                          ? () => {
                              const examPoints = card.examPoints.map((item) =>
                                item.id === ep.id ? { ...item, example: undefined } : item
                              );
                              onStructChange({ ...card, examPoints });
                            }
                          : undefined
                      }
                      fieldBlurHandlers={fieldBlurHandlers}
                      onPullLeke={() => onOpenLekePick(ep.id)}
                      onRequestFocus={onRequestFocus}
                      imeHandlers={imeHandlers}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

      {isEditing && (
        <AddActionButton tone="emerald" onClick={addExam}>
          添加考点
        </AddActionButton>
      )}
    </div>
  );
}

function ExampleEditor({
  example,
  isEditing,
  onLocalChange,
  onStructChange,
  onClear,
  fieldBlurHandlers,
  onPullLeke,
  onRequestFocus,
  imeHandlers,
}: {
  example: KnowledgeCardExample;
  isEditing: boolean;
  onLocalChange: (ex: KnowledgeCardExample) => void;
  onStructChange: (ex: KnowledgeCardExample) => void;
  onClear?: () => void;
  fieldBlurHandlers: FieldBlurHandlers;
  onPullLeke: () => void;
  onRequestFocus: (id: string) => void;
  imeHandlers: ImeHandlers;
}) {
  const hasStem = !isBlank(example.stem);
  const showStepsAndTips = hasStem;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
              题干
              {isEditing && <FieldReqTag required />}
            </label>
            {isEditing && onClear && hasStem && (
              <DeleteIconButton
                hasContent={exampleHasContent(example)}
                label="该例题"
                onConfirm={onClear}
              />
            )}
          </div>
          {isEditing && (
            <button
              type="button"
              className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
              onClick={onPullLeke}
            >
              <Link2 className="w-3 h-3" />
              系统选择
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea
            value={example.stem}
            {...imeHandlers}
            {...fieldBlurHandlers}
            onChange={(e) => onLocalChange({ ...example, stem: e.target.value })}
            rows={3}
            placeholder="不填则学生端不展示典型例题"
            className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{example.stem}</p>
        )}
      </div>

      {showStepsAndTips && (isEditing || example.steps.length > 0) && (
        <div className="space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
            解题步骤
            {isEditing && <FieldReqTag required />}
          </label>
          {example.steps.map((st, index) => (
            <div key={st.id} className="flex gap-2 items-start">
              <span className="mt-2 w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 space-y-1">
                {isEditing ? (
                  <>
                    <input
                      data-card-field={st.id}
                      value={st.title || ''}
                      {...imeHandlers}
                      {...fieldBlurHandlers}
                      onChange={(e) => {
                        const steps = example.steps.map((item) =>
                          item.id === st.id ? { ...item, title: e.target.value } : item
                        );
                        onLocalChange({ ...example, steps });
                      }}
                      placeholder="步骤标题（可选）"
                      className="w-full text-sm font-medium border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <textarea
                      value={st.detail}
                      {...imeHandlers}
                      {...fieldBlurHandlers}
                      onChange={(e) => {
                        const steps = example.steps.map((item) =>
                          item.id === st.id ? { ...item, detail: e.target.value } : item
                        );
                        onLocalChange({ ...example, steps });
                      }}
                      rows={2}
                      placeholder="步骤详述"
                      className="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                    />
                  </>
                ) : (
                  <div>
                    {st.title && (
                      <div className="text-sm font-semibold text-gray-900">{st.title}</div>
                    )}
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{st.detail}</div>
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    className="p-1 text-gray-400 disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() =>
                      onStructChange({ ...example, steps: moveItem(example.steps, index, -1) })
                    }
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-400 disabled:opacity-30"
                    disabled={index === example.steps.length - 1}
                    onClick={() =>
                      onStructChange({ ...example, steps: moveItem(example.steps, index, 1) })
                    }
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <DeleteIconButton
                    hasContent={stepHasContent(st)}
                    label="该解题步骤"
                    className="p-1 text-red-400"
                    iconClassName="w-3 h-3"
                    onConfirm={() =>
                      onStructChange({
                        ...example,
                        steps: example.steps.filter((item) => item.id !== st.id),
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
          {isEditing && (
            <AddActionButton
              compact
              tone="emerald"
              onClick={() => {
                const id = uid('st');
                onRequestFocus(id);
                onStructChange({
                  ...example,
                  steps: [...example.steps, { id, title: '', detail: '' }],
                });
              }}
            >
              添加步骤
            </AddActionButton>
          )}
        </div>
      )}

      {showStepsAndTips && (isEditing || example.tips.length > 0) && (
        <div className="space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
            解题要点
            {isEditing && <FieldReqTag required={false} />}
          </label>
          {example.tips.map((tip, index) => (
            <div key={tip.id} className="flex items-start gap-2">
              <span className="mt-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              {isEditing ? (
                <input
                  data-card-field={tip.id}
                  value={tip.content}
                  {...imeHandlers}
                  {...fieldBlurHandlers}
                  onChange={(e) => {
                    const tips = example.tips.map((item) =>
                      item.id === tip.id ? { ...item, content: e.target.value } : item
                    );
                    onLocalChange({ ...example, tips });
                  }}
                  placeholder="解题要点"
                  className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-sm text-gray-700 flex-1">{tip.content}</p>
              )}
              {isEditing && (
                <DeleteIconButton
                  hasContent={tipHasContent(tip)}
                  label="该解题要点"
                  className="p-1 text-red-400"
                  iconClassName="w-3 h-3"
                  onConfirm={() =>
                    onStructChange({
                      ...example,
                      tips: example.tips.filter((item) => item.id !== tip.id),
                    })
                  }
                />
              )}
            </div>
          ))}
          {isEditing && (
            <AddActionButton
              compact
              tone="orange"
              onClick={() => {
                const id = uid('tip');
                onRequestFocus(id);
                onStructChange({
                  ...example,
                  tips: [...example.tips, { id, content: '' }],
                });
              }}
            >
              添加要点
            </AddActionButton>
          )}
        </div>
      )}
    </div>
  );
}
