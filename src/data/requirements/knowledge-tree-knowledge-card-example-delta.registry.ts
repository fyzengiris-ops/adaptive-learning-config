import type { RequirementRegistry } from './schema';

const PAGE = '通用知识树·学习资源·知识卡片';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·通用知识树';
const DECISION =
  'docs/prd-workflow/change-scopes/kt-knowledge-card-example-20261124.scope.md';
const RELATED = [
  'src/components/shared/KnowledgeCardPanel.tsx',
  'src/components/shared/KnowledgeCardTabletPreview.tsx',
  'src/components/shared/LekeQuestionPicker.tsx',
  DECISION,
];

/** 本批新增业务逻辑。已上线卡片不改，阅读时用「只看本次」只看这批。 */
export const KNOWLEDGE_CARD_EXAMPLE_DELTA_BATCH_ID = 'kt-knowledge-card-example-20261124';

export const knowledgeTreeKnowledgeCardExampleDeltaRegistry: RequirementRegistry = {
  registryId: 'knowledge-tree-knowledge-card-example-delta',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '仅收录 2026-11-24 起典型例题补充设计的新增口径。不重写此前已上线的例题、选题弹窗和预览卡片。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [],
  excludedDecisions: [],
};
