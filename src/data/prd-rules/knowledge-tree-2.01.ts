/**
 * 通用知识树 - 2.01详情页-非编辑态 PRD规则数据
 *
 * 数据来源：产品文档/2-单页PRD/1-通用知识树/2.01详情页-非编辑态.md
 * 提取维度：组件说明 + 交互逻辑 + 业务规则
 * 去重原则：同一条规则只归入一个分类，不重复描述
 */

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== A. 编辑提示条 ====================
export const editTipBar: PrdTooltipData = {
  title: '编辑提示条',
  rules: [
    { category: '显示规则', content: '默认显示，用户关闭后不再显示' },
    { category: '显示规则', content: '提示内容说明编辑知识树结构的生效时机：新增、删除、改名、移动节点对不同下游业务的影响不同' },
    { category: '显示规则', content: '实时生效：全乐课网平台仅涉及知识树展示、不涉及版本号的下游业务' },
    { category: '显示规则', content: '发布后生效：涉及版本号的下游业务（自适应学习系统）' },
  ],
};

// ==================== B. 状态条 ====================
export const statusBar: PrdTooltipData = {
  title: '发布状态条',
  rules: [
    { category: '字段规则', content: '显示当前知识树的发布状态：已发布 / 待发布' },
    { category: '显示规则', content: '若有未发布变更，显示橙色提示条「有未发布的变更，点击查看或发布」' },
    { category: '交互规则', content: '点击发布按钮可发布当前变更' },
    { category: '交互规则', content: '点击查看历史入口可查看历史版本记录' },
  ],
};

// ==================== C. 返回学科列表按钮 ====================
export const backButton: PrdTooltipData = {
  title: '返回学科列表',
  rules: [
    { category: '交互规则', content: '点击后返回通用知识树首页的学科列表页' },
    { category: '交互规则', content: '返回后恢复用户离开详情页前的列表上下文' },
    { category: '数据规则', content: '当前详情页内的知识点选中状态在离开后不再保留' },
  ],
};

// ==================== C. 删除按钮 ====================
export const deleteButton: PrdTooltipData = {
  title: '删除知识树',
  rules: [
    { category: '权限规则', content: '仅教研主管可见并可操作' },
    { category: '交互规则', content: '点击后先校验当前知识树下是否存在知识点' },
    { category: '交互规则', content: '若存在知识点，弹出「无法删除」提示弹窗，提示先删除所有知识点' },
    { category: '交互规则', content: '若无知识点，弹出「删除确认」弹窗' },
    { category: '交互规则', content: '删除成功后返回通用知识树首页学科列表页，并刷新列表数据' },
  ],
};

// ==================== D. 无法删除提示弹窗 ====================
export const cannotDeleteDialog: PrdTooltipData = {
  title: '无法删除提示弹窗',
  rules: [
    { category: '显示规则', content: '触发条件：当前知识树下存在知识点' },
    { category: '显示规则', content: '弹窗无标题，宽度 400px' },
    { category: '显示规则', content: '显示橙色警告图标' },
    { category: '字段规则', content: '提示文案：当前知识树下存在知识点，请先删除所有知识点后再删除知识树' },
    { category: '字段规则', content: '按钮文案：我知道了' },
  ],
};

// ==================== D. 删除确认弹窗 ====================
export const deleteConfirmDialog: PrdTooltipData = {
  title: '删除确认弹窗',
  rules: [
    { category: '显示规则', content: '触发条件：当前知识树无知识点' },
    { category: '显示规则', content: '弹窗无标题，宽度 400px' },
    { category: '显示规则', content: '显示红色警告图标' },
    { category: '字段规则', content: '提示文案：确定要删除当前知识树吗？删除后不可恢复' },
    { category: '字段规则', content: '按钮文案：取消、确认删除' },
  ],
};

// ==================== E1. 学科信息卡片 ====================
export const subjectInfoCard: PrdTooltipData = {
  title: '学科信息卡片',
  rules: [
    { category: '字段规则', content: '标题固定显示「知识树」' },
    { category: '字段规则', content: '学段学科标签格式：初中·数学' },
    { category: '字段规则', content: '版本号显示当前最近一次已发布版本号，格式为「版本：V1.0」' },
    { category: '交互规则', content: '版本号旁有历史版本图标，点击可查看历史版本记录' },
    { category: '数据规则', content: '历史版本内容仅用于查看，不支持在本页直接恢复历史版本' },
  ],
};

// ==================== E2. 搜索框 ====================
export const searchBox: PrdTooltipData = {
  title: '搜索知识点',
  rules: [
    { category: '字段规则', content: '占位文案：搜索知识点...' },
    { category: '字段规则', content: '搜索图标位于输入框左侧' },
    { category: '交互规则', content: '搜索实时生效，无需回车确认' },
    { category: '数据规则', content: '搜索范围默认为知识点名称' },
    { category: '数据规则', content: '命中的知识点高亮显示' },
    { category: '数据规则', content: '包含命中结果的父级节点自动展开' },
    { category: '显示规则', content: '无匹配结果时，左侧树区域显示无结果提示' },
    { category: '交互规则', content: '清空搜索词后，恢复完整知识树列表' },
  ],
};

// ==================== E3. 知识树目录列表 ====================
export const knowledgeTreeList: PrdTooltipData = {
  title: '知识树目录',
  rules: [
    { category: '显示规则', content: '支持分层展示知识点结构' },
    { category: '交互规则', content: '支持节点展开/折叠' },
    { category: '交互规则', content: '点击节点可选中高亮' },
    { category: '显示规则', content: '进入详情页后自动处于可编辑态，显示拖拽手柄、新增/删除/编辑按钮' },
    { category: '权限规则', content: '教研主管可对左侧知识树目录进行新增、重命名、删除、拖拽排序等操作' },
    { category: '数据规则', content: '每次操作（新增、删除、重命名、移动节点）后自动生成变更记录，页面状态变为「待发布」' },
    { category: '数据规则', content: '编辑树结构模式的详细交互规则见《详情页-编辑态-左侧知识树目录》文档' },
  ],
};

// ==================== F1. 知识点详情标题 ====================
export const detailTitle: PrdTooltipData = {
  title: '知识点详情标题',
  rules: [
    { category: '字段规则', content: '固定显示「知识点详情」，位于右侧详情区顶部' },
  ],
};

// ==================== F2.1 导出知识树按钮 ====================
export const exportButton: PrdTooltipData = {
  title: '导出知识树',
  rules: [
    { category: '权限规则', content: '教研主管和教研员均可见' },
    { category: '交互规则', content: '点击后导出当前学科知识树数据' },
    { category: '数据规则', content: '导出内容覆盖当前学科知识树的目录及相关基础数据' },
    { category: '数据规则', content: '导出成功后提示导出成功，失败时提示失败原因' },
  ],
};

// ==================== F2.2 编辑知识点详情按钮 ====================
export const editDetailButton: PrdTooltipData = {
  title: '编辑知识点详情',
  rules: [
    { category: '权限规则', content: '教研主管和教研员均可见' },
    { category: '权限规则', content: '教研主管和教研员均可点击进入编辑知识点详情模式' },
    { category: '交互规则', content: '点击后进入编辑知识点详情模式，右侧详情可编辑' },
    { category: '交互规则', content: '当处于编辑知识点详情态时，左侧「编辑树结构」按钮置灰不可点击' },
    { category: '数据规则', content: '编辑知识点详情模式的详细交互规则见《详情页-编辑态-右侧知识点信息》文档' },
    { category: '数据规则', content: '左侧知识树编辑与右侧知识点详情编辑可同时进行，无互斥限制' },
  ],
};

// ==================== F3. 根节点引导态 ====================
export const rootNodeGuide: PrdTooltipData = {
  title: '根节点引导态',
  rules: [
    { category: '显示规则', content: '选中根节点时显示，不显示 Tab' },
    { category: '显示规则', content: '绿色渐变背景的文件夹树图标' },
    { category: '字段规则', content: '节点类型标题：根知识点' },
    { category: '字段规则', content: '说明文案：根节点用于组织和分类下属知识点。可展开左侧树结构，选择具体的知识点查看详细信息' },
    { category: '字段规则', content: '统计信息：显示当前节点名称和包含的子知识点数量' },
    { category: '字段规则', content: '提示文案：点击左侧展开按钮查看下属知识点' },
  ],
};

// ==================== E4. 非末级节点引导态 ====================
export const nonLeafNodeGuide: PrdTooltipData = {
  title: '非末级节点引导态',
  rules: [
    { category: '显示规则', content: '选中非末级节点时显示，不显示 Tab' },
    { category: '显示规则', content: '蓝色渐变背景的文件夹树图标' },
    { category: '字段规则', content: '节点类型标题：非末级知识点' },
    { category: '字段规则', content: '说明文案：该知识点包含子节点，知识点信息、知识点结构和学习资源仅在末级知识点维护。请选择具体的末级知识点查看详情' },
    { category: '字段规则', content: '统计信息：显示当前节点名称和包含的子知识点数量' },
    { category: '字段规则', content: '提示文案：展开左侧节点查看子知识点' },
  ],
};

// ==================== E5. 叶子节点详情态 - Tab切换 ====================
export const leafNodeTabs: PrdTooltipData = {
  title: '叶子节点 Tab 切换',
  rules: [
    { category: '显示规则', content: '仅叶子节点显示 Tab 切换栏' },
    { category: '显示规则', content: 'Tab栏左侧显示知识点名称和末级标签（绿色背景）' },
    { category: '字段规则', content: '三个 Tab：知识点信息 / 知识点结构 / 学习资源' },
    { category: '显示规则', content: '当前选中 Tab 高亮显示（绿色下划线）' },
    { category: '交互规则', content: '点击 Tab 后切换对应内容' },
    { category: '交互规则', content: '切换 Tab 时，仅切换右侧内容区，不影响左侧知识树状态' },
  ],
};

// ==================== F. 知识点信息 Tab - 学业要求卡片 ====================
export const academicRequirementCard: PrdTooltipData = {
  title: '学业要求',
  rules: [
    { category: '字段规则', content: '选项值：了解 / 理解 / 掌握 / 运用' },
    { category: '字段规则', content: '非必填；未配置时展示【未设置】' },
    { category: '显示规则', content: '仅叶子节点展示，位置在考频卡片左侧' },
    { category: '显示规则', content: '非编辑态下仅用于查看当前知识点学业要求' },
  ],
};

// ==================== F. 知识点信息 Tab - 考频卡片 ====================
export const examFrequencyCard: PrdTooltipData = {
  title: '考频',
  rules: [
    { category: '字段规则', content: '选项值：高频 / 中频 / 低频' },
    { category: '字段规则', content: '橙色渐变背景卡片' },
    { category: '字段规则', content: '非必填；未配置时展示【未设置】' },
    { category: '显示规则', content: '仅叶子节点展示考频信息；与学业要求同排、位于其右侧' },
    { category: '显示规则', content: '按系统配置的考频结果展示' },
    { category: '显示规则', content: '非编辑态下仅用于查看当前知识点考频信息' },
  ],
};

// ==================== F. 知识点信息 Tab - 选题策略卡片 ====================
export const strategyCard: PrdTooltipData = {
  title: '选题策略',
  rules: [
    { category: '字段规则', content: '绿色渐变背景（通用策略）或紫色渐变背景（个性化策略）' },
    { category: '显示规则', content: '仅叶子节点展示选题策略信息' },
    { category: '数据规则', content: '系统默认绑定通用策略，不存在未绑定策略的情况' },
    { category: '数据规则', content: '展示当前已绑定的策略类型和策略名称' },
    { category: '数据规则', content: '策略详情数据来源于策略管理模块中单知识点出题策略对应学段学科的策略配置' },
    { category: '数据规则', content: '根据当前知识树所属学段学科，匹配策略管理模块中同一学段学科下的出题策略进行展示' },
    { category: '数据规则', content: '已选择的个性化策略被删除后，自动将策略类型退回为通用策略；下游业务在拉取策略时，检测策略是否有变更，若无变更则以获取到的策略出题，若有变更则以拉到的最新策略出题' },
    { category: '交互规则', content: '策略详情在通用知识树页面内始终为查看态，不支持直接编辑；如需修改策略，需前往策略管理模块操作' },
  ],
};

// ==================== F. 知识点信息 Tab - 策略详情 ====================
export const strategyDetail: PrdTooltipData = {
  title: '策略详情',
  rules: [
    { category: '字段规则', content: '标题行固定显示文案「策略详情」' },
    { category: '字段规则', content: '每个掌握度区间头显示文案格式：「掌握度区间 X% — Y%」' },
    { category: '字段规则', content: '每个掌握度区间头右侧显示题目总数标签，文案格式：「共X题」' },
    { category: '字段规则', content: '每个区间内以表格展示题型配置，包含题型、题量、难度分布、题目来源、知识点复合度五列' },
    { category: '字段规则', content: '难度分布仅展示数量大于0的难度等级，格式为"难度名称+数量"，如"易2 较易1 中档1"' },
    { category: '字段规则', content: '难度等级包含五个档位：易、较易、中档、较难、难' },
    { category: '字段规则', content: '题目来源为多个时，以顿号分隔显示' },
    { category: '显示规则', content: '标题行居中显示，使用灰色背景' },
    { category: '显示规则', content: '绑定通用策略时，区间头使用绿色渐变背景，左侧带白色竖色条' },
    { category: '显示规则', content: '绑定个性化策略时，区间头使用紫色渐变背景，左侧带白色竖色条' },
    { category: '显示规则', content: '策略详情按掌握度区间分组展示，区间按掌握度从低到高排列' },
    { category: '显示规则', content: '掌握度区间数量不固定，由策略配置决定' },
    { category: '数据规则', content: '策略详情数据来源于策略管理模块中单知识点出题策略对应学段学科的策略配置' },
    { category: '数据规则', content: '根据当前知识树所属学段学科，匹配策略管理模块中同一学段学科下的出题策略进行展示' },
    { category: '交互规则', content: '策略详情在通用知识树页面内始终为查看态，不支持直接编辑' },
    { category: '交互规则', content: '如需修改策略，需前往策略管理模块操作' },
    { category: '校验规则', content: '策略信息加载失败时，策略卡片及策略详情区域显示失败提示，并提供重试入口' },
    { category: '校验规则', content: '掌握度区间为空时，策略详情区域显示「暂无策略配置」' },
    { category: '校验规则', content: '某区间内题型配置为空时，显示区间头信息，子表区域显示「暂无题型配置」' },
    { category: '校验规则', content: '难度分布数量之和与题量不一致时，仍按实际数据正常展示，不阻断显示' },
    { category: '校验规则', content: '策略类型字段缺失时，默认按通用策略展示' },
    { category: '校验规则', content: '知识点对应策略在策略管理模块中不存在时，策略详情区域显示「未找到策略信息」' },
  ],
};

// ==================== G. 知识点结构 Tab ====================
export const knowledgeStructureTab: PrdTooltipData = {
  title: '知识点结构',
  rules: [
    { category: '显示规则', content: '仅叶子节点展示知识点结构内容' },
    { category: '字段规则', content: '展示当前知识点与前置知识点、延伸知识点的关系' },
    { category: '交互规则', content: '非编辑态下仅用于查看，具体编辑能力在编辑态中处理' },
  ],
};

// ==================== H. 学习资源 Tab ====================
export const learningResourceTab: PrdTooltipData = {
  title: '学习资源',
  rules: [
    { category: '字段规则', content: '视频讲解区域标题文案：「视频讲解」，紫色渐变背景卡片' },
    { category: '字段规则', content: '视频列表中每个视频条目显示：视频名称、来源标签（上传/资源库）、时长、文件大小、播放按钮' },
    { category: '字段规则', content: '有视频时，视频讲解卡片右上角显示「共X个视频」' },
    { category: '字段规则', content: '文字讲解区域标题文案：「文字讲解」，绿色渐变背景卡片' },
    { category: '字段规则', content: '非编辑态下文字讲解以富文本形式展示' },
    { category: '显示规则', content: '仅叶子节点展示学习资源内容' },
    { category: '显示规则', content: '无视频资源时显示「暂无视频讲解」' },
    { category: '显示规则', content: '无文字讲解时显示「暂无文字讲解」' },
    { category: '交互规则', content: '非编辑态下仅用于查看资源内容，不支持编辑' },
    { category: '交互规则', content: '非编辑态下点击视频条目可播放视频' },
    { category: '交互规则', content: '非编辑态下文字讲解中的图片可点击在新窗口查看大图' },
    { category: '校验规则', content: '学习资源加载失败时，对应区域显示失败提示' },
  ],
};

// ==================== 双入口编辑规则 ====================
export const dualEditEntry: PrdTooltipData = {
  title: '双入口编辑规则',
  rules: [
    { category: '交互规则', content: '系统提供两个独立的编辑入口：「编辑树结构」和「编辑知识点详情」' },
    { category: '交互规则', content: '两个入口互斥，同时只能存在一种编辑态' },
    { category: '权限规则', content: '「编辑树结构」入口位于左侧学科信息卡片标题行右侧，仅教研主管可见' },
    { category: '权限规则', content: '「编辑知识点详情」入口位于右侧详情区标题区右侧，教研主管和教研员均可见' },
    { category: '交互规则', content: '当处于编辑知识点详情态时，左侧「编辑树结构」按钮置灰不可点击' },
  ],
};
