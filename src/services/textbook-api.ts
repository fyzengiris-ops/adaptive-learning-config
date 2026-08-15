// 教材体系 API 服务层

// ==================== 类型定义 ====================

export interface Textbook {
  id: string;
  name: string;
  subject: string;
  phase: string;
  grade: string;
  publisher: string;
  version: string;
  year: string;
  region: string;
  cover_image?: string;
  current_version?: string;
  last_publish_time?: string;
  last_publisher?: string;
  chapter_count: number;
  knowledge_point_count: number;
  school_count: number;
  has_unpublished_changes: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TextbookChapter {
  id: string;
  textbook_id: string;
  parent_id?: string;
  name: string;
  level: 'chapter' | 'section';
  order: number;
  expanded: boolean;
  knowledge_points?: KnowledgePoint[];
  sync_courses?: SyncCourse[];
  practice_exams?: PracticeExam[];
  created_at: string;
  updated_at?: string;
}

export interface KnowledgePoint {
  id: string;
  name: string;
  extendedPoints?: { id: string; name: string }[];
}

export interface SyncCourse {
  id: string;
  name: string;
  teacher: string;
  students: number;
}

export interface PracticeExam {
  id: string;
  name: string;
  questions: number;
  difficulty: string;
}

export interface ChangeRecord {
  id: string;
  textbook_id: string;
  change_type: 'add' | 'modify' | 'delete';
  change_description: string;
  changed_by: string;
  changed_by_role: 'supervisor' | 'teacher';
  dimension?: string;
  target?: string;
  is_published: boolean;
  created_at: string;
}

export interface PublishRecord {
  id: string;
  textbook_id: string;
  version: string;
  description: string;
  publish_time: string;
  publisher: string;
  publisher_account?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  changes?: ChangeRecord[];
  created_at: string;
}

export interface TextbookSchool {
  id: string;
  textbook_id: string;
  school_id: string;
  school_name: string;
  created_at: string;
}

// ==================== API 函数 ====================

const API_BASE = '/api/textbooks';

// 获取教材列表
export async function getTextbooks(filters?: {
  subject?: string;
  phase?: string;
  grade?: string;
}): Promise<Textbook[]> {
  const params = new URLSearchParams();
  if (filters?.subject) params.append('subject', filters.subject);
  if (filters?.phase) params.append('phase', filters.phase);
  if (filters?.grade) params.append('grade', filters.grade);

  const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch textbooks');
  }

  return result.data || [];
}

// 获取教材详情
export async function getTextbook(id: string): Promise<Textbook> {
  const response = await fetch(`${API_BASE}/${id}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch textbook');
  }

  return result.data;
}

// 创建教材
export async function createTextbook(data: Partial<Textbook>): Promise<Textbook> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create textbook');
  }

  return result.data;
}

// 更新教材
export async function updateTextbook(id: string, data: Partial<Textbook>): Promise<Textbook> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update textbook');
  }

  return result.data;
}

// 删除教材
export async function deleteTextbook(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to delete textbook');
  }
}

// 获取章节列表
export async function getChapters(textbookId: string): Promise<TextbookChapter[]> {
  const response = await fetch(`${API_BASE}/${textbookId}/chapters`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch chapters');
  }

  return result.data || [];
}

// 创建章节
export async function createChapter(
  textbookId: string,
  data: Partial<TextbookChapter>
): Promise<TextbookChapter> {
  const response = await fetch(`${API_BASE}/${textbookId}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create chapter');
  }

  return result.data;
}

// 批量更新章节
export async function updateChapters(
  textbookId: string,
  chapters: Partial<TextbookChapter>[]
): Promise<TextbookChapter[]> {
  const response = await fetch(`${API_BASE}/${textbookId}/chapters`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapters }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update chapters');
  }

  return result.data;
}

// 删除章节
export async function deleteChapter(textbookId: string, chapterId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${textbookId}/chapters?chapterId=${chapterId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to delete chapter');
  }
}

// 获取变更记录
export async function getChangeRecords(
  textbookId: string,
  unpublishedOnly?: boolean
): Promise<ChangeRecord[]> {
  const url = `${API_BASE}/${textbookId}/changes${unpublishedOnly ? '?unpublished=true' : ''}`;
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch change records');
  }

  return result.data || [];
}

// 添加变更记录
export async function addChangeRecord(
  textbookId: string,
  data: {
    change_type: 'add' | 'modify' | 'delete';
    change_description: string;
    changed_by?: string;
    changed_by_role?: 'supervisor' | 'teacher';
    dimension?: string;
    target?: string;
  }
): Promise<ChangeRecord> {
  const response = await fetch(`${API_BASE}/${textbookId}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to add change record');
  }

  return result.data;
}

// 标记变更为已发布
export async function markChangesAsPublished(textbookId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${textbookId}/changes`, {
    method: 'PUT',
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to mark changes as published');
  }
}

// 获取发布记录
export async function getPublishRecords(textbookId: string): Promise<PublishRecord[]> {
  const response = await fetch(`${API_BASE}/${textbookId}/publish`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch publish records');
  }

  return result.data || [];
}

// 发布新版本
export async function publishVersion(
  textbookId: string,
  data: {
    version: string;
    description: string;
    publisher?: string;
    publisher_account?: string;
    scheduled_date?: string;
    scheduled_time?: string;
  }
): Promise<PublishRecord> {
  const response = await fetch(`${API_BASE}/${textbookId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to publish version');
  }

  return result.data;
}

// 获取使用学校
export async function getSchools(textbookId: string): Promise<TextbookSchool[]> {
  const response = await fetch(`${API_BASE}/${textbookId}/schools`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch schools');
  }

  return result.data || [];
}

// 添加学校
export async function addSchools(
  textbookId: string,
  schools: { id: string; name: string }[]
): Promise<TextbookSchool[]> {
  const response = await fetch(`${API_BASE}/${textbookId}/schools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schools }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to add schools');
  }

  return result.data;
}

// 删除学校
export async function removeSchool(textbookId: string, schoolId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${textbookId}/schools?schoolId=${schoolId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to remove school');
  }
}
