/**
 * 文档标注配置
 * 定义页面各区域对应的 PRD 文档路径
 */

/**
 * 从文件路径中提取文件名（不含扩展名）作为标题
 */
function extractTitleFromPath(docPath: string): string {
  const fileName = docPath.split('/').pop() || '';
  return fileName.replace(/\.md$/, '');
}

export interface DocAnnotation {
  /** 区域 ID */
  id: string;
  /** 区域标题（完整文件名） */
  title: string;
  /** 对应的 PRD 文档路径 */
  docPath: string;
  /** 区域描述 */
  description?: string;
}

/**
 * 文档标注配置表
 * key: 路由路径
 * value: 该页面各区域的文档标注配置
 */
export const docAnnotations: Record<string, DocAnnotation[]> = {
  '/system-settings/knowledge-tree': [
    // 通用知识树 - 首页
    {
      id: 'home-empty',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/1.1首页-无数据.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/1.1首页-无数据.md',
    },
    {
      id: 'home-add-subject',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/1.2首页-新增学科弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/1.2首页-新增学科弹窗.md',
    },
    {
      id: 'home-with-data',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/1.3首页-有数据.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/1.3首页-有数据.md',
    },
    {
      id: 'home-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/1.4首页-查看历史发布记录弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/1.4首页-查看历史发布记录弹窗.md',
    },
    {
      id: 'detail-non-edit',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.01详情页-非编辑态.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.01详情页-非编辑态.md',
    },
    {
      id: 'detail-publish-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.02详情页-非编辑态-发布历史弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.02详情页-非编辑态-发布历史弹窗.md',
    },
    {
      id: 'detail-edit-tree',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.03详情页-编辑态-左侧知识树目录.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.03详情页-编辑态-左侧知识树目录.md',
    },
    {
      id: 'detail-edit-info',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.04详情页-编辑态-右侧知识点信息.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.04详情页-编辑态-右侧知识点信息.md',
    },
    {
      id: 'detail-edit-structure',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.05详情页-编辑态-右侧知识点结构.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.05详情页-编辑态-右侧知识点结构.md',
    },
    {
      id: 'detail-edit-prerequisite',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.06详情页-编辑态-右侧知识点结构-编辑前置知识点弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.06详情页-编辑态-右侧知识点结构-编辑前置知识点弹窗.md',
    },
    {
      id: 'detail-edit-resource',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.07详情页-编辑态-学习资源.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.07详情页-编辑态-学习资源.md',
    },
    {
      id: 'detail-edit-upload-video',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.08详情页-编辑态-学习资源-上传视频弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.08详情页-编辑态-学习资源-上传视频弹窗.md',
    },
    {
      id: 'detail-edit-select-resource',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.09详情页-编辑态-学习资源-资源库选择弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.09详情页-编辑态-学习资源-资源库选择弹窗.md',
    },
    {
      id: 'detail-import',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.10批量导入弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.10批量导入弹窗.md',
    },
    {
      id: 'detail-export',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/2.11导出知识树.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/2.11导出知识树.md',
    },
    {
      id: 'publish-confirm',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/3.0发布确认弹窗.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/3.0发布确认弹窗.md',
    },
    {
      id: 'publish-timed',
      title: extractTitleFromPath('产品文档/2-单页PRD/1-通用知识树/3.1定时发布后的页面.md'),
      docPath: '产品文档/2-单页PRD/1-通用知识树/3.1定时发布后的页面.md',
    },
  ],

  '/system-settings/strategy-plaza': [
    // 策略广场首页
    {
      id: 'home',
      title: extractTitleFromPath('产品文档/2-单页PRD/3-策略广场/1.0策略广场首页.md'),
      docPath: '产品文档/2-单页PRD/3-策略广场/1.0策略广场首页.md',
    },
  ],

  '/adaptive-strategy/strategy/diagnosis': [
    // 学情诊断 - 首页
    {
      id: 'home',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/1.0首页.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/1.0首页.md',
    },
    {
      id: 'home-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/1.1首页-查看历史发布记录.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/1.1首页-查看历史发布记录.md',
    },
    {
      id: 'home-add-strategy',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/1.2首页-新增策略.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/1.2首页-新增策略.md',
    },
    {
      id: 'detail-non-edit',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/2.0详情页-非编辑态.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/2.0详情页-非编辑态.md',
    },
    {
      id: 'detail-publish-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/2.1详情页-非编辑态-发布记录弹窗.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/2.1详情页-非编辑态-发布记录弹窗.md',
    },
    {
      id: 'detail-edit',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/2.2详情页-编辑态.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/2.2详情页-编辑态.md',
    },
    {
      id: 'detail-publish-confirm',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/2.3详情页-编辑态-发布确认弹窗.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/2.3详情页-编辑态-发布确认弹窗.md',
    },
    {
      id: 'detail-publish-timed',
      title: extractTitleFromPath('产品文档/2-单页PRD/4-学情诊断/2.4详情页-编辑态-定时发布后的页面.md'),
      docPath: '产品文档/2-单页PRD/4-学情诊断/2.4详情页-编辑态-定时发布后的页面.md',
    },
  ],

  '/adaptive-strategy/strategy/mastery': [
    // 掌握程度划分 - 首页
    {
      id: 'home-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/5-掌握程度划分/1.0首页-查看历史发布记录弹窗.md'),
      docPath: '产品文档/2-单页PRD/5-掌握程度划分/1.0首页-查看历史发布记录弹窗.md',
    },
    {
      id: 'detail-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/5-掌握程度划分/1.1详情页-非编辑态-历史发布记录弹窗.md'),
      docPath: '产品文档/2-单页PRD/5-掌握程度划分/1.1详情页-非编辑态-历史发布记录弹窗.md',
    },
    {
      id: 'detail-non-edit',
      title: extractTitleFromPath('产品文档/2-单页PRD/5-掌握程度划分/1.2详情页-非编辑态.md'),
      docPath: '产品文档/2-单页PRD/5-掌握程度划分/1.2详情页-非编辑态.md',
    },
    {
      id: 'detail-publish-confirm',
      title: extractTitleFromPath('产品文档/2-单页PRD/5-掌握程度划分/1.3详情页-非编辑态-发布确认弹窗.md'),
      docPath: '产品文档/2-单页PRD/5-掌握程度划分/1.3详情页-非编辑态-发布确认弹窗.md',
    },
    {
      id: 'detail-publish-timed',
      title: extractTitleFromPath('产品文档/2-单页PRD/5-掌握程度划分/1.4详情页-非编辑态-定时发布后的页面.md'),
      docPath: '产品文档/2-单页PRD/5-掌握程度划分/1.4详情页-非编辑态-定时发布后的页面.md',
    },
    {
      id: 'detail-edit',
      title: extractTitleFromPath('产品文档/2-单页PRD/5-掌握程度划分/1.5详情页-编辑态.md'),
      docPath: '产品文档/2-单页PRD/5-掌握程度划分/1.5详情页-编辑态.md',
    },
  ],

  '/system-settings/textbook-tree': [
    // 教材体系知识树 - 首页
    {
      id: 'home-empty',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/1.0首页-无数据.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/1.0首页-无数据.md',
    },
    {
      id: 'home-add-textbook',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/1.1首页-新增教材弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/1.1首页-新增教材弹窗.md',
    },
    {
      id: 'home-add-new',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/1.2首页-+新增弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/1.2首页-+新增弹窗.md',
    },
    {
      id: 'home-with-data',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/1.3首页-有数据.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/1.3首页-有数据.md',
    },
    {
      id: 'home-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/1.4首页-查看历史发布记录弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/1.4首页-查看历史发布记录弹窗.md',
    },
    {
      id: 'detail-non-edit',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.00【需重新调整PRD】详情页-非编辑态.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.00【需重新调整PRD】详情页-非编辑态.md',
    },
    {
      id: 'detail-publish-history',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.01详情页-非编辑态-发布历史弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.01详情页-非编辑态-发布历史弹窗.md',
    },
    {
      id: 'detail-edit-tree',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.02详情页-编辑态-编辑左侧教材树.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.02详情页-编辑态-编辑左侧教材树.md',
    },
    {
      id: 'detail-knowledge-tab',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.03【需调整设计】详情页-编辑态-知识点展示.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.03【需调整设计】详情页-编辑态-知识点展示.md',
    },
    {
      id: 'detail-knowledge-add',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.04详情页-编辑态-知识点-添加知识点弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.04详情页-编辑态-知识点-添加知识点弹窗.md',
    },
    {
      id: 'detail-course-tab',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.05详情页-编辑态-同步课程展示.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.05详情页-编辑态-同步课程展示.md',
    },
    {
      id: 'detail-course-upload',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.06详情页-编辑态-同步课程-上传课程弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.06详情页-编辑态-同步课程-上传课程弹窗.md',
    },
    {
      id: 'detail-course-select',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.07详情页-编辑态-同步课程-资源库选择弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.07详情页-编辑态-同步课程-资源库选择弹窗.md',
    },
    {
      id: 'detail-exam-tab',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.08详情页-编辑态-练习试卷展示.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.08详情页-编辑态-练习试卷展示.md',
    },
    {
      id: 'detail-exam-select',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.09详情页-编辑态-练习试卷-从资源库选择.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.09详情页-编辑态-练习试卷-从资源库选择.md',
    },
    {
      id: 'export',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.10详情页-导出教材.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.10详情页-导出教材.md',
    },
    {
      id: 'import',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.11【需补充页面设计】详情页-编辑态-导入教材弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.11【需补充页面设计】详情页-编辑态-导入教材弹窗.md',
    },
    {
      id: 'publish-confirm',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.12发布确认弹窗.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.12发布确认弹窗.md',
    },
    {
      id: 'publish-timed',
      title: extractTitleFromPath('产品文档/2-单页PRD/2-教材体系知识树/2.13定时发布后的页面.md'),
      docPath: '产品文档/2-单页PRD/2-教材体系知识树/2.13定时发布后的页面.md',
    },
  ],
};

/**
 * 根据当前路由获取对应的文档标注配置
 */
export function getAnnotationsByPath(path: string): DocAnnotation[] {
  return docAnnotations[path] || [];
}

/**
 * 根据区域 ID 获取文档标注
 */
export function getAnnotationById(path: string, id: string): DocAnnotation | undefined {
  const annotations = getAnnotationsByPath(path);
  return annotations.find(a => a.id === id);
}
