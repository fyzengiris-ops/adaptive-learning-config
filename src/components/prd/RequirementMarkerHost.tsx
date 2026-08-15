'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getRequirementRegistry,
  type LogicSection,
  type RequirementItem,
} from '@/data/requirements';

interface RequirementMarkerHostProps {
  registryId: string;
  refreshKey?: string | number | boolean;
}

function getVisibleLogicSections(requirement: RequirementItem): LogicSection[] {
  if (!Array.isArray(requirement.logicSections)) return [];
  return requirement.logicSections.filter(
    (section) => section?.title && Array.isArray(section.items) && section.items.length > 0
  );
}

function FloatingCard({
  requirement,
  displayNo,
  anchorEl,
  onClose,
}: {
  requirement: RequirementItem;
  displayNo: number;
  anchorEl: HTMLElement;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.req-float-close')) return;
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

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const sections = getVisibleLogicSections(requirement);

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
        onPointerUp={onPointerUp}
      >
        <div className="req-float-head-main">
          <div className="req-float-id">
            #{displayNo} · {requirement.id}
          </div>
          <div className="req-float-title">{requirement.title}</div>
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
              <h4>{section.title}</h4>
              <ol className="req-float-list">
                {section.items.map((item, idx) => (
                  <li key={idx} className="req-float-item">
                    <span className="req-float-item-no">
                      {sectionIdx + 1}.{idx + 1}
                    </span>
                    <span className="req-float-item-text">{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
      <div className="req-float-resizer" aria-hidden="true" />
    </div>,
    document.body
  );
}

type MountedMarker = {
  requirement: RequirementItem;
  host: HTMLElement;
  displayNo: number;
};

/**
 * Skill3 角标：只在 refreshKey / 注册表变化时扫描。
 * 不使用 MutationObserver，避免编辑输入时反复 setState 导致页面回顶。
 */
export default function RequirementMarkerHost({
  registryId,
  refreshKey,
}: RequirementMarkerHostProps) {
  const registry = useMemo(() => getRequirementRegistry(registryId), [registryId]);
  const [mounted, setMounted] = useState<MountedMarker[]>([]);
  const [active, setActive] = useState<{
    requirement: RequirementItem;
    displayNo: number;
    host: HTMLElement;
  } | null>(null);

  const scan = useCallback(() => {
    if (!registry) {
      setMounted([]);
      return;
    }
    const next: MountedMarker[] = [];
    let no = 0;
    for (const requirement of registry.requirements) {
      const host = document.querySelector(
        `[data-req-anchor="${requirement.anchorId}"]`
      ) as HTMLElement | null;
      if (!host) continue;
      no += 1;
      if (!host.classList.contains('req-anchor-host') && !host.classList.contains('req-anchor-inline')) {
        host.classList.add('req-anchor-host');
      }
      next.push({ requirement, host, displayNo: no });
    }
    setMounted(next);
    setActive((prev) => {
      if (!prev) return null;
      const still = next.find((m) => m.requirement.id === prev.requirement.id);
      return still
        ? { requirement: still.requirement, displayNo: still.displayNo, host: still.host }
        : null;
    });
  }, [registry]);

  useEffect(() => {
    scan();
    const t1 = window.setTimeout(scan, 80);
    const t2 = window.setTimeout(scan, 300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scan, refreshKey]);

  if (!registry) return null;

  return (
    <>
      {mounted.map(({ requirement, host, displayNo }) =>
        createPortal(
          <button
            key={requirement.id}
            type="button"
            className={`req-marker${active?.requirement.id === requirement.id ? ' is-active' : ''}`}
            data-req-id={requirement.id}
            data-req-anchor-ref={requirement.anchorId}
            data-req-display-no={String(displayNo)}
            title={`${requirement.id} · ${requirement.title}`}
            aria-label={`查看需求 ${displayNo}：${requirement.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActive((prev) =>
                prev?.requirement.id === requirement.id
                  ? null
                  : { requirement, displayNo, host }
              );
            }}
          >
            {displayNo}
          </button>,
          host
        )
      )}
      {active && (
        <FloatingCard
          requirement={active.requirement}
          displayNo={active.displayNo}
          anchorEl={active.host}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
