import type { LogicSection, RequirementItem } from '@/data/requirements/schema';

export type RequirementLogicPatch = {
  title?: string;
  logicSections?: LogicSection[];
  /** 本次本机编辑所基于的注册表指纹；文件更新后旧缓存不再覆盖 */
  baseFingerprint?: string;
};

export type RequirementLogicOverlay = Record<string, RequirementLogicPatch>;

export function logicEditStorageKey(registryId: string): string {
  return `req-logic-edits:${registryId || 'default'}`;
}

export function logicFingerprint(title: string, sections: LogicSection[]): string {
  return JSON.stringify({ title, sections });
}

export function isStaleLogicPatch(
  requirement: RequirementItem,
  patch?: RequirementLogicPatch
): boolean {
  if (!patch) return false;
  const bundled = logicFingerprint(requirement.title, requirement.logicSections);
  const localTitle = patch.title ?? requirement.title;
  const localSections = Array.isArray(patch.logicSections)
    ? patch.logicSections
    : requirement.logicSections;
  const local = logicFingerprint(localTitle, localSections);
  if (local === bundled) return false;
  if (patch.baseFingerprint === bundled) return false;
  return true;
}

export function loadLogicOverlay(registryId: string): RequirementLogicOverlay {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(logicEditStorageKey(registryId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RequirementLogicOverlay;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveLogicOverlay(registryId: string, overlay: RequirementLogicOverlay): void {
  try {
    localStorage.setItem(logicEditStorageKey(registryId), JSON.stringify(overlay));
  } catch {
    /* ignore */
  }
}

export function pruneStaleLogicOverlay(
  registryId: string,
  requirements: RequirementItem[]
): boolean {
  if (typeof window === 'undefined') return false;
  const overlay = loadLogicOverlay(registryId);
  let changed = false;
  requirements.forEach((requirement) => {
    const patch = overlay[requirement.id];
    if (!patch || !isStaleLogicPatch(requirement, patch)) return;
    delete overlay[requirement.id];
    changed = true;
  });
  if (changed) saveLogicOverlay(registryId, overlay);
  return changed;
}

export function mergeRequirementWithPatch(
  requirement: RequirementItem,
  patch?: RequirementLogicPatch
): RequirementItem {
  if (!patch) return requirement;
  return {
    ...requirement,
    title: patch.title ?? requirement.title,
    logicSections: Array.isArray(patch.logicSections)
      ? patch.logicSections
      : requirement.logicSections,
  };
}

export function cloneLogicSections(sections: LogicSection[]): LogicSection[] {
  return sections.map((section) => ({
    title: section.title,
    items: [...section.items],
  }));
}
