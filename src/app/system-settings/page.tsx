'use client';

import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import PageLayout from '@/components/shared/PageLayout';

// 习题类型选项
const questionTypeOptions = [
  { id: 'single-choice', label: '单选题' },
  { id: 'multi-choice', label: '多选题' },
  { id: 'fill-blank', label: '填空题' },
  { id: 'judge', label: '判断题' },
  { id: 'cloze', label: '完型填空' },
  { id: 'reading', label: '阅读理解' },
  { id: 'qa', label: '问答题' },
  { id: 'composition', label: '作文' },
  { id: 'translation', label: '翻译题' },
  { id: 'listening', label: '听力题' },
  { id: 'material', label: '材料题' },
  { id: 'solution', label: '解答题' },
  { id: 'punctuation', label: '断句' },
  { id: 'modern-reading', label: '现代文阅读' },
  { id: 'classical-reading', label: '文言文阅读' },
  { id: 'poetry', label: '诗歌鉴赏' },
  { id: 'language-expression', label: '语言表达' },
  { id: 'calculation', label: '计算题' },
  { id: 'proof', label: '证明题' },
  { id: 'application', label: '应用题' },
  { id: 'written-expression', label: '书面表达' },
  { id: 'error-correction', label: '短文改错' },
  { id: 'fill-text', label: '短文填空' },
  { id: 'task-reading', label: '任务型阅读' },
  { id: 'word-fill', label: '选词填空' },
  { id: 'spelling', label: '单词拼写' },
  { id: 'drawing', label: '作图题' },
  { id: 'short-answer', label: '简答题' },
  { id: 'experiment', label: '实验探究题' },
  { id: 'analysis-calc', label: '分析计算题' },
  { id: 'sentence-transform', label: '句型转换' },
  { id: 'indefinite-choice', label: '不定项选择' },
  { id: 'oral', label: '口语题' },
  { id: 'handwriting', label: '手写题' },
  { id: 'photo', label: '拍照题' },
  { id: 'comprehensive', label: '综合题' },
];

// 学科配置
const subjectConfig = [
  { id: 'other', label: '其他' },
  { id: 'chinese', label: '语文' },
  { id: 'math', label: '数学' },
  { id: 'english', label: '英语' },
  { id: 'physics', label: '物理' },
  { id: 'chemistry', label: '化学' },
  { id: 'biology', label: '生物' },
  { id: 'politics', label: '政治' },
  { id: 'history', label: '历史' },
  { id: 'geography', label: '地理' },
];

// 各学科默认选中的题型
const defaultSelectedTypes: Record<string, string[]> = {
  'other': [],
  'chinese': ['single-choice', 'multi-choice', 'fill-blank', 'judge', 'qa', 'composition', 'translation', 'listening', 'material', 'punctuation', 'modern-reading', 'classical-reading', 'poetry', 'language-expression', 'spelling', 'oral', 'handwriting', 'comprehensive'],
  'math': ['single-choice', 'multi-choice', 'fill-blank', 'solution', 'calculation', 'proof', 'application', 'comprehensive'],
  'english': ['single-choice', 'multi-choice', 'fill-blank', 'cloze', 'reading', 'composition', 'listening', 'written-expression', 'error-correction', 'fill-text', 'task-reading', 'word-fill', 'spelling', 'sentence-transform', 'oral'],
  'physics': ['single-choice', 'multi-choice', 'fill-blank', 'solution', 'calculation', 'experiment', 'drawing'],
  'chemistry': ['single-choice', 'multi-choice', 'fill-blank', 'solution', 'calculation', 'experiment'],
  'biology': ['single-choice', 'multi-choice', 'fill-blank', 'solution', 'experiment'],
  'politics': ['single-choice', 'multi-choice', 'fill-blank', 'qa', 'short-answer'],
  'history': ['single-choice', 'multi-choice', 'fill-blank', 'qa', 'material', 'short-answer'],
  'geography': ['single-choice', 'multi-choice', 'fill-blank', 'qa', 'calculation', 'drawing'],
};

// 顶部标签配置
const tabsRow1 = [
  { id: 'exercise-type', label: '习题类型' },
  { id: 'exercise-config', label: '习题配置' },
  { id: 'exercise-tag', label: '习题标签' },
  { id: 'exam-tag', label: '试卷标签' },
  { id: 'publisher', label: '出版社设置' },
  { id: 'chapter', label: '教材章节设置', note: '后续隐藏' },
];

const tabsRow2 = [
  { id: 'knowledge-point', label: '知识点设置', note: '后续隐藏' },
  { id: 'resource-publisher', label: '资源库出版社管理' },
  { id: 'exercise-claim', label: '习题领取量设置' },
  { id: 'exercise-score', label: '习题分数设置' },
];

// 学科分组卡片组件
function SubjectCard({
  subjectId,
  subjectLabel,
  selectedTypes,
  onToggleType,
  onSelectAll,
  onClearAll,
  onSave,
}: {
  subjectId: string;
  subjectLabel: string;
  selectedTypes: string[];
  onToggleType: (typeId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSave: () => void;
}) {
  const isAllSelected = selectedTypes.length === questionTypeOptions.length;
  const isNoneSelected = selectedTypes.length === 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 标题区 */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{subjectLabel}</span>
          <span className="text-sm text-gray-400">（已选 {selectedTypes.length}/{questionTypeOptions.length}）</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAll}
            disabled={isAllSelected}
            className={`text-sm ${isAllSelected ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}
          >
            全选
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={onClearAll}
            disabled={isNoneSelected}
            className={`text-sm ${isNoneSelected ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
          >
            清空
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      {/* 题型选择区 */}
      <div className="p-5">
        <div className="grid grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3">
          {questionTypeOptions.map((type) => {
            const isSelected = selectedTypes.includes(type.id);
            return (
              <label
                key={type.id}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm
                  ${isSelected
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div
                  className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('exercise-type');
  const [selectedTypesBySubject, setSelectedTypesBySubject] = useState<Record<string, string[]>>(defaultSelectedTypes);

  // 切换题型选中状态
  const toggleType = (subjectId: string, typeId: string) => {
    setSelectedTypesBySubject((prev) => {
      const current = prev[subjectId] || [];
      const newSelected = current.includes(typeId)
        ? current.filter((id) => id !== typeId)
        : [...current, typeId];
      return { ...prev, [subjectId]: newSelected };
    });
  };

  // 全选
  const selectAll = (subjectId: string) => {
    setSelectedTypesBySubject((prev) => ({
      ...prev,
      [subjectId]: questionTypeOptions.map((t) => t.id),
    }));
  };

  // 清空
  const clearAll = (subjectId: string) => {
    setSelectedTypesBySubject((prev) => ({
      ...prev,
      [subjectId]: [],
    }));
  };

  // 保存
  const handleSave = (subjectId: string) => {
    console.log(`保存 ${subjectId} 的配置:`, selectedTypesBySubject[subjectId]);
    // 模拟保存成功提示
    alert(`${subjectConfig.find(s => s.id === subjectId)?.label} 的习题类型配置已保存`);
  };

  return (
    <PageLayout
      activeMenuId="system-settings"
      breadcrumbs={[
        { label: '题库资源管理' },
        { label: tabsRow1.find(t => t.id === activeTab)?.label || '习题类型', isLast: true },
      ]}
    >
      <div className="flex flex-col h-full">
        {/* 标签栏 - 第一行 */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="px-6">
            <div className="flex items-end gap-8">
              {tabsRow1.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 py-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-emerald-600'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.note && (
                    <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                      {tab.note}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 标签栏 - 第二行 */}
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          <div className="px-6">
            <div className="flex items-end gap-8">
              {tabsRow2.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 py-3 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-emerald-600'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.note && (
                    <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                      {tab.note}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {activeTab === 'exercise-type' ? (
            <div className="space-y-6 max-w-6xl">
              {subjectConfig.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subjectId={subject.id}
                  subjectLabel={subject.label}
                  selectedTypes={selectedTypesBySubject[subject.id] || []}
                  onToggleType={(typeId) => toggleType(subject.id, typeId)}
                  onSelectAll={() => selectAll(subject.id)}
                  onClearAll={() => clearAll(subject.id)}
                  onSave={() => handleSave(subject.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-2xl">
                    🚧
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {tabsRow1.find(t => t.id === activeTab)?.label || tabsRow2.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-gray-500">该功能正在紧张开发中，敬请期待</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
