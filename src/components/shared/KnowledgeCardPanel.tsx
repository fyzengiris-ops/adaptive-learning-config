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
  BookOpen,
  X,
  Link2,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  PaintBucket,
  ListOrdered,
  List,
  Code2,
  FunctionSquare,
  Table2,
  Eraser,
  TabletSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import LekeQuestionPicker, { type BankQuestion } from '@/components/shared/LekeQuestionPicker';
import KnowledgeCardTabletPreview from '@/components/shared/KnowledgeCardTabletPreview';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

/** 自定义类型模块中的条目（维护方式对齐要点） */
export interface KnowledgeCardModuleItem {
  id: string;
  content: string;
  images: KnowledgeCardImage[];
}

/** 核心概念下可自定义名称的类型模块（可多块） */
export interface KnowledgeCardCustomModule {
  id: string;
  name: string;
  items: KnowledgeCardModuleItem[];
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

export type KnowledgeCardExamType = 'basic' | 'advanced' | 'sprint';

export const EXAM_POINT_TYPES: Array<{
  id: KnowledgeCardExamType;
  label: string;
  tagClass: string;
  chipSelectedClass: string;
}> = [
  {
    id: 'basic',
    label: '基础达标',
    tagClass: 'bg-sky-100 text-sky-800 border-sky-300',
    chipSelectedClass: 'bg-sky-100 border-sky-400 text-sky-800 font-semibold',
  },
  {
    id: 'advanced',
    label: '综合进阶',
    tagClass: 'bg-violet-100 text-violet-800 border-violet-300',
    chipSelectedClass: 'bg-violet-100 border-violet-400 text-violet-800 font-semibold',
  },
  {
    id: 'sprint',
    label: '高分冲刺',
    tagClass: 'bg-amber-100 text-amber-800 border-amber-300',
    chipSelectedClass: 'bg-amber-100 border-amber-400 text-amber-900 font-semibold',
  },
];

export function examTypeMeta(type?: KnowledgeCardExamType) {
  return EXAM_POINT_TYPES.find((item) => item.id === type);
}

/** 知识点维度「关联考点」主数据 */
export interface RelatedExamPoint {
  id: string;
  name: string;
  /** 新建未选时可为空；保存前必须选定 */
  examType?: KnowledgeCardExamType;
}

export interface KnowledgeCardExamPoint {
  id: string;
  title: string;
  examType?: KnowledgeCardExamType;
  description?: string;
  example?: KnowledgeCardExample;
}

export interface KnowledgeCard {
  keyPoints: KnowledgeCardKeyPoint[];
  customModules: KnowledgeCardCustomModule[];
  examPoints: KnowledgeCardExamPoint[];
  /** 考点清单页固定模块：知识点 Tips（知识点级，不跟单个考点走） */
  knowledgeTips: KnowledgeCardExamTip[];
}

/** 关联考点主数据 + 卡片扩展内容 → 展示用考点列表（名称/类型以关联为准） */
export function mergeCardExamPoints(
  related: RelatedExamPoint[] | undefined,
  cardExams: KnowledgeCardExamPoint[] | undefined,
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

export function examPointHasExample(ep?: KnowledgeCardExamPoint) {
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

export function examPointHasDescription(ep?: KnowledgeCardExamPoint) {
  return !!(ep?.description && ep.description.trim());
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyKnowledgeTip(): KnowledgeCardExamTip {
  return { id: uid('ktip'), content: '' };
}

function normalizeKnowledgeTips(raw: unknown): KnowledgeCardExamTip[] {
  if (Array.isArray(raw)) {
    const list = raw
      .filter((item): item is { id?: string; content?: string } => !!item && typeof item === 'object')
      .map((item) => ({
        id: typeof item.id === 'string' && item.id ? item.id : uid('ktip'),
        content: typeof item.content === 'string' ? item.content : '',
      }));
    return list.length > 0 ? list : [emptyKnowledgeTip()];
  }
  if (typeof raw === 'string') {
    return [{ id: uid('ktip'), content: raw }];
  }
  return [emptyKnowledgeTip()];
}

export function knowledgeTipsHaveContent(tips?: KnowledgeCardExamTip[] | string): boolean {
  if (Array.isArray(tips)) return tips.some((item) => Boolean(item.content && item.content.trim()));
  return typeof tips === 'string' && Boolean(tips.trim());
}

export function emptyKnowledgeCard(): KnowledgeCard {
  return {
    keyPoints: [{ id: uid('kp'), content: '', images: [] }],
    customModules: [],
    examPoints: [],
    knowledgeTips: [emptyKnowledgeTip()],
  };
}

/** 兼容缺字段的旧数据 */
function normalizeKnowledgeCard(raw?: KnowledgeCard | null): KnowledgeCard {
  const base = raw ?? emptyKnowledgeCard();
  return {
    keyPoints:
      base.keyPoints && base.keyPoints.length > 0
        ? base.keyPoints
        : [{ id: uid('kp'), content: '', images: [] }],
    customModules: Array.isArray(base.customModules) ? base.customModules : [],
    examPoints: Array.isArray(base.examPoints) ? base.examPoints : [],
    knowledgeTips: normalizeKnowledgeTips(base.knowledgeTips),
  };
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
    knowledgeTips: [
      {
        id: 'ktip-1',
        content: '判断幂函数单调性时，先确认系数是否为 1，再根据指数正负下结论。',
      },
    ],
    customModules: [
      {
        id: 'mod-1',
        name: '公式定理',
        items: [
          {
            id: 'mi-1',
            content: '定义式：y = x^α（α 为常数，系数必须为 1）',
            images: [],
          },
          {
            id: 'mi-2',
            content: '递增条件：α > 0 时，在 (0, +∞) 上单调递增',
            images: [],
          },
          {
            id: 'mi-3',
            content: '递减条件：α < 0 时，在 (0, +∞) 上单调递减',
            images: [],
          },
        ],
      },
    ],
    examPoints: [
      {
        id: 'ep-1',
        title: '判断一般幂函数的单调性',
        examType: 'basic',
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
        examType: 'advanced',
        description: '关注内外函数复合后的单调性传递。',
      },
      {
        id: 'ep-3',
        title: '由幂函数的单调性求参数',
        examType: 'sprint',
      },
    ],
  };
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

function moduleItemHasContent(item: KnowledgeCardModuleItem) {
  return !isBlank(item.content) || item.images.length > 0;
}

function customModuleHasContent(mod: KnowledgeCardCustomModule) {
  return !isBlank(mod.name) || mod.items.some(moduleItemHasContent);
}

function examPointHasContent(ep: KnowledgeCardExamPoint) {
  return !isBlank(ep.title) || !!ep.examType || !isBlank(ep.description) || !!ep.example;
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

/** 保存前校验模块名，并去掉纯空要点/纯空模块条目 */
export function validateAndSanitizeKnowledgeCard(
  card: KnowledgeCard | undefined
): { ok: true; card: KnowledgeCard | undefined } | { ok: false; message: string } {
  if (!card) return { ok: true, card: undefined };
  const modules = card.customModules || [];
  if (modules.some((mod) => isBlank(mod.name))) {
    return { ok: false, message: '请填写所有模块的名称后再保存' };
  }
  const names = modules.map((mod) => mod.name.trim());
  if (new Set(names).size < names.length) {
    return { ok: false, message: '模块名称不能重复' };
  }
  return {
    ok: true,
    card: {
      ...card,
      keyPoints: (card.keyPoints || []).filter(keyPointHasContent),
      customModules: modules.map((mod) => ({
        ...mod,
        name: mod.name.trim(),
        items: (mod.items || []).filter(moduleItemHasContent),
      })),
      knowledgeTips: (card.knowledgeTips || []).filter((item) => !isBlank(item.content)),
    },
  };
}

function stepHasContent(st: KnowledgeCardExamStep) {
  return !isBlank(st.title) || !isBlank(st.detail);
}

function tipHasContent(tip: KnowledgeCardExamTip) {
  return !isBlank(tip.content);
}

function FieldReqTag({ required }: { required: boolean }) {
  return required ? (
    <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium bg-rose-50 text-rose-400 border border-rose-100 leading-none">
      必填
    </span>
  ) : (
    <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 leading-none">
      选填
    </span>
  );
}

const FIELD_LABEL_CLASS =
  'inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400';

const TITLE_INPUT_CLASS = {
  emerald:
    'w-full text-[15px] font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 border border-slate-200/80 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white',
  amber:
    'w-full text-[15px] font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 border border-slate-200/80 rounded-lg px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white',
};

const TITLE_VIEW_CLASS = 'text-[15px] font-semibold text-gray-900 leading-snug';
const BODY_VIEW_CLASS = 'text-sm text-gray-700 leading-relaxed whitespace-pre-wrap';
const BODY_WELL_CLASS = 'rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5';

type FieldBlurHandlers = { onBlur: () => void };
type ImeHandlers = {
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
};

/** 要点富文本输入外观：工具栏图标仅展示，功能暂不实现 */
function ToolbarIconBtn({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      className={`inline-flex items-center justify-center h-7 min-w-7 px-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-4 bg-gray-200 mx-0.5 flex-shrink-0" aria-hidden />;
}

function KeyPointRichInput({
  fieldId,
  value,
  onChange,
  imeHandlers,
  fieldBlurHandlers,
  tone = 'teal',
  toolbarAnchorId,
  placeholder = '请输入...',
  rows = 3,
  compact = false,
}: {
  fieldId: string;
  value: string;
  onChange: (next: string) => void;
  imeHandlers: ImeHandlers;
  fieldBlurHandlers: FieldBlurHandlers;
  tone?: 'teal' | 'amber' | 'emerald';
  toolbarAnchorId?: string;
  placeholder?: string;
  rows?: number;
  compact?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const focusRing =
    tone === 'amber'
      ? 'focus-within:ring-amber-400/30 focus-within:border-amber-400'
      : tone === 'emerald'
        ? 'focus-within:ring-emerald-500/30 focus-within:border-emerald-400'
        : 'focus-within:ring-teal-500/30 focus-within:border-teal-400';
  return (
    <div
      className={`rounded-md border border-gray-200 bg-white overflow-hidden focus-within:ring-2 ${focusRing}`}
      {...(toolbarAnchorId ? { 'data-req-anchor': toolbarAnchorId } : {})}
    >
      {focused && (
        <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-gray-100 bg-white">
        <ToolbarIconBtn title="撤销">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="重做">
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarDivider />
        <ToolbarIconBtn title="正文" className="gap-0.5 px-1.5 text-xs text-gray-600">
          正文
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="字号" className="gap-0.5 px-1.5 text-xs text-gray-600">
          字号
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="对齐" className="gap-0.5 px-1">
          <AlignLeft className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </ToolbarIconBtn>
        <ToolbarDivider />
        <ToolbarIconBtn title="加粗">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="斜体">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="下划线">
          <Underline className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="删除线">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarDivider />
        <ToolbarIconBtn title="链接">
          <Link2 className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="文字颜色" className="flex-col gap-0 px-1.5 py-0.5 h-auto min-h-7">
          <span className="text-[11px] font-semibold leading-none text-gray-700">A</span>
          <span className="mt-0.5 w-3.5 h-0.5 rounded-sm bg-red-500" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="背景色" className="flex-col gap-0 px-1 py-0.5 h-auto min-h-7">
          <PaintBucket className="w-3.5 h-3.5" />
          <span className="mt-0.5 w-3.5 h-0.5 rounded-sm bg-yellow-400" />
        </ToolbarIconBtn>
        <ToolbarDivider />
        <ToolbarIconBtn title="有序列表">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="无序列表">
          <List className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarDivider />
        <ToolbarIconBtn title="代码">
          <Code2 className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="公式">
          <FunctionSquare className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="清除格式">
          <Eraser className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="表格">
          <Table2 className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        <ToolbarIconBtn title="图片">
          <ImageIcon className="w-3.5 h-3.5" />
        </ToolbarIconBtn>
        </div>
      )}
      <textarea
        data-card-field={fieldId}
        value={value}
        {...imeHandlers}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          fieldBlurHandlers.onBlur();
        }}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full text-sm text-gray-700 placeholder:text-gray-400 px-3 bg-white border-0 focus:outline-none ${
          compact
            ? 'font-semibold py-1.5 resize-none min-h-[40px] leading-snug'
            : 'leading-relaxed py-2.5 resize-y min-h-[72px]'
        }`}
      />
    </div>
  );
}

function FieldBlock({
  label,
  required,
  extra,
  children,
  reqAnchor,
}: {
  label: string;
  required?: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
  reqAnchor?: string;
}) {
  return (
    <div className="space-y-1.5" {...(reqAnchor ? { 'data-req-anchor': reqAnchor } : {})}>
      <div className="flex items-center justify-between gap-2 min-h-[18px]">
        <span className={FIELD_LABEL_CLASS}>
          {label}
          {required !== undefined && <FieldReqTag required={required} />}
        </span>
        {extra}
      </div>
      {children}
    </div>
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
        className={`${className} req-anchor-inline`.trim()}
        data-req-anchor="knowledge-tree.knowledge-card.delete"
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
            <AlertDialogTitle>
              确认删除？
            </AlertDialogTitle>
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
  reqAnchor,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: keyof typeof ADD_BTN_TONES;
  compact?: boolean;
  reqAnchor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(reqAnchor ? { 'data-req-anchor': reqAnchor } : {})}
      className={`w-full ${compact ? 'h-8 text-xs' : 'h-9 text-sm'} font-medium rounded-lg border border-dashed inline-flex items-center justify-center gap-1.5 transition-colors ${ADD_BTN_TONES[tone]}`}
    >
      <Plus className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {children}
    </button>
  );
}

type CardSubTab = 'concept' | 'exam';

export type KnowledgeCardPrdCommand = {
  seq: number;
  subTab?: CardSubTab;
  dialog?: string;
};

interface KnowledgeCardPanelProps {
  value?: KnowledgeCard;
  isEditing: boolean;
  onChange: (card: KnowledgeCard) => void;
  /** 当前知识点 id，用于切换节点时重置，并在重挂载时恢复子 Tab */
  nodeId?: string;
  /** 知识点维度「关联考点」主数据；卡片侧名称/类型只读回显 */
  relatedExamPoints?: RelatedExamPoint[];
  /** 空态「去维护考点」：切到关联考点 Tab */
  onGoMaintainExams?: () => void;
  /** 平板预览用：知识点标题 */
  previewTitle?: string;
  /** 平板预览用：学业要求文案，如「掌握」 */
  previewAcademicRequirementLabel?: string;
  /** 平板预览用：考频文案，如「高频」 */
  previewExamFrequencyLabel?: string;
  /** Skill4：右侧 PRD 面板定位知识卡片内部子 Tab / 弹窗 */
  prdCommand?: KnowledgeCardPrdCommand | null;
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
  relatedExamPoints,
  onGoMaintainExams,
  previewTitle,
  previewAcademicRequirementLabel,
  previewExamFrequencyLabel,
  prdCommand,
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
  const [tabletPreviewOpen, setTabletPreviewOpen] = useState(false);
  const [draft, setDraft] = useState<KnowledgeCard>(() => normalizeKnowledgeCard(value));

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
    setDraft(normalizeKnowledgeCard(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when node switches
  }, [nodeId]);

  // Enter edit: sync draft from parent value once (false → true)
  useEffect(() => {
    const wasEditing = wasEditingRef.current;
    if (isEditing && !wasEditing) {
      const next = normalizeKnowledgeCard(value);
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

  const card = isEditing ? draft : normalizeKnowledgeCard(value);
  const displayExamPoints = mergeCardExamPoints(relatedExamPoints, card.examPoints);
  const keyPointCount = card.keyPoints.filter(keyPointHasContent).length;
  const moduleCount = card.customModules.filter(customModuleHasContent).length;
  const summary = `${keyPointCount} 要点 · ${moduleCount} 模块 · ${displayExamPoints.length} 考点`;

  useEffect(() => {
    if (!prdCommand) return;
    if (prdCommand.subTab) setSubTab(prdCommand.subTab);
    if (prdCommand.dialog === 'knowledge-card-tablet-preview') {
      setLekePickForExamId(null);
      setTabletPreviewOpen(true);
    }
    if (prdCommand.dialog === 'leke-question-picker') {
      setSubTab('exam');
      const firstId = relatedExamPoints?.[0]?.id ?? displayExamPoints[0]?.id ?? null;
      if (firstId) {
        setExpandedExamIds((prev) => {
          const next = new Set(prev);
          next.add(firstId);
          if (nodeId) expandedExamMemory.set(nodeId, next);
          return next;
        });
        setLekePickForExamId(firstId);
      }
    }
    window.dispatchEvent(new Event('req-markers-rescan'));
    // 只响应 PRD 面板下达的新指令
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prdCommand]);

  const upsertExamPoint = useCallback(
    (examId: string, patch: Partial<KnowledgeCardExamPoint>) => {
      const related = (relatedExamPoints || []).find((r) => r.id === examId);
      const current = draftRef.current;
      const existing = current.examPoints.find((e) => e.id === examId);
      const nextEp: KnowledgeCardExamPoint = {
        id: examId,
        title: related?.name ?? existing?.title ?? '',
        examType: related?.examType ?? existing?.examType,
        description: existing?.description,
        example: existing?.example,
        ...patch,
        // 名称/类型始终以关联考点为准
        ...(related
          ? { title: related.name, examType: related.examType }
          : {}),
      };
      const examPoints = existing
        ? current.examPoints.map((e) => (e.id === examId ? { ...e, ...nextEp } : e))
        : [...current.examPoints, nextEp];
      commit({ ...current, examPoints });
    },
    [commit, relatedExamPoints]
  );

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
    upsertExamPoint(examId, {
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
    });
    setLekePickForExamId(null);
    expandExam(examId);
  };

  const pickingExam = lekePickForExamId
    ? displayExamPoints.find((ep) => ep.id === lekePickForExamId) ||
      draftRef.current.examPoints.find((ep) => ep.id === lekePickForExamId)
    : undefined;
  const pickingHasContent = !!(pickingExam?.example && exampleHasContent(pickingExam.example));

  return (
    <div className="relative bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-5 [overflow-anchor:none]">
      <div className="absolute top-2.5 right-2.5 z-20">
        <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.tablet-preview">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="平板预览"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800 transition-colors"
                onClick={() => setTabletPreviewOpen(true)}
              >
                <TabletSmartphone className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" sideOffset={6}>
              平板预览
            </TooltipContent>
          </Tooltip>
        </span>
      </div>
      <div className="flex items-center justify-between mb-4 gap-3 pr-10">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
          <h4 className="font-semibold text-gray-900">知识卡片</h4>
          <span className="text-xs text-gray-500 bg-white/80 border border-emerald-100 rounded-full px-2 py-0.5 truncate req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.summary">
            {summary}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          <div className="flex items-center gap-1 p-1 bg-white/70 border border-emerald-100 rounded-lg req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.subtabs">
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
          examPoints={displayExamPoints}
          knowledgeTips={card.knowledgeTips}
          isEditing={isEditing}
          expandedExamIds={expandedExamIds}
          onToggleExam={toggleExam}
          onUpsertExam={upsertExamPoint}
          onChangeKnowledgeTips={(knowledgeTips) => commit({ ...draftRef.current, knowledgeTips })}
          fieldBlurHandlers={fieldBlurHandlers}
          onOpenLekePick={setLekePickForExamId}
          imeHandlers={imeHandlers}
          onGoMaintainExams={onGoMaintainExams}
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

      <KnowledgeCardTabletPreview
        open={tabletPreviewOpen}
        onClose={() => setTabletPreviewOpen(false)}
        title={previewTitle || '未命名知识点'}
        academicRequirementLabel={previewAcademicRequirementLabel}
        examFrequencyLabel={previewExamFrequencyLabel}
        card={card}
        relatedExamPoints={relatedExamPoints}
        examPoints={displayExamPoints}
      />
    </div>
  );
}, (prev, next) => {
  if (prev.prdCommand !== next.prdCommand) return false;
  if (prev.isEditing !== next.isEditing) return false;
  if (prev.previewTitle !== next.previewTitle) return false;
  if (prev.previewAcademicRequirementLabel !== next.previewAcademicRequirementLabel) return false;
  if (prev.previewExamFrequencyLabel !== next.previewExamFrequencyLabel) return false;
  if (prev.relatedExamPoints !== next.relatedExamPoints) return false;
  if (next.isEditing) return true;
  return prev.value === next.value;
});

export default KnowledgeCardPanel;

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
  const hasKeyPointContent = card.keyPoints.some(keyPointHasContent);
  const hasModuleContent = card.customModules.some(customModuleHasContent);
  const empty = !hasKeyPointContent && !hasModuleContent;

  const [newModuleOpen, setNewModuleOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  // 编辑态：默认至少保留一个空白要点输入位
  useEffect(() => {
    if (!isEditing) return;
    if (card.keyPoints.length > 0) return;
    onStructChange({
      ...card,
      keyPoints: [{ id: uid('kp'), content: '', images: [] }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在要点列表被清空时补一个空位
  }, [isEditing, card.keyPoints.length]);

  // 编辑态：每个自定义模块至少保留一个空白条目
  useEffect(() => {
    if (!isEditing) return;
    const needsPad = card.customModules.some((m) => m.items.length === 0);
    if (!needsPad) return;
    onStructChange({
      ...card,
      customModules: card.customModules.map((m) =>
        m.items.length > 0
          ? m
          : { ...m, items: [{ id: uid('mi'), content: '', images: [] }] }
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, card.customModules.map((m) => `${m.id}:${m.items.length}`).join('|')]);

  if (!isEditing && empty) {
    return (
      <div className="text-center py-10 text-gray-400" data-req-anchor="knowledge-tree.knowledge-card.concept-empty">
        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无内容</p>
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

  const removeKeyPoint = (id: string) => {
    const next = card.keyPoints.filter((item) => item.id !== id);
    onStructChange({
      ...card,
      keyPoints:
        next.length > 0 ? next : [{ id: uid('kp'), content: '', images: [] }],
    });
  };

  const confirmNewModule = () => {
    const name = newModuleName.trim();
    if (!name) return;
    const modId = uid('mod');
    const itemId = uid('mi');
    onRequestFocus(itemId);
    onStructChange({
      ...card,
      customModules: [
        ...card.customModules,
        {
          id: modId,
          name,
          items: [{ id: itemId, content: '', images: [] }],
        },
      ],
    });
    setNewModuleName('');
    setNewModuleOpen(false);
  };

  const updateModule = (modId: string, patch: Partial<KnowledgeCardCustomModule>) => {
    onLocalChange({
      ...card,
      customModules: card.customModules.map((m) =>
        m.id === modId ? { ...m, ...patch } : m
      ),
    });
  };

  const structUpdateModule = (modId: string, patch: Partial<KnowledgeCardCustomModule>) => {
    onStructChange({
      ...card,
      customModules: card.customModules.map((m) =>
        m.id === modId ? { ...m, ...patch } : m
      ),
    });
  };

  const showKeyPointIndex = card.keyPoints.length > 1;
  const displayKeyPoints = isEditing
    ? card.keyPoints.length > 0
      ? card.keyPoints
      : [{ id: 'kp-placeholder', content: '', images: [] as KnowledgeCardImage[] }]
    : card.keyPoints.filter(keyPointHasContent);

  const displayModules = isEditing
    ? card.customModules
    : card.customModules.filter((m) => m.items.some(moduleItemHasContent));

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-teal-200 overflow-hidden bg-white shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50 border-b border-teal-200">
          <span className="text-sm font-semibold text-teal-900">要点</span>
          <span
            className="text-xs text-teal-700/70 req-anchor-inline"
            data-req-anchor="knowledge-tree.knowledge-card.keypoints"
          >
            {displayKeyPoints.length}条
          </span>
        </div>

        <div className="p-3 space-y-2 bg-teal-50/30">
          {displayKeyPoints.length === 0 ? (
            <div className="text-xs text-gray-400 py-3 px-3 bg-white/80 rounded-lg border border-dashed border-teal-200">
              未配置要点（学生端不展示要点模块）
            </div>
          ) : (
            displayKeyPoints.map((kp, index) => (
              <div
                key={kp.id}
                className="bg-white rounded-lg border border-teal-100 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  {showKeyPointIndex && (
                    <span className="mt-1.5 w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <KeyPointRichInput
                        fieldId={kp.id}
                        value={kp.content}
                        toolbarAnchorId={index === 0 ? 'knowledge-tree.knowledge-card.richtext' : undefined}
                        imeHandlers={imeHandlers}
                        fieldBlurHandlers={fieldBlurHandlers}
                        onChange={(content) => {
                          const keyPoints = card.keyPoints.map((item) =>
                            item.id === kp.id ? { ...item, content } : item
                          );
                          onLocalChange({ ...card, keyPoints });
                        }}
                      />
                    ) : (
                      <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>
                        {kp.content || '（空）'}
                      </div>
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
                  </div>
                  {isEditing && (
                    <div className="flex flex-col gap-1">
                      {showKeyPointIndex && (
                        <>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-teal-100 text-gray-400 disabled:opacity-30"
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
                            className="p-1 rounded hover:bg-teal-100 text-gray-400 disabled:opacity-30"
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
                        </>
                      )}
                      {(showKeyPointIndex || keyPointHasContent(kp)) && (
                        <DeleteIconButton
                          hasContent={keyPointHasContent(kp)}
                          label="该要点"
                          onConfirm={() => removeKeyPoint(kp.id)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isEditing && (
            <AddActionButton tone="teal" onClick={addKeyPoint}>
              <span
                className="req-anchor-inline"
                data-req-anchor="knowledge-tree.knowledge-card.add-keypoint"
              >
                添加要点
              </span>
            </AddActionButton>
          )}
        </div>
      </section>

      {(displayModules.length > 0 || isEditing) && (
      <div className="space-y-5" data-req-anchor="knowledge-tree.knowledge-card.modules">
      {displayModules.map((mod) => {
        const showItemIndex = mod.items.length > 1;
        const displayItems = isEditing
          ? mod.items.length > 0
            ? mod.items
            : [{ id: `${mod.id}-placeholder`, content: '', images: [] as KnowledgeCardImage[] }]
          : mod.items.filter(moduleItemHasContent);

        return (
          <section
            key={mod.id}
            className="rounded-xl border border-amber-200 overflow-hidden bg-white shadow-sm"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border-b border-amber-200">
              {isEditing ? (
                <>
                  <input
                    value={mod.name}
                    {...imeHandlers}
                    {...fieldBlurHandlers}
                    onChange={(e) => updateModule(mod.id, { name: e.target.value })}
                    placeholder="模块名称"
                    className="flex-1 min-w-0 text-sm font-semibold text-amber-900 placeholder:font-normal placeholder:text-amber-400/80 border-0 bg-transparent px-1 py-0.5 focus:outline-none focus:ring-0"
                  />
                  <DeleteIconButton
                    hasContent={customModuleHasContent(mod)}
                    label={`模块「${mod.name || '未命名'}」`}
                    className="p-1.5 rounded hover:bg-red-50 text-red-400 flex-shrink-0"
                    onConfirm={() =>
                      onStructChange({
                        ...card,
                        customModules: card.customModules.filter((m) => m.id !== mod.id),
                      })
                    }
                  />
                </>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-amber-900 truncate">
                    {mod.name}
                  </span>
                  {displayItems.length > 0 && (
                    <span className="text-xs text-amber-700/70 flex-shrink-0">
                      {displayItems.length}条
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 space-y-2 bg-amber-50/30">
              {displayItems.length === 0 ? (
                <div className="text-xs text-gray-400 py-3 px-3 bg-white/80 rounded-lg border border-dashed border-amber-200">
                  暂无内容
                </div>
              ) : (
                displayItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-amber-100 p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      {showItemIndex && (
                        <span className="mt-1.5 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <KeyPointRichInput
                            fieldId={item.id}
                            value={item.content}
                            tone="amber"
                            imeHandlers={imeHandlers}
                            fieldBlurHandlers={fieldBlurHandlers}
                            onChange={(content) => {
                              updateModule(mod.id, {
                                items: mod.items.map((it) =>
                                  it.id === item.id ? { ...it, content } : it
                                ),
                              });
                            }}
                          />
                        ) : (
                          <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>
                            {item.content || '（空）'}
                          </div>
                        )}
                        {item.images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.images.map((img) => (
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
                                      structUpdateModule(mod.id, {
                                        items: mod.items.map((it) =>
                                          it.id === item.id
                                            ? {
                                                ...it,
                                                images: it.images.filter((i) => i.id !== img.id),
                                              }
                                            : it
                                        ),
                                      });
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex flex-col gap-1">
                          {showItemIndex && (
                            <>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-amber-100 text-gray-400 disabled:opacity-30"
                                disabled={index === 0}
                                onClick={() =>
                                  structUpdateModule(mod.id, {
                                    items: moveItem(mod.items, index, -1),
                                  })
                                }
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-amber-100 text-gray-400 disabled:opacity-30"
                                disabled={index === mod.items.length - 1}
                                onClick={() =>
                                  structUpdateModule(mod.id, {
                                    items: moveItem(mod.items, index, 1),
                                  })
                                }
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {(showItemIndex || moduleItemHasContent(item)) && (
                            <DeleteIconButton
                              hasContent={moduleItemHasContent(item)}
                              label="该条目"
                              onConfirm={() => {
                                const next = mod.items.filter((it) => it.id !== item.id);
                                structUpdateModule(mod.id, {
                                  items:
                                    next.length > 0
                                      ? next
                                      : [{ id: uid('mi'), content: '', images: [] }],
                                });
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isEditing && (
                <AddActionButton
                  tone="amber"
                  onClick={() => {
                    const id = uid('mi');
                    onRequestFocus(id);
                    structUpdateModule(mod.id, {
                      items: [...mod.items, { id, content: '', images: [] }],
                    });
                  }}
                >
                  <span
                    className="req-anchor-inline"
                    data-req-anchor="knowledge-tree.knowledge-card.add-module-item"
                  >
                    添加条目
                  </span>
                </AddActionButton>
              )}
            </div>
          </section>
        );
      })}

      {isEditing && (
        <AddActionButton
          tone="amber"
          onClick={() => {
            setNewModuleName('');
            setNewModuleOpen(true);
          }}
        >
          添加模块
        </AddActionButton>
      )}
      </div>
      )}

      <Dialog
        open={newModuleOpen}
        onOpenChange={(open) => {
          setNewModuleOpen(open);
          if (!open) setNewModuleName('');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建模块</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <label className="text-sm text-gray-600">模块名称</label>
            <input
              autoFocus
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmNewModule();
                }
              }}
              placeholder="如：公式定理、法则、实验结论"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewModuleOpen(false);
                setNewModuleName('');
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={!newModuleName.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={confirmNewModule}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function ExamTypeTag({ type }: { type?: KnowledgeCardExamType }) {
  const meta = examTypeMeta(type);
  if (!meta) return null;
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-md text-[11px] font-semibold border leading-none flex-shrink-0 ${meta.tagClass}`}
    >
      {meta.label}
    </span>
  );
}

function ExamPointPreview({
  ep,
  index,
  expanded,
  onToggle,
  isAnchorHost,
}: {
  ep: KnowledgeCardExamPoint;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  isAnchorHost?: boolean;
}) {
  const theme = EXAM_PREVIEW_THEMES[index % EXAM_PREVIEW_THEMES.length];
  const hasStem = !isBlank(ep.example?.stem);
  const steps = ep.example?.steps ?? [];
  const tips = ep.example?.tips ?? [];
  const hasBody = !!ep.description || hasStem;

  return (
    <div
      className={`rounded-2xl border ${theme.card} overflow-hidden bg-white`}
      {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.exam-list' } : {})}
    >
      <button
        type="button"
        className={`${theme.header} ${theme.headerBorder} w-full px-4 py-2.5 flex items-center gap-2 text-left`}
        onClick={onToggle}
      >
        <BookOpen className={`w-4 h-4 ${theme.icon} flex-shrink-0`} />
        <span className={`text-[15px] font-semibold ${theme.title} min-w-0 truncate`}>
          {ep.title || '未命名考点'}
        </span>
        <ExamTypeTag type={ep.examType} />
        {examPointHasExample(ep) ? (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-emerald-700 border border-emerald-200 flex-shrink-0">
            有例题
          </span>
        ) : (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-400 border border-gray-200 flex-shrink-0">
            无例题
          </span>
        )}
        <span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center">
          {hasBody ? (
            expanded ? (
              <ChevronUp className={`w-4 h-4 ${theme.icon}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${theme.icon}`} />
            )
          ) : null}
        </span>
      </button>

      {expanded && (
        <>
          {ep.description ? (
            <div
              className={`${theme.desc} ${theme.descBorder} px-4 py-3`}
              {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.exam-desc' } : {})}
            >
              <div className={`${FIELD_LABEL_CLASS} mb-1.5`}>考点说明</div>
              <div className={`${BODY_WELL_CLASS} bg-white/80 ${BODY_VIEW_CLASS}`}>{ep.description}</div>
            </div>
          ) : null}

          {hasStem && ep.example && (
            <div
              className="m-3 rounded-xl border border-teal-100 bg-white p-3 space-y-3"
              {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.example' } : {})}
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                典型例题
              </span>
              <div>
                <div className={`${FIELD_LABEL_CLASS} mb-1.5`}>题干</div>
                <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>{ep.example.stem}</div>
              </div>

              {steps.length > 0 && (
                <div
                  className="pt-2 border-t border-dashed border-gray-200"
                  {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.steps-tips' } : {})}
                >
                  <div className="flex items-center gap-1.5 text-orange-500 font-semibold text-sm mb-2">
                    <OrangeDiamond />
                    解题步骤
                  </div>
                  <ol className="space-y-3">
                    {steps.map((st, i) => (
                      <li
                        key={st.id}
                        className="border-l-[4px] border-amber-400 pl-3"
                      >
                        <div className={TITLE_VIEW_CLASS}>
                          <span className="mr-1 text-amber-600">{i + 1}.</span>
                          {st.title || ''}
                        </div>
                        {st.detail ? (
                          <div className={`mt-1.5 ${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>
                            {st.detail}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {tips.length > 0 && (
                <div
                  className="rounded-xl bg-amber-50 border border-amber-100/80 p-3"
                  {...(isAnchorHost && steps.length === 0
                    ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.steps-tips' }
                    : {})}
                >
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
                        <div className={`flex-1 ${BODY_WELL_CLASS} bg-white/80 ${BODY_VIEW_CLASS}`}>
                          {tip.content}
                        </div>
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

const KNOWLEDGE_TIPS_EMPTY_HINT = '不填写，则学生端【知识点Tips】模块显示暂无';

function KnowledgeTipsBlock({
  items,
  isEditing,
  onChange,
  imeHandlers,
  fieldBlurHandlers,
}: {
  items: KnowledgeCardExamTip[];
  isEditing: boolean;
  onChange: (next: KnowledgeCardExamTip[]) => void;
  imeHandlers: ImeHandlers;
  fieldBlurHandlers: FieldBlurHandlers;
}) {
  const list = items.length > 0 ? items : [{ id: 'ktip-placeholder', content: '' }];
  const showIndex = list.length > 1;
  const filled = list.filter((item) => !isBlank(item.content));

  useEffect(() => {
    if (!isEditing) return;
    if (items.length > 0) return;
    onChange([emptyKnowledgeTip()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在列表被清空时补一个空位
  }, [isEditing, items.length]);

  const addTip = () => {
    onChange([...list, emptyKnowledgeTip()]);
  };

  const removeTip = (id: string) => {
    if (list.length < 2) return;
    onChange(list.filter((item) => item.id !== id));
  };

  return (
    <section
      className="rounded-xl border border-amber-200 overflow-hidden bg-white shadow-sm"
      data-req-anchor="knowledge-tree.knowledge-card.knowledge-tips"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border-b border-amber-200">
        <OrangeDiamond />
        <span className="text-sm font-semibold text-amber-900">知识点Tips</span>
        <span className="text-xs text-amber-700/70">
          {isEditing ? list.length : filled.length}条
        </span>
      </div>

      <div className="p-3 space-y-2 bg-amber-50/30">
      {isEditing ? (
        <>
          {list.map((tip, index) => (
            <div key={tip.id} className="flex items-start gap-2 bg-white rounded-lg border border-amber-100 p-3">
              {showIndex && (
                <span className="mt-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <KeyPointRichInput
                  fieldId={tip.id}
                  value={tip.content}
                  placeholder={
                    filled.length === 0 && index === 0
                      ? KNOWLEDGE_TIPS_EMPTY_HINT
                      : '请输入知识点Tips'
                  }
                  tone="amber"
                  imeHandlers={imeHandlers}
                  fieldBlurHandlers={fieldBlurHandlers}
                  onChange={(content) => {
                    onChange(list.map((item) => (item.id === tip.id ? { ...item, content } : item)));
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                {showIndex && (
                  <>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-amber-100 text-gray-400 disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => onChange(moveItem(list, index, -1))}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-amber-100 text-gray-400 disabled:opacity-30"
                      disabled={index === list.length - 1}
                      onClick={() => onChange(moveItem(list, index, 1))}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <DeleteIconButton
                      hasContent={!isBlank(tip.content)}
                      label="该知识点Tips"
                      onConfirm={() => removeTip(tip.id)}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
          <AddActionButton tone="orange" onClick={addTip}>
            <span
              className="req-anchor-inline"
              data-req-anchor="knowledge-tree.knowledge-card.add-knowledge-tip"
            >
              添加Tips
            </span>
          </AddActionButton>
        </>
      ) : filled.length > 0 ? (
        <div className="space-y-2">
          {filled.map((tip, index) => (
            <div key={tip.id} className="flex items-start gap-2 bg-white rounded-lg border border-amber-100 p-3">
              {filled.length > 1 && (
                <span className="mt-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
              )}
              <div className={`flex-1 ${BODY_WELL_CLASS} bg-white ${BODY_VIEW_CLASS}`}>
                {tip.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-amber-200 bg-white/80 px-3 py-3 text-sm text-gray-400 leading-relaxed">
          {KNOWLEDGE_TIPS_EMPTY_HINT}
        </div>
      )}
      </div>
    </section>
  );
}

function ExamPanel({
  examPoints,
  knowledgeTips,
  isEditing,
  expandedExamIds,
  onToggleExam,
  onUpsertExam,
  onChangeKnowledgeTips,
  fieldBlurHandlers,
  onOpenLekePick,
  imeHandlers,
  onGoMaintainExams,
}: {
  examPoints: KnowledgeCardExamPoint[];
  knowledgeTips: KnowledgeCardExamTip[];
  isEditing: boolean;
  expandedExamIds: Set<string>;
  onToggleExam: (id: string) => void;
  onUpsertExam: (examId: string, patch: Partial<KnowledgeCardExamPoint>) => void;
  onChangeKnowledgeTips: (next: KnowledgeCardExamTip[]) => void;
  fieldBlurHandlers: FieldBlurHandlers;
  onOpenLekePick: (examId: string) => void;
  imeHandlers: ImeHandlers;
  onGoMaintainExams?: () => void;
}) {
  const tipsBlock = (
    <KnowledgeTipsBlock
      items={knowledgeTips}
      isEditing={isEditing}
      onChange={onChangeKnowledgeTips}
      imeHandlers={imeHandlers}
      fieldBlurHandlers={fieldBlurHandlers}
    />
  );

  const examColors = [
    'border-emerald-200 bg-emerald-50/50',
    'border-sky-200 bg-sky-50/50',
    'border-amber-200 bg-amber-50/50',
    'border-violet-200 bg-violet-50/50',
  ];

  const examListBody =
    examPoints.length === 0 ? (
      <div
        className="rounded-lg border border-dashed border-emerald-200 bg-white/80 px-3 py-4 text-center"
        data-req-anchor="knowledge-tree.knowledge-card.exam-empty"
      >
        <p className="text-sm text-gray-600">暂无考点</p>
        <p className="text-xs mt-1 text-gray-400">请先在「关联考点」Tab 维护考点名称与类型</p>
        {onGoMaintainExams && (
          <button
            type="button"
            onClick={onGoMaintainExams}
            className="mt-3 inline-flex items-center justify-center h-8 px-3 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 text-sm font-medium transition-colors"
          >
            去维护考点
          </button>
        )}
      </div>
    ) : !isEditing ? (
      <div className="space-y-3" data-req-anchor="knowledge-tree.knowledge-card.exam-list">
        {examPoints.map((ep, index) => (
          <ExamPointPreview
            key={ep.id}
            ep={ep}
            index={index}
            expanded={expandedExamIds.has(ep.id)}
            onToggle={() => onToggleExam(ep.id)}
            isAnchorHost={index === 0}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-3" data-req-anchor="knowledge-tree.knowledge-card.exam-list">
        {examPoints.map((ep, index) => {
          const expanded = expandedExamIds.has(ep.id);
          const color = examColors[index % examColors.length];
          const typeMeta = examTypeMeta(ep.examType);
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
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {ep.title || '未命名考点'}
                  </span>
                  {typeMeta && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${typeMeta.tagClass}`}
                    >
                      {typeMeta.label}
                    </span>
                  )}
                  {examPointHasExample(ep) ? (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      有例题
                    </span>
                  ) : (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-400 border border-gray-200 flex-shrink-0">
                      无例题
                    </span>
                  )}
                </button>
              </div>

              {expanded && (
                <div className="px-3 pt-3 pb-3 space-y-4 border-t border-white/60 bg-white">
                  <FieldBlock
                    label="考点说明"
                    reqAnchor={index === 0 ? 'knowledge-tree.knowledge-card.exam-desc' : undefined}
                  >
                    <KeyPointRichInput
                      fieldId={`${ep.id}-desc`}
                      value={ep.description || ''}
                      placeholder="不填写，则学生端考点说明处则显示【暂无】"
                      tone="emerald"
                      imeHandlers={imeHandlers}
                      fieldBlurHandlers={fieldBlurHandlers}
                      onChange={(description) => onUpsertExam(ep.id, { description })}
                    />
                  </FieldBlock>

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
                    isAnchorHost={index === 0}
                    onLocalChange={(example) => onUpsertExam(ep.id, { example })}
                    onStructChange={(example) => onUpsertExam(ep.id, { example })}
                    onClear={
                      ep.example
                        ? () => onUpsertExam(ep.id, { example: undefined })
                        : undefined
                    }
                    fieldBlurHandlers={fieldBlurHandlers}
                    onPullLeke={() => onOpenLekePick(ep.id)}
                    onRequestFocus={() => {}}
                    imeHandlers={imeHandlers}
                    stemFieldId={`${ep.id}-stem`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-emerald-200 overflow-hidden bg-white shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border-b border-emerald-200">
          <span className="text-sm font-semibold text-emerald-900">考点清单</span>
          <span className="text-xs text-emerald-700/70">{examPoints.length}个</span>
        </div>
        <div className="p-3 bg-emerald-50/30">{examListBody}</div>
      </section>
      {tipsBlock}
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
  isAnchorHost,
  stemFieldId,
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
  isAnchorHost?: boolean;
  stemFieldId?: string;
}) {
  const hasStem = !isBlank(example.stem);
  const showStepsAndTips = hasStem;

  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-4"
      {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.example' } : {})}
    >
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
        典型例题
      </span>
      <FieldBlock
        label="题干"
        extra={
          <div className="flex items-center gap-1">
            {isEditing && onClear && hasStem && (
              <DeleteIconButton
                hasContent={exampleHasContent(example)}
                label="该例题"
                onConfirm={onClear}
              />
            )}
            {isEditing && (
              <span
                className="req-anchor-inline"
                data-req-anchor="knowledge-tree.knowledge-card.system-select"
              >
                <button
                  type="button"
                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  onClick={onPullLeke}
                >
                  <Link2 className="w-3 h-3" />
                  系统选择
                </button>
              </span>
            )}
          </div>
        }
      >
        {isEditing ? (
          <KeyPointRichInput
            fieldId={stemFieldId || 'example-stem'}
            value={example.stem}
            placeholder="不填写，则学生端典型例题处则显示【暂无】"
            tone="emerald"
            imeHandlers={imeHandlers}
            fieldBlurHandlers={fieldBlurHandlers}
            onChange={(stem) => onLocalChange({ ...example, stem })}
          />
        ) : (
          <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>{example.stem}</div>
        )}
      </FieldBlock>

      {showStepsAndTips && (isEditing || example.steps.length > 0) && (
        <div
          className="space-y-2"
          {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.steps-tips' } : {})}
        >
          <span className={FIELD_LABEL_CLASS}>
            解题步骤
          </span>
          {example.steps.map((st, index) => (
            <div key={st.id} className="flex gap-2 items-start">
              <span className="mt-2 w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 space-y-1.5">
                {isEditing ? (
                  <>
                    <KeyPointRichInput
                      fieldId={st.id}
                      value={st.title || ''}
                      placeholder="步骤标题"
                      tone="emerald"
                      rows={1}
                      compact
                      imeHandlers={imeHandlers}
                      fieldBlurHandlers={fieldBlurHandlers}
                      onChange={(title) => {
                        const steps = example.steps.map((item) =>
                          item.id === st.id ? { ...item, title } : item
                        );
                        onLocalChange({ ...example, steps });
                      }}
                    />
                    <KeyPointRichInput
                      fieldId={`${st.id}-detail`}
                      value={st.detail}
                      placeholder="步骤正文"
                      tone="emerald"
                      rows={2}
                      imeHandlers={imeHandlers}
                      fieldBlurHandlers={fieldBlurHandlers}
                      onChange={(detail) => {
                        const steps = example.steps.map((item) =>
                          item.id === st.id ? { ...item, detail } : item
                        );
                        onLocalChange({ ...example, steps });
                      }}
                    />
                  </>
                ) : (
                  <div className="space-y-1.5">
                    {st.title && <div className={TITLE_VIEW_CLASS}>{st.title}</div>}
                    {st.detail ? (
                      <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>{st.detail}</div>
                    ) : null}
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
              {isAnchorHost ? (
                <span
                  className="req-anchor-inline"
                  data-req-anchor="knowledge-tree.knowledge-card.add-step"
                >
                  添加步骤
                </span>
              ) : (
                '添加步骤'
              )}
            </AddActionButton>
          )}
        </div>
      )}

      {showStepsAndTips && (isEditing || example.tips.length > 0) && (
        <div className="space-y-2">
          <span className={FIELD_LABEL_CLASS}>
            解题要点
          </span>
          {example.tips.map((tip, index) => (
            <div key={tip.id} className="flex items-start gap-2">
              <span className="mt-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              {isEditing ? (
                <div className="flex-1 min-w-0">
                  <KeyPointRichInput
                    fieldId={tip.id}
                    value={tip.content}
                    placeholder="解题要点正文"
                    tone="emerald"
                    rows={2}
                    imeHandlers={imeHandlers}
                    fieldBlurHandlers={fieldBlurHandlers}
                    onChange={(content) => {
                      const tips = example.tips.map((item) =>
                        item.id === tip.id ? { ...item, content } : item
                      );
                      onLocalChange({ ...example, tips });
                    }}
                  />
                </div>
              ) : (
                <div className={`flex-1 ${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>{tip.content}</div>
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
              {isAnchorHost ? (
                <span
                  className="req-anchor-inline"
                  data-req-anchor="knowledge-tree.knowledge-card.add-exam-tip"
                >
                  添加要点
                </span>
              ) : (
                '添加要点'
              )}
            </AddActionButton>
          )}
        </div>
      )}
    </div>
  );
}
