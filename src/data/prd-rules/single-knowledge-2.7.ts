/**
 * 单知识点出题 2.7 详情页-查看个性化策略详情
 * 覆盖范围：页面头部（查看态）、状态提示区、基础信息区（只读，含策略名称）、题目组成配置区（只读）、底部操作区（编辑/删除）、发布操作、历史发布记录、策略不存在
 * 与2.2查看通用策略的关键差异：
 * - 页面标题为"个性化策略详情"
 * - 基础信息区展示策略名称（只读）
 * - 编辑入口进入2.6编辑个性化策略
 * - 删除弹窗文案包含策略名称
 * - 发布入口打开2.9个性化策略发布确认弹窗
 * - 历史发布记录打开2.8个性化策略历史发布记录弹窗
 * - 仅修改策略名称保存后不进入待发布状态
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 页面头部 ====================

export const pageHeader: PrdTooltipData = {
  title: '页面头部',
  rules: [
    { category: '字段规则', content: '查看态页面标题固定文案【个性化策略详情】' },
    { category: '字段规则', content: '头部展示当前已发布版本号，格式【版本：vX.X】' },
    { category: '字段规则', content: '头部右侧展示历史发布记录入口（History图标）' },
    { category: '显示规则', content: '已发布状态下，展示当前已发布版本号' },
    { category: '显示规则', content: '待发布状态下，仍展示当前已发布版本号' },
    { category: '显示规则', content: '页面头部左侧显示【返回】按钮（带ArrowLeft图标）' },
    { category: '交互规则', content: '点击【返回】后返回上一页，查看态不存在未保存内容，不弹出确认提示' },
    { category: '交互规则', content: '从首页进入详情页时，返回首页后保留进入详情页前的类型、学段、学科筛选条件' },
  ],
};

// ==================== 历史发布记录入口 ====================

export const historyEntry: PrdTooltipData = {
  title: '历史发布记录入口',
  rules: [
    { category: '字段规则', content: '入口始终展示，即使当前策略暂无历史发布记录' },
    { category: '交互规则', content: '点击后打开当前策略的历史发布记录弹窗（2.8个性化策略发布记录弹窗）' },
    { category: '交互规则', content: '无历史记录时，弹窗展示空状态' },
    { category: '数据规则', content: '详情页弹窗仅展示当前策略的发布记录，不能切换到其他策略' },
  ],
};

// ==================== 状态提示区 ====================

export const pendingPublishBar: PrdTooltipData = {
  title: '待发布提示条',
  rules: [
    { category: '字段规则', content: '提示文案【新增策略，需要发布后才能生效】' },
    { category: '字段规则', content: '右侧包含【发布】按钮' },
    { category: '显示规则', content: '仅待发布状态下展示' },
    { category: '显示规则', content: '已发布状态不展示状态提示条' },
    { category: '显示规则', content: '仅修改策略名称保存后，不进入待发布状态，不展示待发布提示条' },
    { category: '交互规则', content: '点击【发布】→ 打开2.9个性化策略发布确认弹窗' },
  ],
};

export const scheduledPublishBar: PrdTooltipData = {
  title: '定时发布提示条',
  rules: [
    { category: '字段规则', content: '提示文案格式【vX.X 版本将于 YYYY-MM-DD HH:mm 自动发布】' },
    { category: '字段规则', content: '右侧包含【取消定时】按钮' },
    { category: '显示规则', content: '仅定时发布状态下展示' },
    { category: '交互规则', content: '点击【取消定时】→ 弹出确认弹窗' },
    { category: '交互规则', content: '确认取消后：1.取消定时发布；2.策略状态切换为待发布；3.页面展示待发布提示条；4.待发布提示条右侧展示【发布】按钮' },
  ],
};

// ==================== 基础信息区 ====================

export const basicInfoSection: PrdTooltipData = {
  title: '基础信息区',
  rules: [
    { category: '字段规则', content: '区域标题固定文案【基础信息】，左侧带绿色竖条装饰' },
    { category: '字段规则', content: '展示策略名称（只读），位于学段和学科下方' },
    { category: '显示规则', content: '查看态下学段、学科、策略名称均为纯文本展示，不可编辑，不展示下拉控件和输入框' },
  ],
};

export const strategyNameField: PrdTooltipData = {
  title: '策略名称字段',
  rules: [
    { category: '字段规则', content: '字段标签【策略名称】' },
    { category: '字段规则', content: '查看态下策略名称以纯文本展示，不可编辑' },
    { category: '显示规则', content: '展示当前策略的名称' },
  ],
};

// ==================== 题目组成配置区 ====================

export const configSection: PrdTooltipData = {
  title: '题目组成配置区',
  rules: [
    { category: '字段规则', content: '区域标题固定文案【题目组成配置】，左侧带绿色竖条装饰' },
    { category: '显示规则', content: '查看态下仅支持查看，不展示以下编辑入口：添加区间、删除区间、添加题型、删除题目配置、输入框、下拉选择控件' },
    { category: '显示规则', content: '掌握度区间按起始值从小到大展示' },
    { category: '显示规则', content: '区间标题栏下方显示取值说明【区间取值说明：除最后一段为左闭右闭外，其余均为左闭右开】' },
  ],
};

// ==================== 掌握度区间展示 ====================

export const masteryRange: PrdTooltipData = {
  title: '掌握度区间展示',
  rules: [
    { category: '字段规则', content: '每个区间标题栏展示掌握度范围，格式【X% ── Y%】' },
    { category: '字段规则', content: '区间标题处展示该区间题量汇总，格式【共 X 题】' },
    { category: '字段规则', content: '区间标题栏左侧带绿色竖条装饰' },
    { category: '显示规则', content: '题目来源已配置时以标签形式展示' },
    { category: '显示规则', content: '题目来源为空时展示【未配置】' },
    { category: '显示规则', content: '题目来源为空不影响查看态展示' },
    { category: '显示规则', content: '知识点复合度展示【单一知识点】或【非单一知识点】' },
  ],
};

// ==================== 表头列 ====================

export const questionTypeField: PrdTooltipData = {
  title: '题型列',
  rules: [
    { category: '字段规则', content: '查看态下题型以纯文本展示' },
    { category: '显示规则', content: '题型名称根据乐课网当前学段学科下的题型数据展示' },
  ],
};

export const questionCountField: PrdTooltipData = {
  title: '题量列',
  rules: [
    { category: '字段规则', content: '查看态下题量以纯文本展示' },
    { category: '显示规则', content: '题量展示正整数' },
  ],
};

export const difficultyField: PrdTooltipData = {
  title: '难度分布列',
  rules: [
    { category: '字段规则', content: '查看态下难度分布以纯文本展示' },
    { category: '显示规则', content: '展示实际编辑时设置的结果' },
    { category: '显示规则', content: '难度档位为0时也按0展示' },
  ],
};

export const questionSourceField: PrdTooltipData = {
  title: '题目来源列',
  rules: [
    { category: '字段规则', content: '查看态下题目来源以蓝色标签形式展示' },
    { category: '显示规则', content: '题目来源为非必填项，未配置时展示【未配置】' },
  ],
};

export const complexityField: PrdTooltipData = {
  title: '知识点复合度列',
  rules: [
    { category: '字段规则', content: '查看态下知识点复合度以纯文本展示' },
    { category: '显示规则', content: '展示【单一知识点】或【非单一知识点】' },
  ],
};

// ==================== 无掌握度区间 ====================

export const emptyConfigState: PrdTooltipData = {
  title: '无掌握度区间',
  rules: [
    { category: '显示规则', content: '当策略无任何掌握度区间时，题目组成配置区展示空状态，文案【暂无掌握度区间配置】' },
    { category: '显示规则', content: '空状态下不展示表格' },
    { category: '显示规则', content: '空状态下仍展示底部【编辑】按钮' },
    { category: '交互规则', content: '用户可点击【编辑】进入2.6编辑个性化策略页面后重新添加区间' },
  ],
};

// ==================== 编辑按钮 ====================

export const editAction: PrdTooltipData = {
  title: '编辑按钮',
  rules: [
    { category: '字段规则', content: '按钮文案【编辑】，带Edit3图标，emerald色' },
    { category: '显示规则', content: '所有策略状态下均展示【编辑】按钮' },
    { category: '显示规则', content: '按钮位于底部右侧' },
    { category: '交互规则', content: '点击后进入2.6编辑个性化策略页面' },
    { category: '数据规则', content: '若存在待发布配置，编辑态加载最新待发布配置' },
    { category: '数据规则', content: '若不存在待发布配置，编辑态加载当前已发布配置' },
  ],
};

// ==================== 删除按钮 ====================

export const deleteStrategy: PrdTooltipData = {
  title: '删除按钮',
  rules: [
    { category: '字段规则', content: '按钮文案【删除】，带Trash2图标，红色' },
    { category: '显示规则', content: '所有策略状态下均展示【删除】按钮' },
    { category: '显示规则', content: '按钮位于底部左侧' },
    { category: '交互规则', content: '点击后弹出删除确认弹窗' },
    { category: '交互规则', content: '弹窗标题【删除确认】' },
    { category: '交互规则', content: '弹窗内容格式：确认删除【学段学科-策略名称】的单知识点出题策略吗？示例：确认删除【高中数学-强化训练策略】的单知识点出题策略吗？' },
    { category: '交互规则', content: '弹窗展示下游影响警告：删除后，下游业务（自适应学习系统）将无法获取到出题策略，请做好其他相应的处理措施' },
    { category: '交互规则', content: '弹窗按钮：【取消】【确认删除】' },
    { category: '交互规则', content: '点击弹窗【取消】→ 关闭弹窗，停留在当前页面' },
    { category: '交互规则', content: '点击弹窗【确认删除】→ 删除整个策略，已发布版本和待发布变更一并删除，删除不可恢复' },
    { category: '交互规则', content: '删除成功后返回单知识点出题首页，列表中不再展示该策略' },
    { category: '交互规则', content: '返回首页后展示删除成功提示' },
    { category: '数据规则', content: '删除后下游业务立即无法获取该个性化策略' },
  ],
};

// ==================== 发布操作 ====================

export const publishEntry: PrdTooltipData = {
  title: '发布操作',
  rules: [
    { category: '显示规则', content: '仅待发布状态展示【发布】按钮' },
    { category: '显示规则', content: '已发布状态不展示【发布】按钮' },
    { category: '显示规则', content: '定时发布状态不展示【发布】按钮，仅展示【取消定时】按钮' },
    { category: '交互规则', content: '点击【发布】→ 打开2.9个性化策略发布确认弹窗' },
  ],
};

// ==================== 策略不存在 ====================

export const strategyNotFound: PrdTooltipData = {
  title: '策略不存在',
  rules: [
    { category: '显示规则', content: 'URL中策略ID不存在时，页面展示【策略不存在】和【返回首页】按钮' },
    { category: '交互规则', content: '点击【返回首页】后回到首页' },
    { category: '交互规则', content: '查看过程中策略被他人删除时，页面保持当前数据展示不变，不提前展示删除提示' },
    { category: '交互规则', content: '用户执行编辑、发布、删除、取消定时操作时，提示【该策略不存在或已被删除】，并提供返回首页入口' },
    { category: '数据规则', content: '历史发布记录为只读入口，不纳入被删除操作拦截范围' },
  ],
};

// ==================== 页面加载 ====================

export const pageLoading: PrdTooltipData = {
  title: '页面加载',
  rules: [
    { category: '显示规则', content: '进入详情页时展示加载态，待策略详情加载完成后展示内容' },
    { category: '数据规则', content: '详情数据加载失败视为异常缺陷处理，不在页面中展示空壳详情页' },
  ],
};
