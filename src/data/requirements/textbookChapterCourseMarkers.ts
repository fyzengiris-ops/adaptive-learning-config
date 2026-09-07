export const TEXTBOOK_CHAPTER_COURSE_SCOPE_ID = 'textbook-tree-chapter-topic';

export const TEXTBOOK_CHAPTER_COURSE_REGISTRY_IDS = [
  'textbook-tree-chapter-topic-course',
  'textbook-tree-chapter-extension-course',
] as const;

/** 本轮不进角标、也不进右侧 PRD 列表的需求 */
export const TEXTBOOK_CHAPTER_COURSE_EXCLUDE_IDS = [
  'TB_CTC-010',
  'TB_CTC-016',
  'TB_CTC-020',
  'TB_CTC-021',
  'TB_CEC-013',
  'TB_CEC-014',
  'TB_CEC-015',
  'TB_CEC-016',
] as const;
