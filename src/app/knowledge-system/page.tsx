'use client';

import { useState } from 'react';
import { TreeDeciduous, GraduationCap, Layers, Copy } from 'lucide-react';
import PageLayout from '@/components/shared/PageLayout';
import KnowledgeTree from '../system-settings/KnowledgeTree';
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

export default function KnowledgeSystemPage() {
  const [activeTab, setActiveTab] = useState('knowledge-tree');
  const [showTabs, setShowTabs] = useState(true);
  const [detailTreeTitle, setDetailTreeTitle] = useState<string | null>(null);

  const isActiveTab = (tabId: string) => activeTab === tabId;

  const handleDetailViewChange = (isDetailView: boolean, extra?: { treeTitle?: string }) => {
    setShowTabs(!isDetailView);
    setDetailTreeTitle(isDetailView ? extra?.treeTitle ?? null : null);
  };

  const getBreadcrumbs = () => {
    const baseBreadcrumb = [{ label: '知识体系管理' }];
    if (showTabs) {
      return [...baseBreadcrumb, { label: tabs.find(t => t.id === activeTab)?.label || '', isLast: true }];
    }
    if (activeTab === 'knowledge-tree' && detailTreeTitle) {
      return [
        ...baseBreadcrumb,
        { label: '通用知识树' },
        { label: detailTreeTitle, isLast: true },
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
                    onClick={() => setActiveTab(tab.id)}
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
              <KnowledgeTree onDetailViewChange={handleDetailViewChange} />
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
