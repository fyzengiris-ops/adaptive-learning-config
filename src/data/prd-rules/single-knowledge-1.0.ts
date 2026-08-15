/**
 * 单知识点出题 1.0 首页
 * 覆盖范围：页面头部、筛选栏、通用策略分组、个性化策略分组、策略卡片、空状态、历史发布记录入口
 * 去重原则：同一条规则只归入一个分类，不重复描述
 * 前端状态：首页已实现筛选+分组+卡片+空状态+历史发布记录弹窗，tooltip待集成
 */

import type { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 页面头部 ====================

export const pageHeader: PrdTooltipData = {
  title: '页面头部',
  rules: [
    { category: '字段规则', content: '面包屑显示【策略管理 / 策略广场 / 单知识点出题】' },
    { category: '字段规则', content: '模块图标为蓝紫渐变圆角图标，内嵌BookOpen图标' },
    { category: '字段规则', content: '模块标题固定文案【单知识点出题】' },
    { category: '字段规则', content: '模块说明固定文案【维护单知识点出题策略，支持通用策略与个性化策略的统一管理】' },
    { category: '交互规则', content: '点击返回按钮→ 返回策略管理上一级页面' },
    { category: '交互规则', content: '点击【查看历史发布记录】→ 弹出历史发布记录弹窗（1.1页面）' },
  ],
};

// ==================== 类型筛选 ====================

export const typeFilter: PrdTooltipData = {
  title: '类型筛选',
  rules: [
    { category: '字段规则', content: '类型下拉选项包含【全部类型】【通用策略】【个性化策略】' },
    { category: '显示规则', content: '默认选中【全部类型】' },
    { category: '交互规则', content: '选择【全部类型】时，通用策略和个性化策略两个分组均展示' },
    { category: '交互规则', content: '选择【通用策略】时，仅展示通用策略分组，个性化策略分组整体隐藏' },
    { category: '交互规则', content: '选择【个性化策略】时，仅展示个性化策略分组，通用策略分组整体隐藏' },
  ],
};

// ==================== 学段筛选 ====================

export const phaseFilter: PrdTooltipData = {
  title: '学段筛选',
  rules: [
    { category: '字段规则', content: '学段下拉选项包含【高中】【初中】【小学】' },
    { category: '显示规则', content: '首次进入页面默认选中【高中】' },
    { category: '显示规则', content: '记住用户上次选择的学段，存储于浏览器localStorage，再次进入时自动选中' },
    { category: '交互规则', content: '切换学段后，学科选项联动更新为该学段下可选学科；若当前选中的学科在新学段下不可用，学科自动切回【全部学科】' },
    { category: '交互规则', content: '切换学段后，页面重新按当前筛选条件计算各分组下的展示结果' },
  ],
};

// ==================== 学科筛选 ====================

export const subjectFilter: PrdTooltipData = {
  title: '学科筛选',
  rules: [
    { category: '字段规则', content: '学科下拉首位固定为【全部学科】选项' },
    { category: '显示规则', content: '默认选中【全部学科】' },
    { category: '显示规则', content: '学科选项跟随学段联动：各学段下具体展示哪些学科，根据乐课网当前学段下已有的学科数据进行展示' },
    { category: '交互规则', content: '切换学科后，页面重新按当前筛选条件过滤各分组下的策略卡片' },
    { category: '交互规则', content: '切换学段后，若当前选中的学科在新学段下不可用，学科自动切回【全部学科】' },
  ],
};

// ==================== 通用策略分组 ====================

export const generalGroup: PrdTooltipData = {
  title: '通用策略分组',
  rules: [
    { category: '字段规则', content: '分组图标为蓝色渐变圆角图标，内嵌BookOpen图标' },
    { category: '字段规则', content: '分组名称固定文案【通用策略】' },
    { category: '字段规则', content: '分组标题右侧显示策略数量，格式为【（X个策略）】' },
    { category: '显示规则', content: '类型筛选为【全部类型】或【通用策略】时展示，否则隐藏' },
    { category: '显示规则', content: '分组固定在页面上方，个性化策略分组在下方' },
    { category: '交互规则', content: '点击分组右上角【新增】按钮→ 跳转至新增通用策略详情页（2.0页面），URL参数携带type=general' },
    { category: '交互规则', content: '新增详情页默认带入首页当前已选的学段，学科由用户在详情页自行选择' },
    { category: '数据规则', content: '同一学段下，同一学科仅允许存在一个通用策略' },
    { category: '数据规则', content: '唯一性校验在新增详情页的学科选择环节执行，首页不做校验拦截' },
  ],
};

// ==================== 个性化策略分组 ====================

export const personalizedGroup: PrdTooltipData = {
  title: '个性化策略分组',
  rules: [
    { category: '字段规则', content: '分组图标为紫色渐变圆角图标，内嵌Sparkles图标' },
    { category: '字段规则', content: '分组名称固定文案【个性化策略】' },
    { category: '字段规则', content: '分组标题右侧显示策略数量，格式为【（X个策略）】' },
    { category: '显示规则', content: '类型筛选为【全部类型】或【个性化策略】时展示，否则隐藏' },
    { category: '显示规则', content: '分组固定在页面下方，通用策略分组在上方' },
    { category: '交互规则', content: '点击分组右上角【新增】按钮→ 跳转至新增个性化策略详情页（2.5页面），URL参数携带type=personalized' },
    { category: '交互规则', content: '新增详情页默认带入首页当前已选的学段，学科由用户在详情页自行选择' },
    { category: '数据规则', content: '同一学段下，同一学科可存在多个个性化策略（与通用策略不同，不做唯一性限制）' },
  ],
};

// ==================== 策略卡片 ====================

export const strategyCard: PrdTooltipData = {
  title: '策略卡片',
  rules: [
    { category: '字段规则', content: '卡片右上角显示发布状态标签' },
    { category: '字段规则', content: '卡片居中展示学段标签（绿色）和学科标签（蓝色）' },
    { category: '字段规则', content: '仅个性化策略显示策略名称字段，通用策略不显示' },
    { category: '字段规则', content: '版本号居中展示，格式如【v1.2】' },
    { category: '字段规则', content: '覆盖区间显示在灰色背景卡片内，格式为【0%-40%、40%-70%、70%-100%】，显示的顺序按照区间值从小到大显示' },
    { category: '显示规则', content: '卡片宽度固定280px，按从左到右、从上到下排列，行内卡片间距16px，行间距16px' },
    { category: '显示规则', content: '卡片悬停时显示阴影和绿色边框效果' },
  ],
};

// ==================== 策略卡片状态标签 ====================

export const statusTag: PrdTooltipData = {
  title: '状态标签',
  rules: [
    { category: '字段规则', content: '已发布状态标签文案【已发布】，样式为绿色（emerald）' },
    { category: '字段规则', content: '待发布状态标签文案【待发布】，样式为橙色（orange）' },
    { category: '字段规则', content: '在策略广场首页，单知识点出题这个大封面上，显示待发布标签的时候，显示为【待发布·X项变更】，其中的X的显示逻辑为，单知识点出题的一级页面里，有多少个策略模块处于待发布状态，若单知识点出题的一级页面里，有处于已定时发布的策略模块，在首页计算X的时候，已定时发布的策略模块也需要统计进去' },
    { category: '字段规则', content: '定时发布状态标签文案【定时发布】，样式为蓝色，同时这条逻辑在V1.0期也增加上' },
    { category: '显示规则', content: '定时发布状态标签鼠标悬停时显示定时发布时间，同时这条逻辑在V1.0期也增加上' },
  ],
};

// ==================== 进入管理按钮 ====================

export const enterManageButton: PrdTooltipData = {
  title: '进入管理按钮',
  rules: [
    { category: '字段规则', content: '按钮文案固定【进入管理】，带右箭头图标' },
    { category: '显示规则', content: '按钮位于卡片底部，灰色半透明背景区域' },
    { category: '交互规则', content: '点击后以查看模式进入该策略的详情页' },
    { category: '交互规则', content: '从详情页返回首页后，首页按当前筛选条件重新加载并展示最新数据' },
  ],
};

// ==================== 通用策略空状态 ====================

export const generalEmptyState: PrdTooltipData = {
  title: '通用策略空状态',
  rules: [
    { category: '显示规则', content: '当前筛选条件下无通用策略时显示空状态' },
    { category: '显示规则', content: '空状态包含：半透明分组图标 + 文案【暂无通用策略】+ 辅助说明【请先创建通用策略，用于配置常规知识点的默认出题规则】+【新建通用策略】按钮' },
    { category: '交互规则', content: '点击【新建通用策略】按钮→ 跳转至新增通用策略详情页（2.0页面）' },
  ],
};

// ==================== 个性化策略空状态 ====================

export const personalizedEmptyState: PrdTooltipData = {
  title: '个性化策略空状态',
  rules: [
    { category: '显示规则', content: '当前筛选条件下无个性化策略时显示空状态' },
    { category: '显示规则', content: '空状态包含：半透明分组图标 + 文案【暂无个性化策略】+ 辅助说明【可按需创建个性化策略，用于特殊知识点的出题规则配置】+【新建个性化策略】按钮' },
    { category: '交互规则', content: '点击【新建个性化策略】按钮→ 跳转至新增个性化策略详情页（2.5页面）' },
  ],
};

// ==================== 全局筛选空状态 ====================

export const globalEmptyState: PrdTooltipData = {
  title: '筛选结果为空',
  rules: [
    { category: '显示规则', content: '当两个分组在当前筛选条件下均无策略卡片时，各分组各自显示空状态缺省图和提示文案【暂无数据~】' },
    { category: '显示规则', content: '空状态下分组头部和空状态提示仍正常展示，不隐藏分组容器' },
  ],
};

// ==================== 历史发布记录入口 ====================

export const historyEntry: PrdTooltipData = {
  title: '查看历史发布记录',
  rules: [
    { category: '字段规则', content: '按钮文案【查看历史发布记录】，带History图标' },
    { category: '显示规则', content: '按钮位于页面头部右侧' },
    { category: '交互规则', content: '点击后弹出历史发布记录弹窗（1.1页面），聚合展示所有策略的发布记录' },
    { category: '数据规则', content: '首页弹窗为聚合视图，展示所有策略的发布记录；详情页弹窗仅展示该策略的发布记录，两者数据范围不同' },
  ],
};

// ==================== 页面加载状态 ====================

export const pageLoadingState: PrdTooltipData = {
  title: '页面加载状态',
  rules: [
    { category: '显示规则', content: '页面初始加载时展示Loader2旋转图标 + 【加载中...】文案' },
    { category: '显示规则', content: '加载中居中展示，高度64（h-64）' },
  ],
};

// ==================== 新增后返回规则 ====================

export const afterAddReturn: PrdTooltipData = {
  title: '新增后返回',
  rules: [
    { category: '交互规则', content: '用户新增策略并返回首页后，首页按当前筛选条件重新加载并展示最新数据' },
    { category: '交互规则', content: '从详情页返回首页后，首页按当前筛选条件重新加载并展示最新数据' },
    { category: '数据规则', content: '新增的策略若尚未发布，则首页卡片状态显示为【待发布】或【草稿】' },
    { category: '数据规则', content: '首页中策略状态、版本号均以最新接口返回结果为准' },
  ],
};
