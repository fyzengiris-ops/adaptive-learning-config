/**
 * 单知识点出题 1.1 首页-查看历史发布记录弹窗
 * 覆盖范围：弹窗头部、类型筛选、学段筛选、学科筛选、关键词搜索、历史记录列表、记录条目、关闭按钮、空状态
 * 去重原则：同一条规则只归入一个分类，不重复描述；与1.0首页不重复（1.0仅覆盖入口按钮）
 * 前端状态：弹窗使用AggregateHistoryModal共享组件，tooltip需通过props注入
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 弹窗头部 ====================

export const modalHeader: PrdTooltipData = {
  title: '弹窗头部',
  rules: [
    { category: '字段规则', content: '标题包含History图标 + 文案【历史发布记录】' },
    { category: '字段规则', content: '标题右侧展示当前筛选条件下的记录总数，格式为【共 X 条记录】' },
    { category: '显示规则', content: '默认展示全部历史发布记录总数' },
    { category: '显示规则', content: '搜索条件变化后，记录总数同步更新' },
    { category: '显示规则', content: '无匹配结果时，总数显示为 0' },
    { category: '交互规则', content: '点击右上角关闭图标→ 关闭弹窗' },
  ],
};

// ==================== 类型筛选 ====================

export const typeFilter: PrdTooltipData = {
  title: '类型筛选',
  rules: [
    { category: '字段规则', content: '下拉选项包含【全部类型】【通用策略】【个性化策略】' },
    { category: '显示规则', content: '默认选中【全部类型】' },
    { category: '交互规则', content: '选择【通用策略】时，仅展示通用策略的发布记录' },
    { category: '交互规则', content: '选择【个性化策略】时，仅展示个性化策略的发布记录' },
    { category: '交互规则', content: '切换类型后，历史记录列表刷新，记录总数同步更新，列表滚动回顶部' },
  ],
};

// ==================== 学段筛选 ====================

export const phaseFilter: PrdTooltipData = {
  title: '学段筛选',
  rules: [
    { category: '字段规则', content: '下拉选项包含【全部学段】【高中】【初中】【小学】' },
    { category: '显示规则', content: '默认选中【全部学段】' },
    { category: '交互规则', content: '切换学段后，历史记录列表刷新，记录总数同步更新，列表滚动回顶部' },
    { category: '交互规则', content: '切换学段后，学科选项联动更新；若当前学科在新学段下不可用，自动切换为【全部学科】' },
  ],
};

// ==================== 学科筛选 ====================

export const subjectFilter: PrdTooltipData = {
  title: '学科筛选',
  rules: [
    { category: '字段规则', content: '下拉选项首位为【全部学科】' },
    { category: '显示规则', content: '默认选中【全部学科】' },
    { category: '显示规则', content: '学科选项跟随学段联动：各学段下具体展示哪些学科，根据乐课网当前学段下已有的学科数据进行展示' },
    { category: '显示规则', content: '学段为【全部学段】时，学科选项展示全部学科' },
    { category: '交互规则', content: '切换学科后，历史记录列表刷新，记录总数同步更新，列表滚动回顶部' },
  ],
};

// ==================== 关键词搜索 ====================

export const keywordSearch: PrdTooltipData = {
  title: '关键词搜索',
  rules: [
    { category: '字段规则', content: '搜索框占位文案【搜索版本号、描述、发布人...】' },
    { category: '字段规则', content: '支持搜索范围：版本号、发布说明、发布人姓名、发布账号、个性化策略名称' },
    { category: '交互规则', content: '用户输入关键词后自动搜索，无需手动触发' },
    { category: '交互规则', content: '清空关键词后，自动恢复当前筛选条件下的全部结果' },
    { category: '交互规则', content: '搜索时忽略关键词首尾空格' },
    { category: '交互规则', content: '仅输入空格时，视为无搜索条件' },
    { category: '交互规则', content: '搜索条件变化后，列表滚动回顶部' },
    { category: '数据规则', content: '类型、学段、学科、关键词支持组合筛选，多条件之间为且关系' },
  ],
};

// ==================== 历史记录列表 ====================

export const historyList: PrdTooltipData = {
  title: '历史记录列表',
  rules: [
    { category: '显示规则', content: '首页弹窗为聚合视图，展示单知识点出题模块下所有策略的发布记录（含通用策略和个性化策略）' },
    { category: '显示规则', content: '历史记录默认按发布时间倒序排列，最新记录在最前' },
    { category: '显示规则', content: '发布时间相同时，按记录生成顺序倒序展示' },
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
    { category: '字段规则', content: '每条记录展示：版本号、学段、学科、策略类型、个性化策略名称（通用策略不展示）、发布时间、发布说明、发布人姓名、发布账号' },
    { category: '字段规则', content: '通用策略记录不展示策略名称字段；个性化策略记录展示发布时的策略名称' },
    { category: '显示规则', content: '发布说明过长时列表中最多展示两行，超出部分省略，鼠标悬浮展示完整内容' },
    { category: '显示规则', content: '发布人信息过长时单行展示，超出部分省略，鼠标悬浮展示完整内容' },
    { category: '显示规则', content: '版本号标签样式为绿色（emerald）底色等宽字体' },
    { category: '交互规则', content: '历史记录仅支持查看，不支持点击跳转、编辑、删除或回滚' },
    { category: '数据规则', content: '若策略后续改名，历史记录仍展示发布当时的策略名称' },
    { category: '数据规则', content: '发布时间、发布说明、发布人姓名、发布账号均为必有信息，不存在为空场景' },
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
    { category: '交互规则', content: '关闭后再次打开弹窗时，恢复默认初始状态：全部类型、全部学段、全部学科、空关键词、列表滚动至顶部' },
    { category: '显示规则', content: '弹窗打开期间，背景页面不可滚动，仅弹窗内历史记录列表区域可滚动' },
  ],
};

// ==================== 打开弹窗默认状态 ====================

export const openModal: PrdTooltipData = {
  title: '打开弹窗',
  rules: [
    { category: '显示规则', content: '弹窗打开时不带入首页当前筛选条件，默认筛选条件为：全部类型、全部学段、全部学科、空关键词' },
    { category: '显示规则', content: '默认展示单知识点出题模块下全部历史发布记录' },
    { category: '显示规则', content: '列表滚动位置默认定位到顶部' },
  ],
};

// ==================== 无历史记录空状态 ====================

export const emptyNoRecords: PrdTooltipData = {
  title: '无历史记录空状态',
  rules: [
    { category: '显示规则', content: '单知识点出题模块下尚未产生任何正式发布成功的历史记录时，展示空状态' },
    { category: '显示规则', content: '空状态展示：半透明History图标 + 文案【暂无历史发布记录】' },
    { category: '显示规则', content: '空状态下不展示额外操作按钮' },
  ],
};

// ==================== 筛选搜索无结果空状态 ====================

export const emptyNoMatch: PrdTooltipData = {
  title: '筛选搜索无结果',
  rules: [
    { category: '显示规则', content: '当前模块存在历史记录，但在当前筛选或搜索条件下无匹配结果时，展示文案【暂无符合搜索条件的数据】' },
    { category: '显示规则', content: '保留当前筛选条件和搜索关键词，不自动重置' },
    { category: '显示规则', content: '不展示额外操作按钮' },
  ],
};

// ==================== 加载失败异常 ====================

export const loadFailure: PrdTooltipData = {
  title: '加载失败',
  rules: [
    { category: '显示规则', content: '首次加载失败时，列表区域展示失败提示文案【加载失败，请稍后再试】，不展示重试按钮' },
    { category: '显示规则', content: '首次加载失败时不得展示为空状态' },
    { category: '显示规则', content: '滚动加载失败时，已加载记录保留展示，列表底部展示失败提示，不影响用户查看已加载记录' },
  ],
};

export const currentVersionTag: PrdTooltipData = {
  title: '首页-历史发布记录弹窗-当前版本标识',
  rules: [
    { category: '显示规则', content: '当前生效的已发布版本，在版本号旁展示"当前版本"标识' },
    { category: '数据规则', content: '仅当前策略最新已发布版本标记为"当前版本"' },
  ],
};
