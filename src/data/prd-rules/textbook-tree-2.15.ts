/**
 * 教材体系知识树 - 2.15详情页-教材级视图 PRD规则数据
 *
 * 数据来源：产品文档/2-单页PRD/2-教材体系知识树/2.15详情页-教材级视图.md
 * 覆盖范围：教材级视图的整体交互和展示规则
 * 提取维度：组件说明 + 交互逻辑 + 业务规则 + 状态与异常
 * 去重原则：同一条规则只归入一个分类，不重复描述
 */

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 入口与退出 ====================

// 教材名称入口
export const textbookNameEntry: PrdTooltipData = {
  title: '教材名称-入口',
  rules: [
    { category: '字段规则', content: '左侧章节树顶部的教材名称（如"人教版数学必修一"）为可点击项，带BookOpen图标' },
    { category: '显示规则', content: '教材名称位于章节树最顶部，在所有章节节点之上' },
    { category: '交互规则', content: '点击教材名称，右侧面板进入教材级视图' },
    { category: '交互规则', content: '点击后教材名称高亮（bg-emerald-50），所有章节收起' },
    { category: '交互规则', content: '点击左侧章节树中任意章节节点，退出教材级视图，进入章节级视图' },
  ],
};

// ==================== 顶部标题栏 ====================

// 教材级标题
export const textbookLevelTitle: PrdTooltipData = {
  title: '教材级标题',
  rules: [
    { category: '字段规则', content: 'Tab栏上方左侧显示教材名称（如"人教版数学必修一"），替代原"章节详情"' },
    { category: '显示规则', content: '教材级视图下，原本显示章节名称的行调整为显示教材名称（如"人教版数学必修一"，不再显示"第一章 二次函数"等）' },
    { category: '显示规则', content: '顶部按钮（导出教材/批量导入/取消/保存编辑）与章节级保持一致' },
  ],
};

// ==================== Tab栏 ====================

// 教材级Tab栏
export const textbookLevelTabBar: PrdTooltipData = {
  title: '教材级Tab栏',
  rules: [
    { category: '字段规则', content: 'Tab栏包含三个Tab：知识点、同步课程、练习试卷，与章节级完全一致' },
    { category: '显示规则', content: 'Tab栏与教材名称同行，位于右侧，底部border-b分割线' },
    { category: '显示规则', content: '当前选中Tab高亮显示（emerald-600颜色+底部2px边框）' },
    { category: '交互规则', content: '点击Tab切换对应内容区域' },
  ],
};

// ==================== 知识点Tab ====================

// 教材级-知识点总览
export const textbookKnowledgeOverview: PrdTooltipData = {
  title: '知识点总览-教材级',
  rules: [
    { category: '字段规则', content: '标题文案："知识点总览"，后跟提示"聚合展示该教材下所有章节关联的知识点"' },
    { category: '显示规则', content: '按章为模块纵向聚合展示，每个章为一个独立区块，章节间用space-y-6分隔' },
    { category: '显示规则', content: '章级高亮块：绿色背景（bg-emerald-50）+圆角边框（border-emerald-200）+BookMarked图标+章节名加粗+知识点统计' },
    { category: '显示规则', content: '节级标题栏：绿色背景（bg-emerald-100）+圆角边框（border-emerald-300）+ListTree图标+节名加粗+知识点统计+子节数量' },
    { category: '显示规则', content: '连接线+圆点：绿色系（bg-emerald-300连接线、bg-emerald-500圆点），与章节级样式一致' },
    { category: '显示规则', content: '知识点卡片复用章节级样式：Star图标主知识点 + Circle图标延伸知识点' },
    { category: '显示规则', content: '支持多层级递归展示（章→一级小节→二级小节→更深层小节），子节嵌套展示' },
    { category: '显示规则', content: '末级小节无数据时，显示虚线边框提示："暂无知识点"' },
    { category: '交互规则', content: '知识点Tab在教材级为纯只读，不提供任何编辑操作和操作按钮' },
  ],
};

// ==================== 同步课程Tab ====================

// 教材级-同步课程总览
export const textbookCourseOverview: PrdTooltipData = {
  title: '同步课程总览-教材级',
  rules: [
    { category: '字段规则', content: '标题文案："同步课程总览"，后跟提示"聚合展示该教材下所有章节关联的课程"' },
    { category: '显示规则', content: '按章为模块纵向聚合展示，每个章为一个独立区块，章节间用space-y-6分隔' },
    { category: '显示规则', content: '章级高亮块：蓝色背景（bg-blue-50）+圆角边框（border-blue-200）+Video图标+章节名加粗+课程统计' },
    { category: '显示规则', content: '节级标题栏：蓝色背景（bg-blue-100）+圆角边框（border-blue-300）+ListTree图标+节名加粗+课程统计+子节数量' },
    { category: '显示规则', content: '连接线+圆点：蓝色系（bg-blue-300连接线、bg-blue-500圆点），与章节级样式一致' },
    { category: '显示规则', content: '课程卡片复用章节级renderCourseCard样式' },
    { category: '显示规则', content: '支持多层级递归展示（章→一级小节→二级小节→更深层小节），子节嵌套展示' },
    { category: '显示规则', content: '末级小节无数据时，显示虚线边框提示："暂无课程"' },
    { category: '交互规则', content: '同步课程Tab在教材级为纯只读，不提供任何编辑操作和操作按钮' },
  ],
};

// ==================== 练习试卷Tab ====================

// 教材级-练习试卷总览
export const textbookExamOverview: PrdTooltipData = {
  title: '练习试卷总览-教材级',
  rules: [
    { category: '字段规则', content: '标题文案："练习试卷总览"，后跟提示"聚合展示该教材下所有章节关联的试卷"' },
    { category: '显示规则', content: '按章为模块纵向聚合展示，每个章为一个独立区块，章节间用space-y-6分隔' },
    { category: '显示规则', content: '章级高亮块：琥珀色背景（bg-amber-50）+圆角边框（border-amber-200）+ClipboardList图标+章节名加粗+试卷统计' },
    { category: '显示规则', content: '节级标题栏：琥珀色背景（bg-amber-100）+圆角边框（border-amber-300）+ListTree图标+节名加粗+试卷统计+子节数量' },
    { category: '显示规则', content: '连接线+圆点：琥珀色系（bg-amber-300连接线、bg-amber-500圆点），与章节级样式一致' },
    { category: '显示规则', content: '试卷卡片复用章节级renderExamCard样式' },
    { category: '显示规则', content: '支持多层级递归展示（章→一级小节→二级小节→更深层小节），子节嵌套展示' },
    { category: '显示规则', content: '末级小节无数据时，显示虚线边框提示："暂无试卷"' },
    { category: '显示规则', content: '非编辑态下，不显示任何操作按钮' },
    { category: '显示规则', content: '编辑态下，总览标题行右侧显示【从习题册导入】和【批量删除】按钮' },
    { category: '显示规则', content: '按钮排列：【批量删除】在左，【从习题册导入】在最右' },
  ],
};

// 从习题册导入按钮
export const workbookImportButton: PrdTooltipData = {
  title: '从习题册导入',
  rules: [
    { category: '字段规则', content: '按钮文案："从习题册导入"' },
    { category: '显示规则', content: '仅在编辑态下显示，位于练习试卷总览标题行最右侧' },
    { category: '交互规则', content: '点击后弹出"从习题册导入"弹窗（详见2.16 PRD）' },
    { category: '交互规则', content: '确定后按"章名::小节名"映射到教材树各小节' },
  ],
};

// 批量删除按钮（教材级）
export const textbookBatchDeleteButton: PrdTooltipData = {
  title: '批量删除-教材级',
  rules: [
    { category: '字段规则', content: '按钮文案："批量删除"' },
    { category: '显示规则', content: '仅在编辑态下显示，位于【从习题册导入】按钮左侧' },
    { category: '显示规则', content: '仅当教材下存在试卷时显示' },
    { category: '交互规则', content: '点击后弹出二次确认弹窗' },
    { category: '交互规则', content: '确认弹窗文案："确认删除该教材下所有章节的练习试卷吗？"' },
    { category: '交互规则', content: '弹窗按钮：【取消】【确认删除】' },
    { category: '交互规则', content: '点击取消：仅隐藏弹窗' },
    { category: '交互规则', content: '点击确认删除：清空该教材下所有章节小节绑定的试卷信息' },
  ],
};

// ==================== 编辑态规则 ====================

// 教材级编辑态
export const textbookEditMode: PrdTooltipData = {
  title: '教材级编辑态',
  rules: [
    { category: '显示规则', content: '编辑态仅影响练习试卷Tab的操作按钮可见性，知识点和同步课程Tab始终只读' },
    { category: '显示规则', content: '编辑态下，练习试卷Tab显示【从习题册导入】和【批量删除】按钮' },
    { category: '显示规则', content: '编辑态下，各章节的试卷卡片为只读展示，不可单独删除（删除操作通过【批量删除】全局操作）' },
    { category: '交互规则', content: '点击保存编辑后，检测是否有变更，若有变更则设置待发布状态' },
    { category: '数据规则', content: '教材级视图下点击保存编辑，保存的是通过【从习题册导入】和【批量删除】操作产生的变更' },
  ],
};
