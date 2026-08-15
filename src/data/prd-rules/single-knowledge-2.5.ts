/**
 * 单知识点出题 2.5 详情页-新增个性化策略
 * 覆盖范围：页面头部、基础信息区、题目组成配置区（掌握度区间+题目配置）、底部操作区、删除区间弹窗、保存相关
 * 与2.0核心差异：有策略名称字段、学科不做唯一性限制（不置灰）、学段学科保存时不单独校验、保存校验顺序不同、待发布提示条文案不同
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 页面头部 ====================

export const pageHeader: PrdTooltipData = {
  title: '页面头部',
  rules: [
    { category: '字段规则', content: '新增态页面标题固定文案【新增个性化策略】' },
    { category: '字段规则', content: '新增态不展示版本号' },
    { category: '字段规则', content: '新增态不展示历史记录入口（History图标）' },
    { category: '显示规则', content: '页面头部左侧显示【返回】按钮（带ArrowLeft图标）' },
    { category: '交互规则', content: '点击【返回】→ 若页面无未保存内容，直接返回首页；若有未保存内容，弹出离开确认弹窗' },
    { category: '交互规则', content: '离开确认弹窗文案【新增内容还未保存，确认取消吗？】' },
    { category: '交互规则', content: '离开确认弹窗按钮：【取消】【确认】' },
    { category: '交互规则', content: '点击【取消】→ 隐藏弹窗，停留在当前页面' },
    { category: '交互规则', content: '点击【确认】→ 不保存新增的内容，直接返回至首页' },
  ],
};

// ==================== 基础信息区 ====================

export const basicInfoSection: PrdTooltipData = {
  title: '基础信息区',
  rules: [
    { category: '字段规则', content: '区域标题固定文案【基础信息】，左侧带绿色竖条装饰' },
    { category: '显示规则', content: '新增态下学段和学科均为下拉选择' },
    { category: '显示规则', content: '学段和学科保存时不单独校验为空' },
    { category: '显示规则', content: '新增态下显示策略名称输入框' },
  ],
};

// ==================== 学段字段 ====================

export const phaseField: PrdTooltipData = {
  title: '学段字段',
  rules: [
    { category: '字段规则', content: '下拉选项包含【高中】【初中】【小学】' },
    { category: '显示规则', content: '从首页进入新增页时，默认带入首页当前选中的学段' },
    { category: '交互规则', content: '切换学段后，学科选项同步变化' },
    { category: '交互规则', content: '切换学段后，若当前已选学科在新学段下不可用，则自动清空学科' },
    { category: '校验规则', content: '保存时不单独校验学段为空场景' },
  ],
};

// ==================== 学科字段 ====================

export const subjectField: PrdTooltipData = {
  title: '学科字段',
  rules: [
    { category: '字段规则', content: '学科选项跟随当前学段变化：各学段下具体展示哪些学科，根据乐课网当前学段下已有的学科数据进行展示' },
    { category: '显示规则', content: '个性化策略不做学科唯一性限制' },
    { category: '显示规则', content: '当前学段支持的学科均可选择，不因已有个性化策略而置灰' },
    { category: '校验规则', content: '保存时不单独校验学科为空场景' },
  ],
};

// ==================== 策略名称字段 ====================

export const strategyNameField: PrdTooltipData = {
  title: '策略名称',
  rules: [
    { category: '字段规则', content: '策略名称为必填项' },
    { category: '字段规则', content: '字段类型为文本输入框，占位文案【请输入策略名称】' },
    { category: '字段规则', content: '输入框最多支持50个字符，超过50个字符时，不允许继续输入' },
    { category: '字段规则', content: '中英文、数字、常见符号均允许输入' },
    { category: '字段规则', content: '字符数按字符计算，中英文、数字、符号均按1个字符计' },
    { category: '字段规则', content: '展示当前已输入字符数 / 50，格式示例：0/50' },
    { category: '数据规则', content: '同一学段+学科下，策略名称不允许重复' },
    { category: '校验规则', content: '输入内容校验时去除首尾空格' },
    { category: '校验规则', content: '仅输入空格视为未填写' },
    { category: '校验规则', content: '未填写或仅输入空格时，提示【请输入策略名称】' },
    { category: '校验规则', content: '同一学段+学科下策略名称重复时，提示【该策略名称已存在】' },
  ],
};

// ==================== 题目组成配置区 ====================

export const configSection: PrdTooltipData = {
  title: '题目组成配置区',
  rules: [
    { category: '字段规则', content: '区域标题固定文案【题目组成配置】，左侧带绿色竖条装饰' },
    { category: '显示规则', content: '新增页默认不添加掌握度区间，用户需手动点击【+ 添加区间】新增' },
    { category: '显示规则', content: '编辑过程中区间按用户创建顺序展示' },
    { category: '显示规则', content: '保存成功后区间按起始值从小到大展示' },
  ],
};

// ==================== 添加区间 ====================

export const addRange: PrdTooltipData = {
  title: '添加区间',
  rules: [
    { category: '字段规则', content: '按钮文案【+ 添加区间】，emerald色' },
    { category: '显示规则', content: '按钮位于题目组成配置区底部，所有区间下方' },
    { category: '显示规则', content: '仅在编辑态（非查看模式）下展示' },
    { category: '交互规则', content: '点击后新增一条掌握度区间，默认起始值取上一个区间的结束值，默认结束值为空' },
    { category: '交互规则', content: '若上一个区间结束值已为100，则提示用户先调整已有区间' },
    { category: '数据规则', content: '系统不自动修改用户已配置的区间值' },
    { category: '数据规则', content: '用户每次点添加区间后，都默认显示一行题型，默认显示的这一行题型，题量默认显示为1，难度默认显示为易1，其他难度默认显示为0' },
  ],
};

// ==================== 掌握度区间 ====================

export const masteryRange: PrdTooltipData = {
  title: '掌握度区间',
  rules: [
    { category: '字段规则', content: '区间由起始值和结束值组成，单位为百分比（%）' },
    { category: '字段规则', content: '区间标题处展示该区间题量汇总，格式【共 X 题】' },
    { category: '字段规则', content: '区间标题栏左侧带绿色竖条装饰' },
    { category: '字段规则', content: '每个区间标题栏下方显示取值说明【区间取值说明：除最后一段为左闭右闭外，其余均为左闭右开】' },
    { category: '校验规则', content: '起始值和结束值均为0-100的整数' },
    { category: '校验规则', content: '起始值不能大于结束值，否则提示【掌握度区间起始值不能大于结束值】' },
    { category: '校验规则', content: '区间之间不允许重叠，否则提示【掌握度区间不能重叠】' },
    { category: '校验规则', content: '区间边界相接不视为重叠，例如0%-40%、40%-70%允许保存' },
    { category: '校验规则', content: '区间值为空时提示【请输入掌握度区间】' },
    { category: '校验规则', content: '允许只配置一个掌握度区间' },
    { category: '校验规则', content: '允许起始值和结束值相等' },
    { category: '校验规则', content: '允许区间之间存在空隙' },
  ],
};

// ==================== 删除区间 ====================

export const deleteRange: PrdTooltipData = {
  title: '删除区间',
  rules: [
    { category: '字段规则', content: '删除按钮文案【删除区间】，带Trash2图标，灰色hover变红色' },
    { category: '显示规则', content: '仅在编辑态下显示，位于区间标题栏右侧' },
    { category: '交互规则', content: '点击【删除区间】后，显示确认弹窗' },
    { category: '交互规则', content: '删除区间时，该区间下的题目配置一并删除' },
    { category: '显示规则', content: '当页面只剩一个区间时，隐藏删除区间按钮（即每个策略至少需要有一条策略信息）' },
  ],
};

// ==================== 删除区间确认弹窗 ====================

export const deleteRangeModal: PrdTooltipData = {
  title: '删除区间确认弹窗',
  rules: [
    { category: '字段规则', content: '弹窗标题【删除确认】' },
    { category: '字段规则', content: '弹窗文案【确认删除该区间的出题策略吗？】' },
    { category: '字段规则', content: '弹窗按钮：【取消】【确认删除】' },
    { category: '交互规则', content: '点击【取消】→ 仅隐藏弹窗，不删除区间' },
    { category: '交互规则', content: '点击【确认删除】→ 将被操作的区间删除，关闭弹窗' },
  ],
};

// ==================== 添加题型 ====================

export const addQuestionType: PrdTooltipData = {
  title: '添加题型',
  rules: [
    { category: '字段规则', content: '按钮文案【+ 添加题型】，emerald色' },
    { category: '显示规则', content: '按钮位于每个区间底部（灰色背景区域），仅在编辑态下展示' },
    { category: '交互规则', content: '点击后在该区间内新增一条题目配置行' },
    { category: '数据规则', content: '同一区间内允许重复添加相同题型' },
    { category: '数据规则', content: '题目配置行数量不限制' },
    { category: '数据规则', content: '新增题目配置后，用户需补充题型、题量、难度分布、题目来源和知识点复合度' },
  ],
};

// ==================== 删除题目配置 ====================

export const deleteQuestionRow: PrdTooltipData = {
  title: '删除题目配置行',
  rules: [
    { category: '字段规则', content: '删除图标为Trash2，灰色hover变红色' },
    { category: '显示规则', content: '仅在编辑态下，表格最后一列【操作】列中展示' },
    { category: '显示规则', content: '区间内仅剩一条题目配置行时，该行不显示删除按钮' },
    { category: '交互规则', content: '点击后直接删除该行，不需要二次确认' },
  ],
};

// ==================== 题型字段 ====================

export const questionTypeField: PrdTooltipData = {
  title: '题型',
  rules: [
    { category: '字段规则', content: '下拉选项根据乐课网当前学段学科下有的题型进行显示' },
    { category: '字段规则', content: '题型为必填项' },
    { category: '显示规则', content: '新增题目配置默认选中第一个题型' },
  ],
};

// ==================== 题量字段 ====================

export const questionCountField: PrdTooltipData = {
  title: '题量',
  rules: [
    { category: '字段规则', content: '题量为必填项' },
    { category: '字段规则', content: '仅允许输入正整数' },
    { category: '校验规则', content: '不允许输入0，题量为0时提示【题目数量不能为0】' },
    { category: '校验规则', content: '不允许输入负数、小数和非数字字符' },
  ],
};

// ==================== 题目难度分布 ====================

export const difficultyField: PrdTooltipData = {
  title: '题目难度分布',
  rules: [
    { category: '字段规则', content: '表头按顺序展示五个难度项：【易】【较易】【中档】【较难】【难】' },
    { category: '字段规则', content: '每个难度项输入非负整数' },
    { category: '校验规则', content: '各难度数量之和必须等于该行题量' },
    { category: '校验规则', content: '保存时若不一致，提示【难度分布数量之和必须等于对应题型的题目总数】' },
    { category: '校验规则', content: '编辑时实时校验，难度分布之和与题量不一致时在输入框下方显示红色提示' },
  ],
};

// ==================== 题目来源 ====================

export const questionSourceField: PrdTooltipData = {
  title: '题目来源',
  rules: [
    { category: '字段规则', content: '题目来源为非必填项' },
    { category: '字段规则', content: '字段类型为多选' },
    { category: '字段规则', content: '题目来源根据不同学段展示对应可用来源' },
    { category: '显示规则', content: '已选来源以蓝色标签形式展示在输入框内，每个标签带×可单独移除' },
    { category: '校验规则', content: '题目来源无保存校验（非必填项）' },
  ],
};

// ==================== 知识点复合度 ====================

export const complexityField: PrdTooltipData = {
  title: '知识点复合度',
  rules: [
    { category: '字段规则', content: '下拉选项包含【单一知识点】【非单一知识点】' },
    { category: '字段规则', content: '知识点复合度为必填项' },
    { category: '显示规则', content: '默认选中【单一知识点】' },
    { category: '字段规则', content: '正常情况下不存在为空场景' },
  ],
};

// ==================== 保存逻辑 ====================

export const saveAction: PrdTooltipData = {
  title: '保存',
  rules: [
    { category: '字段规则', content: '新增态底部展示操作按钮：【取消】【保存】' },
    { category: '字段规则', content: '新增态顶部不展示保存和取消按钮' },
    { category: '校验规则', content: '保存校验顺序：1.策略名称 → 2.掌握度区间（是否为空、起始值>结束值、重叠）→ 3.题目配置（是否存在配置、题量、难度分布、知识点复合度）' },
    { category: '校验规则', content: '已添加的掌握度区间下无题目配置时，提示【已添加的掌握度区间，请至少添加一条题目配置规则】' },
    { category: '校验规则', content: '校验不通过时停止保存，页面定位到首个错误位置，对应字段展示错误提示' },
    { category: '交互规则', content: '保存中按钮展示加载状态，不可重复点击' },
    { category: '交互规则', content: '保存中页面字段不可编辑，不可增删区间和题目配置' },
    { category: '交互规则', content: '保存成功后留在当前详情页，页面切换为查看模式' },
    { category: '交互规则', content: '保存成功后顶部显示待发布提示条，文案【新增策略，需要发布后才能生效】，含【发布】按钮' },
    { category: '交互规则', content: '保存失败后保留用户当前填写内容，页面恢复可编辑状态，展示失败提示' },
  ],
};

// ==================== 取消逻辑 ====================

export const cancelAction: PrdTooltipData = {
  title: '取消',
  rules: [
    { category: '字段规则', content: '新增态按钮文案【取消】' },
    { category: '交互规则', content: '点击【取消】→ 若页面没有未保存的内容，点击直接返回至单知识点出题的一级页面；若页面有未保存内容，则弹出确认弹窗' },
    { category: '交互规则', content: '弹窗文案【新增内容还未保存，确认取消吗？】' },
    { category: '交互规则', content: '弹窗按钮：【取消】【确认】' },
    { category: '交互规则', content: '点击弹窗【取消】→ 仅隐藏弹窗，页面停留在当前新增页面' },
    { category: '交互规则', content: '点击弹窗【确认】→ 不保存用户新增的内容，页面返回至单知识点出题的一级页面' },
  ],
};

// ==================== 离开确认弹窗 ====================

export const leaveConfirmModal: PrdTooltipData = {
  title: '离开确认弹窗',
  rules: [
    { category: '交互规则', content: '以下行为触发检测：点击返回、点击取消、点击侧边栏菜单跳转、点击其他页面导航入口' },
    { category: '交互规则', content: '若存在未保存内容，均需弹出离开确认弹窗' },
  ],
};

// ==================== 待发布提示条 ====================

export const pendingPublishBar: PrdTooltipData = {
  title: '待发布提示条',
  rules: [
    { category: '字段规则', content: '提示文案【新增策略，需要发布后才能生效】' },
    { category: '字段规则', content: '右侧包含【发布】按钮' },
    { category: '显示规则', content: '仅保存成功后且当前为查看模式时展示' },
    { category: '显示规则', content: '该提示信息，在1.0期通用知识树、教材体系知识树新增策略的时候，也显示这个提示文案' },
    { category: '交互规则', content: '点击【发布】→ 弹出发布确认弹窗' },
  ],
};

// ==================== 历史记录关联说明 ====================

export const historyNote: PrdTooltipData = {
  title: '历史记录关联说明',
  rules: [
    { category: '数据规则', content: '个性化策略正式发布后，将生成历史发布记录' },
    { category: '数据规则', content: '历史发布记录中展示发布时的策略名称' },
    { category: '数据规则', content: '若策略后续改名，历史记录仍展示发布当时的策略名称' },
  ],
};
