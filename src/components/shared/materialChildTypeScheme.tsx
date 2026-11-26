'use client';

import React, { useSyncExternalStore } from 'react';

export type MaterialChildTypeScheme = 'multiple-only' | 'all';

let scheme: MaterialChildTypeScheme = 'multiple-only';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMaterialChildTypeScheme() {
  return scheme;
}

export function setMaterialChildTypeScheme(next: MaterialChildTypeScheme) {
  if (scheme === next) return;
  scheme = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMaterialChildTypeScheme() {
  return useSyncExternalStore(subscribe, getMaterialChildTypeScheme, getMaterialChildTypeScheme);
}

export function materialChildTypeText(label: string, scheme: MaterialChildTypeScheme, isMultiple: boolean) {
  if (!label) return null;
  if (scheme === 'multiple-only' && !isMultiple) return null;
  return `（${label}）`;
}

export function MaterialChildTypeSchemeSwitch({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const current = useMaterialChildTypeScheme();
  const dark = tone === 'dark';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`text-[12px] ${dark ? 'text-white/70' : 'text-gray-500'}`}>子题题型</span>
      <div className={`inline-flex rounded-lg p-0.5 ${dark ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
        {(
          [
            ['multiple-only', '仅多选'],
            ['all', '全部显示'],
          ] as const
        ).map(([id, label]) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setMaterialChildTypeScheme(id)}
              className={`rounded-md px-2 py-1 text-[12px] leading-none transition-colors ${
                active
                  ? dark
                    ? 'bg-white text-gray-900'
                    : 'bg-emerald-600 text-white'
                  : dark
                    ? 'text-white/80 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
