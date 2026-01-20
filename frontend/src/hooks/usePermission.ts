import React from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * 检查用户是否有指定权限
 * @param permission - 权限标识
 * @returns boolean - 是否有权限
 */
export function usePermission(permission: string): boolean {
  const { permissionList } = useAuthStore();
  return permissionList.includes(permission);
}

/**
 * 按钮级权限控制Hook
 * @param requiredPermissions - 需要的权限列表
 * @returns boolean - 是否有权限
 */
export function useButtonPermission(...requiredPermissions: string[]): boolean {
  const { permissionList } = useAuthStore();
  
  // 如果没有指定权限，默认返回true
  if (requiredPermissions.length === 0) {
    return true;
  }
  
  // 检查是否有任一所需权限
  return requiredPermissions.some(permission => 
    permissionList.includes(permission)
  );
}

/**
 * 渲染按钮级权限控制组件
 * @param props - 组件属性
 * @returns React.ReactNode - 渲染结果
 */
export function PermissionButton({
  children,
  requiredPermissions,
  fallback = null,
}: {
  children: React.ReactNode;
  requiredPermissions: string[];
  fallback?: React.ReactNode;
}): React.ReactNode {
  const hasPermission = useButtonPermission(...requiredPermissions);
  
  if (!hasPermission) {
    return fallback;
  }
  
  return children;
}
