import type { RequirementItem } from '@/data/requirements/schema';

export const REQ_PRD_SELECT = 'req-prd-select';
export const REQ_PRD_ACTIVATE = 'req-prd-activate';

export type ReqPrdSelectDetail = {
  id: string | null;
  source?: 'marker' | 'panel';
};

export type ReqPrdActivateDetail = {
  requirement: RequirementItem;
};

export function dispatchPrdSelect(id: string | null, source: 'marker' | 'panel' = 'panel') {
  const fire = () => {
    window.dispatchEvent(
      new CustomEvent<ReqPrdSelectDetail>(REQ_PRD_SELECT, { detail: { id, source } })
    );
  };
  if (typeof queueMicrotask === 'function') queueMicrotask(fire);
  else fire();
}

export function dispatchPrdActivate(requirement: RequirementItem) {
  window.dispatchEvent(
    new CustomEvent<ReqPrdActivateDetail>(REQ_PRD_ACTIVATE, { detail: { requirement } })
  );
}

const EMPTY_FALLBACKS = new Set([
  '无额外权限限制',
  '无额外数据流转',
  '无异常场景',
  '本对象无操作入口',
  '本对象仅展示',
  '沿用页面权限',
  '暂无',
  '无',
]);

export function visibleLogicItems(items: string[] | undefined): string[] {
  return (items ?? []).filter((item) => item.trim() && !EMPTY_FALLBACKS.has(item.trim()));
}

export function queryReqAnchor(anchorId: string): HTMLElement | null {
  if (!anchorId) return null;
  const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(anchorId) : anchorId;
  return document.querySelector(`[data-req-anchor="${escaped}"]`);
}

export function waitForReqAnchor(anchorId: string, timeoutMs = 1400): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      const el = queryReqAnchor(anchorId);
      if (el) {
        resolve(el);
        return;
      }
      if (performance.now() - started >= timeoutMs) {
        resolve(null);
        return;
      }
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });
}

export function syncPrdPanelOffset(open: boolean, width: number) {
  const root = document.documentElement;
  if (open) {
    root.classList.add('is-prd-open');
    root.style.setProperty('--prd-panel-width', `${width}px`);
    root.style.setProperty('--prd-panel-offset', `${width}px`);
  } else {
    root.classList.remove('is-prd-open');
    root.style.setProperty('--prd-panel-offset', '0px');
  }
}

export function highlightReqAnchor(anchorId: string): HTMLElement | null {
  document.querySelectorAll('.req-anchor-highlight').forEach((node) => {
    node.classList.remove('req-anchor-highlight');
  });
  const el = queryReqAnchor(anchorId);
  if (!el) return null;
  el.classList.add('req-anchor-highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  window.dispatchEvent(new Event('req-markers-rescan'));
  window.setTimeout(() => el.classList.remove('req-anchor-highlight'), 1800);
  return el;
}
