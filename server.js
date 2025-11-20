import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const BACKEND_URL = 'http://localhost:8080';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // 解析 URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // 处理健康检查
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  // 处理 API 请求 - 代理到后端
  if (pathname.startsWith('/api/')) {
    console.log(`[API] ${req.method} ${pathname}`);
    
    const backendUrl = new URL(BACKEND_URL + pathname + (parsedUrl.search || ''));
    
    const options = {
      hostname: backendUrl.hostname,
      port: backendUrl.port,
      path: backendUrl.pathname + backendUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        'Host': backendUrl.host
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // 添加 CORS 头
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[API Error]', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
    });

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end();
      return;
    }

    req.pipe(proxyReq);
    return;
  }

  // 处理静态文件请求
  let pathname_clean = pathname;
  if (pathname_clean.startsWith('/')) {
    pathname_clean = pathname_clean.slice(1);
  }

  // 构建文件路径
  let filePath = path.join(DIST_DIR, pathname_clean);

  // 如果是目录，尝试返回 index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // 如果文件不存在，返回 index.html（用于 SPA 路由）
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  // 读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // 获取文件扩展名
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // 设置缓存头
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // 为静态资源设置长期缓存
    if (ext === '.js' || ext === '.css' || ext === '.woff' || ext === '.woff2') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
