import React, { ReactNode, useState, useMemo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

interface RouteCacheProps {
  children: ReactNode;
  key: string;
}

// 路由缓存组件
export function RouteCache({ children, key }: RouteCacheProps) {
  const [cachedComponents, setCachedComponents] = useState<Record<string, ReactNode>>({});
  const [isEntering, setIsEntering] = useState(true);

  // 监听key变化，触发动画
  useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [key]);

  // 缓存组件
  const cachedChild = useMemo(() => {
    if (!cachedComponents[key]) {
      setCachedComponents(prev => ({
        ...prev,
        [key]: children
      }));
      return children;
    }
    return cachedComponents[key];
  }, [children, key, cachedComponents]);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isEntering ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
      }`}
    >
      {cachedChild}
    </div>
  );
}

// 路由缓存容器
export function RouteCacheContainer() {
  const location = useLocation();
  const key = location.pathname;

  return (
    <RouteCache key={key}>
      <div className="min-h-[calc(100vh-128px)]">
        <Outlet />
      </div>
    </RouteCache>
  );
}
