'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
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

export type BankSource = 'leke' | 'third_party';

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
];

interface LekeQuestionPickerProps {
  open: boolean;
  hasExistingContent: boolean;
  onClose: () => void;
  onSelect: (question: BankQuestion) => void;
}

export default function LekeQuestionPicker({
  open,
  hasExistingContent,
  onClose,
  onSelect,
}: LekeQuestionPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<BankQuestion | null>(null);

  const list = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return MOCK_BANK_QUESTIONS;
    return MOCK_BANK_QUESTIONS.filter((item) => item.stem.toLowerCase().includes(q));
  }, [keyword]);

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
    setExpandedId(null);
    setPending(null);
    onClose();
  };

  return createPortal(
    <>
      <div
        data-req-surface="picker"
        className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-5"
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-semibold text-gray-900">
                <span
                  className="req-anchor-inline"
                  data-req-anchor="knowledge-tree.knowledge-card.picker"
                >
                  典型例题
                </span>
              </h3>
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
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索题干关键词"
                className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="text-xs text-gray-400">
              共 <span className="text-gray-600 font-medium">{list.length}</span> 题
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 space-y-3">
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
                    <button
                      type="button"
                      className="w-full text-left px-4 pt-3.5 pb-3"
                      onClick={() => setExpandedId(expanded ? null : q.id)}
                    >
                      <div className="flex items-start gap-3">
                        <p className="flex-1 min-w-0 text-[13px] text-gray-800 whitespace-pre-wrap leading-[1.7]">
                          {q.stem}
                        </p>
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

                    {expanded && (
                      <div className="px-4 pb-3">
                        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3.5 py-3 space-y-3">
                          <div>
                            <div className="text-[11px] font-semibold text-emerald-700 mb-1">
                              答案
                            </div>
                            <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {q.answer}
                            </p>
                          </div>
                          <div className="h-px bg-slate-200/80" />
                          <div>
                            <div className="text-[11px] font-semibold text-amber-700 mb-1">
                              解析
                            </div>
                            <p className="text-[13px] text-gray-700 whitespace-pre-wrap leading-[1.7]">
                              {q.analysis}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
              当前考点已有典型例题，选用后将覆盖题干、解题步骤和解题要点。是否继续？
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
    </>,
    document.body
  );
}
