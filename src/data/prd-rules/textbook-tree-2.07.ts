/**
 * 教材体系知识树 2.07 编辑态 - 同步课程 - 资源库选择弹窗
 * 覆盖范围：资源库选择弹窗的标题、可选视频区、搜索、视频卡片、已选视频区、操作按钮、预览弹窗
 * 去重原则：同一条规则只归入一个分类，不重复描述；与2.00/2.05/2.06重叠的卡片字段规则不重复，仅描述资源库选择弹窗增量
 * 前端状态：资源库选择弹窗已实现，左右双栏布局，左可选右已选，7个tooltip全部集成
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 弹窗标题 ====================

export const courseSelectorDialogTitle: PrdTooltipData = {
  title: '资源库选择弹窗',
  rules: [
    { category: '字段规则', content: '弹窗标题固定文案「从资源库选择」' },
    { category: '显示规则', content: '弹窗居中展示，带半透明遮罩层，尺寸800px × 70vh' },
    { category: '显示规则', content: '弹窗采用左右双栏布局：左侧可选视频、右侧已选视频' },
    { category: '交互规则', content: '点击X或「取消」关闭弹窗，清空临时选择和搜索关键词，不影响实际数据' },
    { category: '交互规则', content: '弹窗内所有操作均为临时状态，直到点击「确定」才写入实际数据' },
  ],
};

// ==================== 可选课程区 ====================

export const courseSelectorAvailableList: PrdTooltipData = {
  title: '可选视频-数据来源',
  rules: [
    { category: '数据规则', content: '引用乐课网全网的资源，需要注意是否能拉取到学校老师分享的视频资源，如果能拉取到，尽量拉取，配置后台保存的时候不改写视频资源在乐课网的微课属性' },
    { category: '显示规则', content: '过滤排除：已添加到当前章节的课程 + 已在待选列表右侧的课程，不在左侧可选列表中显示' },
    { category: '显示规则', content: '空状态：无可选视频时显示「暂无可选视频」' },
  ],
};

// ==================== 搜索框 ====================

export const courseSelectorSearch: PrdTooltipData = {
  title: '课程搜索',
  rules: [
    { category: '字段规则', content: '搜索框占位文案「搜索视频...」' },
    { category: '交互规则', content: '输入关键词实时过滤视频列表，按课程名称匹配，不区分大小写' },
    { category: '显示规则', content: '无搜索关键词时显示所有可选视频' },
    { category: '显示规则', content: '有搜索关键词但无匹配结果时显示空状态提示' },
  ],
};

// ==================== 左侧课程卡片 ====================

export const courseSelectorAvailableCard: PrdTooltipData = {
  title: '可选视频卡片',
  rules: [
    { category: '字段规则', content: '课程卡片字段：视频图标 + 课程名称（超长截断，tooltip显示全名）+ 时长 + 教师信息' },
    { category: '显示规则', content: '课程卡片左侧显示视频图标（蓝色圆角背景），右侧显示名称和信息' },
    { category: '显示规则', content: '悬停时显示预览按钮（Play图标）' },
    { category: '交互规则', content: '点击「添加」→ 课程移入右侧已选列表，左侧不再显示该课程' },
    { category: '交互规则', content: '点击预览按钮→ 用乐课网原本预览视频的组件，新开页预览视频' },
  ],
};

// ==================== 已选视频区 ====================

export const courseSelectorSelectedList: PrdTooltipData = {
  title: '已选视频',
  rules: [
    { category: '字段规则', content: '标题文案「已选视频(N个)」，N为已选数量' },
    { category: '显示规则', content: '支持一次选择多个视频，无数量上限' },
    { category: '显示规则', content: '空状态：未选择视频时显示「请从左侧选择视频」' },
    { category: '交互规则', content: '点击X移除按钮→ 视频移回左侧可选列表' },
    { category: '交互规则', content: '点击预览按钮→ 用乐课网原本预览视频的组件，新开页预览视频' },
    { category: '交互规则', content: '所有选择操作为临时状态，点击「确定」后才写入当前节点课程列表' },
    { category: '数据规则', content: '确认后课程来源标签为【资源库】绿色标签' },
  ],
};

// ==================== 操作按钮 ====================

export const courseSelectorActions: PrdTooltipData = {
  title: '资源库选择-操作',
  rules: [
    { category: '字段规则', content: '「取消」按钮：灰色描边按钮；「确定」按钮：蓝色实心按钮' },
    { category: '显示规则', content: '操作按钮位于弹窗底部，右侧对齐，「取消」在左，「确定」在右' },
    { category: '交互规则', content: '点击「取消」→ 关闭弹窗，清空所有临时选择，无修改' },
    { category: '交互规则', content: '点击「确定」→ 将选中视频添加到当前节点的同步课程列表，记录改动日志，关闭弹窗' },
    { category: '交互规则', content: '未选视频时「确定」按钮不可点击' },
  ],
};

// ==================== 预览弹窗 ====================

export const courseSelectorPreview: PrdTooltipData = {
  title: '课程预览',
  rules: [
    { category: '显示规则', content: '预览弹窗层级高于选择弹窗（z-index更高）' },
    { category: '显示规则', content: '弹窗尺寸700px × 90vh' },
    { category: '字段规则', content: '顶部标题栏：课程名称 + X关闭按钮' },
    { category: '字段规则', content: '中间区域：视频预览播放区域（黑色背景）' },
    { category: '字段规则', content: '底部信息栏：时长（Clock图标）+ 关闭按钮' },
    { category: '交互规则', content: '点击关闭按钮→ 关闭预览弹窗，回到选择弹窗' },
  ],
};
