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
        manualChunks: undefined, // 暂时禁用手动分包，使用Vite默认策略
      },
    },
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild', // 改回esbuild，更稳定
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

