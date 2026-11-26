'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { LogicSection } from '@/data/requirements/schema';

/**
 * 需求正文的编辑、删除、标色开关。
 * 现在是仅查看。要恢复这套能力，把下面改成 true。
 * 右侧 PRD 面板和角标浮层都读这个开关。
 *
 * 恢复后的做法：
 * - 编辑：点击小标题或正文进入输入。失焦或 Enter 保存，Escape 取消。多行正文用 Ctrl 或 Cmd + Enter 保存。
 * - 删除：小标题旁的 × 删掉整段；每条内容旁的 × 删掉这一条。
 * - 新增：段内「添加内容」；底部「添加小标题」，会带上标题「新小标题」和一条空内容。
 * - 标色：每条内容旁的「标色」。没有选中文字时，给整条上色，再点一次取消。正在编辑并选中一段时，只给选中的文字上色。
 *   上色的文字存在正文里，用 U+E000 开头、U+E001 结尾包住。展示时拆成 .prd-logic-accent，颜色 #c2410c，字重 600。
 *   保存走 saveRequirementLogic，写入本机，并回写注册表文件。
 * - 浮层标题：双击标题可改需求名称，同样受这个开关控制。
 */
export const REQUIREMENT_LOGIC_EDITING = false;

const ACCENT_OPEN = '\uE000';
const ACCENT_CLOSE = '\uE001';

function hasAccent(text: string) {
  return text.includes(ACCENT_OPEN);
}

function toggleAccent(text: string, start: number, end: number) {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  if (from === to) {
    const plain = text.replaceAll(ACCENT_OPEN, '').replaceAll(ACCENT_CLOSE, '');
    if (!plain.trim()) return text;
    return hasAccent(text) ? plain : `${ACCENT_OPEN}${plain}${ACCENT_CLOSE}`;
  }
  const selected = text.slice(from, to);
  const plain = selected.replaceAll(ACCENT_OPEN, '').replaceAll(ACCENT_CLOSE, '');
  if (!plain) return text;
  const wrapped = selected.startsWith(ACCENT_OPEN) && selected.endsWith(ACCENT_CLOSE);
  const next = wrapped ? plain : `${ACCENT_OPEN}${plain}${ACCENT_CLOSE}`;
  return `${text.slice(0, from)}${next}${text.slice(to)}`;
}

function AccentText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const pattern = new RegExp(`${ACCENT_OPEN}([\\s\\S]*?)${ACCENT_CLOSE}`, 'g');
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <span key={key} className="prd-logic-accent">
        {match[1]}
      </span>
    );
    key += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function ClickEdit({
  value,
  multiline = false,
  placeholder = '',
  className,
  allowAccent = false,
  onCommit,
}: {
  value: string;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  allowAccent?: boolean;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (!editing) return;
    fieldRef.current?.focus();
  }, [editing]);

  const commit = (raw: string) => {
    setEditing(false);
    if (raw === value) return;
    onCommit(raw);
  };

  const applyAccent = () => {
    const field = fieldRef.current;
    const source = editing ? draft : value;
    const start = field && editing ? field.selectionStart ?? source.length : 0;
    const end = field && editing ? field.selectionEnd ?? source.length : 0;
    const next = toggleAccent(source, start, end);
    setDraft(next);
    if (!editing) {
      onCommit(next);
      return;
    }
    window.requestAnimationFrame(() => {
      field?.focus();
      const cursor = Math.min(next.length, Math.max(start, end) + (next.length - source.length));
      field?.setSelectionRange(cursor, cursor);
    });
  };

  const accentButton = allowAccent ? (
    <button
      type="button"
      className={`prd-logic-accent-btn${hasAccent(editing ? draft : value) ? ' is-on' : ''}`}
      aria-label="设为特殊颜色"
      title="选中一段文字后标色；未选中时给整条标色"
      onMouseDown={(event) => event.preventDefault()}
      onClick={applyAccent}
    >
      标色
    </button>
  ) : null;

  return (
    <span className={`prd-logic-field ${className ?? ''}`.trim()}>
      {editing ? (
        multiline ? (
          <textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            rows={Math.min(8, Math.max(3, draft.split('\n').length + 1))}
            className="prd-logic-editor is-multiline"
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setDraft(value);
                setEditing(false);
              } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                commit(event.currentTarget.value);
              }
            }}
          />
        ) : (
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            type="text"
            className="prd-logic-editor"
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setDraft(value);
                setEditing(false);
              } else if (event.key === 'Enter') {
                event.preventDefault();
                commit(event.currentTarget.value);
              }
            }}
          />
        )
      ) : (
        <span
          className="prd-logic-text"
          role="button"
          tabIndex={0}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setDraft(value);
              setEditing(true);
            }
          }}
        >
          {value.trim() ? <AccentText text={value} /> : <span className="prd-logic-placeholder">{placeholder}</span>}
        </span>
      )}
      {accentButton}
    </span>
  );
}

export default function RequirementLogicEditor({
  sections,
  onChange,
  editing = REQUIREMENT_LOGIC_EDITING,
}: {
  sections: LogicSection[];
  onChange: (next: LogicSection[]) => void;
  editing?: boolean;
}) {
  if (!editing) {
    return (
      <div className="prd-logic-editor-root">
        {sections.map((section, sectionIdx) => (
          <section key={`section-${sectionIdx}`} className="prd-panel-section">
            <h4>{section.title}</h4>
            <ol>
              {section.items.map((item, itemIdx) => (
                <li key={`item-${sectionIdx}-${itemIdx}`}>
                  <span className="prd-panel-item-no">
                    {sectionIdx + 1}.{itemIdx + 1}
                  </span>
                  <span className="prd-logic-item prd-logic-readonly">
                    {item.trim() ? <AccentText text={item} /> : '暂无'}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    );
  }

  const updateSection = (index: number, patch: Partial<LogicSection>) => {
    onChange(sections.map((section, sectionIdx) => (
      sectionIdx === index ? { ...section, ...patch } : section
    )));
  };

  return (
    <div className="prd-logic-editor-root">
      {sections.map((section, sectionIdx) => (
        <section key={`section-${sectionIdx}`} className="prd-panel-section">
          <div className="prd-logic-title-row">
            <h4>
              <ClickEdit
                value={section.title}
                placeholder="请输入小标题"
                onCommit={(title) => {
                  const next = title.trim();
                  if (!next) return;
                  updateSection(sectionIdx, { title: next });
                }}
              />
            </h4>
            <button
              type="button"
              className="prd-logic-remove"
              aria-label="删除小标题"
              onClick={() => onChange(sections.filter((_, index) => index !== sectionIdx))}
            >
              ×
            </button>
          </div>
          <ol>
            {section.items.map((item, itemIdx) => (
              <li key={`item-${sectionIdx}-${itemIdx}`}>
                <span className="prd-panel-item-no">
                  {sectionIdx + 1}.{itemIdx + 1}
                </span>
                <ClickEdit
                  className="prd-logic-item"
                  multiline
                  allowAccent
                  value={item}
                  placeholder="请输入内容"
                  onCommit={(text) => {
                    updateSection(sectionIdx, {
                      items: section.items.map((current, index) => (
                        index === itemIdx ? text : current
                      )),
                    });
                  }}
                />
                <button
                  type="button"
                  className="prd-logic-remove"
                  aria-label="删除这条内容"
                  onClick={() => {
                    updateSection(sectionIdx, {
                      items: section.items.filter((_, index) => index !== itemIdx),
                    });
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="prd-logic-add"
            onClick={() => updateSection(sectionIdx, { items: [...section.items, ''] })}
          >
            添加内容
          </button>
        </section>
      ))}
      <button
        type="button"
        className="prd-logic-add prd-logic-add-section"
        onClick={() => onChange([...sections, { title: '新小标题', items: [''] }])}
      >
        添加小标题
      </button>
    </div>
  );
}
