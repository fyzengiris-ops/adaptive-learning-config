import type { RequirementRegistry } from './schema';

const PAGE = '教材体系知识树·章节维度·综合课维护·专题课';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·教材体系知识树';
const DECISION = 'docs/prd-workflow/decisions/textbook-tree-chapter-topic-course.decision.md';
const RELATED = ['src/app/system-settings/TextbookTree.tsx', DECISION];

const navActivate = {
  type: 'navigate' as const,
  label: '进入知识体系-教材体系知识树',
  to: '/knowledge-system',
};

/**
 * 增量注册表：章级「课程 → 综合课维护 → 专题课」及本批已确认连带
 */
export const textbookTreeChapterTopicCourseRegistry: RequirementRegistry = {
  registryId: 'textbook-tree-chapter-topic-course',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '增量范围：章详情「课程」下综合课维护·专题课（视频 + 练习试卷），以及课程 Tab、综合课维护、编辑/保存/取消、资源库弹窗标题与数据源、专题课上传保存/发布反写、小节统一使用效果、待发布「课程」维度。不含同步课总览内部、拓展课、知识点、章级练习试卷聚合、教材级总览。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'TB_CTC-001',
      title: '课程 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.course-tab',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'scrollTo', label: '定位课程 Tab', anchorId: 'textbook-tree.chapter-topic.course-tab' },
        { type: 'highlight', label: '高亮课程 Tab', anchorId: 'textbook-tree.chapter-topic.course-tab' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '章详情顶栏 Tab 文案为「课程」，与知识点、练习试卷并列。',
            '章级「课程」覆盖「综合课维护」与「同步课总览」；本轮只约定综合课维护·专题课口径，不重写同步课总览内部。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '查看中、编辑中都可以点「课程」打开本 Tab；编辑中在知识点 / 课程 / 练习试卷之间切换时，只换右侧内容区，不自动保存，也不丢尚未点「保存编辑」的改动。',
          ],
        },
      ],
      acceptance: [
        '章详情顶栏可见「课程」，不再使用「同步课程」作为该 Tab 文案。',
        '编辑中切到其他 Tab 再切回课程，专题课未保存改动仍在。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '课程 Tab',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-002',
      title: '综合课维护 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '综合课维护',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.comprehensive-tab',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        {
          type: 'scrollTo',
          label: '定位综合课维护',
          anchorId: 'textbook-tree.chapter-topic.comprehensive-tab',
        },
        {
          type: 'highlight',
          label: '高亮综合课维护',
          anchorId: 'textbook-tree.chapter-topic.comprehensive-tab',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '章级「课程」下大 Tab 为「综合课维护」「同步课总览」，二者互斥，同时只亮一个。',
            '每次切换到另一章时，大 Tab 固定停在「综合课维护」。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点「综合课维护」进入专题课/拓展课维护区；点「同步课总览」进入各小节同步课只读聚合。切换大 Tab 不提交、不丢编辑暂存。',
          ],
        },
      ],
      acceptance: [
        '进入某一章的「课程」时，默认停在「综合课维护」。',
        '从「同步课总览」切到另一章后，大 Tab 回到「综合课维护」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '综合课维护 Tab / 进章后默认停在哪',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-003',
      title: '专题课 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '专题课',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.topic-tab',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        { type: 'scrollTo', label: '定位专题课 Tab', anchorId: 'textbook-tree.chapter-topic.topic-tab' },
        { type: 'highlight', label: '高亮专题课 Tab', anchorId: 'textbook-tree.chapter-topic.topic-tab' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '「综合课维护」下小 Tab 含「专题课」「拓展课」；本轮只约定专题课，拓展课同构不在本册。',
            '每次切换到另一章时，小 Tab 固定停在「专题课」，不记住上一章停在拓展课。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点「专题课」打开本章专题课视频与练习试卷维护区。同一章内切换小 Tab 只换内容区，不提交、不丢编辑暂存。',
          ],
        },
      ],
      acceptance: [
        '综合课维护下可见「专题课」，进章后默认停在专题课。',
        '在拓展课切到另一章后，小 Tab 回到专题课。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课 Tab / 进章后默认停在哪',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-004',
      title: '专题课视频区域',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '专题课视频',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.video-region',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位专题课视频',
          anchorId: 'textbook-tree.chapter-topic.video-region',
        },
        {
          type: 'highlight',
          label: '高亮专题课视频',
          anchorId: 'textbook-tree.chapter-topic.video-region',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '区域标题为「专题课视频」；有视频时在标题旁展示「（N个）」，N 为本章专题课视频条数；0 条不展示该数量。',
            '有视频时按当前名单展示卡片列表；无视频时展示空态「暂未关联专题课视频」。编辑态空态另有「点击上方按钮添加课程」。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '本章专题课视频是独立名单，与各小节同步课名单分开维护。',
            '允许同一视频同时出现在本章专题课和某小节同步课；两边增删互不影响。',
          ],
        },
        {
          title: '状态规则',
          items: [
            '查看态只展示名单与预览，不展示上传、从资源库选择、移除。',
            '编辑态展示上传课程、从资源库选择；卡片可移除。增删写入本章编辑暂存，点「保存编辑」才提交。',
          ],
        },
      ],
      acceptance: [
        '有 2 个专题课视频时标题旁为「（2个）」；删至 0 条后数量消失并出现空态。',
        '同一视频可同时存在于本章专题课与某小节同步课，删专题课侧不影响该小节。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课视频名单 vs 各小节同步课',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-005',
      title: '上传课程',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '上传课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.upload-course',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位上传课程',
          anchorId: 'textbook-tree.chapter-topic.upload-course',
        },
        {
          type: 'highlight',
          label: '高亮上传课程',
          anchorId: 'textbook-tree.chapter-topic.upload-course',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['仅在编辑态、专题课视频操作栏展示「上传课程」。查看态不展示。'],
        },
        {
          title: '操作说明',
          items: ['点击后打开上传课程弹窗，确认上传后写入本章专题课视频名单，不写入各小节同步课。'],
        },
      ],
      acceptance: [
        '查看态无「上传课程」；点「编辑章节详情」后专题课视频区出现该按钮。',
        '确认上传后新视频出现在本章专题课列表，各小节同步课名单不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '上传课程',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-006',
      title: '从资源库选择（视频）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '从资源库选择',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.select-video',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位从资源库选择视频',
          anchorId: 'textbook-tree.chapter-topic.select-video',
        },
        {
          type: 'highlight',
          label: '高亮从资源库选择视频',
          anchorId: 'textbook-tree.chapter-topic.select-video',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['仅在编辑态、专题课视频操作栏展示「从资源库选择」。查看态不展示。'],
        },
        {
          title: '操作说明',
          items: ['点击后打开选课弹窗，标题为「从资源库选择专题课」；确定后写入本章专题课视频名单。'],
        },
      ],
      acceptance: [
        '编辑态专题课视频区可点「从资源库选择」并打开选课弹窗。',
        '弹窗标题为「从资源库选择专题课」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择（视频） / 弹窗标题',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-007',
      title: '专题课视频卡片',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '专题课视频卡片',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.video-card',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位专题课视频卡片',
          anchorId: 'textbook-tree.chapter-topic.video-card',
        },
        {
          type: 'highlight',
          label: '高亮专题课视频卡片',
          anchorId: 'textbook-tree.chapter-topic.video-card',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '卡片展示课程名称、来源（本地上传 / 资源库）、时长；有大小时展示大小。',
            '查看态与编辑态均可预览；仅编辑态展示移除。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点预览打开课程预览，只读，关闭后名单不变。',
            '点移除先弹出确认：「确定从本章专题课中移除当前课程吗？」按钮为取消、确定。点确定后仅从本章专题课名单移除该条；点取消或关闭则保留。不从各小节同步课移除。',
          ],
        },
      ],
      acceptance: [
        '编辑态点移除出现上述确认文案；确定后该卡从专题课列表消失，小节同步课若有同课仍在。',
        '确认弹窗点取消或关闭后，该卡仍在专题课列表。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课资源卡片·单条移除',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-008',
      title: '专题课练习试卷区域',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '专题课练习试卷',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.exam-region',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位专题课练习试卷',
          anchorId: 'textbook-tree.chapter-topic.exam-region',
        },
        {
          type: 'highlight',
          label: '高亮专题课练习试卷',
          anchorId: 'textbook-tree.chapter-topic.exam-region',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '区域标题为「专题课练习试卷」；有卷时在标题旁展示「（N套）」，N 为本章专题课试卷套数；0 套不展示该数量。',
            '有卷时展示卡片列表；无卷时展示空态「暂未关联练习试卷」。编辑态空态另有「点击上方按钮从资源库选择练习试卷」。',
            '本区域始终可维护；教材级「练习试卷维护方式」开关已下线，不再作为专题课约束。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '本章专题课试卷是独立名单，与章顶栏「练习试卷」Tab、各小节试卷分开维护。',
            '允许同一套试卷同时出现在专题课和章「练习试卷」Tab；两边增删互不影响。',
            '专题课试卷作为专题课配套，不占用小节同步课配套位，也不并入精选卷聚合口径（章练习试卷 Tab 聚合规则本轮不重写）。',
          ],
        },
        {
          title: '状态规则',
          items: [
            '查看态只展示名单与预览。编辑态展示从资源库选择；卡片可单条移除。不展示批量删除。增删写入本章编辑暂存，点「保存编辑」才提交。',
          ],
        },
      ],
      acceptance: [
        '专题课页始终能看到练习试卷区。',
        '同一套卷可同时存在于专题课与章「练习试卷」Tab，删专题课侧不影响该 Tab。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课练习试卷 vs 章练习试卷 Tab / 维护方式开关',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-009',
      title: '从资源库选择（试卷）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '从资源库选择',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.select-exam',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位从资源库选择试卷',
          anchorId: 'textbook-tree.chapter-topic.select-exam',
        },
        {
          type: 'highlight',
          label: '高亮从资源库选择试卷',
          anchorId: 'textbook-tree.chapter-topic.select-exam',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['仅在编辑态、专题课练习试卷操作栏展示「从资源库选择」。查看态不展示。'],
        },
        {
          title: '操作说明',
          items: [
            '点击后打开选卷弹窗，标题为「从资源库选择专题课试卷」；确定后写入本章专题课试卷名单，不写入章「练习试卷」Tab。',
          ],
        },
      ],
      acceptance: [
        '编辑态专题课试卷区可点「从资源库选择」并打开选卷弹窗。',
        '弹窗标题为「从资源库选择专题课试卷」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择（试卷） / 弹窗标题',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-010',
      title: '批量删除专题课试卷（已去掉）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '批量删除',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.batch-delete-exam',
      anchorStatus: 'planned',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '专题课、拓展课试卷区不展示「批量删除」。清空名单只走卡片单条移除。',
            '末级小节「练习试卷」Tab 的批量删除仍保留，本条不约束小节。',
          ],
        },
      ],
      acceptance: [
        '编辑态专题课 / 拓展课试卷区只有「从资源库选择」，没有批量删除。',
        '末级小节练习试卷编辑态仍可见批量删除。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课 / 拓展课试卷·批量删除',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-011',
      title: '专题课试卷卡片',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '专题课试卷卡片',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.exam-card',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位专题课试卷卡片',
          anchorId: 'textbook-tree.chapter-topic.exam-card',
        },
        {
          type: 'highlight',
          label: '高亮专题课试卷卡片',
          anchorId: 'textbook-tree.chapter-topic.exam-card',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '卡片展示试卷名称、来源（资源库等）、题量、分值。',
            '查看态与编辑态均可预览；仅编辑态展示移除。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点预览打开试卷预览，只读，关闭后名单不变。',
            '点移除先弹出确认：「确定从本章专题课中移除当前试卷吗？」点确定后仅从本章专题课名单移除该条；点取消或关闭则保留。不从章「练习试卷」Tab 或各小节试卷移除。',
          ],
        },
      ],
      acceptance: [
        '编辑态点移除出现上述确认文案；确定后该卡从专题课列表消失，章「练习试卷」Tab 若有同卷仍在。',
        '确认弹窗点取消或关闭后，该卡仍在专题课列表。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课资源卡片·单条移除',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-012',
      title: '从资源库选择专题课（弹窗）',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '从资源库选择专题课',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.course-selector-dialog',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'openDialog',
          label: '打开从资源库选择专题课',
          dialog: 'course-selector-topic',
        },
        {
          type: 'scrollTo',
          label: '定位选课弹窗',
          anchorId: 'textbook-tree.chapter-topic.course-selector-dialog',
        },
        {
          type: 'highlight',
          label: '高亮选课弹窗',
          anchorId: 'textbook-tree.chapter-topic.course-selector-dialog',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '从专题课打开时，弹窗标题为「从资源库选择专题课」。',
            '左侧为可选视频（已在本章专题课名单中的不再出现在左侧），右侧为本次已选；支持按名称搜索、预览。',
          ],
        },
        {
          title: '数据来源',
          items: [
            '与小节选课一致：可选范围为乐课网全网资源；能拉到学校老师分享的视频也尽量拉取。',
            '确定后只做关联；保存时不改写该视频在乐课网的微课属性。',
          ],
        },
        {
          title: '选取规则',
          items: [
            '只排除「已经在本章专题课视频名单里」的视频；不因该视频已在某小节同步课而禁止选入。',
            '点确定后把本次已选追加到本章专题课视频名单；点取消或关闭清空本次临时选择，不改名单。',
          ],
        },
      ],
      acceptance: [
        '专题课入口打开时标题为「从资源库选择专题课」。',
        '已在某小节同步课、但不在本章专题课的视频仍可被选入专题课。',
        '可选列表与小节选课同一乐课网全网资源池；保存后该视频在乐课网的微课属性不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择专题课 · 视频数据源',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-013',
      title: '上传课程弹窗',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '上传课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.upload-dialog',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        { type: 'openDialog', label: '打开上传课程', dialog: 'upload-course-topic' },
        {
          type: 'scrollTo',
          label: '定位上传课程弹窗',
          anchorId: 'textbook-tree.chapter-topic.upload-dialog',
        },
        {
          type: 'highlight',
          label: '高亮上传课程弹窗',
          anchorId: 'textbook-tree.chapter-topic.upload-dialog',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['弹窗标题为「上传课程」。格式、大小、单次数量等交互复用既有上传课程弹窗，不在本条重写末级细则。'],
        },
        {
          title: '数据规则',
          items: [
            '确认上传后，成功文件写入本章专题课视频名单，来源为本地上传。弹窗内不写入个人资源库、不上架乐课网；保存与发布反写见「专题课上传视频·保存与发布」。',
            '不校验同名：允许与本章专题课已有视频、各小节同步课视频出现相同课程名。',
          ],
        },
        {
          title: '操作说明',
          items: ['点取消或关闭：关闭弹窗，不把未确认的文件写入名单。上传中不可关闭（与既有上传弹窗一致）。'],
        },
      ],
      acceptance: [
        '专题课已有「指数函数」时，再上传同名文件仍可确认写入，不弹出同名拦截。',
        '确认上传后新卡出现在专题课视频区，来源为本地上传。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '上传课程弹窗 / 同名拦截范围',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-014',
      title: '从资源库选择专题课试卷（弹窗）',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '从资源库选择专题课试卷',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.exam-selector-dialog',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'openDialog',
          label: '打开从资源库选择专题课试卷',
          dialog: 'exam-selector-topic',
        },
        {
          type: 'scrollTo',
          label: '定位选卷弹窗',
          anchorId: 'textbook-tree.chapter-topic.exam-selector-dialog',
        },
        {
          type: 'highlight',
          label: '高亮选卷弹窗',
          anchorId: 'textbook-tree.chapter-topic.exam-selector-dialog',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '从专题课打开时，弹窗标题为「从资源库选择专题课试卷」。',
            '搜索、多选、预览、确定/取消交互复用既有选卷弹窗。',
          ],
        },
        {
          title: '数据来源',
          items: [
            '规则与小节选卷一致：乐课网当前学段、学科、教材版本下的普通试卷（不含答题卡卷）。',
            '章节目录按本章拉取（含本章下各节目录）。确定后只关联，不改试卷在乐课网的属性。',
          ],
        },
        {
          title: '选取规则',
          items: [
            '只排除「已经在本章专题课试卷名单里」的试卷；不因该卷已在章「练习试卷」Tab 或某小节而禁止选入。',
            '点确定后把本次已选追加到本章专题课试卷名单；点取消或关闭清空本次临时选择，不改名单。',
          ],
        },
      ],
      acceptance: [
        '专题课入口打开时标题为「从资源库选择专题课试卷」。',
        '已在章「练习试卷」Tab、但不在本章专题课的试卷仍可被选入专题课。',
        '可选范围为当前学段学科教材版本下、本章（含下属各节）目录中的普通试卷。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择专题课试卷 · 试卷数据源',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-015',
      title: '课程预览 / 试卷预览',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '课程预览 / 试卷预览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.preview',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        { type: 'openDialog', label: '打开专题课资源预览', dialog: 'topic-resource-preview' },
        {
          type: 'scrollTo',
          label: '定位预览',
          anchorId: 'textbook-tree.chapter-topic.preview',
        },
        {
          type: 'highlight',
          label: '高亮预览',
          anchorId: 'textbook-tree.chapter-topic.preview',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '专题课视频卡片、试卷卡片的预览与末级资源预览同一套只读能力：展示当前这条资源，不提供添加或移除。',
            '关闭预览后回到专题课页，名单不变。',
          ],
        },
      ],
      acceptance: [
        '从专题课卡片打开预览可看到对应课程或试卷；关闭后列表条数与内容不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '课程预览 / 试卷预览',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-016',
      title: '编辑章节详情',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '编辑章节详情',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.edit-detail',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        {
          type: 'scrollTo',
          label: '定位编辑章节详情',
          anchorId: 'textbook-tree.chapter-topic.edit-detail',
        },
        {
          type: 'highlight',
          label: '高亮编辑章节详情',
          anchorId: 'textbook-tree.chapter-topic.edit-detail',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '查看态标题行展示「编辑章节详情」；进入编辑态后改为「批量导入」「取消」「保存编辑」。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点击后进入本章详情编辑态，并记下进入时的本章快照，供取消时对比与恢复。',
            '专题课视频/试卷的增删属于本次编辑会话暂存，与知识点等同一会话，不单独另开保存。',
          ],
        },
      ],
      acceptance: [
        '点「编辑章节详情」后专题课出现上传/选课/选卷/移除等编辑入口。',
        '进入编辑后未点保存前，待发布状态不因仅仅进入编辑而增加。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '编辑入口 / 保存编辑 / 取消',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-017',
      title: '取消',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '取消',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.cancel',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        {
          type: 'scrollTo',
          label: '定位取消',
          anchorId: 'textbook-tree.chapter-topic.cancel',
        },
        {
          type: 'highlight',
          label: '高亮取消',
          anchorId: 'textbook-tree.chapter-topic.cancel',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '专题课跟本章「编辑章节详情」同一会话，取消不另定规则。',
            '相对进入编辑时的本章快照无内容变动：点「取消」直接退出编辑态，不弹窗，不记待发布。',
            '有内容变动：点「取消」先弹出确认，文案「当前有未保存的修改，确定要取消吗？」按钮为「取消」「确认」。',
            '点确认：丢弃本次会话全部改动（含专题课），恢复为进入「编辑章节详情」之前的状态，退出编辑态，不记待发布。',
            '点弹窗「取消」或关闭：只隐藏确认弹窗，留在编辑态，暂存改动仍在。',
          ],
        },
      ],
      acceptance: [
        '进入编辑后不改任何内容，点取消直接回到查看态，无弹窗。',
        '改了专题课后再点取消，出现「当前有未保存的修改，确定要取消吗？」；确认后专题课恢复进入编辑前，待发布不增加；弹窗取消后仍停在编辑态且改动仍在。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '取消（编辑章节详情）',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-018',
      title: '保存编辑与待发布「课程」维度',
      sourceType: 'code+decision',
      objectType: 'state',
      objectName: '待发布变更记录',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.save-pending',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        {
          type: 'scrollTo',
          label: '定位保存编辑',
          anchorId: 'textbook-tree.chapter-topic.save-pending',
        },
        {
          type: 'highlight',
          label: '高亮保存编辑',
          anchorId: 'textbook-tree.chapter-topic.save-pending',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '点「保存编辑」才提交本次会话（含专题课视频与试卷），并退出编辑态。本地上传视频写入个人资源库的时机与字段见「专题课上传视频·保存与发布」。',
            '相对进入编辑时有差异才进入待发布；无差异则只退出编辑态，不增加待发布。',
          ],
        },
        {
          title: '状态规则',
          items: [
            '不新增「专题课」维度。专题课下所有信息变动（视频和试卷）都计入「课程」维度。',
            '「课程」即原来的「同步课程 / 同步课」维度，待发布展示与顶栏「课程」Tab 对齐，不再单列「同步课」。',
            '若本次同时还改了章「练习试卷」Tab 等其他原有维度，仍按原规则另记对应维度，不把专题课试卷记入「练习试卷」。',
          ],
        },
      ],
      acceptance: [
        '只改专题课视频或试卷后保存，待发布出现「课程」维度，不出现单独的「专题课」，也不把专题课试卷记成「练习试卷」。',
        '进入编辑后原样保存，不增加待发布条数。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '待发布变更维度（专题课） / 保存编辑',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-019',
      title: '从资源库选择同步课（小节弹窗标题）',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '从资源库选择同步课',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.leaf-course-selector-title',
      anchorStatus: 'planned',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        {
          type: 'openDialog',
          label: '打开小节从资源库选择同步课',
          dialog: 'course-selector-leaf',
        },
        {
          type: 'scrollTo',
          label: '定位小节选课弹窗标题',
          anchorId: 'textbook-tree.chapter-topic.leaf-course-selector-title',
        },
        {
          type: 'highlight',
          label: '高亮小节选课弹窗标题',
          anchorId: 'textbook-tree.chapter-topic.leaf-course-selector-title',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '末级小节从「课程」打开选课弹窗时，标题为「从资源库选择同步课」。',
            '本条只改标题；搜索、多选、预览、写入当前小节同步课名单等内部细则不在本轮重写。',
          ],
        },
      ],
      acceptance: ['小节点「从资源库选择」后，弹窗标题为「从资源库选择同步课」，不是「从资源库选择专题课」。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择（视频 / 试卷）标题',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-020',
      title: '小节课程 Tab（统一使用效果）',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '小节课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.leaf-unified-course',
      anchorStatus: 'planned',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        {
          type: 'scrollTo',
          label: '定位小节课程',
          anchorId: 'textbook-tree.chapter-topic.leaf-unified-course',
        },
        {
          type: 'highlight',
          label: '高亮小节课程',
          anchorId: 'textbook-tree.chapter-topic.leaf-unified-course',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '小节按「统一使用」效果：课程 Tab 只维护视频，不在课程 Tab 维护配套试卷。',
            '试卷只在「练习试卷」Tab 维护；课程中心与精选卷共用这一份。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '本条只锁定小节课程/试卷分工；章「练习试卷」Tab 的聚合规则、同步课总览内部本轮不重写。',
            '教材详情左侧「练习试卷维护方式」开关与说明已去掉；小节固定统一使用，不再提供可切换口径。',
          ],
        },
      ],
      acceptance: [
        '末级小节「课程」Tab 只见视频维护，不见配套试卷操作区。',
        '小节试卷入口在「练习试卷」Tab。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课练习试卷 vs 教材练习试卷维护方式',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CTC-021',
      title: '专题课上传视频·保存与发布',
      sourceType: 'decision',
      objectType: 'data',
      objectName: '专题课上传保存与发布',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-topic.upload-writeback',
      anchorStatus: 'planned',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        { type: 'setTab', label: '切到课程', tab: 'course' },
        { type: 'setTab', label: '切到综合课维护', tab: 'comprehensive' },
        { type: 'setTab', label: '切到专题课', tab: 'topic' },
        {
          type: 'scrollTo',
          label: '定位保存编辑（上传反写）',
          anchorId: 'textbook-tree.chapter-topic.save-pending',
        },
        {
          type: 'highlight',
          label: '高亮保存编辑',
          anchorId: 'textbook-tree.chapter-topic.save-pending',
        },
      ],
      logicSections: [
        {
          title: '数据规则',
          items: [
            '时机与小节一致：确认上传只进入本章专题课名单；点「保存编辑」才写入当前账号个人资源库；点「发布」后才从个人资源库上架到乐课网资源库。',
            '写入个人资源库时字段：微课类型「专题微课」、用途「同步新课」、教材章节只绑到本章（不绑小节）；描述「自适应配置后台同步」、学段学科取当前教材、年份当年、地区全选、级别精品。',
            '从资源库选入的专题课视频不走本条反写，保存时不改写其乐课网微课属性。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '个人资源库反写失败时，不挡住专题课列表展示，标记该条反写失败并支持后续重试。',
            '只有本章名单写入成功且个人资源库写入成功，才算这次上传处理完成。',
          ],
        },
      ],
      acceptance: [
        '专题课本地上传后，未点保存编辑前，个人资源库不出现该条；保存后个人资源库出现，字段为专题微课 / 同步新课 / 只绑本章。',
        '保存后未发布前，乐课网资源库不上架该条；发布后才上架。',
        '反写失败时专题课卡片仍在，且可重试。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '专题课上传视频 · 保存与发布',
        relatedFiles: RELATED,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '同步课总览',
      reason: '只读聚合各小节同步课，不读写专题课；本轮不重审内部。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '拓展课',
      reason: '与专题课同构，本轮不审。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '知识点 Tab',
      reason: '与本轮无耦合。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '练习试卷 Tab（章级聚合）',
      reason: '与专题课试卷名单分开，本轮不重审聚合规则。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '末级/节级同步课程与练习试卷内部细则',
      reason: '除已确认的小节选课弹窗标题、小节统一使用效果外，不重审其余内部细则。专题课选课/选卷数据源与上传反写已按第 11–13 条单定，不回写小节原口径。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '教材级课程总览 / 左侧目录树 / 批量导入知识点',
      reason: '本次未调整。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
  ],
};
