'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RequirementItem } from '@/data/requirements/schema';
import { getRequirementRegistry } from '@/data/requirements';
import {
  cloneLogicSections,
  loadLogicOverlay,
  logicFingerprint,
  saveLogicOverlay,
} from '@/lib/requirementLogicEdits';

function EditableText({
  value,
  className,
  multiline = false,
  allowEmpty = false,
  onCommit,
  onEditingChange,
}: {
  value: string;
  className?: string;
  multiline?: boolean;
  allowEmpty?: boolean;
  onCommit: (next: string) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const editingRef = useRef(false);
  const skipCommitRef = useRef(false);

  useEffect(() => {
    editingRef.current = editing;
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (!editing) return;
    const el = fieldRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  useEffect(() => {
    skipCommitRef.current = false;
    return () => {
      skipCommitRef.current = true;
      editingRef.current = false;
    };
  }, []);

  const exit = (shouldCommit: boolean) => {
    if (!editingRef.current || skipCommitRef.current) return;
    editingRef.current = false;
    setEditing(false);
    if (!shouldCommit) {
      setDraft(value);
      return;
    }
    const next = (fieldRef.current?.value ?? draft).trim();
    if (!allowEmpty && !next) return;
    if (next === value) return;
    onCommit(next);
  };

  if (editing) {
    const shared = {
      className: `req-float-editor${multiline ? ' is-multiline' : ''}`,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
      onBlur: () => exit(true),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          exit(false);
        } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          exit(true);
        }
      },
    };
    return multiline ? (
      <textarea
        ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
        rows={Math.min(8, Math.max(3, draft.split('\n').length + 1))}
        {...shared}
      />
    ) : (
      <input ref={fieldRef as React.RefObject<HTMLInputElement>} type="text" {...shared} />
    );
  }

  return (
    <span
      className={`req-float-editable ${className ?? ''}`.trim()}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        editingRef.current = true;
        setDraft(value);
        setEditing(true);
      }}
    >
      {value}
    </span>
  );
}

function LogicItemRow({
  no,
  value,
  onCommit,
  onRemove,
}: {
  no: string;
  value: string;
  onCommit: (next: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="req-float-item">
      <span className="req-float-item-no">{no}</span>
      <EditableText
        className="req-float-item-text"
        multiline
        allowEmpty
        value={value}
        onEditingChange={setEditing}
        onCommit={onCommit}
      />
      {editing && (
        <button
          type="button"
          className="req-float-item-remove"
          aria-label="删除这条"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          ×
        </button>
      )}
    </li>
  );
}

export default function RequirementFloatingCard({
  requirement,
  registryId,
  displayNo,
  anchorEl,
  onClose,
  onRequirementChange,
}: {
  requirement: RequirementItem;
  registryId: string;
  displayNo: number;
  anchorEl: HTMLElement;
  onClose: () => void;
  onRequirementChange: (next: RequirementItem) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'local'>('idle');

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const rect = anchorEl.getBoundingClientRect();
    const width = card.offsetWidth || 360;
    let left = rect.right + 12;
    let top = rect.top;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - width - 12);
    }
    top = Math.max(8, Math.min(top, window.innerHeight - 80));
    setPos({ left, top });
  }, [anchorEl, requirement.id]);

  const persist = async (next: RequirementItem) => {
    const bundled = getRequirementRegistry(registryId)?.requirements.find(
      (item) => item.id === next.id
    );
    const overlay = loadLogicOverlay(registryId);
    overlay[next.id] = {
      title: next.title,
      logicSections: cloneLogicSections(next.logicSections),
      baseFingerprint: bundled
        ? logicFingerprint(bundled.title, bundled.logicSections)
        : undefined,
    };
    saveLogicOverlay(registryId, overlay);
    onRequirementChange(next);
    setSaveState('saving');
    try {
      const res = await fetch('/api/requirements/logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registryId,
          requirementId: next.id,
          title: next.title,
          logicSections: next.logicSections,
        }),
      });
      setSaveState(res.ok ? 'saved' : 'local');
    } catch {
      setSaveState('local');
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.req-float-close, .req-float-editable, .req-float-editor')) {
      return;
    }
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    dragRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !cardRef.current) return;
    const x = e.clientX - dragRef.current.offsetX;
    const y = e.clientY - dragRef.current.offsetY;
    const maxX = window.innerWidth - cardRef.current.offsetWidth - 8;
    const maxY = window.innerHeight - 48;
    setPos({
      left: Math.max(8, Math.min(x, maxX)),
      top: Math.max(8, Math.min(y, maxY)),
    });
  };

  const sections = Array.isArray(requirement.logicSections) ? requirement.logicSections : [];

  return createPortal(
    <div
      ref={cardRef}
      className="req-float-card"
      style={{ left: pos.left, top: pos.top }}
      role="dialog"
      aria-label={`需求 ${displayNo}：${requirement.title}`}
    >
      <div
        className="req-float-head"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <div className="req-float-head-main">
          <div className="req-float-id">
            #{displayNo} · {requirement.id}
          </div>
          <EditableText
            className="req-float-title"
            value={requirement.title}
            onCommit={(title) => persist({ ...requirement, title })}
          />
        </div>
        <button type="button" className="req-float-close" aria-label="关闭" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="req-float-body">
        {sections.length === 0 ? (
          <p className="req-float-empty">暂无业务逻辑说明</p>
        ) : (
          sections.map((section, sectionIdx) => (
            <section key={`${section.title}-${sectionIdx}`} className="req-float-section">
              <h4>
                <EditableText
                  value={section.title}
                  onCommit={(title) => {
                    const logicSections = cloneLogicSections(requirement.logicSections);
                    logicSections[sectionIdx] = { ...logicSections[sectionIdx], title };
                    persist({ ...requirement, logicSections });
                  }}
                />
              </h4>
              <ol className="req-float-list">
                {section.items.map((item, idx) => (
                  <LogicItemRow
                    key={`${sectionIdx}-${idx}-${item}`}
                    no={`${sectionIdx + 1}.${idx + 1}`}
                    value={item}
                    onCommit={(text) => {
                      const logicSections = cloneLogicSections(requirement.logicSections);
                      if (!text) {
                        const items = logicSections[sectionIdx].items.filter(
                          (_, itemIdx) => itemIdx !== idx
                        );
                        if (items.length === 0) logicSections.splice(sectionIdx, 1);
                        else logicSections[sectionIdx] = { ...logicSections[sectionIdx], items };
                      } else {
                        logicSections[sectionIdx] = {
                          ...logicSections[sectionIdx],
                          items: logicSections[sectionIdx].items.map((current, itemIdx) =>
                            itemIdx === idx ? text : current
                          ),
                        };
                      }
                      persist({ ...requirement, logicSections });
                    }}
                    onRemove={() => {
                      const logicSections = cloneLogicSections(requirement.logicSections);
                      const items = logicSections[sectionIdx].items.filter(
                        (_, itemIdx) => itemIdx !== idx
                      );
                      if (items.length === 0) logicSections.splice(sectionIdx, 1);
                      else logicSections[sectionIdx] = { ...logicSections[sectionIdx], items };
                      persist({ ...requirement, logicSections });
                    }}
                  />
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
      <div className="req-float-foot">
        {saveState === 'saving' && <span>保存中…</span>}
        {saveState === 'saved' && <span>已写入需求注册表</span>}
        {saveState === 'local' && <span>已保存在本机，写入文件失败</span>}
        <span className="req-float-resizer" aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
