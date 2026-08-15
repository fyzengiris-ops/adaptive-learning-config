import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// 2.4-通用策略详情页-发布确认弹窗
// 严格按照2.4 PRD文档内容生成

export const modalHeader: PrdTooltipData = {
  title: '发布确认弹窗-弹窗头部',
  rules: [
    { category: '字段规则', content: '弹窗标题文案【发布新版本】' },
    { category: '显示规则', content: '弹窗以居中弹层形式展示，遮罩层不可穿透' },
    { category: '交互规则', content: '点击右上角关闭按钮可关闭弹窗' },
    { category: '交互规则', content: '点击遮罩层不可关闭弹窗' },
    { category: '交互规则', content: '按ESC键可关闭弹窗' },
  ],
};

export const publishWarning: PrdTooltipData = {
  title: '发布确认弹窗-发布提示',
  rules: [
    { category: '字段规则', content: '提示区以amber色警告卡片展示' },
    { category: '字段规则', content: '提示文案【发布后策略将立即生效，请确认策略内容无误后再发布】' },
    { category: '显示规则', content: '提示区始终展示，不可关闭' },
  ],
};

export const versionField: PrdTooltipData = {
  title: '发布确认弹窗-版本号',
  rules: [
    { category: '字段规则', content: '版本号字段只读展示，不可编辑' },
    { category: '字段规则', content: '版本号自动生成，规则为当前版本号次版本号+1（如v1.0→v1.1）' },
    { category: '显示规则', content: '格式为vX.Y，如v1.0、v1.1、v2.0' },
  ],
};

export const releaseNotesField: PrdTooltipData = {
  title: '发布确认弹窗-更新说明',
  rules: [
    { category: '字段规则', content: '更新说明为必填项' },
    { category: '字段规则', content: '输入框为多行文本域（textarea）' },
    { category: '交互规则', content: '点击输入框可输入更新说明内容' },
    { category: '校验规则', content: '未填写更新说明时点击发布按钮，字段下方显示红色提示【请填写更新说明】' },
    { category: '校验规则', content: '更新说明仅填写空格时视为未填写' },
  ],
};

export const publishTimeField: PrdTooltipData = {
  title: '发布确认弹窗-发布时间',
  rules: [
    { category: '字段规则', content: '发布时间提供两个选项：【立即发布】和【定时发布】' },
    { category: '字段规则', content: '默认选中【立即发布】' },
    { category: '字段规则', content: '选中【立即发布】时不展示日期和时间选择器' },
    { category: '字段规则', content: '选中【定时发布】时展示日期选择器和时间选择器' },
    { category: '字段规则', content: '日期选择器占位文案【请选择日期】' },
    { category: '字段规则', content: '时间选择器默认值【02:00】' },
    { category: '校验规则', content: '选中定时发布时，未选择日期点击发布，日期字段下方显示红色提示【请选择发布日期】' },
    { category: '校验规则', content: '定时发布日期不能早于当前日期' },
  ],
};

export const cancelButton: PrdTooltipData = {
  title: '发布确认弹窗-取消按钮',
  rules: [
    { category: '字段规则', content: '按钮文案【取消】' },
    { category: '交互规则', content: '点击【取消】→ 关闭弹窗，不执行任何发布操作' },
    { category: '交互规则', content: '关闭弹窗后清空已填写的更新说明和发布时间设置' },
  ],
};

export const publishButton: PrdTooltipData = {
  title: '发布确认弹窗-确认发布按钮',
  rules: [
    { category: '字段规则', content: '选中【立即发布】时，按钮文案【确认发布】' },
    { category: '字段规则', content: '选中【定时发布】时，按钮文案【确认定时发布】' },
    { category: '交互规则', content: '点击【确认发布】→ 立即发布策略，发布成功后关闭弹窗，停留在当前页面，右侧版本号更新为新版本号，状态显示【已发布】，显示toast提示【发布成功】' },
    { category: '交互规则', content: '点击【确认定时发布】→ 设置定时发布，关闭弹窗，停留在当前页面，版本号更新为新版本号，显示【定时发布】提示条' },
    { category: '交互规则', content: '发布中按钮显示loading状态，不可重复点击' },
    { category: '交互规则', content: '发布失败时弹窗不关闭，显示错误提示【发布失败，请重试】' },
    { category: '交互规则', content: '发布失败后可重新点击发布按钮' },
  ],
};

export const openModal: PrdTooltipData = {
  title: '发布确认弹窗-入口',
  rules: [
    { category: '交互规则', content: '点击查看态页面中的【发布】按钮打开发布确认弹窗' },
    { category: '显示规则', content: '【发布】按钮仅在待发布状态下显示' },
    { category: '交互规则', content: '打开弹窗时重置所有表单字段：更新说明清空、发布时间默认选中【立即发布】、日期时间清空' },
  ],
};
