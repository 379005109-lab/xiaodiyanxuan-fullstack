import React from 'react'
import { usePermission } from '@/hooks/usePermission'

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: string
  children: React.ReactNode
}

/**
 * 带权限控制的按钮组件
 * 当用户没有指定权限时，按钮会被禁用或隐藏
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  children,
  disabled: propDisabled,
  ...props
}) => {
  const { hasPermission } = usePermission(permission)
  const isDisabled = propDisabled || !hasPermission()
  
  return (
    <button
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  )
}

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * 权限控制组件
 * 当用户没有指定权限时，显示fallback或不显示任何内容
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission } = usePermission(permission)
  
  if (!hasPermission()) {
    return fallback
  }
  
  return <>{children}</>
}
