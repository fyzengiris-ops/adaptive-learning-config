import { KNOWLEDGE_CARD_EXAMPLE_SCHEME_B_BATCH_ID } from '@/data/requirements/knowledge-tree-knowledge-card-example-scheme-b.registry';

export type PrdLane = 'baseline' | 'current' | 'scheme-b';

export function requirementPrdLane(item: { batchId?: string }): PrdLane {
  if (item.batchId === KNOWLEDGE_CARD_EXAMPLE_SCHEME_B_BATCH_ID) return 'scheme-b';
  if (item.batchId) return 'current';
  return 'baseline';
}

export function requirementScopeClass(item: { batchId?: string }) {
  const lane = requirementPrdLane(item);
  if (lane === 'scheme-b') return 'prd-scope-scheme-b';
  if (lane === 'current') return 'prd-scope-current';
  return 'prd-scope-baseline';
}
