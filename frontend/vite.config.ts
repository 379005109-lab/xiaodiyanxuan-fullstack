import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs'

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

// 自动注入预加载标签的插件
const injectPreloadPlugin: any = {
  name: 'inject-preload',
  apply: 'build',
  closeBundle() {
    const indexPath = path.resolve(__dirname, 'dist/index.html');
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf-8');
      
      // 查找构建后的关键资源文件
      const assetsDir = path.resolve(__dirname, 'dist/assets');
      const files = fs.readdirSync(assetsDir);
      
      const reactVendor = files.find(f => f.startsWith('react-vendor') && f.endsWith('.js'));
      const uiVendor = files.find(f => f.startsWith('ui-vendor') && f.endsWith('.js'));
      const mainCss = files.find(f => f.startsWith('index') && f.endsWith('.css'));
      
      // 构建预加载标签
      const preloads: string[] = [];
      if (reactVendor) preloads.push(`<link rel="preload" href="/assets/${reactVendor}" as="script" crossorigin>`);
      if (uiVendor) preloads.push(`<link rel="preload" href="/assets/${uiVendor}" as="script" crossorigin>`);
      if (mainCss) preloads.push(`<link rel="preload" href="/assets/${mainCss}" as="style">`);
      
      // 注入到 head 中
      html = html.replace('</head>', `${preloads.join('\n    ')}\n  </head>`);
      
      fs.writeFileSync(indexPath, html);
      console.log('✅ Preload tags injected successfully');
    }
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), disableTypeCheckPlugin, injectPreloadPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // 禁用自动 modulepreload，避免预加载非首屏资源
    modulePreload: {
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        // 只预加载核心 vendor，其他按需加载
        return deps.filter(dep => 
          dep.includes('react-vendor') || 
          dep.includes('index')
        )
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心 React 库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI 框架 - 不再预加载
          'ui-vendor': ['sonner', 'lucide-react'],
          // 大型库单独分包（按需加载）
          'xlsx': ['xlsx'],
          'recharts': ['recharts'],
          'html2canvas': ['html2canvas'],
          'framer-motion': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    minify: 'terser', // 使用terser进行更强的代码混淆
    terserOptions: {
      compress: {
        drop_console: true,      // 移除console.log
        drop_debugger: true,     // 移除debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        toplevel: true,          // 混淆顶级变量名
      },
      format: {
        comments: false,         // 移除所有注释
      },
    },
    sourcemap: false,            // 禁用sourcemap，防止源码泄露
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

