#!/usr/bin/env node
/**
 * 构建后自动更新 nginx.conf 中的预加载文件名
 */
const fs = require('fs');
const path = require('path');

const assetsDir = path.resolve(__dirname, '../dist/assets');
const nginxPath = path.resolve(__dirname, '../nginx.conf');

// 查找构建后的关键资源文件
const files = fs.readdirSync(assetsDir);

const reactVendor = files.find(f => f.startsWith('react-vendor') && f.endsWith('.js'));
const indexJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
const uiVendor = files.find(f => f.startsWith('ui-vendor') && f.endsWith('.js'));
const indexCss = files.find(f => f.startsWith('index') && f.endsWith('.css'));

console.log('📦 Found assets:');
console.log(`  react-vendor: ${reactVendor}`);
console.log(`  index.js: ${indexJs}`);
console.log(`  ui-vendor: ${uiVendor}`);
console.log(`  index.css: ${indexCss}`);

// 读取 nginx.conf
let nginxConf = fs.readFileSync(nginxPath, 'utf-8');

// 更新预加载文件名
nginxConf = nginxConf.replace(
  /add_header Link "<\/assets\/react-vendor-[^"]+\.js>; rel=preload; as=script; crossorigin";/,
  `add_header Link "</assets/${reactVendor}>; rel=preload; as=script; crossorigin";`
);

nginxConf = nginxConf.replace(
  /add_header Link "<\/assets\/index-[^"]+\.js>; rel=preload; as=script; crossorigin";/,
  `add_header Link "</assets/${indexJs}>; rel=preload; as=script; crossorigin";`
);

nginxConf = nginxConf.replace(
  /add_header Link "<\/assets\/ui-vendor-[^"]+\.js>; rel=preload; as=script; crossorigin";/,
  `add_header Link "</assets/${uiVendor}>; rel=preload; as=script; crossorigin";`
);

nginxConf = nginxConf.replace(
  /add_header Link "<\/assets\/index-[^"]+\.css>; rel=preload; as=style";/,
  `add_header Link "</assets/${indexCss}>; rel=preload; as=style";`
);

// 写回 nginx.conf
fs.writeFileSync(nginxPath, nginxConf);
console.log('✅ nginx.conf updated with new asset filenames');
