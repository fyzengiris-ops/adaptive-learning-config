import type { RequirementRegistry } from './schema';

const PAGE = '通用知识树·知识点信息·学业要求';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·通用知识树';
const DECISION = 'docs/prd-workflow/decisions/knowledge-tree-info-academic-requirement.decision.md';
const RELATED = [
  'src/app/system-settings/KnowledgeTree.tsx',
  'src/components/shared/ImportValidationModal.tsx',
  'src/data/prd-rules/knowledge-tree-2.01.ts',
  'src/data/prd-rules/knowledge-tree-2.04.ts',
  DECISION,
];

/**
 * 增量注册表：通用知识树 · 知识点信息 · 学业要求（A∪B）
 */
export const knowledgeTreeInfoAcademicRequirementRegistry: RequirementRegistry = {
  registryId: 'knowledge-tree-info-academic-requirement',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '增量范围：末级知识点「知识点信息」新增学业要求字段，以及考频未设置对齐、保存/取消、导入导出相关连带对象。不覆盖知识点结构、学习资源、发布等 C 类能力。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'KT_INFO_AR-001',
      title: '学业要求卡片',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: '学业要求',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.academic-requirement',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到知识点信息', tab: 'info' },
        { type: 'scrollTo', label: '定位学业要求卡片', anchorId: 'knowledge-tree.info.academic-requirement' },
        { type: 'highlight', label: '高亮学业要求卡片', anchorId: 'knowledge-tree.info.academic-requirement' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '仅末级（叶子）知识点展示学业要求卡片，位置在考频卡片左侧、同排布局。',
            '可选值：了解、理解、掌握、运用、超纲；字段非必填。',
            '未配置时展示【未设置】；不区分「从未设置」与「已清空」。',
            '非编辑态只读查看；编辑态为下拉选择（含「未设置」）。',
            '学业要求无论是否已保存，都不在左侧知识树节点上显示标签；左侧末级仅保留考频标签。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '编辑态选择后写入当前编辑暂存，不单独即时落库。',
            '与考频、策略及结构/学习资源等同属一次编辑会话：切换 Tab/字段不自动保存、不丢暂存。',
            '仅点击「保存编辑」统一提交；仅「取消/返回」在有未保存修改时二次确认后丢弃。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '新建末级知识点时，学业要求默认未设置（不预填具体枚举值）。',
            '保存后变更维度归属「知识点信息」；待发布变更详情文案保持笼统「修改知识点配置」。',
          ],
        },
      ],
      acceptance: [
        '末级节点在考频左侧可见学业要求；非末级不展示。',
        '未设置展示【未设置】；编辑可选五档枚举或未设置。',
        '左侧树节点不出现学业要求标签。',
        '改后未点保存即取消，有确认且丢弃修改。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '学业要求卡片（新建末级默认值）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_INFO_AR-002',
      title: '考频卡片（未设置与布局对齐）',
      sourceType: 'code+decision',
      objectType: 'field',
      objectName: '考频',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.exam-frequency',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到知识点信息', tab: 'info' },
        { type: 'scrollTo', label: '定位考频卡片', anchorId: 'knowledge-tree.info.exam-frequency' },
        { type: 'highlight', label: '高亮考频卡片', anchorId: 'knowledge-tree.info.exam-frequency' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '考频与学业要求同排，位于学业要求右侧。',
            '可选值：高频、中频、低频；非必填。',
            '无值一律展示【未设置】，不区分从未设置与已清空。',
            '编辑态下拉含「未设置」；新建末级默认未设置。',
            '左侧知识树末级节点仍展示考频标签（有值时）。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '编辑态修改考频后写入暂存；左侧考频标签可即时回显编辑中的值。',
            '最终以「保存编辑」提交；取消规则与学业要求同一编辑会话。',
          ],
        },
      ],
      acceptance: [
        '考频在学业要求右侧同排。',
        '无值显示【未设置】。',
        '左侧树仅体现考频标签、不体现学业要求。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '考频卡片（未设置展示）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_INFO_AR-003',
      title: '保存编辑',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '保存编辑',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.save-edit',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'scrollTo', label: '定位保存编辑', anchorId: 'knowledge-tree.info.save-edit' },
        { type: 'highlight', label: '高亮保存编辑', anchorId: 'knowledge-tree.info.save-edit' },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '点击后统一提交本知识点编辑暂存中的全部改动（含学业要求、考频、策略及结构/学习资源等）。',
            '提交后进入待发布；变更维度为「知识点信息」时，详情文案保持「修改知识点配置」笼统表述。\n\n【9.8需求评审后补充】\n本期新增的所有数据，都跟着版本走，发布新版本后，下游可取到最新的数据',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '保存前先校验关联考点：空名称 Toast「请填写所有考点名称后再保存」；未选类型 Toast「请为所有考点选择类型」；重名 Toast「考点名称不能重复」。不通过则不提交，并切到「关联考点」Tab。',
            '再校验知识卡片自定义模块：空名称 Toast「请填写所有模块的名称后再保存」；同一卡片内重名 Toast「模块名称不能重复」。不通过则不提交，停留当前 Tab，自动切到「学习资源」。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '校验通过后去掉纯空要点和纯空模块条目（无正文且无配图），不因此拦截保存。',
            '知识卡片有改动时，待发布变更记一条维度为「学习资源」的记录；无改动不记。与其他 Tab 的改动按维度拆分。',
          ],
        },
      ],
      acceptance: [
        '保存后学业要求写入节点并可在只读态看到。',
        '待发布列表维度为知识点信息，详情文案笼统不点名单字段。',
        '模块重名时保存失败并 Toast「模块名称不能重复」，且不切换详情 Tab。',
        '只改知识卡片后保存，变更维度出现「学习资源」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '保存编辑',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_INFO_AR-004',
      title: '取消编辑',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '取消',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.cancel-edit',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'scrollTo', label: '定位取消', anchorId: 'knowledge-tree.info.cancel-edit' },
        { type: 'highlight', label: '高亮取消', anchorId: 'knowledge-tree.info.cancel-edit' },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '有未保存修改（含仅改学业要求）时，取消须二次确认。',
            '确认文案：「当前有未保存的修改，确定要放弃吗？」',
            '确认后丢弃全部暂存改动并退出编辑态；无未保存修改时可直接退出。',
          ],
        },
      ],
      acceptance: [
        '仅改学业要求后点取消，仍弹出确认。',
        '确认后学业要求恢复为进入编辑前的值。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '取消编辑',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_INFO_AR-005',
      title: '编辑知识点详情入口与回显',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '编辑知识点详情',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.edit-entry',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'scrollTo', label: '定位编辑入口', anchorId: 'knowledge-tree.info.edit-entry' },
        { type: 'highlight', label: '高亮编辑入口', anchorId: 'knowledge-tree.info.edit-entry' },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '非编辑态点击「编辑知识点详情」进入编辑态。',
            '进入时回显当前已保存的学业要求、考频、策略等内容到编辑暂存。',
            '若字段未设置，编辑态对应控件为未设置态，不默认带入具体枚举值。',
          ],
        },
      ],
      acceptance: [
        '已保存学业要求进入编辑后下拉回显对应值。',
        '未设置进入编辑后为未设置，不自动选中了解/理解等。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '编辑中切换字段 / Tab（与既有考频规则对齐）',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_INFO_AR-006',
      title: '导出知识树',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '导出知识树',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.export',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'scrollTo', label: '定位导出', anchorId: 'knowledge-tree.info.export' },
        { type: 'highlight', label: '高亮导出', anchorId: 'knowledge-tree.info.export' },
      ],
      logicSections: [
        {
          title: '数据规则',
          items: [
            '导出表的表头在七级标题之后、考频之前增加「学业要求」列。',
            '仅末级知识点导出学业要求，取值为了解/理解/掌握/运用/超纲；未设置时该单元格留空（不写「未设置」文案）。',
            '表头在考频之后增加「考点名称」「考点类型」两列，其后为前置知识点、出题策略。',
            '仅末级知识点导出关联考点；多个考点用顿号（、）分隔，名称与类型按当前列表顺序一一对应。',
            '无有效关联考点时，考点名称、考点类型两列留空。',
            '导出表的顶部说明文案有更新，以当前原型导出的最新文案进行更新',
          ],
        },
      ],
      acceptance: [
        '导出文件含学业要求列且位于考频左侧。',
        '未设置学业要求的末级行该列为空。',
        '导出文件在考频后含考点名称、考点类型列；多个考点顿号分隔且顺序对应。',
        '名称为空的考点不出现在导出的名称/类型列中。',
        '通用策略导出为【通用策略】。',
        '导出文件不含知识卡片列，顶行说明也不出现知识卡片相关文案。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '导出：学业要求空值单元格 / 关联考点导出列',
        relatedFiles: [
          'src/app/system-settings/KnowledgeTree.tsx',
          'docs/prd-workflow/decisions/knowledge-tree-related-exam.decision.md',
        ],
      },
    },
    {
      id: 'KT_INFO_AR-007',
      title: '导入模板（列与填写说明）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '下载模板',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.import-template',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        { type: 'scrollTo', label: '定位下载模板', anchorId: 'knowledge-tree.info.import-template' },
        { type: 'highlight', label: '高亮下载模板', anchorId: 'knowledge-tree.info.import-template' },
      ],
      logicSections: [
        {
          title: '数据规则',
          items: [
            '模板顶部表头说明文案有更新，以新的为准',
            '模板新增了学业要求列、考点名称列、考点类型列，以新模板为准',
          ],
        },
      ],
      acceptance: [
        '下载的模板含学业要求列且无示例数据行。',
        '顶行说明含学业要求留空/【清空】口径。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '导入：模板是否含示例行',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
    {
      id: 'KT_INFO_AR-008',
      title: '导入校验（新增）',
      sourceType: 'code+decision',
      objectType: 'data',
      objectName: '批量导入校验',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.import-validation',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        { type: 'scrollTo', label: '定位上传校验区', anchorId: 'knowledge-tree.info.import-validation' },
        { type: 'highlight', label: '高亮上传校验区', anchorId: 'knowledge-tree.info.import-validation' },
      ],
      logicSections: [
        {
          title: '校验规则',
          items: [
            '学业要求仅允许填写：了解、理解、掌握、运用、超纲；也允许留空或填写【清空】。',
            '学业要求仅允许出现在末级知识点行；非末级填写则该行失败，不写回。',
            '考点名称、考点类型仅允许填写在末级知识点行；非末级填写则该行失败，不写回。',
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
            '留空：不更新该末级学业要求。',
            '填写【清空】：将该末级学业要求置为未设置。',
            '填写了解/理解/掌握/运用/超纲：更新为对应值。',
            '导入通过项仍需经「保存编辑」统一提交。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '校验失败时，校验结果弹窗「失败明细」的「失败原因」列展示下列文案；该行对应字段不写回。括号内为问题分类名称。',
            '填写了非约定值（学业要求填写不合法）：学业要求值"{填写值}"无效，学业要求仅支持填写"了解 / 理解 / 掌握 / 运用 / 超纲"。',
            '非末级行填写了学业要求（非末级节点填写学业要求）：学业要求仅允许填写在末级知识点行。',
            '非末级填写关联考点（非末级节点填写关联考点）：关联考点仅允许填写在末级知识点行。',
            '只填考点类型、没填考点名称（考点名称与类型不成对）：不能只填写考点类型，须同时填写考点名称。',
            '名称和类型都填了但个数不一致，含名称比类型少、名称比类型多（考点名称与类型不成对）：考点名称数量（N）与考点类型数量（M）不一致。N、M 为按顿号拆开后的实际个数。',
            '类型不是约定枚举（关联考点填写不合法）：考点类型"{填写值}"无效，仅支持"基础达标 / 综合进阶 / 高分冲刺"。',
            '同一行名称重复（关联考点填写不合法）：考点名称存在重复项。',
            '仅清空类型但名称列为空（考点名称与类型不成对）：仅清空考点类型时，考点名称列须填写实际考点名称。',
          ],
        },
      ],
      acceptance: [
        '非法学业要求值可在校验结果中看到失败原因。',
        '非末级填写学业要求校验失败。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '导入：留空 / 【清空】 / 写回',
        relatedFiles: [
          'src/app/system-settings/KnowledgeTree.tsx',
          'src/components/shared/ImportValidationModal.tsx',
        ],
      },
    },
    {
      id: 'KT_INFO_AR-009',
      title: '批量导入弹窗导入说明',
      sourceType: 'code+decision',
      objectType: 'copy',
      objectName: '导入说明',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.info.import-dialog-guide',
      anchorStatus: 'implemented',
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'openDialog', label: '打开批量导入弹窗', dialog: 'batch-import' },
        { type: 'scrollTo', label: '定位导入说明', anchorId: 'knowledge-tree.info.import-dialog-guide' },
        { type: 'highlight', label: '高亮导入说明', anchorId: 'knowledge-tree.info.import-dialog-guide' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '说明列表文案在前置知识点后面新增一条说明——学业要求可选值：了解、理解、掌握、运用、超纲；\n\n在考频可选值的后面新增三条说明——\n考点名称：仅末级可填，多个用顿号（、）间隔；\n考点类型：仅末级可填写，多个用顿号（、）间隔，可选值为基础达标、综合进阶、高分冲刺\n考点名称与考点类型对应关系：两列都填时多个用顿号（、）间隔，且按顺序一一对应；',
          ],
        },
      ],
      acceptance: [
        '打开批量导入可见含学业要求可选值的导入说明列表。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '文案：批量导入弹窗说明列表',
        relatedFiles: ['src/app/system-settings/KnowledgeTree.tsx'],
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '知识点结构 Tab',
      reason: '增量 C 类：与本次学业要求字段无耦合，本次不重审',
      sourceDecision: '明确不重审（增量 C 类）',
    },
    {
      objectName: '学习资源 Tab',
      reason: '增量 C 类：本次未调整',
      sourceDecision: '明确不重审（增量 C 类）',
    },
    {
      objectName: '左侧目录树结构编辑细则',
      reason: '增量 C 类：本次未调整（仅明确学业要求不打标签）',
      sourceDecision: '明确不重审（增量 C 类）',
    },
    {
      objectName: '发布确认 / 定时发布 / 菁优网映射',
      reason: '增量 C 类：本次未调整',
      sourceDecision: '明确不重审（增量 C 类）',
    },
    {
      objectName: '选题策略内部配置细则',
      reason: '除导出「通用策略」文案外不重审策略业务',
      sourceDecision: '明确不重审（增量 C 类）',
    },
  ],
};
