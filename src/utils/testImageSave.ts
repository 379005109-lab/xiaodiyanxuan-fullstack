/**
 * 图片保存测试工具
 * 用于测试和调试 SKU 图片保存功能
 */

import { imageCache } from '@/services/imageCache';

/**
 * 生成测试图片 (Base64 格式)
 */
export const generateTestImage = (size: number = 100): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 绘制随机颜色的矩形
  ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
  ctx.fillRect(0, 0, size, size);
  
  // 添加文字
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText(`Test ${Date.now()}`, 10, 30);
  
  return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * 测试图片保存
 */
export const testImageSave = () => {
  console.log('=== 开始测试图片保存 ===');
  
  const productId = 'test_product_001';
  const skuId = 'test_sku_001';
  
  // 测试 1: 保存单张图片
  console.log('\n[测试 1] 保存单张图片');
  const image1 = generateTestImage(200);
  imageCache.saveImage(productId, skuId, 0, image1);
  console.log(`✓ 图片 1 已保存, 大小: ${(image1.length / 1024).toFixed(2)}KB`);
  
  // 测试 2: 保存多张图片
  console.log('\n[测试 2] 保存多张图片');
  for (let i = 1; i < 5; i++) {
    const image = generateTestImage(200);
    imageCache.saveImage(productId, skuId, i, image);
    console.log(`✓ 图片 ${i + 1} 已保存, 大小: ${(image.length / 1024).toFixed(2)}KB`);
  }
  
  // 测试 3: 检查缓存统计
  console.log('\n[测试 3] 缓存统计');
  const stats = imageCache.getStats();
  console.log(`缓存中的图片数: ${stats.count}`);
  console.log(`缓存总大小: ${stats.sizeMB}MB / ${stats.maxSizeMB}MB`);
  
  // 测试 4: 获取已保存的图片
  console.log('\n[测试 4] 获取已保存的图片');
  const retrievedImage = imageCache.getImage(productId, skuId, 0);
  if (retrievedImage) {
    console.log(`✓ 成功获取图片 1, 大小: ${(retrievedImage.length / 1024).toFixed(2)}KB`);
  } else {
    console.log(`✗ 无法获取图片 1`);
  }
  
  // 测试 5: localStorage 大小检查
  console.log('\n[测试 5] localStorage 大小检查');
  if (typeof window !== 'undefined' && window.localStorage) {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    console.log(`localStorage 总大小: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`);
  }
  
  console.log('\n=== 测试完成 ===');
};

/**
 * 测试 localStorage 限制
 */
export const testLocalStorageLimit = () => {
  console.log('=== 测试 localStorage 限制 ===');
  
  let count = 0;
  try {
    let size = 0;
    
    while (true) {
      const testData = 'x'.repeat(1024 * 1024); // 1MB 的数据
      localStorage.setItem(`test_${count}`, testData);
      size += testData.length;
      count++;
      console.log(`✓ 已写入 ${count}MB 数据`);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.log(`✗ localStorage 已满，无法继续写入`);
      console.log(`总共写入: ${count}MB 数据`);
    } else {
      console.error('错误:', error);
    }
  }
  
  // 清理测试数据
  for (let i = 0; i < 100; i++) {
    localStorage.removeItem(`test_${i}`);
  }
  
  console.log('=== 测试完成，已清理测试数据 ===');
};

/**
 * 诊断图片保存问题
 */
export const diagnosticImageSave = () => {
  console.log('=== 诊断图片保存问题 ===\n');
  
  // 1. 检查浏览器支持
  console.log('[1] 浏览器支持检查');
  console.log(`✓ localStorage 支持: ${typeof window !== 'undefined' && !!window.localStorage}`);
  console.log(`✓ FileReader 支持: ${typeof FileReader !== 'undefined'}`);
  console.log(`✓ Canvas 支持: ${typeof HTMLCanvasElement !== 'undefined'}`);
  
  // 2. 检查 localStorage 状态
  console.log('\n[2] localStorage 状态');
  if (typeof window !== 'undefined' && window.localStorage) {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    console.log(`✓ 已使用: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`✓ 项目数: ${localStorage.length}`);
  }
  
  // 3. 检查图片缓存
  console.log('\n[3] 图片缓存状态');
  const stats = imageCache.getStats();
  console.log(`✓ 缓存图片数: ${stats.count}`);
  console.log(`✓ 缓存大小: ${stats.sizeMB}MB / ${stats.maxSizeMB}MB`);
  
  // 4. 测试保存一张小图片
  console.log('\n[4] 测试保存小图片');
  try {
    const testImage = generateTestImage(100);
    imageCache.saveImage('test', 'test', 0, testImage);
    console.log(`✓ 成功保存测试图片, 大小: ${(testImage.length / 1024).toFixed(2)}KB`);
  } catch (error) {
    console.error(`✗ 保存测试图片失败:`, error);
  }
  
  console.log('\n=== 诊断完成 ===');
};

// 导出到全局作用域以便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).testImageSave = testImageSave;
  (window as any).testLocalStorageLimit = testLocalStorageLimit;
  (window as any).diagnosticImageSave = diagnosticImageSave;
  (window as any).generateTestImage = generateTestImage;
}
