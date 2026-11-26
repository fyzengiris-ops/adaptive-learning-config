'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlignLeft, Image as ImageIcon, Info, Redo2, Star, Table2, Trash2, Undo2, X } from 'lucide-react';

export type BankEditorKind = 'single' | 'multiple' | 'judge' | 'blank' | 'qa' | 'material';
export type BankEditorOrdinaryKind = Exclude<BankEditorKind, 'material'>;

export interface BankEditorOption {
  key: string;
  text: string;
}

export interface BankEditorChild {
  id: string;
  kind: BankEditorOrdinaryKind;
  stem: string;
  options: BankEditorOption[];
  answer: string;
  analysis: string;
}

export interface BankEditorDraft {
  stageSubject: string;
  kind: BankEditorKind;
  stem: string;
  options: BankEditorOption[];
  answer: string;
  analysis: string;
  purpose: string;
  version: string;
  knowledgePoints: string[];
  category: string;
  year: string;
  region: string;
  level: string;
  difficulty: string;
  children: BankEditorChild[];
}

const OPTION_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIFFICULTIES = ['容易', '较易', '一般', '较难', '困难'] as const;
const KIND_OPTIONS: Array<{ id: BankEditorKind; label: string }> = [
  { id: 'single', label: '单选题' },
  { id: 'multiple', label: '多选题' },
  { id: 'judge', label: '判断题' },
  { id: 'blank', label: '填空题' },
  { id: 'qa', label: '问答题' },
  { id: 'material', label: '材料题' },
];
const ORDINARY_KINDS = KIND_OPTIONS.filter((item) => item.id !== 'material');
const STAGE_SUBJECTS = ['初中数学', '高中数学', '高中物理'];
const PURPOSES = ['同步课', '复习 / 期中', '复习 / 月考', '升学频道 / 高考 / 高考模拟', '升学频道 / 学业水平'];
const VERSIONS = ['人教版（2019）', '北师大版', '沪教版'];
const CATEGORIES = ['基础题', '拔高题', '综合题'];
const YEARS = ['2024', '2025', '2026'];
const REGIONS = ['', '全国', '北京', '上海', '浙江'];
const LEVELS = ['普通', '精品', '名师'];
const KNOWLEDGE_PRESETS = ['温度与分子动能的关系', '反比例函数', '一次函数', '二次函数'];

const metaByKey = new Map<string, Pick<
  BankEditorDraft,
  'stageSubject' | 'purpose' | 'version' | 'knowledgePoints' | 'category' | 'year' | 'region' | 'level' | 'difficulty'
>>();

function isChoice(kind: string) {
  return kind === 'single' || kind === 'multiple';
}

function emptyOptions(count = 4): BankEditorOption[] {
  return OPTION_KEYS.slice(0, count).map((key) => ({ key, text: '' }));
}

function reletter(options: BankEditorOption[]) {
  return options.map((item, index) => ({ ...item, key: OPTION_KEYS[index] }));
}

function selectedKeys(answer: string) {
  return answer.toUpperCase().match(/[A-Z]/g) ?? [];
}

function childId() {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function MiniToolbar() {
  const items: React.ReactNode[] = [
    <span key="b" className="px-1 font-bold">B</span>,
    <span key="i" className="px-1 italic">I</span>,
    <span key="u" className="px-1 underline">U</span>,
    <span key="sup" className="px-1 text-[11px]">x²</span>,
    <span key="sub" className="px-1 text-[11px]">x₂</span>,
    <ImageIcon key="img" className="h-3.5 w-3.5" />,
    <Table2 key="table" className="h-3.5 w-3.5" />,
    <AlignLeft key="align" className="h-3.5 w-3.5" />,
    <Undo2 key="undo" className="h-3.5 w-3.5" />,
    <Redo2 key="redo" className="h-3.5 w-3.5" />,
  ];
  return (
    <div className="flex items-center gap-0.5 border border-b-0 border-[#e5e5e5] bg-[#fafafa] px-1 py-1 text-[#4b5563]">
      {items.map((item, index) => (
        <span key={index} className="inline-flex h-6 min-w-6 items-center justify-center text-[13px]">
          {item}
        </span>
      ))}
    </div>
  );
}

function ImageSideButton() {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[#1abc9c] text-[#1abc9c]">
      <ImageIcon className="h-4 w-4" />
    </span>
  );
}

function FormRow({
  label,
  required,
  children,
  align = 'start',
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  align?: 'start' | 'center';
}) {
  return (
    <div className="flex border-b border-[#ececec]">
      <div
        className={`flex w-[112px] shrink-0 justify-end bg-[#f7f7f7] px-3 py-3 text-sm text-[#555] ${
          align === 'center' ? 'items-center' : 'items-start'
        }`}
      >
        {required ? <span className="mr-0.5 text-[#e74c3c]">*</span> : null}
        <span>
          {label}：
        </span>
      </div>
      <div className="min-w-0 flex-1 px-3 py-3">{children}</div>
    </div>
  );
}

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[#555]">
        <span className="mr-0.5 text-[#e74c3c]">*</span>
        {label}：
      </span>
      {children}
    </label>
  );
}

const selectClass =
  'h-8 w-full rounded-sm border border-[#d9d9d9] bg-white px-2 text-sm text-[#333] outline-none focus:border-[#1abc9c]';

function ChoiceRows({
  name,
  multiple,
  options,
  answer,
  onChange,
}: {
  name: string;
  multiple: boolean;
  options: BankEditorOption[];
  answer: string;
  onChange: (options: BankEditorOption[], answer: string) => void;
}) {
  const picked = new Set(selectedKeys(answer));
  const canDelete = options.length > 2;
  const canAdd = options.length < OPTION_KEYS.length;

  const setPicked = (key: string, nextOn: boolean) => {
    if (!multiple) {
      onChange(options, nextOn ? key : '');
      return;
    }
    const next = new Set(picked);
    if (nextOn) next.add(key);
    else next.delete(key);
    onChange(
      options,
      options.filter((item) => next.has(item.key)).map((item) => item.key).join('、'),
    );
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div key={option.key} className="flex items-start gap-2">
          <label className="mt-1.5 inline-flex shrink-0 items-center gap-1.5 text-sm text-[#333]">
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              checked={picked.has(option.key)}
              onChange={(event) => setPicked(option.key, event.target.checked)}
            />
            {option.key}.
          </label>
          <div className="min-w-0 flex-1">
            <MiniToolbar />
            <textarea
              value={option.text}
              onChange={(event) =>
                onChange(
                  options.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, text: event.target.value } : item,
                  ),
                  answer,
                )
              }
              className="min-h-[72px] w-full resize-y border border-[#e5e5e5] px-2 py-1.5 text-sm text-[#333] outline-none focus:border-[#1abc9c]"
            />
          </div>
          <ImageSideButton />
          {canDelete ? (
            <button
              type="button"
              aria-label={`删除${option.key}选项`}
              className="inline-flex h-8 w-8 items-center justify-center text-[#1abc9c]"
              onClick={() => {
                const nextOptions = reletter(options.filter((_, itemIndex) => itemIndex !== index));
                const nextAnswer = options
                  .flatMap((item, itemIndex) => {
                    if (itemIndex === index || !picked.has(item.key)) return [];
                    const nextIndex = itemIndex > index ? itemIndex - 1 : itemIndex;
                    return [OPTION_KEYS[nextIndex]];
                  })
                  .join('、');
                onChange(nextOptions, nextAnswer);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-8" />
          )}
        </div>
      ))}
      {canAdd ? (
        <button
          type="button"
          className="rounded-sm bg-[#f07868] px-3 py-1 text-sm text-white hover:bg-[#e56b5b]"
          onClick={() => onChange(reletter([...options, { key: '', text: '' }]), answer)}
        >
          添加选项
        </button>
      ) : null}
    </div>
  );
}

export default function QuestionBankEditorDialog({
  open,
  draftKey,
  draft,
  onClose,
  onSave,
}: {
  open: boolean;
  draftKey?: string;
  draft: BankEditorDraft | null;
  onClose: () => void;
  onSave: (draft: BankEditorDraft) => void;
}) {
  const [form, setForm] = useState<BankEditorDraft | null>(draft);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!open) return;
    const source = draftRef.current;
    if (!source) return;
    const remembered = draftKey ? metaByKey.get(draftKey) : undefined;
    setForm(
      remembered
        ? {
            ...source,
            ...remembered,
            kind: source.kind,
            stem: source.stem,
            options: source.options,
            answer: source.answer,
            analysis: source.analysis,
            children: source.children,
          }
        : source,
    );
  }, [open, draftKey]);

  if (!open || !form) return null;

  const patch = (partial: Partial<BankEditorDraft>) => setForm((prev) => (prev ? { ...prev, ...partial } : prev));

  const changeKind = (kind: BankEditorKind) => {
    setForm((prev) => {
      if (!prev) return prev;
      const options = isChoice(kind) && prev.options.length < 2 ? emptyOptions(4) : prev.options;
      const letters = selectedKeys(prev.answer);
      const answer = kind === 'single' ? letters[0] ?? '' : prev.answer;
      return { ...prev, kind, options, answer };
    });
  };

  const addKnowledge = (name: string) => {
    if (!name || form.knowledgePoints.includes(name)) return;
    patch({ knowledgePoints: [...form.knowledgePoints, name] });
  };

  const save = () => {
    if (draftKey) {
      metaByKey.set(draftKey, {
        stageSubject: form.stageSubject,
        purpose: form.purpose,
        version: form.version,
        knowledgePoints: form.knowledgePoints,
        category: form.category,
        year: form.year,
        region: form.region,
        level: form.level,
        difficulty: form.difficulty,
      });
    }
    onSave(form);
  };

  const knowledgeChoices = Array.from(new Set([...KNOWLEDGE_PRESETS, ...form.knowledgePoints]));

  return createPortal(
    <div
      data-req-surface="bank-editor"
      className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/45 p-4"
    >
      <div
        data-req-anchor="knowledge-tree.knowledge-card.bank-editor"
        className="flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden bg-[#f3f4f6] shadow-2xl"
      >
        <div className="flex shrink-0 items-start gap-2 border-b border-[#eee] bg-white px-4 py-2 text-xs leading-5 text-[#666]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1abc9c]" />
          <p>
            您可以点击下载
            <span className="mx-1 text-[#1abc9c]">粘贴图片插件</span>
            （该插件支持 IE、360、火狐等浏览器，安装后可以直接从 Word 上复制图片和公式！）。安装成功后，需重启浏览器。
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="flex border border-[#e6e6e6] bg-white">
            <div className="min-w-0 flex-1 border-r border-[#eee]">
              <FormRow label="学段科目" required align="center">
                <select
                  aria-label="学段科目"
                  className={`${selectClass} max-w-[220px]`}
                  value={form.stageSubject}
                  onChange={(event) => patch({ stageSubject: event.target.value })}
                >
                  {STAGE_SUBJECTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="题型" required align="center">
                <select
                  aria-label="题型"
                  className={`${selectClass} max-w-[220px]`}
                  value={form.kind}
                  onChange={(event) => changeKind(event.target.value as BankEditorKind)}
                >
                  {KIND_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="题干内容">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <MiniToolbar />
                    <textarea
                      aria-label="题干内容"
                      value={form.stem}
                      onChange={(event) => patch({ stem: event.target.value })}
                      className="min-h-[96px] w-full resize-y border border-[#e5e5e5] px-2 py-1.5 text-sm leading-6 text-[#333] outline-none focus:border-[#1abc9c]"
                    />
                  </div>
                  <ImageSideButton />
                </div>
              </FormRow>

              {isChoice(form.kind) ? (
                <FormRow label="选项">
                  <ChoiceRows
                    name="bank-editor-choice"
                    multiple={form.kind === 'multiple'}
                    options={form.options}
                    answer={form.answer}
                    onChange={(options, answer) => patch({ options, answer })}
                  />
                </FormRow>
              ) : form.kind !== 'material' ? (
                <FormRow label="答案">
                  <input
                    aria-label="答案"
                    value={form.answer}
                    onChange={(event) => patch({ answer: event.target.value })}
                    className="h-8 w-full rounded-sm border border-[#d9d9d9] px-2 text-sm outline-none focus:border-[#1abc9c]"
                  />
                </FormRow>
              ) : (
                <FormRow label="子题">
                  <div className="space-y-3">
                    {form.children.map((child, index) => (
                      <div key={child.id} className="space-y-2 rounded-sm border border-[#eee] bg-[#fafafa] p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#666]">（{index + 1}）</span>
                          <select
                            aria-label={`子题${index + 1}题型`}
                            className={`${selectClass} max-w-[140px]`}
                            value={child.kind}
                            onChange={(event) => {
                              const kind = event.target.value as BankEditorOrdinaryKind;
                              patch({
                                children: form.children.map((item) =>
                                  item.id === child.id
                                    ? {
                                        ...item,
                                        kind,
                                        options: isChoice(kind) && item.options.length < 2 ? emptyOptions(4) : item.options,
                                      }
                                    : item,
                                ),
                              });
                            }}
                          >
                            {ORDINARY_KINDS.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="ml-auto text-[#1abc9c]"
                            aria-label={`删除子题${index + 1}`}
                            onClick={() => patch({ children: form.children.filter((item) => item.id !== child.id) })}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <textarea
                          aria-label={`子题${index + 1}题干`}
                          value={child.stem}
                          onChange={(event) =>
                            patch({
                              children: form.children.map((item) =>
                                item.id === child.id ? { ...item, stem: event.target.value } : item,
                              ),
                            })
                          }
                          className="min-h-[64px] w-full resize-y border border-[#e5e5e5] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#1abc9c]"
                        />
                        {isChoice(child.kind) ? (
                          <ChoiceRows
                            name={`bank-editor-${child.id}`}
                            multiple={child.kind === 'multiple'}
                            options={child.options}
                            answer={child.answer}
                            onChange={(options, answer) =>
                              patch({
                                children: form.children.map((item) =>
                                  item.id === child.id ? { ...item, options, answer } : item,
                                ),
                              })
                            }
                          />
                        ) : (
                          <input
                            aria-label={`子题${index + 1}答案`}
                            value={child.answer}
                            placeholder="答案"
                            onChange={(event) =>
                              patch({
                                children: form.children.map((item) =>
                                  item.id === child.id ? { ...item, answer: event.target.value } : item,
                                ),
                              })
                            }
                            className="h-8 w-full rounded-sm border border-[#d9d9d9] bg-white px-2 text-sm outline-none focus:border-[#1abc9c]"
                          />
                        )}
                        <input
                          aria-label={`子题${index + 1}解析`}
                          value={child.analysis}
                          placeholder="解析"
                          onChange={(event) =>
                            patch({
                              children: form.children.map((item) =>
                                item.id === child.id ? { ...item, analysis: event.target.value } : item,
                              ),
                            })
                          }
                          className="h-8 w-full rounded-sm border border-[#d9d9d9] bg-white px-2 text-sm outline-none focus:border-[#1abc9c]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="rounded-sm bg-[#f07868] px-3 py-1 text-sm text-white hover:bg-[#e56b5b]"
                      onClick={() =>
                        patch({
                          children: [
                            ...form.children,
                            { id: childId(), kind: 'qa', stem: '', options: [], answer: '', analysis: '' },
                          ],
                        })
                      }
                    >
                      添加子题
                    </button>
                  </div>
                </FormRow>
              )}

              {form.kind !== 'material' ? (
                <FormRow label="解析" align="center">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="解析"
                      value={form.analysis}
                      onChange={(event) => patch({ analysis: event.target.value })}
                      className="h-8 min-w-0 flex-1 rounded-sm border border-[#d9d9d9] px-2 text-sm outline-none focus:border-[#1abc9c]"
                    />
                    <span className="inline-flex h-8 w-8 items-center justify-center text-[#1abc9c]">✎</span>
                  </div>
                </FormRow>
              ) : null}
            </div>

            <aside className="w-[270px] shrink-0">
              <div className="bg-[#1abc9c] px-3 py-2 text-sm font-medium text-white">设置</div>
              <div className="space-y-3 p-3">
                <SettingField label="用途">
                  <select className={selectClass} value={form.purpose} onChange={(event) => patch({ purpose: event.target.value })}>
                    {PURPOSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </SettingField>
                <SettingField label="版本">
                  <select className={selectClass} value={form.version} onChange={(event) => patch({ version: event.target.value })}>
                    {VERSIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </SettingField>
                <SettingField label="知识点">
                  <div className="flex min-h-8 flex-wrap items-center gap-1 rounded-sm border border-[#d9d9d9] px-1.5 py-1">
                    {form.knowledgePoints.map((point) => (
                      <span key={point} className="inline-flex items-center gap-1 rounded-sm border border-[#e5e5e5] bg-white px-1.5 py-0.5 text-xs text-[#333]">
                        {point}
                        <button
                          type="button"
                          aria-label={`移除${point}`}
                          className="text-[#999]"
                          onClick={() => patch({ knowledgePoints: form.knowledgePoints.filter((item) => item !== point) })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <select
                      aria-label="知识点"
                      className="h-6 min-w-[72px] flex-1 border-0 bg-transparent text-sm text-[#666] outline-none"
                      value=""
                      onChange={(event) => {
                        addKnowledge(event.target.value);
                        event.target.value = '';
                      }}
                    >
                      <option value="">请选择</option>
                      {knowledgeChoices.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </SettingField>
                <SettingField label="类型">
                  <select className={selectClass} value={form.category} onChange={(event) => patch({ category: event.target.value })}>
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </SettingField>
                <SettingField label="年份">
                  <select className={selectClass} value={form.year} onChange={(event) => patch({ year: event.target.value })}>
                    {YEARS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </SettingField>
                <SettingField label="地区">
                  <select className={selectClass} value={form.region} onChange={(event) => patch({ region: event.target.value })}>
                    {REGIONS.map((item) => (
                      <option key={item || 'empty'} value={item}>
                        {item || '请选择'}
                      </option>
                    ))}
                  </select>
                </SettingField>
                <SettingField label="级别">
                  <select className={selectClass} value={form.level} onChange={(event) => patch({ level: event.target.value })}>
                    {LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </SettingField>
                <div>
                  <span className="mb-1 block text-sm text-[#555]">
                    <span className="mr-0.5 text-[#e74c3c]">*</span>
                    难易度：
                  </span>
                  <div className="flex items-center gap-1">
                    {DIFFICULTIES.map((item, index) => {
                      const active = index < DIFFICULTIES.indexOf(form.difficulty as (typeof DIFFICULTIES)[number]) + 1;
                      return (
                        <button key={item} type="button" aria-label={item} onClick={() => patch({ difficulty: item })}>
                          <Star className={`h-5 w-5 ${active ? 'fill-[#f05a4a] text-[#f05a4a]' : 'fill-[#d9d9d9] text-[#d9d9d9]'}`} />
                        </button>
                      );
                    })}
                    <span className="ml-1 text-sm text-[#666]">{form.difficulty}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-3 py-4">
          <button
            type="button"
            className="h-8 rounded-sm bg-[#1abc9c] px-6 text-sm text-white hover:bg-[#17a589]"
            onClick={save}
          >
            保存
          </button>
          <button
            type="button"
            className="h-8 rounded-sm border border-[#d9d9d9] bg-[#f5f5f5] px-6 text-sm text-[#666] hover:bg-[#eee]"
            onClick={onClose}
          >
            取消
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function createEmptyBankEditorDraft(knowledgePoint?: string): BankEditorDraft {
  return {
    stageSubject: '初中数学',
    kind: 'single',
    stem: '',
    options: emptyOptions(4),
    answer: '',
    analysis: '',
    purpose: '升学频道 / 高考 / 高考模拟',
    version: '人教版（2019）',
    knowledgePoints: knowledgePoint ? [knowledgePoint] : [],
    category: '基础题',
    year: '2026',
    region: '',
    level: '普通',
    difficulty: '一般',
    children: [],
  };
}
