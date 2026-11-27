'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Image as ImageIcon,
  BookOpen,
  Eye,
  GripVertical,
  X,
  Link2,
  Pencil,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LekeQuestionPicker, { type BankQuestion } from '@/components/shared/LekeQuestionPicker';
import KnowledgeCardTabletPreview from '@/components/shared/KnowledgeCardTabletPreview';
import { materialChildTypeText } from '@/components/shared/materialChildTypeScheme';
import { ExampleEditSchemeSwitch, useExampleEditScheme } from '@/components/shared/exampleEditScheme';
import QuestionBankEditorDialog, {
  createEmptyBankEditorDraft,
  type BankEditorDraft,
  type BankEditorKind,
} from '@/components/shared/QuestionBankEditorDialog';
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

export interface KnowledgeCardExamTip {
  id: string;
  content: string;
}

export type ExampleQuestionKind = 'single' | 'multiple' | 'judge' | 'blank' | 'qa' | 'material';

export const EXAMPLE_QUESTION_KINDS: Array<{ id: ExampleQuestionKind; label: string }> = [
  { id: 'single', label: '单选题' },
  { id: 'multiple', label: '多选题' },
  { id: 'judge', label: '判断题' },
  { id: 'blank', label: '填空题' },
  { id: 'qa', label: '问答题' },
  { id: 'material', label: '材料题' },
];

export interface ExampleOption {
  /** 系统按顺序分配，A、B、C、D，不由用户填写。 */
  key: string;
  text: string;
}

export interface ExampleSubQuestion {
  id: string;
  kind: Exclude<ExampleQuestionKind, 'material'>;
  stem: string;
  /** 单选、多选的选项。至少两项，字母由系统分配。 */
  options: ExampleOption[];
  answer: string;
  /** 填空题按题干里的空线拆开的答案，和第几条空一一对应。 */
  blankAnswers?: string[];
  analysis: string;
}

export interface KnowledgeCardExample {
  questionId: string;
  /** 系统选题时记下的原题 ID。改内容后 questionId 换成新题，原题不覆盖。 */
  bankQuestionId?: string;
  source: 'manual' | 'leke' | 'third_party';
  /** 未选题型时为空。手动录入先选题型，系统选题后才带上题型。 */
  kind: ExampleQuestionKind | null;
  stem: string;
  /** 单选、多选的选项。至少两项，字母由系统分配。 */
  options: ExampleOption[];
  answer: string;
  /** 填空题按题干里的空线拆开的答案，和第几条空一一对应。 */
  blankAnswers?: string[];
  analysis: string;
  children: ExampleSubQuestion[];
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

export function exampleKindLabel(kind?: ExampleQuestionKind | null) {
  if (!kind) return '';
  return EXAMPLE_QUESTION_KINDS.find((item) => item.id === kind)?.label || '';
}

function questionBodyHasText(stem?: string, options?: ExampleOption[]) {
  if (stem && stem.trim()) return true;
  return !!options?.some((item) => item.text.trim());
}

function exampleBodyHasText(ex: KnowledgeCardExample) {
  if (questionBodyHasText(ex.stem, ex.options)) return true;
  return (
    ex.kind === 'material' &&
    ex.children.some((child) => questionBodyHasText(child.stem, child.options))
  );
}

export function examPointHasExample(ep?: KnowledgeCardExamPoint) {
  return !!ep?.example && exampleBodyHasText(ep.example);
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
          questionId: 'sample-q-ep1',
          source: 'manual',
          kind: 'qa',
          stem: '判断函数 y = x^(2/3) 的定义域与单调性。',
          options: [],
          answer: '定义域为 R；在 (0, +∞) 上单调递增。',
          analysis: 'y = x^(2/3) = (∛x)^2，立方根对一切实数有意义，定义域为 R。α = 2/3 > 0，故在 (0, +∞) 上单调递增。',
          children: [],
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

function choiceOptions(texts: string[]): ExampleOption[] {
  return texts.map((text, index) => ({ key: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index], text }));
}

function seededExample(
  questionId: string,
  kind: ExampleQuestionKind,
  stem: string,
  answer: string,
  analysis: string,
  options: ExampleOption[] = [],
  children: ExampleSubQuestion[] = [],
  blankAnswers?: string[],
): KnowledgeCardExample {
  return {
    questionId,
    source: 'manual',
    kind,
    stem,
    options,
    answer: blankAnswers ? formatBlankAnswers(blankAnswers) : answer,
    blankAnswers,
    analysis,
    children,
  };
}

/** 仅「反比例函数」这一知识点的考点典型例题。材料题的第一道子题固定为多选题。 */
export function inverseProportionKnowledgeCard(): KnowledgeCard {
  const materialChildren: ExampleSubQuestion[] = [
    {
      id: 'q-inverse-6-1',
      kind: 'multiple',
      stem: '下列各点中，在该函数图象上的有（ ）。',
      options: choiceOptions(['(1, 6)', '(3, 2)', '(-2, -3)', '(6, 2)']),
      answer: 'A、B、C',
      analysis: 'k = 6。6/1 = 6，6/3 = 2，6/(-2) = -3，三点都在图象上。6/6 = 1 ≠ 2，点 (6, 2) 不在图象上。',
    },
    {
      id: 'q-inverse-6-2',
      kind: 'judge',
      stem: '该函数图象位于第一、三象限。（ ）',
      options: [],
      answer: '正确',
      analysis: 'k = 6 > 0，反比例函数图象在第一、三象限。',
    },
    {
      id: 'q-inverse-6-3',
      kind: 'blank',
      stem: `当 x = 1 时，y = ${blankMark(0)}；当 x = -2 时，y = ${blankMark(1)}。`,
      options: [],
      answer: formatBlankAnswers(['6', '-3']),
      blankAnswers: ['6', '-3'],
      analysis: 'k = 6。当 x = 1 时，y = 6/1 = 6；当 x = -2 时，y = 6/(-2) = -3。',
    },
    {
      id: 'q-inverse-6-4',
      kind: 'qa',
      stem: '若点 (a, 4) 在该函数图象上，求 a 的值。',
      options: [],
      answer: 'a = 3/2',
      analysis: '4 = 6/a，且 a ≠ 0，所以 a = 6/4 = 3/2。',
    },
  ];

  return {
    keyPoints: [{ id: 'kp-inverse-empty', content: '', images: [] }],
    customModules: [],
    knowledgeTips: [{ id: 'ktip-inverse-empty', content: '' }],
    examPoints: [
      {
        id: 'ep-inverse-1',
        title: '反比例函数描述数量关系',
        examType: 'basic',
        description: '两个变量的乘积是不为 0 的常数时，它们的数量关系可以写成反比例函数 y = k/x（k ≠ 0）。',
        example: seededExample(
          'q-inverse-1',
          'multiple',
          '下列关系中，成反比例函数关系的有（ ）。',
          'B、C',
          '总价一定时，单价与数量的乘积为常数；面积为 12 的矩形，长与宽的乘积为常数。两者都可写成 y = k/x（k ≠ 0），成反比例。正方形边长与面积、圆的半径与周长不是这种关系。',
          choiceOptions([
            '正方形的边长与面积',
            '总价一定时，单价与数量',
            '面积为 12 的矩形，长与宽',
            '圆的半径与周长',
          ]),
        ),
      },
      {
        id: 'ep-inverse-2',
        title: '反比例函数的判断',
        examType: 'basic',
        description: '能整理成 y = k/x（k 是不为 0 的常数）的函数，才是反比例函数。',
        example: seededExample(
          'q-inverse-2',
          'material',
          '已知函数 y = 2x，y = 2/x，y = 6/x，y = 2/x + 1。',
          '',
          '',
          [],
          [
            {
              id: 'q-inverse-2-1',
              kind: 'multiple',
              stem: '下列函数中，是反比例函数的有（ ）。',
              options: choiceOptions(['y = 2x', 'y = 2/x', 'y = 6/x', 'y = 2/x + 1']),
              answer: 'B、C',
              analysis: '反比例函数的形式是 y = k/x（k ≠ 0）。y = 2/x 中 k = 2，y = 6/x 中 k = 6，都是反比例函数。y = 2x 是正比例，y = 2/x + 1 多了常数项，都不是。',
            },
            {
              id: 'q-inverse-2-2',
              kind: 'judge',
              stem: '能整理成 y = k/x（k ≠ 0）的函数，才是反比例函数。（ ）',
              options: [],
              answer: '正确',
              analysis: '反比例函数要求可以整理成 y = k/x，并且 k 是不为 0 的常数。',
            },
          ],
        ),
      },
      {
        id: 'ep-inverse-3',
        title: '根据反比例函数定义求参数',
        examType: 'basic',
        description: '把式子整理成 y = k/x 后，由 k ≠ 0 确定字母参数的取值范围。',
        example: seededExample(
          'q-inverse-3',
          'judge',
          '若 y = (m - 2)/x 是反比例函数，则 m ≠ 2。（ ）',
          '正确',
          '反比例函数 y = k/x 要求 k ≠ 0。这里 k = m - 2，所以 m - 2 ≠ 0，即 m ≠ 2。',
        ),
      },
      {
        id: 'ep-inverse-4',
        title: '反比例函数值的计算',
        examType: 'advanced',
        description: '已知反比例函数解析式和自变量 x（x ≠ 0）时，代入 y = k/x 计算函数值。',
        example: seededExample(
          'q-inverse-4',
          'blank',
          `已知反比例函数 y = 6/x。当 x = 2 时，y = ${blankMark(0)}；当 x = -3 时，y = ${blankMark(1)}。`,
          '',
          '把 x = 2 代入 y = 6/x，得 y = 3。把 x = -3 代入，得 y = -2。',
          [],
          [],
          ['3', '-2'],
        ),
      },
      {
        id: 'ep-inverse-5',
        title: '已知反比例函数值求自变量',
        examType: 'advanced',
        description: '已知反比例函数的函数值 y（y ≠ 0）时，由 y = k/x 求出对应的自变量 x。',
        example: seededExample(
          'q-inverse-5',
          'qa',
          '已知反比例函数 y = 12/x。当函数值为 -3 时，求自变量 x 的值。',
          'x = -4',
          '由 -3 = 12/x，得 x = 12/(-3) = -4。',
        ),
      },
      {
        id: 'ep-inverse-6',
        title: '待定系数法求反比例函数解析式',
        examType: 'advanced',
        description: '设反比例函数为 y = k/x，把图象上一个点的坐标代入，求出 k，得到解析式。',
        example: seededExample(
          'q-inverse-6',
          'material',
          '反比例函数 y = k/x（k ≠ 0）的图象经过点 (2, 3)。',
          '',
          '',
          [],
          materialChildren,
        ),
      },
      {
        id: 'ep-inverse-7',
        title: '反比例函数图象的判断与作图',
        examType: 'sprint',
        description: 'k > 0 时图象在第一、三象限，k < 0 时在第二、四象限。图象是双曲线，与坐标轴没有交点。',
      },
      {
        id: 'ep-inverse-8',
        title: '已知反比例函数图象判断解析式',
        examType: 'sprint',
        description: '先看图象所在象限判断 k 的正负，再用图象上一点的坐标求出 k，从而确定解析式。',
      },
      {
        id: 'ep-inverse-9',
        title: '根据反比例函数图象对称性求点坐标',
        examType: 'sprint',
        description: '反比例函数的图象关于原点中心对称。一个点在图象上时，它关于原点的对称点也在图象上。',
        example: seededExample(
          'q-inverse-9',
          'judge',
          '点 (2, 3) 在反比例函数 y = k/x 的图象上，则点 (-2, -3) 也在该图象上。（ ）',
          '正确',
          '反比例函数的图象关于原点成中心对称。(2, 3) 在图象上时 k = 6，点 (-2, -3) 满足 6/(-2) = -3，也在图象上。',
        ),
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

function optionHasText(options?: ExampleOption[]) {
  return !!options?.some((item) => !isBlank(item.text));
}

const CIRCLED_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
const BLANK_PATTERN = /____([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\d+)____/g;

function circledNumber(index: number) {
  const n = index + 1;
  return n <= CIRCLED_NUMBERS.length ? CIRCLED_NUMBERS[n - 1] : String(n);
}

function blankMark(index: number) {
  return `____${circledNumber(index)}____`;
}

function countBlanks(text: string) {
  return text.match(BLANK_PATTERN)?.length ?? 0;
}

function renumberBlanks(text: string) {
  let index = 0;
  return text.replace(BLANK_PATTERN, () => blankMark(index++));
}

function insertBlankAt(text: string, cursor: number) {
  const mark = blankMark(0);
  const inserted = text.slice(0, cursor) + mark + text.slice(cursor);
  return { text: renumberBlanks(inserted), cursor: cursor + mark.length };
}

function blankAnswersHaveText(answers?: string[]) {
  return !!answers?.some((item) => !isBlank(item));
}

function alignBlankAnswers(answer: string, stored: string[] | undefined, count: number) {
  const source = stored && stored.length > 0 ? stored : [];
  return Array.from({ length: count }, (_, index) => {
    if (source.length > 0) return source[index] ?? '';
    return index === 0 ? answer : '';
  });
}

function formatBlankAnswers(answers: string[]) {
  return answers.map((item, index) => `${index + 1} ${item}`.trimEnd()).join('\n');
}

function BlankLine({ label }: { label: string }) {
  return (
    <span className="inline-flex flex-col items-stretch align-baseline leading-none">
      <span>
        <span className="text-transparent">____</span>
        {label}
        <span className="text-transparent">____</span>
      </span>
      <span aria-hidden className="mt-1 h-px w-full bg-gray-800" />
    </span>
  );
}

function PlainBlankLine() {
  return <span className="inline-block min-w-[4em] translate-y-px border-b border-gray-800 align-baseline" />;
}

function BlankText({ text, plain = false }: { text: string; plain?: boolean }) {
  const pattern = new RegExp(BLANK_PATTERN.source, 'g');
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(plain ? <PlainBlankLine key={key++} /> : <BlankLine key={key++} label={match[1]} />);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

const BLANK_SENTINEL = '\u0001';

function normalizeBlanks(text: string) {
  return text.replace(new RegExp(BLANK_PATTERN.source, 'g'), BLANK_SENTINEL);
}

function diffChars(a: string, b: string) {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: Array<{ type: 'equal' | 'insert' | 'delete'; text: string }> = [];
  const push = (type: 'equal' | 'insert' | 'delete', ch: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += ch;
    else ops.push({ type, text: ch });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('equal', a[i]);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('delete', a[i]);
      i += 1;
    } else {
      push('insert', b[j]);
      j += 1;
    }
  }
  while (i < n) {
    push('delete', a[i]);
    i += 1;
  }
  while (j < m) {
    push('insert', b[j]);
    j += 1;
  }
  return ops;
}

/** 题干里的空增删后，已填写的答案跟着原来的空一起移动。 */
function remapBlankAnswers(oldStem: string, newStem: string, answers: string[]) {
  let oldIndex = 0;
  const next: string[] = [];
  diffChars(normalizeBlanks(oldStem), normalizeBlanks(newStem)).forEach((op) => {
    for (const ch of op.text) {
      if (ch !== BLANK_SENTINEL) continue;
      if (op.type === 'equal') {
        next.push(answers[oldIndex] ?? '');
        oldIndex += 1;
      } else if (op.type === 'insert') {
        next.push('');
      } else {
        oldIndex += 1;
      }
    }
  });
  return next;
}

function withBlankFields<T extends { stem: string; answer: string; blankAnswers?: string[] }>(source: T, stem: string) {
  const nextStem = renumberBlanks(stem);
  const count = countBlanks(nextStem);
  if (count === 0) {
    const kept = source.blankAnswers?.find((item) => !isBlank(item)) || source.answer;
    return { stem: nextStem, answer: kept, blankAnswers: undefined as string[] | undefined };
  }
  const previousCount = countBlanks(source.stem);
  const blankAnswers =
    previousCount > 0
      ? remapBlankAnswers(
          source.stem,
          nextStem,
          source.blankAnswers ?? alignBlankAnswers(source.answer, undefined, previousCount),
        )
      : alignBlankAnswers(source.answer, source.blankAnswers, count);
  return { stem: nextStem, blankAnswers, answer: formatBlankAnswers(blankAnswers) };
}

function subQuestionHasContent(sub: ExampleSubQuestion) {
  return (
    !isBlank(sub.stem) ||
    !isBlank(sub.answer) ||
    !isBlank(sub.analysis) ||
    optionHasText(sub.options) ||
    blankAnswersHaveText(sub.blankAnswers)
  );
}

function exampleHasWritableContent(ex: KnowledgeCardExample) {
  return (
    !isBlank(ex.stem) ||
    !isBlank(ex.answer) ||
    !isBlank(ex.analysis) ||
    optionHasText(ex.options) ||
    blankAnswersHaveText(ex.blankAnswers) ||
    ex.children.some(subQuestionHasContent)
  );
}

function exampleHasContent(ex: KnowledgeCardExample) {
  return exampleHasWritableContent(ex) || !!ex.questionId || !!ex.bankQuestionId;
}

function emptyExample(): KnowledgeCardExample {
  return {
    questionId: '',
    source: 'manual',
    kind: null,
    stem: '',
    options: [],
    answer: '',
    analysis: '',
    children: [],
  };
}

const OPTION_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MIN_CHOICE_OPTIONS = 2;
const DEFAULT_CHOICE_OPTIONS = 4;

function isOptionKind(kind?: ExampleQuestionKind | null) {
  return kind === 'single' || kind === 'multiple';
}

function emptyChoiceOptions(count = MIN_CHOICE_OPTIONS): ExampleOption[] {
  return OPTION_KEYS.slice(0, count).map((key) => ({ key, text: '' }));
}

function normalizeOptions(options?: ExampleOption[]): ExampleOption[] {
  const source = options && options.length > 0 ? options : [];
  const padded = source.slice(0, OPTION_KEYS.length);
  while (padded.length < MIN_CHOICE_OPTIONS) {
    padded.push({ key: '', text: '' });
  }
  return padded.map((item, index) => ({
    key: OPTION_KEYS[index],
    text: item.text ?? '',
  }));
}

/** 把题干末尾的「A. …」行拆成独立选项。拆不出至少两项时保持原题干。 */
function splitStemOptions(stem: string): { stem: string; options: ExampleOption[] } | null {
  const stemLines: string[] = [];
  const found: ExampleOption[] = [];
  stem.replace(/\r\n/g, '\n').split('\n').forEach((line) => {
    const match = line.match(/^\s*([A-Z])\s*[.、．]\s*(.*)$/);
    if (match) found.push({ key: match[1], text: match[2].trim() });
    else stemLines.push(line);
  });
  if (found.length < MIN_CHOICE_OPTIONS) return null;
  return { stem: stemLines.join('\n').trim(), options: normalizeOptions(found) };
}

function ensureChoiceFields(stem: string, options?: ExampleOption[]) {
  if (options && options.length >= MIN_CHOICE_OPTIONS) {
    return { stem, options: normalizeOptions(options) };
  }
  return splitStemOptions(stem) ?? { stem, options: emptyChoiceOptions() };
}

function mapBankKind(questionType: string): ExampleQuestionKind {
  if (questionType.includes('材料')) return 'material';
  if (questionType.includes('多选')) return 'multiple';
  if (questionType.includes('单选') || questionType.includes('选择')) return 'single';
  if (questionType.includes('判断')) return 'judge';
  if (questionType.includes('填空')) return 'blank';
  return 'qa';
}

function mapOrdinaryKind(questionType: string): ExampleSubQuestion['kind'] {
  const kind = mapBankKind(questionType);
  return kind === 'material' ? 'qa' : kind;
}

function splitImportedBlankAnswers(answer: string, count: number) {
  if (count <= 1) return [answer.trim()];
  const lines = answer
    .split(/\r?\n|[;；]/)
    .map((part) => part.replace(/^\s*(?:[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\d+)\s*[.、．]?\s*/, '').trim())
    .filter((part) => part.length > 0);
  const pieces = lines.length > 1 ? lines : answer.split(/[、]/).map((part) => part.trim()).filter((part) => part.length > 0);
  if (pieces.length === count) return pieces;
  return Array.from({ length: count }, (_, index) => (index === 0 ? answer.trim() : ''));
}

function styleBlankQuestion(stem: string, answer: string) {
  let index = 0;
  const converted = countBlanks(stem) > 0 ? stem : stem.replace(/_{2,}/g, () => blankMark(index++));
  const nextStem = renumberBlanks(converted);
  const count = countBlanks(nextStem);
  if (count === 0) return { stem: nextStem, answer, blankAnswers: undefined as string[] | undefined };
  const blankAnswers = splitImportedBlankAnswers(answer, count);
  return { stem: nextStem, blankAnswers, answer: formatBlankAnswers(blankAnswers) };
}

export function bankQuestionToExample(q: BankQuestion): KnowledgeCardExample {
  const kind = q.children && q.children.length > 0 ? 'material' : mapBankKind(q.questionType);
  const parts = isOptionKind(kind) ? ensureChoiceFields(q.stem) : { stem: q.stem, options: [] as ExampleOption[] };
  const blank = kind === 'blank' ? styleBlankQuestion(parts.stem, q.answer) : null;
  return {
    questionId: q.id,
    bankQuestionId: q.id,
    source: q.source,
    kind,
    stem: blank?.stem ?? parts.stem,
    options: parts.options,
    answer: kind === 'material' ? '' : blank?.answer ?? q.answer,
    blankAnswers: blank?.blankAnswers,
    analysis: kind === 'material' ? '' : q.analysis,
    children:
      kind === 'material'
        ? (q.children || []).map((child) => {
            const childKind = mapOrdinaryKind(child.questionType);
            const childParts = isOptionKind(childKind)
              ? ensureChoiceFields(child.stem)
              : { stem: child.stem, options: [] as ExampleOption[] };
            const childBlank = childKind === 'blank' ? styleBlankQuestion(childParts.stem, child.answer) : null;
            return {
              id: child.id,
              kind: childKind,
              stem: childBlank?.stem ?? childParts.stem,
              options: childParts.options,
              answer: childBlank?.answer ?? child.answer,
              blankAnswers: childBlank?.blankAnswers,
              analysis: child.analysis,
            };
          })
        : [],
  };
}

function exampleToBankDraft(example: KnowledgeCardExample, knowledgePoint?: string): BankEditorDraft {
  const base = createEmptyBankEditorDraft(knowledgePoint);
  const kind = (example.kind ?? 'single') as BankEditorKind;
  return {
    ...base,
    kind,
    stem: example.stem,
    options: isOptionKind(kind) ? (example.options.length >= MIN_CHOICE_OPTIONS ? example.options : base.options) : [],
    answer: example.answer,
    analysis: example.analysis,
    children: example.children.map((child) => ({
      id: child.id,
      kind: child.kind,
      stem: child.stem,
      options: child.options,
      answer: child.answer,
      analysis: child.analysis,
    })),
  };
}

function commitExampleChange(prev: KnowledgeCardExample, next: KnowledgeCardExample): KnowledgeCardExample {
  const linked = !!prev.bankQuestionId && prev.questionId === prev.bankQuestionId;
  if (linked) {
    return { ...next, questionId: uid('q'), source: 'manual' };
  }
  if (!next.questionId && exampleHasWritableContent(next)) {
    return { ...next, questionId: uid('q') };
  }
  return next;
}

function finishKindSwitch<T extends { kind: string; stem: string; answer: string; blankAnswers?: string[] }>(
  next: T,
): T {
  if (next.kind !== 'blank') return { ...next, blankAnswers: undefined };
  return { ...next, ...withBlankFields(next, next.stem) };
}

function withSubQuestionKind(
  sub: ExampleSubQuestion,
  kind: ExampleSubQuestion['kind'],
): ExampleSubQuestion {
  if (sub.kind === kind) return sub;
  if (isOptionKind(sub.kind) && isOptionKind(kind)) return finishKindSwitch({ ...sub, kind });
  return finishKindSwitch({
    ...sub,
    kind,
    options: isOptionKind(kind) ? emptyChoiceOptions(DEFAULT_CHOICE_OPTIONS) : [],
  });
}

function withExampleKind(ex: KnowledgeCardExample, kind: ExampleQuestionKind): KnowledgeCardExample {
  if (kind === ex.kind) return ex;
  if (isOptionKind(ex.kind) && isOptionKind(kind)) return finishKindSwitch({ ...ex, kind });
  if (kind === 'material') {
    return finishKindSwitch({
      ...ex,
      kind,
      options: [],
      answer: '',
      analysis: '',
      children: [],
    });
  }
  if (ex.kind === 'material') {
    return finishKindSwitch({
      ...ex,
      kind,
      options: isOptionKind(kind) ? emptyChoiceOptions(DEFAULT_CHOICE_OPTIONS) : [],
      answer: '',
      analysis: '',
      children: [],
    });
  }
  return finishKindSwitch({
    ...ex,
    kind,
    options: isOptionKind(kind) ? emptyChoiceOptions(DEFAULT_CHOICE_OPTIONS) : [],
  });
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
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-7 min-w-7 px-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-4 bg-gray-200 mx-0.5 flex-shrink-0" aria-hidden />;
}

const RichEditorFocusContext = React.createContext<(() => void) | null>(null);

/** 内容超出默认高度时把输入框撑高，避免在框内出现滚动条。 */
function fitTextarea(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function useFitTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) fitTextarea(el);
  }, [value]);
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent || typeof ResizeObserver === 'undefined') return;
    let width = parent.clientWidth;
    const observer = new ResizeObserver(() => {
      if (parent.clientWidth === width) return;
      width = parent.clientWidth;
      fitTextarea(el);
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  return ref;
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
  line = false,
  twoLine = false,
  footer,
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
  /** 默认只留一行正文，聚焦后工具栏加在这一行上面。 */
  line?: boolean;
  /** 默认两行正文，超出后随内容变高。 */
  twoLine?: boolean;
  footer?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const textareaRef = useFitTextarea(value);
  const hasBlanks = countBlanks(value) > 0;
  const showBlankLine = hasBlanks && !composing;
  const bodyClass = line
    ? 'leading-6 py-1.5 min-h-6'
    : twoLine
      ? 'leading-relaxed py-2.5 min-h-[calc(3.25em+1.25rem)]'
      : compact
        ? 'font-semibold py-1.5 min-h-[40px] leading-snug'
        : 'leading-relaxed py-2.5 min-h-[72px]';
  const focusRing =
    tone === 'amber'
      ? 'focus-within:ring-amber-400/30 focus-within:border-amber-400'
      : tone === 'emerald'
        ? 'focus-within:ring-emerald-500/30 focus-within:border-emerald-400'
        : 'focus-within:ring-teal-500/30 focus-within:border-teal-400';
  return (
    <RichEditorFocusContext.Provider value={() => setFocused(true)}>
    <div
      className={`rounded-md border border-gray-200 bg-white overflow-hidden focus-within:ring-2 ${focusRing}`}
      {...(toolbarAnchorId ? { 'data-req-anchor': toolbarAnchorId } : {})}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && e.currentTarget.contains(next)) return;
        setFocused(false);
        fieldBlurHandlers.onBlur();
      }}
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
        <ToolbarIconBtn
          title="挖空"
          onClick={() => {
            const el = textareaRef.current;
            if (!el) return;
            const cursor = el.selectionStart ?? value.length;
            const inserted = insertBlankAt(value, cursor);
            onChange(inserted.text);
            requestAnimationFrame(() => {
              el.focus();
              el.setSelectionRange(inserted.cursor, inserted.cursor);
            });
          }}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden>
            <path d="M2.5 11.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </ToolbarIconBtn>
        </div>
      )}
      <div className="relative">
        {showBlankLine ? (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 text-sm text-gray-700 ${bodyClass}`}
          >
            <BlankText text={value} />
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          data-card-field={fieldId}
          value={value}
          onCompositionStart={() => {
            setComposing(true);
            imeHandlers.onCompositionStart();
          }}
          onCompositionEnd={() => {
            setComposing(false);
            imeHandlers.onCompositionEnd();
          }}
          onFocus={() => setFocused(true)}
          onChange={(e) => onChange(e.target.value)}
          rows={line ? 1 : twoLine ? 2 : rows}
          placeholder={placeholder}
          className={`relative w-full overflow-hidden resize-none border-0 bg-transparent px-3 text-sm placeholder:text-gray-400 focus:outline-none ${bodyClass} ${
            showBlankLine ? 'text-transparent caret-gray-800 selection:bg-teal-100' : 'text-gray-700'
          }`}
        />
      </div>
      {footer ? <div className="border-t border-gray-200 px-3 pb-2 pt-2 space-y-0.5">{footer}</div> : null}
    </div>
    </RichEditorFocusContext.Provider>
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
  dialogTitle = '确认删除？',
  confirmText = '删除',
  dialogDescription,
}: {
  hasContent: boolean;
  label: string;
  onConfirm: () => void;
  className?: string;
  iconClassName?: string;
  dialogTitle?: string;
  confirmText?: string;
  /** 不传时保留原来的说明；传空字符串则不显示说明。 */
  dialogDescription?: string;
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
              {dialogTitle}
            </AlertDialogTitle>
            {dialogDescription !== '' && (
              <AlertDialogDescription>
                {dialogDescription ?? `${label}内已有内容，删除后不可恢复。确定要删除吗？`}
              </AlertDialogDescription>
            )}
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
              {confirmText}
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
  /** 刷新后恢复到这个知识点上次停留的子 Tab / 展开考点 */
  restoreNodeId?: string;
  restoreSubTab?: 'concept' | 'exam';
  restoreExpandedExamIds?: string[];
  onViewChange?: (subTab: 'concept' | 'exam', expandedExamIds: string[]) => void;
}

/** 有例题的考点默认展开。同一会话里手动收起后，仍记住当前展开状态。 */
function defaultExpandedExamIds(
  related: RelatedExamPoint[] | undefined,
  cardValue?: KnowledgeCard | null,
): Set<string> {
  return new Set(
    mergeCardExamPoints(related, normalizeKnowledgeCard(cardValue).examPoints)
      .filter((ep) => examPointHasExample(ep))
      .map((ep) => ep.id),
  );
}

function resolveExpandedExamIds(
  nodeId: string | undefined,
  related: RelatedExamPoint[] | undefined,
  cardValue: KnowledgeCard | undefined,
  restoreNodeId?: string,
  restoreExpandedExamIds?: string[],
): Set<string> {
  if (nodeId && expandedExamMemory.has(nodeId)) {
    return new Set(expandedExamMemory.get(nodeId));
  }
  const next = defaultExpandedExamIds(related, cardValue);
  if (nodeId && restoreNodeId === nodeId) {
    for (const id of restoreExpandedExamIds || []) next.add(id);
  }
  if (nodeId) expandedExamMemory.set(nodeId, next);
  return next;
}
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
  restoreNodeId,
  restoreSubTab,
  restoreExpandedExamIds,
  onViewChange,
}: KnowledgeCardPanelProps) {
  const [subTab, setSubTabState] = useState<CardSubTab>(() => {
    if (nodeId && subTabMemory.has(nodeId)) return subTabMemory.get(nodeId) ?? 'concept';
    if (nodeId && restoreNodeId === nodeId && restoreSubTab) {
      subTabMemory.set(nodeId, restoreSubTab);
      return restoreSubTab;
    }
    return 'concept';
  });
  const setSubTab = useCallback(
    (next: CardSubTab) => {
      if (nodeId) subTabMemory.set(nodeId, next);
      setSubTabState(next);
    },
    [nodeId]
  );

  const [expandedExamIds, setExpandedExamIds] = useState<Set<string>>(() =>
    resolveExpandedExamIds(nodeId, relatedExamPoints, value, restoreNodeId, restoreExpandedExamIds),
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
    setExpandedExamIds(
      resolveExpandedExamIds(nodeId, relatedExamPoints, value, restoreNodeId, restoreExpandedExamIds),
    );
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

  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  useEffect(() => {
    onViewChangeRef.current?.(subTab, [...expandedExamIds]);
  }, [subTab, expandedExamIds]);

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
    upsertExamPoint(examId, { example: bankQuestionToExample(q) });
    setLekePickForExamId(null);
    expandExam(examId);
  };

  const pickingExam = lekePickForExamId
    ? displayExamPoints.find((ep) => ep.id === lekePickForExamId) ||
      draftRef.current.examPoints.find((ep) => ep.id === lekePickForExamId)
    : undefined;
  const pickingHasContent = !!(pickingExam?.example && exampleHasContent(pickingExam.example));

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white [overflow-anchor:none]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500 text-white shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </span>
          <h4 className="font-semibold text-gray-900 shrink-0">知识卡片</h4>
          <span className="text-xs text-gray-400 truncate req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.summary">
            {summary}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => updateAndSync(sampleKnowledgeCard())}
            >
              填充示例数据
            </Button>
          )}
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.subtabs">
            <button
              type="button"
              onClick={() => setSubTab('concept')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                subTab === 'concept'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              核心概念
            </button>
            <button
              type="button"
              onClick={() => setSubTab('exam')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                subTab === 'exam'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              考点
            </button>
          </div>
          <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.tablet-preview">
            <button
              type="button"
              aria-label="预览"
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-teal-200 bg-white text-teal-600 text-sm hover:bg-teal-50 transition-colors"
              onClick={() => setTabletPreviewOpen(true)}
            >
              <Eye className="w-4 h-4" />
              预览
            </button>
          </span>
        </div>
      </div>
      <div className="p-4">

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
      </div>

      <LekeQuestionPicker
        open={!!lekePickForExamId}
        hasExistingContent={pickingHasContent}
        knowledgePointName={pickingExam?.title}
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

function ExamTypeTag({ type }: { type?: KnowledgeCardExamType }) {
  const meta = examTypeMeta(type);
  if (!meta) return null;
  return (
    <span className="inline-flex items-center h-5 px-1.5 rounded text-[11px] leading-none flex-shrink-0 bg-gray-100 text-gray-500">
      {meta.label}
    </span>
  );
}

function ExamIndexBadge({ index }: { index: number }) {
  return (
    <span className="w-5 h-5 rounded-md bg-teal-500 text-white text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
      {index + 1}
    </span>
  );
}

function ExamExampleStatus({
  hasExample,
  expanded,
}: {
  hasExample: boolean;
  expanded: boolean;
}) {
  return (
    <span
      className={`ml-auto inline-flex items-center gap-0.5 text-xs shrink-0 ${
        hasExample ? 'text-teal-600' : 'text-gray-400'
      }`}
    >
      {hasExample ? '有例题' : '无例题'}
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </span>
  );
}

function ExamListSection({
  title,
  count,
  children,
  anchor,
  extra,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  anchor?: string;
  extra?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-gray-50 px-3 py-3" {...(anchor ? { 'data-req-anchor': anchor } : {})}>
      <div className="flex items-center gap-2 px-1 pb-2.5">
        <span className="text-sm font-medium text-gray-800">{title}</span>
        <span className="text-xs text-gray-400">{count}条</span>
        {extra ? <div className="ml-auto">{extra}</div> : null}
      </div>
      {children}
    </section>
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
  return (
    <div
      className="rounded-lg border border-gray-200 overflow-hidden bg-white"
      {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.exam-list' } : {})}
    >
      <button
        type="button"
        className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left bg-white"
        onClick={onToggle}
      >
        <ExamIndexBadge index={index} />
        <span className="text-sm font-semibold text-gray-900 min-w-0 truncate">
          {ep.title || '未命名考点'}
        </span>
        <ExamTypeTag type={ep.examType} />
        <ExamExampleStatus hasExample={examPointHasExample(ep)} expanded={expanded} />
      </button>

      {expanded && (
        <>
          {ep.description ? (
            <div
              className="px-3 py-3 border-t border-gray-100 bg-gray-50/60"
              {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.exam-desc' } : {})}
            >
              <div className={`${FIELD_LABEL_CLASS} mb-1.5`}>考点说明</div>
              <div className={`${BODY_WELL_CLASS} bg-white/80 ${BODY_VIEW_CLASS}`}>{ep.description}</div>
            </div>
          ) : null}

          {ep.example && examPointHasExample(ep) && (
            <div
              className="m-3 rounded-xl border border-teal-100 bg-white p-3 space-y-3"
              {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.example' } : {})}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">典型例题</span>
                {exampleKindLabel(ep.example.kind) ? (
                  <span className="inline-flex items-center h-7 px-2.5 rounded-md border border-teal-300 bg-teal-50 text-[13px] font-semibold text-teal-800">
                    {exampleKindLabel(ep.example.kind)}
                  </span>
                ) : null}
              </div>
              <TypicalExampleReadout example={ep.example} revealAnswer anchorHost={isAnchorHost} />
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
    <ExamListSection title="知识点Tips" count={filled.length} anchor="knowledge-tree.knowledge-card.knowledge-tips">
      {isEditing ? (
        <div className="space-y-2">
          {list.map((tip, index) => (
            <div key={tip.id} className="flex items-start gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2.5">
              {showIndex && (
                <span className="mt-2 w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[11px] font-medium flex items-center justify-center flex-shrink-0">
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
                  tone="teal"
                  rows={2}
                  imeHandlers={imeHandlers}
                  fieldBlurHandlers={fieldBlurHandlers}
                  onChange={(content) => {
                    onChange(list.map((item) => (item.id === tip.id ? { ...item, content } : item)));
                  }}
                />
              </div>
              {showIndex && (
                <DeleteIconButton
                  hasContent={!isBlank(tip.content)}
                  label="该知识点Tips"
                  onConfirm={() => removeTip(tip.id)}
                />
              )}
            </div>
          ))}
          <AddActionButton tone="teal" onClick={addTip}>
            <span
              className="req-anchor-inline"
              data-req-anchor="knowledge-tree.knowledge-card.add-knowledge-tip"
            >
              添加Tips
            </span>
          </AddActionButton>
        </div>
      ) : filled.length > 0 ? (
        <div className="space-y-2">
          {filled.map((tip, index) => (
            <div key={tip.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[11px] font-medium flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {tip.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-400 leading-relaxed">
          {KNOWLEDGE_TIPS_EMPTY_HINT}
        </div>
      )}
    </ExamListSection>
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

  const examListBody =
    examPoints.length === 0 ? (
      <div
        className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-center"
        data-req-anchor="knowledge-tree.knowledge-card.exam-empty"
      >
        <p className="text-sm text-gray-600">暂无考点</p>
        <p className="text-xs mt-1 text-gray-400">请先在「关联考点」Tab 维护考点名称与类型</p>
        {onGoMaintainExams && (
          <button
            type="button"
            onClick={onGoMaintainExams}
            className="mt-3 inline-flex items-center justify-center h-8 px-3 rounded-lg border border-teal-200 text-teal-700 bg-teal-50/40 hover:bg-teal-50 text-sm font-medium transition-colors"
          >
            去维护考点
          </button>
        )}
      </div>
    ) : !isEditing ? (
      <div className="space-y-2" data-req-anchor="knowledge-tree.knowledge-card.exam-list">
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
      <div className="space-y-2" data-req-anchor="knowledge-tree.knowledge-card.exam-list">
        {examPoints.map((ep, index) => {
          const expanded = expandedExamIds.has(ep.id);
          return (
            <div key={ep.id} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                  onClick={() => onToggleExam(ep.id)}
                >
                  <ExamIndexBadge index={index} />
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {ep.title || '未命名考点'}
                  </span>
                  <ExamTypeTag type={ep.examType} />
                  <ExamExampleStatus hasExample={examPointHasExample(ep)} expanded={expanded} />
                </button>
              </div>

              {expanded && (
                <div className="px-3 pt-3 pb-3 space-y-4 border-t border-gray-100 bg-white">
                  <FieldBlock
                    label="考点说明"
                    reqAnchor={index === 0 ? 'knowledge-tree.knowledge-card.exam-desc' : undefined}
                  >
                    <KeyPointRichInput
                      fieldId={`${ep.id}-desc`}
                      value={ep.description || ''}
                      placeholder="不填写，则学生端考点说明处则显示【暂无】"
                      tone="emerald"
                      line
                      imeHandlers={imeHandlers}
                      fieldBlurHandlers={fieldBlurHandlers}
                      onChange={(description) => onUpsertExam(ep.id, { description })}
                    />
                  </FieldBlock>

                  <ExampleEditor
                    example={ep.example ?? emptyExample()}
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
                    knowledgePointName={ep.title}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

  return (
    <div className="space-y-3">
      <ExamListSection
        title="考点清单"
        count={examPoints.length}
        extra={
          <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.edit-scheme">
            <ExampleEditSchemeSwitch />
          </span>
        }
      >
        {examListBody}
      </ExamListSection>
      {tipsBlock}
    </div>
  );
}

const ORDINARY_QUESTION_KINDS = EXAMPLE_QUESTION_KINDS.filter((item) => item.id !== 'material');

function OptionLines({ options, divided = true }: { options?: ExampleOption[]; divided?: boolean }) {
  if (!options || options.length === 0) return null;
  return (
    <div className={`mt-2 space-y-1 ${divided ? 'border-t border-gray-200 pt-2' : ''}`}>
      {options.map((opt) => (
        <div key={opt.key} className="flex gap-2">
          <span className="font-bold text-gray-900 shrink-0">{opt.key}.</span>
          <span className="whitespace-pre-wrap">{opt.text.trim() || '暂无'}</span>
        </div>
      ))}
    </div>
  );
}

function OptionTextarea({
  value,
  imeHandlers,
  onFocus,
  onChange,
}: {
  value: string;
  imeHandlers?: ImeHandlers;
  onFocus: () => void;
  onChange: (value: string) => void;
}) {
  const ref = useFitTextarea(value);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      placeholder="请输入..."
      {...imeHandlers}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 overflow-hidden resize-none border-0 bg-transparent py-1 text-sm leading-relaxed text-gray-700 placeholder:text-gray-400 focus:outline-none"
    />
  );
}

function ChoiceOptionsFields({
  options,
  editing,
  imeHandlers,
  onChange,
}: {
  options: ExampleOption[];
  editing: boolean;
  imeHandlers?: ImeHandlers;
  onChange: (options: ExampleOption[], structural: boolean) => void;
}) {
  const rows = normalizeOptions(options);
  const canAdd = rows.length < OPTION_KEYS.length;
  const canDelete = rows.length > MIN_CHOICE_OPTIONS;
  const focusEditor = React.useContext(RichEditorFocusContext);

  return (
    <div>
      {rows.map((opt, index) => (
        <div key={opt.key} className="flex items-start gap-1">
          <span className="w-6 shrink-0 pt-1 text-sm font-bold leading-relaxed text-gray-900">{opt.key}.</span>
          {editing ? (
            <OptionTextarea
              value={opt.text}
              imeHandlers={imeHandlers}
              onFocus={() => focusEditor?.()}
              onChange={(text) => {
                const next = rows.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, text } : item
                );
                onChange(next, false);
              }}
            />
          ) : (
            <span className={`flex-1 min-w-0 py-1 ${BODY_VIEW_CLASS}`}>{opt.text.trim() || '暂无'}</span>
          )}
          {editing && canDelete ? (
            <DeleteIconButton
              hasContent={!isBlank(opt.text)}
              label={`${opt.key} 选项`}
              className="mt-1 p-1 text-red-400"
              iconClassName="w-3.5 h-3.5"
              onConfirm={() => onChange(normalizeOptions(rows.filter((_, itemIndex) => itemIndex !== index)), true)}
            />
          ) : null}
        </div>
      ))}
      {editing && canAdd ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 py-1 text-xs text-emerald-700 hover:underline"
          onClick={() => onChange(normalizeOptions([...rows, { key: '', text: '' }]), true)}
        >
          <Plus className="w-3 h-3" />
          添加选项
        </button>
      ) : null}
    </div>
  );
}

function plainBlankAnswerText(answers: string[]) {
  const parts = answers.map((item) => item.trim());
  if (!parts.some(Boolean)) return '暂无';
  return parts.map((item) => item || '暂无').join('；');
}

function BlankAnswerFields({
  answers,
  editing,
  onChange,
  plain = false,
}: {
  answers: string[];
  editing: boolean;
  onChange: (answers: string[]) => void;
  plain?: boolean;
}) {
  if (plain && !editing) {
    return (
      <div className="space-y-1.5">
        <div className={FIELD_LABEL_CLASS}>答案</div>
        <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS}`}>{plainBlankAnswerText(answers)}</div>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className={FIELD_LABEL_CLASS}>答案</div>
      <div className="space-y-2">
        {answers.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-1 w-5 shrink-0 text-center text-sm leading-6 text-gray-500">{circledNumber(index)}</span>
            {editing ? (
              <BlankAnswerInput
                value={item}
                onChange={(next) => onChange(answers.map((answer, answerIndex) => (answerIndex === index ? next : answer)))}
              />
            ) : (
              <span className={`min-h-6 flex-1 border-b border-gray-200 py-1 ${BODY_VIEW_CLASS}`}>
                {item.trim() ? item : '暂无'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BlankAnswerInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useFitTextarea(value);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      placeholder="请输入..."
      onChange={(e) => onChange(e.target.value)}
      className="min-h-6 w-full flex-1 resize-none overflow-hidden border-0 border-b border-gray-200 bg-transparent py-1 text-sm leading-6 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
    />
  );
}

function ExampleField({
  label,
  value,
  editing,
  fieldId,
  placeholder,
  anchor,
  imeHandlers,
  fieldBlurHandlers,
  onChange,
  footer,
  plainBlanks = false,
}: {
  label: string;
  value: string;
  editing: boolean;
  fieldId: string;
  placeholder: string;
  anchor?: string;
  imeHandlers: ImeHandlers;
  fieldBlurHandlers: FieldBlurHandlers;
  onChange: (value: string) => void;
  footer?: React.ReactNode;
  plainBlanks?: boolean;
}) {
  return (
    <div className="space-y-1.5" {...(anchor ? { 'data-req-anchor': anchor } : {})}>
      <div className={FIELD_LABEL_CLASS}>{label}</div>
      {editing ? (
        <KeyPointRichInput
          fieldId={fieldId}
          value={value}
          placeholder={placeholder}
          tone="emerald"
          rows={2}
          line={label === '答案'}
          twoLine={label === '题干'}
          imeHandlers={imeHandlers}
          fieldBlurHandlers={fieldBlurHandlers}
          onChange={onChange}
          footer={footer}
        />
      ) : (
        <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS} whitespace-pre-wrap`}>
          {value.trim() ? (
            plainBlanks && countBlanks(value) > 0 ? <BlankText text={value} plain /> : value
          ) : (
            '暂无'
          )}
          {footer}
        </div>
      )}
    </div>
  );
}

function PreviewSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">
      <span className="h-3.5 w-1 rounded-full bg-emerald-500" />
      {children}
    </div>
  );
}

function PreviewAnswerBody({
  kind,
  stem,
  answer,
  blankAnswers,
}: {
  kind: ExampleQuestionKind | ExampleSubQuestion['kind'];
  stem: string;
  answer: string;
  blankAnswers?: string[];
}) {
  if (kind === 'blank' && countBlanks(stem) > 0) {
    const answers = blankAnswers ?? alignBlankAnswers(answer, undefined, countBlanks(stem));
    return (
      <div className="space-y-1 text-[13px] leading-relaxed text-gray-800">
        {answers.map((item, index) => (
          <div key={circledNumber(index)} className="flex gap-2">
            <span className="shrink-0 text-gray-500">{circledNumber(index)}</span>
            <span className="whitespace-pre-wrap">{item.trim() || '暂无'}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800">
      {answer.trim() || '暂无'}
    </p>
  );
}

function PreviewKindPrefix({
  kind,
  spaced = true,
}: {
  kind?: ExampleQuestionKind | null;
  spaced?: boolean;
}) {
  if (kind !== 'multiple') return null;
  const label = exampleKindLabel(kind);
  if (!label) return null;
  return <span className={`${spaced ? 'mr-1 ' : ''}font-bold text-black`}>【{label}】</span>;
}

export function TypicalExampleReadout({
  example,
  revealAnswer,
  anchorHost,
  variant = 'card',
}: {
  example: KnowledgeCardExample;
  revealAnswer: boolean;
  anchorHost?: boolean;
  variant?: 'card' | 'preview';
}) {
  const editScheme = useExampleEditScheme();
  const plainBlanks = variant !== 'preview' && editScheme === 'bank';
  if (variant === 'preview') {
    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800">
          <PreviewKindPrefix kind={example.kind} />
          {example.stem.trim() ? <BlankText text={example.stem} /> : '暂无'}
          {isOptionKind(example.kind) ? <OptionLines options={normalizeOptions(example.options)} divided={false} /> : null}
        </div>
        {example.kind === 'material'
          ? example.children.map((child, index) => (
              <div key={child.id} className="border-t border-gray-100 pt-2">
                <div className="flex items-baseline text-[13px] leading-relaxed text-gray-800">
                  <span className="shrink-0 font-normal">（{index + 1}）</span>
                  <div className="min-w-0">
                    <div className="whitespace-pre-wrap">
                      {materialChildTypeText(
                        exampleKindLabel(child.kind),
                        'multiple-only',
                        child.kind === 'multiple'
                      )}
                      {child.stem.trim() ? <BlankText text={child.stem} /> : '暂无'}
                    </div>
                    {isOptionKind(child.kind) ? (
                      <OptionLines options={normalizeOptions(child.options)} divided={false} />
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          : null}
        {revealAnswer && example.kind === 'material' ? (
          <>
            <PreviewSectionTitle>答案</PreviewSectionTitle>
            <div className="space-y-1.5">
              {example.children.map((child, index) => (
                <div key={`${child.id}-answer`} className="flex items-start text-[13px] leading-relaxed text-gray-800">
                  <span className="shrink-0 font-normal">（{index + 1}）</span>
                  <div className="min-w-0 flex-1">
                    <PreviewAnswerBody
                      kind={child.kind}
                      stem={child.stem}
                      answer={child.answer}
                      blankAnswers={child.blankAnswers}
                    />
                  </div>
                </div>
              ))}
            </div>
            <PreviewSectionTitle>解析</PreviewSectionTitle>
            <div className="space-y-1.5">
              {example.children.map((child, index) => (
                <div key={`${child.id}-analysis`} className="flex items-start text-[13px] leading-relaxed text-gray-800">
                  <span className="shrink-0 font-normal">（{index + 1}）</span>
                  <p className="min-w-0 flex-1 whitespace-pre-wrap">{child.analysis.trim() || '暂无'}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {revealAnswer && example.kind !== 'material' ? (
          <>
            <PreviewSectionTitle>答案</PreviewSectionTitle>
            <PreviewAnswerBody
              kind={example.kind || 'qa'}
              stem={example.stem}
              answer={example.answer}
              blankAnswers={example.blankAnswers}
            />
            <PreviewSectionTitle>解析</PreviewSectionTitle>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800">
              {example.analysis.trim() || '暂无'}
            </p>
          </>
        ) : null}
      </div>
    );
  }

  if (example.kind === 'material') {
    return (
      <div className="space-y-3">
        <div {...(anchorHost ? { className: 'req-anchor-host', 'data-req-anchor': 'knowledge-tree.knowledge-card.example-stem' } : {})}>
          <div className={`${FIELD_LABEL_CLASS} mb-1.5`}>题干</div>
          <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS} whitespace-pre-wrap`}>
            {example.stem.trim() ? <BlankText text={example.stem} plain={plainBlanks} /> : '暂无'}
          </div>
        </div>
        {example.children.map((child, index) => (
          <div key={child.id} className="rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 space-y-2">
            <div className="text-[12px] font-medium text-gray-500">
              （{index + 1}） · {exampleKindLabel(child.kind)}
            </div>
            <div className={`${BODY_WELL_CLASS} bg-white ${BODY_VIEW_CLASS} whitespace-pre-wrap`}>
              {child.stem.trim() ? <BlankText text={child.stem} plain={plainBlanks} /> : '暂无'}
              {isOptionKind(child.kind) ? <OptionLines options={normalizeOptions(child.options)} /> : null}
            </div>
            {revealAnswer ? (
              <>
                {child.kind === 'blank' && countBlanks(child.stem) > 0 ? (
                  <BlankAnswerFields
                    answers={child.blankAnswers ?? alignBlankAnswers(child.answer, undefined, countBlanks(child.stem))}
                    editing={false}
                    plain={plainBlanks}
                    onChange={() => {}}
                  />
                ) : (
                <ExampleField
                  label="答案"
                  value={child.answer}
                  editing={false}
                  fieldId={`${child.id}-answer`}
                  placeholder=""
                  anchor={anchorHost && index === 0 ? 'knowledge-tree.knowledge-card.steps-tips' : undefined}
                  imeHandlers={{ onCompositionStart: () => {}, onCompositionEnd: () => {} }}
                  fieldBlurHandlers={{ onBlur: () => {} }}
                  onChange={() => {}}
                />
                )}
                <ExampleField
                  label="解析"
                  value={child.analysis}
                  editing={false}
                  fieldId={`${child.id}-analysis`}
                  placeholder=""
                  imeHandlers={{ onCompositionStart: () => {}, onCompositionEnd: () => {} }}
                  fieldBlurHandlers={{ onBlur: () => {} }}
                  onChange={() => {}}
                />
              </>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div {...(anchorHost ? { className: 'req-anchor-host', 'data-req-anchor': 'knowledge-tree.knowledge-card.example-stem' } : {})}>
        <div className={`${FIELD_LABEL_CLASS} mb-1.5`}>题干</div>
        <div className={`${BODY_WELL_CLASS} ${BODY_VIEW_CLASS} whitespace-pre-wrap`}>
          {example.stem.trim() ? <BlankText text={example.stem} plain={plainBlanks} /> : '暂无'}
          {isOptionKind(example.kind) ? <OptionLines options={normalizeOptions(example.options)} /> : null}
        </div>
      </div>
      {revealAnswer ? (
        <>
          {example.kind === 'blank' && countBlanks(example.stem) > 0 ? (
            <BlankAnswerFields
              answers={example.blankAnswers ?? alignBlankAnswers(example.answer, undefined, countBlanks(example.stem))}
              editing={false}
              plain={plainBlanks}
              onChange={() => {}}
            />
          ) : (
          <ExampleField
            label="答案"
            value={example.answer}
            editing={false}
            fieldId="read-answer"
            placeholder=""
            anchor={anchorHost ? 'knowledge-tree.knowledge-card.steps-tips' : undefined}
            imeHandlers={{ onCompositionStart: () => {}, onCompositionEnd: () => {} }}
            fieldBlurHandlers={{ onBlur: () => {} }}
            onChange={() => {}}
          />
          )}
          <ExampleField
            label="解析"
            value={example.analysis}
            editing={false}
            fieldId="read-analysis"
            placeholder=""
            imeHandlers={{ onCompositionStart: () => {}, onCompositionEnd: () => {} }}
            fieldBlurHandlers={{ onBlur: () => {} }}
            onChange={() => {}}
          />
        </>
      ) : null}
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
  knowledgePointName,
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
  knowledgePointName?: string;
}) {
  const editText = (next: KnowledgeCardExample) => onLocalChange(commitExampleChange(example, next));
  const editStruct = (next: KnowledgeCardExample) => onStructChange(commitExampleChange(example, next));
  const canClear = !!onClear && exampleHasContent(example);
  const editScheme = useExampleEditScheme();
  const contentEditing = isEditing && editScheme === 'inline';
  const plainBlanks = editScheme === 'bank';
  const maintainedExample = exampleBodyHasText(example);
  const showKindChip = editScheme !== 'bank' || !!example.kind;
  const [bankEditorOpen, setBankEditorOpen] = useState(false);
  const [pendingKind, setPendingKind] = useState<
    | { scope: 'example'; kind: ExampleQuestionKind }
    | { scope: 'child'; id: string; kind: ExampleSubQuestion['kind'] }
    | null
  >(null);

  const applyExampleKind = (nextKind: ExampleQuestionKind) => {
    editStruct(withExampleKind(example, nextKind));
  };

  const changeKind = (value: string) => {
    const nextKind = value as ExampleQuestionKind;
    if (!nextKind || nextKind === example.kind) return;
    if (example.kind && exampleHasWritableContent(example)) {
      setPendingKind({ scope: 'example', kind: nextKind });
      return;
    }
    applyExampleKind(nextKind);
  };

  const applyChildKind = (child: ExampleSubQuestion, nextKind: ExampleSubQuestion['kind']) => {
    updateChild(child.id, withSubQuestionKind(child, nextKind), true);
  };

  const requestChildKind = (child: ExampleSubQuestion, value: string) => {
    const nextKind = value as ExampleSubQuestion['kind'];
    if (!nextKind || nextKind === child.kind) return;
    if (subQuestionHasContent(child)) {
      setPendingKind({ scope: 'child', id: child.id, kind: nextKind });
      return;
    }
    applyChildKind(child, nextKind);
  };

  const confirmKindSwitch = () => {
    if (!pendingKind) return;
    if (pendingKind.scope === 'example') {
      applyExampleKind(pendingKind.kind);
    } else {
      const child = example.children.find((item) => item.id === pendingKind.id);
      if (child) {
        applyChildKind(child, pendingKind.kind);
      }
    }
    setPendingKind(null);
  };

  const updateChild = (id: string, patch: Partial<ExampleSubQuestion>, structural = false) => {
    const children = example.children.map((child) => (child.id === id ? { ...child, ...patch } : child));
    const next = { ...example, children };
    if (structural) editStruct(next);
    else editText(next);
  };

  const saveBankEditor = (draft: BankEditorDraft) => {
    const kind = draft.kind as ExampleQuestionKind;
    let next: KnowledgeCardExample = example.kind === kind ? { ...example, kind } : withExampleKind(example, kind);
    const mapOptions = (options: BankEditorDraft['options']) =>
      options.map((item, index) => ({ key: OPTION_KEYS[index] || item.key, text: item.text }));
    next = {
      ...next,
      kind,
      stem: draft.stem,
      options: isOptionKind(kind) ? mapOptions(draft.options) : [],
      answer: kind === 'material' ? '' : draft.answer,
      analysis: kind === 'material' ? '' : draft.analysis,
      children:
        kind === 'material'
          ? draft.children.map((child) => {
              const stem = child.kind === 'blank' ? renumberBlanks(child.stem) : child.stem;
              const count = child.kind === 'blank' ? countBlanks(stem) : 0;
              const rawLines = child.answer.split(/\r?\n/).map((line) => line.replace(/^\s*\d+\s*/, '').trim());
              const blankAnswers = count > 0 ? Array.from({ length: count }, (_, index) => rawLines[index] ?? '') : undefined;
              const mapped: ExampleSubQuestion = {
                id: child.id,
                kind: child.kind,
                stem,
                options: isOptionKind(child.kind) ? mapOptions(child.options) : [],
                answer: blankAnswers ? formatBlankAnswers(blankAnswers) : child.answer,
                analysis: child.analysis,
                blankAnswers,
              };
              return mapped;
            })
          : [],
    };
    if (kind === 'blank') {
      const stem = renumberBlanks(draft.stem);
      const count = countBlanks(stem);
      const rawLines = draft.answer.split(/\r?\n/).map((line) => line.replace(/^\s*\d+\s*/, '').trim());
      const blankAnswers = count > 0 ? Array.from({ length: count }, (_, index) => rawLines[index] ?? '') : undefined;
      next = { ...next, stem, blankAnswers, answer: blankAnswers ? formatBlankAnswers(blankAnswers) : draft.answer };
    } else if (kind !== 'material') next = { ...next, blankAnswers: undefined };
    editStruct(next);
    setBankEditorOpen(false);
  };

  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3"
      {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.example' } : {})}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-800">典型例题</span>
        {showKindChip ? (
        <label className="relative inline-flex items-center">
          <span
            className={`pointer-events-none inline-flex items-center h-7 rounded-md text-[13px] ${
              contentEditing ? 'pl-2.5 pr-6' : 'px-2.5'
            } ${
              example.kind
                ? 'border border-teal-300 bg-teal-50 font-semibold text-teal-800'
                : 'border border-gray-200 bg-white font-medium text-gray-400'
            }`}
          >
            {exampleKindLabel(example.kind) || '请选择题型'}
          </span>
          {contentEditing ? (
            <ChevronDown
              className={`pointer-events-none absolute right-1.5 w-3.5 h-3.5 ${
                example.kind ? 'text-teal-700' : 'text-gray-400'
              }`}
            />
          ) : null}
          {contentEditing ? (
          <select
            value={example.kind ?? ''}
            onChange={(e) => changeKind(e.target.value)}
            aria-label="题型"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="" disabled>
              请选择题型
            </option>
            {EXAMPLE_QUESTION_KINDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          ) : null}
        </label>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {isEditing && editScheme === 'bank' && maintainedExample && (
            <span
              className={isAnchorHost ? 'req-anchor-inline' : undefined}
              {...(isAnchorHost ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.bank-editor' } : {})}
            >
              <button
                type="button"
                aria-label="编辑"
                title="编辑"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-teal-200 text-teal-600 hover:bg-teal-50"
                onClick={() => setBankEditorOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {isEditing && editScheme === 'bank' && canClear && onClear && (
            <DeleteIconButton
              hasContent
              label="该例题"
              onConfirm={onClear}
              dialogTitle="确认清空当前例题吗？"
              confirmText="确认清空"
              dialogDescription=""
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
              iconClassName="h-3.5 w-3.5"
            />
          )}
          {contentEditing && canClear && onClear && (
            <DeleteIconButton
              hasContent
              label="该例题"
              onConfirm={onClear}
              dialogTitle="确认清空当前例题吗？"
              confirmText="确认清空"
              dialogDescription=""
            />
          )}
          {isEditing && (
            <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.system-select">
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
      </div>

      <ExampleField
        label="题干"
        value={example.stem}
        editing={contentEditing}
        fieldId={stemFieldId || 'example-stem'}
        placeholder="不填写，学生端题干处显示【暂无】"
        anchor={isAnchorHost ? 'knowledge-tree.knowledge-card.example-stem' : undefined}
        imeHandlers={imeHandlers}
        fieldBlurHandlers={fieldBlurHandlers}
        plainBlanks={plainBlanks}
        onChange={(stem) => {
          if (example.kind === 'blank') editText({ ...example, ...withBlankFields(example, stem) });
          else editText({ ...example, stem });
        }}
        footer={
          isOptionKind(example.kind) ? (
            <ChoiceOptionsFields
              options={example.options}
              editing={contentEditing}
              imeHandlers={imeHandlers}
              onChange={(options, structural) => {
                const next = { ...example, options };
                if (structural) editStruct(next);
                else editText(next);
              }}
            />
          ) : undefined
        }
      />

      {example.kind === 'material' ? (
        <div className="space-y-2">
          {example.children.map((child, index) => (
            <div key={child.id} className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">（{index + 1}）</span>
                {contentEditing ? (
                  <select
                    value={child.kind}
                    onChange={(e) => requestChildKind(child, e.target.value)}
                    aria-label="子题题型"
                    className="h-7 px-2 text-xs rounded-md border border-gray-200 bg-white text-gray-700"
                  >
                    {ORDINARY_QUESTION_KINDS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[11px] text-gray-400">{exampleKindLabel(child.kind)}</span>
                )}
                {contentEditing && (
                  <div className="ml-auto">
                    <DeleteIconButton
                      hasContent={subQuestionHasContent(child)}
                      label="该子题"
                      className="p-1 text-red-400"
                      iconClassName="w-3 h-3"
                      onConfirm={() =>
                        editStruct({
                          ...example,
                          children: example.children.filter((item) => item.id !== child.id),
                        })
                      }
                    />
                  </div>
                )}
              </div>
              <ExampleField
                label="题干"
                value={child.stem}
                editing={contentEditing}
                fieldId={`${child.id}-stem`}
                placeholder="不填写，学生端题干处显示【暂无】"
                imeHandlers={imeHandlers}
                fieldBlurHandlers={fieldBlurHandlers}
                plainBlanks={plainBlanks}
                onChange={(stem) => {
                  if (child.kind === 'blank') updateChild(child.id, withBlankFields(child, stem));
                  else updateChild(child.id, { stem });
                }}
                footer={
                  isOptionKind(child.kind) ? (
                    <ChoiceOptionsFields
                      options={child.options}
                      editing={contentEditing}
                      imeHandlers={imeHandlers}
                      onChange={(options, structural) => updateChild(child.id, { options }, structural)}
                    />
                  ) : undefined
                }
              />
              {child.kind === 'blank' && countBlanks(child.stem) > 0 ? (
                <BlankAnswerFields
                  answers={child.blankAnswers ?? alignBlankAnswers(child.answer, undefined, countBlanks(child.stem))}
                  editing={contentEditing}
                  plain={plainBlanks}
                  onChange={(blankAnswers) =>
                    updateChild(child.id, { blankAnswers, answer: formatBlankAnswers(blankAnswers) })
                  }
                />
              ) : (
              <ExampleField
                label="答案"
                value={child.answer}
                editing={contentEditing}
                fieldId={`${child.id}-answer`}
                placeholder="不填写，学生端答案处显示【暂无】"
                anchor={isAnchorHost && index === 0 ? 'knowledge-tree.knowledge-card.steps-tips' : undefined}
                imeHandlers={imeHandlers}
                fieldBlurHandlers={fieldBlurHandlers}
                onChange={(answer) => updateChild(child.id, { answer })}
              />
              )}
              <ExampleField
                label="解析"
                value={child.analysis}
                editing={contentEditing}
                fieldId={`${child.id}-analysis`}
                placeholder="不填写，学生端解析处显示【暂无】"
                anchor={isAnchorHost && index === 0 ? 'knowledge-tree.knowledge-card.add-step' : undefined}
                imeHandlers={imeHandlers}
                fieldBlurHandlers={fieldBlurHandlers}
                onChange={(analysis) => updateChild(child.id, { analysis })}
              />
            </div>
          ))}
          {contentEditing && (
            <AddActionButton
              compact
              tone="emerald"
              onClick={() => {
                const child = {
                  id: uid('sub'),
                  kind: 'qa' as const,
                  stem: '',
                  options: [],
                  answer: '',
                  analysis: '',
                };
                onRequestFocus(child.id);
                editStruct({ ...example, children: [...example.children, child] });
              }}
            >
              {isAnchorHost ? (
                <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.add-exam-tip">
                  添加子题
                </span>
              ) : (
                '添加子题'
              )}
            </AddActionButton>
          )}
          {isAnchorHost && !contentEditing ? (
            <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.add-exam-tip" />
          ) : null}
        </div>
      ) : example.kind ? (
        <>
          {example.kind === 'blank' && countBlanks(example.stem) > 0 ? (
            <BlankAnswerFields
              answers={example.blankAnswers ?? alignBlankAnswers(example.answer, undefined, countBlanks(example.stem))}
              editing={contentEditing}
              plain={plainBlanks}
              onChange={(blankAnswers) => editText({ ...example, blankAnswers, answer: formatBlankAnswers(blankAnswers) })}
            />
          ) : (
          <ExampleField
            label="答案"
            value={example.answer}
            editing={contentEditing}
            fieldId={`${stemFieldId || 'example'}-answer`}
            placeholder="不填写，学生端答案处显示【暂无】"
            anchor={isAnchorHost ? 'knowledge-tree.knowledge-card.steps-tips' : undefined}
            imeHandlers={imeHandlers}
            fieldBlurHandlers={fieldBlurHandlers}
            onChange={(answer) => editText({ ...example, answer, blankAnswers: undefined })}
          />
          )}
          <ExampleField
            label="解析"
            value={example.analysis}
            editing={contentEditing}
            fieldId={`${stemFieldId || 'example'}-analysis`}
            placeholder="不填写，学生端解析处显示【暂无】"
            anchor={isAnchorHost ? 'knowledge-tree.knowledge-card.add-step' : undefined}
            imeHandlers={imeHandlers}
            fieldBlurHandlers={fieldBlurHandlers}
            onChange={(analysis) => editText({ ...example, analysis })}
          />
          {isAnchorHost && (
            <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.add-exam-tip" />
          )}
        </>
      ) : isAnchorHost ? (
        <>
          <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.steps-tips" />
          <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.add-step" />
          <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.add-exam-tip" />
        </>
      ) : null}
      <AlertDialog open={!!pendingKind} onOpenChange={(next) => !next && setPendingKind(null)}>
        <AlertDialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>确认切换题型吗？</AlertDialogTitle>
            <AlertDialogDescription>
              切题型可能会清空已维护的信息
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmKindSwitch}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <QuestionBankEditorDialog
        open={bankEditorOpen}
        draftKey={example.questionId || example.bankQuestionId || stemFieldId}
        draft={bankEditorOpen ? exampleToBankDraft(example, knowledgePointName) : null}
        onClose={() => setBankEditorOpen(false)}
        onSave={saveBankEditor}
      />
    </div>
  );
}
