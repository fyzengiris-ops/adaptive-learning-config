'use client';

import PageLayout from '@/components/shared/PageLayout';
import ComingSoon from '@/components/shared/ComingSoon';

export default function ExamTagPage() {
  return (
    <PageLayout
      activeMenuId="system-settings"
      breadcrumbs={[
        { label: '题库资源管理' },
        { label: '试卷标签', isLast: true },
      ]}
    >
      <ComingSoon 
        title="试卷标签" 
        description="该功能正在紧张开发中，敬请期待"
      />
    </PageLayout>
  );
}
