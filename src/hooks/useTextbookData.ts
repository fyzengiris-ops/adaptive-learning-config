'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Textbook,
  TextbookChapter,
  ChangeRecord,
  PublishRecord,
  TextbookSchool,
  getTextbooks,
  getTextbook,
  createTextbook,
  updateTextbook,
  deleteTextbook,
  getChapters,
  createChapter,
  updateChapters,
  deleteChapter,
  getChangeRecords,
  addChangeRecord,
  getPublishRecords,
  publishVersion,
  getSchools,
  addSchools,
  removeSchool,
} from '@/services/textbook-api';

// ==================== 类型定义 ====================

interface UseTextbookDataReturn {
  // 状态
  textbooks: Textbook[];
  selectedTextbook: Textbook | null;
  chapters: TextbookChapter[];
  changeRecords: ChangeRecord[];
  publishRecords: PublishRecord[];
  schools: TextbookSchool[];
  loading: boolean;
  error: string | null;

  // 教材操作
  loadTextbooks: (filters?: { subject?: string; phase?: string; grade?: string }) => Promise<void>;
  selectTextbook: (id: string) => Promise<void>;
  createNewTextbook: (data: Partial<Textbook>) => Promise<Textbook>;
  updateSelectedTextbook: (data: Partial<Textbook>) => Promise<void>;
  deleteSelectedTextbook: () => Promise<void>;

  // 章节操作
  loadChapters: () => Promise<void>;
  saveChapters: (chapters: Partial<TextbookChapter>[]) => Promise<void>;
  addChapter: (data: Partial<TextbookChapter>) => Promise<TextbookChapter>;
  removeChapter: (chapterId: string) => Promise<void>;

  // 变更记录操作
  loadChangeRecords: (unpublishedOnly?: boolean) => Promise<void>;
  addChange: (data: {
    change_type: 'add' | 'modify' | 'delete';
    change_description: string;
    dimension?: string;
    target?: string;
  }) => Promise<void>;

  // 发布操作
  loadPublishRecords: () => Promise<void>;
  publish: (data: {
    version: string;
    description: string;
    publisher?: string;
    publisher_account?: string;
    scheduled_date?: string;
    scheduled_time?: string;
  }) => Promise<void>;

  // 学校操作
  loadSchools: () => Promise<void>;
  addSchoolsToTextbook: (schools: { id: string; name: string }[]) => Promise<void>;
  removeSchoolFromTextbook: (schoolId: string) => Promise<void>;

  // 工具
  clearSelection: () => void;
  setError: (error: string | null) => void;
}

// ==================== Hook ====================

export function useTextbookData(
  userRole: 'supervisor' | 'teacher',
  userName: string = '当前用户'
): UseTextbookDataReturn {
  // 状态
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);
  const [chapters, setChapters] = useState<TextbookChapter[]>([]);
  const [changeRecords, setChangeRecords] = useState<ChangeRecord[]>([]);
  const [publishRecords, setPublishRecords] = useState<PublishRecord[]>([]);
  const [schools, setSchools] = useState<TextbookSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载教材列表
  const loadTextbooks = useCallback(async (filters?: {
    subject?: string;
    phase?: string;
    grade?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTextbooks(filters);
      setTextbooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载教材列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 选择教材并加载详情
  const selectTextbook = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const textbook = await getTextbook(id);
      setSelectedTextbook(textbook);

      // 同时加载章节数据
      const chaptersData = await getChapters(id);
      setChapters(chaptersData);

      // 加载变更记录
      const changes = await getChangeRecords(id);
      setChangeRecords(changes);

      // 加载发布记录
      const publishes = await getPublishRecords(id);
      setPublishRecords(publishes);

      // 加载学校
      const schoolsData = await getSchools(id);
      setSchools(schoolsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载教材详情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新教材
  const createNewTextbook = useCallback(async (data: Partial<Textbook>): Promise<Textbook> => {
    setLoading(true);
    setError(null);
    try {
      const newTextbook = await createTextbook(data);
      setTextbooks(prev => [newTextbook, ...prev]);
      return newTextbook;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建教材失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新选中的教材
  const updateSelectedTextbook = useCallback(async (data: Partial<Textbook>) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await updateTextbook(selectedTextbook.id, data);
      setSelectedTextbook(updated);
      setTextbooks(prev =>
        prev.map(t => (t.id === updated.id ? updated : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新教材失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 删除选中的教材
  const deleteSelectedTextbook = useCallback(async () => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      await deleteTextbook(selectedTextbook.id);
      setTextbooks(prev => prev.filter(t => t.id !== selectedTextbook.id));
      setSelectedTextbook(null);
      setChapters([]);
      setChangeRecords([]);
      setPublishRecords([]);
      setSchools([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除教材失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 加载章节
  const loadChapters = useCallback(async () => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getChapters(selectedTextbook.id);
      setChapters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载章节失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 保存章节（批量更新）
  const saveChapters = useCallback(async (updatedChapters: Partial<TextbookChapter>[]) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const data = await updateChapters(selectedTextbook.id, updatedChapters);
      setChapters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存章节失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 添加章节
  const addChapter = useCallback(async (data: Partial<TextbookChapter>): Promise<TextbookChapter> => {
    if (!selectedTextbook) throw new Error('No textbook selected');
    setLoading(true);
    setError(null);
    try {
      const newChapter = await createChapter(selectedTextbook.id, data);
      setChapters(prev => [...prev, newChapter]);
      return newChapter;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加章节失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 删除章节
  const removeChapter = useCallback(async (chapterId: string) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      await deleteChapter(selectedTextbook.id, chapterId);
      setChapters(prev => prev.filter(c => c.id !== chapterId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除章节失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 加载变更记录
  const loadChangeRecords = useCallback(async (unpublishedOnly?: boolean) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getChangeRecords(selectedTextbook.id, unpublishedOnly);
      setChangeRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载变更记录失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 添加变更记录
  const addChange = useCallback(async (data: {
    change_type: 'add' | 'modify' | 'delete';
    change_description: string;
    dimension?: string;
    target?: string;
  }) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const newChange = await addChangeRecord(selectedTextbook.id, {
        ...data,
        changed_by: userName,
        changed_by_role: userRole,
      });
      setChangeRecords(prev => [newChange, ...prev]);
      
      // 更新教材的待发布状态
      setSelectedTextbook(prev =>
        prev ? { ...prev, has_unpublished_changes: true } : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加变更记录失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook, userName, userRole]);

  // 加载发布记录
  const loadPublishRecords = useCallback(async () => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublishRecords(selectedTextbook.id);
      setPublishRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载发布记录失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 发布新版本
  const publish = useCallback(async (data: {
    version: string;
    description: string;
    publisher?: string;
    publisher_account?: string;
    scheduled_date?: string;
    scheduled_time?: string;
  }) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const newPublish = await publishVersion(selectedTextbook.id, {
        ...data,
        publisher: userName,
      });
      setPublishRecords(prev => [newPublish, ...prev]);
      
      // 更新教材状态
      setSelectedTextbook(prev =>
        prev
          ? {
              ...prev,
              has_unpublished_changes: false,
              current_version: data.version,
              last_publish_time: newPublish.publish_time,
              last_publisher: userName,
            }
          : null
      );
      
      // 标记变更记录为已发布
      setChangeRecords(prev =>
        prev.map(c => ({ ...c, is_published: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook, userName]);

  // 加载学校
  const loadSchools = useCallback(async () => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSchools(selectedTextbook.id);
      setSchools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载学校失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 添加学校
  const addSchoolsToTextbook = useCallback(async (newSchools: { id: string; name: string }[]) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      const data = await addSchools(selectedTextbook.id, newSchools);
      setSchools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加学校失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 删除学校
  const removeSchoolFromTextbook = useCallback(async (schoolId: string) => {
    if (!selectedTextbook) return;
    setLoading(true);
    setError(null);
    try {
      await removeSchool(selectedTextbook.id, schoolId);
      setSchools(prev => prev.filter(s => s.school_id !== schoolId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除学校失败');
    } finally {
      setLoading(false);
    }
  }, [selectedTextbook]);

  // 清除选择
  const clearSelection = useCallback(() => {
    setSelectedTextbook(null);
    setChapters([]);
    setChangeRecords([]);
    setPublishRecords([]);
    setSchools([]);
  }, []);

  // 初始加载教材列表
  useEffect(() => {
    loadTextbooks();
  }, [loadTextbooks]);

  return {
    textbooks,
    selectedTextbook,
    chapters,
    changeRecords,
    publishRecords,
    schools,
    loading,
    error,

    loadTextbooks,
    selectTextbook,
    createNewTextbook,
    updateSelectedTextbook,
    deleteSelectedTextbook,

    loadChapters,
    saveChapters,
    addChapter,
    removeChapter,

    loadChangeRecords,
    addChange,

    loadPublishRecords,
    publish,

    loadSchools,
    addSchoolsToTextbook,
    removeSchoolFromTextbook,

    clearSelection,
    setError,
  };
}
