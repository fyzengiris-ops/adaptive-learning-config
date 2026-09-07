'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getRequirementRegistry,
  type RequirementItem,
  type RequirementRegistry,
} from '@/data/requirements';
import {
  applyDisplayNoChange,
  loadNumberMap,
  loadNumberMapWithLegacyMerge,
  persistNewAssignments,
  resolveNumberMap,
  saveNumberMap,
} from '@/lib/requirementMarkerNumbers';
import {
  loadOffsetMap,
  saveOffsetMap,
  type MarkerOffset,
} from '@/lib/requirementMarkerOffsets';
import {
  isStaleLogicPatch,
  loadLogicOverlay,
  mergeRequirementWithPatch,
  pruneStaleLogicOverlay,
} from '@/lib/requirementLogicEdits';
import RequirementFloatingCard from '@/components/prd/RequirementFloatingCard';
import { dispatchPrdSelect, REQ_PRD_SELECT, type ReqPrdSelectDetail } from '@/lib/requirementPrdEvents';

interface RequirementMarkerHostProps {
  /** 单注册表（兼容旧用法） */
  registryId?: string;
  /** 页面级编号域：多注册表共用一套 1、2、3… 序号并持久化 */
  scopeId?: string;
  /** 与 scopeId 搭配，按数组顺序合并需求列表 */
  registryIds?: string[];
  /** 本轮不挂角标的需求 id（注册表条目保留，后续可再打开） */
  excludeIds?: string[];
  refreshKey?: string | number | boolean;
}

function isInlineAnchorHost(host: HTMLElement): boolean {
  if (host.classList.contains('req-anchor-inline')) return true;
  const parent = host.parentElement;
  return parent?.classList.contains('req-anchor-inline') ?? false;
}

function computeMarkerZIndex(host: HTMLElement): number {
  let z = 50;
  let el: HTMLElement | null = host;
  while (el) {
    const parsed = parseInt(window.getComputedStyle(el).zIndex, 10);
    if (!isNaN(parsed) && parsed > z) z = parsed;
    el = el.parentElement;
  }
  return z + 10;
}

function computeMarkerPoint(host: HTMLElement, inline: boolean): { left: number; top: number } {
  const rect = host.getBoundingClientRect();
  if (inline) {
    return {
      left: rect.right,
      top: rect.top + rect.height / 2,
    };
  }
  return {
    left: rect.right,
    top: rect.top,
  };
}

function isOverflowClipValue(value: string): boolean {
  return value === 'auto' || value === 'scroll' || value === 'hidden' || value === 'clip';
}

function getActiveReqSurface(): HTMLElement | null {
  return document.querySelector('[data-req-surface]');
}

function findAnchorHost(anchorId: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll(`[data-req-anchor="${anchorId}"]`)
  ) as HTMLElement[];
  if (nodes.length === 0) return null;
  const surface = getActiveReqSurface();
  if (surface) {
    const inside = nodes.find((node) => surface.contains(node));
    if (inside) return inside;
  }
  return nodes[0];
}

function isMarkerPointVisible(host: HTMLElement, point: { left: number; top: number }): boolean {
  const hostRect = host.getBoundingClientRect();
  if (hostRect.width < 1 && hostRect.height < 1) return false;

  const surface = getActiveReqSurface();
  if (surface && !surface.contains(host)) return false;

  let parent: HTMLElement | null = host.parentElement;
  while (parent) {
    if (surface && parent === surface) break;
    const style = window.getComputedStyle(parent);
    if (isOverflowClipValue(style.overflowX) || isOverflowClipValue(style.overflowY)) {
      const clip = parent.getBoundingClientRect();
      if (
        point.left < clip.left ||
        point.left > clip.right ||
        point.top < clip.top ||
        point.top > clip.bottom
      ) {
        return false;
      }
    }
    parent = parent.parentElement;
  }

  return (
    point.left >= 0 &&
    point.top >= 0 &&
    point.left <= window.innerWidth &&
    point.top <= window.innerHeight
  );
}

const ZERO_OFFSET: MarkerOffset = { dx: 0, dy: 0 };
const LONG_PRESS_MS = 420;
const PRESS_CANCEL_PX = 8;

function applyOffset(point: { left: number; top: number }, offset?: MarkerOffset) {
  return {
    left: point.left + (offset?.dx ?? 0),
    top: point.top + (offset?.dy ?? 0),
  };
}

function MarkerPositionLayer({
  host,
  offset,
  dragging,
  children,
}: {
  host: HTMLElement;
  offset?: MarkerOffset;
  dragging?: boolean;
  children: React.ReactNode;
}) {
  const inline = isInlineAnchorHost(host);
  const [point, setPoint] = useState(() => computeMarkerPoint(host, inline));
  const [hostVisible, setHostVisible] = useState(() =>
    isMarkerPointVisible(host, computeMarkerPoint(host, inline))
  );
  const [zIndex, setZIndex] = useState(() => computeMarkerZIndex(host));

  const update = useCallback(() => {
    const next = computeMarkerPoint(host, inline);
    setPoint(next);
    setHostVisible(isMarkerPointVisible(host, next));
    setZIndex(computeMarkerZIndex(host));
  }, [host, inline]);

  useLayoutEffect(() => {
    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    window.addEventListener('req-markers-rescan', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      window.removeEventListener('req-markers-rescan', update);
    };
  }, [host, update]);

  const displayed = applyOffset(point, offset);
  const visible = Boolean(dragging) || hostVisible;

  return createPortal(
    <span
      className={`req-marker-positioner${inline ? ' is-inline' : ' is-block'}${visible ? '' : ' is-clipped'}${dragging ? ' is-dragging' : ''}`}
      style={{
        left: displayed.left,
        top: displayed.top,
        zIndex,
        visibility: visible ? 'visible' : 'hidden',
        pointerEvents: visible ? undefined : 'none',
      }}
      aria-hidden={!visible}
    >
      {children}
    </span>,
    document.body
  );
}

type MountedMarker = {
  requirement: RequirementItem;
  registryId: string;
  host: HTMLElement;
  displayNo: number;
};

function ReqMarkerButton({
  requirement,
  displayNo,
  scopeId,
  numberMap,
  orderedIds,
  isActive,
  host,
  offset,
  dragging,
  onToggleActive,
  onClosePanel,
  onNumberMapChange,
  onOffsetChange,
  onOffsetCommit,
  onResetOffset,
  onDraggingChange,
}: {
  requirement: RequirementItem;
  displayNo: number;
  scopeId: string;
  numberMap: Record<string, number>;
  orderedIds: string[];
  isActive: boolean;
  host: HTMLElement;
  offset: MarkerOffset;
  dragging: boolean;
  onToggleActive: () => void;
  onClosePanel: () => void;
  onNumberMapChange: (map: Record<string, number>) => void;
  onOffsetChange: (offset: MarkerOffset) => void;
  onOffsetCommit: (offset: MarkerOffset) => void;
  onResetOffset: () => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(displayNo));
  const [pressing, setPressing] = useState(false);
  const clickTimerRef = useRef<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const grabRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const livePressRef = useRef(false);
  const suppressClickRef = useRef(false);
  const offsetRef = useRef(offset);
  const inputRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);

  offsetRef.current = offset;

  const cancelPendingClick = useCallback(() => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, []);

  const cancelPressTimer = useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartRef.current = null;
    setPressing(false);
  }, []);

  const stopDragging = useCallback(
    (commit: boolean) => {
      const wasDragging = draggingRef.current;
      draggingRef.current = false;
      grabRef.current = null;
      cancelPressTimer();
      onDraggingChange(false);
      if (wasDragging) {
        suppressClickRef.current = true;
        if (commit) onOffsetCommit(offsetRef.current);
      }
    },
    [cancelPressTimer, onDraggingChange, onOffsetCommit]
  );

  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  useEffect(() => {
    return () => {
      cancelPendingClick();
      cancelPressTimer();
    };
  }, [cancelPendingClick, cancelPressTimer]);

  useEffect(() => {
    if (!editing) return;
    setEditValue(String(displayNo));
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing, displayNo]);

  const maxNo = useMemo(() => {
    let max = Object.keys(numberMap).length;
    Object.values(numberMap).forEach((n) => {
      const parsed = parseInt(String(n), 10);
      if (!isNaN(parsed) && parsed > max) max = parsed;
    });
    return Math.max(max, 1);
  }, [numberMap]);

  const exitEdit = (shouldCommit: boolean) => {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);
    if (!shouldCommit) return;
    const raw = inputRef.current?.value ?? editValue;
    const value = parseInt(String(raw).trim(), 10);
    if (isNaN(value) || value < 1) return;
    const disk = loadNumberMap(scopeId) || {};
    const base = { ...disk, ...numberMap };
    const ids = orderedIds.length > 0 ? orderedIds : Object.keys(base);
    const unique = resolveNumberMap(ids, base);
    const next = applyDisplayNoChange(unique, requirement.id, value);
    saveNumberMap(scopeId, next);
    onNumberMapChange(next);
  };

  const markerTitle = `${requirement.id} · ${requirement.title}（单击查看，双击改序号，长按拖动，右键复位）`;

  const activateMarker = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editing || draggingRef.current) return;
    cancelPendingClick();
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      onToggleActive();
    }, 220);
  };

  const beginDrag = (target: HTMLElement, pointerId: number, clientX: number, clientY: number) => {
    if (editingRef.current || !livePressRef.current) return;
    const inline = isInlineAnchorHost(host);
    const base = computeMarkerPoint(host, inline);
    const displayed = applyOffset(base, offsetRef.current);
    grabRef.current = { x: clientX - displayed.left, y: clientY - displayed.top };
    draggingRef.current = true;
    setPressing(false);
    cancelPendingClick();
    onClosePanel();
    onDraggingChange(true);
    try {
      target.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  };

  const moveDrag = (e: React.PointerEvent<HTMLSpanElement>) => {
    const grab = grabRef.current;
    if (!grab || !draggingRef.current) return;
    const inline = isInlineAnchorHost(host);
    const base = computeMarkerPoint(host, inline);
    const left = Math.min(Math.max(e.clientX - grab.x, 10), window.innerWidth - 10);
    const top = Math.min(Math.max(e.clientY - grab.y, 10), window.innerHeight - 10);
    onOffsetChange({ dx: left - base.left, dy: top - base.top });
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={`req-marker${isActive ? ' is-active' : ''}${editing ? ' is-editing' : ''}${pressing ? ' is-pressing' : ''}${dragging ? ' is-dragging' : ''}`}
        data-req-id={requirement.id}
        data-req-anchor-ref={requirement.anchorId}
        data-req-display-no={String(displayNo)}
        title={markerTitle}
        aria-label={`查看需求 ${displayNo}：${requirement.title}`}
        hidden={editing}
        onPointerDown={(e) => {
          if (editing || e.button === 2) return;
          e.stopPropagation();
          const target = e.currentTarget;
          const pointerId = e.pointerId;
          const clientX = e.clientX;
          const clientY = e.clientY;
          livePressRef.current = true;
          pressStartRef.current = { x: clientX, y: clientY };
          setPressing(true);
          if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
          pressTimerRef.current = window.setTimeout(() => {
            pressTimerRef.current = null;
            beginDrag(target, pointerId, clientX, clientY);
          }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) {
            e.preventDefault();
            moveDrag(e);
            return;
          }
          const start = pressStartRef.current;
          if (!start || pressTimerRef.current === null) return;
          const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
          if (dist > PRESS_CANCEL_PX) cancelPressTimer();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          livePressRef.current = false;
          if (draggingRef.current) {
            e.preventDefault();
            stopDragging(true);
            return;
          }
          cancelPressTimer();
        }}
        onPointerCancel={() => {
          livePressRef.current = false;
          stopDragging(true);
        }}
        onLostPointerCapture={() => {
          if (!draggingRef.current) return;
          livePressRef.current = false;
          stopDragging(true);
        }}
        onClick={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClickRef.current = false;
            return;
          }
          activateMarker(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') activateMarker(e);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cancelPendingClick();
          cancelPressTimer();
          stopDragging(false);
          onClosePanel();
          editingRef.current = true;
          setEditing(true);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cancelPendingClick();
          cancelPressTimer();
          stopDragging(false);
          onResetOffset();
        }}
      >
        {displayNo}
      </span>
      {editing && (
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={maxNo}
          className="req-marker-input"
          value={editValue}
          aria-label="编辑角标序号"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              exitEdit(true);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              exitEdit(false);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              exitEdit(true);
            }, 0);
          }}
          onChange={(e) => {
            e.stopPropagation();
            setEditValue(e.target.value);
          }}
        />
      )}
    </>
  );
}

function collectRegistries(registryId?: string, registryIds?: string[]): RequirementRegistry[] {
  if (registryIds?.length) {
    return registryIds
      .map((id) => getRequirementRegistry(id))
      .filter((r): r is RequirementRegistry => Boolean(r));
  }
  if (registryId) {
    const one = getRequirementRegistry(registryId);
    return one ? [one] : [];
  }
  return [];
}

function findRegistryId(registries: RequirementRegistry[], requirementId: string): string {
  return registries.find((registry) =>
    registry.requirements.some((item) => item.id === requirementId)
  )?.registryId ?? '';
}

function withLocalLogicEdits(
  registries: RequirementRegistry[],
  requirement: RequirementItem
): RequirementItem {
  const registryId = findRegistryId(registries, requirement.id);
  if (!registryId) return requirement;
  const overlay = loadLogicOverlay(registryId);
  const patch = overlay[requirement.id];
  if (isStaleLogicPatch(requirement, patch)) return requirement;
  return mergeRequirementWithPatch(requirement, patch);
}

/**
 * Skill3 角标：仅对当前 DOM 中存在的锚点挂角标（未切到的 Tab 不显示）；
 * scopeId 下多注册表共用一套连续序号并 localStorage 持久化。
 */
export default function RequirementMarkerHost({
  registryId,
  scopeId,
  registryIds,
  excludeIds,
  refreshKey,
}: RequirementMarkerHostProps) {
  const registryIdsKey = (registryIds ?? []).join('|');
  const registries = useMemo(
    () => collectRegistries(registryId, registryIdsKey ? registryIdsKey.split('|') : undefined),
    [registryId, registryIdsKey]
  );

  const effectiveScopeId = scopeId ?? registryId ?? registryIds?.[0] ?? 'default';
  const legacyRegistryIds = useMemo(
    () => (registryIdsKey ? registryIdsKey.split('|') : registryId ? [registryId] : []),
    [registryId, registryIdsKey]
  );
  const excludeKey = (excludeIds ?? []).join('|');
  const excluded = useMemo(() => new Set(excludeKey ? excludeKey.split('|') : []), [excludeKey]);

  const allRequirements = useMemo(
    () =>
      registries.flatMap((registry) =>
        registry.requirements
          .filter((requirement) => !excluded.has(requirement.id))
          .map((requirement) => withLocalLogicEdits(registries, requirement))
      ),
    [excluded, registries]
  );

  const [mounted, setMounted] = useState<MountedMarker[]>([]);
  const [numberMap, setNumberMap] = useState<Record<string, number>>({});
  const numberMapRef = useRef<Record<string, number>>({});
  const [offsets, setOffsets] = useState<Record<string, MarkerOffset>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [panelSelectedId, setPanelSelectedId] = useState<string | null>(null);
  const [active, setActive] = useState<{
    requirement: RequirementItem;
    registryId: string;
    displayNo: number;
    host: HTMLElement;
  } | null>(null);

  const scan = useCallback(() => {
    if (registries.length === 0 || allRequirements.length === 0) {
      setMounted([]);
      return;
    }

    const hosts: { requirement: RequirementItem; registryId: string; host: HTMLElement }[] = [];
    for (const requirement of allRequirements) {
      const merged = withLocalLogicEdits(registries, requirement);
      const host = findAnchorHost(merged.anchorId);
      if (!host) continue;
      if (
        !host.classList.contains('req-anchor-host') &&
        !host.classList.contains('req-anchor-inline')
      ) {
        host.classList.add('req-anchor-host');
      }
      hosts.push({
        requirement: merged,
        registryId: findRegistryId(registries, merged.id),
        host,
      });
    }

    const saved = loadNumberMapWithLegacyMerge(effectiveScopeId, legacyRegistryIds) || {};
    const allIds = allRequirements.map((requirement) => requirement.id);
    const filled = resolveNumberMap(allIds, saved);
    const display = persistNewAssignments(effectiveScopeId, filled);
    numberMapRef.current = display;
    setNumberMap(display);

    const next: MountedMarker[] = hosts.map(({ requirement, registryId, host }) => ({
      requirement,
      registryId,
      host,
      displayNo: display[requirement.id] ?? 0,
    }));
    setMounted(next);

    setActive((prev) => {
      if (!prev) return null;
      const still = next.find((m) => m.requirement.id === prev.requirement.id);
      if (!still) return null;
      return {
        requirement: still.requirement,
        registryId: still.registryId,
        displayNo: display[still.requirement.id] ?? still.displayNo,
        host: still.host,
      };
    });
  }, [allRequirements, effectiveScopeId, excluded, legacyRegistryIds, registries]);

  useEffect(() => {
    registries.forEach((registry) => {
      pruneStaleLogicOverlay(registry.registryId, registry.requirements);
    });
    scan();
    const t1 = window.setTimeout(scan, 80);
    const t2 = window.setTimeout(scan, 300);
    let debounce: number | null = null;
    const observer = new MutationObserver((mutations) => {
      const hit = mutations.some((mutation) => {
        if (mutation.type !== 'childList') return false;
        const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
        return nodes.some((node) => {
          if (!(node instanceof HTMLElement)) return false;
          return (
            node.hasAttribute('data-req-anchor') ||
            Boolean(node.querySelector?.('[data-req-anchor]'))
          );
        });
      });
      if (!hit) return;
      if (debounce !== null) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        debounce = null;
        scan();
      }, 60);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const onRescan = () => scan();
    window.addEventListener('req-markers-rescan', onRescan);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (debounce !== null) window.clearTimeout(debounce);
      observer.disconnect();
      window.removeEventListener('req-markers-rescan', onRescan);
    };
  }, [scan, refreshKey]);

  useEffect(() => {
    setOffsets(loadOffsetMap(effectiveScopeId));
    setDraggingId(null);
  }, [effectiveScopeId]);

  useEffect(() => {
    const onSelect = (event: Event) => {
      const detail = (event as CustomEvent<ReqPrdSelectDetail>).detail;
      setPanelSelectedId(detail?.id ?? null);
      if (detail?.source === 'panel') setActive(null);
    };
    window.addEventListener(REQ_PRD_SELECT, onSelect);
    return () => window.removeEventListener(REQ_PRD_SELECT, onSelect);
  }, []);

  const handleOffsetChange = useCallback((id: string, next: MarkerOffset) => {
    setOffsets((prev) => ({ ...prev, [id]: next }));
  }, []);

  const handleOffsetCommit = useCallback(
    (id: string, next: MarkerOffset) => {
      setOffsets((prev) => {
        const merged = { ...prev };
        if (Math.abs(next.dx) < 0.5 && Math.abs(next.dy) < 0.5) {
          delete merged[id];
        } else {
          merged[id] = next;
        }
        saveOffsetMap(effectiveScopeId, merged);
        return merged;
      });
    },
    [effectiveScopeId]
  );

  const handleResetOffset = useCallback(
    (id: string) => {
      setOffsets((prev) => {
        const merged = { ...prev };
        delete merged[id];
        saveOffsetMap(effectiveScopeId, merged);
        return merged;
      });
    },
    [effectiveScopeId]
  );

  const handleNumberMapChange = useCallback((map: Record<string, number>) => {
    numberMapRef.current = map;
    setNumberMap(map);
    setMounted((prev) =>
      prev.map((m) => ({
        ...m,
        displayNo: map[m.requirement.id] ?? m.displayNo,
      }))
    );
    setActive((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        displayNo: map[prev.requirement.id] ?? prev.displayNo,
      };
    });
  }, []);

  const orderedIds = useMemo(
    () => allRequirements.map((item) => item.id),
    [allRequirements]
  );

  if (registries.length === 0) return null;

  return (
    <>
      {mounted.map(({ requirement, host, displayNo }) => (
        <MarkerPositionLayer
          key={requirement.id}
          host={host}
          offset={offsets[requirement.id]}
          dragging={draggingId === requirement.id}
        >
          <ReqMarkerButton
            requirement={requirement}
            displayNo={displayNo}
            scopeId={effectiveScopeId}
            numberMap={numberMap}
            orderedIds={orderedIds}
            isActive={active?.requirement.id === requirement.id || panelSelectedId === requirement.id}
            host={host}
            offset={offsets[requirement.id] ?? ZERO_OFFSET}
            dragging={draggingId === requirement.id}
            onToggleActive={() => {
              const isSame = active?.requirement.id === requirement.id;
              setActive(
                isSame
                  ? null
                  : {
                      requirement,
                      registryId: findRegistryId(registries, requirement.id),
                      displayNo,
                      host,
                    }
              );
              dispatchPrdSelect(isSame ? null : requirement.id, 'marker');
            }}
            onClosePanel={() => {
              setActive(null);
              dispatchPrdSelect(null, 'marker');
            }}
            onNumberMapChange={handleNumberMapChange}
            onOffsetChange={(next) => handleOffsetChange(requirement.id, next)}
            onOffsetCommit={(next) => handleOffsetCommit(requirement.id, next)}
            onResetOffset={() => handleResetOffset(requirement.id)}
            onDraggingChange={(next) => setDraggingId(next ? requirement.id : null)}
          />
        </MarkerPositionLayer>
      ))}
      {active && (
        <RequirementFloatingCard
          requirement={active.requirement}
          registryId={active.registryId}
          displayNo={active.displayNo}
          anchorEl={active.host}
          onClose={() => {
            setActive(null);
            dispatchPrdSelect(null, 'marker');
          }}
          onRequirementChange={(next) => {
            setActive((prev) => (prev ? { ...prev, requirement: next } : prev));
            setMounted((prev) =>
              prev.map((item) =>
                item.requirement.id === next.id ? { ...item, requirement: next } : item
              )
            );
          }}
        />
      )}
    </>
  );
}
