'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 角色类型
export type RoleType = 'supervisor' | 'teacher';

// 角色配置
export const roleConfig = {
  supervisor: {
    label: '教研主管',
    description: '拥有完整的知识体系管理权限',
  },
  teacher: {
    label: '教研员',
    description: '可编辑知识点详情，但不能修改知识树结构',
  },
};

// Context 类型
interface RoleContextType {
  currentRole: RoleType;
  setRole: (role: RoleType) => void;
  isSupervisor: boolean;
  isTeacher: boolean;
  roleLabel: string;
}

// 创建 Context
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Provider Props
interface RoleProviderProps {
  children: React.ReactNode;
}

// Provider 组件
export function RoleProvider({ children }: RoleProviderProps) {
  const [currentRole, setCurrentRole] = useState<RoleType>('supervisor');
  const router = useRouter();

  // 切换角色
  const setRole = useCallback((role: RoleType) => {
    setCurrentRole(role);
    // 切换角色后跳转到知识树体系管理页面
    router.push('/knowledge-system');
  }, [router]);

  // 计算属性
  const isSupervisor = currentRole === 'supervisor';
  const isTeacher = currentRole === 'teacher';
  const roleLabel = roleConfig[currentRole].label;

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setRole,
        isSupervisor,
        isTeacher,
        roleLabel,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

// Hook
export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

// HOC: 用于包装需要权限检查的组件
export function withRoleCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: RoleType[]
) {
  return function RoleCheckedComponent(props: P) {
    const { currentRole } = useRole();
    
    if (!allowedRoles.includes(currentRole)) {
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
}
