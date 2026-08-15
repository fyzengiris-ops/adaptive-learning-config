'use client';

import {
  LayoutDashboard,
  FileText,
  Settings,
  ChevronRight,
  TreeDeciduous,
  Lightbulb,
  Mic,
  PlaySquare,
  Book,
  PieChart,
  UserCog,
  Monitor
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItem[];
}

// 教研主管菜单配置
export const supervisorMenuItems: MenuItem[] = [
  { id: 'my-course', label: '我的乐课', icon: <LayoutDashboard className="w-5 h-5" />, href: '/' },
  { id: 'exercise', label: '习题管理', icon: <FileText className="w-5 h-5" />, href: '/exercise' },
  { id: 'album', label: '专辑管理', icon: <Mic className="w-5 h-5" />, href: '/album' },
  { id: 'on-demand', label: '点播库', icon: <PlaySquare className="w-5 h-5" />, href: '/on-demand' },
  { id: 'course', label: '课程管理', icon: <Book className="w-5 h-5" />, href: '/course' },
  { id: 'statistics', label: '统计中心', icon: <PieChart className="w-5 h-5" />, href: '/statistics' },
  { id: 'user', label: '用户管理', icon: <UserCog className="w-5 h-5" />, href: '/user' },
  { id: 'knowledge-system', label: '知识体系管理', icon: <TreeDeciduous className="w-5 h-5" />, href: '/knowledge-system' },
  { id: 'adaptive-strategy', label: '策略管理', icon: <Lightbulb className="w-5 h-5" />, href: '/adaptive-strategy' },
  { id: 'system-settings', label: '题库资源管理', icon: <Settings className="w-5 h-5" />, href: '/system-settings' },
  { id: 'resource-monitor', label: '资源监控', icon: <Monitor className="w-5 h-5" />, href: '/resource-monitor' },
];

// 教研员菜单配置
export const teacherMenuItems: MenuItem[] = [
  { id: 'my-course', label: '我的乐课', icon: <LayoutDashboard className="w-5 h-5" />, href: '/' },
  { id: 'knowledge-system', label: '知识树体系管理', icon: <TreeDeciduous className="w-5 h-5" />, href: '/knowledge-system' },
  { id: 'exercise', label: '习题管理', icon: <FileText className="w-5 h-5" />, href: '/exercise' },
  { id: 'album', label: '专辑管理', icon: <Mic className="w-5 h-5" />, href: '/album' },
  { id: 'on-demand', label: '点播库', icon: <PlaySquare className="w-5 h-5" />, href: '/on-demand' },
  { id: 'course', label: '课程管理', icon: <Book className="w-5 h-5" />, href: '/course' },
  { id: 'statistics', label: '统计中心', icon: <PieChart className="w-5 h-5" />, href: '/statistics' },
  { id: 'user', label: '用户管理', icon: <UserCog className="w-5 h-5" />, href: '/user' },
  { id: 'system-settings', label: '题库资源管理', icon: <Settings className="w-5 h-5" />, href: '/system-settings' },
  { id: 'resource-monitor', label: '资源监控', icon: <Monitor className="w-5 h-5" />, href: '/resource-monitor' },
];

interface SidebarProps {
  activeMenuId?: string;
}

export default function Sidebar({ activeMenuId }: SidebarProps) {
  const pathname = usePathname();
  const { isTeacher } = useRole();

  // 根据身份选择菜单配置
  const menuItems = isTeacher ? teacherMenuItems : supervisorMenuItems;

  // 根据路径判断是否激活
  const isActive = (item: MenuItem) => {
    if (activeMenuId) {
      return item.id === activeMenuId;
    }
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* 品牌区域 */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-emerald-600">乐课</h1>
        <p className="text-xs text-gray-500 mt-1">智能教学管理平台</p>
      </div>

      {/* 菜单列表 */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href || '#'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-transparent text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isActive(item) && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
