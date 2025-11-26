import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

// 禁用 TypeScript 类型检查的插件
const disableTypeCheckPlugin: any = {
  name: 'disable-type-check',
  apply: 'build',
  enforce: 'pre',
  resolveId(id: any) {
    if (id.includes('typescript')) {
      return { id: 'virtual-module', external: true };
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), disableTypeCheckPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 优化分包策略，减少单个chunk大小
          if (id.includes('node_modules')) {
            // React核心库单独打包
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // 路由库单独打包
            if (id.includes('react-router')) {
              return 'router-vendor'
            }
            // UI组件库单独打包
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('@headlessui')) {
              return 'ui-vendor'
            }
            // 图表库单独打包（按需加载）
            if (id.includes('recharts')) {
              return 'charts-vendor'
            }
            // 工具库单独打包
            if (id.includes('axios') || id.includes('date-fns') || id.includes('xlsx')) {
              return 'utils-vendor'
            }
            // 其他库
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0', // 监听所有网络接口，支持 IPv4 和 IPv6
    middlewareMode: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'lgpzubdtdxjf.sealoshzh.site',
      'wangzhan.ns-cxxiwxce',
    ],
    proxy: {
      '/api': {
        target: 'https://pkochbpmcgaa.sealoshzh.site',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

