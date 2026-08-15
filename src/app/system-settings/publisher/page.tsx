'use client';

import PageLayout from '@/components/shared/PageLayout';
import ComingSoon from '@/components/shared/ComingSoon';

export default function PublisherPage() {
  return (
    <PageLayout
      activeMenuId="system-settings"
      breadcrumbs={[
        { label: '题库资源管理' },
        { label: '资源库出版社管理', isLast: true },
      ]}
    >
      <ComingSoon 
        title="资源库出版社管理" 
        description="该功能正在紧张开发中，敬请期待"
      />
    </PageLayout>
  );
}
