'use client';

import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  BookOpen,
  FileText,
  GitBranch,
  BarChart3,
  ChevronRight,
  FileEdit,
  Settings2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DocPanel from '@/components/shared/DocPanel';

// 策略卡片数据类型
interface StrategyCard {
  id: string;
  icon: React.ReactNode;
  iconBgColor: string;  // 图标背景渐变色
  title: string;
  summary: string;
  status?: 'enabled' | 'disabled';  // 可选的启用状态
  href: string;  // 跳转路径
  publishStatus?: 'published' | 'pending';  // 发布状态
  pendingChanges?: number;  // 待发布变更数量
  currentVersion?: string;  // 当前版本号
}

// 模块配置类型
interface ModuleConfig {
  title: string;
  description: string;
  icon: React.ReactNode;  // 模块图标
  cards: StrategyCard[];
}

// 出题策略卡片
const questionStrategyCards: StrategyCard[] = [
  {
    id: 'diagnosis',
    icon: <Stethoscope className="w-7 h-7 text-white" />,
    iconBgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    title: '学情诊断',
    summary: '针对不同学段、学科、学习场景，配置初次诊断出题策略',
    href: '/adaptive-strategy/strategy/diagnosis',
    publishStatus: 'pending',
    pendingChanges: 3,
  },
  {
    id: 'single-knowledge',
    icon: <BookOpen className="w-7 h-7 text-white" />,
    iconBgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    title: '单知识点出题',
    summary: '配置单个知识点的题目生成规则，支持通用和个性化策略',
    href: '/adaptive-strategy/strategy/single-knowledge',
    publishStatus: 'published',
    currentVersion: 'v2.0',
  },
  {
    id: 'single-knowledge-b',
    icon: <BookOpen className="w-7 h-7 text-white" />,
    iconBgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    title: '单知识点出题（备选方案）',
    summary: '配置单个知识点的题目生成规则，支持通用和个性化策略',
    href: '/adaptive-strategy/strategy/single-knowledge-b',
    publishStatus: 'published',
    currentVersion: 'v2.0',
  },
  {
    id: 'mock-exam',
    icon: <FileText className="w-7 h-7 text-white" />,
    iconBgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
    title: '模拟考',
    summary: '配置模拟考试场景的试卷模板和出题规则',
    href: '/system-settings/strategy/mock-exam',
    publishStatus: 'published',
    currentVersion: 'v1.0',
  },
];

// 基础配置卡片
const basicConfigCards: StrategyCard[] = [
  {
    id: 'tracing',
    icon: <GitBranch className="w-7 h-7 text-white" />,
    iconBgColor: 'bg-gradient-to-br from-teal-400 to-teal-600',
    title: '追根溯源',
    summary: '配置知识点溯源规则，帮助定位薄弱知识点',
    status: 'enabled',
    href: '/system-settings/strategy/tracing',
    publishStatus: 'published',
    currentVersion: 'v1.0',
  },
  {
    id: 'mastery',
    icon: <BarChart3 className="w-7 h-7 text-white" />,
    iconBgColor: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    title: '掌握程度划分',
    summary: '定义知识点掌握程度的等级划分标准',
    href: '/adaptive-strategy/strategy/mastery',
    publishStatus: 'pending',
    pendingChanges: 3,
  },
];

// 模块配置
const moduleConfigs: ModuleConfig[] = [
  {
    title: '出题策略',
    description: '控制不同学习场景下的题目生成规则',
    icon: <FileEdit className="w-5 h-5 text-emerald-600" />,
    cards: questionStrategyCards,
  },
  {
    title: '基础配置',
    description: '系统运行的基础规则设置',
    icon: <Settings2 className="w-5 h-5 text-emerald-600" />,
    cards: basicConfigCards,
  },
];

// 策略卡片组件 - 优化版大气布局
function StrategyCardItem({ card }: { card: StrategyCard }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleNavigate = () => {
    router.push(card.href);
  };

  return (
    <div
      className={`
        bg-white rounded-xl cursor-pointer border border-gray-100 
        transition-all duration-300 ease-out
        ${isHovered ? 'shadow-lg border-emerald-200 -translate-y-1' : 'shadow-sm'}
      `}
      style={{ width: '280px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNavigate}
    >
      {/* 内容区域 */}
      <div className="p-6 flex flex-col items-center text-center">
        {/* 大图标 */}
        <div 
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mb-4
            ${card.iconBgColor} shadow-lg
            transition-transform duration-300
            ${isHovered ? 'scale-110' : 'scale-100'}
          `}
        >
          {card.icon}
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {card.title}
        </h3>

        {/* 版本号 */}
        {card.currentVersion && (
          <span className="text-sm text-gray-400 mb-3">
            {card.currentVersion}
          </span>
        )}

        {/* 状态标签 */}
        <div className="mb-3">
          {card.publishStatus === 'pending' ? (
            <span className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
              待发布 · {card.pendingChanges || 0}项变更
            </span>
          ) : card.publishStatus === 'published' ? (
            <span className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              已发布
            </span>
          ) : null}
        </div>

        {/* 描述文字 */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {card.summary}
        </p>
      </div>

      {/* 底部分割线和操作区 */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate();
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          进入管理
          <ChevronRight 
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: isHovered ? 'translateX(3px)' : 'translateX(0)' }}
          />
        </button>
      </div>
    </div>
  );
}

// 策略分组组件
function StrategyGroup({ title, description, icon, cards }: ModuleConfig) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8 last:mb-0">
      {/* 标题区 */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-gray-900 text-base">{title}</span>
          <span className="text-sm text-gray-400">({cards.length}项)</span>
        </div>
        <span className="text-sm text-gray-500">{description}</span>
      </div>

      {/* 卡片区域 */}
      <div className="p-6">
        <div className="flex flex-wrap gap-6">
          {cards.map((card) => (
            <StrategyCardItem 
              key={card.id} 
              card={card} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StrategyPlaza() {
  return (
    <div className="min-h-full p-6 bg-gray-50">
      {/* 页面标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">策略广场</h1>
          <p className="text-sm text-gray-500 mt-1">管理策略配置</p>
        </div>
      </div>

      {/* 模块区域 */}
      {moduleConfigs.map((module) => (
        <StrategyGroup key={module.title} {...module} />
      ))}

      {/* 业务逻辑文档面板 */}
      <DocPanel currentPath="/system-settings/strategy-plaza" />
    </div>
  );
}
