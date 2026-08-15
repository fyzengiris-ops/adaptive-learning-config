'use client';

import PageLayout from '@/components/shared/PageLayout';
import ComingSoon from '@/components/shared/ComingSoon';

export default function Home() {
  return (
    <PageLayout
      activeMenuId="my-course"
      breadcrumbs={[
        { label: '我的乐课', isLast: true },
      ]}
    >
      <ComingSoon 
        title="我的乐课" 
        description="该功能正在紧张开发中，敬请期待"
      />
    </PageLayout>
  );
}
