'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

// 规则分类
export type RuleCategory = '字段规则' | '显示规则' | '权限规则' | '交互规则' | '校验规则' | '数据规则';

// 单条规则
export interface RuleItem {
  category: RuleCategory;
  content: string;
}

// PrdTooltip 的规则数据结构
export interface PrdTooltipData {
  title: string;
  rules: RuleItem[];
}

interface PrdTooltipProps {
  data: PrdTooltipData;
  /** 图标大小，默认 14 */
  iconSize?: number;
  /** 额外的图标容器样式 */
  className?: string;
}

// 分类排序顺序
const categoryOrder: RuleCategory[] = ['字段规则', '显示规则', '权限规则', '交互规则', '校验规则', '数据规则'];

// 面板宽度
const PANEL_WIDTH = 320;
const PANEL_MIN_WIDTH = 280;

export default function PrdTooltip({ data, iconSize = 14, className = '' }: PrdTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number; placement: 'bottom' | 'top' } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 按分类分组并去重
  const groupedRules = React.useMemo(() => {
    const groups: Record<RuleCategory, string[]> = {
      '字段规则': [],
      '显示规则': [],
      '权限规则': [],
      '交互规则': [],
      '校验规则': [],
      '数据规则': [],
    };

    // 去重：用 Set 记录已添加的 content
    const addedContents = new Set<string>();

    for (const rule of data.rules) {
      const key = `${rule.category}:${rule.content}`;
      if (!addedContents.has(key)) {
        addedContents.add(key);
        groups[rule.category].push(rule.content);
      }
    }

    // 按预定义顺序返回非空分组
    return categoryOrder
      .filter((cat) => groups[cat].length > 0)
      .map((cat) => ({ category: cat, items: groups[cat] }));
  }, [data.rules]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setPosition(null);
    }, 300);
  }, [clearHideTimer]);

  // 计算面板位置
  const calculatePosition = useCallback(() => {
    if (!iconRef.current) return null;

    const rect = iconRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8; // 图标与面板间距
    const edgePadding = 12; // 视口边缘留白

    // 计算水平位置
    let left = rect.left;
    // 如果右侧溢出，向左偏移
    if (left + PANEL_WIDTH > viewportWidth - edgePadding) {
      left = viewportWidth - PANEL_WIDTH - edgePadding;
    }
    if (left < edgePadding) {
      left = edgePadding;
    }

    // 优先放在下方
    const spaceBelow = viewportHeight - rect.bottom - gap - edgePadding;
    const spaceAbove = rect.top - gap - edgePadding;

    if (spaceBelow >= 150) {
      // 下方空间足够，放在下方
      const maxHeight = Math.min(spaceBelow, 480);
      return { top: rect.bottom + gap, left, maxHeight, placement: 'bottom' as const };
    } else if (spaceAbove >= 150) {
      // 下方不够，上方空间足够，放在上方
      const maxHeight = Math.min(spaceAbove, 480);
      return { top: rect.top - gap, left, maxHeight, placement: 'top' as const };
    } else {
      // 上下都不够，选择空间较大的一方
      if (spaceBelow >= spaceAbove) {
        return { top: rect.bottom + gap, left, maxHeight: Math.max(spaceBelow, 200), placement: 'bottom' as const };
      } else {
        return { top: rect.top - gap, left, maxHeight: Math.max(spaceAbove, 200), placement: 'top' as const };
      }
    }
  }, []);

  const handleIconEnter = useCallback(() => {
    clearHideTimer();
    const pos = calculatePosition();
    if (pos) {
      setPosition(pos);
    }
    setVisible(true);
  }, [clearHideTimer, calculatePosition]);

  const handlePanelEnter = useCallback(() => {
    clearHideTimer();
  }, [clearHideTimer]);

  const handlePanelLeave = useCallback(() => {
    scheduleHide();
  }, [scheduleHide]);

  // 面板渲染后，根据实际高度微调位置（仅对 top placement 做向上偏移）
  // 用 ref 防止 setPosition 触发 position 变化后再次进入 effect 导致无限循环
  const topAdjustedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      topAdjustedRef.current = false;
      return;
    }
    if (position && panelRef.current && position.placement === 'top' && !topAdjustedRef.current) {
      const panelHeight = panelRef.current.offsetHeight;
      setPosition(prev => prev ? { ...prev, top: prev.top - panelHeight } : null);
      topAdjustedRef.current = true;
    }
  }, [visible, position]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        ref={iconRef}
        className={`inline-flex items-center justify-center cursor-help ${className}`}
        onMouseEnter={handleIconEnter}
        onMouseLeave={scheduleHide}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 16 16"
          fill="none"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M8 4.5V5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M8 7V11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {visible && position && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-gray-800 text-white rounded-lg shadow-xl py-3 px-4 text-left"
          style={{
            top: position.top,
            left: position.left,
            maxWidth: PANEL_WIDTH,
            minWidth: PANEL_MIN_WIDTH,
            maxHeight: position.maxHeight,
          }}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
        >
          {/* 标题 */}
          <div className="text-sm font-semibold text-white mb-2 pb-2 border-b border-gray-600 flex-shrink-0">
            {data.title}
          </div>

          {/* 分类规则列表 */}
          <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: position.maxHeight - 60 }}>
            {groupedRules.map((group) => (
              <div key={group.category}>
                <div className="text-xs font-medium text-gray-300 mb-1">
                  ▸ {group.category}
                </div>
                <ul className="space-y-0.5">
                  {group.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-gray-200 leading-relaxed pl-3 relative">
                      <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-gray-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
