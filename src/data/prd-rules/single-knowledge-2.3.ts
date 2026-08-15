/**
 * 单知识点出题 2.3 通用策略详情页-发布历史记录弹窗
 * 覆盖范围：弹窗头部、学段筛选、学科筛选、关键词搜索、历史记录列表、记录条目、关闭按钮、空状态
 * 去重原则：同一条规则只归入一个分类，不重复描述；与2.2详情页不重复（2.2仅覆盖入口按钮）
 * 前端状态：弹窗使用AggregateHistoryModal共享组件，tooltip需通过props注入
 * 与1.1差异：详情页弹窗仅展示当前策略的发布记录，类型筛选禁用，无策略类型/学段/学科标签，有当前版本标识
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 弹窗头部 ====================

export const modalHeader: PrdTooltipData = {
  title: '弹窗头部',
  rules: [
    { category: '字段规则', content: '标题包含History图标 + 文案【历史发布记录】' },
    { category: '字段规则', content: '标题右侧展示当前筛选条件下的记录总数，格式为【共 X 条记录】' },
    { category: '显示规则', content: '弹窗仅展示当前通用策略的历史发布记录，不包含其他策略的记录' },
    { category: '显示规则', content: '搜索条件变化后，记录总数同步更新' },
    { category: '显示规则', content: '无匹配结果时，总数显示为 0' },
    { category: '交互规则', content: '点击右上角关闭图标→ 关闭弹窗' },
  ],
};

// ==================== 类型筛选（禁用） ====================

export const typeFilter: PrdTooltipData = {
  title: '类型筛选（禁用）',
  rules: [
    { category: '显示规则', content: '详情页弹窗中类型筛选下拉置灰不可操作，固定展示当前策略类型【通用策略】' },
    { category: '显示规则', content: '类型筛选不可操作的原因：弹窗已限定为当前策略的发布记录，无需切换类型' },
  ],
};

// ==================== 学段筛选 ====================

export const phaseFilter: PrdTooltipData = {
  title: '学段筛选',
  rules: [
    { category: '字段规则', content: '下拉选项包含【全部学段】【高中】【初中】【小学】' },
    { category: '显示规则', content: '默认选中当前策略所属学段（非【全部学段】）' },
    { category: '交互规则', content: '切换学段后，历史记录列表刷新，记录总数同步更新，列表滚动回顶部' },
  ],
};

// ==================== 学科筛选 ====================

export const subjectFilter: PrdTooltipData = {
  title: '学科筛选',
  rules: [
    { category: '字段规则', content: '下拉选项首位为【全部学科】' },
    { category: '显示规则', content: '默认选中当前策略所属学科（非【全部学科】）' },
    { category: '显示规则', content: '学科选项跟随学段联动：各学段下具体展示哪些学科，根据乐课网当前学段下已有的学科数据进行展示' },
    { category: '交互规则', content: '切换学科后，历史记录列表刷新，记录总数同步更新，列表滚动回顶部' },
  ],
};

// ==================== 关键词搜索 ====================

export const keywordSearch: PrdTooltipData = {
  title: '关键词搜索',
  rules: [
    { category: '字段规则', content: '搜索框占位文案【搜索版本号、描述、发布人...】' },
    { category: '字段规则', content: '支持搜索范围：版本号、发布说明、发布人姓名' },
    { category: '交互规则', content: '用户输入关键词后自动搜索，无需手动触发' },
    { category: '交互规则', content: '清空关键词后，自动恢复当前筛选条件下的全部结果' },
    { category: '交互规则', content: '搜索时忽略关键词首尾空格' },
    { category: '交互规则', content: '仅输入空格时，视为无搜索条件' },
    { category: '交互规则', content: '搜索条件变化后，列表滚动回顶部' },
    { category: '显示规则', content: '学段学科筛选项按UI稿显示出来，显示效果为禁用态' },
  ],
};

// ==================== 历史记录列表 ====================

export const historyList: PrdTooltipData = {
  title: '历史记录列表',
  rules: [
    { category: '显示规则', content: '详情页弹窗仅展示当前通用策略的发布记录，不展示其他策略的记录' },
    { category: '显示规则', content: '历史记录默认按发布时间倒序排列，最新记录在最前' },
    { category: '显示规则', content: '发布时间相同时，按记录生成顺序倒序展示' },
    { category: '显示规则', content: '最新一条已发布版本的记录右侧展示【当前版本】标识' },
    { category: '交互规则', content: '列表支持滚动加载：滚动至底部附近时自动加载下一批记录' },
    { category: '交互规则', content: '加载下一批时，列表底部展示加载中状态' },
    { category: '交互规则', content: '全部记录加载完成后，列表底部展示【已加载全部】' },
    { category: '数据规则', content: '仅正式发布成功后生成历史发布记录；草稿保存、待发布、定时未到期、发布失败均不生成记录' },
    { category: '数据规则', content: '历史记录不受策略当前状态影响，策略被删除后已生成的历史记录仍继续展示' },
    { category: '数据规则', content: '当前版本不支持用户自定义排序' },
  ],
};

// ==================== 记录条目 ====================

export const recordItem: PrdTooltipData = {
  title: '记录条目',
  rules: [
    { category: '字段规则', content: '每条记录展示：版本号、发布时间、发布说明、发布人姓名' },
    { category: '字段规则', content: '通用策略记录不展示策略类型标签、学段标签、学科标签（当前策略信息已在详情页展示）' },
    { category: '显示规则', content: '最新一条已发布版本记录的右侧展示绿色【当前版本】标识' },
    { category: '显示规则', content: '发布说明过长时列表中最多展示两行，超出部分省略，鼠标悬浮展示完整内容' },
    { category: '显示规则', content: '发布人信息过长时单行展示，超出部分省略，鼠标悬浮展示完整内容' },
    { category: '显示规则', content: '版本号标签样式为绿色（emerald）底色等宽字体' },
    { category: '交互规则', content: '历史记录仅支持查看，不支持点击跳转、编辑、删除或回滚' },
    { category: '数据规则', content: '发布时间、发布说明、发布人姓名均为必有信息，不存在为空场景' },
  ],
};

// ==================== 关闭按钮 ====================

export const closeButton: PrdTooltipData = {
  title: '关闭弹窗',
  rules: [
    { category: '交互规则', content: '支持点击右上角关闭图标关闭弹窗' },
    { category: '交互规则', content: '支持点击底部【关闭】按钮关闭弹窗' },
    { category: '交互规则', content: '不支持点击遮罩层关闭弹窗' },
    { category: '交互规则', content: '不支持按ESC关闭弹窗' },
    { category: '交互规则', content: '关闭后再次打开弹窗时，恢复默认初始状态：当前策略学段、当前策略学科、空关键词、列表滚动至顶部' },
    { category: '显示规则', content: '弹窗打开期间，背景页面不可滚动，仅弹窗内历史记录列表区域可滚动' },
  ],
};

// ==================== 无历史记录空状态 ====================

export const emptyNoRecords: PrdTooltipData = {
  title: '无历史记录空状态',
  rules: [
    { category: '显示规则', content: '当前策略尚未产生任何正式发布成功的历史记录时，展示空状态' },
    { category: '显示规则', content: '空状态展示：半透明History图标 + 文案【暂无历史发布记录】' },
    { category: '显示规则', content: '空状态下不展示额外操作按钮' },
  ],
};

// ==================== 筛选搜索无结果空状态 ====================

export const emptyNoMatch: PrdTooltipData = {
  title: '筛选搜索无结果',
  rules: [
    { category: '显示规则', content: '当前策略存在历史记录，但在当前筛选或搜索条件下无匹配结果时，展示文案【暂无符合搜索条件的数据】' },
    { category: '显示规则', content: '保留当前筛选条件和搜索关键词，不自动重置' },
    { category: '显示规则', content: '不展示额外操作按钮' },
  ],
};

// ==================== 当前版本标识 ====================

export const currentVersionTag: PrdTooltipData = {
  title: '当前版本标识',
  rules: [
    { category: '显示规则', content: '最新一条已发布版本记录的右侧展示绿色【当前版本】标识' },
    { category: '显示规则', content: '仅有一条已发布版本时，该条记录展示【当前版本】标识' },
    { category: '数据规则', content: '【当前版本】标识与详情页右侧版本号保持一致；若详情页版本号因发布操作更新，弹窗中重新打开后同步更新' },
    { category: '数据规则', content: '策略处于草稿态（无已发布版本）时，所有记录均不展示【当前版本】标识' },
  ],
};
