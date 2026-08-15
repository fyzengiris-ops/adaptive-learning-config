// 2.8 - 详情页 - 个性化策略 - 发布历史记录弹窗
// 严格按照2.8 PRD文档内容生成，与2.3通用策略历史弹窗的差异已体现

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// 弹窗头部
export const modalHeader: PrdTooltipData = {
  title: '历史发布记录弹窗-头部',
  rules: [
    { category: '显示规则', content: '弹窗标题显示为"历史发布记录"' },
    { category: '显示规则', content: '标题右侧显示"共X条记录"，X为筛选后的记录总数' },
    { category: '显示规则', content: '头部展示当前策略信息，格式为"当前个性化策略：学段·学科·策略名称"，策略名称为当前策略的最新名称' },
    { category: '显示规则', content: '当前策略信息区域展示策略类型标签"个性化策略"' },
    { category: '交互规则', content: '点击关闭按钮或点击弹窗外部区域，关闭弹窗' },
  ],
};

// 类型筛选
export const typeFilter: PrdTooltipData = {
  title: '历史发布记录弹窗-类型筛选',
  rules: [
    { category: '显示规则', content: '类型筛选项固定展示为"个性化策略"' },
    { category: '显示规则', content: '类型筛选项按UI稿显示出来，显示效果为禁用态，不可切换' },
    { category: '显示规则', content: '筛选仅展示当前个性化策略的发布记录' },
  ],
};

// 学段筛选
export const phaseFilter: PrdTooltipData = {
  title: '历史发布记录弹窗-学段筛选',
  rules: [
    { category: '显示规则', content: '学段筛选项按UI稿显示出来，显示效果为禁用态，不可切换' },
    { category: '显示规则', content: '学段筛选项固定展示当前策略对应的学段' },
  ],
};

// 学科筛选
export const subjectFilter: PrdTooltipData = {
  title: '历史发布记录弹窗-学科筛选',
  rules: [
    { category: '显示规则', content: '学科筛选项按UI稿显示出来，显示效果为禁用态，不可切换' },
    { category: '显示规则', content: '学科筛选项固定展示当前策略对应的学科' },
  ],
};

// 策略名称
export const strategyNameFilter: PrdTooltipData = {
  title: '历史发布记录弹窗-策略名称',
  rules: [
    { category: '显示规则', content: '策略名称按UI稿显示出来，显示效果为禁用态，不可修改' },
    { category: '显示规则', content: '展示当前策略的策略名称' },
    { category: '数据规则', content: '策略名称为当前策略的最新名称' },
    { category: '数据规则', content: '历史记录列表中每条记录的策略名称展示的是发布时的策略名称，策略改名后历史记录仍展示旧名称' },
  ],
};

// 关键词搜索
export const keywordSearch: PrdTooltipData = {
  title: '历史发布记录弹窗-关键词搜索',
  rules: [
    { category: '显示规则', content: '搜索框占位文案为"搜索版本号、描述、发布人、策略名称..."' },
    { category: '交互规则', content: '搜索条件变化后，实时筛选下方历史记录列表' },
    { category: '交互规则', content: '搜索范围包括：版本号、更新说明、发布人、策略名称' },
    { category: '交互规则', content: '搜索为模糊匹配，不区分大小写' },
  ],
};

// 历史记录列表
export const historyList: PrdTooltipData = {
  title: '历史发布记录弹窗-历史记录列表',
  rules: [
    { category: '显示规则', content: '仅展示当前个性化策略的发布历史记录' },
    { category: '显示规则', content: '列表按发布时间倒序排列，最新发布的记录在最上方' },
    { category: '显示规则', content: '每页展示20条记录，超过时底部显示"加载更多"按钮' },
    { category: '交互规则', content: '滚动到列表底部时自动加载更多记录' },
    { category: '交互规则', content: '点击"加载更多"按钮加载下一页记录' },
  ],
};

// 记录条目
export const recordItem: PrdTooltipData = {
  title: '历史发布记录弹窗-记录条目',
  rules: [
    { category: '显示规则', content: '每条记录展示：版本号、策略主信息、策略类型标签、更新说明、发布时间、发布人' },
    { category: '显示规则', content: '版本号以标签形式展示，如"v1.0"' },
    { category: '显示规则', content: '策略主信息格式为"学段·学科·策略名称"，其中策略名称为发布时的名称' },
    { category: '显示规则', content: '策略类型标签展示"个性化策略"' },
    { category: '显示规则', content: '更新说明展示该版本的发布描述' },
    { category: '显示规则', content: '发布人格式为"发布人：姓名（账号：账号）"' },
    { category: '数据规则', content: '策略名称展示的是发布时的策略名称，策略改名后历史记录仍展示旧名称' },
    { category: '交互规则', content: '当前版本标识：若该记录的版本号为当前生效的已发布版本，则在版本号旁展示"当前版本"标识' },
  ],
};

// 当前版本标识
export const currentVersionTag: PrdTooltipData = {
  title: '历史发布记录弹窗-当前版本标识',
  rules: [
    { category: '显示规则', content: '当前生效的已发布版本，在版本号旁展示"当前版本"标识' },
    { category: '显示规则', content: '标识样式为绿色标签' },
    { category: '数据规则', content: '仅当前策略最新已发布版本标记为"当前版本"' },
  ],
};

// 关闭按钮
export const closeButton: PrdTooltipData = {
  title: '历史发布记录弹窗-关闭按钮',
  rules: [
    { category: '交互规则', content: '点击关闭按钮，关闭历史发布记录弹窗' },
  ],
};

// 空状态-无记录
export const emptyNoRecords: PrdTooltipData = {
  title: '历史发布记录弹窗-空状态（无记录）',
  rules: [
    { category: '显示规则', content: '当该个性化策略无任何发布记录时，列表区域展示空状态' },
    { category: '显示规则', content: '空状态展示图标和文案【暂无历史发布记录】' },
  ],
};

// 空状态-无匹配
export const emptyNoMatch: PrdTooltipData = {
  title: '历史发布记录弹窗-空状态（无匹配）',
  rules: [
    { category: '显示规则', content: '当搜索条件筛选后无匹配记录时，列表区域展示空状态，文案为【暂无符合搜索条件的数据】' },
    { category: '显示规则', content: '空状态展示图标和文案"暂无历史记录"' },
    { category: '交互规则', content: '用户修改搜索条件后，实时更新筛选结果' },
  ],
};
