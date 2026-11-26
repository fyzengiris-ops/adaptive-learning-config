'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PrdScope = 'baseline' | 'current';

const LEGACY_KEY = 'prd-annotations-hidden';
const KEYS: Record<PrdScope, string> = {
  baseline: 'prd-baseline-hidden',
  current: 'prd-current-hidden',
};

export const PRD_SCOPE_REVEAL = 'prd-scope-reveal';

function applyHidden(hidden: Record<PrdScope, boolean>) {
  document.documentElement.classList.toggle('prd-baseline-hidden', hidden.baseline);
  document.documentElement.classList.toggle('prd-current-hidden', hidden.current);
  document.documentElement.classList.remove(LEGACY_KEY);
}

export function revealPrdScope(scope: PrdScope) {
  window.dispatchEvent(new CustomEvent(PRD_SCOPE_REVEAL, { detail: { scope } }));
}

function ScopeEye({
  label,
  hidden,
  onClick,
}: {
  label: string;
  hidden: boolean;
  onClick: () => void;
}) {
  const text = hidden ? `显示${label}标注` : `隐藏${label}标注`;
  return (
    <button
      type="button"
      onClick={onClick}
      title={text}
      aria-label={text}
      aria-pressed={hidden}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
        hidden
          ? 'border-gray-200 text-gray-400 hover:text-gray-600'
          : 'border-gray-300 text-gray-700 hover:text-gray-900'
      }`}
    >
      {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

export default function PrdVisibilityToggle() {
  const [hidden, setHidden] = useState<Record<PrdScope, boolean>>({
    baseline: false,
    current: false,
  });

  useLayoutEffect(() => {
    const legacy = window.localStorage.getItem(LEGACY_KEY) === '1';
    const read = (scope: PrdScope) => {
      const raw = window.localStorage.getItem(KEYS[scope]);
      if (raw === null) return legacy;
      return raw === '1';
    };
    const next = { baseline: read('baseline'), current: read('current') };
    setHidden(next);
    applyHidden(next);
  }, []);

  useEffect(() => {
    const onReveal = (event: Event) => {
      const scope = (event as CustomEvent<{ scope?: PrdScope }>).detail?.scope;
      if (!scope) return;
      setHidden((prev) => {
        if (!prev[scope]) return prev;
        const next = { ...prev, [scope]: false };
        window.localStorage.setItem(KEYS[scope], '0');
        applyHidden(next);
        return next;
      });
    };
    window.addEventListener(PRD_SCOPE_REVEAL, onReveal);
    return () => window.removeEventListener(PRD_SCOPE_REVEAL, onReveal);
  }, []);

  const toggle = (scope: PrdScope) => {
    setHidden((prev) => {
      const next = { ...prev, [scope]: !prev[scope] };
      window.localStorage.setItem(KEYS[scope], next[scope] ? '1' : '0');
      applyHidden(next);
      return next;
    });
  };

  return (
    <div className="flex items-center gap-2">
      <ScopeEye label="已有" hidden={hidden.baseline} onClick={() => toggle('baseline')} />
      <ScopeEye label="本次" hidden={hidden.current} onClick={() => toggle('current')} />
    </div>
  );
}
