import type { RequirementRegistry } from './schema';

const PAGE = '通用知识树·学习资源·知识卡片';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·通用知识树';
const DECISION =
  'docs/prd-workflow/change-scopes/kt-knowledge-card-example-20261124.scope.md';
const RELATED = [
  'src/components/shared/exampleEditScheme.tsx',
  'src/components/shared/QuestionBankEditorDialog.tsx',
  'src/components/shared/KnowledgeCardPanel.tsx',
  'src/components/shared/LekeQuestionPicker.tsx',
];

/** 方案 B 单独成批。本次面板只看方案 A，方案 B 面板只看这一批。 */
export const KNOWLEDGE_CARD_EXAMPLE_SCHEME_B_BATCH_ID = 'kt-knowledge-card-example-scheme-b-20261126';

const BATCH = KNOWLEDGE_CARD_EXAMPLE_SCHEME_B_BATCH_ID;

const enterExam = [
  { type: 'navigate' as const, label: '进入知识体系-通用知识树', to: '/knowledge-system' },
  { type: 'setTab' as const, label: '切到学习资源', tab: 'resource' },
  { type: 'setTab' as const, label: '切到考点', tab: 'exam' },
];

export const knowledgeTreeKnowledgeCardExampleSchemeBRegistry: RequirementRegistry = {
  registryId: 'knowledge-tree-knowledge-card-example-scheme-b',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description: '方案 B：配置后台和系统选择只展示习题，编辑进入题库录题页。不并入方案 A 的本次卡片。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'KT_KC_EXB-002',
      title: '方案B下配置后台的例题',
      sourceType: 'decision',
      objectType: 'region',
      objectName: '典型例题',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.example',
      anchorStatus: 'implemented',
      batchId: BATCH,
      activate: [
        ...enterExam,
        {
          type: 'scrollTo',
          label: '定位典型例题',
          anchorId: 'knowledge-tree.knowledge-card.example',
        },
      ],
      logicSections: [
        {
          title: '只展示',
          items: [
            '方案B下，典型例题的题型、题干、选项、答案、解析和子题只展示。',
            '配置后台不提供切换题型、删除例题、删除子题、添加子题、添加选项，也不能直接改这些文字。',
          ],
        },
        {
          title: '编辑题目与存储',
          items: [
            '每道例题标题旁有一个编辑图标。点开后弹出题库录题页。',
            '在录题页点保存，把题型、题干、选项、答案、解析写回这道例题，配置后台接着按保存后的内容展示。点取消则不改。',
            '如果这道例题来自系统选择，并且在录题页改过内容，保存后依旧是原来的题目 ID',
          ],
        },
      ],
      acceptance: ['方案B下，例题文字不能在配置后台直接输入。点编辑图标能打开录题页。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '方案B下配置后台的例题',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC_EXB-003',
      title: '方案B下系统选择的编辑',
      sourceType: 'decision',
      objectType: 'dialog',
      objectName: '典型例题选题',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.picker-question',
      anchorStatus: 'implemented',
      batchId: BATCH,
      activate: [
        ...enterExam,
        { type: 'openDialog', label: '打开选题弹窗', dialog: 'leke-question-picker' },
        {
          type: 'scrollTo',
          label: '定位选题列表',
          anchorId: 'knowledge-tree.knowledge-card.picker-question',
        },
      ],
      logicSections: [
        {
          title: '编辑图标',
          items: [
            '方案B下，系统选择里每道题都有一个编辑图标，不展开也能看到。',
            '点编辑图标打开题库录题页',
          ],
        },
        {
          title: '保存到题库示例',
          items: [
            '在录题页点保存，更新这道题的题型、题干、选项、答案、解析和难易度，选题列表马上按新内容展示。',
            '点取消，这道题保持打开前的内容。',
          ],
        },
      ],
      acceptance: ['方案B打开系统选择后，每道题都有编辑图标。点它出现录题页，列表本身不被选中。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '方案B下系统选择的编辑',
        relatedFiles: ['src/components/shared/LekeQuestionPicker.tsx'],
      },
    },
    {
      id: 'KT_KC_EXB-004',
      title: '题库录题页',
      sourceType: 'decision',
      objectType: 'dialog',
      objectName: '题库录题页',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.bank-editor',
      anchorStatus: 'implemented',
      batchId: BATCH,
      activate: [
        ...enterExam,
        {
          type: 'scrollTo',
          label: '定位录题页入口',
          anchorId: 'knowledge-tree.knowledge-card.bank-editor',
        },
      ],
      logicSections: [
        {
          title: '页面内容',
          items: [
            '录题页以弹窗打开，版式沿用乐课网已经实现的录题页。',
            '左侧维护学段科目、题型、题干内容。单选题用圆点、多选题用勾选标出正确答案，并维护各选项。判断、填空、问答维护答案。材料题在子题里维护题型、题干、选项或答案、解析。底部是解析。',
            '右侧设置用途、版本、知识点、类型、年份、地区、级别、难易度。从配置后台打开时，知识点默认带上之前将习题录入习题库时设置的知识点名称',
            '底部是保存和取消。',
          ],
        },
        {
          title: '校验规则',
          items: [
            '录题页的所有题型的所有校验规则，完全复用乐课网录题页已有的规则',
          ],
        },
      ],
      acceptance: ['从编辑图标打开的页面有学段科目、题型、题干、选项或答案、解析，以及右侧设置。保存后外面的展示跟着变。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '题库录题页',
        relatedFiles: ['src/components/shared/QuestionBankEditorDialog.tsx'],
      },
    },
  ],
  excludedDecisions: [],
};
