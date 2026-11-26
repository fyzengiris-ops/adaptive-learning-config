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

const BATCH = KNOWLEDGE_CARD_EXAMPLE_DELTA_BATCH_ID;

export const knowledgeTreeKnowledgeCardExampleDeltaRegistry: RequirementRegistry = {
  registryId: 'knowledge-tree-knowledge-card-example-delta',
  pageName: PAGE,
  route: ROUTE,
  module: MODULE,
  description:
    '仅收录 2026-11-24 起典型例题补充设计的新增口径。不重写此前已上线的例题、选题弹窗和预览卡片。',
  sourceDecisionFile: DECISION,
  relatedFiles: RELATED,
  requirements: [
    {
      id: 'KT_KC_EX-001',
      title: '典型例题的题型',
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
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位典型例题',
          anchorId: 'knowledge-tree.knowledge-card.example',
        },
      ],
      logicSections: [
        {
          title: '题型显示',
          items: [
            '所有学科，无论是子题还是大题支持的题型，除了不支持手写题外，其他题型，都按照当前学科在乐课网支持的题型进行显示',
          ],
        },
        {
          title: '切换题型',
          items: [
            '已经选了题型，并且题干、选项、答案、解析或子题里有内容时，再切换题型要先显示弹窗确认。\n\n主标题「确认切换题型吗？」\n辅助文案：「切题型可能会清空已维护的信息」。\n按钮：取消、确认',
            '单选和多选互相切换，题干、选项、答案、解析都保留。',
            '其他题型之间切换，只清掉两边不相同的内容。例如选择题改为判断题，只清掉选项，题干、答案、解析保留。',
          ],
        },
      ],
      acceptance: ['未选择题型时，页面上只有题干。'],
      source: {
        decisionFile: DECISION,
        decisionObject: '典型例题题型',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC_EX-007',
      title: '不同题型的显示规则',
      sourceType: 'decision',
      objectType: 'field',
      objectName: '题干',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.example-stem',
      anchorStatus: 'implemented',
      batchId: BATCH,
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位题干',
          anchorId: 'knowledge-tree.knowledge-card.example-stem',
        },
      ],
      logicSections: [
        {
          title: '按题型显示',
          items: [
            '在当前考点的典型例题没有选择题型，的时候，不显示答案、解析区域',
            '选择题：在维护的时候，题干和选项分区域展示，题干和选项共用一个富文本编辑区域\n\n选项默认显示四个选项，可以删除和新增，最多添加26个选项，达到26个选项后，添加选项的按钮隐藏，最少需要保留两个选项，当只有两个选项的时候，删除按钮隐藏，选项可删除的时候，剩下选项的重新按 A、B、C 编号。\n\n选择题的选项算在题干里。选项字母由系统按 A、B、C 顺序分配，不手改字母。\n\n从单选、多选以外的题型切换成选择题时，默认给出四个待填写选项。新增选项的提示文案是「请输入~」。',
            '判断题：只有题干，答案、解析区域（没有选项区域）',
            '填空题：富文本编辑框需要显示挖空的按钮，光标定在哪里，点击挖空按钮，就在光标的后面新增一个空位，并新增一个答案的空位，空位的显示样式和新增的答案区域，和原型效果保持一致，按照序号显示\n\n一道填空题，最多添加的空位数和乐课网添加系统，添加的空位数保持一致，如果乐课网原来没有限制，则我们这边最多允许添加20个空位数\n\n填空题最少需要有一个空位\n\n从系统选择一道填空题后，在典型例题里按手动挖空的样式展示题干和答案。题库里的普通下划线，进入例题后改成编号空，答案按空拆开。',
            '材料题：父题的题型和题干单独维护。子题的题型、题干、答案、解析单独维护',
          ],
        },
        {
          title: '有例题',
          items: [
            '题干有内容，或任一选项有内容，这个考点记为有例题。材料题在父题干、任一子题题干或子题选项有内容时，也记为有例题。',
            '有例题的考点默认展开。',
          ],
        },
      ],
      acceptance: [
        '判断题看不到选项。',
        '单选改多选后，已填的题干、选项、答案、解析还在。',
        '有例题的考点在刷新后是展开的。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '不同题型的显示规则',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC_EX-003',
      title: '例题保存为题目',
      sourceType: 'decision',
      objectType: 'data',
      objectName: '典型例题',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.example',
      anchorStatus: 'implemented',
      batchId: BATCH,
      activate: [
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点', tab: 'exam' },
        {
          type: 'scrollTo',
          label: '定位典型例题',
          anchorId: 'knowledge-tree.knowledge-card.example',
        },
      ],
      logicSections: [
        {
          title: '保存时机',
          items: [
            '用户点击保存的时候，不对用户维护的题目进行校验和题目ID的存储',
            '当用户点击发布的时候，在原来的基础上，新增对用户维护的题目的信息校验处理，校验的顺序可按照下方的顺序校验，重点是保证用户在有多个设置错误项的时候，系统只显示一个错误提示',
          ],
        },
        {
          title: '校验规则',
          items: [
            '校验所有题目的题干（包含子题题干）是否为空，若为空，则显示弹窗提示——请确认所有例题的题干不为空后再发布。弹窗按钮：知道了',
            '校验选择题的选项是否为空，若为空，则显示弹窗提示——请确认选择题的选项不为空后再发布。弹窗按钮：知道了',
            '校验填空题的题干是否无空，若无空，则显示弹窗提示——请确认所有填空题的题干至少有一个空位后再发布。弹窗按钮：知道了',
            '校验所有题干的答案是否为空，若为空，则显示弹窗提示——请确认所有例题的答案不为空后再发布。弹窗按钮：知道了',
            '校验所有选择题的答案填写的字母是否和待选项的字母能进行匹配，若无法匹配，则显示弹窗提示——请确认选择题的答案设置正常。弹窗按钮：知道了\n',
            '校验所有单选题的答案填写是否填写了多个，若填写了多个，则显示弹窗提示——请确认选择题的答案设置正常。弹窗按钮：知道了',
            '当所有校验通过后，点击发布，则可以按照正常的发布流程往后继续填写发布的信息，',
          ],
        },
        {
          title: '题目存储规则',
          items: [
            '当用户点击发布弹窗的【确认发布】后，对于用户维护的典型例题，如果是从系统选择的，且没有对题型、题干、答案、解析进行任何信息的编辑，对题目进行存储的时候，不变更题目的ID，不变更题目的属性\n\n如果用户发布的时候，选择的是定时发布，则当用户点击【确认定时发布】后，在到了用户定时的时间后，才开始对题目进行存储\n\n下方用户编辑的过的题目，存储的时机和没编辑过的题目存储时机保持一致',
            '但凡是对任何内容进行过编辑的，或者是完全是手动录入的题目，对题目进行存储的时候，都将对题目生成新的题目ID，并存放置当前账号的教研员习题库中\n',
            '在存储的时候，题目的属性信息分别按照以下规则默认回填\n学段学科：当前通用知识树的学段学科\n题型：当前题目设置的题型\n用途：升学频道/学业水平\n版本：通用版-乐课出品\n知识点：当前题目所在考点关联的知识点名称\n类型：综合题\n年份：当前所属年份\n级别：精品',
          ],
        },
      ],
      acceptance: [
        '改过系统选题的内容并保存后，例题使用新的题目 ID，题库原题内容不变。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '例题保存为题目',
        relatedFiles: ['src/components/shared/KnowledgeCardPanel.tsx'],
      },
    },
    {
      id: 'KT_KC_EX-004',
      title: '预览里的典型例题',
      sourceType: 'decision',
      objectType: 'panel',
      objectName: '平板预览',
      module: MODULE,
      pageName: PAGE,
      route: ROUTE,
      anchorId: 'knowledge-tree.knowledge-card.tablet-preview',
      anchorStatus: 'implemented',
      batchId: BATCH,
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
          label: '定位预览入口',
          anchorId: 'knowledge-tree.knowledge-card.tablet-preview',
        },
      ],
      logicSections: [
        {
          title: '题型显示',
          items: [
            '大题的题型显示在题干前面，格式是【题型】',
            '材料题子题的序号用（1）（2），序号不加粗。',
            '子题默认不显示题型。只有子题是多选题时，在序号后面显示（多选题），字重和颜色与题干一致。',
          ],
        },
        {
          title: '选择题显示',
          items: [
            '预览里，选择题的题干和选项之间不显示分界线。大题和子题都如此。配置后台仍保留这条分界线。',
            '子题是选择题时，选项不和序号对齐。显示了题型的，选项与题型左对齐；没有题型的，选项与题干左对齐。',
          ],
        },
        {
          title: '含子题的大题显示',
          items: [
            '无论是否查看解析，父题题干和子题题干都聚合在题干位置展示，在查看解析的时候\n\n答案和解析还是独立的区域，各自按照如下要求展示：\n\n答案：（1）答案（2）答案，按子题序号往下排\n\n解析：（1）解析（2）解析，同样按子题序号往下排\n\n某一题内容较长时在当前序号这一行里换行，下一题的序号仍和上一题序号左对齐。填空子题的答案仍按①、②分行写在对应序号后面。',
          ],
        },
        {
          title: '空内容',
          items: [
            '题干、答案、解析没有内容时，预览对应位置显示「暂无」。',
          ],
        },
      ],
      acceptance: [
        '点预览后看到的是考点清单。',
        '材料题大题前有【材料题】；多选题子题显示为（1）（多选题）题干；判断、填空、问答子题只有序号。',
        '多选题子题的选项与（多选题）左边对齐，不与序号对齐。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '预览里的典型例题',
        relatedFiles: [
          'src/components/shared/KnowledgeCardTabletPreview.tsx',
          'src/components/shared/KnowledgeCardPanel.tsx',
        ],
      },
    },
    {
      id: 'KT_KC_EX-006',
      title: '选题列表的题型、难易度与筛选',
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
        { type: 'navigate', label: '进入知识体系-通用知识树', to: '/knowledge-system' },
        { type: 'setTab', label: '切到学习资源', tab: 'resource' },
        { type: 'setTab', label: '切到考点', tab: 'exam' },
        { type: 'openDialog', label: '打开选题弹窗', dialog: 'leke-question-picker' },
        {
          type: 'scrollTo',
          label: '定位选题列表',
          anchorId: 'knowledge-tree.knowledge-card.picker-question',
        },
      ],
      logicSections: [
        {
          title: '习题显示',
          items: [
            '在原来的选题列表上，每道题增加显示题型和难易度。',
            '题型和难易度在题干上方，折叠时就能看到。展开后仍显示答案和解析。',
            '显示含子题的题型的时候，在难易度的后面，再显示有几道子题\n\n子题在显示的时候，按照子题题干、答案、解析的格式进行显示，子题的题型只有在是多选题的时候，才单独显示题型，其他子题题型，都不单独显示题型',
          ],
        },
        {
          title: '筛选',
          items: [
            '搜索框旁增加题型筛选，默认选中全部题型，用户可筛选题型\n\n筛选题型时，下拉的题型可选项，和外面可设置的题型规则保持一致——即，支持当前学科在乐课网除了手写题以外的题型',
            '题型筛选和题干搜索一起生效。关闭弹窗后，筛选回到全部题型。',
          ],
        },
      ],
      acceptance: [
        '打开系统选择后，每道题都能看到题型和难易度。',
        '用题型筛选后，列表只留下对应题型。',
      ],
      source: {
        decisionFile: DECISION,
        decisionObject: '选题列表题型、难易度与筛选',
        relatedFiles: ['src/components/shared/LekeQuestionPicker.tsx'],
      },
    },
  ],
  excludedDecisions: [],
};
