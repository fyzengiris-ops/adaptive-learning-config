/**
 * 教材体系知识树 - 2.00详情页-非编辑态 PRD规则数据
 *
 * 数据来源：产品文档/2-单页PRD/2-教材体系知识树/2.00详情页-非编辑态.md
 * 覆盖范围：同步课程、练习试卷（一期未开发模块）
 * 提取维度：组件说明 + 交互逻辑 + 业务规则 + 状态与异常
 * 去重原则：同一条规则只归入一个分类，不重复描述
 */

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 同步课程 ====================

// 同步课程Tab
export const textbookSyncCourseTab: PrdTooltipData = {
  title: '同步课程Tab',
  rules: [
    { category: '字段规则', content: 'Tab文案：「同步课程」' },
    { category: '显示规则', content: '所有节点都展示同步课程Tab' },
    { category: '显示规则', content: '当前选中Tab高亮显示' },
    { category: '显示规则', content: '所有层级的同步课程卡片样式完全统一，采用renderCourseCard渲染函数，仅通过showRemove参数控制移除按钮显隐' },
    { category: '交互规则', content: '点击Tab切换为同步课程内容区域' },
  ],
};

// 同步课程-三级小节详情态
export const textbookSyncCourseDetail: PrdTooltipData = {
  title: '关联同步课程-详情态',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「关联同步课程」+ 课程数量「（N个）」' },
    { category: '字段规则', content: '课程卡片完整字段：视频图标（蓝色圆角背景40×40px，内嵌白色Video图标）、课程名称（超长截断）、来源标签（本地上传=蓝色标签/资源库=绿色标签，缺失不展示）、时长（Clock图标+文字，缺失显示--）、视频大小、教师信息（上传该视频的账号的教师名称，有值展示无值隐藏）' },
    { category: '字段规则', content: '右侧操作区：预览按钮（Play图标，hover蓝色高亮），编辑态下额外展示移除按钮（X图标，hover红色高亮）' },
    { category: '显示规则', content: '三级小节节点选中时，展示当前三级小节直接关联的同步课程列表' },
    { category: '显示规则', content: '课程卡片统一样式：蓝色浅色背景（bg-blue-50）+蓝色边框（border-blue-200）+圆角（rounded-lg），内间距p-3，元素间距gap-3' },
    { category: '显示规则', content: '课程列表区域支持纵向滚动' },
    { category: '显示规则', content: '卡片样式与聚合态完全一致，采用统一renderCourseCard渲染函数，详情态showRemove=true可移除' },
    { category: '交互规则', content: '点击预览按钮可播放对应课程视频' },
    { category: '交互规则', content: '编辑态下点击移除按钮可移除该课程，需确认' },
    { category: '交互规则', content: '非编辑态下同步课程为查看态，不展示移除按钮' },
    { category: '数据规则', content: '数据来源——推荐方案1：自适应学习系统自身维护的课程数据，按教材章节维度存储，支持从乐课网微课库选择并反写乐课网；备选方案2：直接从乐课网微课库按教材章节维度实时拉取；备选方案3：自适应学习系统独立维护，不与乐课网互通' },
    { category: '数据规则', content: '反写乐课网字段规则：备注固定写入「自适应配置后台同步」；学段学科自动携带当前章小节所属的学段学科；微课类型选择「同步微课」；用途选择「同步新课」；教材章节按当前小节所属的教材版本、年级信息、章节小节进行匹配；年份显示当前年份；地区选择全部；级别选择精品' },
    { category: '校验规则', content: '课程部分补充字段缺失时，按缺省值展示（时长/视频大小/教师缺失显示--或隐藏），不导致整条数据不可见' },
  ],
};

// 同步课程-空态
export const textbookSyncCourseEmpty: PrdTooltipData = {
  title: '同步课程-空态',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「关联同步课程」' },
    { category: '字段规则', content: '空态提示文案：「暂未关联同步课程」，编辑态下额外显示引导文案「点击上方按钮添加同步课程」' },
    { category: '显示规则', content: '空态区域样式：居中布局，灰色虚线边框（border-dashed border-gray-300），灰色浅背景（bg-gray-50），py-8内间距' },
    { category: '显示规则', content: '空态区域右上角展示PrdTooltip图标（absolute定位）' },
    { category: '显示规则', content: '当前节点无关联课程时，显示同步课程空态' },
    { category: '显示规则', content: '聚合范围无课程时，同样显示空态' },
  ],
};

// 同步课程-章级聚合展示态
export const textbookSyncCourseAggregate: PrdTooltipData = {
  title: '同步课程总览-聚合展示',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「同步课程总览」+ 附注——若当前定位到大的章节，则显示「（聚合展示该章节下所有节关联的课程）」；若当前定位到非大的章节也非末级小节，则显示「（聚合展示该节下所有子节关联的课程）」' },
    { category: '字段规则', content: '当前选中节点下一层级标题行：子节点名称 + 该子节点关联的节点数量，含X小节' },
    { category: '字段规则', content: '课程卡片完整字段（与详情态完全一致）：视频图标（蓝色圆角背景40×40px）、课程名称（超长截断）、来源标签（本地上传=蓝色/资源库=绿色，缺失不展示）、时长（Clock图标+文字）、视频大小、教师信息（上传该视频的账号的教师名称）、预览按钮（Play图标）' },
    { category: '显示规则', content: '选中章节点时，按章范围内下属二级小节（或三级小节）聚合展示同步课程' },
    { category: '显示规则', content: '选中"有三级小节"的二级小节节点时，按该二级小节范围内下属三级小节聚合展示同步课程' },
    { category: '显示规则', content: '课程卡片统一样式：蓝色浅色背景（bg-blue-50）+蓝色边框（border-blue-200）+圆角（rounded-lg），采用统一renderCourseCard渲染函数' },
    { category: '显示规则', content: '聚合态下showRemove=false，不展示移除按钮；其余字段与详情态完全一致' },
    { category: '交互规则', content: '点击课程预览按钮可播放对应课程视频' },
    { category: '交互规则', content: '非编辑态下聚合态课程为查看态，不支持移除/编辑' },
  ],
};

// 同步课程-二级小节详情态
export const textbookSyncCourseSectionDetail: PrdTooltipData = {
  title: '关联同步课程-二级小节详情',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「关联同步课程」+ 课程数量「（N个）」' },
    { category: '字段规则', content: '课程卡片完整字段（与三级小节详情态完全一致）：视频图标（蓝色圆角背景40×40px）、课程名称（超长截断）、来源标签（本地上传=蓝色/资源库=绿色，缺失不展示）、时长（Clock图标+文字）、视频大小、教师信息（上传该视频的账号的教师名称）、预览按钮（Play图标）' },
    { category: '显示规则', content: '当选中"无三级小节"的二级小节节点时，展示当前二级小节直接关联的同步课程列表' },
    { category: '显示规则', content: '课程卡片统一样式与三级小节详情态完全一致，采用统一renderCourseCard渲染函数，showRemove=true编辑态可移除' },
    { category: '交互规则', content: '点击预览按钮可播放对应课程视频' },
    { category: '交互规则', content: '非编辑态下不展示移除按钮' },
  ],
};

// ==================== 练习试卷 ====================

// 练习试卷Tab
export const textbookPracticePaperTab: PrdTooltipData = {
  title: '练习试卷Tab',
  rules: [
    { category: '字段规则', content: 'Tab文案：「练习试卷」' },
    { category: '显示规则', content: '所有节点都展示练习试卷Tab' },
    { category: '显示规则', content: '当前选中Tab高亮显示' },
    { category: '显示规则', content: '所有层级的练习试卷卡片样式完全统一，采用renderExamCard渲染函数，仅通过showRemove参数控制移除按钮显隐' },
    { category: '交互规则', content: '点击Tab切换为练习试卷内容区域' },
  ],
};

// 练习试卷-三级小节详情态
export const textbookPracticePaperDetail: PrdTooltipData = {
  title: '关联练习试卷-详情态',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「关联练习试卷」+ 试卷数量「（N套）」' },
    { category: '字段规则', content: '试卷卡片完整字段：试卷图标（橙色圆角背景40×40px，内嵌白色ClipboardList图标）、试卷名称（超长截断）、来源标签（本地上传=蓝色标签/资源库=绿色标签，缺失不展示）' },
    { category: '字段规则', content: '资源库试卷副字段：题量（N题，缺失显示--）、总分（N分，缺失显示--）' },
    { category: '字段规则', content: '右侧操作区：预览按钮（Eye图标，hover橙色高亮），编辑态下额外展示移除按钮（X图标，hover红色高亮）' },
    { category: '显示规则', content: '三级小节节点选中时，展示当前三级小节直接关联的练习试卷列表' },
    { category: '显示规则', content: '试卷卡片统一样式：橙色浅色背景（bg-amber-50）+橙色边框（border-amber-200）+圆角（rounded-lg），内间距p-3，元素间距gap-3' },
    { category: '显示规则', content: '试卷列表区域支持纵向滚动' },
    { category: '显示规则', content: '卡片样式与聚合态完全一致，采用统一renderExamCard渲染函数，详情态showRemove=true可移除' },
    { category: '交互规则', content: '点击预览按钮可查看对应试卷详情内容，预览为只读模式' },
    { category: '交互规则', content: '编辑态下点击移除按钮可移除该试卷，需确认' },
    { category: '交互规则', content: '非编辑态下练习试卷为查看态，不展示移除按钮' },
    { category: '数据规则', content: '数据源：默认不回显乐课网任何已有的数据' },
    { category: '校验规则', content: '试卷部分补充字段缺失时，按缺省值展示（题量/总分缺失显示--，来源标签缺失不展示），不导致整条数据不可见' },
  ],
};

// 练习试卷-空态
export const textbookPracticePaperEmpty: PrdTooltipData = {
  title: '练习试卷-空态',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「关联练习试卷」' },
    { category: '字段规则', content: '空态提示文案：「暂未关联练习试卷」，编辑态下额外显示引导文案「点击上方按钮添加练习试卷」或「点击上方按钮从资源库选择练习试卷」' },
    { category: '显示规则', content: '空态区域样式：居中布局，灰色虚线边框（border-dashed border-gray-300），灰色浅背景（bg-gray-50），py-8内间距' },
    { category: '显示规则', content: '空态区域右上角展示PrdTooltip图标（absolute定位）' },
    { category: '显示规则', content: '当前节点无关联试卷时，显示练习试卷空态' },
    { category: '显示规则', content: '聚合范围无试卷时，同样显示空态' },
  ],
};

// 练习试卷-章级聚合展示态
export const textbookPracticePaperAggregate: PrdTooltipData = {
  title: '练习试卷总览-聚合展示',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「练习试卷总览」+ 附注——若当前定位到大的章节，则显示「（聚合展示该章节下所有节关联的试卷）」；若当前定位到非大的章节也非末级小节，则显示「（聚合展示该节下所有子节关联的试卷）」' },
    { category: '字段规则', content: '当前选中节点下一层级标题行：子节点名称 + 该子节点关联的节点数量，含X小节' },
    { category: '字段规则', content: '试卷卡片完整字段（与详情态完全一致）：试卷图标（橙色圆角背景40×40px）、试卷名称（超长截断）、来源标签（本地上传=蓝色/资源库=绿色，缺失不展示）' },
    { category: '字段规则', content: '资源库试卷副字段：题量（N题）、总分（N分）' },
    { category: '字段规则', content: '右侧预览按钮（Eye图标，hover橙色高亮）' },
    { category: '显示规则', content: '选中章节点时，按章范围内下属二级小节（或三级小节）聚合展示练习试卷' },
    { category: '显示规则', content: '选中"有三级小节"的二级小节节点时，按该二级小节范围内下属三级小节聚合展示练习试卷' },
    { category: '显示规则', content: '试卷卡片统一样式：橙色浅色背景（bg-amber-50）+橙色边框（border-amber-200）+圆角（rounded-lg），采用统一renderExamCard渲染函数' },
    { category: '显示规则', content: '聚合态下showRemove=false，不展示移除按钮；其余字段与详情态完全一致' },
    { category: '交互规则', content: '点击试卷预览按钮可查看对应试卷详情内容，预览为只读模式' },
    { category: '交互规则', content: '非编辑态下聚合态试卷为查看态，不支持移除/编辑' },
  ],
};

// 练习试卷-二级小节详情态
export const textbookPracticePaperSectionDetail: PrdTooltipData = {
  title: '关联练习试卷-二级小节详情',
  rules: [
    { category: '字段规则', content: '标题行显示文案：「关联练习试卷」+ 试卷数量「（N套）」' },
    { category: '字段规则', content: '试卷卡片完整字段（与三级小节详情态完全一致）：试卷图标（橙色圆角背景40×40px）、试卷名称（超长截断）、来源标签（本地上传=蓝色/资源库=绿色，缺失不展示）' },
    { category: '字段规则', content: '资源库试卷副字段：题量（N题）、总分（N分）' },
    { category: '字段规则', content: '右侧预览按钮（Eye图标，hover橙色高亮）' },
    { category: '显示规则', content: '当选中"无三级小节"的二级小节节点时，展示当前二级小节直接关联的练习试卷列表' },
    { category: '显示规则', content: '试卷卡片统一样式与三级小节详情态完全一致，采用统一renderExamCard渲染函数，showRemove=true编辑态可移除' },
    { category: '交互规则', content: '点击预览按钮可查看对应试卷详情内容，预览为只读模式' },
    { category: '交互规则', content: '非编辑态下不展示移除按钮' },
  ],
};

// ==================== 异常与边界 ====================
export const textbookCoursePaperException: PrdTooltipData = {
  title: '同步课程/练习试卷-异常与边界',
  rules: [
    { category: '校验规则', content: '当前教材详情加载失败时，应提示加载失败并支持重试' },
    { category: '校验规则', content: '课程或试卷部分补充字段缺失时，按缺省值展示（时长/题量/总分缺失显示--，来源标签缺失不展示），不导致整条数据不可见' },
    { category: '校验规则', content: '同一教材中可能同时存在"有三级小节的二级小节"和"无三级小节的二级小节"，课程/试卷卡片样式需统一，不允许使用不同尺寸或布局的卡片' },
  ],
};
