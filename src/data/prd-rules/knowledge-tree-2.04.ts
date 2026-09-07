/**
 * 通用知识树 - 2.04详情页-编辑态-右侧知识点信息 PRD规则数据
 *
 * 数据来源：产品文档/2-单页PRD/1-通用知识树/2.04详情页-编辑态-右侧知识点信息.md
 * 提取维度：组件说明 + 交互逻辑 + 业务规则 + 状态与异常
 * 去重原则：同一条规则只归入一个分类，不重复描述
 */

import { PrdTooltipData } from '@/components/shared/PrdTooltip';

// ==================== A. 标题区 ====================
export const editDetailTitle: PrdTooltipData = {
  title: '知识点详情-编辑态标题',
  rules: [
    { category: '字段规则', content: '固定标题显示文案「知识点详情」' },
    { category: '显示规则', content: '编辑态下标题区右侧显示操作按钮区，包括导出知识树、批量导入、取消、保存编辑' },
  ],
};

// ==================== B. 操作按钮区 ====================
export const editActionButtons: PrdTooltipData = {
  title: '编辑态操作按钮',
  rules: [
    { category: '字段规则', content: '导出知识树按钮：显示导出图标和文案「导出知识树」' },
    { category: '字段规则', content: '批量导入按钮：显示上传图标和文案「批量导入」' },
    { category: '字段规则', content: '取消按钮：显示文案「取消」' },
    { category: '字段规则', content: '保存编辑按钮：显示文案「保存编辑」，绿色样式突出显示' },
    { category: '显示规则', content: '操作按钮区仅在编辑知识点详情模式下显示' },
    { category: '交互规则', content: '点击「取消」按钮：若无未保存修改，直接退出编辑态返回非编辑态；若有未保存修改，弹出取消编辑确认弹窗' },
    { category: '交互规则', content: '点击「保存编辑」按钮：提交当前编辑结果并退出编辑态' },
    { category: '交互规则', content: '点击「批量导入」按钮：弹出批量导入弹窗' },
    { category: '交互规则', content: '保存成功后，左侧信息卡片显示橙色待发布提示条「有未发布的变更，点击查看或发布」' },
    { category: '校验规则', content: '保存失败时，需提示失败原因，并保留当前编辑结果，避免用户重新输入' },
  ],
};

// ==================== C. Tab切换区 ====================
export const editTabSwitch: PrdTooltipData = {
  title: '编辑态Tab切换',
  rules: [
    { category: '字段规则', content: '三个Tab文案：「知识点信息」「知识点结构」「学习资源」' },
    { category: '显示规则', content: '当前选中Tab高亮显示' },
    { category: '显示规则', content: '编辑态下左侧显示当前知识点名称及末级/非末级标签' },
    { category: '交互规则', content: '点击Tab切换对应内容区域' },
    { category: '交互规则', content: '切换Tab不自动触发保存，由「保存编辑」按钮统一提交' },
  ],
};

// ==================== D0. 学业要求卡片（编辑态） ====================
export const editAcademicRequirementCard: PrdTooltipData = {
  title: '学业要求-编辑',
  rules: [
    { category: '字段规则', content: '卡片标题显示文案「学业要求」' },
    { category: '字段规则', content: '编辑态下学业要求显示为下拉选择框，可选值：「了解」「理解」「掌握」「运用」「超纲」，以及「未设置」' },
    { category: '显示规则', content: '仅叶子节点显示学业要求卡片，位置在考频卡片左侧' },
    { category: '显示规则', content: '非必填；未配置时为未设置态，不默认带入具体值' },
    { category: '交互规则', content: '选择后即时写入当前编辑结果，点击「保存编辑」后统一提交' },
    { category: '交互规则', content: '与考频等字段同一编辑会话：切换 Tab/字段不丢暂存；取消有未保存时二次确认' },
    { category: '显示规则', content: '学业要求不在左侧知识树节点上显示标签，仅右侧卡片展示' },
    { category: '数据规则', content: '变更维度归属「知识点信息」；新建末级默认未设置' },
  ],
};

// ==================== D1. 考频卡片（编辑态） ====================
export const editExamFrequencyCard: PrdTooltipData = {
  title: '考频-编辑',
  rules: [
    { category: '字段规则', content: '卡片标题显示文案「考频」' },
    { category: '字段规则', content: '编辑态下考频显示为下拉选择框，可选值：「高频」「中频」「低频」，以及「未设置」' },
    { category: '显示规则', content: '仅叶子节点显示考频卡片；与学业要求同排，位于学业要求右侧' },
    { category: '显示规则', content: '编辑态下考频卡片使用蓝色渐变背景（from-blue-50 to-white）' },
    { category: '显示规则', content: '新增知识点时，考频默认未设置' },
    { category: '显示规则', content: '若当前知识点已有已保存的考频信息，则默认回显现有值' },
    { category: '数据规则', content: '若当前知识点未配置考频，页面应显示未设置态，而不是默认带入具体值' },
    { category: '交互规则', content: '选择新的考频后，当前页面中的编辑结果即时更新' },
    { category: '交互规则', content: '更改考频信息后，左侧知识树目录中对应知识点的考频标签即时回显更新后的考频值' },
    { category: '交互规则', content: '该修改在点击「保存编辑」前不视为最终提交完成' },
  ],
};

// ==================== D2. 选题策略卡片（编辑态） ====================
export const editStrategyCard: PrdTooltipData = {
  title: '选题策略-编辑',
  rules: [
    { category: '字段规则', content: '卡片标题显示文案「选题策略」' },
    { category: '字段规则', content: '编辑态下策略类型显示为下拉选择框，可选值：「通用策略」「个性化策略」' },
    { category: '显示规则', content: '仅叶子节点显示选题策略卡片' },
    { category: '显示规则', content: '绑定通用策略时，卡片使用绿色渐变背景（from-emerald-50 to-white）' },
    { category: '显示规则', content: '绑定个性化策略时，卡片使用紫色渐变背景（from-purple-50 to-white）' },
    { category: '显示规则', content: '新增知识点默认选中「通用策略」' },
    { category: '显示规则', content: '若当前知识点已有已保存的策略信息，则默认回显现有值' },
    { category: '交互规则', content: '从「通用策略」切换为「个性化策略」后，页面显示个性化策略选择器' },
    { category: '交互规则', content: '从「个性化策略」切换回「通用策略」后，隐藏个性化策略选择器' },
    { category: '交互规则', content: '策略类型修改后，当前页面中的编辑结果即时更新' },
    { category: '数据规则', content: '策略详情数据来源于策略管理模块中单知识点出题策略对应学段学科的策略配置' },
    { category: '数据规则', content: '能选择和能展示的策略，需要为最新发布后的策略版本' },
  ],
};

// ==================== D2b. 个性化策略选择器 ====================
export const editPersonalizedStrategySelector: PrdTooltipData = {
  title: '个性化策略选择器',
  rules: [
    { category: '字段规则', content: '选择器占位文案：「请选择策略（支持模糊搜索）」' },
    { category: '字段规则', content: '搜索框占位文案：「搜索策略名称...」' },
    { category: '字段规则', content: '搜索无结果时显示文案：「未找到匹配的策略」' },
    { category: '显示规则', content: '仅当策略类型选择为「个性化策略」时显示' },
    { category: '交互规则', content: '点击选择器后，展开策略搜索与下拉列表' },
    { category: '交互规则', content: '支持按策略名称进行模糊搜索' },
    { category: '交互规则', content: '选择具体策略后，当前页面中的编辑结果即时更新' },
    { category: '数据规则', content: '选择器展示的数据来源于策略广场中的个性化策略列表' },
    { category: '数据规则', content: '当策略类型为「个性化策略」时，必须进一步选择一个具体的个性化策略' },
    { category: '数据规则', content: '能选择和能展示的策略，需要为最新发布后的策略版本' },
    { category: '数据规则', content: '当前页面不负责维护个性化策略本身，仅负责选择已存在的策略' },
    { category: '校验规则', content: '若未选择具体个性化策略，则个性化策略配置不完整' },
  ],
};

// ==================== E. 策略详情展示区（编辑态） ====================
export const editStrategyDetail: PrdTooltipData = {
  title: '策略详情-编辑态',
  rules: [
    { category: '显示规则', content: '策略详情区域始终为查看态，不支持在知识树页面内编辑策略内容' },
    { category: '显示规则', content: '绑定通用策略时，区间头使用绿色渐变背景，左侧带白色竖色条' },
    { category: '显示规则', content: '绑定个性化策略时，区间头使用紫色渐变背景，左侧带白色竖色条' },
    { category: '数据规则', content: '策略详情数据来源于策略管理模块中单知识点出题策略对应学段学科的策略配置' },
    { category: '数据规则', content: '根据当前知识树所属学段学科，匹配策略管理模块中同一学段学科下的出题策略进行展示' },
  ],
};

// ==================== C. 学习资源内容区 ====================
export const editLearningResourceContent: PrdTooltipData = {
  title: '学习资源内容区',
  rules: [
    { category: '显示规则', content: '当视频和文字讲解内容较多时，学习资源内容区支持纵向滚动浏览完整内容' },
    { category: '显示规则', content: '视频讲解与文字讲解两个模块之间保留固定间距' },
    { category: '显示规则', content: '视频讲解和文字讲解区域在同一滚动容器中连续浏览' },
  ],
};

// ==================== D. 视频讲解（编辑态） ====================
export const editLearningResourceVideo: PrdTooltipData = {
  title: '视频讲解-编辑',
  rules: [
    { category: '字段规则', content: '视频讲解卡片标题文案：「视频讲解」' },
    { category: '显示规则', content: '编辑态下，在「视频讲解」字段后面，显示静态提示文案——删除视频，仅代表在当前页面解除关联关系，不影响原视频在资源库中的存在。' },
    { category: '字段规则', content: '编辑态下有视频时，右上角显示文案「已添加 X 个」' },
    { category: '字段规则', content: '视频列表中每个视频条目显示：播放/预览入口、视频名称、来源标签（上传/资源库）、时长、文件大小' },
    { category: '交互规则', content: '编辑态下，视频名称支持编辑：点击视频名称旁的编辑图标，进入名称编辑态，显示输入框和√/×按钮；点击√按钮保存新名称，点击×按钮放弃编辑，回显进入编辑态之前的名称。不支持按Enter或Esc执行保存/取消操作；视频名称不允许为空，为空时点击√显示提示文案——视频名称不能为空' },
    { category: '字段规则', content: '每个视频条目右侧显示操作按钮：上移、下移、删除' },
    { category: '字段规则', content: '添加更多视频区域文案：「添加更多视频」' },
    { category: '字段规则', content: '上传视频按钮文案：「上传视频」' },
    { category: '字段规则', content: '资源库选择按钮文案：「从资源库选择」' },
    { category: '字段规则', content: '无视频时空态引导区包含上传视频入口、资源库选择入口、引导文案和支持格式提示' },
    { category: '显示规则', content: '视频讲解卡片使用紫色渐变背景' },
    { category: '显示规则', content: '系统初始化的时候，自动获取乐课网【当前知识点】已有的微课数据，在配置后台对应知识点详情页面直接回显；只初始化的时候拉乐课网的视频数据，后续乐课网的视频数据变了，则从视频选择框里选择' },
    { category: '交互规则', content: '点击「上传视频」按钮，唤起系统文件选择窗口，支持多选；上传成功后，视频加入视频列表，来源标记为「上传」' },
    { category: '交互规则', content: '上传多个视频时，按完成顺序依次加入列表' },
    { category: '交互规则', content: '点击「从资源库选择」按钮，打开资源库选择流程；选择后视频加入视频列表，来源标记为「资源库」' },
    { category: '交互规则', content: '点击播放/预览入口可预览视频，本地上传视频和资源库选择视频均可预览，预览的时候，用乐课网原本预览视频的组件，新开页预览视频' },
    { category: '交互规则', content: '点击上移/下移按钮可调整视频顺序；首个视频不可继续上移，末位视频不可继续下移' },
    { category: '交互规则', content: '删除的时候，可直接删除，无二次弹窗确认，同时只在当前配置后台进行关联关系的删除，不影响该份资源在乐课网资源库的存在' },
    { category: '交互规则', content: '上传过程中显示进度条和上传百分比文案「视频上传中... X%」' },
    { category: '校验规则', content: '上传视频格式限制：和乐课网上传视频格式保持一致' },
    { category: '校验规则', content: '上传视频大小限制：和乐课网上传视频大小保持一致' },
    { category: '校验规则', content: '文件格式校验：仅接受乐课网已支持的格式，其他格式提示「不支持该文件格式」' },
    { category: '校验规则', content: '文件大小校验：单文件不超过乐课网已支持的上传文件的大小，超出提示「仅支持上传X以内的文件」，其中的X是乐课网支持上传的最大内存的数值' },
    { category: '校验规则', content: '上传失败时提示失败原因，且不写入最终结果' },
  ],
};

// ==================== F2. 上传视频流程 ====================
export const uploadVideoProcess: PrdTooltipData = {
  title: '上传视频流程',
  rules: [
    { category: '字段规则', content: '上传进度条显示当前上传百分比，文案格式：「视频上传中... X%」' },
    { category: '字段规则', content: '上传未达100%时，显示「取消上传」按钮' },
    { category: '显示规则', content: '上传进度达100%后，自动隐藏进度条和「取消上传」按钮' },
    { category: '交互规则', content: '点击「上传视频」按钮，唤起系统文件选择窗口' },
    { category: '交互规则', content: '系统文件选择窗口支持多选视频文件' },
    { category: '交互规则', content: '上传成功后，视频加入视频列表，来源标记为「上传」' },
    { category: '交互规则', content: '上传多个视频时，按完成顺序依次加入列表' },
    { category: '交互规则', content: '点击「取消上传」按钮，终止当前上传流程；未完成上传的视频不加入列表，页面恢复上传前状态' },
    { category: '数据规则', content: '上传结果先写入编辑态结果，最终由「完成编辑」统一提交' },
    { category: '数据规则', content: '用户点击「完成编辑」时，将上传的微课写入到乐课网微课库，用当前账号写入到当前账号对应的维护乐课网微课的模块，写入字段：描述：默认写入「自适应学习配置后台自动写入」；学段学科自动携带当前知识点所属的学段学科；微课类型自动选择「知识点微课」；教材章节传入空值；知识点传入当前知识点；年份传入当前年份；地区默认选择全选；级别默认选择「精品」；对应视频默认为下架状态' },
    { category: '数据规则', content: '当用户对该知识点模块的信息操作发布时，将在该知识点模块上传的视频写入到乐课网微课库的视频做上架处理' },
    { category: '校验规则', content: '上传视频格式限制：和乐课网上传视频格式保持一致' },
    { category: '校验规则', content: '上传视频大小限制：和乐课网上传视频大小保持一致' },
    { category: '校验规则', content: '文件格式校验：仅接受乐课网已支持的格式，其他格式提示「不支持该文件格式」' },
    { category: '校验规则', content: '文件大小校验：单文件不超过乐课网已支持的上传文件的大小，超出提示「仅支持上传X以内的文件」，其中的X是乐课网支持上传的最大内存的数值' },
    { category: '校验规则', content: '上传失败时提示失败原因，失败文件不加入列表，保留已有视频结果' },
    { category: '校验规则', content: '写入乐课网微课库失败时保留上传结果，提示写入失败原因，不影响编辑流程继续' },
  ],
};

// ==================== G. 文字讲解（编辑态） ====================
export const editLearningResourceText: PrdTooltipData = {
  title: '文字讲解-编辑',
  rules: [
    { category: '字段规则', content: '文字讲解卡片标题文案：「文字讲解」' },
    { category: '字段规则', content: '编辑态下显示富文本编辑器，包含工具栏和编辑区域' },
    { category: '字段规则', content: '工具栏支持：在复用乐课网已有的富文本编辑器的基础上，上传图片的功能支持上传GIF图片' },
    { category: '字段规则', content: '无内容时编辑区显示占位文案「请输入文字讲解内容」' },
    { category: '字段规则', content: '底部信息栏显示字数统计（实时显示「X 字」）' },
    { category: '字段规则', content: '无文字内容时底部字数统计默认显示「0 字」' },
    { category: '显示规则', content: '文字讲解卡片使用绿色渐变背景（from-emerald-50 to-white）' },
    { category: '显示规则', content: '已有内容回显时，图片正常显示，GIF正常播放' },
    { category: '显示规则', content: '图片必须正常回显为图片内容本身，不允许只显示地址、文件名或链接文本' },
    { category: '交互规则', content: '用户可直接在编辑区输入文字内容' },
    { category: '交互规则', content: '用户可通过工具栏对内容进行格式化编辑' },
    { category: '交互规则', content: '编辑过程中，底部字数统计等信息同步更新' },
    { category: '交互规则', content: '插入图片支持从本地上传，支持上传GIF图片；插入后的图片和GIF在编辑区内可正常预览' },
    { category: '交互规则', content: '编辑器中的图片可点击在新窗口查看大图' },
    { category: '交互规则', content: '富文本编辑器支持粘贴外部内容' },
    { category: '校验规则', content: '文字讲解内容最大长度10000个字符' },
    { category: '校验规则', content: '插入的图片大小限制：单张不超过100MB' },
  ],
};

// ==================== F. 删除视频资源 ====================

// F1. 删除视频操作
export const deleteVideoDialog: PrdTooltipData = {
  title: '删除视频资源',
  rules: [
    { category: '交互规则', content: '点击删除按钮后，可直接删除，无二次弹窗确认' },
    { category: '数据规则', content: '只在当前配置后台进行关联关系的删除，不影响该份资源在乐课网资源库的存在' },
    { category: '交互规则', content: '删除操作即时生效于编辑结果，最终由「保存编辑」统一提交' },
    { category: '显示规则', content: '删除后，已添加数量和列表顺序同步更新' },
  ],
};

// F2. 仅配置后台删除绑定关系（已废弃，保留兼容）
export const deleteVideoUnbind: PrdTooltipData = {
  title: '仅配置后台删除绑定关系',
  rules: [
    { category: '数据规则', content: '只在当前配置后台进行关联关系的删除，不影响该份资源在乐课网资源库的存在' },
  ],
};

// F3. 全网删除（已废弃，保留兼容）
export const deleteVideoGlobal: PrdTooltipData = {
  title: '全网删除',
  rules: [
    { category: '数据规则', content: '已废弃：删除视频不再区分删除方式，统一为仅删除配置后台关联关系' },
  ],
};

// ==================== L. 资源库选择弹窗 ====================

// L1. 弹窗整体
export const resourceLibModal: PrdTooltipData = {
  title: '资源库选择弹窗',
  rules: [
    { category: '字段规则', content: '弹窗标题文案：「从资源库选择」' },
    { category: '字段规则', content: '弹窗宽度800px，高度70vh' },
    { category: '字段规则', content: '取消按钮文案：「取消」，灰色边框样式' },
    { category: '字段规则', content: '确定按钮文案：「确定」，紫色样式（bg-purple-600）' },
    { category: '显示规则', content: '弹窗采用左右双栏布局：左侧可选视频区、右侧已选视频区' },
    { category: '显示规则', content: '半透明黑色遮罩层' },
    { category: '交互规则', content: '点击右上角✕按钮关闭弹窗，等同于取消操作' },
    { category: '交互规则', content: '点击遮罩层不关闭弹窗' },
    { category: '交互规则', content: '点击「取消」：关闭弹窗，不保留弹窗内的临时选择变更' },
    { category: '交互规则', content: '点击「确定」：将右侧已选视频写入编辑结果，关闭弹窗' },
    { category: '交互规则', content: '确定后，选择的视频写入编辑结果但尚未最终保存，需由「保存编辑」统一提交' },
    { category: '校验规则', content: '未选择任何视频时，确定按钮置灰不可点击（disabled）' },
  ],
};

// L2. 左侧可选视频区
export const resourceLibAvailable: PrdTooltipData = {
  title: '可选视频区',
  rules: [
    { category: '字段规则', content: '区域标题文案：「可选视频」' },
    { category: '字段规则', content: '搜索框占位文案：「搜索视频名称...」' },
    { category: '字段规则', content: '每个视频卡片显示：视频图标、视频名称、时长、文件大小' },
    { category: '字段规则', content: '每个视频卡片悬浮时显示：预览按钮（播放图标）、添加按钮（「+ 添加」文案）' },
    { category: '显示规则', content: '左侧区域占弹窗宽度50%，右侧有分隔线' },
    { category: '显示规则', content: '视频列表区域支持纵向滚动' },
    { category: '显示规则', content: '视频列表中不展示已选中的视频（左右联动去重）' },
    { category: '交互规则', content: '在搜索框输入关键词，按视频名称模糊搜索，实时过滤列表' },
    { category: '交互规则', content: '点击「+ 添加」按钮，将该视频添加到右侧已选视频区' },
    { category: '交互规则', content: '添加后，该视频从左侧列表中移除（左右联动去重）' },
    { category: '交互规则', content: '点击预览按钮，用乐课网原本预览视频的组件，新开页预览视频' },
    { category: '校验规则', content: '搜索无结果时显示文案「未找到匹配的视频」' },
    { category: '校验规则', content: '所有视频均已添加时显示文案「所有视频已添加」' },
    { category: '数据规则', content: '数据来源：1、优先引用当前学段学科下，乐课网全网的资源，需要注意是否能拉取到学校老师分享的视频资源，如果能拉取到，尽量拉取，配置后台保存的时候不改写视频资源在乐课网的微课属性' },
    { category: '数据规则', content: '数据来源：2、系统初始化的时候，自动获取乐课网【当前知识点】已有的微课数据，在配置后台对应知识点详情页面直接回显' },
    { category: '数据规则', content: '数据来源：3、在配置后台上传微课，需要反写数据到乐课网微课资源库里' },
  ],
};

// L3. 右侧已选视频区
export const resourceLibSelected: PrdTooltipData = {
  title: '已选视频区',
  rules: [
    { category: '字段规则', content: '区域标题文案：「已选视频(X个)」，X为当前已选视频数量' },
    { category: '字段规则', content: '每个已选视频卡片显示：紫色视频图标、视频名称、时长、文件大小' },
    { category: '字段规则', content: '每个已选视频卡片悬浮时显示：预览按钮（播放图标）、移除按钮（✕图标）' },
    { category: '显示规则', content: '右侧区域占弹窗宽度50%，使用紫色背景区分' },
    { category: '显示规则', content: '已选视频列表区域支持纵向滚动' },
    { category: '显示规则', content: '已选视频无数量上限' },
    { category: '交互规则', content: '点击移除按钮（✕），将该视频从已选列表中移除，同时该视频回到左侧可选列表' },
    { category: '交互规则', content: '点击预览按钮，用乐课网原本预览视频的组件，新开页预览视频' },
    { category: '校验规则', content: '未选择任何视频时显示空态：视频图标 + 文案「暂未选择视频」+ 引导文案「请从左侧列表中选择视频」' },
  ],
};

// L5. 视频预览弹窗
export const resourceLibPreview: PrdTooltipData = {
  title: '视频预览弹窗',
  rules: [
    { category: '字段规则', content: '弹窗头部显示视频图标和视频名称' },
    { category: '字段规则', content: '视频播放区域显示视频名称和时长信息' },
    { category: '字段规则', content: '底部信息栏显示：时长、大小、上传时间' },
    { category: '字段规则', content: '关闭按钮文案：「关闭」' },
    { category: '显示规则', content: '预览弹窗覆盖在资源库选择弹窗之上（z-index更高）' },
    { category: '显示规则', content: '视频播放区域使用黑色背景，16:9比例' },
    { category: '交互规则', content: '点击右上角✕按钮关闭预览弹窗' },
    { category: '交互规则', content: '点击底部「关闭」按钮关闭预览弹窗' },
    { category: '交互规则', content: '点击预览弹窗外围遮罩层关闭预览弹窗' },
  ],
};
export const cancelEditConfirmDialog: PrdTooltipData = {
  title: '取消编辑确认弹窗',
  rules: [
    { category: '字段规则', content: '弹窗无标题，宽度400px，居中显示' },
    { category: '字段规则', content: '弹窗顶部居中显示橙色警告图标' },
    { category: '字段规则', content: '提示文案：「当前有未保存的修改，确定要放弃吗？」' },
    { category: '字段规则', content: '「继续编辑」按钮：灰色次要样式' },
    { category: '字段规则', content: '「放弃编辑」按钮：红色危险样式' },
    { category: '显示规则', content: '当编辑态下有未保存修改时，点击「取消」或「返回」按钮触发此弹窗' },
    { category: '显示规则', content: '半透明黑色遮罩层，点击遮罩层不关闭弹窗' },
    { category: '交互规则', content: '点击「继续编辑」：关闭弹窗，继续停留在编辑态' },
    { category: '交互规则', content: '点击「放弃编辑」：恢复到编辑前的初始状态，退出编辑态，返回非编辑态' },
    { category: '交互规则', content: '取消编辑后，所有暂存的修改全部丢弃，不影响原有数据' },
    { category: '交互规则', content: '取消编辑后，左侧信息卡片不显示橙色待发布提示条' },
  ],
};

// ==================== I. 批量导入 ====================
export const editBatchImport: PrdTooltipData = {
  title: '批量导入',
  rules: [
    { category: '字段规则', content: '按钮文案：「批量导入」，带上传图标' },
    { category: '显示规则', content: '批量导入按钮仅在编辑知识点详情模式下显示' },
    { category: '交互规则', content: '点击「批量导入」按钮后，弹出批量导入弹窗' },
    { category: '交互规则', content: '批量导入支持一次性导入多个知识点的学业要求、考频、策略等信息' },
    { category: '数据规则', content: '批量导入后的数据需通过「保存编辑」统一提交保存' },
    { category: '显示规则', content: '弹窗导入说明为感叹号 + 标题「导入说明」，列表含：下载模板填写；二级标题必填、三四级按实际情况；前置多个用顿号；学业要求可选了解/理解/掌握/运用/超纲；考频可选高频/中频/低频' },
    { category: '数据规则', content: '完整填写规则以 Excel 模板顶行为准；留空不更新、【清空】清空线上对应字段——业务口径写入 PRD，原型可不实现真实写回' },
    { category: '校验规则', content: '导入文件格式限制：Excel (.xlsx, .xls)' },
    { category: '校验规则', content: '导入文件需按模板格式填写，标题列用于定位线上已有节点' },
  ],
};

// ==================== J. 保存编辑 ====================
export const editSaveAction: PrdTooltipData = {
  title: '保存编辑',
  rules: [
    { category: '字段规则', content: '按钮文案：「保存编辑」，绿色样式（bg-emerald-600）突出显示' },
    { category: '交互规则', content: '点击「保存编辑」后，统一提交本页当前编辑结果并退出编辑态' },
    { category: '交互规则', content: '保存成功后，页面展示更新后的结果，返回非编辑态' },
    { category: '交互规则', content: '保存成功后，左侧信息卡片显示橙色待发布提示条「有未发布的变更，点击查看或发布」' },
    { category: '校验规则', content: '保存失败时，需提示失败原因，并保留当前编辑结果' },
    { category: '数据规则', content: '考频和策略相关字段在编辑过程中可被修改，所有修改暂存到临时缓存' },
    { category: '数据规则', content: '编辑态下的所有操作均暂存到临时缓存，不即时保存' },
    { category: '数据规则', content: '进入编辑态时，系统记录当前知识点的初始状态快照，用于取消编辑时恢复' },
  ],
};

// ==================== K. 编辑态全局规则 ====================
export const editGlobalRules: PrdTooltipData = {
  title: '编辑态全局规则',
  rules: [
    { category: '权限规则', content: '教研主管和教研员均可进入编辑知识点详情模式' },
    { category: '权限规则', content: '教研主管和教研员均可编辑右侧知识点信息内容' },
    { category: '权限规则', content: '本页不因角色不同而区分右侧知识点信息字段的编辑权限' },
    { category: '交互规则', content: '左侧知识树编辑与右侧知识点详情编辑可同时进行，无互斥限制' },
    { category: '交互规则', content: '点击右侧「编辑知识点详情」按钮后进入编辑知识点详情模式' },
    { category: '数据规则', content: '原末级节点维护过的知识点详情信息，变更为非末级节点后，再变回末级节点，会回显原来维护过的知识点详情信息' },
    { category: '数据规则', content: '本页维护范围包括：考频信息、选题策略类型、个性化策略选择' },
    { category: '数据规则', content: '本页不承载知识点目录结构维护，目录结构维护由左侧知识树目录承担' },
  ],
};
