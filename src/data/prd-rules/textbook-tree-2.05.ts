/**
 * 教材体系知识树 - 2.05详情页-编辑态-同步课程展示 PRD规则数据
 *
 * 数据来源：产品文档/2-单页PRD/2-教材体系知识树/2.05详情页-编辑态-同步课程展示.md
 * 覆盖范围：编辑态同步课程的标题行、操作按钮、非末级聚合展示、末级详情展示、空态、上传进度、移除操作
 * 提取维度：组件说明 + 交互逻辑 + 业务规则 + 状态与异常
 * 去重原则：同一条规则只归入一个分类，不重复描述；与2.00非编辑态重叠的通用卡片字段规则不重复，仅描述编辑态增量
 */

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 编辑态-标题行 ====================

// 编辑态-标题行（区分非末级/末级节点）
export const editSyncCourseTitle: PrdTooltipData = {
  title: '编辑态-同步课程标题行',
  rules: [
    { category: '字段规则', content: '非末级节点标题行文案：「同步课程总览」+ 附注——若当前定位到大的章节，则显示「（聚合展示该章节下所有节关联的课程）」；若当前定位到非大的章节也非末级小节，则显示「（聚合展示该节下所有子节关联的课程）」' },
    { category: '字段规则', content: '末级节点标题行文案：「关联同步课程」+ 课程数量「（N个）」' },
    { category: '显示规则', content: '标题行右侧在编辑态+末级节点时展示操作按钮区（上传课程/从资源库选择）' },
    { category: '显示规则', content: '标题行右侧在编辑态+非末级节点时不展示操作按钮' },
  ],
};

// ==================== 编辑态-操作按钮区 ====================

// 编辑态-操作按钮（仅末级节点展示）
export const editSyncCourseActions: PrdTooltipData = {
  title: '编辑态-同步课程操作按钮',
  rules: [
    { category: '字段规则', content: '「上传课程」按钮：蓝色实心（bg-blue-600），Upload图标+文案，hover蓝色加深' },
    { category: '字段规则', content: '「从资源库选择」按钮：绿色描边（border-emerald-600 text-emerald-600），BookOpen图标+文案，hover绿色浅背景' },
    { category: '显示规则', content: '操作按钮仅在编辑态+末级节点（三级小节或无三级小节的二级小节）时展示' },
    { category: '显示规则', content: '非末级节点不展示操作按钮，仅展示聚合查看结果' },
    { category: '显示规则', content: '末级节点无论有数据还是空态，都展示操作按钮' },
    { category: '交互规则', content: '点击「上传课程」→ 打开上传课程弹窗，在弹窗内选择文件并上传' },
    { category: '交互规则', content: '点击「从资源库选择」→ 打开资源库课程选择弹窗，清空临时已选和搜索关键词' },
  ],
};

// ==================== 编辑态-非末级聚合展示 ====================

// 编辑态-非末级节点同步课程总览
export const editSyncCourseAggregate: PrdTooltipData = {
  title: '编辑态-同步课程总览（聚合）',
  rules: [
    { category: '字段规则', content: '当前选中节点下一层级标题行：子节点名称 + 该子节点关联的节点数量，含X小节' },
    { category: '字段规则', content: '每个子节点下展示该子节点的课程列表，课程卡片字段与末级详情态完全一致，采用统一renderCourseCard渲染函数' },
    { category: '字段规则', content: '子节点无课程时显示空态提示「暂无课程」' },
    { category: '显示规则', content: '编辑态下非末级节点同步课程总览为只读查看态，不展示操作按钮和移除按钮（showRemove=false）' },
    { category: '显示规则', content: '聚合展示按子节点分组，每个子节点独立展示标题、课程列表' },
    { category: '交互规则', content: '非末级节点编辑态下不支持直接维护课程，需定位到末级节点才能操作' },
  ],
};

// ==================== 编辑态-末级有数据 ====================

// 编辑态-末级节点有数据
export const editSyncCourseLeafData: PrdTooltipData = {
  title: '编辑态-关联同步课程（末级有数据）',
  rules: [
    { category: '字段规则', content: '课程卡片完整字段（与2.00非编辑态完全一致）：视频图标（蓝色圆角背景40×40px）、课程名称（超长截断）、来源标签（本地上传=蓝色/资源库=绿色，缺失不展示）、时长（Clock图标+文字）、视频大小、教师信息（上传该视频的账号的教师名称）、预览按钮（Play图标）' },
    { category: '字段规则', content: '编辑态增量：课程卡片右侧额外展示移除按钮（X图标，hover红色高亮），showRemove=true' },
    { category: '字段规则', content: '卡片统一样式：蓝色浅色背景（bg-blue-50）+蓝色边框（border-blue-200）+圆角（rounded-lg），内间距p-3，采用统一renderCourseCard渲染函数' },
    { category: '显示规则', content: '末级节点编辑态下，课程卡片展示移除按钮，允许移除课程关联' },
    { category: '显示规则', content: '课程来源标签区分：本地上传=蓝色标签、资源库=绿色标签；所有来源统一展示字段，不因来源区分展示内容' },
    { category: '显示规则', content: '系统初始化的时候，自动获取乐课网当前小节已有的微课数据，在配置后台对应小节详情页面直接回显' },
    { category: '交互规则', content: '点击预览按钮。用乐课网原本预览视频的组件，新开页预览视频' },
    { category: '交互规则', content: '点击移除按钮（X图标）→ 可直接将视频删除，无二次弹窗确认' },
    { category: '显示规则', content: '在编辑状态下，在【关联同步课程】这个字段的后面，显示固定的静态提示文案——删除视频，仅代表在当前页面解除关联关系，不影响原视频在资源库中的存在。' },
  ],
};

// ==================== 编辑态-末级空态 ====================

// 编辑态-末级节点空态
export const editSyncCourseLeafEmpty: PrdTooltipData = {
  title: '编辑态-同步课程空态',
  rules: [
    { category: '字段规则', content: '空态提示文案：「暂未关联同步课程」' },
    { category: '字段规则', content: '编辑态增量引导文案：「点击上方按钮添加同步课程」' },
    { category: '显示规则', content: '空态区域样式：居中布局，灰色虚线边框（border-dashed border-gray-300），灰色浅背景（bg-gray-50），py-8内间距' },
    { category: '显示规则', content: '空态图标：Video图标，灰色（text-gray-300），32×32px居中' },
    { category: '显示规则', content: '空态区域右上角展示PrdTooltip图标（absolute定位）' },
    { category: '显示规则', content: '编辑态下额外展示引导文案，引导用户点击上方操作按钮添加课程' },
  ],
};

// ==================== 编辑态-上传进度 ====================

// 编辑态-上传课程进度条
export const editSyncCourseUploadProgress: PrdTooltipData = {
  title: '编辑态-上传课程进度',
  rules: [
    { category: '字段规则', content: '上传中文案：「正在上传课程...」+ 百分比「XX%」' },
    { category: '字段规则', content: '进度条：蓝色填充条（bg-blue-500），蓝色浅底（bg-blue-100），高度1.5，圆角' },
    { category: '显示规则', content: '上传进度区域样式：蓝色浅背景（bg-blue-50）+蓝色边框（border-blue-200），p-3内间距，rounded-lg' },
    { category: '显示规则', content: '上传中图标：旋转动画的蓝色圆环（animate-spin），16×16px' },
    { category: '交互规则', content: '点击文件选择器确认后，触发上传流程，展示进度条' },
    { category: '交互规则', content: '上传进度从0%递增至100%，每150ms递增10%，模拟上传过程' },
    { category: '交互规则', content: '上传完成后（100%），自动关闭进度条，将课程添加到当前节点课程列表' },
    { category: '校验规则', content: '文件类型限制：仅接受video/*格式' },
    { category: '校验规则', content: '支持多选文件上传，多个文件同时处理' },
  ],
};

// ==================== 编辑态-移除课程操作 ====================

// 编辑态-课程移除操作
export const editSyncCourseRemove: PrdTooltipData = {
  title: '编辑态-移除同步课程',
  rules: [
    { category: '显示规则', content: '移除按钮（X图标）仅在编辑态+末级节点+有数据的课程卡片上展示' },
    { category: '显示规则', content: '移除按钮默认灰色（text-gray-400），hover时红色高亮（text-red-500 bg-red-50）' },
    { category: '交互规则', content: '点击移除按钮（X图标）→ 可直接将视频删除，无二次弹窗确认' },
    { category: '交互规则', content: '非末级节点聚合态下的课程卡片不展示移除按钮（showRemove=false）' },
  ],
};

// ==================== 编辑态-删除视频资源弹窗 ====================

// 删除弹窗整体
export const deleteCourseDialog: PrdTooltipData = {
  title: '删除视频资源弹窗',
  rules: [
    { category: '字段规则', content: '弹窗标题文案：「请选择视频资源删除方式」' },
    { category: '字段规则', content: '取消按钮文案：「取消」，灰色边框样式' },
    { category: '字段规则', content: '确认按钮文案：「确认」，颜色随选中选项变化：选项1时蓝色、选项2时红色' },
    { category: '显示规则', content: '半透明黑色遮罩层，点击遮罩层不关闭弹窗' },
    { category: '显示规则', content: '弹窗默认选中「仅配置后台删除」选项' },
    { category: '交互规则', content: '点击「取消」关闭弹窗，不执行删除操作' },
    { category: '交互规则', content: '点击「确认」执行删除操作，删除方式取决于当前选中的选项' },
    { category: '交互规则', content: '删除操作即时生效于编辑结果，记录编辑变更' },
    { category: '数据规则', content: '选择「仅配置后台删除」：仅删除当前小节与视频的绑定关系，视频资源本身不受影响' },
    { category: '数据规则', content: '选择「全网删除」：删除后全网将不可查看该视频，属于不可逆操作' },
    { category: '校验规则', content: '选择「全网删除」时，确认按钮变为红色样式以强调操作不可逆风险' },
  ],
};

// 仅配置后台删除选项
export const deleteCourseUnbind: PrdTooltipData = {
  title: '仅配置后台删除',
  rules: [
    { category: '字段规则', content: '选项标题文案：「仅配置后台删除」' },
    { category: '字段规则', content: '选项描述文案：「只删除视频资源在配置后台与当前小节的绑定关系」' },
    { category: '显示规则', content: '单选按钮使用蓝色accent' },
    { category: '显示规则', content: '悬浮样式为蓝色边框+浅蓝背景' },
    { category: '显示规则', content: '弹窗默认选中此选项' },
    { category: '交互规则', content: '选中此选项时，确认按钮为蓝色样式' },
    { category: '数据规则', content: '仅删除当前小节与视频的绑定关系，视频资源在乐课网微课库中不受影响' },
    { category: '数据规则', content: '删除后，该课程不再出现在当前小节的课程列表中，但在乐课网微课库中仍可查看' },
  ],
};

// 全网删除选项
export const deleteCourseGlobal: PrdTooltipData = {
  title: '全网删除',
  rules: [
    { category: '字段规则', content: '选项标题文案：「全网删除」，红色文字' },
    { category: '字段规则', content: '选项描述文案：「删除后，全网将不可查看该视频」' },
    { category: '显示规则', content: '单选按钮使用红色accent' },
    { category: '显示规则', content: '悬浮样式为红色边框+浅红背景' },
    { category: '交互规则', content: '选中此选项时，确认按钮为红色样式，强调危险操作' },
    { category: '数据规则', content: '删除后全网将不可查看该视频，属于不可逆操作' },
    { category: '数据规则', content: '执行全网删除时，同时删除当前小节与视频的绑定关系，并将视频从乐课网微课库中下架或删除' },
    { category: '校验规则', content: '全网删除为不可逆操作，确认按钮红色样式提示用户谨慎操作' },
  ],
};
