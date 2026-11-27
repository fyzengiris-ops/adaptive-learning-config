'use client';

import React, { useSyncExternalStore } from 'react';

/**
 * 习题怎么改，两套方案共用这一处，刷新后回到方案 B。
 * 方案 A：在配置后台的典型例题里直接改题干、选项、答案和解析。
 * 方案 B：配置后台和系统选择都只展示。每道题有编辑图标，点开后进入题库编辑页。
 */
export type ExampleEditScheme = 'inline' | 'bank';

let scheme: ExampleEditScheme = 'bank';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getExampleEditScheme() {
  return scheme;
}

export function setExampleEditScheme(next: ExampleEditScheme) {
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

export function useExampleEditScheme() {
  return useSyncExternalStore(subscribe, getExampleEditScheme, getExampleEditScheme);
}

export function ExampleEditSchemeSwitch({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const current = useExampleEditScheme();
  const dark = tone === 'dark';

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`text-[12px] ${dark ? 'text-white/70' : 'text-gray-500'}`}>编辑方案</span>
      <div className={`inline-flex rounded-lg p-0.5 ${dark ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
        {(
          [
            ['inline', '方案A'],
            ['bank', '方案B'],
          ] as const
        ).map(([id, label]) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setExampleEditScheme(id)}
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
