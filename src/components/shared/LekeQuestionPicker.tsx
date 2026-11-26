'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, ChevronDown, ChevronUp, Pencil, Search, X } from 'lucide-react';
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
  MaterialChildTypeSchemeSwitch,
  materialChildTypeText,
  useMaterialChildTypeScheme,
} from '@/components/shared/materialChildTypeScheme';
import { ExampleEditSchemeSwitch, useExampleEditScheme } from '@/components/shared/exampleEditScheme';
import QuestionBankEditorDialog, {
  createEmptyBankEditorDraft,
  type BankEditorDraft,
  type BankEditorKind,
  type BankEditorOrdinaryKind,
} from '@/components/shared/QuestionBankEditorDialog';

const CIRCLED_NUMBERS = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
const BLANK_PATTERN = /____([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|\d+)____/g;

function circledNumber(index: number) {
  const n = index + 1;
  return n <= CIRCLED_NUMBERS.length ? CIRCLED_NUMBERS[n - 1] : String(n);
}

function countBlanks(text: string) {
  return text.match(new RegExp(BLANK_PATTERN.source, 'g'))?.length ?? 0;
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

function BlankText({ text }: { text: string }) {
  const pattern = new RegExp(BLANK_PATTERN.source, 'g');
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(<BlankLine key={key++} label={match[1]} />);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function blankAnswerLines(answer: string, count: number) {
  const lines = answer
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return Array.from({ length: count }, (_, index) => lines[index] ?? '');
}

function BlankAnswerReadout({ answer, count }: { answer: string; count: number }) {
  const lines = blankAnswerLines(answer, count);
  return (
    <div className="space-y-2">
      {lines.map((item, index) => (
        <div key={circledNumber(index)} className="flex items-start gap-2">
          <span className="mt-1 w-5 shrink-0 text-center text-sm leading-6 text-gray-500">{circledNumber(index)}</span>
          <span className="min-h-6 flex-1 border-b border-gray-200 py-1 text-sm leading-relaxed text-gray-700">
            {item.trim() ? item : '暂无'}
          </span>
        </div>
      ))}
    </div>
  );
}

export type BankSource = 'leke' | 'third_party';

export interface BankSubQuestion {
  id: string;
  questionType: string;
  stem: string;
  answer: string;
  analysis: string;
}

export interface BankQuestion {
  id: string;
  source: BankSource;
  platformName: string;
  stem: string;
  answer: string;
  analysis: string;
  questionType: string;
  difficulty: string;
  category?: string;
  level?: string;
  purpose?: 'sync' | 'review' | 'exam';
  purposeSub?: string;
  steps: Array<{ title: string; detail: string }>;
  tips: string[];
  /** 材料题子题。子题题型只允许普通题，不能再套材料题。 */
  children?: BankSubQuestion[];
}

export const MOCK_BANK_QUESTIONS: BankQuestion[] = [
  {
    id: 'leke-q1',
    source: 'leke',
    platformName: '乐课网',
    stem: '判断函数 y = x^(-1) 在 (0, +∞) 上的单调性，并说明理由。',
    answer: '在 (0, +∞) 上单调递减。',
    analysis:
      '该函数为幂函数 y = x^α，其中 α = -1 < 0。由幂函数性质，当 α < 0 时，函数在 (0, +∞) 上单调递减。也可由导数 y′ = -x^(-2) < 0 得到同样结论。',
    questionType: '解答题',
    difficulty: '较易',
    category: '基础题',
    level: '精品',
    purpose: 'sync',
    steps: [
      { title: '识别幂函数', detail: 'α = -1 < 0，属于幂函数。' },
      { title: '判断单调性', detail: 'α < 0，在 (0, +∞) 上单调递减。' },
    ],
    tips: ['负指数对应递减', '注意定义域不含 0'],
  },
  {
    id: 'leke-q2',
    source: 'leke',
    platformName: '乐课网',
    stem: '利用幂函数单调性比较 √2 与 ∛3 的大小。',
    answer: '√2 < ∛3',
    analysis:
      '设 f(x) = ln x / x。比较 √2 与 ∛3 可转化为比较 2^3 与 3^2，即 8 与 9，因此 √2 < ∛3。也可用幂函数 y = x^(1/6) 将两数化为同指数后比较。',
    questionType: '解答题',
    difficulty: '一般',
    category: '拔高题',
    level: '名师',
    purpose: 'review',
    purposeSub: '期中',
    steps: [{ title: '转化比较', detail: '可转化为同底或同指数后比较：2^3 = 8，3^2 = 9，故 √2 < ∛3。' }],
    tips: ['构造合适的幂函数或同指数化辅助比较'],
  },
  {
    id: 'leke-q3',
    source: 'leke',
    platformName: '乐课网',
    stem: '函数 y = x^(2/3) 的定义域是（ ）。\nA. R\nB. [0, +∞)\nC. (0, +∞)\nD. (−∞, 0) ∪ (0, +∞)',
    answer: 'A',
    analysis:
      'y = x^(2/3) = (x^2)^(1/3) 或 (∛x)^2，立方根对一切实数有意义，因此定义域为 R。',
    questionType: '单选题',
    difficulty: '容易',
    category: '基础题',
    level: '精品',
    purpose: 'sync',
    steps: [{ title: '改写解析式', detail: 'x^(2/3) = (∛x)^2，立方根定义域为 R。' }],
    tips: ['分数指数先看根指数奇偶'],
  },
  {
    id: 'leke-q4',
    source: 'leke',
    platformName: '乐课网',
    stem: '若函数 f(x) = x^α 在 (0, +∞) 上单调递增，则 α 的取值范围是______。',
    answer: 'α > 0',
    analysis:
      '幂函数 y = x^α 在 (0, +∞) 上：α > 0 时单调递增，α < 0 时单调递减，α = 0 时为常函数。故填 α > 0。',
    questionType: '填空题',
    difficulty: '较易',
    category: '基础题',
    level: '精品',
    purpose: 'review',
    purposeSub: '月考',
    steps: [{ title: '回忆性质', detail: 'α > 0 时在 (0, +∞) 上递增。' }],
    tips: ['α = 0 是常函数，不算递增'],
  },
  {
    id: 'leke-q5',
    source: 'leke',
    platformName: '乐课网',
    stem: '证明：当 0 < x < 1 时，x − x^2 < sin x < x。若 f(x) = cos ax − ln(1 − x^2) 在 x = 0 处取得极大值，求 a 的取值范围。',
    answer: '(1) 见解析；(2) (−∞, −√2) ∪ (√2, +∞)',
    analysis:
      '【解答】(1) 令 F(x) = x − sin x，F(0) = 0，F′(x) = 1 − cos x ≥ 0，故 sin x < x。再令 G(x) = sin x − x + x^2，由导数与单调性可证 G(x) > 0。\n(2) f′(x) = −a sin ax + 2x/(1 − x^2)，f′(0) = 0。由极大值需 f′′(0) < 0，得 −a^2 + 2 < 0，即 |a| > √2。',
    questionType: '解答题',
    difficulty: '困难',
    category: '综合题',
    level: '名师',
    purpose: 'exam',
    purposeSub: '高考',
    steps: [
      { title: '构造辅助函数证不等式', detail: '分别构造 F(x) = x − sin x 与 G(x) = sin x − x + x^2，用导数判断符号。' },
      { title: '由极大值求参数', detail: 'f′(0) = 0，极大值要求 f′′(0) < 0，得到 |a| > √2。' },
    ],
    tips: ['极值点处一阶导为 0，二阶导符号决定极大/极小'],
  },
  {
    id: 'leke-q6',
    source: 'leke',
    platformName: '乐课网',
    stem: '下列函数中，在 (0, +∞) 上既是幂函数又单调递减的是（ ）。\nA. y = x^2\nB. y = 1/x\nC. y = √x\nD. y = 2^x',
    answer: 'B',
    analysis:
      'A、C 为幂函数但递增；D 是指数函数不是幂函数；B 即 y = x^(-1)，是幂函数且递减。',
    questionType: '单选题',
    difficulty: '容易',
    category: '基础题',
    level: '精品',
    purpose: 'exam',
    purposeSub: '学业水平',
    steps: [{ title: '逐项判断', detail: '只有 y = 1/x 同时满足幂函数且递减。' }],
    tips: ['幂函数系数必须为 1'],
  },
  {
    id: 'third-q1',
    source: 'third_party',
    platformName: '菁优网',
    stem: '梅花花粉的直径约为 0.000036 m，用科学记数法表示为（ ）。\nA. 3.6 × 10^(-4)\nB. 3.6 × 10^(-5)\nC. 3.6 × 10^(-6)\nD. 36 × 10^(-6)',
    answer: 'B',
    analysis:
      '【分析】科学记数法 a × 10^n，其中 1 ≤ |a| < 10。\n【解答】0.000036 = 3.6 × 10^(-5)。\n【点评】小数点向右移动 5 位，指数为 −5。',
    questionType: '单选题',
    difficulty: '容易',
    steps: [{ title: '写成科学记数法', detail: '小数点右移 5 位，得 3.6 × 10^(-5)。' }],
    tips: ['a 必须满足 1 ≤ |a| < 10，故不能选 D'],
  },
  {
    id: 'third-q2',
    source: 'third_party',
    platformName: '菁优网',
    stem: '已知幂函数 f(x) = x^(2m^2 − m − 3) 在 (0, +∞) 上单调递减，求整数 m 的值。',
    answer: 'm = 0 或 m = 1',
    analysis:
      '单调递减需指数 2m^2 − m − 3 < 0。因式分解得 (2m − 3)(m + 1) < 0，即 −1 < m < 3/2。m 为整数，故 m = 0 或 1。',
    questionType: '解答题',
    difficulty: '较难',
    steps: [
      { title: '列不等式', detail: '递减 ⇔ 指数 < 0，即 2m^2 − m − 3 < 0。' },
      { title: '求整数解', detail: '因式分解得 −1 < m < 3/2，整数 m = 0 或 1。' },
    ],
    tips: ['先因式分解再结合整数条件'],
  },
  {
    id: 'third-q3',
    source: 'third_party',
    platformName: '21 世纪网',
    stem: '函数 y = x^α 的图像过点 (2, 4)，则 α = ______。',
    answer: '2',
    analysis: '代入得 2^α = 4 = 2^2，故 α = 2。',
    questionType: '填空题',
    difficulty: '容易',
    steps: [{ title: '代入点的坐标', detail: '2^α = 4，所以 α = 2。' }],
    tips: ['幂函数过定点需满足解析式'],
  },
  {
    id: 'third-q4',
    source: 'third_party',
    platformName: '菁优网',
    stem: '判断：幂函数的系数一定是 1。（　　）',
    answer: '正确',
    analysis: '按定义，形如 y = x^α 的函数才称为幂函数，系数必须为 1。y = 2x^3 不是幂函数。',
    questionType: '判断题',
    difficulty: '较易',
    steps: [{ title: '对照定义', detail: '幂函数解析式为 y = x^α，系数必须为 1。' }],
    tips: ['有系数或加减项都不是幂函数'],
  },
  {
    id: 'leke-q7',
    source: 'leke',
    platformName: '乐课网',
    stem: '阅读材料：反比例函数 y = k/x（k ≠ 0）的图象是双曲线。k > 0 时在第一、三象限，k < 0 时在第二、四象限。',
    answer: '',
    analysis: '',
    questionType: '材料题',
    difficulty: '一般',
    category: '基础题',
    level: '精品',
    purpose: 'sync',
    steps: [],
    tips: [],
    children: [
      {
        id: 'leke-q7-1',
        questionType: '多选题',
        stem: '当 k > 0 时，下列说法正确的有（ ）。\nA. 图象位于第一、三象限\nB. 图象关于原点对称\nC. 图象位于第二、四象限\nD. 图象与坐标轴相交',
        answer: 'A、B',
        analysis: 'k > 0 时，图象在第一、三象限，并且关于原点对称。它不在第二、四象限，也不与坐标轴相交。',
      },
      {
        id: 'leke-q7-2',
        questionType: '填空题',
        stem: '若点 (2, 3) 在该函数图象上，则 k = ____①____；若点 (-1, 4) 在该函数图象上，则 k = ____②____。',
        answer: '6\n-4',
        analysis: 'k = xy。点 (2, 3) 时 k = 2 × 3 = 6；点 (-1, 4) 时 k = (-1) × 4 = -4。',
      },
    ],
  },
];

const QUESTION_TYPE_FILTERS = [
  { id: 'all', label: '全部题型' },
  { id: 'single', label: '单选题' },
  { id: 'multiple', label: '多选题' },
  { id: 'judge', label: '判断题' },
  { id: 'blank', label: '填空题' },
  { id: 'qa', label: '问答题' },
  { id: 'material', label: '材料题' },
];

const OPTION_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function bankKind(question: BankQuestion): BankEditorKind {
  if (question.questionType.includes('材料') || (question.children?.length ?? 0) > 0) return 'material';
  if (question.questionType.includes('多选')) return 'multiple';
  if (question.questionType.includes('单选') || question.questionType.includes('选择')) return 'single';
  if (question.questionType.includes('判断')) return 'judge';
  if (question.questionType.includes('填空')) return 'blank';
  return 'qa';
}

function ordinaryKind(questionType: string): BankEditorOrdinaryKind {
  const kind = bankKind({ questionType } as BankQuestion);
  return kind === 'material' ? 'qa' : kind;
}

function splitChoiceStem(stem: string) {
  const stemLines: string[] = [];
  const found: Array<{ key: string; text: string }> = [];
  stem.replace(/\r\n/g, '\n').split('\n').forEach((line) => {
    const match = line.match(/^\s*([A-Z])\s*[.、．]\s*(.*)$/);
    if (match) found.push({ key: match[1], text: match[2].trim() });
    else stemLines.push(line);
  });
  if (found.length < 2) return null;
  return {
    stem: stemLines.join('\n').trim(),
    options: found.map((item, index) => ({ key: OPTION_KEYS[index], text: item.text })),
  };
}

function joinChoiceStem(stem: string, options: Array<{ key: string; text: string }>) {
  const lines = options.map((item) => `${item.key}. ${item.text}`.trim());
  return [stem.trim(), ...lines].filter((line) => line.length > 0).join('\n');
}

function kindLabel(kind: BankEditorKind | BankEditorOrdinaryKind) {
  if (kind === 'single') return '单选题';
  if (kind === 'multiple') return '多选题';
  if (kind === 'judge') return '判断题';
  if (kind === 'blank') return '填空题';
  if (kind === 'material') return '材料题';
  return '问答题';
}

function purposeLabel(question: BankQuestion) {
  if (question.purposeSub?.includes('高考')) return '升学频道 / 高考 / 高考模拟';
  if (question.purposeSub?.includes('学业')) return '升学频道 / 学业水平';
  if (question.purpose === 'review') return question.purposeSub?.includes('月考') ? '复习 / 月考' : '复习 / 期中';
  if (question.purpose === 'sync') return '同步课';
  return '升学频道 / 高考 / 高考模拟';
}

function bankToDraft(question: BankQuestion, knowledgePoint?: string): BankEditorDraft {
  const kind = bankKind(question);
  const base = createEmptyBankEditorDraft(knowledgePoint);
  const choice = kind !== 'material' && (kind === 'single' || kind === 'multiple') ? splitChoiceStem(question.stem) : null;
  return {
    ...base,
    kind,
    stem: choice?.stem ?? question.stem,
    options: choice?.options ?? (kind === 'single' || kind === 'multiple' ? base.options : []),
    answer: kind === 'material' ? '' : question.answer,
    analysis: kind === 'material' ? '' : question.analysis,
    category: question.category || base.category,
    level: question.level || base.level,
    difficulty: question.difficulty || base.difficulty,
    purpose: purposeLabel(question),
    children:
      kind === 'material'
        ? (question.children || []).map((child) => {
            const childKind = ordinaryKind(child.questionType);
            const childChoice = childKind === 'single' || childKind === 'multiple' ? splitChoiceStem(child.stem) : null;
            return {
              id: child.id,
              kind: childKind,
              stem: childChoice?.stem ?? child.stem,
              options: childChoice?.options ?? [],
              answer: child.answer,
              analysis: child.analysis,
            };
          })
        : [],
  };
}

function applyDraftToBank(question: BankQuestion, draft: BankEditorDraft) {
  question.questionType = kindLabel(draft.kind);
  question.difficulty = draft.difficulty;
  question.category = draft.category;
  question.level = draft.level;
  if (draft.kind === 'material') {
    question.stem = draft.stem;
    question.answer = '';
    question.analysis = '';
    question.children = draft.children.map((child) => ({
      id: child.id,
      questionType: kindLabel(child.kind),
      stem: child.kind === 'single' || child.kind === 'multiple' ? joinChoiceStem(child.stem, child.options) : child.stem,
      answer: child.answer,
      analysis: child.analysis,
    }));
    return;
  }
  question.children = undefined;
  question.stem =
    draft.kind === 'single' || draft.kind === 'multiple' ? joinChoiceStem(draft.stem, draft.options) : draft.stem;
  question.answer = draft.answer;
  question.analysis = draft.analysis;
}

function matchesQuestionType(question: BankQuestion, filter: string) {
  if (filter === 'all') return true;
  const isMaterial = question.questionType.includes('材料') || (question.children?.length ?? 0) > 0;
  if (isMaterial) return filter === 'material';
  if (question.questionType.includes('多选')) return filter === 'multiple';
  if (question.questionType.includes('单选') || question.questionType.includes('选择')) return filter === 'single';
  if (question.questionType.includes('判断')) return filter === 'judge';
  if (question.questionType.includes('填空')) return filter === 'blank';
  return filter === 'qa';
}

interface LekeQuestionPickerProps {
  open: boolean;
  hasExistingContent: boolean;
  knowledgePointName?: string;
  onClose: () => void;
  onSelect: (question: BankQuestion) => void;
}

export default function LekeQuestionPicker({
  open,
  hasExistingContent,
  knowledgePointName,
  onClose,
  onSelect,
}: LekeQuestionPickerProps) {
  const [keyword, setKeyword] = useState('');
  const childTypeScheme = useMaterialChildTypeScheme();
  const editScheme = useExampleEditScheme();
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<BankQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [bankRev, setBankRev] = useState(0);

  const list = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return MOCK_BANK_QUESTIONS.filter((item) => {
      if (q && !item.stem.toLowerCase().includes(q)) return false;
      return matchesQuestionType(item, typeFilter);
    });
  }, [keyword, typeFilter, bankRev]);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new Event('req-markers-rescan'));
    return () => {
      window.dispatchEvent(new Event('req-markers-rescan'));
    };
  }, [open]);

  if (!open) return null;

  const requestSelect = (question: BankQuestion) => {
    if (hasExistingContent) {
      setPending(question);
      return;
    }
    onSelect(question);
  };

  const confirmSelect = () => {
    if (!pending) return;
    onSelect(pending);
    setPending(null);
  };

  const handleClose = () => {
    setKeyword('');
    setTypeFilter('all');
    setExpandedId(null);
    setPending(null);
    setEditingQuestion(null);
    onClose();
  };

  return createPortal(
    <>
      <div
        data-req-surface="picker"
        className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-5"
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[88vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-semibold text-gray-900">
                <span
                  className="req-anchor-inline"
                  data-req-anchor="knowledge-tree.knowledge-card.picker"
                >
                  典型例题
                </span>
              </h3>
              <MaterialChildTypeSchemeSwitch />
              <span className="req-anchor-inline" data-req-anchor="knowledge-tree.knowledge-card.edit-scheme">
                <ExampleEditSchemeSwitch />
              </span>
            </div>
            <button
              type="button"
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              onClick={handleClose}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-5 pt-4 pb-3 shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索题干关键词"
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="筛选题型"
                className="h-9 w-32 shrink-0 px-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {QUESTION_TYPE_FILTERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-400">
              共 <span className="text-gray-600 font-medium">{list.length}</span> 题
            </div>
          </div>

          <div
            className="req-anchor-host flex-1 min-h-0 overflow-y-auto px-5 pb-5 space-y-3"
            data-req-anchor="knowledge-tree.knowledge-card.picker-question"
          >
            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Search className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">暂无符合条件的题目</p>
              </div>
            ) : (
              list.map((q) => {
                const expanded = expandedId === q.id;
                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border bg-white overflow-hidden transition-all ${
                      expanded
                        ? 'border-emerald-200 shadow-sm ring-1 ring-emerald-100'
                        : 'border-gray-200 hover:border-emerald-200 hover:shadow-sm hover:ring-1 hover:ring-emerald-100'
                    }`}
                  >
                    <div className="flex items-start">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left px-4 pt-3.5 pb-3"
                      onClick={() => setExpandedId(expanded ? null : q.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center h-6 px-2 rounded-md bg-gray-100 text-[12px] font-bold text-gray-900">
                              {q.questionType}
                            </span>
                            {q.difficulty ? (
                              <span className="text-[12px] text-gray-800">{q.difficulty}</span>
                            ) : null}
                            {q.children && q.children.length > 0 ? (
                              <span className="text-[11px] text-gray-400">{q.children.length} 道子题</span>
                            ) : null}
                          </div>
                          <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-[1.7]">
                            {q.stem}
                          </p>
                        </div>
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            expanded
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </div>
                    </button>
                    {editScheme === 'bank' ? (
                      <span
                        className={list.indexOf(q) === 0 ? 'req-anchor-inline' : undefined}
                        {...(list.indexOf(q) === 0
                          ? { 'data-req-anchor': 'knowledge-tree.knowledge-card.bank-editor' }
                          : {})}
                      >
                        <button
                          type="button"
                          aria-label="编辑"
                          title="编辑"
                          className="mr-3 mt-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-teal-200 text-teal-600 hover:bg-teal-50"
                          onClick={() => setEditingQuestion(q)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : null}
                    </div>

                    {expanded ? (
                      <div className="px-4 pb-3">
                        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3.5 py-3 space-y-3">
                          {q.children && q.children.length > 0 ? (
                            q.children.map((child, index) => (
                              <div key={child.id} className={index > 0 ? 'pt-3 border-t border-slate-200/80' : ''}>
                                <div className="flex items-baseline text-[13px] leading-relaxed text-gray-800">
                                  <span className="shrink-0 font-normal">（{index + 1}）</span>
                                  <p className="min-w-0 whitespace-pre-wrap">
                                    {materialChildTypeText(
                                      child.questionType,
                                      childTypeScheme,
                                      child.questionType.includes('多选')
                                    )}
                                    {countBlanks(child.stem) > 0 ? <BlankText text={child.stem} /> : child.stem}
                                  </p>
                                </div>
                                <div className="mt-2 text-[11px] font-semibold text-emerald-700 mb-1">答案</div>
                                {countBlanks(child.stem) > 0 ? (
                                  <BlankAnswerReadout answer={child.answer} count={countBlanks(child.stem)} />
                                ) : (
                                  <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {child.answer || '暂无'}
                                  </p>
                                )}
                                <div className="mt-2 text-[11px] font-semibold text-amber-700 mb-1">解析</div>
                                <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-[1.7]">
                                  {child.analysis || '暂无'}
                                </p>
                              </div>
                            ))
                          ) : (
                            <>
                              <div>
                                <div className="text-[11px] font-semibold text-emerald-700 mb-1">答案</div>
                                <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                                  {q.answer || '暂无'}
                                </p>
                              </div>
                              <div className="h-px bg-slate-200/80" />
                              <div>
                                <div className="text-[11px] font-semibold text-amber-700 mb-1">解析</div>
                                <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-[1.7]">
                                  {q.analysis || '暂无'}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-end">
                      {list.indexOf(q) === 0 ? (
                        <span
                          className="req-anchor-inline"
                          data-req-anchor="knowledge-tree.knowledge-card.picker-select"
                        >
                          <button
                            type="button"
                            className="h-8 px-4 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            onClick={() => requestSelect(q)}
                          >
                            选用
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="h-8 px-4 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          onClick={() => requestSelect(q)}
                        >
                          选用
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(next) => !next && setPending(null)}>
        <AlertDialogContent className="z-[1300]" overlayClassName="z-[1300]">
          <AlertDialogHeader>
            <AlertDialogTitle>覆盖已有例题？</AlertDialogTitle>
            <AlertDialogDescription>
              当前考点已有一道典型例题。选用后会换成这道题，原来的例题不再保留。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmSelect}
            >
              确认选用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuestionBankEditorDialog
        open={!!editingQuestion}
        draftKey={editingQuestion?.id}
        draft={editingQuestion ? bankToDraft(editingQuestion, knowledgePointName) : null}
        onClose={() => setEditingQuestion(null)}
        onSave={(draft) => {
          if (editingQuestion) {
            applyDraftToBank(editingQuestion, draft);
            setBankRev((value) => value + 1);
          }
          setEditingQuestion(null);
        }}
      />
    </>,
    document.body
  );
}
