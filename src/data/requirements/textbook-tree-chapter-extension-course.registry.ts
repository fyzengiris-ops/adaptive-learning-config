import type { RequirementRegistry } from './schema';

const PAGE = '教材体系知识树·章节维度·综合课维护·拓展课';
const ROUTE = '/knowledge-system';
const MODULE = '知识体系管理·教材体系知识树';
const DECISION = 'docs/prd-workflow/decisions/textbook-tree-chapter-extension-course.decision.md';
const RELATED = ['src/app/system-settings/TextbookTree.tsx', DECISION];

const navActivate = {
  type: 'navigate' as const,
  label: '进入知识体系-教材体系知识树',
  to: '/knowledge-system',
};

const toExtension = [
  navActivate,
  { type: 'setTab' as const, label: '切到教材体系知识树', tab: 'textbook-tree' },
  { type: 'setTab' as const, label: '切到课程', tab: 'course' },
  { type: 'setTab' as const, label: '切到综合课维护', tab: 'comprehensive' },
  { type: 'setTab' as const, label: '切到拓展课', tab: 'extension' },
];

/**
 * 增量注册表：章级「课程 → 综合课维护 → 拓展课」及本批已确认连带
 */
export const textbookTreeChapterExtensionCourseRegistry: RequirementRegistry = {
  registryId: 'textbook-tree-chapter-extension-course',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '增量范围：章详情「课程」下综合课维护·拓展课（视频 + 练习试卷），以及选课/选卷数据来源、上传保存/发布反写、编辑/保存/取消、待发布「课程」维度。不含专题课已审口径重写、同步课总览、知识点、章级练习试卷聚合、教材级总览。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'TB_CEC-001',
      title: '拓展课 Tab',
      sourceType: 'code+decision',
      objectType: 'tab',
      objectName: '拓展课',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.extension-tab',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位拓展课 Tab',
          anchorId: 'textbook-tree.chapter-extension.extension-tab',
        },
        {
          type: 'highlight',
          label: '高亮拓展课 Tab',
          anchorId: 'textbook-tree.chapter-extension.extension-tab',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '「综合课维护」下小 Tab 含「专题课」「拓展课」，二者互斥，同时只亮一个。',
            '每次切换到另一章时，小 Tab 固定停在「专题课」，不记住上一章停在拓展课。',
          ],
        },
        {
          title: '操作说明',
          items: [
            '点「拓展课」打开本章拓展课视频与练习试卷维护区。同一章内切换小 Tab 只换内容区，不提交、不丢编辑暂存。',
          ],
        },
      ],
      acceptance: [
        '综合课维护下可见「拓展课」。',
        '在拓展课切到另一章后，小 Tab 回到专题课，不停留在拓展课。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课 Tab / 切章后拓展课是否保持',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-002',
      title: '拓展课视频区域',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '拓展课视频',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.video-region',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位拓展课视频',
          anchorId: 'textbook-tree.chapter-extension.video-region',
        },
        {
          type: 'highlight',
          label: '高亮拓展课视频',
          anchorId: 'textbook-tree.chapter-extension.video-region',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '区域标题为「拓展课视频」；有视频时在标题旁展示「（N个）」，N 为本章拓展课视频条数；0 条不展示该数量。',
            '有视频时按当前名单展示卡片列表；无视频时展示空态「暂未关联拓展课视频」。编辑态空态另有「点击上方按钮添加课程」。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '本章拓展课视频是独立名单，与本章专题课视频、各小节同步课名单分开维护。',
            '允许同一视频同时出现在本章拓展课、本章专题课、某小节同步课；三边增删互不影响。',
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
        '有 2 个拓展课视频时标题旁为「（2个）」；删至 0 条后数量消失并出现空态。',
        '同一视频可同时存在于本章拓展课、专题课与某小节同步课，删拓展课侧不影响另外两边。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课视频名单 vs 专题课 / 各小节同步课',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-003',
      title: '上传课程',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '上传课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.upload-course',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位上传课程',
          anchorId: 'textbook-tree.chapter-extension.upload-course',
        },
        {
          type: 'highlight',
          label: '高亮上传课程',
          anchorId: 'textbook-tree.chapter-extension.upload-course',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['仅在编辑态、拓展课视频操作栏展示「上传课程」。查看态不展示。'],
        },
        {
          title: '操作说明',
          items: ['点击后打开上传课程弹窗，确认上传后写入本章拓展课视频名单，不写入专题课或各小节同步课。'],
        },
      ],
      acceptance: [
        '查看态无「上传课程」；点「编辑章节详情」后拓展课视频区出现该按钮。',
        '确认上传后新视频出现在本章拓展课列表，专题课与各小节同步课名单不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '上传课程',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-004',
      title: '从资源库选择（视频）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '从资源库选择',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.select-video',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位从资源库选择视频',
          anchorId: 'textbook-tree.chapter-extension.select-video',
        },
        {
          type: 'highlight',
          label: '高亮从资源库选择视频',
          anchorId: 'textbook-tree.chapter-extension.select-video',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['仅在编辑态、拓展课视频操作栏展示「从资源库选择」。查看态不展示。'],
        },
        {
          title: '操作说明',
          items: ['点击后打开选课弹窗，标题为「从资源库选择拓展课」；确定后写入本章拓展课视频名单。'],
        },
      ],
      acceptance: [
        '编辑态拓展课视频区可点「从资源库选择」并打开选课弹窗。',
        '弹窗标题为「从资源库选择拓展课」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择（视频） / 弹窗标题',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-005',
      title: '拓展课视频卡片',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '拓展课视频卡片',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.video-card',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位拓展课视频卡片',
          anchorId: 'textbook-tree.chapter-extension.video-card',
        },
        {
          type: 'highlight',
          label: '高亮拓展课视频卡片',
          anchorId: 'textbook-tree.chapter-extension.video-card',
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
            '点移除先弹出确认：「确定从本章拓展课中移除当前课程吗？」按钮为取消、确定。点确定后仅从本章拓展课名单移除该条；点取消或关闭则保留。不从专题课或各小节同步课移除。',
          ],
        },
      ],
      acceptance: [
        '编辑态点移除出现上述确认文案；确定后该卡从拓展课列表消失，专题课与小节若有同课仍在。',
        '确认弹窗点取消或关闭后，该卡仍在拓展课列表。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课资源卡片·单条移除',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-006',
      title: '拓展课练习试卷区域',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '拓展课练习试卷',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.exam-region',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位拓展课练习试卷',
          anchorId: 'textbook-tree.chapter-extension.exam-region',
        },
        {
          type: 'highlight',
          label: '高亮拓展课练习试卷',
          anchorId: 'textbook-tree.chapter-extension.exam-region',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '区域标题为「拓展课练习试卷」；有卷时在标题旁展示「（N套）」，N 为本章拓展课试卷套数；0 套不展示该数量。',
            '有卷时展示卡片列表；无卷时展示空态「暂未关联练习试卷」。编辑态空态另有「点击上方按钮从资源库选择练习试卷」。',
            '不展示「批量删除」。清空名单只走卡片单条移除。',
          ],
        },
        {
          title: '数据规则',
          items: [
            '本章拓展课试卷是独立名单，与本章专题课试卷、章顶栏「练习试卷」Tab、各小节试卷分开维护。',
            '允许同一套试卷同时出现在拓展课、专题课和章「练习试卷」Tab；三边增删互不影响。',
            '拓展课试卷作为拓展课配套，不占用小节同步课配套位，也不并入精选卷聚合口径（章练习试卷 Tab 聚合规则本轮不重写）。',
          ],
        },
        {
          title: '状态规则',
          items: [
            '查看态只展示名单与预览。编辑态展示从资源库选择；卡片可单条移除。增删写入本章编辑暂存，点「保存编辑」才提交。',
          ],
        },
      ],
      acceptance: [
        '拓展课页始终能看到练习试卷区，编辑态没有批量删除。',
        '同一套卷可同时存在于拓展课、专题课与章「练习试卷」Tab，删拓展课侧不影响另外两边。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课练习试卷 vs 专题课试卷 / 章练习试卷 Tab',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-007',
      title: '从资源库选择（试卷）',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '从资源库选择',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.select-exam',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位从资源库选择试卷',
          anchorId: 'textbook-tree.chapter-extension.select-exam',
        },
        {
          type: 'highlight',
          label: '高亮从资源库选择试卷',
          anchorId: 'textbook-tree.chapter-extension.select-exam',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['仅在编辑态、拓展课练习试卷操作栏展示「从资源库选择」。查看态不展示。'],
        },
        {
          title: '操作说明',
          items: [
            '点击后打开选卷弹窗，标题为「从资源库选择拓展课试卷」；确定后写入本章拓展课试卷名单，不写入专题课或章「练习试卷」Tab。',
          ],
        },
      ],
      acceptance: [
        '编辑态拓展课试卷区可点「从资源库选择」并打开选卷弹窗。',
        '弹窗标题为「从资源库选择拓展课试卷」。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择（试卷） / 弹窗标题',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-008',
      title: '拓展课试卷卡片',
      sourceType: 'code+decision',
      objectType: 'region',
      objectName: '拓展课试卷卡片',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.exam-card',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位拓展课试卷卡片',
          anchorId: 'textbook-tree.chapter-extension.exam-card',
        },
        {
          type: 'highlight',
          label: '高亮拓展课试卷卡片',
          anchorId: 'textbook-tree.chapter-extension.exam-card',
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
            '点移除先弹出确认：「确定从本章拓展课中移除当前试卷吗？」点确定后仅从本章拓展课名单移除该条；点取消或关闭则保留。不从专题课、章「练习试卷」Tab 或各小节试卷移除。',
          ],
        },
      ],
      acceptance: [
        '编辑态点移除出现上述确认文案；确定后该卡从拓展课列表消失，专题课与章「练习试卷」Tab 若有同卷仍在。',
        '确认弹窗点取消或关闭后，该卡仍在拓展课列表。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课资源卡片·单条移除',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-009',
      title: '从资源库选择拓展课（弹窗）',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '从资源库选择拓展课',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.course-selector-dialog',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'openDialog',
          label: '打开从资源库选择拓展课',
          dialog: 'course-selector-extension',
        },
        {
          type: 'scrollTo',
          label: '定位选课弹窗',
          anchorId: 'textbook-tree.chapter-extension.course-selector-dialog',
        },
        {
          type: 'highlight',
          label: '高亮选课弹窗',
          anchorId: 'textbook-tree.chapter-extension.course-selector-dialog',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '从拓展课打开时，弹窗标题为「从资源库选择拓展课」。',
            '左侧为可选视频，右侧为本次已选；支持按名称搜索、预览。',
          ],
        },
        {
          title: '数据来源',
          items: [
            '可选范围为乐课网全网资源；能拉到学校老师分享的视频也尽量拉取。',
            '确定后只做关联；保存时不改写该视频在乐课网的微课属性。',
          ],
        },
        {
          title: '选取规则',
          items: [
            '左侧同时排除已在本章拓展课名单、本章专题课名单里的视频。已在某小节同步课、但不在这两份综合课名单中的视频仍可选入拓展课。',
            '数据允许同一视频同时挂在拓展课和专题课；本弹窗不再展示已在专题课名单中的视频。',
            '点确定后把本次已选追加到本章拓展课视频名单；点取消或关闭清空本次临时选择，不改名单。',
          ],
        },
      ],
      acceptance: [
        '拓展课入口打开时标题为「从资源库选择拓展课」。',
        '已在本章专题课名单中的视频不出现在拓展课选课左侧；已在某小节、但不在拓展课/专题课的视频仍可选入。',
        '保存后该视频在乐课网的微课属性不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择拓展课 · 视频数据源',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-010',
      title: '上传课程弹窗',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '上传课程',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.upload-dialog',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        { type: 'openDialog', label: '打开上传课程', dialog: 'upload-course-extension' },
        {
          type: 'scrollTo',
          label: '定位上传课程弹窗',
          anchorId: 'textbook-tree.chapter-extension.upload-dialog',
        },
        {
          type: 'highlight',
          label: '高亮上传课程弹窗',
          anchorId: 'textbook-tree.chapter-extension.upload-dialog',
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
            '确认上传后，成功文件写入本章拓展课视频名单，来源为本地上传。弹窗内不写入个人资源库、不上架乐课网；保存与发布反写见「拓展课上传视频·保存与发布」。',
            '不校验同名：允许与本章拓展课已有视频、本章专题课视频、各小节同步课视频出现相同课程名。',
          ],
        },
        {
          title: '操作说明',
          items: ['点取消或关闭：关闭弹窗，不把未确认的文件写入名单。上传中不可关闭（与既有上传弹窗一致）。'],
        },
      ],
      acceptance: [
        '拓展课已有「幂函数」时，再上传同名文件仍可确认写入，不弹出同名拦截。',
        '确认上传后新卡出现在拓展课视频区，来源为本地上传。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '上传课程弹窗 / 同名拦截范围',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-011',
      title: '从资源库选择拓展课试卷（弹窗）',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '从资源库选择拓展课试卷',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.exam-selector-dialog',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        {
          type: 'openDialog',
          label: '打开从资源库选择拓展课试卷',
          dialog: 'exam-selector-extension',
        },
        {
          type: 'scrollTo',
          label: '定位选卷弹窗',
          anchorId: 'textbook-tree.chapter-extension.exam-selector-dialog',
        },
        {
          type: 'highlight',
          label: '高亮选卷弹窗',
          anchorId: 'textbook-tree.chapter-extension.exam-selector-dialog',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '从拓展课打开时，弹窗标题为「从资源库选择拓展课试卷」。',
            '搜索、多选、预览、确定/取消交互复用既有选卷弹窗。',
          ],
        },
        {
          title: '数据来源',
          items: [
            '规则与小节、专题课选卷一致的部分：乐课网当前学段、学科、教材版本下的普通试卷（不含答题卡卷）。',
            '章节目录只拉本章、不拉下属各节。确定后只关联，不改试卷在乐课网的属性。',
          ],
        },
        {
          title: '选取规则',
          items: [
            '只排除「已经在本章拓展课试卷名单里」的试卷；不因该卷已在专题课、章「练习试卷」Tab 或某小节而禁止选入。',
            '点确定后把本次已选追加到本章拓展课试卷名单；点取消或关闭清空本次临时选择，不改名单。',
          ],
        },
      ],
      acceptance: [
        '拓展课入口打开时标题为「从资源库选择拓展课试卷」。',
        '已在专题课或章「练习试卷」Tab、但不在本章拓展课的试卷仍可被选入拓展课。',
        '可选范围为当前学段学科教材版本下、仅本章目录（不含下属各节）中的普通试卷。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '从资源库选择拓展课试卷 · 试卷数据源',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-012',
      title: '课程预览 / 试卷预览',
      sourceType: 'code+decision',
      objectType: 'dialog',
      objectName: '课程预览 / 试卷预览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.preview',
      anchorStatus: 'implemented',
      activate: [
        ...toExtension,
        { type: 'openDialog', label: '打开拓展课资源预览', dialog: 'extension-resource-preview' },
        {
          type: 'scrollTo',
          label: '定位预览',
          anchorId: 'textbook-tree.chapter-extension.preview',
        },
        {
          type: 'highlight',
          label: '高亮预览',
          anchorId: 'textbook-tree.chapter-extension.preview',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: [
            '拓展课视频卡片、试卷卡片的预览与末级资源预览同一套只读能力：展示当前这条资源，不提供添加或移除。',
            '关闭预览后回到拓展课页，名单不变。',
          ],
        },
      ],
      acceptance: ['从拓展课卡片打开预览可看到对应课程或试卷；关闭后列表条数与内容不变。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '课程预览 / 试卷预览',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-013',
      title: '编辑章节详情',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '编辑章节详情',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.edit-detail',
      anchorStatus: 'implemented',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        {
          type: 'scrollTo',
          label: '定位编辑章节详情',
          anchorId: 'textbook-tree.chapter-extension.edit-detail',
        },
        {
          type: 'highlight',
          label: '高亮编辑章节详情',
          anchorId: 'textbook-tree.chapter-extension.edit-detail',
        },
      ],
      logicSections: [
        {
          title: '显示说明',
          items: ['查看态标题行展示「编辑章节详情」；进入编辑态后改为「批量导入」「取消」「保存编辑」。'],
        },
        {
          title: '操作说明',
          items: [
            '点击后进入本章详情编辑态，并记下进入时的本章快照，供取消时对比与恢复。',
            '拓展课视频/试卷的增删属于本次编辑会话暂存，与专题课、知识点等同一会话，不单独另开保存。',
          ],
        },
      ],
      acceptance: [
        '点「编辑章节详情」后拓展课出现上传/选课/选卷/移除等编辑入口。',
        '进入编辑后未点保存前，待发布状态不因仅仅进入编辑而增加。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '编辑入口 / 保存编辑 / 取消',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-014',
      title: '取消',
      sourceType: 'code+decision',
      objectType: 'button',
      objectName: '取消',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.cancel',
      anchorStatus: 'planned',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        {
          type: 'scrollTo',
          label: '定位取消',
          anchorId: 'textbook-tree.chapter-extension.cancel',
        },
        {
          type: 'highlight',
          label: '高亮取消',
          anchorId: 'textbook-tree.chapter-extension.cancel',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '拓展课跟本章「编辑章节详情」同一会话，取消不另定规则。',
            '相对进入编辑时的本章快照无内容变动：点「取消」直接退出编辑态，不弹窗，不记待发布。',
            '有内容变动：点「取消」先弹出确认，文案「当前有未保存的修改，确定要取消吗？」按钮为「取消」「确认」。',
            '点确认：丢弃本次会话全部改动（含拓展课和专题课等），恢复为进入「编辑章节详情」之前的状态，退出编辑态，不记待发布。',
            '点弹窗「取消」或关闭：只隐藏确认弹窗，留在编辑态，暂存改动仍在。',
          ],
        },
      ],
      acceptance: [
        '进入编辑后不改任何内容，点取消直接回到查看态，无弹窗。',
        '改了拓展课后点取消，出现「当前有未保存的修改，确定要取消吗？」；确认后拓展课与专题课等均恢复进入编辑前，待发布不增加。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '取消 / 保存编辑（含拓展课）',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-015',
      title: '保存编辑与待发布「课程」维度',
      sourceType: 'code+decision',
      objectType: 'state',
      objectName: '待发布变更记录',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.save-pending',
      anchorStatus: 'planned',
      activate: [
        navActivate,
        { type: 'setTab', label: '切到教材体系知识树', tab: 'textbook-tree' },
        {
          type: 'scrollTo',
          label: '定位保存编辑',
          anchorId: 'textbook-tree.chapter-extension.save-pending',
        },
        {
          type: 'highlight',
          label: '高亮保存编辑',
          anchorId: 'textbook-tree.chapter-extension.save-pending',
        },
      ],
      logicSections: [
        {
          title: '操作说明',
          items: [
            '点「保存编辑」才提交本次会话（含拓展课视频与试卷），并退出编辑态。本地上传视频写入个人资源库的时机与字段见「拓展课上传视频·保存与发布」。',
            '相对进入编辑时有差异才进入待发布；无差异则只退出编辑态，不增加待发布。',
          ],
        },
        {
          title: '状态规则',
          items: [
            '不新增「拓展课」维度。拓展课下所有信息变动（视频和试卷）都计入「课程」维度，与专题课、小节同步课同一维度。',
            '若本次同时还改了章「练习试卷」Tab 等其他原有维度，仍按原规则另记对应维度，不把拓展课试卷记入「练习试卷」。',
          ],
        },
      ],
      acceptance: [
        '只改拓展课视频或试卷后保存，待发布出现「课程」维度，不出现单独的「拓展课」，也不把拓展课试卷记成「练习试卷」。',
        '进入编辑后原样保存，不增加待发布条数。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '待发布变更维度（拓展课） / 保存编辑',
        relatedFiles: RELATED,
      },
    },
    {
      id: 'TB_CEC-016',
      title: '拓展课上传视频·保存与发布',
      sourceType: 'decision',
      objectType: 'data',
      objectName: '拓展课上传保存与发布',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'textbook-tree.chapter-extension.upload-writeback',
      anchorStatus: 'planned',
      activate: [
        ...toExtension,
        {
          type: 'scrollTo',
          label: '定位保存编辑（上传反写）',
          anchorId: 'textbook-tree.chapter-extension.save-pending',
        },
        {
          type: 'highlight',
          label: '高亮保存编辑',
          anchorId: 'textbook-tree.chapter-extension.save-pending',
        },
      ],
      logicSections: [
        {
          title: '数据规则',
          items: [
            '时机与小节、专题课一致：确认上传只进入本章拓展课名单；点「保存编辑」才写入当前账号个人资源库；点「发布」后才从个人资源库上架到乐课网资源库。',
            '写入个人资源库时字段与专题课相同：微课类型「专题微课」、用途「同步新课」、教材章节只绑到本章（不绑小节）；描述「自适应配置后台同步」、学段学科取当前教材、年份当年、地区全选、级别精品。',
            '从资源库选入的拓展课视频不走本条反写，保存时不改写其乐课网微课属性。',
          ],
        },
        {
          title: '异常情况处理',
          items: [
            '个人资源库反写失败时，不挡住拓展课列表展示，标记该条反写失败并支持后续重试。',
            '只有本章名单写入成功且个人资源库写入成功，才算这次上传处理完成。',
          ],
        },
      ],
      acceptance: [
        '拓展课本地上传后，未点保存编辑前，个人资源库不出现该条；保存后个人资源库出现，字段为专题微课 / 同步新课 / 只绑本章。',
        '保存后未发布前，乐课网资源库不上架该条；发布后才上架。',
        '反写失败时拓展课卡片仍在，且可重试。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '拓展课上传视频 · 保存与发布时机 / 反写字段',
        relatedFiles: RELATED,
      },
    },
  ],
  excludedDecisions: [
    {
      objectName: '专题课模块',
      reason: '已审，本轮不重开。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '课程 Tab / 综合课维护 Tab',
      reason: '入口已定，拓展课不改写。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '同步课总览',
      reason: '只读聚合各小节同步课，不读写拓展课。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '知识点 Tab',
      reason: '与本轮无耦合。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '练习试卷 Tab（章级聚合）',
      reason: '与拓展课试卷名单分开，本轮不重审聚合规则。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '末级/节级同步课程与练习试卷内部细则',
      reason: '除本轮已确认的数据来源与保存口径外，不重审其余内部细则。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '教材级课程总览 / 左侧目录树 / 批量导入知识点',
      reason: '本次未调整。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
    {
      objectName: '拓展课试卷批量删除',
      reason: '已去掉，清空只走单条移除。',
      sourceDecision: '专题课决策第 6 条 / 本轮 C 类',
    },
    {
      objectName: '练习试卷维护方式开关',
      reason: '已下线。',
      sourceDecision: '增量 C 类 / 明确不重审',
    },
  ],
};
