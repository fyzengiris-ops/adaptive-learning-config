/**
 * 教材体系知识树 2.09 编辑态 - 练习试卷 - 从资源库选择弹窗
 * 覆盖范围：弹窗标题、资源库可选区、搜索、已选区、确认、预览弹窗、来源标签
 * 说明：习题册相关功能已拆分到2.16（教材级视图的练习试卷Tab入口），本文件仅保留资源库试卷选择
 * 前端状态：试卷选择弹窗已实现，tooltip待集成
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 弹窗标题 ====================

export const examSelectorDialogTitle: PrdTooltipData = {
  title: '试卷选择弹窗',
  rules: [
    { category: '字段规则', content: '弹窗标题固定文案「从资源库选择」' },
    { category: '显示规则', content: '弹窗居中展示，带半透明遮罩层，尺寸1000px × 80vh' },
    { category: '显示规则', content: '弹窗采用左右双栏布局：左侧可选试卷、右侧已选试卷' },
    { category: '交互规则', content: '点击X或「取消」直接关闭弹窗，不弹出确认提示，清空临时选择和搜索关键词，不影响实际数据' },
    { category: '交互规则', content: '弹窗内所有操作均为临时状态，直到点击「确定」才写入实际数据' },
  ],
};

// ==================== 资源库可选区 ====================

export const examSelectorLibraryList: PrdTooltipData = {
  title: '资源库可选试卷',
  rules: [
    { category: '数据规则', content: '获取乐课网当前学段学科、教材版本、章节目录下，试卷类型为普通试卷的所有试卷数据，做为可选数据，不直接回显在配置后台页面' },
    { category: '数据规则', content: '备注原因：因为下游业务在显示题目的时候，每道题目的题干会显示题目的题型，而答题卡试卷是只显示一份试卷，无题型信息，后续如果需要支持的话，再迭代更新' },
    { category: '显示规则', content: '过滤排除：已添加到当前小节的试卷 + 已在弹窗右侧选中的试卷，不在左侧可选列表中显示' },
    { category: '显示规则', content: '空状态：无可选试卷时显示缺省图和提示文案「暂无数据」' },
  ],
};

// ==================== 试卷搜索 ====================

export const examSelectorExamSearch: PrdTooltipData = {
  title: '试卷搜索',
  rules: [
    { category: '字段规则', content: '搜索框占位文案「搜索试卷名称...」' },
    { category: '交互规则', content: '输入关键词实时过滤试卷列表，按试卷名称匹配，不区分大小写' },
    { category: '显示规则', content: '无搜索关键词时显示所有可选试卷' },
    { category: '显示规则', content: '有搜索关键词但无匹配结果时显示「未找到匹配的试卷」' },
  ],
};

// ==================== 已选试卷区 ====================

export const examSelectorSelectedList: PrdTooltipData = {
  title: '已选试卷',
  rules: [
    { category: '字段规则', content: '标题文案「已选试卷（N项）」，N为已选试卷数' },
    { category: '显示规则', content: '展示已选试卷：琥珀色卡片+绿色【资源库】标签' },
    { category: '显示规则', content: '支持一次选择多个试卷，无数量上限' },
    { category: '显示规则', content: '空状态：未选择试卷时显示缺省图和提示文案「暂未选择试卷」+「请从左侧列表中选择试卷」' },
    { category: '交互规则', content: '点击试卷的预览按钮→ 打开试卷预览弹窗' },
    { category: '交互规则', content: '点击X移除按钮→ 试卷移回左侧可选列表' },
    { category: '交互规则', content: '所有选择操作为临时状态，点击「确定」后才写入实际数据' },
    { category: '数据规则', content: '资源库试卷确认后来源标签为【资源库】绿色标签' },
  ],
};

// ==================== 确认操作 ====================

export const examSelectorConfirm: PrdTooltipData = {
  title: '确认操作规则',
  rules: [
    { category: '字段规则', content: '「取消」按钮：灰色描边按钮；「确定」按钮：绿色实心按钮' },
    { category: '交互规则', content: '点击「取消」→ 直接关闭弹窗，清空所有临时选择，不提示确认' },
    { category: '交互规则', content: '点击「确定」→ 将右侧临时已选的试卷关联到当前选中的末级小节，跳过该小节中已存在的同名试卷（按试卷名称去重）' },
    { category: '交互规则', content: '未选任何试卷时确定按钮置灰，不可点击' },
    { category: '数据规则', content: '资源库试卷仅关联到当前选中的末级小节' },
  ],
};

// ==================== 试卷预览弹窗 ====================

export const examPreviewDialog: PrdTooltipData = {
  title: '试卷预览',
  rules: [
    { category: '显示规则', content: '预览弹窗层级高于选择弹窗（z-60）' },
    { category: '显示规则', content: '弹窗尺寸700px × 85vh' },
    { category: '字段规则', content: '顶部标题栏：试卷图标 + 试卷名称 + 题量/总分信息 + X关闭按钮' },
    { category: '字段规则', content: '内容区：按题型分组展示题目列表' },
    { category: '字段规则', content: '底部信息栏：题目总数 + 关闭按钮' },
    { category: '交互规则', content: '点击关闭按钮或X→ 关闭预览弹窗，回到选择弹窗' },
    { category: '数据规则', content: '预览内容按试卷实际数据进行渲染，不写死固定题型结构' },
  ],
};

// ==================== 来源标签规则 ====================

export const examSourceTag: PrdTooltipData = {
  title: '试卷来源标签',
  rules: [
    { category: '显示规则', content: '详情页试卷卡片名称旁显示来源标签，区分试卷来源' },
    { category: '显示规则', content: '来源标签类型：【本地上传】蓝色标签、【资源库】绿色标签、【习题册】蓝色标签' },
    { category: '数据规则', content: '来源标签数据由试卷的sourceType字段决定：upload→本地上传、library→资源库、workbook→习题册' },
    { category: '数据规则', content: '缺少sourceType字段时不展示来源标签' },
  ],
};

// ==================== 批量删除弹窗 ====================

export const batchDeleteExamDialog: PrdTooltipData = {
  title: '批量删除练习试卷',
  rules: [
    { category: '字段规则', content: '弹窗标题：「批量删除练习试卷」' },
    { category: '显示规则', content: '弹窗居中展示，带半透明遮罩层，尺寸420px' },
    { category: '字段规则', content: '警告图标 + 标题 + 描述 + 操作按钮' },
    { category: '交互规则', content: '点击「取消」→ 关闭弹窗，不执行删除' },
    { category: '交互规则', content: '点击「确认删除」→ 清空当前末级小节下的所有试卷' },
    { category: '校验规则', content: '确认删除前无二次确认，点击即执行删除' },
  ],
};

export const duplicateExamDialog: PrdTooltipData = {
  title: '重复试卷确认弹窗',
  rules: [
    { category: '字段规则', content: '此功能已拆分到2.16教材级视图，本导出为过渡期兼容保留' },
  ],
};
