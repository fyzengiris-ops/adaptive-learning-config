'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TreeDeciduous, GraduationCap, Layers, Copy } from 'lucide-react';
import PageLayout from '@/components/shared/PageLayout';
import KnowledgeTree, { type KnowledgeTreeLocation } from '../system-settings/KnowledgeTree';
import TextbookTree from '../system-settings/TextbookTree';
import TextbookTree2 from '../system-settings/TextbookTree2';
import TopicSystem from '../system-settings/TopicSystem';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { id: 'knowledge-tree', label: '通用知识树', icon: <TreeDeciduous className="w-4 h-4" /> },
  { id: 'textbook-tree', label: '教材体系知识树', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'textbook-tree-2', label: '教材体系知识树2', icon: <Copy className="w-4 h-4" /> },
  { id: 'topic-tree', label: '专题体系知识树', icon: <Layers className="w-4 h-4" /> },
];

const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  science: '科学',
};

const DETAIL_TABS = new Set(['info', 'relatedExam', 'structure', 'resource']);

export default function KnowledgeSystemPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const tabParam = searchParams.get('tab');
  const activeTab = tabs.some((tab) => tab.id === tabParam) ? tabParam! : 'knowledge-tree';
  const [otherDetail, setOtherDetail] = useState(false);
  const [detailTreeTitle, setDetailTreeTitle] = useState<string | null>(null);
  const [pendingSubject, setPendingSubject] = useState(false);

  const knowledgeSubjectId = activeTab === 'knowledge-tree' ? searchParams.get('subject') : null;
  const showKnowledgeDetail = activeTab === 'knowledge-tree' && (!!knowledgeSubjectId || pendingSubject);
  const showTabs = activeTab === 'knowledge-tree' ? !showKnowledgeDetail : !otherDetail;
  const knowledgeTitle = knowledgeSubjectId
    ? `管理${SUBJECT_LABELS[knowledgeSubjectId] || '学科'}知识树`
    : null;

  const updateQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParamsString);
      let changed = false;
      for (const [key, value] of Object.entries(patch)) {
        if (!value) {
          if (params.has(key)) {
            params.delete(key);
            changed = true;
          }
        } else if (params.get(key) !== value) {
          params.set(key, value);
          changed = true;
        }
      }
      if (!changed) return;
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParamsString]
  );

  const isActiveTab = (tabId: string) => activeTab === tabId;

  const handleDetailViewChange = (isDetailView: boolean, extra?: { treeTitle?: string }) => {
    if (activeTab === 'knowledge-tree') {
      setPendingSubject(isDetailView);
      if (extra?.treeTitle) setDetailTreeTitle(extra.treeTitle);
      return;
    }
    setOtherDetail(isDetailView);
    setDetailTreeTitle(isDetailView ? extra?.treeTitle ?? null : null);
  };

  const phaseParam = searchParams.get('phase');
  const detailParam = searchParams.get('detail');
  const treeLocation: KnowledgeTreeLocation = {
    stage: searchParams.get('stage'),
    phase: phaseParam === 'primary' || phaseParam === 'junior' || phaseParam === 'senior' ? phaseParam : null,
    subjectId: searchParams.get('subject'),
    nodeId: searchParams.get('node'),
    detailTab: detailParam && DETAIL_TABS.has(detailParam) ? detailParam : null,
    editing: searchParams.get('editing') === '1',
    card: searchParams.get('card'),
    openExamIds: (searchParams.get('open') || '').split(',').filter(Boolean),
  };

  const getBreadcrumbs = () => {
    const baseBreadcrumb = [{ label: '知识体系管理' }];
    if (showTabs) {
      return [...baseBreadcrumb, { label: tabs.find(t => t.id === activeTab)?.label || '', isLast: true }];
    }
    if (activeTab === 'knowledge-tree') {
      return [
        ...baseBreadcrumb,
        { label: '通用知识树' },
        { label: knowledgeTitle || detailTreeTitle || '知识树', isLast: true },
      ];
    }
    return baseBreadcrumb;
  };

  return (
    <PageLayout
      activeMenuId="knowledge-system"
      breadcrumbs={getBreadcrumbs()}
    >
      <div className="flex flex-col h-full min-h-0">
        {showTabs && (
          <div className="bg-white border-b border-gray-200 flex-shrink-0">
            <div className="px-6">
              <div className="flex items-end gap-10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => updateQuery({ tab: tab.id })}
                    className={`relative flex items-center gap-2 py-4 px-1 text-sm font-medium transition-colors ${
                      isActiveTab(tab.id)
                        ? 'text-emerald-600'
                        : 'text-gray-900 hover:text-emerald-600'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {isActiveTab(tab.id) && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 bg-gray-50 p-6 ${
          !showTabs && activeTab === 'knowledge-tree'
            ? 'overflow-hidden flex flex-col'
            : 'overflow-auto'
        }`}>
          {activeTab === 'knowledge-tree' && (
            <div className={!showTabs ? 'h-full min-h-0' : undefined}>
              <KnowledgeTree
                onDetailViewChange={handleDetailViewChange}
                location={treeLocation}
                onLocationChange={(next) =>
                  updateQuery({
                    stage: next.stage,
                    phase: next.phase,
                    subject: next.subject,
                    node: next.node,
                    detail: next.detail,
                    editing: next.editing,
                    card: next.card,
                    open: next.open,
                  })
                }
              />
            </div>
          )}
          {activeTab === 'textbook-tree' && <TextbookTree onDetailViewChange={handleDetailViewChange} />}
          {activeTab === 'textbook-tree-2' && <TextbookTree2 onDetailViewChange={handleDetailViewChange} />}
          {activeTab === 'topic-tree' && <TopicSystem onDetailViewChange={handleDetailViewChange} />}
        </div>
      </div>
    </PageLayout>
  );
}
