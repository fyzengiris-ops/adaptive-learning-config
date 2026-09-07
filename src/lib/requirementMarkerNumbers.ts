export function markerNumberStorageKey(scopeId: string): string {
  return `req-marker-numbers:${scopeId || 'default'}`;
}

export function legacyMarkerOrderKey(scopeId: string): string {
  return `req-marker-order:${scopeId || 'default'}`;
}

export function loadNumberMap(scopeId: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(markerNumberStorageKey(scopeId));
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, number>;
      }
    }
    const legacy = localStorage.getItem(legacyMarkerOrderKey(scopeId));
    if (legacy) {
      const arr = JSON.parse(legacy) as unknown;
      if (Array.isArray(arr)) {
        const migrated: Record<string, number> = {};
        arr.forEach((id, index) => {
          migrated[String(id)] = index + 1;
        });
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * 读取 scope 序号；若无则合并旧版「按注册表拆分」的 localStorage（迁移用）
 */
export function loadNumberMapWithLegacyMerge(
  scopeId: string,
  legacyRegistryIds: string[] = []
): Record<string, number> | null {
  const direct = loadNumberMap(scopeId);
  if (direct) return direct;

  const merged: Record<string, number> = {};
  legacyRegistryIds.forEach((registryId) => {
    const legacy = loadNumberMap(registryId);
    if (!legacy) return;
    Object.entries(legacy).forEach(([id, n]) => {
      if (!merged[id]) merged[id] = n;
    });
  });
  return Object.keys(merged).length > 0 ? merged : null;
}

export const REQ_MARKER_NUMBERS_CHANGED = 'req-marker-numbers-changed';

export function saveNumberMap(scopeId: string, map: Record<string, number>): void {
  try {
    localStorage.setItem(markerNumberStorageKey(scopeId), JSON.stringify(map));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(REQ_MARKER_NUMBERS_CHANGED, { detail: { scopeId, map } })
      );
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * 扫描落盘：新 id 补号；同一号被多个 id 占用时，只保留先出现的，其余改成唯一号后写回。
 * 用户已经改成不重复的号一律不动。
 */
export function persistNewAssignments(
  scopeId: string,
  assigned: Record<string, number>
): Record<string, number> {
  const latest = loadNumberMap(scopeId) || {};
  if (Object.keys(latest).length === 0) {
    if (Object.keys(assigned).length > 0) saveNumberMap(scopeId, assigned);
    return { ...assigned };
  }

  const occupancy: Record<number, number> = {};
  Object.values(latest).forEach((raw) => {
    const n = parseInt(String(raw), 10);
    if (!isNaN(n) && n > 0) occupancy[n] = (occupancy[n] || 0) + 1;
  });

  const merged: Record<string, number> = { ...latest };
  let changed = false;
  Object.entries(assigned).forEach(([id, raw]) => {
    const n = parseInt(String(raw), 10);
    if (isNaN(n) || n <= 0) return;
    const savedN = parseInt(String(merged[id]), 10);
    if (merged[id] == null || isNaN(savedN) || savedN <= 0) {
      merged[id] = n;
      changed = true;
      return;
    }
    if (savedN !== n && (occupancy[savedN] || 0) > 1) {
      merged[id] = n;
      changed = true;
    }
  });
  if (changed) saveNumberMap(scopeId, merged);
  return resolveNumberMap(Object.keys(assigned), merged);
}

/**
 * 合并已存序号与当前可挂载需求：保留用户序号，新增项接在最大号之后
 * @param reqIds 参与编号的需求 id 列表（建议为注册表全部 id，避免只保存可见锚点）
 */
export function resolveNumberMap(
  mountedReqIds: string[],
  saved: Record<string, number> | null = null
): Record<string, number> {
  const savedMap = saved || {};
  const map: Record<string, number> = {};
  const used: Record<number, boolean> = {};
  let maxNo = 0;

  mountedReqIds.forEach((id) => {
    const n = parseInt(String(savedMap[id]), 10);
    if (!isNaN(n) && n > 0 && !used[n]) {
      map[id] = n;
      used[n] = true;
      if (n > maxNo) maxNo = n;
    }
  });

  mountedReqIds.forEach((id) => {
    if (map[id] != null) return;
    let candidate = maxNo + 1;
    while (used[candidate]) candidate += 1;
    map[id] = candidate;
    used[candidate] = true;
    if (candidate > maxNo) maxNo = candidate;
  });

  return map;
}

function takeNumber(
  map: Record<string, number>,
  used: Record<number, boolean>,
  id: string,
  preferred: number | null
): number {
  if (preferred && preferred > 0 && !used[preferred]) {
    map[id] = preferred;
    used[preferred] = true;
    return preferred;
  }
  let candidate = 1;
  while (used[candidate]) candidate += 1;
  map[id] = candidate;
  used[candidate] = true;
  return candidate;
}

/**
 * 整页短号：已对齐的旧分册核心条目保持 1…N；
 * 新分册优先沿用已保存序号（含用户双击改过的号），没有保存过的才接到 N+1 之后。
 * 未挂出的旧条目不占用新分册前面的号。
 */
export function mergeScopeNumberMap(args: {
  saved: Record<string, number> | null;
  frozenCoreIds: string[];
  newIds: string[];
  otherFrozenIds?: string[];
}): Record<string, number> {
  const savedMap = args.saved || {};
  const map: Record<string, number> = {};
  const used: Record<number, boolean> = {};

  args.frozenCoreIds.forEach((id) => {
    const n = parseInt(String(savedMap[id]), 10);
    takeNumber(map, used, id, !isNaN(n) && n > 0 ? n : null);
  });

  let maxCore = 0;
  Object.values(map).forEach((n) => {
    if (n > maxCore) maxCore = n;
  });

  args.newIds.forEach((id) => {
    const n = parseInt(String(savedMap[id]), 10);
    if (!isNaN(n) && n > 0 && !used[n]) {
      map[id] = n;
      used[n] = true;
      return;
    }
    let candidate = maxCore + 1;
    while (used[candidate]) candidate += 1;
    map[id] = candidate;
    used[candidate] = true;
    if (candidate > maxCore) maxCore = candidate;
  });

  let maxNo = maxCore;
  Object.values(map).forEach((n) => {
    if (n > maxNo) maxNo = n;
  });

  (args.otherFrozenIds || []).forEach((id) => {
    if (map[id]) return;
    const n = parseInt(String(savedMap[id]), 10);
    if (!isNaN(n) && n > 0 && !used[n]) {
      map[id] = n;
      used[n] = true;
      if (n > maxNo) maxNo = n;
      return;
    }
    let candidate = maxNo + 1;
    while (used[candidate]) candidate += 1;
    map[id] = candidate;
    used[candidate] = true;
    if (candidate > maxNo) maxNo = candidate;
  });

  return map;
}

/**
 * 仅给还没有序号的 id 从 minNo 起编号；已有序号一律保留（含用户双击改过的号）。
 */
export function assignIdsFromMin(
  map: Record<string, number>,
  ids: string[],
  minNo: number
): Record<string, number> {
  const next: Record<string, number> = { ...map };
  const used = new Set<number>();

  Object.values(next).forEach((n) => {
    if (n > 0) used.add(n);
  });

  let candidate = minNo;
  ids.forEach((id) => {
    const current = parseInt(String(next[id]), 10);
    if (!isNaN(current) && current > 0) return;
    while (used.has(candidate)) candidate += 1;
    next[id] = candidate;
    used.add(candidate);
    candidate += 1;
  });

  return next;
}

/**
 * 用已保存序号覆盖当前表：双击改过的号在重新扫描 / 切 Tab 后必须原样保留。
 */
export function overlaySavedNumberMap(
  map: Record<string, number>,
  saved: Record<string, number>
): Record<string, number> {
  const next: Record<string, number> = { ...map };
  Object.entries(saved).forEach(([id, raw]) => {
    const n = parseInt(String(raw), 10);
    if (!isNaN(n) && n > 0) next[id] = n;
  });
  return next;
}

/**
 * 把 reqId 从 oldNo 改到 newNo：同一套序号里，闭区间内其他角标依次顺延。
 * 例：整页 1–9，把 2 改成 9 → 1 不动，原 2 变为 9，原 3–9 变为 2–8。
 * 未挂上的角标也在同一套号里，照样参与顺延。
 */
export function applyDisplayNoChange(
  map: Record<string, number>,
  reqId: string,
  newNo: number
): Record<string, number> {
  const oldNo = parseInt(String(map[reqId]), 10);
  const parsedNew = parseInt(String(newNo), 10);
  if (isNaN(oldNo) || isNaN(parsedNew) || parsedNew < 1 || parsedNew === oldNo) {
    return map;
  }

  const next: Record<string, number> = { ...map };

  Object.keys(next).forEach((id) => {
    if (id === reqId) return;
    const n = next[id];
    if (parsedNew < oldNo) {
      if (n >= parsedNew && n < oldNo) next[id] = n + 1;
    } else if (n > oldNo && n <= parsedNew) {
      next[id] = n - 1;
    }
  });
  next[reqId] = parsedNew;
  return next;
}
