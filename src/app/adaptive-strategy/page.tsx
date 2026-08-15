'use client';

import PageLayout from '@/components/shared/PageLayout';
import StrategyPlaza from '../system-settings/StrategyPlaza';

export default function AdaptiveStrategyPage() {
  return (
    <PageLayout
      activeMenuId="adaptive-strategy"
      breadcrumbs={[
        { label: '策略管理' },
        { label: '策略广场', isLast: true },
      ]}
    >
      <StrategyPlaza />
    </PageLayout>
  );
}
