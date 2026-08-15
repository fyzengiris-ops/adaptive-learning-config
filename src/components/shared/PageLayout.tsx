'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, Check } from 'lucide-react';
import Sidebar from './Sidebar';
import { useRole, roleConfig, RoleType } from '@/contexts/RoleContext';

interface PageLayoutProps {
  children: React.ReactNode;
  activeMenuId: string;
  breadcrumbs?: { label: string; isLast?: boolean }[];
}

export default function PageLayout({ children, activeMenuId, breadcrumbs }: PageLayoutProps) {
  const { currentRole, setRole, roleLabel } = useRole();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 切换角色
  const handleRoleChange = (role: RoleType) => {
    setRole(role);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 左侧侧边栏 */}
      <Sidebar activeMenuId={activeMenuId} />

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {breadcrumbs?.map((crumb, index) => (
                <span key={index} className="flex items-center gap-4">
                  <span className={`text-sm ${crumb.isLast ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                    {crumb.label}
                  </span>
                  {!crumb.isLast && <span className="text-gray-300">/</span>}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              {/* 身份切换下拉菜单 */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                >
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    教
                  </div>
                  <span className="text-white text-sm font-medium">{roleLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-white/80 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 下拉菜单 */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {(Object.keys(roleConfig) as RoleType[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          currentRole === role ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div>
                          <div className={`text-sm font-medium ${currentRole === role ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {roleConfig[role].label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {roleConfig[role].description}
                          </div>
                        </div>
                        {currentRole === role && (
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
