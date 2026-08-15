/**
 * 教材体系知识树 - 2.06详情页-编辑态-同步课程-上传课程弹窗 PRD规则数据
 *
 * 数据来源：产品文档/2-单页PRD/2-教材体系知识树/2.06详情页-编辑态-同步课程-上传课程弹窗.md
 * 覆盖范围：上传课程弹窗的标题、上传区、已选文件列表、操作按钮、上传进度、数据流转、保存编辑-反写乐课网
 * 去重原则：同一条规则只归入一个分类，不重复描述；与2.00/2.05重叠的卡片字段规则不重复，仅描述上传弹窗增量
 * 前端状态：上传课程采用独立弹窗方式，选择文件后立即上传，全部上传完成后点击「确认上传」关闭弹窗。已集成6个弹窗内tooltip + 1个保存编辑tooltip
 */

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== 弹窗标题 ====================

export const uploadCourseDialogTitle: PrdTooltipData = {
  title: '上传课程弹窗-标题',
  rules: [
    { category: '字段规则', content: '弹窗标题文案：「上传课程」' },
    { category: '显示规则', content: '弹窗居中展示，带遮罩层，点击遮罩层不关闭弹窗（防止误操作丢失已选文件）' },
    { category: '显示规则', content: '弹窗宽度：max-w-2xl（576px）' },
    { category: '交互规则', content: '点击右上角关闭按钮（X图标）可关闭弹窗，等同于点击「取消」按钮' },
  ],
};

// ==================== 上传区域 ====================

export const uploadCourseDropZone: PrdTooltipData = {
  title: '上传课程弹窗-上传区域',
  rules: [
    { category: '字段规则', content: '上传区域提示文案：「点击选择文件」（蓝色可点击文字）' },
    { category: '字段规则', content: '上传视频格式限制：和乐课网上传视频格式保持一致' },
    { category: '字段规则', content: '上传视频大小限制：和乐课网上传视频大小保持一致' },
    { category: '显示规则', content: '上传区域样式：灰色虚线边框（border-dashed border-gray-300），灰色浅背景（bg-gray-50），居中布局，py-12内间距' },
    { category: '显示规则', content: '上传区域图标：Upload图标，灰色大图标居中展示' },
    { category: '显示规则', content: '点击「点击选择文件」文本或整个上传区域，均触发文件选择器' },
    { category: '交互规则', content: '点击上传区域或「点击选择文件」触发<input type="file" accept="video/*" multiple />' },
    { category: '校验规则', content: '文件格式校验：仅接受乐课网已支持的格式，其他格式提示「不支持该文件格式」' },
    { category: '校验规则', content: '文件大小校验：单文件不超过乐课网已支持的上传文件的大小，超出提示「仅支持上传X以内的文件」，其中的X是乐课网支持上传的最大内存的数值' },
    { category: '校验规则', content: '上传数量校验：单次最多选择10个文件，超出提示「单次最多上传10个文件」' },
    { category: '校验规则', content: '重名校验：与当前节点已有课程重名时提示「已存在同名课程」' },
  ],
};

// ==================== 已选文件列表 ====================

export const uploadCourseFileList: PrdTooltipData = {
  title: '上传课程弹窗-已选文件列表',
  rules: [
    { category: '字段规则', content: '每个已选文件展示：文件图标（Video图标）、文件名称、文件大小、删除按钮（X图标）' },
    { category: '字段规则', content: '文件名称：取原始文件名（含扩展名），超长截断' },
    { category: '字段规则', content: '文件大小：格式化展示，如125MB、1.2GB' },
    { category: '显示规则', content: '已选文件列表区域在上传区域下方，仅在有已选文件时展示' },
    { category: '显示规则', content: '文件列表项样式：灰色浅背景（bg-gray-50），圆角，flex布局，py-2 px-3内间距' },
    { category: '显示规则', content: '每个文件独立一行，列表项之间有间距（space-y-2）' },
    { category: '交互规则', content: '点击删除按钮（X图标）→ 从已选文件列表中移除该文件，不触发上传' },
  ],
};

// ==================== 操作按钮 ====================

export const uploadCourseActions: PrdTooltipData = {
  title: '上传课程弹窗-操作按钮',
  rules: [
    { category: '字段规则', content: '「取消」按钮：灰色描边按钮（border-gray-300 text-gray-700），hover灰色浅背景' },
    { category: '字段规则', content: '「确认上传」按钮：蓝色实心按钮（bg-blue-600 text-white），hover蓝色加深；上传中或无已选文件时禁用（opacity-50 cursor-not-allowed）' },
    { category: '显示规则', content: '操作按钮位于弹窗底部，右侧对齐，「取消」在左，「确认上传」在右' },
    { category: '显示规则', content: '上传中状态：「确认上传」按钮禁用，文案改为「上传中...」' },
    { category: '交互规则', content: '点击「取消」→ 关闭弹窗，清空已选文件列表（上传中不可点击）' },
    { category: '交互规则', content: '点击「确认上传」→ 关闭弹窗，课程写入当前节点课程列表（仅全部上传成功后可用）' },
  ],
};

// ==================== 上传进度 ====================

export const uploadCourseProgress: PrdTooltipData = {
  title: '上传课程弹窗-上传进度',
  rules: [
    { category: '字段规则', content: '每个文件独立展示进度条：文件名 + 进度百分比「XX%」' },
    { category: '字段规则', content: '进度条：蓝色填充条（bg-blue-500），灰色浅底（bg-gray-200），高度2，圆角' },
    { category: '字段规则', content: '上传完成文案：「上传完成」+ 绿色对勾图标' },
    { category: '字段规则', content: '上传失败文案：「上传失败」+ 红色感叹号图标 + 「重试」按钮' },
    { category: '显示规则', content: '用户选择文件后立即开始上传，已选文件列表变为上传进度列表' },
    { category: '显示规则', content: '每个文件独立显示上传进度，互不影响' },
    { category: '显示规则', content: '上传中时弹窗不可关闭，防止中断上传' },
    { category: '交互规则', content: '所有文件上传完成后，用户点击「确认上传」关闭弹窗，课程出现在当前节点课程列表中' },
    { category: '交互规则', content: '点击「重试」→ 对失败文件重新触发上传' },
  ],
};

// ==================== 数据流转（弹窗内） ====================

export const uploadCourseWriteback: PrdTooltipData = {
  title: '上传课程-数据流转',
  rules: [
    { category: '数据规则', content: '点击「确认上传」后，上传成功的课程视频保存到当前节点的同步课程列表中' },
    { category: '数据规则', content: '课程卡片来源标签统一为【本地上传】' },
    { category: '字段规则', content: '教师信息取上传该视频的账号的教师名称' },
  ],
};

// ==================== 保存编辑-数据流转（反写乐课网） ====================

export const saveEditWriteback: PrdTooltipData = {
  title: '保存编辑-数据流转',
  rules: [
    { category: '数据规则', content: '数据流转：用户点击保存编辑后，本地上传的视频将同步到当前账号的个人资源库中，同步字段如下' },
    { category: '数据规则', content: '描述：显示固定文案「自适应配置后台同步」' },
    { category: '数据规则', content: '学段学科：当前教材所属的学段学科' },
    { category: '数据规则', content: '微课类型：选择「同步微课」' },
    { category: '数据规则', content: '用途：选择「同步新课」' },
    { category: '数据规则', content: '教材章节：选择当前教材版本下对应的教材章节和小节' },
    { category: '数据规则', content: '年份：显示当前年份' },
    { category: '数据规则', content: '地区：选择「全选」' },
    { category: '数据规则', content: '级别：选择「精品」' },
    { category: '数据规则', content: '当用户最后点击发布按钮后，才将该条视频数据从当前账号的个人资源库上架到乐课网资源库' },
    { category: '交互规则', content: '反写时机：用户点击保存编辑后触发，不需要手动操作' },
    { category: '交互规则', content: '反写失败时不阻塞课程展示，但需标记反写状态为失败，支持后续重试' },
    { category: '校验规则', content: '只有当前节点课程写入成功且乐课网同步微课写入成功，才视为本次上传处理完成' },
  ],
};
