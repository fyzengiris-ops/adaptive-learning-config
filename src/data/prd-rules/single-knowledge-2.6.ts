/**
 * 单知识点出题 2.6 详情页-编辑个性化策略详情
 * 覆盖范围：页面头部、基础信息区（学段只读+学科只读+策略名称可编辑）、题目组成配置区、底部操作区、删除区间弹窗、保存相关、进入编辑态
 * 与2.1编辑通用的核心差异：有策略名称字段（可编辑）、保存校验含策略名称、仅修改策略名称不进待发布、待发布提示条文案不同、删除下游文案不同
 * 与2.5新增个性化的核心差异：学段学科只读、按钮为取消编辑/完成编辑、有版本号和历史记录入口、离开确认弹窗不同、未修改时直接切回查看态
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 页面头部 ====================

export const pageHeader: PrdTooltipData = {
  title: '页面头部',
  rules: [
    { category: '字段规则', content: '页面标题【个性化策略详情】' },
    { category: '字段规则', content: '展示当前已发布版本号' },
    { category: '字段规则', content: '编辑态展示历史发布记录入口按钮' },
    { category: '交互规则', content: '点击【返回】→ 若无未保存内容，直接返回上一页；若有未保存内容，弹出离开确认弹窗' },
    { category: '交互规则', content: '离开确认弹窗文案【当前内容未保存，是否确认离开？】' },
    { category: '交互规则', content: '离开确认弹窗按钮：【继续编辑】【确认离开】' },
    { category: '交互规则', content: '点击弹窗【继续编辑】→ 关闭弹窗，停留在当前页面' },
    { category: '交互规则', content: '点击弹窗【确认离开】→ 不保存当前编辑内容，返回上一页' },
  ],
};

// ==================== 基础信息区 ====================

export const basicInfoSection: PrdTooltipData = {
  title: '基础信息区',
  rules: [
    { category: '字段规则', content: '区域标题【基础信息】' },
    { category: '显示规则', content: '编辑态下学段和学科以纯文本展示，不可修改' },
    { category: '显示规则', content: '编辑已有个性化策略时，不允许修改学段和学科' },
    { category: '显示规则', content: '编辑态下策略名称输入框可编辑' },
  ],
};

// ==================== 策略名称字段 ====================

export const strategyNameField: PrdTooltipData = {
  title: '策略名称',
  rules: [
    { category: '字段规则', content: '策略名称为必填项' },
    { category: '字段规则', content: '编辑态下策略名称输入框可编辑' },
    { category: '字段规则', content: '输入框最多支持50个字符，超过50个字符时，不允许继续输入' },
    { category: '字段规则', content: '中英文、数字、常见符号均允许输入' },
    { category: '字段规则', content: '字符数按字符计算，中英文、数字、符号均按1个字符计' },
    { category: '字段规则', content: '展示当前已输入字符数 / 50，格式示例：5/50' },
    { category: '数据规则', content: '同一学段+学科下，策略名称不允许重复' },
    { category: '校验规则', content: '输入内容校验时去除首尾空格' },
    { category: '校验规则', content: '仅输入空格视为未填写' },
    { category: '校验规则', content: '未填写或仅输入空格时，提示【请输入策略名称】' },
    { category: '校验规则', content: '同一学段+学科下策略名称重复时，提示【该策略名称已存在】' },
  ],
};

// ==================== 学段字段 ====================

export const phaseField: PrdTooltipData = {
  title: '学段',
  rules: [
    { category: '显示规则', content: '编辑态下学段以纯文本展示，不可修改' },
    { category: '显示规则', content: '编辑已有个性化策略时，学段字段为只读' },
  ],
};

// ==================== 学科字段 ====================

export const subjectField: PrdTooltipData = {
  title: '学科',
  rules: [
    { category: '显示规则', content: '编辑态下学科以纯文本展示，不可修改' },
    { category: '显示规则', content: '编辑已有个性化策略时，学科字段为只读' },
  ],
};

// ==================== 题目组成配置区 ====================

export const configSection: PrdTooltipData = {
  title: '题目组成配置区',
  rules: [
    { category: '字段规则', content: '区域标题【题目组成配置】' },
    { category: '显示规则', content: '编辑态下题目组成配置进入可编辑状态' },
  ],
};

// ==================== 掌握度区间 ====================

export const masteryRange: PrdTooltipData = {
  title: '掌握度区间',
  rules: [
    { category: '字段规则', content: '区间标题展示【掌握度区间】，不展示区间序号' },
    { category: '字段规则', content: '区间取值说明：除最后一段为左闭右闭外，其余均为左闭右开' },
    { category: '交互规则', content: '编辑过程中，区间按当前展示顺序保留，不因修改区间值而自动重排' },
    { category: '显示规则', content: '保存成功后，查看态区间按掌握度起始值从小到大展示' },
  ],
};

// ==================== 添加区间 ====================

export const addRange: PrdTooltipData = {
  title: '添加区间',
  rules: [
    { category: '交互规则', content: '点击【+ 添加区间】后新增一个掌握度区间' },
    { category: '字段规则', content: '若当前已有区间，新区间默认起始值取上一个区间的结束值' },
    { category: '字段规则', content: '新区间默认结束值为空，需用户手动填写' },
    { category: '校验规则', content: '若上一个区间结束值已为100，提示用户先调整已有区间，不自动新增' },
    { category: '交互规则', content: '新增区间后，页面定位到新增区间位置' },
    { category: '数据规则', content: '用户每次点添加区间后，都默认显示一行题型，默认显示的这一行题型，题量默认显示为1，难度默认显示为易1，其他难度默认显示为0' },
  ],
};

// ==================== 删除区间 ====================

export const deleteRange: PrdTooltipData = {
  title: '删除区间',
  rules: [
    { category: '交互规则', content: '点击【删除区间】后，显示确认弹窗' },
    { category: '显示规则', content: '删除区间时，该区间下的题目配置一并删除' },
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

// ==================== 无区间空状态 ====================

export const emptyRange: PrdTooltipData = {
  title: '无区间空状态',
  rules: [
    { category: '显示规则', content: '所有掌握度区间均被删除后，展示空状态文案【暂无掌握度区间】' },
    { category: '显示规则', content: '空状态下继续展示【+ 添加区间】入口' },
  ],
};

// ==================== 掌握度区间校验 ====================

export const masteryRangeValidation: PrdTooltipData = {
  title: '掌握度区间校验',
  rules: [
    { category: '字段规则', content: '起始值和结束值均为0-100的整数' },
    { category: '字段规则', content: '起始值允许等于结束值' },
    { category: '校验规则', content: '起始值不能大于结束值，否则提示【掌握度区间起始值不能大于结束值】' },
    { category: '字段规则', content: '区间之间允许存在空隙' },
    { category: '校验规则', content: '区间之间不允许重叠，否则提示【掌握度区间不能重叠】' },
    { category: '字段规则', content: '区间边界相接不视为重叠（如0%-40%、40%-70%允许保存）' },
    { category: '校验规则', content: '区间值为空时，提示【请输入掌握度区间】' },
    { category: '校验规则', content: '已添加的掌握度区间下无题目配置时，提示【已添加的掌握度区间，请至少添加一条题目配置规则】' },
    { category: '字段规则', content: '允许只保留一个掌握度区间' },
    { category: '字段规则', content: '允许删除所有掌握度区间' },
    { category: '字段规则', content: '删除所有掌握度区间后，允许保存为空区间配置' },
  ],
};

// ==================== 添加题型 ====================

export const addQuestionType: PrdTooltipData = {
  title: '添加题型',
  rules: [
    { category: '交互规则', content: '点击区间内【+ 添加题型】后，新增一条题目配置' },
    { category: '字段规则', content: '同一区间内允许重复添加相同题型' },
    { category: '字段规则', content: '题目配置行数量不限制' },
    { category: '字段规则', content: '新增题目配置后，用户需填写题量、难度分布、题目来源等信息' },
  ],
};

// ==================== 删除题目配置 ====================

export const deleteQuestionRow: PrdTooltipData = {
  title: '删除题目配置',
  rules: [
    { category: '交互规则', content: '点击题目配置行删除入口后，直接删除该行' },
    { category: '交互规则', content: '删除题目配置行不弹出确认提示' },
  ],
};

// ==================== 题型字段 ====================

export const questionTypeField: PrdTooltipData = {
  title: '题型',
  rules: [
    { category: '字段规则', content: '下拉选项根据乐课网当前学段学科下有的题型进行显示' },
    { category: '字段规则', content: '题型为必填项' },
    { category: '字段规则', content: '默认选中第一个题型' },
  ],
};

// ==================== 题量字段 ====================

export const questionCountField: PrdTooltipData = {
  title: '题量',
  rules: [
    { category: '字段规则', content: '题量为必填项' },
    { category: '字段规则', content: '仅允许输入正整数' },
    { category: '字段规则', content: '不允许输入0、负数、小数和非数字字符' },
    { category: '校验规则', content: '题量为0时，提示【题目数量不能为0】' },
  ],
};

// ==================== 题目难度分布 ====================

export const difficultyField: PrdTooltipData = {
  title: '题目难度分布',
  rules: [
    { category: '字段规则', content: '难度项按UI稿展示为：易、较易、中、较难、难' },
    { category: '字段规则', content: '每个难度项输入非负整数' },
    { category: '校验规则', content: '各难度数量之和必须等于该行题量，否则提示【难度分布数量之和必须等于对应题型的题目总数】' },
  ],
};

// ==================== 题目来源 ====================

export const questionSourceField: PrdTooltipData = {
  title: '题目来源',
  rules: [
    { category: '字段规则', content: '题目来源为非必填项' },
    { category: '字段规则', content: '字段类型为多选' },
    { category: '字段规则', content: '选项根据乐课网不同学段支持的题目来源进行展示' },
    { category: '校验规则', content: '保存校验：无（题目来源为非必填项）' },
  ],
};

// ==================== 知识点复合度 ====================

export const complexityField: PrdTooltipData = {
  title: '知识点复合度',
  rules: [
    { category: '字段规则', content: '选项：单一知识点、非单一知识点' },
    { category: '字段规则', content: '知识点复合度为必填项' },
    { category: '字段规则', content: '默认选中【单一知识点】' },
  ],
};

// ==================== 完成编辑 ====================

export const saveAction: PrdTooltipData = {
  title: '完成编辑',
  rules: [
    { category: '字段规则', content: '编辑态底部按钮文案【完成编辑】' },
    { category: '交互规则', content: '未做修改时点击【完成编辑】→ 直接切回查看模式，不触发保存，不展示待发布提示条' },
    { category: '交互规则', content: '有修改时点击【完成编辑】→ 执行保存校验' },
    { category: '校验规则', content: '保存校验顺序：1.策略名称 → 2.掌握度区间 → 3.题目配置' },
    { category: '校验规则', content: '校验不通过时：停止保存，页面定位到首个错误位置，对应字段展示错误提示' },
    { category: '交互规则', content: '保存中：【完成编辑】按钮展示加载状态，不允许重复点击，页面字段不可编辑' },
    { category: '交互规则', content: '仅修改策略名称保存后：不进入待发布状态，不展示待发布提示条，直接切回查看模式' },
    { category: '交互规则', content: '修改配置（含同时修改策略名称和配置）保存后：留在当前详情页，页面切换为查看模式，顶部展示待发布提示条，待发布提示条文案【该策略有变更，需要发布后才能生效】' },
    { category: '字段规则', content: '编辑保存后版本号不递增，仅正式发布时生成新版本号' },
    { category: '交互规则', content: '保存失败后：保留用户当前编辑内容，页面保持编辑态，恢复可编辑，【完成编辑】按钮恢复可点击，展示保存失败提示' },
  ],
};

// ==================== 取消编辑 ====================

export const cancelAction: PrdTooltipData = {
  title: '取消编辑',
  rules: [
    { category: '字段规则', content: '编辑态底部按钮文案【取消编辑】' },
    { category: '交互规则', content: '点击【取消编辑】→ 若页面没有未保存内容，则直接将该页面退回为查看态' },
    { category: '交互规则', content: '点击【取消编辑】→ 若页面存在未保存内容，弹出离开确认弹窗' },
    { category: '字段规则', content: '离开确认弹窗文案【编辑内容还未保存，确认取消编辑吗？】' },
    { category: '字段规则', content: '离开确认弹窗按钮：【取消】【确认】' },
    { category: '交互规则', content: '点击弹窗【取消】→ 仅隐藏弹窗，页面停留在当前编辑页面' },
    { category: '交互规则', content: '点击弹窗【确认】→ 不保存用户编辑的内容，将该页面退回为查看态' },
  ],
};

// ==================== 历史发布记录入口 ====================

export const historyEntry: PrdTooltipData = {
  title: '历史发布记录入口',
  rules: [
    { category: '显示规则', content: '编辑态展示历史发布记录入口按钮' },
    { category: '交互规则', content: '编辑态点击历史记录入口，可直接打开历史发布记录弹窗，不提示未保存内容' },
    { category: '交互规则', content: '关闭历史记录弹窗后，当前编辑内容仍保留' },
  ],
};

// ==================== 进入编辑态 ====================

export const enterEditMode: PrdTooltipData = {
  title: '进入编辑态',
  rules: [
    { category: '交互规则', content: '查看态点击【编辑】后进入编辑态' },
    { category: '显示规则', content: '学段和学科保持只读' },
    { category: '显示规则', content: '策略名称进入可编辑状态' },
    { category: '显示规则', content: '题目组成配置进入可编辑状态' },
    { category: '数据规则', content: '页面加载当前策略最新保存数据' },
    { category: '数据规则', content: '若存在待发布配置，进入编辑态时加载最新待发布配置' },
    { category: '数据规则', content: '若不存在待发布配置，进入编辑态时加载当前已发布配置' },
    { category: '交互规则', content: '若策略处于定时发布状态，进入编辑态后系统自动取消原定时发布，不额外弹窗提示' },
    { category: '显示规则', content: '取消定时发布后，编辑态不展示定时发布提示条，保存后需重新发布' },
  ],
};

// ==================== 并发编辑 ====================

export const concurrentEdit: PrdTooltipData = {
  title: '并发编辑',
  rules: [
    { category: '校验规则', content: '多个用户同时编辑同一策略，保存时校验当前策略是否已被其他用户修改' },
    { category: '校验规则', content: '若保存时发现策略已被其他用户修改，提示【该策略已被其他人修改，请刷新后重新编辑】' },
    { category: '交互规则', content: '用户需刷新页面获取最新数据后再编辑' },
  ],
};
