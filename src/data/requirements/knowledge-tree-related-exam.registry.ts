import type { RequirementRegistry } from './schema';

const PAGE = '通用知识树·关联考点';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·通用知识树';
const DECISION = 'docs/prd-workflow/decisions/knowledge-tree-related-exam.decision.md';
const RELATED = [
  'src/app/system-settings/KnowledgeTree.tsx',
  'src/components/shared/KnowledgeCardPanel.tsx',
  'src/components/shared/KnowledgeCardTabletPreview.tsx',
  'src/components/shared/ImportValidationModal.tsx',
  DECISION,
];

/**
 * 全量注册表（范围限定）：通用知识树 · 关联考点 Tab 及耦合表面
 */
export const knowledgeTreeRelatedExamRegistry: RequirementRegistry = {
  registryId: 'knowledge-tree-related-exam',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '范围：末级知识点详情「关联考点」Tab，以及知识卡片回显、平板预览、导入中与关联考点耦合的规则。顶栏「导出知识树 / 编辑知识点详情 / 保存编辑」暂不在本册挂角标，待学习资源等审完后按「每按钮单角标」合并写入。不含添加子节点「有详细内容」判定。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'KT_RE-001',
      title: '关联考点 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '关联考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.tab',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到关联考点', tab: 'relatedExam' },
        { type: 'scrollTo', label: '定位关联考点 Tab', anchorId: 'knowledge-tree.related-exam.tab' },
        { type: 'highlight', label: '高亮关联考点 Tab', anchorId: 'knowledge-tree.related-exam.tab' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅末级（叶子）知识点详情展示详情 Tab；Tab 顺序为：知识点信息 → 关联考点 → 知识点结构 → 学习资源。',
            '「关联考点」用于维护该末级知识点的考点名称与类型主数据。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '查看中、编辑中都可以点「关联考点」打开本 Tab，看或改当前知识点的考点列表。',
            '若已点「编辑知识点详情」：在「知识点信息 / 关联考点 / 知识点结构 / 学习资源」之间来回切换时，只换右侧内容区，不会自动保存，也不会清掉你已改但还没点「保存编辑」的内容；要落库点「保存编辑」，要放弃点「取消」。',
          ],
        },
      ],
      acceptance: [
        '末级详情可见「关联考点」Tab，且位于知识点信息与知识点结构之间。',
        '编辑中切换到其他 Tab 再切回，关联考点暂存内容仍在。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '关联考点 Tab（清单对象）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-002',
      title: '考点数量「共 N 个考点」',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '共 N 个考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.count',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到关联考点', tab: 'relatedExam' },
        { type: 'scrollTo', label: '定位考点数量', anchorId: 'knowledge-tree.related-exam.count' },
        { type: 'highlight', label: '高亮考点数量', anchorId: 'knowledge-tree.related-exam.count' },
      ],
      logicSections: [
        {
          title: '统计口径',
          items: [
            'N 为当前知识点关联考点列表条数（编辑态取暂存列表，查看态取已保存列表）。',
            '仅当列表条数大于 0 时展示「共 N 个考点」；空列表不展示该统计，改走空态。',
          ],
        },
      ],
      acceptance: [
        '有 3 个考点时展示「共 3 个考点」。',
        '清空至 0 条后统计消失并出现空态。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点数量（清单对象）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-003',
      title: '关联考点表格（名称与类型）',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: '关联考点表格',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.table',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到关联考点', tab: 'relatedExam' },
        { type: 'scrollTo', label: '定位关联考点表格', anchorId: 'knowledge-tree.related-exam.table' },
        { type: 'highlight', label: '高亮关联考点表格', anchorId: 'knowledge-tree.related-exam.table' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '表格列：名称、类型；仅编辑态额外展示「操作」列。',
            '查看态：\n考点名称：只读，展示已保存名称\n考点类型：根据用户选择回显，未填写的时候显示',
            '编辑态：名称为输入框（占位「请输入名称」）；\n类型为下拉，可选值为，基础达标、综合进阶、高分冲刺三类（具体值待定，后续可能会有变动）新增行允许类型暂为空值，保存时不为空即可',
          ],
        },
        {
          title: '展示顺序',
          items: [
            '列表顺序有业务含义，下游（知识卡片、平板预览、学生学习端等）须按配置后台当前顺序展示。',
            '不提供上移/下移等手动调序；顺序由导入填写顺序与页面「添加考点」先后共同决定，保存后保持该顺序。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '考点名称与类型是知识点维度主数据；同一知识点内考点名称不可重复。',
            '名称/类型变更写入编辑暂存，须经「保存编辑」统一提交。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '编辑失焦或保存时若同一知识点内出现重名，拦截并 Toast：「考点名称不能重复」。',
            '点击「保存编辑」时若存在空名称，拦截并 Toast：「请填写所有考点名称后再保存」。',
            '点击「保存编辑」时若存在未选择类型的考点，拦截并 Toast：「请为所有考点选择类型」。',
          ],
        },
      ],
      acceptance: [
        '查看态名称即已保存名称，无「未命名」兜底；类型为三档标签之一。',
        '编辑态无排序按钮；添加两条后顺序与添加先后一致。',
        '改成重名后失焦或保存弹出「考点名称不能重复」。',
        '存在空名称或空类型时保存失败并出现对应 Toast。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考点名称重名 / 关联考点顺序 / 保存校验',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-004',
      title: '添加考点',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '添加考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.add',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到关联考点', tab: 'relatedExam' },
        { type: 'scrollTo', label: '定位添加考点', anchorId: 'knowledge-tree.related-exam.add' },
        { type: 'highlight', label: '高亮添加考点', anchorId: 'knowledge-tree.related-exam.add' },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '仅编辑态在表格下方展示「添加考点」。',
            '点击后在列表末尾追加一行：名称为空，类型为空（须用户再选）。',
            '追加后顺序排在现有考点之后，供下游按该顺序展示。',
          ],
        },
      ],
      acceptance: [
        '查看态无「添加考点」；编辑态点击后末尾多一行且类型未预填三档之一。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '添加考点（默认类型）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-005',
      title: '删除考点与确认弹窗',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '删除关联考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.delete',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到关联考点', tab: 'relatedExam' },
        { type: 'scrollTo', label: '定位删除操作', anchorId: 'knowledge-tree.related-exam.delete' },
        { type: 'highlight', label: '高亮删除操作', anchorId: 'knowledge-tree.related-exam.delete' },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '仅编辑态操作列提供删除。',
            '无例题且无考点说明：直接删除该关联考点，并同步移除知识卡片中同 id 考点内容。',
            '有例题或有考点说明任一存在：先弹窗确认；\n确认后同步删除关联考点及知识卡片对应说明/例题；取消则不删。',
          ],
        },
        {
          title: '显示说明',
          items: [
            '确认弹窗文案统一为：「确定删除当前考点吗？（删除后，知识卡片中对应内容将一并删除）」。',
            '操作按钮为「取消」「确认删除」。',
          ],
        },
      ],
      acceptance: [
        '仅名称类型、无说明无例题：一点删除即消失且无弹窗。',
        '有说明或有例题：出现上述统一文案；确认后关联列表与卡片该考点内容均消失。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '删除考点 / 删除确认弹窗',
        relatedFiles: [
          'src/app/system-settings/KnowledgeTree.tsx',
          'src/components/shared/KnowledgeCardPanel.tsx',
        ],
      },
    },
    {
      id: 'KT_RE-006',
      title: '关联考点空态',
      sourceType: 'code+decision',
      objectType: 'state',
      objectName: '暂无考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.empty',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到关联考点', tab: 'relatedExam' },
        { type: 'scrollTo', label: '定位空态', anchorId: 'knowledge-tree.related-exam.empty' },
        { type: 'highlight', label: '高亮空态', anchorId: 'knowledge-tree.related-exam.empty' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '列表为 0 条时展示空态主文案「暂无考点」。',
            '编辑态额外提示：「点击下方按钮添加，或通过导入批量维护」。',
            '查看态仅主文案，不展示编辑引导句。',
          ],
        },
      ],
      acceptance: [
        '无考点查看态只见「暂无考点」。',
        '编辑态空态下方仍可见「添加考点」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '空态（清单对象）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-009',
      title: '知识卡片·考点回显',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '知识卡片考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.card-echo',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'scrollTo', label: '定位知识卡片考点', anchorId: 'knowledge-tree.related-exam.card-echo' },
        { type: 'highlight', label: '高亮知识卡片考点', anchorId: 'knowledge-tree.related-exam.card-echo' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '学习资源 Tab 知识卡片中，考点名称与类型只读回显关联考点主数据；展示顺序与关联考点列表一致。',
            '卡片侧仅可维护考点说明与例题，不可增删改名称/类型。',
            '无关联考点时空态文案：「暂无考点」；副文案引导先在「关联考点」Tab 维护。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '空态提供跳转按钮「去维护考点」：点击后切到「关联考点」Tab；若当前为编辑态则保持编辑态。',
          ],
        },
      ],
      acceptance: [
        '关联考点改名/改类型后，卡片标题与类型标签同步只读回显。',
        '空态可见「去维护考点」，点击后落到关联考点 Tab。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '知识卡片·考点回显',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_RE-011',
      title: '导入模板（考点列与填写说明）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '下载模板',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.import-template',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        {
          type: 'scrollTo',
          label: '定位下载模板',
          anchorId: 'knowledge-tree.related-exam.import-template',
        },
        {
          type: 'highlight',
          label: '高亮下载模板',
          anchorId: 'knowledge-tree.related-exam.import-template',
        },
      ],
      logicSections: [
        {
          title: '数据规则',
          items: [
            '模板表头在考频后含「考点名称」「考点类型」；仅含顶行填写说明 + 表头，不带示例数据行。',
            '顶行说明：考点名称仅末级可填，多个用顿号分隔；留空不更新；名称列【清空】表示清空线上全部关联考点。',
            '顶行说明：考点类型仅末级可填「基础达标/综合进阶/高分冲刺」；可只填名称、不能只填类型；两列都填时多个用顿号分隔且与名称顺序对应、个数必须相同；留空不更新已有考点的类型；仅类型列【清空】时只清空类型、名称按文件实际内容保留。',
          ],
        },
      ],
      acceptance: [
        '下载模板含考点两列且无示例行。',
        '顶行说明区分名称列清空与类型列清空。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '导入【清空】触发条件',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-012',
      title: '导入校验与写回（关联考点）',
      sourceType: 'code+decision',
      objectType: 'data',
      objectName: '批量导入校验·关联考点',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.import-validation',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        {
          type: 'scrollTo',
          label: '定位上传校验区',
          anchorId: 'knowledge-tree.related-exam.import-validation',
        },
        {
          type: 'highlight',
          label: '高亮上传校验区',
          anchorId: 'knowledge-tree.related-exam.import-validation',
        },
      ],
      logicSections: [
        {
          title: '校验规则',
          items: [
            '关联考点仅允许填写在末级知识点行；非末级填写则该行失败，不写回。',
            '考点名称、考点类型两列都留空：不更新该末级关联考点。',
            '可以只填考点名称、不填考点类型（与页面编辑一致：允许先只填名称）。',
            '不能只填考点类型、不填考点名称。该行校验失败。',
            '名称和类型都填了：按顿号拆开后个数必须相同，并从左到右按顺序一一对应。名称比类型少或名称比类型多：该行失败，不截断、不自动补空。',
            '考点类型仅允许：基础达标、综合进阶、高分冲刺。',
            '同一行内考点名称不可重复。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '这次导入表写了哪些考点名称，这个末级最后就只保留这些考点，不是在原列表后面追加。对照时看名称是不是一样。',
            '线上有、这次也写了的名称：当成同一个考点，原来的说明和例题先留着。',
            '线上有、这次没写的名称：这个旧考点删掉，知识卡片里对应说明和例题一并删除。',
            '这次写了、线上没有的名称：当成新考点写入，说明和例题为空。',
            '举例：线上现在是「函数、导数、极限」。这次导入表写「函数、不等式」。导入后只剩「函数、不等式」——「函数」还是原来那个考点，说明/例题先留着；「不等式」是新考点；「导数」「极限」删掉。',
            '只填名称、类型列留空：仍按名称整表替换；线上已有的同名考点保留原来的类型；新增考点类型为空。',
            '名称和类型都填了：类型也按导入表更新。',
            '名称列填写【清空】/清空：无论类型列是否清空，清空该末级全部关联考点，并清除知识卡片中对应考点说明与例题。',
            '仅类型列填写【清空】/清空、名称列有实际名称：只把各考点类型清空，名称按导入表中的名称保留。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '校验失败时，校验结果弹窗「失败明细」的「失败原因」列展示下列文案；该行不导入。括号内为问题分类名称。',
            '非末级填写（非末级节点填写关联考点）：关联考点仅允许填写在末级知识点行。',
            '只填考点类型、没填考点名称（考点名称与类型不成对）：不能只填写考点类型，须同时填写考点名称。',
            '名称和类型都填了但个数不一致，含名称比类型少、名称比类型多（考点名称与类型不成对）：考点名称数量（N）与考点类型数量（M）不一致。N、M 为按顿号拆开后的实际个数。',
            '类型不是约定枚举（关联考点填写不合法）：考点类型"{填写值}"无效，仅支持"基础达标 / 综合进阶 / 高分冲刺"。',
            '同一行名称重复（关联考点填写不合法）：考点名称存在重复项。',
            '仅清空类型但名称列为空（考点名称与类型不成对）：仅清空考点类型时，考点名称列须填写实际考点名称。',
          ],
        },
      ],
      acceptance: [
        '非末级填写考点校验失败。',
        '名称与类型数量不一致或非法类型可在结果中看到失败原因。',
        '文档/验收口径含：名称列清空整表清空；仅类型列清空则只清类型。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '导入写回策略 / 【清空】触发条件',
        relatedFiles: [
          'src/app/system-settings/KnowledgeTree.tsx',
          'src/components/shared/ImportValidationModal.tsx',
        ],
      },
    },
    {
      id: 'KT_RE-013',
      title: '批量导入弹窗·考点说明',
      sourceType: 'code+decision',
      objectType: 'copy',
      objectName: '导入说明（考点）',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.import-dialog-guide',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        {
          type: 'scrollTo',
          label: '定位导入说明',
          anchorId: 'knowledge-tree.related-exam.import-dialog-guide',
        },
        {
          type: 'highlight',
          label: '高亮导入说明',
          anchorId: 'knowledge-tree.related-exam.import-dialog-guide',
        },
      ],
      logicSections: [

      ],
      acceptance: [
        '打开批量导入可见含考点类型三档枚举的说明条目。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '批量导入弹窗考点说明（清单对象）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_RE-014',
      title: '平板预览中的考点展示',
      sourceType: 'code+decision',
      objectType: 'panel',
      objectName: '平板预览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.related-exam.tablet-preview',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        {
          type: 'openDialog',
          label: '打开平板预览',
          dialog: 'knowledge-card-tablet-preview',
        },
        {
          type: 'scrollTo',
          label: '定位平板预览考点',
          anchorId: 'knowledge-tree.related-exam.tablet-preview',
        },
        {
          type: 'highlight',
          label: '高亮平板预览考点',
          anchorId: 'knowledge-tree.related-exam.tablet-preview',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '平板预览只读渲染当前草稿/已保存的关联考点及卡片扩展内容（说明、例题）。',
            '保留「考点N」水印编号（学生端样式）；后台关联表与卡片标题行可不展示该编号。',
            '预览中考点展示顺序须与配置后台关联考点当前顺序一致。',
            '无关联考点时预览提示当前暂无关联考点（或等价空态），不编造考点。',
          ],
        },
      ],
      acceptance: [
        '预览可见「考点1/2…」水印，且考点先后与关联考点 Tab 列表一致。',
        '后台调整顺序或增删后，预览顺序同步变化（以当前草稿为准）。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '平板预览考点展示',
        relatedFiles: ['src/components/shared/KnowledgeCardTabletPreview.tsx'],
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '导出知识树 / 编辑知识点详情 / 取消 / 保存编辑（顶栏按钮）',
      reason:
        '本轮只审关联考点 Tab 编辑态与非编辑态，顶栏共用按钮暂不挂角标；后续整页合并为每按钮单角标后再写入。',
      sourceDecision: '用户确认暂缓顶栏角标',
    },
    {
      objectName: '知识卡片考点回显 / 平板预览',
      reason:
        '属于学习资源 Tab 耦合表面，本轮先不挂角标；后续单独审核时再打开 KT_RE-009、KT_RE-014。',
      sourceDecision: '用户确认本轮只审关联考点页面',
    },
    {
      objectName: '批量导入弹窗·考点说明',
      reason: '用户已将考点说明并入 KT_INFO_AR-009，KT_RE-013 保留条目但不挂角标。',
      sourceDecision: '用户确认融合到 AR-009',
    },
    {
      objectName: '添加子节点时「有详细内容」判定',
      reason: '本轮可跳过；用户指定留待学习资源审核时再审',
      sourceDecision: '明确不重审（本轮可跳过）',
    },
    {
      objectName: '知识点信息学业要求/考频/策略内部细则',
      reason: '已有独立注册表或本轮无耦合重审',
      sourceDecision: '可跳过对象',
    },
    {
      objectName: '知识点结构 Tab',
      reason: '与本轮关联考点无口径重写',
      sourceDecision: '可跳过对象',
    },
    {
      objectName: '视频讲解细则',
      reason: '与本轮无耦合',
      sourceDecision: '可跳过对象',
    },
    {
      objectName: '左侧目录树结构编辑细则',
      reason: '本轮未调整',
      sourceDecision: '可跳过对象',
    },
    {
      objectName: '发布确认/定时发布等',
      reason: '本轮未调整',
      sourceDecision: '可跳过对象',
    },
  ],
};
