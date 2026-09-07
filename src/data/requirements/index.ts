import type { RequirementItem, RequirementRegistry } from './schema';
import { knowledgeTreeInfoAcademicRequirementRegistry } from './knowledge-tree-info-academic-requirement.registry';
import { knowledgeTreeRelatedExamRegistry } from './knowledge-tree-related-exam.registry';
import { knowledgeTreeLearningResourceKnowledgeCardRegistry } from './knowledge-tree-learning-resource-knowledge-card.registry';
import { textbookTreeChapterTopicCourseRegistry } from './textbook-tree-chapter-topic-course.registry';
import { textbookTreeChapterExtensionCourseRegistry } from './textbook-tree-chapter-extension-course.registry';
import academicRequirementOverlay from './overlays/knowledge-tree-info-academic-requirement.json';
import relatedExamOverlay from './overlays/knowledge-tree-related-exam.json';
import knowledgeCardOverlay from './overlays/knowledge-tree-learning-resource-knowledge-card.json';
import textbookChapterTopicOverlay from './overlays/textbook-tree-chapter-topic-course.json';
import textbookChapterExtensionOverlay from './overlays/textbook-tree-chapter-extension-course.json';
import type { RequirementLogicOverlay } from '@/lib/requirementLogicEdits';
import { mergeRequirementWithPatch } from '@/lib/requirementLogicEdits';

export * from './schema';
export { knowledgeTreeInfoAcademicRequirementRegistry } from './knowledge-tree-info-academic-requirement.registry';
export { knowledgeTreeRelatedExamRegistry } from './knowledge-tree-related-exam.registry';
export { knowledgeTreeLearningResourceKnowledgeCardRegistry } from './knowledge-tree-learning-resource-knowledge-card.registry';
export { textbookTreeChapterTopicCourseRegistry } from './textbook-tree-chapter-topic-course.registry';
export { textbookTreeChapterExtensionCourseRegistry } from './textbook-tree-chapter-extension-course.registry';

function applyOverlay(
  registry: RequirementRegistry,
  overlay: RequirementLogicOverlay
): RequirementRegistry {
  if (!overlay || Object.keys(overlay).length === 0) return registry;
  return {
    ...registry,
    requirements: registry.requirements.map((item: RequirementItem) =>
      mergeRequirementWithPatch(item, overlay[item.id])
    ),
  };
}

const registries: RequirementRegistry[] = [
  applyOverlay(
    knowledgeTreeInfoAcademicRequirementRegistry,
    academicRequirementOverlay as RequirementLogicOverlay
  ),
  applyOverlay(knowledgeTreeRelatedExamRegistry, relatedExamOverlay as RequirementLogicOverlay),
  applyOverlay(
    knowledgeTreeLearningResourceKnowledgeCardRegistry,
    knowledgeCardOverlay as RequirementLogicOverlay
  ),
  applyOverlay(
    textbookTreeChapterTopicCourseRegistry,
    textbookChapterTopicOverlay as RequirementLogicOverlay
  ),
  applyOverlay(
    textbookTreeChapterExtensionCourseRegistry,
    textbookChapterExtensionOverlay as RequirementLogicOverlay
  ),
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
