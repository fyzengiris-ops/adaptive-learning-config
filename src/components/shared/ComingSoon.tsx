'use client';

import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <Construction className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {title || '功能开发中'}
        </h2>
        <p className="text-gray-500 max-w-md">
          {description || '该功能正在紧张开发中，敬请期待'}
        </p>
      </div>
    </div>
  );
}
