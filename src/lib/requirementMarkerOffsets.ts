export type MarkerOffset = { dx: number; dy: number };

export function markerOffsetStorageKey(scopeId: string): string {
  return `req-marker-offsets:${scopeId || 'default'}`;
}

function isOffset(value: unknown): value is MarkerOffset {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const dx = (value as MarkerOffset).dx;
  const dy = (value as MarkerOffset).dy;
  return typeof dx === 'number' && Number.isFinite(dx) && typeof dy === 'number' && Number.isFinite(dy);
}

export function loadOffsetMap(scopeId: string): Record<string, MarkerOffset> {
  try {
    const raw = localStorage.getItem(markerOffsetStorageKey(scopeId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const map: Record<string, MarkerOffset> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([id, value]) => {
      if (!isOffset(value)) return;
      if (Math.abs(value.dx) < 0.5 && Math.abs(value.dy) < 0.5) return;
      map[id] = { dx: value.dx, dy: value.dy };
    });
    return map;
  } catch {
    return {};
  }
}

export function saveOffsetMap(scopeId: string, map: Record<string, MarkerOffset>): void {
  try {
    const compact: Record<string, MarkerOffset> = {};
    Object.entries(map).forEach(([id, value]) => {
      if (!isOffset(value)) return;
      if (Math.abs(value.dx) < 0.5 && Math.abs(value.dy) < 0.5) return;
      compact[id] = { dx: value.dx, dy: value.dy };
    });
    localStorage.setItem(markerOffsetStorageKey(scopeId), JSON.stringify(compact));
  } catch {
    /* ignore quota / private mode */
  }
}
