'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, X } from 'lucide-react';
import {
  getRequirementRegistry,
  type RequirementItem,
} from '@/data/requirements';
import { loadNumberMapWithLegacyMerge, REQ_MARKER_NUMBERS_CHANGED } from '@/lib/requirementMarkerNumbers';
import {
  dispatchPrdActivate,
  dispatchPrdSelect,
  REQ_PRD_SELECT,
  visibleLogicItems,
  type ReqPrdSelectDetail,
} from '@/lib/requirementPrdEvents';

const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 360;

export function PrdToggleButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        open
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'border border-blue-300 text-blue-700 hover:bg-blue-50'
      }`}
      aria-pressed={open}
    >
      <FileText className="w-4 h-4" />
      PRD
    </button>
  );
}

export default function RequirementPanel({
  scopeId,
  registryIds,
  excludeIds,
  width,
  onWidthChange,
  onClose,
  kicker = '需求列表',
  ariaLabel = 'PRD 阅读面板',
}: {
  scopeId: string;
  registryIds: readonly string[];
  excludeIds: readonly string[];
  width: number;
  onWidthChange: (next: number) => void;
  onClose: () => void;
  kicker?: string;
  ariaLabel?: string;
}) {
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [numberMap, setNumberMap] = useState<Record<string, number>>({});
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const requirements = useMemo(() => {
    const list: RequirementItem[] = [];
    for (const registryId of registryIds) {
      const registry = getRequirementRegistry(registryId);
      if (!registry) continue;
      for (const item of registry.requirements) {
        if (!excluded.has(item.id)) list.push(item);
      }
    }
    return list;
  }, [excluded, registryIds]);

  useEffect(() => {
    const load = () => {
      setNumberMap(loadNumberMapWithLegacyMerge(scopeId, [...registryIds]) || {});
    };
    load();
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ scopeId?: string }>).detail;
      if (detail?.scopeId && detail.scopeId !== scopeId) return;
      queueMicrotask(load);
    };
    window.addEventListener(REQ_MARKER_NUMBERS_CHANGED, onChanged);
    return () => window.removeEventListener(REQ_MARKER_NUMBERS_CHANGED, onChanged);
  }, [registryIds, scopeId]);

  useEffect(() => {
    const onSelect = (event: Event) => {
      const detail = (event as CustomEvent<ReqPrdSelectDetail>).detail;
      queueMicrotask(() => setSelectedId(detail?.id ?? null));
    };
    window.addEventListener(REQ_PRD_SELECT, onSelect);
    return () => window.removeEventListener(REQ_PRD_SELECT, onSelect);
  }, []);

  const sorted = useMemo(() => {
    return [...requirements].sort((a, b) => {
      const na = numberMap[a.id] ?? Number.MAX_SAFE_INTEGER;
      const nb = numberMap[b.id] ?? Number.MAX_SAFE_INTEGER;
      if (na !== nb) return na - nb;
      return a.id.localeCompare(b.id);
    });
  }, [numberMap, requirements]);

  const selected = sorted.find((item) => item.id === selectedId) ?? null;

  const onPick = (item: RequirementItem) => {
    setSelectedId(item.id);
    dispatchPrdSelect(item.id, 'panel');
    dispatchPrdActivate(item);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: event.clientX, startWidth: width };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const max = Math.floor(window.innerWidth * 0.5);
    const next = dragRef.current.startWidth + (dragRef.current.startX - event.clientX);
    onWidthChange(Math.min(max, Math.max(MIN_WIDTH, next)));
  };

  const panelWidth = Math.max(MIN_WIDTH, width || DEFAULT_WIDTH);

  return (
    <aside
      className="prd-panel"
      style={{ width: panelWidth }}
      aria-label={ariaLabel}
    >
      <div
        className="prd-panel-resizer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      />
      <div className="prd-panel-head">
        <div>
          <div className="prd-panel-kicker">{kicker}</div>
          <h2 className="prd-panel-title">PRD 阅读</h2>
        </div>
        <button type="button" className="prd-panel-close" aria-label="关闭 PRD 面板" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="prd-panel-body">
        <div className="prd-panel-list">
          {sorted.map((item) => {
            const no = numberMap[item.id];
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                className={`prd-panel-item${active ? ' is-active' : ''}`}
                onClick={() => onPick(item)}
              >
                <span className="prd-panel-no">{no ?? '–'}</span>
                <span className="prd-panel-item-title">{item.title}</span>
              </button>
            );
          })}
        </div>
        <div className="prd-panel-detail">
          {!selected ? (
            <p className="prd-panel-empty">点击左侧需求卡片，查看业务逻辑并定位页面对象。</p>
          ) : (
            <>
              <div className="prd-panel-detail-id">
                #{numberMap[selected.id] ?? '–'} · {selected.id}
              </div>
              <h3 className="prd-panel-detail-title">{selected.title}</h3>
              {(selected.logicSections ?? [])
                .map((section, sectionIdx) => {
                  const items = visibleLogicItems(section.items);
                  if (!section.title.trim() && items.length === 0) return null;
                  return (
                    <section key={`${section.title}-${sectionIdx}`} className="prd-panel-section">
                      {section.title.trim() ? <h4>{section.title}</h4> : null}
                      {items.length > 0 ? (
                        <ol>
                          {items.map((text, idx) => (
                            <li key={`${sectionIdx}-${idx}`}>
                              <span className="prd-panel-item-no">
                                {sectionIdx + 1}.{idx + 1}
                              </span>
                              <span>{text}</span>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </section>
                  );
                })}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
