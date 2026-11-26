import { Suspense } from 'react';

export default function KnowledgeSystemLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
