/**
 * 学段-学科配置
 * 数据来源：乐课网当前学段下已有的学科数据
 * 当前为 mock 数据，后续接入乐课网 API 后替换为动态获取
 */

export interface SubjectOption {
  id: string;
  label: string;
}

export interface PhaseOption {
  id: string;
  label: string;
}

// 学段选项
export const phaseOptions: PhaseOption[] = [
  { id: 'senior', label: '高中' },
  { id: 'junior', label: '初中' },
  { id: 'primary', label: '小学' },
];

// 学段→学科映射（根据乐课网当前学段下已有的学科数据）
// TODO: 后续接入乐课网API，动态获取各学段下的学科列表
export const subjectsByPhase: Record<string, SubjectOption[]> = {
  senior: [
    { id: 'math', label: '数学' },
    { id: 'chinese', label: '语文' },
    { id: 'english', label: '英语' },
    { id: 'physics', label: '物理' },
    { id: 'chemistry', label: '化学' },
    { id: 'biology', label: '生物' },
  ],
  junior: [
    { id: 'math', label: '数学' },
    { id: 'chinese', label: '语文' },
    { id: 'english', label: '英语' },
    { id: 'physics', label: '物理' },
    { id: 'chemistry', label: '化学' },
    { id: 'biology', label: '生物' },
  ],
  primary: [
    { id: 'math', label: '数学' },
    { id: 'chinese', label: '语文' },
    { id: 'english', label: '英语' },
  ],
};

/**
 * 根据学段ID获取对应的学科列表
 * @param phaseId 学段ID（如 'senior', 'junior', 'primary'）
 * @returns 学科选项数组，未匹配时返回空数组
 */
export function getSubjectsByPhase(phaseId: string): SubjectOption[] {
  return subjectsByPhase[phaseId] ?? [];
}

/**
 * 根据学段ID和学科ID获取学科label
 * @param phaseId 学段ID
 * @param subjectId 学科ID
 * @returns 学科label，未匹配时返回空字符串
 */
export function getSubjectLabel(phaseId: string, subjectId: string): string {
  const subjects = subjectsByPhase[phaseId] ?? [];
  return subjects.find((s) => s.id === subjectId)?.label ?? '';
}

/**
 * 根据学段ID获取学段label
 * @param phaseId 学段ID
 * @returns 学段label，未匹配时返回空字符串
 */
export function getPhaseLabel(phaseId: string): string {
  return phaseOptions.find((p) => p.id === phaseId)?.label ?? '';
}

/**
 * 获取首页学科筛选选项（含"全部学科"）
 * @param phaseId 学段ID
 * @returns 含"全部学科"的学科选项数组
 */
export function getSubjectFilterOptions(phaseId: string): SubjectOption[] {
  return [{ id: 'all', label: '全部学科' }, ...getSubjectsByPhase(phaseId)];
}
