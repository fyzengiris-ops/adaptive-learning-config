import type { RequirementRegistry } from './schema';

const PAGE = '教材体系知识树·教材根节点·课程总览';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·教材体系知识树';
const DECISION = 'docs/prd-workflow/decisions/textbook-tree-textbook-course-overview.decision.md';
const RELATED = ['src/app/system-settings/TextbookTree.tsx', DECISION];

const navActivate = {
  type: 'navigate' as const,
  label: '进入知识体系-教材体系知识树',
  to: '/knowledge-system',
};

/**
 * 全量注册表：教材根节点（学科·年级）选中后，「课程」Tab 下专题课/拓展课/同步课只读总览
 * 来源：当前页面代码实现 + 产品确认口径（无 Skill1 题库）
 */
export const textbookTreeTextbookCourseOverviewRegistry: RequirementRegistry = {
  registryId: 'textbook-tree-textbook-course-overview',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '教材根节点「学科·年级」选中且右侧「课程」Tab 时的总览区：专题课总览、拓展课总览、同步课总览。三者均为只读。不含章级综合课维护、知识点总览、练习试卷总览。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'TB_TCO-001',
      title: '教材根节点·课程入口',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.textbook-course-overview.course-tab',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '选中教材根节点', tab: 'textbook-root' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        {
          type: 'scrollTo',
          label: '定位课程 Tab',
          anchorId: 'textbook-tree.textbook-course-overview.course-tab',
        },
        {
          type: 'highlight',
          label: '高亮课程 Tab',
          anchorId: 'textbook-tree.textbook-course-overview.course-tab',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '左侧章节树点选最上方「学科·年级」（教材根节点、未选中具体章/节/小节）时，右侧进入教材级详情。',
            '教材级顶栏 Tab 含「知识点」「课程」「练习试卷」；点「课程」进入本册所述课程总览区。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '从章/节/小节切回根节点后，再进「课程」仍进入教材级课程总览，不再展示章级「综合课维护」。',
          ],
        },
      ],
      acceptance: [
        '选中教材根节点并切到「课程」时，可见课程总览子 Tab，而非章级综合课维护。',
        '选中具体章节点时，不使用本册总览布局。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '教材根节点·课程入口',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_TCO-002',
      title: '课程总览子 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '专题课总览 / 拓展课总览 / 同步课总览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.textbook-course-overview.sub-tabs',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '选中教材根节点', tab: 'textbook-root' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        {
          type: 'scrollTo',
          label: '定位总览子 Tab',
          anchorId: 'textbook-tree.textbook-course-overview.sub-tabs',
        },
        {
          type: 'highlight',
          label: '高亮总览子 Tab',
          anchorId: 'textbook-tree.textbook-course-overview.sub-tabs',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '「课程」下子 Tab 文案依次为「专题课总览」「拓展课总览」「同步课总览」，三者互斥，同时只亮一个。',
            '进入教材根节点课程区时，默认停在「专题课总览」。',
            '再次点选教材根节点（离开后再回来）时，子 Tab 重置为「专题课总览」，不记住上次停在拓展或同步。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点任一子 Tab 只切换下方总览内容区，不提交、不改章节数据。',
          ],
        },
      ],
      acceptance: [
        '进入根节点课程区默认亮「专题课总览」。',
        '切到拓展/同步后再回根节点，「专题课总览」重新为默认选中。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '默认 Tab / 课程总览子 Tab',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_TCO-003',
      title: '专题课总览',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '专题课总览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.textbook-course-overview.topic',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '选中教材根节点', tab: 'textbook-root' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到专题课总览', tab: 'overview-topic' },
        {
          type: 'scrollTo',
          label: '定位专题课总览',
          anchorId: 'textbook-tree.textbook-course-overview.topic',
        },
        {
          type: 'highlight',
          label: '高亮专题课总览',
          anchorId: 'textbook-tree.textbook-course-overview.topic',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '区域标题为「专题课总览」，并提示聚合展示各章专题课视频及绑定试卷（仅查看）。',
            '按教材章节树的章节点顺序，逐章展示；每章先出现章标题条，再出现该章专题课内容。',
            '章标题展示章名称，旁注「（X个课程·Y份试卷）」；X 为该章专题课视频条数，Y 为这些视频下已绑定练习试卷套数之和。',
            '无专题课视频的章仍展示该章标题条，记为「（0个课程·0份试卷）」，内容区空态文案为「暂未添加视频」。',
            '有视频时，按章编辑态同构：每个视频一块卡片；卡片头展示视频名、时长、体积、来源；卡片体展示该视频绑定的配套练习试卷。',
            '某视频未绑定试卷时，卡片体空态为「暂未绑定配套练习试卷」。',
            '视频行提供预览入口；不提供上传、从资源库选择、添加试卷、移除。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '专题课数据取自各章「综合课·专题课」名单（章级维护结果），不聚合同步课叶子节点视频。',
            '试卷只统计挂在该章专题课视频下的绑定试卷，不计入章「练习试卷」Tab、拓展课或同步课名单。',
            '本总览只读镜像章级已保存/当前内存中的专题课配置，不在总览内改写名单。',
          ],
        },
        {
          title: '统计口径',
          items: [
            'X = 该章专题课视频条数。',
            'Y = 该章全部专题课视频下绑定试卷条数合计（按绑定关系展开计数）。',
          ],
        },
      ],
      acceptance: [
        '有样例数据的章可见「章名（N个课程·M份试卷）」及视频下挂试卷。',
        '无视频的章仍出现标题「（0个课程·0份试卷）」与「暂未添加视频」。',
        '总览内看不到添加/移除类操作按钮。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课总览 / 空章 / 章内展示形态',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_TCO-004',
      title: '拓展课总览',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '拓展课总览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.textbook-course-overview.extension',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '选中教材根节点', tab: 'textbook-root' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到拓展课总览', tab: 'overview-extension' },
        {
          type: 'scrollTo',
          label: '定位拓展课总览',
          anchorId: 'textbook-tree.textbook-course-overview.extension',
        },
        {
          type: 'highlight',
          label: '高亮拓展课总览',
          anchorId: 'textbook-tree.textbook-course-overview.extension',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '与「专题课总览」同一套结构与空态规则，仅数据换成各章「综合课·拓展课」。',
            '章标题旁注「（X个课程·Y份试卷）」的 X/Y 口径分别对应拓展课视频条数与其绑定试卷合计。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '拓展课数据取自各章「综合课·拓展课」名单，与专题课、同步课、章「练习试卷」Tab 分开。',
            '本总览只读，不在总览内改写拓展课名单。',
          ],
        },
      ],
      acceptance: [
        '切到「拓展课总览」后结构与专题课总览一致，内容为拓展课数据。',
        '空章同样展示「（0个课程·0份试卷）」与「暂未添加视频」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课总览结构',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_TCO-005',
      title: '同步课总览',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '同步课总览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.textbook-course-overview.sync',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '选中教材根节点', tab: 'textbook-root' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到同步课总览', tab: 'overview-sync' },
        {
          type: 'scrollTo',
          label: '定位同步课总览',
          anchorId: 'textbook-tree.textbook-course-overview.sync',
        },
        {
          type: 'highlight',
          label: '高亮同步课总览',
          anchorId: 'textbook-tree.textbook-course-overview.sync',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '区域标题为「同步课总览」，提示聚合展示该教材下所有章节关联的同步课（仅查看）。',
            '按章 → 节 → 小节（若有）树形聚合展示叶子同步课视频卡片；结构沿用原教材级同步课程总览。',
            '章标题旁注「（N个课程）」中的 N 为该章（含子节点）同步课视频条数合计。',
            '同步课卡片可预览；不提供增删改。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '同步课取自节/小节上的同步课名单，不展示章级专题课/拓展课视频，也不在本区展示试卷绑定关系。',
            '本总览只读镜像现有同步课配置。',
          ],
        },
      ],
      acceptance: [
        '「同步课总览」仍按章/节/小节树展示同步课。',
        '不出现专题/拓展的「视频下挂试卷」模块形态。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '同步课总览',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_TCO-006',
      title: '课程总览只读约束',
      sourceType: 'code+decision',
      objectType: 'state',
      objectName: '课程总览只读',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.textbook-course-overview.readonly',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '选中教材根节点', tab: 'textbook-root' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        {
          type: 'scrollTo',
          label: '定位只读约束关联区',
          anchorId: 'textbook-tree.textbook-course-overview.readonly',
        },
        {
          type: 'highlight',
          label: '高亮只读约束关联区',
          anchorId: 'textbook-tree.textbook-course-overview.readonly',
        },
      ],
      logicSections: [
        {
          title: '状态规则',
          items: [
            '无论当前是否处于「编辑教材详情」，专题课总览、拓展课总览、同步课总览均只能查看，不能在总览内维护视频或试卷。',
            '允许的交互限于：切换三个总览子 Tab、预览视频、预览试卷（若入口存在）。',
            '增删改专题/拓展课须进入对应章节点的「综合课维护」；增删改同步课须进入对应节/小节维护入口。',
          ],
        },
      ],
      acceptance: [
        '打开「编辑教材详情」后，三个总览仍无上传/选课/添加试卷/移除按钮。',
        '预览仍可打开且关闭后名单不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '编辑态约束',
        relatedFiles: RELATED,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '章级综合课维护（专题课/拓展课编辑）',
      reason: '属章详情课程能力，由 textbook-tree-chapter-topic-course / extension-course 注册表覆盖，本册只读总览不重写。',
      sourceDecision: DECISION,
    },
    {
      objectName: '教材级知识点总览 / 练习试卷总览',
      reason: '非本次课程总览范围。',
      sourceDecision: DECISION,
    },
    {
      objectName: '教材详情批量导入 / 习题册导入',
      reason: '挂在教材级其他能力入口，不进入本册课程总览需求。',
      sourceDecision: DECISION,
    },
  ],
};
