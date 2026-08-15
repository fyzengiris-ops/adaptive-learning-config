'use client';

import PageLayout from '@/components/shared/PageLayout';
import ComingSoon from '@/components/shared/ComingSoon';

export default function ExerciseClaimPage() {
  return (
    <PageLayout
      activeMenuId="system-settings"
      breadcrumbs={[
        { label: '题库资源管理' },
        { label: '习题领取量设置', isLast: true },
      ]}
    >
      <ComingSoon 
        title="习题领取量设置" 
        description="该功能正在紧张开发中，敬请期待"
      />
    </PageLayout>
  );
}
