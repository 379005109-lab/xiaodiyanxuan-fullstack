import React from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * 基于权限的数据过滤Hook
 * @param data - 原始数据
 * @param permissionField - 数据中表示权限的字段
 * @returns 过滤后的数据
 */
export function useDataPermission<T extends { [key: string]: any }>(
  data: T[],
  permissionField: keyof T
): T[] {
  const { permissionList } = useAuthStore();
  
  // 如果没有数据或没有权限列表，返回原始数据
  if (!data || !data.length || !permissionList || !permissionList.length) {
    return data;
  }
  
  // 根据权限字段过滤数据
  return data.filter(item => {
    const requiredPermission = item[permissionField];
    // 如果数据项没有指定权限，默认显示
    if (!requiredPermission) {
      return true;
    }
    // 检查用户是否有查看该数据的权限
    return permissionList.includes(requiredPermission);
  });
}

/**
 * 检查用户是否有操作数据的权限
 * @param item - 数据项
 * @param actionPermissions - 操作需要的权限列表
 * @returns boolean - 是否有权限
 */
export function useDataActionPermission<T extends { [key: string]: any }>(
  item: T,
  actionPermissions: string[]
): boolean {
  const { permissionList } = useAuthStore();
  
  // 如果没有指定操作权限，默认返回true
  if (!actionPermissions || !actionPermissions.length) {
    return true;
  }
  
  // 检查用户是否有任一操作权限
  return actionPermissions.some(permission => 
    permissionList.includes(permission)
  );
}

/**
 * 数据权限控制组件
 * @param props - 组件属性
 * @returns React.ReactNode - 渲染结果
 */
export function DataPermission<T extends { [key: string]: any }>({
  children,
  data,
  permissionField,
  fallback = null,
}: {
  children: (filteredData: T[]) => React.ReactNode;
  data: T[];
  permissionField: keyof T;
  fallback?: React.ReactNode;
}): React.ReactNode {
  const filteredData = useDataPermission(data, permissionField);
  
  if (!filteredData || !filteredData.length) {
    return fallback;
  }
  
  return children(filteredData);
}
