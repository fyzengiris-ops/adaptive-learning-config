import type { RequirementRegistry } from './schema';

const PAGE = '通用知识树·学习资源·知识卡片';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·通用知识树';
const DECISION =
  'docs/prd-workflow/decisions/knowledge-tree-learning-resource-knowledge-card.decision.md';
const RELATED = [
  'src/app/system-settings/KnowledgeTree.tsx',
  'src/components/shared/KnowledgeCardPanel.tsx',
  'src/components/shared/KnowledgeCardTabletPreview.tsx',
  'src/components/shared/LekeQuestionPicker.tsx',
  DECISION,
];

/**
 * 全量注册表（范围限定）：通用知识树 · 学习资源 Tab · 知识卡片及其耦合表面
 */
export const knowledgeTreeLearningResourceKnowledgeCardRegistry: RequirementRegistry = {
  registryId: 'knowledge-tree-learning-resource-knowledge-card',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '范围：末级知识点详情「学习资源」Tab 内的知识卡片（核心概念、考点回显与例题、平板预览、选题弹窗），以及保存校验、添加子节点「有详细内容」判定。不含视频讲解细则、关联考点表格维护与导入导出考点列。富文本工具条交互细节以占位写入，后续由用户完善。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'KT_KC-001',
      title: '学习资源 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '学习资源',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.resource.tab',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'scrollTo', label: '定位学习资源 Tab', anchorId: 'knowledge-tree.resource.tab' },
        { type: 'highlight', label: '高亮学习资源 Tab', anchorId: 'knowledge-tree.resource.tab' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '末级节点的学习资源模块，原知识点讲解模块能力，变更为现在新的知识卡片能力',
            '知识卡片放在视频讲解的上面',
          ],
        },
        {
          title: '操作说明',
          items: [
            '查看中、编辑中都可以打开「学习资源」。',
            '若已点「编辑知识点详情」：在各详情 Tab 之间切换只换内容，不自动保存，也不清掉内容\n要落库点「保存编辑」，要放弃点「取消」。',
          ],
        },
      ],
      acceptance: [
        '末级详情可见「学习资源」Tab，且位于知识点结构之后。',
        '编辑中切到其他 Tab 再切回，知识卡片暂存仍在。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '学习资源 Tab',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_KC-002',
      title: '知识卡片计数「N 要点 · N 模块 · N 考点」',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: 'N 要点 · N 模块 · N 考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.summary',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位知识卡片计数',
          anchorId: 'knowledge-tree.knowledge-card.summary',
        },
        {
          type: 'highlight',
          label: '高亮知识卡片计数',
          anchorId: 'knowledge-tree.knowledge-card.summary',
        },
      ],
      logicSections: [
        {
          title: '统计口径',
          items: [
            '要点数：有正文或配图的要点条数；纯空行不计。',
            '模块数：有实质内容的自定义模块个数（模块有名称或条目有正文/配图）。',
            '考点数：当前知识点关联考点个数；没有考点说明、没有例题也计入。',
            '编辑态按暂存数据计；查看态按已保存数据计。',
          ],
        },
      ],
      acceptance: [
        '3 条有内容要点、1 个有内容模块、2 个关联考点时展示「3 要点 · 1 模块 · 2 考点」。',
        '仅有空白占位要点时，要点数显示为 0。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '知识卡片顶栏计数',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-003',
      title: '核心概念 / 考点子 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '核心概念 / 考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.subtabs',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位知识卡片子 Tab',
          anchorId: 'knowledge-tree.knowledge-card.subtabs',
        },
        {
          type: 'highlight',
          label: '高亮知识卡片子 Tab',
          anchorId: 'knowledge-tree.knowledge-card.subtabs',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '知识卡片内用「核心概念」「考点」切换内容；当前项高亮。',
            '查看态、编辑态都可以切换。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '切换子 Tab 只换卡片内部内容，不保存、不清暂存。',
            '同一知识点再次进入学习资源时，默认定位到核心概念tab',
          ],
        },
      ],
      acceptance: [
        '查看态与编辑态均可在核心概念、考点之间切换。',
        '编辑中切换子 Tab 后，已改要点仍在。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '核心概念 / 考点子 Tab',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-004',
      title: '平板预览入口',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '平板预览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.tablet-preview',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位平板预览',
          anchorId: 'knowledge-tree.knowledge-card.tablet-preview',
        },
        {
          type: 'highlight',
          label: '高亮平板预览',
          anchorId: 'knowledge-tree.knowledge-card.tablet-preview',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '查看态、编辑态都可以点「平板预览」，打开只读预览。',
            '预览展示当前暂存（编辑中）或已保存（查看中）的知识卡片与关联考点，不在预览里改内容。',
            '关闭预览回到点击平板预览前的tab',
          ],
        },
      ],
      acceptance: ['点击「平板预览」打开只读弹层；关闭后仍停在学习资源 Tab。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '平板预览入口',
        relatedFiles: [
          'src/components/shared/KnowledgeCardPanel.tsx',
          'src/components/shared/KnowledgeCardTabletPreview.tsx',
        ],
      },
    },
    {
      id: 'KT_KC-005',
      title: '核心概念空态',
      sourceType: 'code+decision',
      objectType: 'state',
      objectName: '暂无内容',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.concept-empty',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位核心概念空态',
          anchorId: 'knowledge-tree.knowledge-card.concept-empty',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '查看态：没有任何有正文或配图的要点、也没有任何有实质内容的自定义模块时，核心概念区展示「暂无内容」。',
            '编辑态：至少保留一个要点输入位，便于填写。',
          ],
        },
      ],
      acceptance: ['未配置任何核心概念内容的查看态出现「暂无内容」。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '核心概念空态',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-006',
      title: '要点列表',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: 'N条',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.keypoints',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位要点',
          anchorId: 'knowledge-tree.knowledge-card.keypoints',
        },
        {
          type: 'highlight',
          label: '高亮要点',
          anchorId: 'knowledge-tree.knowledge-card.keypoints',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '查看态：\n只展示有正文或配图的要点；\n多条时按当前顺序编号显示。',
            '编辑态\n至少保留一个输入位；可添加要点，多条要点时，可上移下移。',
          ],
        },
        {
          title: '统计口径',
          items: [
            '要点标题旁展示「N条」，N 为当前要点列表条数。',
            '查看态：只计有正文或配图的要点；没有此类要点时显示「0条」。',
            '编辑态：按当前输入位计数，空白占位也计入。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '保存时去掉纯空要点（无正文且无配图），不因此拦截保存。',
            '查看态和学生端不出现空要点行。',
          ],
        },
      ],
      acceptance: [
        '编辑态没有粘贴拆分入口。',
        '保存后只留下有正文或配图的要点。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '要点列表 / 粘贴拆分下线 / 空行保存',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-020',
      title: '添加要点',
      sourceType: 'code',
      objectType: 'button',
      objectName: '添加要点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.add-keypoint',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位添加要点',
          anchorId: 'knowledge-tree.knowledge-card.add-keypoint',
        },
        {
          type: 'highlight',
          label: '高亮添加要点',
          anchorId: 'knowledge-tree.knowledge-card.add-keypoint',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅在编辑知识点详情-核心概念的要点区域内展示。',
            '查看态不展示该按钮。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '每点击一次，在当前要点列表末尾新增一个空白要点输入位；不覆盖已有要点，不弹出确认。',
            '可连续多次添加。\n\n【9.8需求评审后补充】\n[核心概念的要点]、以及后面的[自定义模块]、[自定义模块的条目]、[解题步骤]、[解题要点]，[Tips]，这六项数据的上限都是50个',
            '点击后不自动把光标移入新要点。',
            '新增后，若要点多于一条，各要点显示序号，并可用上移、下移调整顺序。',
          ],
        },
      ],
      acceptance: [
        '编辑态要点区可见「添加要点」；查看态不可见。',
        '每点一次列表末尾多一条空白要点，已有要点保持不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '要点列表添加入口（按当前实现补齐）',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-007',
      title: '自定义类型模块',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '自定义模块',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.modules',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位自定义模块',
          anchorId: 'knowledge-tree.knowledge-card.modules',
        },
        {
          type: 'highlight',
          label: '高亮自定义模块',
          anchorId: 'knowledge-tree.knowledge-card.modules',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '查看态\n核心概念下可有多块自定义名称模块；\n只展示有实质内容的模块与条目。',
            '编辑态\n可改模块名称、添加条目、排序；\n新建模块需先在弹窗填写名称，\n弹窗里的「确定」按钮在名称为空时不可点击。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '点击「保存编辑」时，若存在模块名称为空，拦截并 Toast：「请填写所有模块的名称后再保存」。',
            '点击「保存编辑」时，若同一知识卡片内模块名称重复，拦截并 Toast：「模块名称不能重复」。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '保存时去掉纯空条目（无正文且无配图），不因此拦截保存。',
            '查看态和学生端不出现空条目。',
          ],
        },
      ],
      acceptance: [
        '新建模块名称为空时无法确定。',
        '保存时两个模块同名弹出「模块名称不能重复」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '自定义模块名称校验 / 空条目保存',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-021',
      title: '添加条目',
      sourceType: 'code',
      objectType: 'button',
      objectName: '添加条目',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.add-module-item',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位添加条目',
          anchorId: 'knowledge-tree.knowledge-card.add-module-item',
        },
        {
          type: 'highlight',
          label: '高亮添加条目',
          anchorId: 'knowledge-tree.knowledge-card.add-module-item',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅在编辑知识点详情-核心概念下每一个已有自定义模块的底部展示。',
            '查看态不展示该按钮；当前知识卡片还没有自定义模块时也不出现，需先添加模块。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '每点击一次，在该模块当前条目列表末尾新增一个空白条目输入位；不覆盖本模块已有条目，也不改动其他模块，不弹出确认。',
            '可连续多次添加。',
            '点击后不自动把光标移入新条目。',
            '新增后若该模块条目多于一条，各条目显示序号，并可用上移、下移调整顺序。',
          ],
        },
      ],
      acceptance: [
        '编辑态每个自定义模块底部可见「添加条目」；查看态不可见。',
        '每点一次只在当前模块末尾多一条空白条目，其他模块不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '自定义模块添加入口（按当前实现补齐）',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-008',
      title: '富文本与配图',
      sourceType: 'decision',
      objectType: 'field',
      objectName: '富文本编辑',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.richtext',
      anchorStatus: 'planned',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位要点编辑',
          anchorId: 'knowledge-tree.knowledge-card.keypoints',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '要点、自定义模块条目的正文在编辑态使用乐课网统一的富文本编辑能力。',
            '已插入的配图随正文展示；学生端同步展示。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '配图通过富文本上传，不另设独立上传入口。',
            '上传支持 GIF，以及其他格式的静态图片。',
          ],
        },
      ],
      acceptance: [
        '可通过富文本插入 GIF 或静态图片。',
        '工具条其余按钮待后续完善，不作为本期拦截项。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '要点/模块配图 / 富文本占位',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-009',
      title: '考点空态与去维护考点',
      sourceType: 'code+decision',
      objectType: 'state',
      objectName: '暂无考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.exam-empty',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位考点空态',
          anchorId: 'knowledge-tree.knowledge-card.exam-empty',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '当前知识点没有关联考点时，仅在「考点清单」模块内展示空态「暂无考点」，并说明请先在「关联考点」Tab 维护名称与类型。\n空态不覆盖整页，也不影响下方独立的「知识点Tips」模块。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '提供「去维护考点」操作按钮：\n点击后切到「关联考点」Tab；若正处于编辑知识点详情，保持编辑态。',
          ],
        },
      ],
      acceptance: [
        '无关联考点时，「考点清单」模块内可见「暂无考点」和「去维护考点」；「知识点Tips」仍独立展示。',
        '编辑中点击「去维护考点」后仍为编辑态且落在关联考点 Tab。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点空态（沿用关联考点已确认跳转）',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-010',
      title: '考点卡片回显',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '考点列表',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.exam-list',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位考点列表',
          anchorId: 'knowledge-tree.knowledge-card.exam-list',
        },
        {
          type: 'highlight',
          label: '高亮考点列表',
          anchorId: 'knowledge-tree.knowledge-card.exam-list',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '配置后台按关联考点当前顺序列出全部考点；名称、类型只读回显主数据，不可在本页增删改名称或类型。',
            '每条显示有例题 / 无例题；可展开收起说明与例题。',
          ],
        },
        {
          title: '展示顺序',
          items: [
            '与关联考点列表顺序一致，不做上移下移。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '学生端：当某考点既没有考点说明、也没有例题题干时，不展示该考点。',
            '配置后台知识卡片仍展示全部关联考点，便于继续维护说明和例题。',
          ],
        },
      ],
      acceptance: [
        '卡片上考点名称、类型与关联考点 Tab 一致且不可改。',
        '仅有关联考点、尚无说明和题干时，后台卡片仍列出该考点。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点卡片回显 / 学生端不展示条件',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-011',
      title: '考点说明',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: '考点说明',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.exam-desc',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位考点说明',
          anchorId: 'knowledge-tree.knowledge-card.exam-desc',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '编辑态可填写考点说明\n\n每个输入模块，为空的时候，显示静态的提示文案——不填写，则学生端考点说明处显示【暂无】',
            '保存不因说明为空而拦截。',
            '平板预览中：有考点但说明为空时，考点说明处展示「暂无」。',
          ],
        },
      ],
      acceptance: ['说明为空仍可保存；预览该考点说明位置为「暂无」。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点说明选填与预览空态',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-026',
      title: '知识点Tips',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '知识点Tips',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.knowledge-tips',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位知识点Tips',
          anchorId: 'knowledge-tree.knowledge-card.knowledge-tips',
        },
        {
          type: 'highlight',
          label: '高亮知识点Tips',
          anchorId: 'knowledge-tree.knowledge-card.knowledge-tips',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '考点清单页拆成两个并列模块：上方「考点清单」，下方「知识点Tips」。',
            '查看态：若一条都没有的时候，显示静态提示文案——不填写，则学生端【知识点Tips】模块显示暂无；有内容时，则按实际内容显示，多条按当前顺序编号。\n\n编辑态：默认有一个输入位。输入为空时，显示静态提示文案——不填写，则学生端【知识点Tips】模块显示暂无\n\n编辑态：多于一条时，各条显示序号，并可上移、下移。不少于 2 条时，每条可删除；只剩 1 条时不提供删除。',
            '选填；保存不因未填写而拦截。保存时去掉纯空 Tips，不因此拦截保存。查看态和学生端不出现空行。',
            '平板预览 / 学生端：考点清单页固定展示「知识点Tips」模块；有内容按顺序展示正文（多条编号）；\n\n无内容时模块仍然会在，内容会显示「暂无」。',
          ],
        },
      ],
      acceptance: [
        '考点子 Tab 先展示「考点清单」，其下为「知识点Tips」，Tips 不出现在某个考点卡片内部。',
        '编辑态默认一条；点「添加Tips」末尾多一条；不少于 2 条时可排序、删除。',
        '配置端全部未填写时展示「不填写，则学生端【知识点Tips】模块显示暂无」。',
        '平板预览考点清单页未填写时模块仍在，内容为「暂无」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点清单页「知识点Tips」',
        relatedFiles: [
          'src/components/shared/KnowledgeCardPanel.tsx',
          'src/components/shared/KnowledgeCardTabletPreview.tsx',
        ],
      },
    },
    {
      id: 'KT_KC-027',
      title: '添加Tips',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '添加Tips',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.add-knowledge-tip',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位添加Tips',
          anchorId: 'knowledge-tree.knowledge-card.add-knowledge-tip',
        },
        {
          type: 'highlight',
          label: '高亮添加Tips',
          anchorId: 'knowledge-tree.knowledge-card.add-knowledge-tip',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅在编辑知识点详情-考点清单的「知识点Tips」模块底部展示。',
            '查看态不展示该按钮。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '每点击一次，在当前 Tips 列表末尾新增一个空白输入位；不覆盖已有 Tips，不弹出确认。',
            '可连续多次添加。',
            '点击后不自动把光标移入新 Tips。',
            '新增后，若 Tips 多于一条，各条显示序号，并可用上移、下移调整顺序；\n\n不少于 2 条时每条可删除。若新增tips，如果无内容，可直接删除，如果有内容，点击删除icon的时候，显示弹窗提示——确认删除吗？取消，确认。',
          ],
        },
      ],
      acceptance: [
        '编辑态知识点Tips 区可见「添加Tips」；查看态不可见。',
        '每点一次列表末尾多一条空白 Tips，已有内容保持不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点清单页「知识点Tips」',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-012',
      title: '典型例题',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: '典型例题',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.example',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位典型例题',
          anchorId: 'knowledge-tree.knowledge-card.example',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '每考点最多可维护一道典型例题。\n题干、解题步骤、解题要点均可不填；',
            '保存不因例题为空而拦截。',
            '无题干时，编辑区不展开解题步骤与解题要点的录入模块；\n平板预览中典型例题模块展示「暂无」。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '编辑态可手写题干。',
            '删除例题遵循「有内容时的删除确认」。',
          ],
        },
      ],
      acceptance: [
        '题干为空仍可保存。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '典型例题选填 / 系统选择入口',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-022',
      title: '系统选择',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '系统选择',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.system-select',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位系统选择',
          anchorId: 'knowledge-tree.knowledge-card.system-select',
        },
        {
          type: 'highlight',
          label: '高亮系统选择',
          anchorId: 'knowledge-tree.knowledge-card.system-select',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅在编辑知识点详情、典型例题题干旁展示。',
            '查看态不展示该按钮。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点击后直接打开选题弹窗',
            '当前考点是否已有例题，在弹窗内点「选用」时再判断。',
          ],
        },
      ],
      acceptance: [
        '编辑态可见「系统选择」；点击后直接出现选题弹窗，不先出覆盖确认。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '系统选择入口（按当前实现补齐角标）',
        relatedFiles: [
          'src/components/shared/KnowledgeCardPanel.tsx',
          'src/components/shared/LekeQuestionPicker.tsx',
        ],
      },
    },
    {
      id: 'KT_KC-013',
      title: '解题步骤与解题要点',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: '解题步骤 / 解题要点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.steps-tips',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位解题步骤',
          anchorId: 'knowledge-tree.knowledge-card.steps-tips',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '有题干后，可维护解题步骤（标题、正文、排序）与解题要点。',
            '均为选填，保存不拦截；界面不展示必填/选填标记。',
          ],
        },
        {
          title: '操作说明',
          items: ['可添加、删除、上移下移步骤或要点；有内容删除时走统一删除确认。'],
        },
      ],
      acceptance: ['有题干后可见添加步骤、添加要点；全空仍可保存。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '解题步骤 / 解题要点',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-023',
      title: '添加步骤',
      sourceType: 'code',
      objectType: 'button',
      objectName: '添加步骤',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.add-step',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位添加步骤',
          anchorId: 'knowledge-tree.knowledge-card.add-step',
        },
        {
          type: 'highlight',
          label: '高亮添加步骤',
          anchorId: 'knowledge-tree.knowledge-card.add-step',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅在填写题干后，典型例题「解题步骤」区域底部展示。',
            '查看态不展示该按钮；题干为空时整块解题步骤（含本按钮）都不展示。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '每点击一次，在当前步骤列表末尾新增一条空白步骤（标题、正文均为空）；不覆盖已有步骤，不弹出确认。',
            '可连续多次添加。',
            '点击后不自动把光标移入新步骤。',
            '新增步骤带序号；可上移、下移调整顺序，首条不能上移，末条不能下移。',
          ],
        },
      ],
      acceptance: [
        '编辑态且已有题干时可见「添加步骤」；查看态或题干为空时不可见。',
        '每点一次列表末尾多一条空白步骤，已有步骤保持不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '解题步骤添加入口（按当前实现补齐）',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-024',
      title: '添加要点（解题要点）',
      sourceType: 'code',
      objectType: 'button',
      objectName: '添加要点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.add-exam-tip',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点子 Tab', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位解题要点添加要点',
          anchorId: 'knowledge-tree.knowledge-card.add-exam-tip',
        },
        {
          type: 'highlight',
          label: '高亮解题要点添加要点',
          anchorId: 'knowledge-tree.knowledge-card.add-exam-tip',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅在填写题干后，典型例题「解题要点」区域底部展示。',
            '查看态不展示该按钮；题干为空时整块解题要点（含本按钮）都不展示。',
            '与核心概念下的「添加要点」不是同一入口。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '每点击一次，在当前解题要点列表末尾新增一条空白要点；不覆盖已有要点，不弹出确认。',
            '可连续多次添加。',
            '点击后不自动把光标移入新要点。',
            '新增要点带序号；本区不提供上移、下移。',
          ],
        },
      ],
      acceptance: [
        '编辑态且已有题干时可见解题要点区「添加要点」；查看态或题干为空时不可见。',
        '每点一次列表末尾多一条空白解题要点，已有要点保持不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '解题要点添加入口（按当前实现补齐）',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-014',
      title: '选题弹窗',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '典型例题选题',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.picker',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'openDialog', label: '打开选题弹窗', dialog: 'leke-question-picker' },
        {
          type: 'scrollTo',
          label: '定位选题弹窗',
          anchorId: 'knowledge-tree.knowledge-card.picker',
        },
      ],
      logicSections: [
        {
          title: '数据来源',
          items: [
            '题目来自当前教研员账号的个人资源库。',
          ],
        },
        {
          title: '显示说明',
          items: [
            '弹窗标题为「典型例题」。',
            '每道题折叠时只显示题干；展开后显示答案、解析。不展示来源、题型、难度。',
            '可以同时展开多题。',
            '顶部显示过滤后的「共 N 题」。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '搜索只匹配题干关键词。\n\n【9.8需求评审后补充】\n通过题干搜索典型例题时，搜索的准确性，和线上保持一致即可',
            '仅右上角可关闭；点击遮罩不关闭。关闭后清空搜索词和展开状态。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '无匹配题目时展示「暂无符合条件的题目」。',
          ],
        },
      ],
      acceptance: [
        '搜索只过滤题干；无结果出现「暂无符合条件的题目」。',
        '可同时展开两道题的答案和解析。',
        '点遮罩弹窗仍在；点右上角关闭。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '选题弹窗列表 / 搜索 / 关闭 / 题库来源 / 多题展开',
        relatedFiles: ['src/components/shared/LekeQuestionPicker.tsx'],
      },
    },
    {
      id: 'KT_KC-015',
      title: '选题「选用」与覆盖确认',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '选用',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.picker-select',
      anchorStatus: 'planned',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'openDialog', label: '打开选题弹窗', dialog: 'leke-question-picker' },
        {
          type: 'scrollTo',
          label: '定位选用',
          anchorId: 'knowledge-tree.knowledge-card.picker-select',
        },
        {
          type: 'highlight',
          label: '高亮选用',
          anchorId: 'knowledge-tree.knowledge-card.picker-select',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '在选题弹窗内点某题的「选用」时，判断当前考点是否已有典型例题（题干、步骤或要点任一有内容）。',
            '若无例题：则直接写入该题，并关闭选题弹窗。',
            '已有例题：弹出确认，文案：「当前考点已有例题，是否确认更改为新的例题？」按钮为「取消」「确认」。',
            '点取消：只关掉确认框，选题弹窗保持打开，用户可继续浏览其他题目。',
            '点确认：用所选题目覆盖当前例题的题干，然后关闭选题弹窗。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '写入知识卡片的内容仅为题干',
            '选题弹窗中预览的答案、解析不写入知识卡片。',
          ],
        },
      ],
      acceptance: [
        '无例题时点选用直接写入并关闭选题弹窗。',
        '有例题时点选用先出确认；取消后仍能在选题弹窗里看题；确认后覆盖题干、步骤、要点。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '系统选择覆盖确认 / 选用写入字段',
        relatedFiles: [
          'src/components/shared/LekeQuestionPicker.tsx',
          'src/components/shared/KnowledgeCardPanel.tsx',
        ],
      },
    },
    {
      id: 'KT_KC-016',
      title: '有内容时的删除确认',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '删除',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.delete',
      anchorStatus: 'planned',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'scrollTo',
          label: '定位删除',
          anchorId: 'knowledge-tree.knowledge-card.delete',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '删除要点、模块、模块条目、例题、解题步骤、解题要点、知识点Tips时：无内容直接删除；有内容二次确认。',
            '确认框标题：「确认删除当前{对象名}吗？」正文：删除后不可恢复」按钮为「取消」「删除」。\n\n对象名：指当前被操作的是要点、模块、例题、解题步骤、解题要点、知识点Tips',
            '编辑态要点列表、模块条目列表、知识点Tips 列表在删空后至少再留一个空占位行。知识点Tips 仅在不少于 2 条时提供删除。',
          ],
        },
      ],
      acceptance: [
        '空要点直接删；有正文的要点弹出标题为「确认删除吗？」的确认框。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '删除确认文案',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC-017',
      title: '平板预览内容',
      sourceType: 'code+decision',
      objectType: 'panel',
      objectName: '平板预览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.tablet-body',
      anchorStatus: 'planned',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'openDialog',
          label: '打开平板预览',
          dialog: 'knowledge-card-tablet-preview',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '整个页面的显示样式，按照平板端的显示样式显示',
          ],
        },
      ],
      acceptance: [
        '无核心概念时预览出现「暂无」。',
        '有考点无说明、无例题时，对应位置均为「暂无」，且可见考点1 水印。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '平板预览空态 / 考点N',
        relatedFiles: ['src/components/shared/KnowledgeCardTabletPreview.tsx'],
      },
    },
    {
      id: 'KT_KC-018',
      title: '保存编辑与取消（学习资源）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '保存编辑',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.save-edit',
      anchorStatus: 'planned',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        {
          type: 'scrollTo',
          label: '定位保存编辑',
          anchorId: 'knowledge-tree.knowledge-card.save-edit',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '「保存编辑」提交本知识点编辑暂存，其中包含知识卡片。',
            '「取消」丢弃含知识卡片在内的未保存改动，恢复进入编辑前内容。',
            '不在此重复关联考点的空名称、空类型、重名校验。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '保存前先做自定义模块空名称、重名校验，不通过则不提交。',
            '模块名校验失败时停留当前 Tab，不自动切到「学习资源」。',
            '校验通过后去掉纯空要点和纯空模块条目，再提交。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '知识卡片有改动时，待发布变更记一条维度为「学习资源」的记录；无改动不记。',
            '与其他 Tab 的改动按维度拆分，互不影响。',
          ],
        },
      ],
      acceptance: [
        '只改知识卡片后保存，变更维度出现「学习资源」。',
        '模块重名时保存失败并出现对应 Toast，且不切换详情 Tab。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '保存空白行剔除 / 模块名校验 / 变更维度',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_KC-025',
      title: '批量导入',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '批量导入',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.batch-import',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        {
          type: 'scrollTo',
          label: '定位批量导入',
          anchorId: 'knowledge-tree.knowledge-card.batch-import',
        },
        {
          type: 'highlight',
          label: '高亮批量导入',
          anchorId: 'knowledge-tree.knowledge-card.batch-import',
        },
      ],
      logicSections: [
        {
          title: '数据规则',
          items: [
            '导入模板表头在七级标题之后依次为：学业要求、考频、考点名称、考点类型、前置知识点、出题策略。模板仅含顶行填写说明 + 表头，不带示例数据行。',
            '模板顶行说明新增【学业要求列】：仅末级可填「了解/理解/掌握/运用/超纲」；留空不更新；【清空】表示清空线上内容。',
            '模板顶行说明新增【考点名称列】：仅末级可填，多个用顿号（、）分隔；留空不更新；【清空】表示清空线上全部关联考点（名称与类型都清空）；可只填考点名称、不填考点类型。',
            '模板顶行说明新增【考点类型】列：仅末级可填「基础达标/综合进阶/高分冲刺」；不能只填类型不填名称；两列都填时多个用顿号分隔且须按顺序一一对应、个数相同；留空不更新已有考点的类型；仅类型列填写【清空】且名称列填写实际名称时，只清空各考点类型，名称按导入表内容保留。',
            '学业要求写回：留空不更新该字段；【清空】将该末级置为未设置；填写合法枚举则更新为对应值。',
            '关联考点两列都留空：不更新。名称列【清空】：清空该末级全部关联考点，并清除知识卡片中对应考点说明与例题。仅类型列【清空】、名称列有实际内容：只清空各考点类型。',
            '这次导入表写了哪些考点名称，这个末级最后就只保留这些考点，不是在原列表后面追加。对照时看名称是不是一样。',
            '线上有、这次也写了的名称：当成同一个考点，原来的说明和例题先留着。\n\n线上有、这次没写的名称：这个旧考点删掉，卡片内容一并删除。\n\n这次写了、线上没有的名称：当成新考点，说明和例题为空。',
            '举例：线上现在是「函数、导数、极限」。这次导入表写「函数、不等式」。导入后只剩「函数、不等式」——「函数」还是原来那个考点，说明/例题先留着；「不等式」是新考点；「导数」「极限」删掉。',
            '只填名称、类型列留空：仍按名称整表替换；线上已有的同名考点保留原来的类型；新增考点类型为空。名称和类型都填了：类型也按导入表更新。',
            '导入通过项仍需经「保存编辑」统一提交。',
          ],
        },
        {
          title: '校验规则',
          items: [
            '学业要求仅允许填写了解、理解、掌握、运用、超纲，以及留空、【清空】；仅允许出现在末级行，非末级填写则失败。',
            '考点名称、考点类型仅允许填写在末级行。可以只填考点名称、不填考点类型。不能只填考点类型、不填考点名称。',
            '名称和类型都填了：按顿号拆开后个数必须相同，并从左到右一一对应。名称比类型少或名称比类型多：该行失败，不截断、不自动补空。',
            '类型仅允许基础达标、综合进阶、高分冲刺；同一行内考点名称不可重复。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '校验失败时，校验结果弹窗「失败明细」的「失败原因」列展示下列文案；该行对应字段不写回。括号内为问题分类名称。',
            '学业要求填了非约定值（学业要求填写不合法）：学业要求值"{填写值}"无效，学业要求仅支持填写"了解 / 理解 / 掌握 / 运用 / 超纲"。',
            '非末级填写学业要求（非末级节点填写学业要求）：学业要求仅允许填写在末级知识点行。',
            '只填考点类型、没填考点名称（考点名称与类型不成对）：不能只填写考点类型，须同时填写考点名称。',
            '名称和类型都填了但个数不一致，含名称比类型少、名称比类型多（考点名称与类型不成对）：考点名称数量（N）与考点类型数量（M）不一致。',
            '考点类型不是约定枚举（关联考点填写不合法）：考点类型"{填写值}"无效，仅支持"基础达标 / 综合进阶 / 高分冲刺"。',
            '同一行考点名称重复（关联考点填写不合法）：考点名称存在重复项。',
            '非末级填写关联考点（非末级节点填写关联考点）：关联考点仅允许填写在末级知识点行。',
            '仅清空类型但名称列为空（考点名称与类型不成对）：仅清空考点类型时，考点名称列须填写实际考点名称。',
          ],
        },
      ],
      acceptance: [
        '下载模板含学业要求、考点名称、考点类型列，且顶行说明含上述留空/【清空】口径。',
        '非末级填写学业要求或考点则校验失败。',
        '导入后要点、模块、例题不被模板列改写；名称列【清空】会清掉对应知识卡片考点内容。',
      ],
      source: {
        decisionFile:
          'docs/prd-workflow/decisions/knowledge-tree-detail-topbar-knowledge-card.decision.md',
        decisionObject: '批量导入',
        relatedFiles: [
          'src/app/system-settings/KnowledgeTree.tsx',
          'docs/prd-workflow/decisions/knowledge-tree-info-academic-requirement.decision.md',
          'docs/prd-workflow/decisions/knowledge-tree-related-exam.decision.md',
        ],
      },
    },
    {
      id: 'KT_KC-019',
      title: '添加子节点「已有详细内容」',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '该知识点已有详细内容',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.add-child-has-detail',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        {
          type: 'openDialog',
          label: '打开添加子节点确认',
          dialog: 'add-child-has-detail',
        },
        {
          type: 'scrollTo',
          label: '定位添加子节点确认',
          anchorId: 'knowledge-tree.add-child-has-detail',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '对末级知识点添加子节点时，若判定已有详细内容，先弹出确认：添加后变为非末级，其知识点信息、知识点结构和学习资源将无法继续维护。',
            '确认后继续添加；取消则不添加。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '下列任一即视为有详细内容：要点有正文或配图；自定义模块有名称或条目内容/配图；知识卡片已存考点扩展记录；已填写知识点Tips；已有关联考点；已有视频或文字讲解。',
            '编辑态留下的空白占位要点不算有详细内容。',
          ],
        },
      ],
      acceptance: [
        '仅有空白占位要点的末级添加子节点时不弹该确认。',
        '已有关联考点或已有要点正文时弹出「该知识点已有详细内容」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '添加子节点有详细内容判定',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '填充示例数据',
      reason: 'Skill0 确认不审，不写入需求卡片。',
      sourceDecision: '用户确认对象 5 不用',
    },
    {
      objectName: '要点粘贴拆分',
      reason: '已确认去掉该功能，不再作为页面对象维护。',
      sourceDecision: 'Skill1 第 3 条自定义方案',
    },
    {
      objectName: '视频讲解 / 文字讲解细则',
      reason: '本轮范围外。',
      sourceDecision: 'Skill0 可跳过',
    },
    {
      objectName: '关联考点表格维护与导入导出考点列',
      reason: '已在关联考点注册表中确认，本册不重写。',
      sourceDecision: 'knowledge-tree-related-exam 决策',
    },
    {
      objectName: '导出/编辑/取消/保存顶栏按钮整页合并角标',
      reason:
        '本批已把知识卡片「不导出/不导入、说明不提」写入 KT_INFO_AR-006 与 KT_KC-025；保存的学习资源校验已合并进 KT_INFO_AR-003，KT_KC-018 仍作分册切片暂不挂第二枚角标。',
      sourceDecision: 'knowledge-tree-detail-topbar-knowledge-card 决策',
    },
  ],
};
