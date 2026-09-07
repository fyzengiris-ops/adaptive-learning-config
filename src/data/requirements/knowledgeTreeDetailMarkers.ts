export const KNOWLEDGE_TREE_DETAIL_SCOPE_ID = 'knowledge-tree-detail';

export const KNOWLEDGE_TREE_DETAIL_REGISTRY_IDS = [
  'knowledge-tree-info-academic-requirement',
  'knowledge-tree-related-exam',
  'knowledge-tree-learning-resource-knowledge-card',
] as const;

/** 本轮不进角标、也不进右侧 PRD 列表的需求 */
export const KNOWLEDGE_TREE_DETAIL_EXCLUDE_IDS = [
  'KT_RE-009',
  'KT_RE-013',
  'KT_RE-014',
  'KT_KC-018',
] as const;
