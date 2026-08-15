import type { RequirementRegistry } from './schema';
import { knowledgeTreeInfoAcademicRequirementRegistry } from './knowledge-tree-info-academic-requirement.registry';

export * from './schema';
export { knowledgeTreeInfoAcademicRequirementRegistry } from './knowledge-tree-info-academic-requirement.registry';

const registries: RequirementRegistry[] = [
  knowledgeTreeInfoAcademicRequirementRegistry,
];

export function getAllRequirementRegistries(): RequirementRegistry[] {
  return registries;
}

export function getRequirementRegistry(registryId: string): RequirementRegistry | undefined {
  return registries.find((r) => r.registryId === registryId);
}

export function findRequirementById(requirementId: string) {
  for (const registry of registries) {
    const item = registry.requirements.find((r) => r.id === requirementId);
    if (item) return { registry, requirement: item };
  }
  return undefined;
}

export function findRequirementByAnchorId(anchorId: string) {
  for (const registry of registries) {
    const item = registry.requirements.find((r) => r.anchorId === anchorId);
    if (item) return { registry, requirement: item };
  }
  return undefined;
}
